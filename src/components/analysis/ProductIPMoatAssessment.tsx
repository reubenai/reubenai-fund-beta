import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle, 
  XCircle, 
  Shield,
  Lightbulb,
  Zap,
  Building,
  TrendingUp,
  Target
} from 'lucide-react';
import { Deal } from '@/hooks/usePipelineDeals';
import { supabase } from '@/integrations/supabase/client';

interface ProductIPMoatAssessmentProps {
  deal: Deal;
}

interface ProductIPCheck {
  criterion: string;
  aligned: boolean;
  reasoning: string;
  icon: React.ReactNode;
  weight: number;
  score?: number;
}

interface ProductIPAssessment {
  overallStatus: 'Excellent' | 'Good' | 'Fair' | 'Poor';
  overallScore: number;
  checks: ProductIPCheck[];
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

export function ProductIPMoatAssessment({ deal }: ProductIPMoatAssessmentProps) {
  const [loading, setLoading] = useState(true);
  const [assessment, setAssessment] = useState<ProductIPAssessment | null>(null);

  const fetchProductDataAndAssess = React.useCallback(async () => {
    try {
      setLoading(true);

      // Fetch the latest product-ip-engine data from deal_analysis_sources
      const { data: productData } = await supabase
        .from('deal_analysis_sources')
        .select('*')
        .eq('deal_id', deal.id)
        .eq('engine_name', 'product-ip-engine')
        .order('retrieved_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const assessmentResult = assessProductIPMoat(deal, productData);
      setAssessment(assessmentResult);
    } catch (error) {
      console.error('Error in product IP moat assessment:', error);
      setAssessment(assessProductIPMoat(deal, null));
    } finally {
      setLoading(false);
    }
  }, [deal.id]);

  useEffect(() => {
    // Initial load
    fetchProductDataAndAssess();

    // Listen for enrichment completion events
    const handleEnrichmentComplete = (event: CustomEvent) => {
      if (event.detail?.dealId === deal.id) {
        console.log('🔄 ProductIP: Refreshing due to enrichment completion for deal:', deal.id);
        fetchProductDataAndAssess();
      }
    };

    console.log('🎧 ProductIP: Setting up enrichment listener for deal:', deal.id);
    window.addEventListener('dealEnrichmentComplete', handleEnrichmentComplete as EventListener);

    return () => {
      window.removeEventListener('dealEnrichmentComplete', handleEnrichmentComplete as EventListener);
    };
  }, [deal.id, fetchProductDataAndAssess]);

  const assessProductIPMoat = (deal: Deal, productData?: any): ProductIPAssessment => {
    console.log('🔍 ProductIP: Assessing with product-ip-engine data:', productData);
    
    const checks: ProductIPCheck[] = [];
    const dataRetrieved = productData?.data_retrieved || {};
    
    const hasRealData = Boolean(dataRetrieved && Object.keys(dataRetrieved).length > 0);
    
    // ZERO FABRICATION POLICY: No analysis without real data
    if (!hasRealData) {
      console.log('🚫 Zero fabrication policy: No real data available for IP assessment');
    }

    // Define all criteria with zero fabrication policy
    const criteria = [
      {
        name: 'Intellectual Property Portfolio',
        icon: <Shield className="h-4 w-4" />,
        weight: 25
      },
      {
        name: 'Technology Differentiation',
        icon: <Zap className="h-4 w-4" />,
        weight: 25
      },
      {
        name: 'Competitive Barriers',
        icon: <Building className="h-4 w-4" />,
        weight: 20
      },
      {
        name: 'Innovation Pipeline',
        icon: <Lightbulb className="h-4 w-4" />,
        weight: 15
      },
      {
        name: 'Market Position',
        icon: <Target className="h-4 w-4" />,
        weight: 10
      },
      {
        name: 'Scalability Moats',
        icon: <TrendingUp className="h-4 w-4" />,
        weight: 5
      }
    ];

    // Apply zero fabrication policy to all criteria
    criteria.forEach(criterion => {
      checks.push({
        criterion: criterion.name,
        aligned: false, // Never aligned without real data
        reasoning: `Data Unavailable: ${criterion.name.toLowerCase()} assessment requires comprehensive research and analysis. Following zero-fabrication policy - no analysis provided without verified data sources.`,
        icon: criterion.icon,
        weight: criterion.weight,
        score: undefined // No score without data
      });
    });

    // Calculate overall score - ZERO without real data
    const overallScore = 0; // Always zero without real data

    // Determine overall status - always Poor without data
    const overallStatus: 'Excellent' | 'Good' | 'Fair' | 'Poor' = 'Poor';

    return {
      overallStatus,
      overallScore,
      checks,
      dataQuality: {
        completeness: 0, // No data completeness without real data
        confidence: 0, // No confidence without real data
        sources: 0 // No sources without real data
      }
    };
  };

  if (!assessment) {
    return null;
  }

  return (
    <div className="space-y-6">
      {loading ? (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          {/* Product & IP Moat Summary */}
          <Card className="h-fit">
            <CardHeader className="pb-3">
              <CardTitle className="font-semibold">Product & IP Moat</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="font-bold text-2xl mb-2">
                  {assessment?.overallScore ? `${Math.round(assessment.overallScore)}%` : 'N/A'}
                </div>
                <Badge 
                  className={`${getStatusColor(assessment?.overallStatus || 'Poor')} border px-3 py-1`}
                >
                  {assessment?.overallStatus || 'Pending Analysis'}
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
        </>
      )}
    </div>
  );
}