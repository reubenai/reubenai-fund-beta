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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const toggleExpanded = (criterion: string) => {
    if (expandedCriteria.includes(criterion)) {
      setExpandedCriteria(expandedCriteria.filter(c => c !== criterion));
    } else {
      setExpandedCriteria([...expandedCriteria, criterion]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Product & IP Moat Summary Score */}
      <Card className="bg-muted/30">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <div className="text-muted-foreground mt-1">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-1">Product & IP Moat Score</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Based on {assessment?.checks.length || 0} IP factors • Sources: Data Unavailable
              </p>
              <div className="flex items-center gap-4">
                <Badge 
                  className={`${getStatusColor(assessment?.overallStatus || 'Poor')} border px-3 py-1`}
                >
                  {assessment?.overallStatus || 'Poor'}
                </Badge>
                <span className="font-bold text-xl min-w-[60px] text-right">
                  N/A
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* IP Factors */}
      <div>
        <h3 className="font-semibold text-lg mb-4">IP Factors</h3>
        <div className="space-y-3">
          {assessment?.checks.map((check, index) => (
            <Card key={index} className="bg-muted/20">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="mt-1">
                      {getStatusIcon(check.aligned)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{check.criterion}</h4>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">Weight: {check.weight}%</span>
                          <span className="font-semibold text-sm">
                            {check.score !== undefined ? `${check.score}/100` : 'N/A'}
                          </span>
                          <button
                            onClick={() => toggleExpanded(check.criterion)}
                            className="p-1 hover:bg-muted rounded"
                          >
                            {expandedCriteria.includes(check.criterion) ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {check.reasoning}
                      </p>
                      
                      {/* Expanded Analysis Framework */}
                      {expandedCriteria.includes(check.criterion) && (
                        <div className="mt-4 pt-4 border-t">
                          <div className="space-y-4">
                            <div className="bg-muted/50 p-3 rounded-lg">
                              <h5 className="font-medium text-sm mb-2 flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                Analysis Framework
                              </h5>
                              <div className="text-xs text-muted-foreground space-y-1">
                                <p>• Comprehensive IP portfolio analysis</p>
                                <p>• Technology differentiation assessment</p>
                                <p>• Competitive barrier evaluation</p>
                                <p>• Innovation pipeline review</p>
                                <p>• Market position analysis</p>
                                <p>• Scalability moat identification</p>
                              </div>
                            </div>
                            
                            <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg">
                              <h5 className="font-medium text-sm mb-2 text-amber-800">Data Requirements</h5>
                              <div className="text-xs text-amber-700 space-y-1">
                                <p>• Patent filings and IP documentation</p>
                                <p>• Technology architecture details</p>
                                <p>• Competitive analysis reports</p>
                                <p>• R&D pipeline documentation</p>
                                <p>• Market positioning materials</p>
                                <p>• Scalability strategy documents</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}