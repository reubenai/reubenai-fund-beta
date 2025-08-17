import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Shield,
  Lightbulb,
  Zap,
  Building,
  Cog,
  Network
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
  overallStatus: 'Exceptional' | 'Strong' | 'Moderate' | 'Weak';
  overallScore: number;
  checks: ProductIPCheck[];
}

const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    'Exceptional': 'bg-emerald-100 text-emerald-700 border-emerald-200',
    'Strong': 'bg-blue-100 text-blue-700 border-blue-200',
    'Moderate': 'bg-amber-100 text-amber-700 border-amber-200',
    'Weak': 'bg-red-100 text-red-700 border-red-200',
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
  const [productData, setProductData] = useState<any>(null);

  useEffect(() => {
    const fetchProductDataAndAssess = async () => {
      try {
        setLoading(true);
        
        // Fetch product and IP analysis data for this deal
        const { data: productIntelligence, error } = await supabase
          .from('deal_analysis_sources')
          .select('*')
          .eq('deal_id', deal.id)
          .eq('engine_name', 'product-ip-engine')
          .order('retrieved_at', { ascending: false })
          .limit(1);

        if (!error && productIntelligence && productIntelligence.length > 0) {
          setProductData(productIntelligence[0].data_retrieved);
        }

        // Perform product & IP moat assessment
        const productAssessment = assessProductIPMoat(deal, productIntelligence?.[0]?.data_retrieved);
        setAssessment(productAssessment);
      } catch (error) {
        console.error('Error in product IP moat assessment:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProductDataAndAssess();

    // Listen for enrichment completion events
    const handleEnrichmentComplete = (event: CustomEvent) => {
      if (event.detail?.dealId === deal.id) {
        console.log('🔄 ProductIP: Auto-refreshing due to enrichment completion');
        fetchProductDataAndAssess();
      }
    };

    window.addEventListener('dealEnrichmentComplete', handleEnrichmentComplete as EventListener);

    return () => {
      window.removeEventListener('dealEnrichmentComplete', handleEnrichmentComplete as EventListener);
    };
  }, [deal]);

  const assessProductIPMoat = (deal: Deal, productData?: any): ProductIPAssessment => {
    const checks: ProductIPCheck[] = [];

    // Intellectual Property Protection
    const ipData = productData?.intellectual_property || productData?.patents;
    const ipStrong = ipData && (
      ipData.patents_filed > 0 || 
      ipData.trademarks || 
      ipData.copyright_protection ||
      (Array.isArray(ipData) && ipData.length > 0)
    );
    
    checks.push({
      criterion: 'Intellectual Property Protection',
      aligned: ipStrong || false,
      reasoning: ipStrong 
        ? 'Strong IP portfolio with patents, trademarks, or proprietary protection' 
        : ipData 
          ? 'Limited IP protection identified'
          : 'IP protection analysis pending - legal review needed',
      icon: <Shield className="h-4 w-4" />,
      weight: 20,
      score: ipStrong ? 80 : ipData ? 55 : 35
    });

    // Technology Differentiation
    const techDiff = productData?.technology_differentiation || 
      (deal.enhanced_analysis && 
       typeof deal.enhanced_analysis === 'object' && 
       'product_technology' in deal.enhanced_analysis ? 
         (deal.enhanced_analysis as any).product_technology?.differentiation : 
         null);
         
    const techDiffStrong = techDiff && (
      techDiff.competitive_advantage || 
      techDiff.proprietary_algorithms ||
      (typeof techDiff === 'string' && techDiff.toLowerCase().includes('proprietary'))
    );
    
    checks.push({
      criterion: 'Technology Differentiation',
      aligned: techDiffStrong || false,
      reasoning: techDiffStrong 
        ? 'Strong technology differentiation with competitive advantages' 
        : techDiff 
          ? 'Some technology differentiation identified'
          : 'Technology differentiation assessment pending',
      icon: <Zap className="h-4 w-4" />,
      weight: 25,
      score: techDiffStrong ? 85 : techDiff ? 60 : 40
    });

    // Product Innovation
    const innovation = productData?.product_innovation || deal.description;
    const innovationStrong = innovation && (
      (typeof innovation === 'string' && (
        innovation.toLowerCase().includes('first-to-market') ||
        innovation.toLowerCase().includes('innovative') ||
        innovation.toLowerCase().includes('breakthrough')
      )) ||
      (typeof innovation === 'object' && innovation.innovation_score > 70)
    );
    
    checks.push({
      criterion: 'Product Innovation',
      aligned: innovationStrong || false,
      reasoning: innovationStrong 
        ? 'Strong product innovation with unique market approach' 
        : innovation 
          ? 'Some innovation elements identified'
          : 'Product innovation assessment needed',
      icon: <Lightbulb className="h-4 w-4" />,
      weight: 20,
      score: innovationStrong ? 75 : innovation ? 55 : 35
    });

    // Competitive Barriers
    const barriers = productData?.competitive_barriers || productData?.moat_strength;
    const barriersStrong = barriers && (
      barriers.switching_costs ||
      barriers.network_effects ||
      barriers.data_advantages ||
      (typeof barriers === 'number' && barriers > 70)
    );
    
    checks.push({
      criterion: 'Competitive Barriers',
      aligned: barriersStrong || false,
      reasoning: barriersStrong 
        ? 'Strong competitive moats with high switching costs or network effects' 
        : barriers 
          ? 'Some competitive barriers present'
          : 'Competitive barrier analysis pending',
      icon: <Building className="h-4 w-4" />,
      weight: 15,
      score: barriersStrong ? 80 : barriers ? 60 : 40
    });

    // Proprietary Processes
    const processes = productData?.proprietary_processes || 
      (deal.enhanced_analysis && 
       typeof deal.enhanced_analysis === 'object' && 
       'operational_excellence' in deal.enhanced_analysis ? 
         (deal.enhanced_analysis as any).operational_excellence : 
         null);
         
    const processesStrong = processes && (
      processes.cost_advantages ||
      processes.efficiency_gains ||
      (typeof processes === 'string' && processes.toLowerCase().includes('proprietary'))
    );
    
    checks.push({
      criterion: 'Proprietary Processes',
      aligned: processesStrong || false,
      reasoning: processesStrong 
        ? 'Proprietary processes provide cost or efficiency advantages' 
        : processes 
          ? 'Some process advantages identified'
          : 'Process advantage assessment pending',
      icon: <Cog className="h-4 w-4" />,
      weight: 10,
      score: processesStrong ? 70 : processes ? 50 : 30
    });

    // Network Effects
    const networkEffects = productData?.network_effects || 
      (deal.enhanced_analysis && 
       typeof deal.enhanced_analysis === 'object' && 
       'business_traction' in deal.enhanced_analysis ? 
         (deal.enhanced_analysis as any).business_traction?.viral_potential : 
         null);
         
    const networkStrong = networkEffects && (
      networkEffects.user_growth_multiplier ||
      networkEffects.platform_dynamics ||
      (typeof networkEffects === 'boolean' && networkEffects)
    );
    
    checks.push({
      criterion: 'Network Effects',
      aligned: networkStrong || false,
      reasoning: networkStrong 
        ? 'Strong network effects create viral growth potential' 
        : networkEffects 
          ? 'Some network effect potential identified'
          : 'Network effects assessment pending',
      icon: <Network className="h-4 w-4" />,
      weight: 10,
      score: networkStrong ? 75 : networkEffects ? 55 : 35
    });

    // Calculate overall score
    const totalWeight = checks.reduce((sum, check) => sum + check.weight, 0);
    const weightedScore = checks.reduce((sum, check) => 
      sum + ((check.score || (check.aligned ? 70 : 30)) * check.weight / 100), 0);
    const overallScore = totalWeight > 0 ? Math.round(weightedScore) : 0;

    // Determine overall status
    let overallStatus: ProductIPAssessment['overallStatus'];
    if (overallScore >= 75) {
      overallStatus = 'Exceptional';
    } else if (overallScore >= 60) {
      overallStatus = 'Strong';
    } else if (overallScore >= 45) {
      overallStatus = 'Moderate';
    } else {
      overallStatus = 'Weak';
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
            <Shield className="h-5 w-5" />
            Product & IP Moat
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
            <Shield className="h-5 w-5" />
            Product & IP Moat
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Product analysis unavailable</p>
              <p className="text-sm">Trigger AI analysis to assess product & IP moat</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6 space-y-6">
        {/* Overall Status */}
        <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-background">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium">Product & IP Strength</p>
              <p className="text-sm text-muted-foreground">
                Based on {assessment.checks.length} moat factors
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
          <h4 className="font-medium text-sm text-muted-foreground">Moat Factors</h4>
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

        {/* Product Insights */}
        <div className="p-4 rounded-lg bg-muted/30 border">
          <h4 className="font-medium text-sm mb-2">Product Insights</h4>
          <div className="text-sm text-muted-foreground space-y-1">
            {assessment.overallStatus === 'Exceptional' && (
              <p>🛡️ Exceptional defensive moats with strong IP and competitive barriers.</p>
            )}
            {assessment.overallStatus === 'Strong' && (
              <p>💪 Strong product positioning with good defensive characteristics.</p>
            )}
            {assessment.overallStatus === 'Moderate' && (
              <p>⚠️ Moderate product moat - consider strengthening IP and differentiation.</p>
            )}
            {assessment.overallStatus === 'Weak' && (
              <p>🔍 Limited product moat identified - significant competitive risks present.</p>
            )}
            
            {productData && (
              <p className="mt-2 pt-2 border-t border-muted-foreground/20">
                💡 Product intelligence data available from recent analysis
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}