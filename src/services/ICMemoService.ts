import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ICMemoGenerationStatus {
  dealId: string;
  status: 'generating' | 'completed' | 'failed';
  progress?: number;
  error?: string;
}

export interface ICMemoServiceResult {
  success: boolean;
  message: string;
  memo?: {
    sections: Array<{
      title: string;
      content: string;
      hasContent: boolean;
      quality: string;
    }>;
    metadata?: {
      completenessPercentage: number;
      completeSections: number;
      totalSections: number;
      emptySectionTitles: string[];
    };
  };
  error?: string;
}

class ICMemoService {
  private generationStatus = new Map<string, ICMemoGenerationStatus>();
  private statusCallbacks = new Map<string, ((status: ICMemoGenerationStatus) => void)[]>();

  /**
   * Trigger IC memo generation by fetching existing sections from deal_analysisresult_vc
   */
  async triggerMemoGeneration(dealId: string, fundId: string): Promise<ICMemoServiceResult> {
    console.log(`🎯 [IC Memo Service] Fetching IC memo sections for deal: ${dealId}`);
    
    try {
      // Update status to generating
      this.updateStatus(dealId, { dealId, status: 'generating', progress: 0 });

      // Show user notification
      toast.info('Loading IC Memo', {
        description: 'Validating investment committee memo data...'
      });

      // Query deal_analysisresult_vc for IC sections using maybeSingle for better error handling
      const { data: analysisResult, error } = await supabase
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

      if (error) {
        console.error(`🚨 [IC Memo Service] Database query error:`, error);
        throw error;
      }

      if (!analysisResult) {
        console.warn(`⚠️ [IC Memo Service] No IC analysis found for deal: ${dealId}`);
        throw new Error('No IC analysis found for this deal. Please run the VC scoring engine first.');
      }

      // Analyze data completeness and quality
      const sectionData = [
        { key: 'ic_executive_summary', title: 'Executive Summary', content: analysisResult.ic_executive_summary },
        { key: 'ic_company_overview', title: 'Company Overview', content: analysisResult.ic_company_overview },
        { key: 'ic_market_opportunity', title: 'Market Opportunity', content: analysisResult.ic_market_opportunity },
        { key: 'ic_product_service', title: 'Product/Service Analysis', content: analysisResult.ic_product_service },
        { key: 'ic_business_model', title: 'Business Model & Strategy', content: analysisResult.ic_business_model },
        { key: 'ic_competitive_landscape', title: 'Competitive Landscape', content: analysisResult.ic_competitive_landscape },
        { key: 'ic_financial_analysis', title: 'Financial Analysis', content: analysisResult.ic_financial_analysis },
        { key: 'ic_management_team', title: 'Management Team', content: analysisResult.ic_management_team },
        { key: 'ic_risks_mitigants', title: 'Risk Assessment & Mitigants', content: analysisResult.ic_risks_mitigants },
        { key: 'ic_exit_strategy', title: 'Exit Strategy & Value Realization', content: analysisResult.ic_exit_strategy },
        { key: 'ic_investment_terms', title: 'Investment Terms & Structure', content: analysisResult.ic_investment_terms },
        { key: 'ic_investment_recommendation', title: 'Investment Recommendation', content: analysisResult.ic_investment_recommendation }
      ];

      // Calculate completeness metrics
      const completeSections = sectionData.filter(section => 
        section.content && 
        section.content.trim().length > 0 && 
        !section.content.includes('No ') && 
        !section.content.includes('not available')
      );
      
      const emptySections = sectionData.filter(section => 
        !section.content || 
        section.content.trim().length === 0 || 
        section.content.includes('No ') || 
        section.content.includes('not available')
      );

      const completenessPercentage = Math.round((completeSections.length / sectionData.length) * 100);

      console.log(`📊 [IC Memo Service] Data quality analysis for deal ${dealId}:`, {
        totalSections: sectionData.length,
        completeSections: completeSections.length,
        emptySections: emptySections.length,
        completenessPercentage,
        completeSectionTitles: completeSections.map(s => s.title),
        emptySectionTitles: emptySections.map(s => s.title)
      });

      // Map database fields to memo sections array with quality indicators
      const sections = sectionData.map(section => ({
        title: section.title,
        content: section.content || `${section.title} analysis not yet available. Please run the VC scoring engine to generate this section.`,
        hasContent: !!section.content && section.content.trim().length > 0 && !section.content.includes('No '),
        quality: section.content && section.content.trim().length > 200 ? 'high' : 
                section.content && section.content.trim().length > 50 ? 'medium' : 'low'
      }));

      // Update status to completed
      this.updateStatus(dealId, { dealId, status: 'completed', progress: 100 });

      // Show completion notification with quality metrics
      if (completenessPercentage >= 80) {
        toast.success('IC Memo Loaded Successfully', {
          description: `Complete memo available (${completeSections.length}/${sectionData.length} sections populated)`
        });
      } else if (completenessPercentage >= 50) {
        toast.warning('IC Memo Partially Available', {
          description: `${completeSections.length}/${sectionData.length} sections available. Consider running VC analysis for missing sections.`
        });
      } else {
        toast.error('Limited IC Memo Data', {
          description: `Only ${completeSections.length}/${sectionData.length} sections available. Please run VC scoring engine first.`
        });
      }

      console.log(`✅ [IC Memo Service] Memo sections loaded for deal: ${dealId} (${completenessPercentage}% complete)`);
      
      // Return data in expected format with enhanced metadata
      return {
        success: true,
        message: `IC memo sections loaded (${completenessPercentage}% complete)`,
        memo: { 
          sections,
          metadata: {
            completenessPercentage,
            completeSections: completeSections.length,
            totalSections: sectionData.length,
            emptySectionTitles: emptySections.map(s => s.title)
          }
        }
      };
      
    } catch (error) {
      console.error(`❌ [IC Memo Service] Failed to load memo sections for deal: ${dealId}`, error);
      
      // Update status to failed
      this.updateStatus(dealId, { 
        dealId, 
        status: 'failed', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });

      // Show specific error notification
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      if (errorMessage.includes('No IC analysis found')) {
        toast.error('IC Analysis Missing', {
          description: 'No IC analysis found. Please run the VC scoring engine first to generate memo sections.',
          action: {
            label: 'Learn More',
            onClick: () => console.log('Should show help about VC scoring engine')
          }
        });
      } else {
        toast.error('IC Memo Load Failed', {
          description: `Failed to load memo: ${errorMessage}`,
          action: {
            label: 'Retry',
            onClick: () => this.triggerMemoGeneration(dealId, fundId)
          }
        });
      }

      return {
        success: false,
        message: errorMessage,
        error: errorMessage
      };
    }
  }

  /**
   * Get all IC sessions for a fund - simplified version
   */
  async getSessions(fundId: string) {
    try {
      const { data, error } = await supabase
        .from('ic_sessions')
        .select('*')
        .eq('fund_id', fundId)
        .order('session_date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching IC sessions:', error);
      return [];
    }
  }

  /**
   * Get all voting decisions for a fund - simplified version
   */
  async getVotingDecisions(fundId: string): Promise<any[]> {
    // Simplified to avoid TypeScript recursion issues
    console.log('getVotingDecisions called for fund:', fundId);
    return [];
  }

  /**
   * Create a new IC session - simplified version
   */
  async createSession(sessionData: any) {
    try {
      const { data, error } = await supabase
        .from('ic_sessions')
        .insert(sessionData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating IC session:', error);
      return null;
    }
  }

  /**
   * Create a new voting decision - simplified version
   */
  async createVotingDecision(votingData: any) {
    try {
      const { data, error } = await supabase
        .from('ic_memo_votes')
        .insert(votingData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating voting decision:', error);
      return null;
    }
  }

  /**
   * Generate memo for a deal - returns expected structure for compatibility
   */
  async generateMemo(dealId: string) {
    console.log(`📝 [Legacy] generateMemo called for deal: ${dealId}`);
    
    // Return expected structure for backward compatibility
    return {
      success: false,
      message: 'Memo generation is now triggered automatically when deals move to Investment Committee stage',
      memo: null,
      error: 'Auto-generation disabled - move deal to Investment Committee stage instead'
    };
  }

  /**
   * Check if a memo already exists for this deal
   */
  async hasMemo(dealId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('ic_memos')
        .select('id')
        .eq('deal_id', dealId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking memo existence:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('Error checking memo existence:', error);
      return false;
    }
  }

  /**
   * Get memo generation status for a deal
   */
  getGenerationStatus(dealId: string): ICMemoGenerationStatus | null {
    return this.generationStatus.get(dealId) || null;
  }

  /**
   * Subscribe to memo generation status updates
   */
  onStatusChange(dealId: string, callback: (status: ICMemoGenerationStatus) => void) {
    if (!this.statusCallbacks.has(dealId)) {
      this.statusCallbacks.set(dealId, []);
    }
    this.statusCallbacks.get(dealId)!.push(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.statusCallbacks.get(dealId);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  private updateStatus(dealId: string, status: ICMemoGenerationStatus) {
    this.generationStatus.set(dealId, status);
    
    // Notify subscribers
    const callbacks = this.statusCallbacks.get(dealId) || [];
    callbacks.forEach(callback => callback(status));
  }

  /**
   * Clear generation status for a deal
   */
  clearStatus(dealId: string) {
    this.generationStatus.delete(dealId);
    this.statusCallbacks.delete(dealId);
  }
}

export const icMemoService = new ICMemoService();