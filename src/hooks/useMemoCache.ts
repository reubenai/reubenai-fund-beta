import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface MemoContent {
  // VC sections
  executive_summary?: string;
  company_overview?: string;
  market_opportunity?: string;
  product_service?: string;
  business_model?: string;
  competitive_landscape?: string;
  management_team?: string;
  financial_analysis?: string;
  investment_terms?: string;
  risks_mitigants?: string;
  exit_strategy?: string;
  investment_recommendation?: string;
  
  // PE sections
  financial_performance?: string;
  market_position?: string;
  operational_excellence?: string;
  management_leadership?: string;
  growth_value_creation?: string;
  risk_assessment?: string;
  strategic_timing?: string;
  exit_value_realization?: string;
  
  // Allow any additional string keys for dynamic sections
  [key: string]: string | undefined;
}

interface CachedMemo {
  content: MemoContent;
  lastGenerated: string;
  dealLastUpdated: string;
  analysisVersion: number;
}

interface MemoState {
  isLoading: boolean;
  isGenerating: boolean;
  canCancel: boolean;
  content: MemoContent;
  existsInDb: boolean;
  needsRefresh: boolean;
  lastGenerated?: string;
  id?: string;
  status?: string;
  workflow_state?: string;
  isPublished?: boolean;
}

export function useMemoCache(dealId: string, fundId: string) {
  const [memoState, setMemoState] = useState<MemoState>({
    isLoading: false,
    isGenerating: false,
    canCancel: false,
    content: {},
    existsInDb: false,
    needsRefresh: false
  });
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const cacheRef = useRef<Map<string, CachedMemo>>(new Map());

  const getCacheKey = useCallback((dealId: string, fundId: string) => {
    return `${fundId}-${dealId}`;
  }, []);

  const checkAnalysisFreshness = useCallback(async (dealId: string): Promise<{
    needsRefresh: boolean;
    dealLastUpdated: string;
    analysisVersion: number;
  }> => {
    try {
      // Get deal's last update time and current analysis version
      const { data: deal } = await supabase
        .from('deals')
        .select('updated_at')
        .eq('id', dealId)
        .single();

      const { data: analysis } = await supabase
        .from('deal_analyses')
        .select('analysis_version, updated_at')
        .eq('deal_id', dealId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      const dealLastUpdated = deal?.updated_at || new Date().toISOString();
      const analysisVersion = analysis?.analysis_version || 1;
      
      // Check if deal was updated after last memo generation
      const cacheKey = getCacheKey(dealId, fundId);
      const cached = cacheRef.current.get(cacheKey);
      
      if (!cached) {
        return { needsRefresh: false, dealLastUpdated, analysisVersion };
      }

      const dealUpdatedTime = new Date(dealLastUpdated).getTime();
      const memoGeneratedTime = new Date(cached.lastGenerated).getTime();
      
      // Need refresh if deal was updated after memo generation
      // or if analysis version changed
      const needsRefresh = dealUpdatedTime > memoGeneratedTime || 
                          cached.analysisVersion !== analysisVersion;

      return { needsRefresh, dealLastUpdated, analysisVersion };
    } catch (error) {
      console.error('Error checking analysis freshness:', error);
      return { needsRefresh: false, dealLastUpdated: new Date().toISOString(), analysisVersion: 1 };
    }
  }, [getCacheKey, fundId]);

  const loadMemo = useCallback(async (autoGenerate = false): Promise<void> => {
    const cacheKey = getCacheKey(dealId, fundId);
    setMemoState(prev => ({ ...prev, isLoading: true, canCancel: false }));

    try {
      // Check if we should use cached content
      const cached = cacheRef.current.get(cacheKey);
      if (cached) {
        const { needsRefresh, dealLastUpdated, analysisVersion } = await checkAnalysisFreshness(dealId);
        
        setMemoState(prev => ({
          ...prev,
          content: cached.content,
          existsInDb: true,
          needsRefresh,
          lastGenerated: cached.lastGenerated,
          isLoading: false
        }));
        return;
      }

      const { data: existingMemos } = await supabase
        .from('ic_memos')
        .select('id, status, workflow_state, is_published, memo_content, updated_at')
        .eq('deal_id', dealId)
        .eq('fund_id', fundId)
        .order('updated_at', { ascending: false })
        .limit(1);

      const existingMemo = existingMemos?.[0];

      if (existingMemo?.memo_content) {
        const memoContent = existingMemo.memo_content as any;
        console.log('📄 Loading existing memo content:', { memoContent, dealId, fundId });
        
        // Extract content correctly - check for nested sections or use direct content
        const content = memoContent?.sections || memoContent;
        
        // Check if content is actually populated (not empty objects)
        const hasValidContent = content && typeof content === 'object' && 
          Object.keys(content).some(key => content[key] && typeof content[key] === 'string' && content[key].trim().length > 0);
        
        if (hasValidContent) {
          const { needsRefresh, dealLastUpdated, analysisVersion } = await checkAnalysisFreshness(dealId);
          
          // Cache the loaded memo
          cacheRef.current.set(cacheKey, {
            content,
            lastGenerated: existingMemo.updated_at,
            dealLastUpdated,
            analysisVersion
          });

          setMemoState(prev => ({
            ...prev,
            content,
            existsInDb: true,
            needsRefresh,
            lastGenerated: existingMemo.updated_at,
            id: existingMemo.id,
            status: existingMemo.status,
            workflow_state: existingMemo.workflow_state,
            isPublished: existingMemo.is_published,
            isLoading: false
          }));
          return;
        } else {
          console.log('⚠️ ic_memos content is empty, trying fallback to deal_analysisresult_vc');
        }
      }

      // Fallback: Try to load content directly from deal_analysisresult_vc if ic_memos is empty
      console.log('🔄 Attempting fallback: Reading IC content from deal_analysisresult_vc');
      const { data: analysisResult } = await supabase
        .from('deal_analysisresult_vc')
        .select(`
          ic_executive_summary,
          ic_company_overview,
          ic_market_opportunity,
          ic_product_service,
          ic_business_model,
          ic_competitive_landscape,
          ic_financial_analysis,
          ic_management_team,
          ic_risks_mitigants,
          ic_exit_strategy,
          ic_investment_terms,
          ic_investment_recommendation
        `)
        .eq('deal_id', dealId)
        .maybeSingle();

      if (analysisResult) {
        console.log('✅ Found IC content in deal_analysisresult_vc, converting to memo format');
        
        // Map IC columns to memo content format
        const fallbackContent = {
          executive_summary: analysisResult.ic_executive_summary,
          company_overview: analysisResult.ic_company_overview,
          market_opportunity: analysisResult.ic_market_opportunity,
          product_service: analysisResult.ic_product_service,
          business_model: analysisResult.ic_business_model,
          competitive_landscape: analysisResult.ic_competitive_landscape,
          financial_analysis: analysisResult.ic_financial_analysis,
          management_team: analysisResult.ic_management_team,
          risks_mitigants: analysisResult.ic_risks_mitigants,
          exit_strategy: analysisResult.ic_exit_strategy,
          investment_terms: analysisResult.ic_investment_terms,
          investment_recommendation: analysisResult.ic_investment_recommendation
        };

        // Filter out empty sections
        const validContent = {};
        Object.entries(fallbackContent).forEach(([key, value]) => {
          if (value && typeof value === 'string' && value.trim().length > 0) {
            validContent[key] = value;
          }
        });

        if (Object.keys(validContent).length > 0) {
          const { needsRefresh, dealLastUpdated, analysisVersion } = await checkAnalysisFreshness(dealId);
          
          // Cache the fallback content
          cacheRef.current.set(cacheKey, {
            content: validContent,
            lastGenerated: new Date().toISOString(),
            dealLastUpdated,
            analysisVersion
          });

          setMemoState(prev => ({
            ...prev,
            content: validContent,
            existsInDb: true, // We found content, just in a different table
            needsRefresh,
            lastGenerated: new Date().toISOString(),
            id: existingMemo?.id,
            status: existingMemo?.status || 'draft',
            workflow_state: existingMemo?.workflow_state || 'draft',
            isPublished: existingMemo?.is_published || false,
            isLoading: false
          }));
          return;
        }
      }

      // If no existing memo and auto-generate is requested
      if (autoGenerate) {
        await generateMemo();
      } else {
        // No memo exists, set state to indicate this
        console.log('❌ No IC content found in either ic_memos or deal_analysisresult_vc');
        setMemoState(prev => ({
          ...prev,
          content: {},
          existsInDb: false,
          needsRefresh: false,
          isLoading: false
        }));
      }
      
    } catch (error) {
      console.error('Error loading memo:', error);
      setMemoState(prev => ({
        ...prev,
        content: {},
        existsInDb: false,
        needsRefresh: false,
        isLoading: false
      }));
    }
  }, [dealId, fundId, getCacheKey, checkAnalysisFreshness]);

  const generateMemo = useCallback(async (): Promise<void> => {
    const cacheKey = getCacheKey(dealId, fundId);
    
    // Create abort controller for cancellation
    abortControllerRef.current = new AbortController();
    
    setMemoState(prev => ({ 
      ...prev, 
      isGenerating: true, 
      canCancel: true,
      isLoading: false 
    }));

    try {
      const { data, error } = await supabase.functions.invoke('ai-memo-generator', {
        body: { dealId, fundId }
      });

      // Check if operation was cancelled
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }

      if (error) throw error;

      if (!data?.success) {
        throw new Error(data?.error || 'Failed to generate memo');
      }

      // Extract content properly - support nested sections or flat
      const content = (data?.memo?.memo_content?.sections as any) || (data?.memo?.memo_content as any) || {};
      console.log('🔄 Generated memo content:', { 
        content, 
        contentKeys: Object.keys(content),
        hasContent: Object.keys(content).length > 0,
        dealId, 
        fundId 
      });
      
      const now = new Date().toISOString();
      const { dealLastUpdated, analysisVersion } = await checkAnalysisFreshness(dealId);
      
      // Cache the generated memo
      cacheRef.current.set(cacheKey, {
        content,
        lastGenerated: now,
        dealLastUpdated,
        analysisVersion
      });

      setMemoState(prev => ({
        ...prev,
        content,
        existsInDb: true,
        needsRefresh: false,
        lastGenerated: now,
        isGenerating: false,
        canCancel: false,
        id: data?.memo?.id,
        status: data?.memo?.status || 'draft',
        workflow_state: data?.memo?.workflow_state || 'draft',
        isPublished: !!data?.memo?.is_published,
      }));

    } catch (error) {
      if (abortControllerRef.current?.signal.aborted) {
        setMemoState(prev => ({ 
          ...prev, 
          isGenerating: false, 
          canCancel: false 
        }));
        return;
      }
      
      console.error('Error generating memo:', error);
      setMemoState(prev => ({ 
        ...prev, 
        isGenerating: false, 
        canCancel: false 
      }));
      throw error;
    }
  }, [dealId, fundId, getCacheKey, checkAnalysisFreshness]);

  const cancelGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setMemoState(prev => ({ 
        ...prev, 
        isGenerating: false, 
        canCancel: false 
      }));
    }
  }, []);

  const updateContent = useCallback((sectionKey: string, content: string) => {
    setMemoState(prev => ({
      ...prev,
      content: {
        ...prev.content,
        [sectionKey]: content
      }
    }));

    // Update cache
    const cacheKey = getCacheKey(dealId, fundId);
    const cached = cacheRef.current.get(cacheKey);
    if (cached) {
      cacheRef.current.set(cacheKey, {
        ...cached,
        content: {
          ...cached.content,
          [sectionKey]: content
        }
      });
    }
  }, [dealId, fundId, getCacheKey]);

  const clearCache = useCallback(() => {
    const cacheKey = getCacheKey(dealId, fundId);
    cacheRef.current.delete(cacheKey);
  }, [dealId, fundId, getCacheKey]);

  return {
    memoState,
    loadMemo,
    generateMemo,
    cancelGeneration,
    updateContent,
    clearCache,
    checkAnalysisFreshness
  };
}