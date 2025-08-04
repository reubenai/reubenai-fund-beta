import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface MemoContent {
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

  const loadMemo = useCallback(async (forceRegenerate = false): Promise<void> => {
    const cacheKey = getCacheKey(dealId, fundId);
    setMemoState(prev => ({ ...prev, isLoading: true, canCancel: false }));

    try {
      // Check if we should use cached content
      if (!forceRegenerate) {
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
      }

      // Try to load from database first
      const { data: existingMemos } = await supabase
        .from('ic_memos')
        .select('memo_content, updated_at')
        .eq('deal_id', dealId)
        .eq('fund_id', fundId)
        .order('updated_at', { ascending: false })
        .limit(1);

      const existingMemo = existingMemos?.[0];

      if (existingMemo?.memo_content && !forceRegenerate) {
        const memoContent = existingMemo.memo_content as any;
        // Extract content correctly - check for nested sections or use direct content
        const content = memoContent?.sections || memoContent;
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
          isLoading: false
        }));
        return;
      }

      // If no existing memo or force regenerate, generate new one
      await generateMemo();
      
    } catch (error) {
      console.error('Error loading memo:', error);
      // Try to generate new memo on load failure
      await generateMemo();
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

      // Extract content properly - AI generator returns flat structure now
      const content = data?.memo?.memo_content || {};
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
        canCancel: false
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