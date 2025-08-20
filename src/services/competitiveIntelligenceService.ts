import { supabase } from '@/integrations/supabase/client';

export interface CompetitorData {
  name: string;
  website?: string;
  description: string;
  funding_stage?: string;
  valuation?: number;
  market_share?: number;
  geography: string[];
  positioning: string;
  strengths: string[];
  weaknesses: string[];
  competitor_type: 'Incumbent' | 'Challenger' | 'Emerging' | 'Whitespace';
}

export interface CompetitiveAnalysisResult {
  competitive_breakdown: {
    industry: string;
    weight: number;
    competitors: CompetitorData[];
    hhi_index: number;
    competitive_tension: 'High' | 'Medium' | 'Low';
    whitespace_opportunities: string[];
    market_fragmentation: 'Concentrated' | 'Moderate' | 'Fragmented';
    citation: any;
  }[];
  positioning_analysis: string;
  confidence: number;
  last_updated: string;
  methodology: string;
}

export class CompetitiveIntelligenceService {
  static async analyzeCompetitors(dealId: string, fundId: string): Promise<CompetitiveAnalysisResult | null> {
    try {
      console.log('🏆 Starting enhanced competitive intelligence analysis for deal:', dealId);
      
      const { data, error } = await supabase.functions.invoke('enhanced-competitive-intelligence', {
        body: {
          dealId,
          fundId,
          context: {
            requestType: 'full_analysis',
            timestamp: new Date().toISOString()
          }
        }
      });

      if (error) {
        console.error('❌ Competitive intelligence error:', error);
        return null;
      }

      console.log('✅ Competitive intelligence analysis completed');
      return data as CompetitiveAnalysisResult;
    } catch (error) {
      console.error('❌ Competitive intelligence service error:', error);
      return null;
    }
  }

  static async getStoredCompetitiveData(dealId: string): Promise<CompetitiveAnalysisResult | null> {
    try {
      const { data, error } = await supabase
        .from('deal_analysis_sources')
        .select('data_retrieved')
        .eq('deal_id', dealId)
        .eq('engine_name', 'enhanced-competitive-intelligence')
        .order('retrieved_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) {
        return null;
      }

      return data.data_retrieved as any as CompetitiveAnalysisResult;
    } catch (error) {
      console.error('❌ Error retrieving stored competitive data:', error);
      return null;
    }
  }

  static formatCompetitorDisplay(competitors: CompetitorData[]): string {
    if (!competitors || competitors.length === 0) {
      return 'No competitors identified';
    }

    return competitors
      .slice(0, 5)
      .map(comp => `${comp.name} (${comp.competitor_type})`)
      .join(', ');
  }

  static calculateMarketConcentration(competitors: CompetitorData[]): {
    hhi: number;
    concentration: 'High' | 'Medium' | 'Low';
    topPlayerShare: number;
  } {
    const totalShare = competitors.reduce((sum, comp) => sum + (comp.market_share || 0), 0);
    
    if (totalShare === 0) {
      return { hhi: 0, concentration: 'Low', topPlayerShare: 0 };
    }

    const hhi = competitors.reduce((sum, comp) => {
      const share = (comp.market_share || 0);
      return sum + (share * share);
    }, 0);

    const topPlayerShare = Math.max(...competitors.map(c => c.market_share || 0));

    let concentration: 'High' | 'Medium' | 'Low' = 'Low';
    if (hhi > 2500) concentration = 'High';
    else if (hhi > 1500) concentration = 'Medium';

    return { hhi: Math.round(hhi), concentration, topPlayerShare };
  }

  static identifyWhitespaceOpportunities(competitors: CompetitorData[], industry: string): string[] {
    const opportunities: string[] = [];

    // Analyze gaps in competitor positioning
    const geographies = competitors.flatMap(c => c.geography);
    const stages = competitors.map(c => c.funding_stage).filter(Boolean);
    const types = competitors.map(c => c.competitor_type);

    // Geographic gaps
    if (!geographies.includes('Asia') && !geographies.includes('Southeast Asia')) {
      opportunities.push('Asian market expansion opportunity');
    }

    // Stage gaps
    if (!stages.includes('Seed') && !stages.includes('Series A')) {
      opportunities.push('Early-stage innovation opportunity');
    }

    // Type gaps
    if (!types.includes('Emerging')) {
      opportunities.push('Technology disruption opportunity');
    }

    // Industry-specific opportunities
    if (industry.toLowerCase().includes('food') || industry.toLowerCase().includes('dessert')) {
      opportunities.push('Health-conscious product positioning');
      opportunities.push('Sustainable packaging innovation');
      opportunities.push('Digital-first customer experience');
    }

    return opportunities.length > 0 ? opportunities : ['Market positioning opportunities available'];
  }
}

export default CompetitiveIntelligenceService;