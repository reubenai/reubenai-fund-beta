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
  DollarSign,
  Calculator,
  CheckSquare,
  PiggyBank
} from 'lucide-react';
import { Deal } from '@/hooks/usePipelineDeals';
import { supabase } from '@/integrations/supabase/client';

interface TractionFinancialFeasibilityAssessmentProps {
  deal: Deal;
}

interface TractionCheck {
  criterion: string;
  aligned: boolean;
  reasoning: string;
  icon: React.ReactNode;
  weight: number;
  score?: number;
}

interface TractionAssessment {
  overallStatus: 'Excellent' | 'Good' | 'Fair' | 'Poor';
  overallScore: number;
  checks: TractionCheck[];
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

export function TractionFinancialFeasibilityAssessment({ deal }: TractionFinancialFeasibilityAssessmentProps) {
  const [loading, setLoading] = useState(true);
  const [assessment, setAssessment] = useState<TractionAssessment | null>(null);
  const [financialData, setFinancialData] = useState<any>(null);

  useEffect(() => {
    const fetchFinancialDataAndAssess = async () => {
      try {
        setLoading(true);
        
        // Fetch financial and traction analysis data for this deal
        const { data: financialIntelligence, error } = await supabase
          .from('deal_analysis_sources')
          .select('*')
          .eq('deal_id', deal.id)
          .eq('engine_name', 'financial-engine')
          .order('retrieved_at', { ascending: false })
          .limit(1);

        if (!error && financialIntelligence && financialIntelligence.length > 0) {
          setFinancialData(financialIntelligence[0].data_retrieved);
        }

        // Perform traction & financial feasibility assessment
        const tractionAssessment = assessTractionFinancialFeasibility(deal, financialIntelligence?.[0]?.data_retrieved);
        setAssessment(tractionAssessment);
      } catch (error) {
        console.error('Error in traction financial feasibility assessment:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFinancialDataAndAssess();
  }, [deal]);

  const assessTractionFinancialFeasibility = (deal: Deal, financialData?: any): TractionAssessment => {
    const checks: TractionCheck[] = [];

    // Revenue Growth
    const revenueGrowth = financialData?.revenue_growth || 
      (deal.enhanced_analysis && 
       typeof deal.enhanced_analysis === 'object' && 
       'business_traction' in deal.enhanced_analysis ? 
         (deal.enhanced_analysis as any).business_traction?.revenue_growth : 
         null);
         
    const revenueGrowthStrong = revenueGrowth && (
      (typeof revenueGrowth === 'number' && revenueGrowth > 30) ||
      (typeof revenueGrowth === 'string' && parseFloat(revenueGrowth) > 30) ||
      (typeof revenueGrowth === 'object' && revenueGrowth.monthly_growth > 20)
    );
    
    checks.push({
      criterion: 'Revenue Growth',
      aligned: revenueGrowthStrong || false,
      reasoning: revenueGrowthStrong 
        ? 'Strong revenue growth trajectory demonstrating market validation' 
        : revenueGrowth 
          ? 'Moderate revenue growth - monitor trends'
          : 'Revenue growth data not available - financial analysis needed',
      icon: <TrendingUp className="h-4 w-4" />,
      weight: 25,
      score: revenueGrowthStrong ? 85 : revenueGrowth ? 60 : 35
    });

    // Customer Acquisition
    const customerMetrics = financialData?.customer_metrics || 
      (deal.enhanced_analysis && 
       typeof deal.enhanced_analysis === 'object' && 
       'business_traction' in deal.enhanced_analysis ? 
         (deal.enhanced_analysis as any).business_traction?.customer_acquisition : 
         null);
         
    const customerAcquisitionStrong = customerMetrics && (
      customerMetrics.cac_payback_months < 12 ||
      customerMetrics.ltv_cac_ratio > 3 ||
      (typeof customerMetrics === 'string' && customerMetrics.toLowerCase().includes('strong'))
    );
    
    checks.push({
      criterion: 'Customer Acquisition',
      aligned: customerAcquisitionStrong || false,
      reasoning: customerAcquisitionStrong 
        ? 'Efficient customer acquisition with strong unit economics' 
        : customerMetrics 
          ? 'Customer acquisition metrics available - monitor efficiency'
          : 'Customer acquisition analysis pending',
      icon: <Users className="h-4 w-4" />,
      weight: 20,
      score: customerAcquisitionStrong ? 80 : customerMetrics ? 55 : 35
    });

    // Financial Projections
    const projections = financialData?.financial_projections || 
      financialData?.forecasts ||
      deal.deal_size;
      
    const projectionsRealistic = projections && (
      (typeof projections === 'object' && projections.feasible) ||
      deal.deal_size ||
      (typeof projections === 'string' && projections.toLowerCase().includes('realistic'))
    );
    
    checks.push({
      criterion: 'Financial Projections',
      aligned: projectionsRealistic || false,
      reasoning: projectionsRealistic 
        ? 'Realistic financial projections with clear path to profitability' 
        : projections 
          ? 'Financial projections require validation'
          : 'Financial projections analysis needed',
      icon: <Calculator className="h-4 w-4" />,
      weight: 15,
      score: projectionsRealistic ? 75 : projections ? 55 : 35
    });

    // Unit Economics
    const unitEconomics = financialData?.unit_economics || 
      (deal.enhanced_analysis && 
       typeof deal.enhanced_analysis === 'object' && 
       'financial_health' in deal.enhanced_analysis ? 
         (deal.enhanced_analysis as any).financial_health?.unit_economics : 
         null);
         
    const unitEconomicsHealthy = unitEconomics && (
      unitEconomics.gross_margin > 60 ||
      unitEconomics.contribution_margin > 40 ||
      (typeof unitEconomics === 'string' && unitEconomics.toLowerCase().includes('positive'))
    );
    
    checks.push({
      criterion: 'Unit Economics',
      aligned: unitEconomicsHealthy || false,
      reasoning: unitEconomicsHealthy 
        ? 'Healthy unit economics with strong margins and profitability path' 
        : unitEconomics 
          ? 'Unit economics under review - margin analysis needed'
          : 'Unit economics analysis pending',
      icon: <DollarSign className="h-4 w-4" />,
      weight: 15,
      score: unitEconomicsHealthy ? 80 : unitEconomics ? 60 : 40
    });

    // Market Validation
    const marketValidation = financialData?.market_validation || 
      (deal.enhanced_analysis && 
       typeof deal.enhanced_analysis === 'object' && 
       'business_traction' in deal.enhanced_analysis ? 
         (deal.enhanced_analysis as any).business_traction?.product_market_fit : 
         null) || 
      deal.overall_score;
      
    const marketValidated = marketValidation && (
      (typeof marketValidation === 'object' && marketValidation.validated) ||
      (typeof marketValidation === 'number' && marketValidation > 60) ||
      (typeof marketValidation === 'string' && marketValidation.toLowerCase().includes('validated'))
    );
    
    checks.push({
      criterion: 'Market Validation',
      aligned: marketValidated || false,
      reasoning: marketValidated 
        ? 'Strong market validation with evidence of product-market fit' 
        : marketValidation 
          ? 'Market validation in progress'
          : 'Market validation assessment needed',
      icon: <CheckSquare className="h-4 w-4" />,
      weight: 15,
      score: marketValidated ? 75 : marketValidation ? 55 : 35
    });

    // Funding Efficiency
    const fundingEfficiency = financialData?.capital_efficiency || 
      deal.deal_size ||
      (deal.enhanced_analysis && 
       typeof deal.enhanced_analysis === 'object' && 
       'financial_health' in deal.enhanced_analysis ? 
         (deal.enhanced_analysis as any).financial_health?.capital_deployment : 
         null);
         
    const fundingEfficient = fundingEfficiency && (
      (typeof fundingEfficiency === 'object' && fundingEfficiency.efficient) ||
      deal.deal_size ||
      (typeof fundingEfficiency === 'string' && fundingEfficiency.toLowerCase().includes('efficient'))
    );
    
    checks.push({
      criterion: 'Funding Efficiency',
      aligned: fundingEfficient || false,
      reasoning: fundingEfficient 
        ? 'Efficient capital deployment with clear milestones and ROI targets' 
        : fundingEfficiency 
          ? 'Capital efficiency under evaluation'
          : 'Funding efficiency analysis needed',
      icon: <PiggyBank className="h-4 w-4" />,
      weight: 10,
      score: fundingEfficient ? 70 : fundingEfficiency ? 50 : 35
    });

    // Calculate overall score
    const totalWeight = checks.reduce((sum, check) => sum + check.weight, 0);
    const weightedScore = checks.reduce((sum, check) => 
      sum + ((check.score || (check.aligned ? 70 : 30)) * check.weight / 100), 0);
    const overallScore = totalWeight > 0 ? Math.round(weightedScore) : 0;

    // Determine overall status
    let overallStatus: TractionAssessment['overallStatus'];
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

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Traction & Financial Feasibility
          </CardTitle>
        </CardHeader>
        <CardContent>
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
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Traction & Financial Feasibility
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Financial analysis unavailable</p>
              <p className="text-sm">Trigger AI analysis to assess traction & financial feasibility</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Traction & Financial Feasibility
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Overall Status */}
        <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-background">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium">Traction & Financial Health</p>
              <p className="text-sm text-muted-foreground">
                Based on {assessment.checks.length} financial factors
              </p>
            </div>
          </div>
          <div className="text-right">
            <Badge variant="outline" className={`${getStatusColor(assessment.overallStatus)} mb-2`}>
              {assessment.overallStatus}
            </Badge>
            <div className="flex items-center gap-2">
              <Progress value={assessment.overallScore} className="w-24" />
              <span className="text-sm font-medium">{assessment.overallScore}%</span>
            </div>
          </div>
        </div>

        {/* Individual Checks */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm text-muted-foreground">Financial Factors</h4>
          {assessment.checks.map((check, index) => (
            <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  {check.icon}
                  {getStatusIcon(check.aligned)}
                </div>
                <div>
                  <p className="font-medium text-sm">{check.criterion}</p>
                  <p className="text-xs text-muted-foreground">{check.reasoning}</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-muted-foreground">Weight: {check.weight}%</span>
                {check.score && (
                  <div className="text-xs font-medium">{check.score}/100</div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Financial Insights */}
        <div className="p-4 rounded-lg bg-muted/30 border">
          <h4 className="font-medium text-sm mb-2">Financial Insights</h4>
          <div className="text-sm text-muted-foreground space-y-1">
            {assessment.overallStatus === 'Excellent' && (
              <p>💰 Excellent financial fundamentals with strong traction and clear path to profitability.</p>
            )}
            {assessment.overallStatus === 'Good' && (
              <p>📈 Good financial health with solid traction metrics and growth potential.</p>
            )}
            {assessment.overallStatus === 'Fair' && (
              <p>⚠️ Mixed financial signals - deeper financial due diligence recommended.</p>
            )}
            {assessment.overallStatus === 'Poor' && (
              <p>🔍 Financial concerns identified - thorough financial analysis required.</p>
            )}
            
            {financialData && (
              <p className="mt-2 pt-2 border-t border-muted-foreground/20">
                💡 Financial intelligence data available from recent analysis
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}