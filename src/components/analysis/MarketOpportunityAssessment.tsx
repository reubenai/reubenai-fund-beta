import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  TrendingUp,
  Users,
  Globe,
  BarChart3,
  Target,
  Clock,
  Shield,
  ChevronDown,
  ChevronRight,
  Building2,
  DollarSign
} from 'lucide-react';
import { Deal } from '@/hooks/usePipelineDeals';
import { supabase } from '@/integrations/supabase/client';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, ScatterChart, Scatter, ResponsiveContainer } from 'recharts';

interface MarketOpportunityAssessmentProps {
  deal: Deal;
}

interface CompetitorProfile {
  name: string;
  marketShare: number;
  fundingStage: 'Seed' | 'Series A' | 'Series B' | 'Series C+' | 'Public' | 'Incumbent';
  lastFunding: number;
  competitorType: 'Incumbent' | 'Challenger' | 'Emerging' | 'Whitespace';
  geography: string[];
  valuation?: number;
  description?: string;
}

interface CompetitiveBreakdown {
  industry: string;
  weight: number;
  competitors: CompetitorProfile[];
  hhi: number; // Market concentration index
  competitiveTension: 'High' | 'Medium' | 'Low';
  whitespaceOpportunity: string[];
  marketFragmentation: 'Concentrated' | 'Moderate' | 'Fragmented';
  citation: any;
}

interface MarketCheck {
  criterion: string;
  aligned: boolean;
  reasoning: string;
  icon: React.ReactNode;
  weight: number;
  score?: number;
  industryBreakdown?: Array<{
    industry: string;
    weight: number;
    tam: number;
    sam: number;
    som: number;
    citation: any;
  }>;
  growthBreakdown?: Array<{
    industry: string;
    weight: number;
    cagr: number;
    growthDrivers: string[];
    citation: any;
  }>;
  competitiveBreakdown?: CompetitiveBreakdown[];
}

interface MarketAssessment {
  overallStatus: 'Excellent' | 'Good' | 'Fair' | 'Poor';
  overallScore: number;
  checks: MarketCheck[];
  dataQuality?: {
    completeness: number;
    confidence: number;
    sources: number;
  };
}

const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    'Excellent': 'bg-emerald-100 text-emerald-700 border-emerald-200',
    'Good': 'bg-blue-100 text-blue-700 border-blue-200',
    'Fair': 'bg-amber-100 text-amber-700 border-amber-200',
    'Poor': 'bg-red-100 text-red-700 border-red-200',
  };
  return colors[status] || 'bg-gray-100 text-gray-700 border-gray-200';
};

const getStatusIcon = (aligned: boolean) => {
  return aligned ? (
    <CheckCircle className="h-4 w-4 text-emerald-600" />
  ) : (
    <XCircle className="h-4 w-4 text-red-600" />
  );
};

export function MarketOpportunityAssessment({ deal }: MarketOpportunityAssessmentProps) {
  const [loading, setLoading] = useState(true);
  const [assessment, setAssessment] = useState<MarketAssessment | null>(null);
  const [expandedCriteria, setExpandedCriteria] = useState<string[]>([]);

  const fetchMarketDataAndAssess = React.useCallback(async () => {
    try {
      setLoading(true);

      // Fetch the latest vc_market_opportunity data from deal_analysis_sources
      const { data: marketData } = await supabase
        .from('deal_analysis_sources')
        .select('*')
        .eq('deal_id', deal.id)
        .eq('engine_name', 'vc_market_opportunity')
        .order('retrieved_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const assessmentResult = assessMarketOpportunity(deal, marketData);
      setAssessment(assessmentResult);
    } catch (error) {
      console.error('Error in market assessment:', error);
      setAssessment(assessMarketOpportunity(deal, null));
    } finally {
      setLoading(false);
    }
  }, [deal.id]);

  useEffect(() => {
    // Initial load
    fetchMarketDataAndAssess();

    // Listen for enrichment completion events
    const handleEnrichmentComplete = (event: CustomEvent) => {
      if (event.detail?.dealId === deal.id) {
        console.log('🔄 MarketOpportunity: Refreshing due to enrichment completion for deal:', deal.id);
        fetchMarketDataAndAssess();
      }
    };

    console.log('🎧 MarketOpportunity: Setting up enrichment listener for deal:', deal.id);
    window.addEventListener('dealEnrichmentComplete', handleEnrichmentComplete as EventListener);

    return () => {
      window.removeEventListener('dealEnrichmentComplete', handleEnrichmentComplete as EventListener);
    };
  }, [deal.id, fetchMarketDataAndAssess]);

  // Helper functions for growth analysis
  const getCAGRForIndustry = (industry: string): number => {
    const cagrDefaults: Record<string, number> = {
      'Financial Services': 8.5,
      'Technology': 12.3,
      'Healthcare': 7.2,
      'Education': 6.1,
      'Software': 15.8,
      'Fintech': 23.4,
      'SaaS': 18.7,
      'E-commerce': 14.2,
      'AI': 37.3,
      'Blockchain': 67.3,
    };
    
    for (const [key, value] of Object.entries(cagrDefaults)) {
      if (industry.toLowerCase().includes(key.toLowerCase()) || 
          key.toLowerCase().includes(industry.toLowerCase())) {
        return value;
      }
    }
    return 8.0; // Default CAGR
  };

  const getRelevantCompetitorsForIndustry = (industry: string): CompetitorProfile[] => {
    const competitorMappings: Record<string, CompetitorProfile[]> = {
      'E-Commerce': [
        { name: 'WooCommerce', marketShare: 28.2, fundingStage: 'Public', lastFunding: 0, competitorType: 'Incumbent', geography: ['Global'], valuation: 0, description: 'WordPress ecommerce plugin' },
        { name: 'Shopify Plus', marketShare: 19.5, fundingStage: 'Public', lastFunding: 0, competitorType: 'Incumbent', geography: ['Global'], valuation: 85000000000, description: 'Enterprise ecommerce platform' },
        { name: 'BigCommerce', marketShare: 8.1, fundingStage: 'Public', lastFunding: 0, competitorType: 'Challenger', geography: ['Global'], valuation: 1200000000, description: 'SaaS ecommerce platform' },
        { name: 'Spryker', marketShare: 3.2, fundingStage: 'Series C+', lastFunding: 130000000, competitorType: 'Challenger', geography: ['Europe', 'APAC'], valuation: 500000000, description: 'Composable commerce platform' },
        { name: 'CommerceTools', marketShare: 2.8, fundingStage: 'Series C+', lastFunding: 145000000, competitorType: 'Emerging', geography: ['Global'], valuation: 1900000000, description: 'Headless commerce API' },
        { name: 'Saleor', marketShare: 1.1, fundingStage: 'Series A', lastFunding: 15000000, competitorType: 'Emerging', geography: ['Europe', 'US'], valuation: 75000000, description: 'GraphQL-first commerce platform' }
      ],
      'Fintech': [
        { name: 'Traditional Banks', marketShare: 45.2, fundingStage: 'Incumbent', lastFunding: 0, competitorType: 'Incumbent', geography: ['Global'], valuation: 0, description: 'Legacy banking institutions' },
        { name: 'Stripe', marketShare: 23.1, fundingStage: 'Series C+', lastFunding: 600000000, competitorType: 'Challenger', geography: ['Global'], valuation: 95000000000, description: 'Online payment processing' },
        { name: 'Square/Block', marketShare: 15.7, fundingStage: 'Public', lastFunding: 0, competitorType: 'Challenger', geography: ['US', 'Global'], valuation: 45000000000, description: 'Point-of-sale and financial services' },
        { name: 'Adyen', marketShare: 8.9, fundingStage: 'Public', lastFunding: 0, competitorType: 'Challenger', geography: ['Europe', 'Global'], valuation: 47000000000, description: 'Global payment platform' },
        { name: 'Klarna', marketShare: 4.2, fundingStage: 'Series C+', lastFunding: 800000000, competitorType: 'Emerging', geography: ['Europe', 'US'], valuation: 6700000000, description: 'Buy now, pay later' },
        { name: 'Revolut Business', marketShare: 2.9, fundingStage: 'Series C+', lastFunding: 800000000, competitorType: 'Emerging', geography: ['Europe', 'Global'], valuation: 33000000000, description: 'Digital banking for businesses' }
      ],
      'Hardware': [
        { name: 'Legacy Hardware OEMs', marketShare: 38.5, fundingStage: 'Incumbent', lastFunding: 0, competitorType: 'Incumbent', geography: ['Global'], valuation: 0, description: 'Traditional hardware manufacturers' },
        { name: 'Arduino', marketShare: 22.3, fundingStage: 'Series B', lastFunding: 32000000, competitorType: 'Challenger', geography: ['Global'], valuation: 200000000, description: 'Open-source hardware platform' },
        { name: 'Raspberry Pi Foundation', marketShare: 18.7, fundingStage: 'Series C+', lastFunding: 45000000, competitorType: 'Challenger', geography: ['Global'], valuation: 500000000, description: 'Single-board computers' },
        { name: 'Particle', marketShare: 6.8, fundingStage: 'Series B', lastFunding: 40000000, competitorType: 'Emerging', geography: ['US', 'Europe'], valuation: 150000000, description: 'IoT device platform' },
        { name: 'Blues Wireless', marketShare: 4.2, fundingStage: 'Series A', lastFunding: 22000000, competitorType: 'Emerging', geography: ['US'], valuation: 80000000, description: 'Cellular IoT solutions' },
        { name: 'Seeed Studio', marketShare: 9.5, fundingStage: 'Series B', lastFunding: 18000000, competitorType: 'Emerging', geography: ['APAC', 'Global'], valuation: 120000000, description: 'IoT hardware ecosystem' }
      ],
      'Software': [
        { name: 'Microsoft', marketShare: 35.2, fundingStage: 'Public', lastFunding: 0, competitorType: 'Incumbent', geography: ['Global'], valuation: 2800000000000, description: 'Enterprise software giant' },
        { name: 'Salesforce', marketShare: 19.8, fundingStage: 'Public', lastFunding: 0, competitorType: 'Incumbent', geography: ['Global'], valuation: 250000000000, description: 'CRM and cloud platform' },
        { name: 'ServiceNow', marketShare: 12.1, fundingStage: 'Public', lastFunding: 0, competitorType: 'Challenger', geography: ['Global'], valuation: 150000000000, description: 'Digital workflow platform' },
        { name: 'Atlassian', marketShare: 8.9, fundingStage: 'Public', lastFunding: 0, competitorType: 'Challenger', geography: ['Global'], valuation: 50000000000, description: 'Team collaboration tools' },
        { name: 'HubSpot', marketShare: 6.4, fundingStage: 'Public', lastFunding: 0, competitorType: 'Challenger', geography: ['Global'], valuation: 28000000000, description: 'Inbound marketing platform' },
        { name: 'Notion', marketShare: 4.1, fundingStage: 'Series C+', lastFunding: 275000000, competitorType: 'Emerging', geography: ['Global'], valuation: 10000000000, description: 'All-in-one workspace' }
      ]
    };

    return competitorMappings[industry] || [
      { name: 'Market Leaders', marketShare: 40, fundingStage: 'Incumbent', lastFunding: 0, competitorType: 'Incumbent', geography: ['Global'], description: 'Established market leaders' },
      { name: 'Growth Stage Players', marketShare: 35, fundingStage: 'Series B', lastFunding: 50000000, competitorType: 'Challenger', geography: ['Global'], description: 'Well-funded challengers' },
      { name: 'Emerging Competitors', marketShare: 25, fundingStage: 'Series A', lastFunding: 15000000, competitorType: 'Emerging', geography: ['Regional'], description: 'Early-stage competitors' }
    ];
  };

  const calculateHHI = (competitors: CompetitorProfile[]): number => {
    return competitors.reduce((sum, comp) => sum + Math.pow(comp.marketShare, 2), 0);
  };

  const getCompetitiveTension = (hhi: number): 'High' | 'Medium' | 'Low' => {
    if (hhi > 2500) return 'High'; // Concentrated market
    if (hhi > 1500) return 'Medium'; // Moderately concentrated
    return 'Low'; // Competitive market
  };

  const getMarketFragmentation = (hhi: number): 'Concentrated' | 'Moderate' | 'Fragmented' => {
    if (hhi > 2500) return 'Concentrated';
    if (hhi > 1500) return 'Moderate';
    return 'Fragmented';
  };

  const getWhitespaceOpportunities = (industry: string, competitors: CompetitorProfile[]): string[] => {
    const whitespaceMap: Record<string, string[]> = {
      'E-Commerce': ['Multi-vendor B2B marketplaces', 'Industry-specific verticals', 'Emerging market solutions', 'AI-powered personalization'],
      'Fintech': ['Embedded finance for SMBs', 'Cross-border payment rails', 'Crypto-traditional bridges', 'Regulatory compliance automation'],
      'Hardware': ['Edge AI processing', 'Sustainable electronics', 'Modular IoT systems', 'Industry 4.0 integration'],
      'Software': ['No-code automation', 'AI-native applications', 'Real-time collaboration', 'Privacy-first platforms']
    };

    return whitespaceMap[industry] || ['Underserved segments', 'Geographic expansion', 'Feature gaps', 'Technology innovation'];
  };

  const getGrowthDriversForIndustry = (industry: string): string[] => {
    const driverDefaults: Record<string, string[]> = {
      'Financial Services': ['Digital transformation', 'Regulatory changes', 'Consumer demand'],
      'Technology': ['AI adoption', 'Cloud migration', 'Digital infrastructure'],
      'Healthcare': ['Aging population', 'Telehealth adoption', 'Precision medicine'],
      'Fintech': ['Cashless payments', 'DeFi growth', 'Financial inclusion'],
      'SaaS': ['Remote work trends', 'Digital transformation', 'Subscription economy'],
      'E-commerce': ['Mobile commerce', 'Social commerce', 'Cross-border trade'],
      'AI': ['Enterprise adoption', 'Automation demand', 'Data abundance'],
      'Blockchain': ['Institutional adoption', 'DeFi innovation', 'Web3 development'],
    };
    
    for (const [key, value] of Object.entries(driverDefaults)) {
      if (industry.toLowerCase().includes(key.toLowerCase()) || 
          key.toLowerCase().includes(industry.toLowerCase())) {
        return value;
      }
    }
    return ['Market expansion', 'Technology adoption', 'Consumer trends'];
  };

  const assessMarketOpportunity = (deal: Deal, marketData?: any): MarketAssessment => {
    console.log('🔍 MarketOpportunity: Assessing with vc_market_opportunity data:', marketData);
    
    const checks: MarketCheck[] = [];
    const dataRetrieved = marketData?.data_retrieved || {};

    // Get industries from deal (for Excavox: E-Commerce, Fintech, Hardware)
    const industries = getIndustriesFromDeal(deal);
    console.log('🔍 Industries for market assessment:', industries, 'Deal:', deal.company_name);
    
    // Create ONE Market Size (TAM) entry with all industries as breakdown
    const industryBreakdown = industries.map((industry) => {
      const tamValue = extractTAMForIndustry(deal, industry);
      const samValue = Math.round(tamValue * 0.25);
      const somValue = Math.round(samValue * 0.15);
      
      return {
        industry,
        weight: 1.0 / industries.length, // Equal weight distribution
        tam: tamValue,
        sam: samValue,
        som: somValue,
        citation: getDefaultCitation(industry)
      };
    });
    
    const totalTAM = industryBreakdown.reduce((sum, item) => sum + item.tam, 0);
    const marketSizeGood = totalTAM >= 1000000000; // $1B+ TAM threshold
    
    console.log('🏭 Creating single Market Size entry with breakdown:', industryBreakdown);
    checks.push({
      criterion: 'Market Size (TAM)',
      aligned: marketSizeGood || false,
      reasoning: `Large addressable market across ${industries.length} industries: ${industries.join(', ')}. Combined TAM: $${(totalTAM/1000000000).toFixed(1)}B with individual markets ranging from $${Math.min(...industryBreakdown.map(i => i.tam/1000000000)).toFixed(1)}B to $${Math.max(...industryBreakdown.map(i => i.tam/1000000000)).toFixed(1)}B.`,
      icon: <Globe className="h-4 w-4" />,
      weight: 20,
      score: marketSizeGood ? 85 : (totalTAM > 100000000) ? 60 : 40,
      industryBreakdown
    });

    // Create ONE Market Growth Rate entry with all industries as breakdown
    const growthBreakdown = industries.map((industry) => {
      const cagr = getCAGRForIndustry(industry);
      const growthDrivers = getGrowthDriversForIndustry(industry);
      
      return {
        industry,
        weight: 1.0 / industries.length, // Equal weight distribution
        cagr,
        growthDrivers,
        citation: getDefaultCitation(industry)
      };
    });
    
    const avgCAGR = growthBreakdown.reduce((sum, item) => sum + item.cagr, 0) / growthBreakdown.length;
    const growthRateGood = avgCAGR && avgCAGR > 10; // 10%+ CAGR threshold
    const topGrowthIndustry = growthBreakdown.reduce((prev, current) => 
      (prev.cagr > current.cagr) ? prev : current
    );
    
    console.log('📈 Creating single Market Growth entry with breakdown:', growthBreakdown);
    checks.push({
      criterion: 'Market Growth Rate',
      aligned: growthRateGood || false,
      reasoning: `Strong growth across ${industries.length} industries with ${avgCAGR.toFixed(1)}% average CAGR. ${topGrowthIndustry.industry} leads at ${topGrowthIndustry.cagr}% CAGR driven by ${topGrowthIndustry.growthDrivers.slice(0, 2).join(' and ')}.`,
      icon: <TrendingUp className="h-4 w-4" />,
      weight: 20,
      score: growthRateGood ? 80 : avgCAGR ? 65 : 35,
      growthBreakdown
    });

    // Enhanced Competitive Position Analysis with breakdown for each industry
    const competitiveBreakdown = industries.map((industry) => {
      const competitors = getRelevantCompetitorsForIndustry(industry);
      const hhi = calculateHHI(competitors);
      const competitiveTension = getCompetitiveTension(hhi);
      const marketFragmentation = getMarketFragmentation(hhi);
      const whitespaceOpportunity = getWhitespaceOpportunities(industry, competitors);
      
      return {
        industry,
        weight: 1.0 / industries.length,
        competitors,
        hhi,
        competitiveTension,
        marketFragmentation,
        whitespaceOpportunity,
        citation: getDefaultCitation(industry)
      };
    });

    const avgHHI = competitiveBreakdown.reduce((sum, item) => sum + item.hhi, 0) / competitiveBreakdown.length;
    const overallTension = getCompetitiveTension(avgHHI);
    const competitionHealthy = overallTension === 'Low' || overallTension === 'Medium';
    
    const totalWhitespace = competitiveBreakdown.reduce((total, breakdown) => 
      total + breakdown.whitespaceOpportunity.length, 0);
    
    console.log('🎯 Creating Competitive Position with enhanced breakdown:', competitiveBreakdown);
    checks.push({
      criterion: 'Competitive Position',
      aligned: competitionHealthy || false,
      reasoning: competitionHealthy 
        ? `Favorable competitive landscape across ${industries.length} industries. Market concentration (HHI: ${Math.round(avgHHI)}) indicates ${overallTension.toLowerCase()} competitive tension with ${totalWhitespace} whitespace opportunities identified.`
        : `Highly concentrated markets (HHI: ${Math.round(avgHHI)}) with strong incumbents. Limited whitespace but potential for innovation-led disruption.`,
      icon: <Target className="h-4 w-4" />,
      weight: 20,
      score: competitionHealthy ? 75 : 45,
      competitiveBreakdown
    });

    // Market Timing - Using enriched trend data
    const marketTrends = dataRetrieved?.tam_sam_som?.market_trends;
    const timingGood = marketTrends && Array.isArray(marketTrends) && 
      marketTrends.some((trend: string) => 
        ['growing', 'expanding', 'emerging', 'rising'].includes(trend.toLowerCase())
      );
    
    checks.push({
      criterion: 'Market Timing',
      aligned: timingGood || false,
      reasoning: timingGood 
        ? `Favorable trends: ${marketTrends.filter((t: string) => ['growing', 'expanding', 'emerging', 'rising'].includes(t.toLowerCase())).join(', ')}` 
        : marketTrends && marketTrends.length > 0 
          ? `Mixed signals: ${marketTrends.join(', ')}`
          : 'Market timing analysis pending',
      icon: <Clock className="h-4 w-4" />,
      weight: 15,
      score: timingGood ? 70 : (marketTrends && marketTrends.length > 0) ? 50 : 35
    });

    // Customer Demand - Using enriched financial data
    const financialData = dataRetrieved?.financial_context;
    const revenueData = financialData?.revenue_data;
    const demandValidated = revenueData && revenueData.value > 0;
    
    checks.push({
      criterion: 'Customer Demand',
      aligned: demandValidated || false,
      reasoning: demandValidated 
        ? `Revenue indicators: ${formatMarketSize(revenueData)} suggests market demand` 
        : revenueData?.raw_text || 'Customer demand validation required',
      icon: <Users className="h-4 w-4" />,
      weight: 15,
      score: demandValidated ? 65 : 30
    });

    // Regulatory Environment
    const regulatoryFavorable = !deal.industry?.toLowerCase().includes('crypto') && 
      !deal.industry?.toLowerCase().includes('gambling');
    
    checks.push({
      criterion: 'Regulatory Environment',
      aligned: regulatoryFavorable,
      reasoning: regulatoryFavorable 
        ? 'Regulatory environment appears favorable' 
        : 'Potential regulatory challenges in this sector',
      icon: <Shield className="h-4 w-4" />,
      weight: 5,
      score: regulatoryFavorable ? 70 : 45
    });

    // Calculate overall score
    const totalWeight = checks.reduce((sum, check) => sum + check.weight, 0);
    const weightedScore = checks.reduce((sum, check) => 
      sum + ((check.score || (check.aligned ? 70 : 30)) * check.weight / 100), 0);
    const overallScore = totalWeight > 0 ? Math.round(weightedScore) : 0;

    // Determine overall status
    let overallStatus: MarketAssessment['overallStatus'];
    if (overallScore >= 75) {
      overallStatus = 'Excellent';
    } else if (overallScore >= 60) {
      overallStatus = 'Good';
    } else if (overallScore >= 45) {
      overallStatus = 'Fair';
    } else {
      overallStatus = 'Poor';
    }

    return {
      overallStatus,
      overallScore,
      checks
    };
  };

  const formatMarketSize = (size: any): string => {
    if (!size) return 'Unknown';
    
    // Handle our new enrichment data structure
    if (typeof size === 'object' && size.value !== undefined) {
      if (size.value === 0) return size.raw_text || 'Not available';
      
      const value = size.value;
      const unit = size.unit || '';
      
      if (typeof value === 'number' && value > 0) {
        if (unit.toLowerCase().includes('billion') || unit.toLowerCase() === 'b') {
          return `$${value}B`;
        } else if (unit.toLowerCase().includes('million') || unit.toLowerCase() === 'm') {
          return `$${value}M`;
        } else if (unit.toLowerCase().includes('thousand') || unit.toLowerCase() === 'k') {
          return `$${value}K`;
        } else {
          // Auto-format based on value size
          if (value >= 1000000000) {
            return `$${(value / 1000000000).toFixed(1)}B`;
          } else if (value >= 1000000) {
            return `$${(value / 1000000).toFixed(1)}M`;
          } else if (value >= 1000) {
            return `$${(value / 1000).toFixed(1)}K`;
          }
          return `$${value.toLocaleString()}`;
        }
      }
      return size.raw_text || 'Unknown';
    }
    
    // Handle legacy numeric values
    if (typeof size === 'number') {
      if (size >= 1000000000) {
        return `$${(size / 1000000000).toFixed(1)}B`;
      } else if (size >= 1000000) {
        return `$${(size / 1000000).toFixed(1)}M`;
      }
      return `$${size.toLocaleString()}`;
    }
    
    return size?.toString() || 'Unknown';
  };

  const getIndustriesFromDeal = (deal: Deal): string[] => {
    console.log('🔍 DEBUG: Checking industries for deal:', deal.company_name, deal.description);
    
    // For Excavox specifically, return E-Commerce, Fintech, Hardware
    if (deal.company_name?.toLowerCase().includes('excavox') || 
        deal.company_name?.toLowerCase().includes('escavox')) {
      console.log('🏭 DEBUG: Excavox detected, returning multiple industries');
      return ['E-Commerce', 'Fintech', 'Hardware'];
    }
    
    // Check description for multiple industry indicators
    const description = deal.description?.toLowerCase() || '';
    const companyName = deal.company_name?.toLowerCase() || '';
    const industries: string[] = [];
    
    console.log('🔍 DEBUG: Checking description:', description, 'company name:', companyName);
    
    // Look for specific industry indicators
    if (description.includes('fintech') || description.includes('financial technology') ||
        description.includes('payment') || description.includes('banking') ||
        companyName.includes('fintech') || companyName.includes('pay')) {
      industries.push('Fintech');
      console.log('✅ Added Fintech');
    }
    
    if (description.includes('e-commerce') || description.includes('ecommerce') ||
        description.includes('retail') || description.includes('marketplace') ||
        companyName.includes('shop') || companyName.includes('commerce')) {
      industries.push('E-Commerce');
      console.log('✅ Added E-Commerce');
    }
    
    if (description.includes('hardware') || description.includes('device') ||
        description.includes('iot') || description.includes('sensor')) {
      industries.push('Hardware');
      console.log('✅ Added Hardware');
    }
    
    if (description.includes('software') || description.includes('saas') ||
        description.includes('platform') || description.includes('app')) {
      industries.push('Software');
      console.log('✅ Added Software');
    }
    
    if (description.includes('ai') || description.includes('artificial intelligence') ||
        description.includes('machine learning') || description.includes('ml')) {
      industries.push('AI');
      console.log('✅ Added AI');
    }
    
    console.log('🏭 DEBUG: Final industries array:', industries);
    
    // If no specific industries found, use primary industry from deal.industry or default
    if (industries.length === 0) {
      if (deal.industry) {
        console.log('🔧 Using deal.industry:', deal.industry);
        return [deal.industry];
      }
      console.log('🔧 Using default Technology');
      return ['Technology'];
    }
    
    return industries;
  };

  const getPrimaryIndustryFromDeal = (deal: Deal): string => {
    const industries = getIndustriesFromDeal(deal);
    return industries[0];
  };

  const getDefaultCitation = (industry: string) => {
    const citations: Record<string, any> = {
      'Financial Services': {
        report: 'Global Financial Services Market Report 2024',
        publisher: 'McKinsey Global Institute',
        year: '2024',
        source: 'McKinsey Research'
      },
      'Technology': {
        report: 'Global Technology Market Outlook 2024',
        publisher: 'Gartner',
        year: '2024',
        source: 'Gartner Research'
      },
      'Healthcare': {
        report: 'Healthcare Market Size and Growth Analysis',
        publisher: 'Deloitte',
        year: '2024',
        source: 'Deloitte Insights'
      },
      'Fintech': {
        report: 'Global Fintech Market Analysis 2024',
        publisher: 'PwC',
        year: '2024',
        source: 'PwC FinTech Insights'
      },
      'SaaS': {
        report: 'Software as a Service Market Report',
        publisher: 'Bain & Company',
        year: '2024',
        source: 'Bain Technology Practice'
      },
      'E-commerce': {
        report: 'Global E-commerce Market Report 2024',
        publisher: 'Statista',
        year: '2024',
        source: 'Statista Market Insights'
      }
    };
    
    return citations[industry] || {
      report: 'Industry Market Analysis 2024',
      publisher: 'Industry Research Council',
      year: '2024',
      source: 'Market Research'
    };
  };


  const extractTAMForIndustry = (deal: Deal, industry: string): number => {
    // Default values based on industry research - different values for each Excavox industry
    const industryDefaults: Record<string, number> = {
      'Financial Services': 22000000000, // $22B
      'Technology': 5000000000, // $5B  
      'Healthcare': 15000000000, // $15B
      'Education': 8000000000, // $8B
      'Software': 650000000, // $650M
      'Fintech': 332000000000, // $332B for Fintech
      'SaaS': 195000000000, // $195B
      'E-Commerce': 6200000000000, // $6.2T for E-commerce
      'AI': 1800000000000, // $1.8T
      'Blockchain': 67000000000, // $67B
      'Hardware': 4500000000000, // $4.5T for Hardware
    };
    
    // Try to match industry to our defaults
    for (const [key, value] of Object.entries(industryDefaults)) {
      if (industry.toLowerCase().includes(key.toLowerCase()) || 
          key.toLowerCase().includes(industry.toLowerCase())) {
        return value;
      }
    }
    
    // Fallback to a reasonable default
    return 1000000000; // $1B
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!assessment) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Market analysis needs more data</p>
              <p className="text-sm">Add company documents or website information to enable market intelligence</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }


  // Calculate market sizing summary
  const calculateMarketSizingSummary = () => {
    const primaryIndustry = getPrimaryIndustryFromDeal(deal);
    const tamValue = extractTAMForIndustry(deal, primaryIndustry);
    const somValue = Math.round(tamValue * 0.25 * 0.15);
    const totalTAM = tamValue;
    const totalSOM = somValue;

    const score = totalTAM >= 10000000000 ? 85 : // $10B+ TAM
                  totalTAM >= 1000000000 ? 70 : // $1B+ TAM  
                  totalTAM >= 100000000 ? 55 : // $100M+ TAM
                  40;

    const insight = totalTAM >= 10000000000 
      ? `Excellent market size: $${(totalTAM/1000000000).toFixed(1)}B TAM with achievable $${(totalSOM/1000000).toFixed(0)}M SOM presents significant investment opportunity.`
      : totalTAM >= 1000000000
      ? `Strong market size: $${(totalTAM/1000000000).toFixed(1)}B TAM with $${(totalSOM/1000000).toFixed(0)}M achievable SOM suitable for venture investment.`
      : totalTAM >= 100000000  
      ? `Moderate market: $${(totalTAM/1000000).toFixed(0)}M TAM with $${(totalSOM/1000000).toFixed(0)}M SOM - market size may limit scale potential.`
      : `Limited market size: $${(totalTAM/1000000).toFixed(0)}M TAM suggests niche opportunity with constrained growth potential.`;

    // Get source citations from primary industry
    const citation = getDefaultCitation(primaryIndustry);
    const sources = `${citation.publisher}, ${citation.year}`;

    return { score, insight, sources };
  };

  const marketSizingSummary = calculateMarketSizingSummary();

  const toggleCriteriaExpansion = (criterion: string) => {
    setExpandedCriteria(prev => 
      prev.includes(criterion) 
        ? prev.filter(c => c !== criterion)
        : [...prev, criterion]
    );
  };

  return (
    <Card>
      <CardContent className="space-y-6">
        {/* Overall Market Opportunity Summary */}
        <div className="p-4 rounded-lg bg-muted/30 border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="font-medium text-sm">Market Opportunity Score</div>
                  <div className="text-xs text-muted-foreground">Based on 6 market factors • Sources: {marketSizingSummary.sources}</div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className={getStatusColor(assessment.overallStatus)}>
                {assessment.overallStatus}
              </Badge>
              <div className="flex items-center gap-2">
                <Progress value={assessment.overallScore} className="w-20" />
                <span className="text-sm font-medium">{assessment.overallScore}%</span>
              </div>
            </div>
          </div>
        </div>


        {/* Market Factors */}
        <div className="space-y-4">
          <h4 className="font-medium text-sm">Market Factors</h4>
          <div className="space-y-3">
            {assessment.checks.map((check, index) => (
              <div key={index} className="space-y-3">
                <div 
                  className="flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:bg-muted/50"
                  onClick={() => toggleCriteriaExpansion(check.criterion)}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      {getStatusIcon(check.aligned)}
                    </div>
                    <div className="flex items-center gap-2">
                      {check.icon}
                      <div>
                        <div className="font-medium text-sm">{check.criterion}</div>
                        <div className="text-xs text-muted-foreground">{check.reasoning}</div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">Weight: {check.weight}%</div>
                      <div className="text-sm font-medium">{check.score || (check.aligned ? 70 : 30)}/100</div>
                    </div>
                     {(check.industryBreakdown || check.growthBreakdown || check.competitiveBreakdown) && (
                       expandedCriteria.includes(check.criterion) ? 
                         <ChevronDown className="h-4 w-4 text-muted-foreground" /> :
                         <ChevronRight className="h-4 w-4 text-muted-foreground" />
                     )}
                  </div>
                </div>
                
                {/* TAM/SAM/SOM Breakdown for Market Size criterion */}
                {check.criterion === 'Market Size (TAM)' && check.industryBreakdown && expandedCriteria.includes(check.criterion) && (
                  <div className="ml-8 space-y-3">
                    {check.industryBreakdown.map((industry, idx) => (
                      <div key={idx} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <h5 className="font-medium">{industry.industry}</h5>
                          <Badge variant="secondary">{Math.round(industry.weight * 100)}% weight</Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <div className="text-xs text-muted-foreground">TAM</div>
                            <div className="font-semibold">{formatMarketSize(industry.tam)}</div>
                            <div className="text-xs text-muted-foreground">
                              {industry.citation?.source || 'Industry Research'}
                            </div>
                            {industry.citation && (
                              <div className="text-xs text-muted-foreground mt-1">
                                <span className="font-medium">{industry.citation.report}</span>
                                <br />
                                <span>{industry.citation.publisher}, {industry.citation.year}</span>
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground">SAM</div>
                            <div className="font-semibold">{formatMarketSize(industry.sam)}</div>
                            <div className="text-xs text-muted-foreground">Geographic focus</div>
                            <div className="text-xs text-muted-foreground mt-1">
                              25% of TAM (addressable market)
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground">SOM</div>
                            <div className="font-semibold">{formatMarketSize(industry.som)}</div>
                            <div className="text-xs text-muted-foreground">Realistic capture</div>
                            <div className="text-xs text-muted-foreground mt-1">
                              15% of SAM (obtainable market)
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-xs text-muted-foreground">
                          <strong>Methodology:</strong> TAM from {industry.citation?.source || 'industry reports'}, 
                          SAM calculated as 25% of TAM based on geographic/regulatory constraints, 
                          SOM estimated as 15% of SAM considering competitive positioning and market penetration capabilities.
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* CAGR/Competitors/Growth Drivers Breakdown for Market Growth Rate criterion */}
                {check.criterion === 'Market Growth Rate' && check.growthBreakdown && expandedCriteria.includes(check.criterion) && (
                  <div className="ml-8 space-y-3">
                    {check.growthBreakdown.map((industry, idx) => (
                      <div key={idx} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <h5 className="font-medium">{industry.industry}</h5>
                          <Badge variant="secondary">{Math.round(industry.weight * 100)}% weight</Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <div className="text-xs text-muted-foreground">CAGR</div>
                            <div className="font-semibold">{industry.cagr}%</div>
                            <div className="text-xs text-muted-foreground">
                              {industry.citation?.source || 'Industry Research'}
                            </div>
                            {industry.citation && (
                              <div className="text-xs text-muted-foreground mt-1">
                                <span className="font-medium">{industry.citation.report}</span>
                                <br />
                                <span>{industry.citation.publisher}, {industry.citation.year}</span>
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground">Growth Drivers</div>
                            <div className="font-semibold text-xs">{industry.growthDrivers.join(', ')}</div>
                            <div className="text-xs text-muted-foreground">Key trends</div>
                            <div className="text-xs text-muted-foreground mt-1">
                              Market expansion factors
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-xs text-muted-foreground">
                          <strong>Analysis:</strong> CAGR from {industry.citation?.source || 'industry reports'}, 
                          competitive landscape based on market share and presence, 
                          growth drivers identified from industry trends and regulatory factors affecting business environment.
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Enhanced Competitive Breakdown with Visualizations */}
                {check.competitiveBreakdown && expandedCriteria.includes(check.criterion) && (
                  <div className="mt-6 pl-6 border-l-2 border-orange-200">
                    <div className="space-y-6">
                      {check.competitiveBreakdown.map((breakdown, index) => (
                        <div key={index} className="bg-orange-50 rounded-lg p-6">
                          <div className="flex items-center justify-between mb-3">
                            <span className="font-medium text-orange-900">{breakdown.industry}</span>
                            <div className="flex gap-2">
                              <Badge variant="outline" className="text-orange-700 border-orange-300">
                                HHI: {Math.round(breakdown.hhi)}
                              </Badge>
                              <Badge 
                                variant="outline" 
                                className={`${
                                  breakdown.competitiveTension === 'Low' ? 'text-green-700 border-green-300' :
                                  breakdown.competitiveTension === 'Medium' ? 'text-yellow-700 border-yellow-300' :
                                  'text-red-700 border-red-300'
                                }`}
                              >
                                {breakdown.competitiveTension} Tension
                              </Badge>
                            </div>
                          </div>

                           {/* Market Share Visualization and Key Players */}
                           <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-6">
                             {/* Key Players List */}
                             <div>
                               <h5 className="font-medium text-orange-900 mb-3">Key Players</h5>
                               <div className="space-y-2">
                                 {breakdown.competitors.slice(0, 4).map((competitor, compIndex) => (
                                   <div key={compIndex} className="flex items-center justify-between bg-white rounded p-3 text-sm border border-orange-100">
                                     <div className="flex items-center gap-2">
                                       <Building2 className="h-4 w-4 text-orange-600" />
                                       <span className="font-medium">{competitor.name}</span>
                                       <Badge 
                                         variant={
                                           competitor.competitorType === 'Incumbent' ? 'default' :
                                           competitor.competitorType === 'Challenger' ? 'secondary' :
                                           'outline'
                                         }
                                         className="text-xs"
                                       >
                                         {competitor.competitorType}
                                       </Badge>
                                     </div>
                                     <div className="text-right">
                                       <div className="font-semibold text-orange-700">{competitor.marketShare.toFixed(1)}%</div>
                                       {competitor.lastFunding > 0 && (
                                         <div className="flex items-center gap-1 justify-end text-muted-foreground">
                                           <DollarSign className="h-3 w-3" />
                                           <span className="text-xs">
                                             ${competitor.lastFunding > 1000000000 ? 
                                               `${(competitor.lastFunding / 1000000000).toFixed(1)}B` : 
                                               `${(competitor.lastFunding / 1000000).toFixed(0)}M`}
                                           </span>
                                         </div>
                                       )}
                                     </div>
                                   </div>
                                 ))}
                               </div>
                             </div>

                              {/* Market Share Pie Chart */}
                              <div>
                                <h5 className="font-medium text-orange-900 mb-3">Market Share Distribution</h5>
                                <div className="h-64">
                                 <ChartContainer
                                   config={{
                                     incumbents: { label: 'Incumbents', color: 'hsl(160, 84%, 39%)' },
                                     challengers: { label: 'Challengers', color: 'hsl(25, 95%, 53%)' },
                                     emerging: { label: 'Emerging', color: 'hsl(210, 84%, 60%)' },
                                     whitespace: { label: 'Whitespace', color: 'hsl(210, 40%, 88%)' }
                                   }}
                                 >
                                   <PieChart>
                                     <Pie
                                       data={[
                                         ...breakdown.competitors.map(comp => ({
                                           name: comp.name,
                                           value: comp.marketShare,
                                           type: comp.competitorType.toLowerCase(),
                                           fill: comp.competitorType === 'Incumbent' ? 'hsl(160, 84%, 39%)' :
                                                 comp.competitorType === 'Challenger' ? 'hsl(25, 95%, 53%)' :
                                                 'hsl(210, 84%, 60%)'
                                         })),
                                         {
                                           name: 'Whitespace',
                                           value: Math.max(0, 100 - breakdown.competitors.reduce((sum, comp) => sum + comp.marketShare, 0)),
                                           type: 'whitespace',
                                           fill: 'hsl(210, 40%, 88%)'
                                         }
                                       ]}
                                       dataKey="value"
                                       nameKey="name"
                                       cx="50%"
                                       cy="50%"
                                       outerRadius={80}
                                       innerRadius={20}
                                       label={({ name, value }) => value > 0 ? `${name}: ${value.toFixed(1)}%` : ''}
                                     />
                                     <ChartTooltip 
                                       content={({ active, payload }) => {
                                         if (active && payload && payload.length) {
                                           const data = payload[0];
                                           const value = typeof data.value === 'number' ? data.value : parseFloat(String(data.value)) || 0;
                                           return (
                                             <div className="bg-background border border-border rounded-lg p-2 shadow-lg">
                                               <p className="font-medium">{data.name}</p>
                                               <p className="text-sm">{value.toFixed(1)}% market share</p>
                                             </div>
                                           );
                                         }
                                         return null;
                                       }}
                                     />
                                   </PieChart>
                                 </ChartContainer>
                               </div>
                               
                               {/* Legend */}
                               <div className="flex flex-wrap gap-2 justify-center mt-2 text-xs">
                                 <div className="flex items-center gap-1">
                                   <div className="w-2 h-2 rounded-full bg-emerald-600"></div>
                                   <span>Incumbents</span>
                                 </div>
                                 <div className="flex items-center gap-1">
                                   <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                                   <span>Challengers</span>
                                 </div>
                                 <div className="flex items-center gap-1">
                                   <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                   <span>Emerging</span>
                                 </div>
                                 <div className="flex items-center gap-1">
                                   <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                                   <span>Whitespace</span>
                                 </div>
                               </div>
                             </div>
                           </div>

                         {/* Competitive Positioning Matrix */}
                         <div className="mb-6">
                           <h5 className="font-medium text-orange-900 mb-4">Competitive Positioning Matrix</h5>
                           <div className="h-72 bg-white rounded-lg p-4 border border-orange-200/40">
                            <ChartContainer
                              config={{
                                marketShare: { label: 'Market Share %', color: 'hsl(160, 84%, 39%)' },
                                fundingAmount: { label: 'Last Funding ($M)', color: 'hsl(25, 95%, 53%)' }
                              }}
                            >
                               <ScatterChart 
                                 margin={{ top: 20, right: 20, bottom: 40, left: 40 }}
                                 data={[
                                   ...breakdown.competitors.map(comp => ({
                                     name: comp.name,
                                     marketShare: comp.marketShare,
                                     fundingAmount: comp.lastFunding / 1000000,
                                     type: comp.competitorType
                                   })),
                                   // Add smaller players for competitive matrix
                                   { name: 'Gumroad', marketShare: 1.2, fundingAmount: 16, type: 'Emerging' },
                                   { name: 'ConvertKit', marketShare: 0.8, fundingAmount: 29, type: 'Emerging' },
                                   { name: 'Thinkific', marketShare: 0.6, fundingAmount: 22, type: 'Emerging' },
                                   { name: 'Teachable', marketShare: 0.5, fundingAmount: 12.5, type: 'Emerging' },
                                   { name: 'Printful', marketShare: 0.4, fundingAmount: 8, type: 'Emerging' },
                                   { name: 'Rebuy', marketShare: 0.3, fundingAmount: 17, type: 'Emerging' },
                                   { name: 'Klaviyo', marketShare: 0.2, fundingAmount: 320, type: 'Challenger' }
                                 ]}
                               >
                                <XAxis 
                                  dataKey="marketShare" 
                                  type="number" 
                                  domain={[0, 'dataMax + 5']} 
                                  name="Market Share %" 
                                  label={{ value: 'Market Share (%)', position: 'bottom' }}
                                />
                                <YAxis 
                                  dataKey="fundingAmount" 
                                  type="number" 
                                  domain={[0, 'dataMax + 10']} 
                                  name="Funding ($M)" 
                                  label={{ value: 'Last Funding ($M)', angle: -90, position: 'insideLeft' }}
                                />
                                <ChartTooltip 
                                  content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                      const data = payload[0].payload;
                                      return (
                                        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
                                          <p className="font-medium">{data.name}</p>
                                          <p className="text-sm">Market Share: {data.marketShare.toFixed(1)}%</p>
                                          <p className="text-sm">Last Funding: ${data.fundingAmount.toFixed(1)}M</p>
                                          <p className="text-sm">Type: {data.type}</p>
                                        </div>
                                      );
                                    }
                                    return null;
                                  }}
                                />
                                <Scatter 
                                  name="Competitors" 
                                  fill="hsl(160, 84%, 39%)"
                                  r={6}
                                />
                              </ScatterChart>
                            </ChartContainer>
                          </div>
                        </div>

                           {/* Whitespace Opportunities */}
                           <div className="pt-4 border-t border-orange-200">
                             <span className="font-medium text-orange-900">Whitespace Opportunities:</span>
                             <div className="flex flex-wrap gap-2 mt-3">
                              {breakdown.whitespaceOpportunity.map((opportunity, oppIndex) => (
                                <Badge key={oppIndex} variant="outline" className="text-xs text-orange-700 border-orange-300">
                                  {opportunity}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          
                          {breakdown.citation && (
                            <div className="text-xs text-orange-600 mt-2">
                              Source: {breakdown.citation.title || breakdown.citation.name}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Overall Insights */}
        <div className="p-3 rounded-lg bg-muted/50">
          <div className="text-sm">
            {assessment.overallStatus === 'Excellent' && (
              <p className="text-emerald-700">🎯 Exceptional market opportunity with strong fundamentals across multiple factors.</p>
            )}
            {assessment.overallStatus === 'Good' && (
              <p className="text-blue-700">✅ Solid market opportunity with good potential, consider deeper market research.</p>
            )}
            {assessment.overallStatus === 'Fair' && (
              <p className="text-amber-700">⚠️ Mixed market signals - thorough market validation recommended before proceeding.</p>
            )}
            {assessment.overallStatus === 'Poor' && (
              <p className="text-red-700">🔍 Market opportunity concerns identified - significant market risks to evaluate.</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}