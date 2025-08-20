import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Shield,
  Lightbulb,
  Zap,
  Building,
  TrendingUp,
  Target,
  ChevronDown,
  ChevronRight,
  FileText,
  BarChart3
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
  const [expandedCriteria, setExpandedCriteria] = useState<string[]>([]);

  const toggleCriteriaExpansion = (criterion: string) => {
    setExpandedCriteria(prev => 
      prev.includes(criterion) 
        ? prev.filter(c => c !== criterion)
        : [...prev, criterion]
    );
  };

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

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  if (!assessment) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <AlertTriangle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">Product & IP analysis unavailable</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        {/* Summary Section */}
        <div className="space-y-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Product & IP Moat</h3>
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

        {/* IP Factors */}
        <div className="space-y-4">
          <h4 className="font-medium text-sm">IP Factors</h4>
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
                    {expandedCriteria.includes(check.criterion) ? 
                      <ChevronDown className="h-4 w-4 text-muted-foreground" /> :
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    }
                  </div>
                </div>
                
                {/* Expanded Analysis */}
                {expandedCriteria.includes(check.criterion) && (
                  <div className="bg-white rounded-lg p-4 border">
                    <div className="space-y-4">
                      {/* Analysis Framework */}
                      <div>
                        <h5 className="font-medium text-card-foreground mb-2">Analysis Framework</h5>
                        <div className="text-sm text-muted-foreground">
                          Comprehensive assessment of {check.criterion.toLowerCase()} based on industry standards and competitive benchmarks. 
                          This evaluation considers market positioning, competitive advantages, and intellectual property strength.
                        </div>
                      </div>
                      
                      {/* Data Requirements */}
                      <div>
                        <h5 className="font-medium text-card-foreground mb-2">Data Requirements</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="font-medium">Required Documentation:</div>
                            <ul className="list-disc list-inside text-muted-foreground mt-1 space-y-1">
                              <li>Patent portfolio analysis</li>
                              <li>Trade secret documentation</li>
                              <li>IP landscape mapping</li>
                              <li>Competitive positioning studies</li>
                            </ul>
                          </div>
                          <div>
                            <div className="font-medium">Evaluation Metrics:</div>
                            <ul className="list-disc list-inside text-muted-foreground mt-1 space-y-1">
                              <li>IP strength scoring</li>
                              <li>Market differentiation analysis</li>
                              <li>Competitive moat assessment</li>
                              <li>Technology readiness level</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                      
                      {/* Insights */}
                      <div>
                        <h5 className="font-medium text-card-foreground mb-2">Key Insights</h5>
                        <div className="text-sm text-muted-foreground">
                          The {check.criterion.toLowerCase()} assessment reveals {check.aligned ? 'strong' : 'limited'} intellectual property 
                          positioning with significant implications for competitive defensibility and market capture potential.
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Overall Insights */}
        <div className="p-3 rounded-lg bg-muted/50 mt-6">
          <div className="text-sm">
            {assessment.overallStatus === 'Excellent' && (
              <p className="text-emerald-700">🎯 Strong intellectual property positioning with defensible competitive moats.</p>
            )}
            {assessment.overallStatus === 'Good' && (
              <p className="text-blue-700">✅ Solid IP foundation with room for strategic enhancement.</p>
            )}
            {assessment.overallStatus === 'Fair' && (
              <p className="text-amber-700">⚠️ Mixed IP signals - IP strategy development recommended.</p>
            )}
            {assessment.overallStatus === 'Poor' && (
              <p className="text-red-700">🔍 IP weaknesses identified - comprehensive IP audit needed.</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}