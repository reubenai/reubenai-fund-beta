import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Target,
  MapPin,
  Building2,
  DollarSign,
  TrendingUp
} from 'lucide-react';
import { Deal } from '@/hooks/usePipelineDeals';
import { EnhancedStrategy } from '@/services/unifiedStrategyService';
import { useFund } from '@/contexts/FundContext';
import { supabase } from '@/integrations/supabase/client';

interface ThesisAlignmentSectionProps {
  deal: Deal;
}

interface AlignmentCheck {
  criterion: string;
  aligned: boolean;
  reasoning: string;
  icon: React.ReactNode;
  weight: number;
}

interface AlignmentAssessment {
  overallStatus: 'Aligned' | 'Somewhat Aligned' | 'Opportunistic' | 'Off Thesis';
  overallScore: number;
  checks: AlignmentCheck[];
}

const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    'Aligned': 'bg-emerald-100 text-emerald-700 border-emerald-200',
    'Somewhat Aligned': 'bg-amber-100 text-amber-700 border-amber-200',
    'Opportunistic': 'bg-orange-100 text-orange-700 border-orange-200',
    'Off Thesis': 'bg-red-100 text-red-700 border-red-200',
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

export function ThesisAlignmentSection({ deal }: ThesisAlignmentSectionProps) {
  const { selectedFund } = useFund();
  const [strategy, setStrategy] = useState<EnhancedStrategy | null>(null);
  const [loading, setLoading] = useState(true);
  const [assessment, setAssessment] = useState<AlignmentAssessment | null>(null);

  useEffect(() => {
    const fetchStrategyAndAssess = async () => {
      if (!selectedFund?.id) return;

      try {
        setLoading(true);
        
        // Fetch fund strategy
        const { data: strategyData, error } = await supabase
          .from('investment_strategies')
          .select('*')
          .eq('fund_id', selectedFund.id)
          .maybeSingle();

        if (error) {
          console.error('Error fetching strategy:', error);
          return;
        }

        if (strategyData) {
          setStrategy(strategyData as EnhancedStrategy);
          
          // Perform thesis alignment assessment
          const alignmentAssessment = assessThesisAlignment(deal, strategyData as EnhancedStrategy);
          setAssessment(alignmentAssessment);
        }
      } catch (error) {
        console.error('Error in thesis alignment assessment:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStrategyAndAssess();
  }, [deal, selectedFund?.id]);

  const assessThesisAlignment = (deal: Deal, strategy: EnhancedStrategy): AlignmentAssessment => {
    const checks: AlignmentCheck[] = [];

    // Geography Check
    const geographyAligned = !strategy.geography?.length || 
      strategy.geography.some(geo => 
        deal.location?.toLowerCase().includes(geo.toLowerCase()) ||
        geo.toLowerCase().includes(deal.location?.toLowerCase() || '')
      );
    
    checks.push({
      criterion: 'Geography',
      aligned: geographyAligned,
      reasoning: geographyAligned 
        ? `Location "${deal.location}" matches fund geography focus` 
        : `Location "${deal.location}" not in target geographies: ${strategy.geography?.join(', ')}`,
      icon: <MapPin className="h-4 w-4" />,
      weight: 20
    });

    // Industry/Sector Check
    const industryAligned = !strategy.industries?.length || 
      strategy.industries.some(industry => 
        deal.industry?.toLowerCase().includes(industry.toLowerCase()) ||
        industry.toLowerCase().includes(deal.industry?.toLowerCase() || '')
      );
    
    checks.push({
      criterion: 'Industry Focus',
      aligned: industryAligned,
      reasoning: industryAligned 
        ? `Industry "${deal.industry}" aligns with fund focus` 
        : `Industry "${deal.industry}" not in target sectors: ${strategy.industries?.join(', ')}`,
      icon: <Building2 className="h-4 w-4" />,
      weight: 25
    });

    // Deal Size Check
    const dealSizeAligned = (!strategy.min_investment_amount || !deal.deal_size || deal.deal_size >= strategy.min_investment_amount) &&
                           (!strategy.max_investment_amount || !deal.deal_size || deal.deal_size <= strategy.max_investment_amount);
    
    checks.push({
      criterion: 'Investment Size',
      aligned: dealSizeAligned,
      reasoning: dealSizeAligned 
        ? `Deal size ${formatCurrency(deal.deal_size)} within fund range` 
        : `Deal size ${formatCurrency(deal.deal_size)} outside range: ${formatCurrency(strategy.min_investment_amount)} - ${formatCurrency(strategy.max_investment_amount)}`,
      icon: <DollarSign className="h-4 w-4" />,
      weight: 20
    });

    // Score Threshold Check
    const scoreAligned = !deal.overall_score || 
      deal.overall_score >= (strategy.needs_development_threshold || 50);
    
    checks.push({
      criterion: 'Quality Score',
      aligned: scoreAligned,
      reasoning: scoreAligned 
        ? `Score ${deal.overall_score} meets minimum threshold` 
        : `Score ${deal.overall_score} below minimum threshold of ${strategy.needs_development_threshold}`,
      icon: <TrendingUp className="h-4 w-4" />,
      weight: 25
    });

    // Key Signals Check (if available)
    if (strategy.key_signals?.length) {
      const signalsAligned = strategy.key_signals.some(signal => 
        deal.description?.toLowerCase().includes(signal.toLowerCase()) ||
        deal.company_name?.toLowerCase().includes(signal.toLowerCase()) ||
        deal.industry?.toLowerCase().includes(signal.toLowerCase())
      );
      
      checks.push({
        criterion: 'Key Signals',
        aligned: signalsAligned,
        reasoning: signalsAligned 
          ? 'Deal exhibits key investment signals' 
          : `Deal missing key signals: ${strategy.key_signals.join(', ')}`,
        icon: <Target className="h-4 w-4" />,
        weight: 10
      });
    }

    // Calculate overall score
    const totalWeight = checks.reduce((sum, check) => sum + check.weight, 0);
    const weightedScore = checks.reduce((sum, check) => 
      sum + (check.aligned ? check.weight : 0), 0);
    const overallScore = totalWeight > 0 ? Math.round((weightedScore / totalWeight) * 100) : 0;

    // Determine overall status
    let overallStatus: AlignmentAssessment['overallStatus'];
    if (overallScore >= 80) {
      overallStatus = 'Aligned';
    } else if (overallScore >= 60) {
      overallStatus = 'Somewhat Aligned';
    } else if (overallScore >= 40) {
      overallStatus = 'Opportunistic';
    } else {
      overallStatus = 'Off Thesis';
    }

    return {
      overallStatus,
      overallScore,
      checks
    };
  };

  const formatCurrency = (amount?: number): string => {
    if (!amount) return 'Not specified';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: amount >= 1000000 ? 'compact' : 'standard',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Thesis Alignment Assessment
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

  if (!strategy || !assessment) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Thesis Alignment Assessment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Investment strategy not configured</p>
              <p className="text-sm">Configure your fund's investment thesis to see alignment assessment</p>
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
          <Target className="h-5 w-5" />
          Thesis Alignment Assessment
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Overall Status */}
        <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-background">
              <Target className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium">Overall Alignment</p>
              <p className="text-sm text-muted-foreground">
                Based on {assessment.checks.length} criteria
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
          <h4 className="font-medium text-sm text-muted-foreground">Individual Criteria</h4>
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
              </div>
            </div>
          ))}
        </div>

        {/* Recommendations */}
        <div className="p-4 rounded-lg bg-muted/30 border">
          <h4 className="font-medium text-sm mb-2">Recommendations</h4>
          <div className="text-sm text-muted-foreground space-y-1">
            {assessment.overallStatus === 'Aligned' && (
              <p>✅ This deal strongly aligns with your investment thesis. Consider prioritizing for deeper due diligence.</p>
            )}
            {assessment.overallStatus === 'Somewhat Aligned' && (
              <p>⚠️ This deal has good alignment but some concerns. Review non-aligned criteria carefully.</p>
            )}
            {assessment.overallStatus === 'Opportunistic' && (
              <p>💡 This deal shows potential but deviates from core thesis. Consider if strategic rationale exists.</p>
            )}
            {assessment.overallStatus === 'Off Thesis' && (
              <p>❌ This deal significantly deviates from investment thesis. Proceed with caution or consider pass.</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}