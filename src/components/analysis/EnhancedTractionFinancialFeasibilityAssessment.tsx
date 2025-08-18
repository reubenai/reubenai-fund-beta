import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Minus,
  Users,
  Clock,
  Target,
  ChevronDown,
  ChevronRight,
  FileText,
  BarChart3
} from 'lucide-react';
import { Deal } from '@/hooks/usePipelineDeals';
import { supabase } from '@/integrations/supabase/client';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts';

interface TractionFinancialAssessmentProps {
  deal: Deal;
}

interface FinancialMetric {
  label: string;
  value: string;
  trend?: 'Up' | 'Down' | 'Stable';
}

interface FinancialBreakdown {
  category: string;
  metrics: FinancialMetric[];
  visualizations: any[];
  insights: string[];
  strength: 'Strong' | 'Moderate' | 'Weak';
  sources: string[];
  confidence: number;
}

interface FinancialCheck {
  criterion: string;
  aligned: boolean;
  reasoning: string;
  icon: React.ReactNode;
  weight: number;
  score?: number;
  breakdown?: FinancialBreakdown;
}

interface FinancialAssessment {
  overallStatus: 'Excellent' | 'Good' | 'Fair' | 'Poor';
  overallScore: number;
  checks: FinancialCheck[];
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

const getTrendIcon = (trend: string) => {
  if (trend === 'Up') return <TrendingUp className="h-3 w-3 text-emerald-600" />;
  if (trend === 'Down') return <TrendingDown className="h-3 w-3 text-red-600" />;
  return <Minus className="h-3 w-3 text-gray-600" />;
};

export function EnhancedTractionFinancialFeasibilityAssessment({ deal }: TractionFinancialAssessmentProps) {
  const [loading, setLoading] = useState(true);
  const [assessment, setAssessment] = useState<FinancialAssessment | null>(null);
  const [expandedCriteria, setExpandedCriteria] = useState<string[]>([]);

  const toggleExpanded = (criterion: string) => {
    if (expandedCriteria.includes(criterion)) {
      setExpandedCriteria(expandedCriteria.filter(c => c !== criterion));
    } else {
      setExpandedCriteria([...expandedCriteria, criterion]);
    }
  };

  const fetchFinancialDataAndAssess = React.useCallback(async () => {
    try {
      setLoading(true);

      // Fetch the latest financial-engine data from deal_analysis_sources
      const { data: financialData } = await supabase
        .from('deal_analysis_sources')
        .select('*')
        .eq('deal_id', deal.id)
        .eq('engine_name', 'financial-engine')
        .order('retrieved_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const assessmentResult = assessFinancialPerformance(deal, financialData);
      setAssessment(assessmentResult);
    } catch (error) {
      console.error('Error in financial assessment:', error);
      setAssessment(assessFinancialPerformance(deal, null));
    } finally {
      setLoading(false);
    }
  }, [deal.id]);

  useEffect(() => {
    // Initial load
    fetchFinancialDataAndAssess();

    // Listen for enrichment completion events
    const handleEnrichmentComplete = (event: CustomEvent) => {
      if (event.detail?.dealId === deal.id) {
        console.log('🔄 Financial: Refreshing due to enrichment completion for deal:', deal.id);
        fetchFinancialDataAndAssess();
      }
    };

    console.log('🎧 Financial: Setting up enrichment listener for deal:', deal.id);
    window.addEventListener('dealEnrichmentComplete', handleEnrichmentComplete as EventListener);

    return () => {
      window.removeEventListener('dealEnrichmentComplete', handleEnrichmentComplete as EventListener);
    };
  }, [deal.id, fetchFinancialDataAndAssess]);

  const assessFinancialPerformance = (deal: Deal, financialData?: any): FinancialAssessment => {
    console.log('🔍 Financial: Assessing with financial-engine data:', financialData);
    
    const checks: FinancialCheck[] = [];
    const dataRetrieved = financialData?.data_retrieved || {};
    
    // ZERO FABRICATION POLICY: Only use real data from documents or engine results
    const hasRealEngineData = Boolean(dataRetrieved && Object.keys(dataRetrieved).length > 0);
    const hasDocumentData = Boolean(deal?.description && deal.description.length > 100); // Meaningful description
    const hasRealData = hasRealEngineData || hasDocumentData;

    // 1. Revenue Quality & Growth (25% weight)
    checks.push({
      criterion: 'Revenue Quality & Growth',
      aligned: false, // Never aligned without verified data
      reasoning: 'Data Unavailable: Revenue analysis requires verified financial statements, pitch deck data, or financial model uploads. Following zero-fabrication policy - no metrics provided without verified data sources.',
      icon: <DollarSign className="h-4 w-4" />,
      weight: 25,
      score: undefined, // No score without real data
      breakdown: undefined // No breakdown without real data
    });

    // 2. Customer Acquisition & Unit Economics (20% weight)
    checks.push({
      criterion: 'Customer Acquisition & Unit Economics',
      aligned: false,
      reasoning: 'Data Unavailable: Unit economics analysis requires customer acquisition data, cohort analysis, or financial models with LTV/CAC metrics. No fabricated metrics provided.',
      icon: <Users className="h-4 w-4" />,
      weight: 20,
      score: undefined,
      breakdown: undefined
    });

    // 3. Cash Flow & Burn Analysis (20% weight)
    checks.push({
      criterion: 'Cash Flow & Burn Analysis',
      aligned: false,
      reasoning: 'Data Unavailable: Cash flow analysis requires financial statements, burn rate data, or detailed financial projections. No fabricated cash flow metrics provided.',
      icon: <BarChart3 className="h-4 w-4" />,
      weight: 20,
      score: undefined,
      breakdown: undefined
    });

    // 4. Market Validation & Traction (20% weight)
    checks.push({
      criterion: 'Market Validation & Traction',
      aligned: false,
      reasoning: 'Data Unavailable: Market validation analysis requires customer feedback data, usage analytics, or traction metrics from verified sources. No fabricated traction data provided.',
      icon: <Target className="h-4 w-4" />,
      weight: 20,
      score: undefined,
      breakdown: undefined
    });

    // 5. Capital Efficiency & Scaling (15% weight)
    checks.push({
      criterion: 'Capital Efficiency & Scaling',
      aligned: false,
      reasoning: 'Data Unavailable: Capital efficiency assessment requires operational metrics, ROI data, or scaling projections from verified sources. No fabricated efficiency metrics provided.',
      icon: <TrendingUp className="h-4 w-4" />,
      weight: 15,
      score: undefined,
      breakdown: undefined
    });

    // Calculate overall assessment - ZERO FABRICATION POLICY
    const scoresWithData = checks.filter(check => check.score !== undefined);
    const overallScore = 0; // Always zero without real data
    const overallStatus: 'Excellent' | 'Good' | 'Fair' | 'Poor' = 'Poor'; // Always poor without data

    return {
      overallStatus,
      overallScore,
      checks,
      dataQuality: {
        completeness: 0, // No data without verified sources
        confidence: 0, // No confidence without verified sources  
        sources: 0 // No sources available
      }
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Financial analysis unavailable
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Traction & Financial Feasibility Summary */}
      <Card className="h-fit">
        <CardHeader className="pb-3">
          <CardTitle className="font-semibold">Traction & Financial Feasibility</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <div className="font-bold text-2xl mb-2">
              {assessment?.overallScore ? `${assessment.overallScore}%` : 'N/A'}
            </div>
            <Badge 
              className={`${getStatusColor(assessment?.overallStatus || 'Poor')} border px-3 py-1`}
            >
              {assessment?.overallStatus || 'Data Unavailable'}
            </Badge>
          </div>
          
          {assessment?.dataQuality && (
            <div className="pt-3 border-t">
              <div className="text-sm text-muted-foreground mb-2">Data Quality</div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Completeness</span>
                  <span>{assessment.dataQuality.completeness}%</span>
                </div>
                <Progress value={assessment.dataQuality.completeness} className="h-2" />
                <div className="flex justify-between text-sm">
                  <span>Confidence</span>
                  <span>{assessment.dataQuality.confidence}%</span>
                </div>
                <Progress value={assessment.dataQuality.confidence} className="h-2" />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Sub-criteria Analysis Cards */}
        {assessment?.checks.map((check, index) => (
          <Card key={index} className="h-fit">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                {check.icon}
                <span className="font-semibold text-sm">{check.criterion}</span>
                {getStatusIcon(check.aligned)}
              </div>
              <div className="text-center">
                <div className="font-bold text-lg mb-1">
                  {check.score ? `${check.score}%` : 'N/A'}
                </div>
                <div className="text-xs text-muted-foreground mb-2">
                  Weight: {check.weight}%
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {check.reasoning}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}