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
  TrendingUp,
  Info
} from 'lucide-react';
import { Deal } from '@/hooks/usePipelineDeals';
import { EnhancedStrategy } from '@/services/unifiedStrategyService';
import { useFund } from '@/contexts/FundContext';
import { supabase } from '@/integrations/supabase/client';
import { industryMappingService, SemanticMatch } from '@/services/industryMappingService';

interface ThesisAlignmentSectionProps {
  deal: Deal;
  fundId?: string;
}

interface AlignmentCheck {
  criterion: string;
  aligned: boolean;
  reasoning: string;
  icon: React.ReactNode;
  weight: number;
  score?: number;
  semanticMatch?: SemanticMatch;
  explanation?: string;
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

export function ThesisAlignmentSection({ deal, fundId }: ThesisAlignmentSectionProps) {
  const { selectedFund } = useFund();
  const [strategy, setStrategy] = useState<EnhancedStrategy | null>(null);
  const [loading, setLoading] = useState(true);
  const [assessment, setAssessment] = useState<AlignmentAssessment | null>(null);

  // Use fundId prop if provided, otherwise fall back to selectedFund
  const activeFundId = fundId || selectedFund?.id;

  useEffect(() => {
    const fetchStrategyAndAssess = async () => {
      if (!activeFundId) return;

      try {
        setLoading(true);
        
        // Fetch fund strategy
        const { data: strategyData, error } = await supabase
          .from('investment_strategies')
          .select('*')
          .eq('fund_id', activeFundId)
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
  }, [activeFundId, deal]);

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

    // Enhanced Industry/Sector Check with semantic matching
    const industryAlignment = industryMappingService.areIndustriesAligned(
      deal.industry || '', 
      strategy.industries || [],
      60 // minimum confidence threshold
    );
    
    checks.push({
      criterion: 'Industry Focus',
      aligned: industryAlignment.aligned,
      reasoning: industryAlignment.explanation,
      icon: <Building2 className="h-4 w-4" />,
      weight: 25,
      semanticMatch: industryAlignment.match,
      explanation: industryAlignment.match 
        ? `Semantic confidence: ${industryAlignment.match.confidence}%` 
        : undefined
    });

    // Investment Size Check - Use Current Round Size
    const currentRoundSize = deal.current_round_size;
    const dealSizeAligned = currentRoundSize && 
      (currentRoundSize >= (strategy.min_investment_amount || 0)) &&
      (currentRoundSize <= (strategy.max_investment_amount || Infinity));
    
    checks.push({
      criterion: 'Investment Size',
      aligned: dealSizeAligned || false,
      reasoning: !currentRoundSize 
        ? 'Current round size not specified - requires clarification'
        : dealSizeAligned 
          ? `Current round ${formatCurrency(currentRoundSize)} within fund range` 
          : `Current round ${formatCurrency(currentRoundSize)} outside range: ${formatCurrency(strategy.min_investment_amount)} - ${formatCurrency(strategy.max_investment_amount)}`,
      icon: <DollarSign className="h-4 w-4" />,
      weight: 20,
      score: dealSizeAligned ? 80 : currentRoundSize ? 30 : 45
    });

    // Score Threshold Check
    const scoreAligned = deal.overall_score && 
      deal.overall_score >= (strategy.needs_development_threshold || 50);
    
    checks.push({
      criterion: 'Quality Score',
      aligned: scoreAligned || false,
      reasoning: !deal.overall_score 
        ? 'No quality assessment available - analysis pending'
        : scoreAligned 
          ? `Score ${deal.overall_score} meets minimum threshold` 
          : `Score ${deal.overall_score} below minimum threshold of ${strategy.needs_development_threshold}`,
      icon: <TrendingUp className="h-4 w-4" />,
      weight: 25,
      score: scoreAligned ? 85 : deal.overall_score ? 40 : 50
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
      <CardContent className="pt-6">
        <div className="space-y-6">
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
                <div className="flex-1">
                  <p className="font-medium text-sm">{check.criterion}</p>
                  <p className="text-xs text-muted-foreground">{check.reasoning}</p>
                  {check.semanticMatch && (
                    <div className="flex items-center gap-1 mt-1">
                      <Info className="h-3 w-3 text-blue-500" />
                      <span className="text-xs text-blue-600">
                        {check.semanticMatch.reason} ({check.semanticMatch.confidence}% confidence)
                      </span>
                    </div>
                  )}
                  {check.explanation && (
                    <p className="text-xs text-amber-600 mt-1">{check.explanation}</p>
                  )}
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
        </div>
      </CardContent>
    </Card>
  );
}