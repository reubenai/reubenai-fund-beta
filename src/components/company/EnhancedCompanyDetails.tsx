import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Building2, 
  Globe, 
  Users, 
  MapPin, 
  Calendar,
  Briefcase,
  TrendingUp,
  Shield,
  Lightbulb,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CompanyDetailsProps {
  deal: {
    id: string;
    company_name: string;
    website?: string;
    industry?: string;
    location?: string;
    description?: string;
    business_model?: string;
    founder?: string;
    employee_count?: number;
    linkedin_url?: string;
    crunchbase_url?: string;
  };
}

interface CompanyEnrichmentData {
  business_model?: string;
  revenue_model?: string;
  customer_segments?: string[];
  competitive_advantages?: string[];
  technology_stack?: string[];
  ip_portfolio?: string[];
  market_position?: string;
  growth_trajectory?: string;
  funding_history?: any[];
  key_partnerships?: string[];
  regulatory_compliance?: string[];
  team_info?: {
    leadership_team?: any[];
    board_members?: any[];
    advisors?: any[];
    total_employees?: number;
  };
}

export function EnhancedCompanyDetails({ deal }: CompanyDetailsProps) {
  const [enrichmentData, setEnrichmentData] = useState<CompanyEnrichmentData | null>(null);
  const [isEnriching, setIsEnriching] = useState(false);
  const [hasEnriched, setHasEnriched] = useState(false);
  const { toast } = useToast();

  // Check if we have existing analysis data
  useEffect(() => {
    checkExistingAnalysis();
  }, [deal.id]);

  const checkExistingAnalysis = async () => {
    try {
      const { data: analysisData } = await supabase
        .from('deal_analyses')
        .select('engine_results')
        .eq('deal_id', deal.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (analysisData && analysisData.length > 0 && analysisData[0].engine_results) {
        const engineResults = analysisData[0].engine_results as any;
        
        // Extract company data from various engine results
        const companyData: CompanyEnrichmentData = {};
        
        // From financial engine
        if (engineResults.financial_feasibility?.data) {
          companyData.revenue_model = engineResults.financial_feasibility.data.revenue_model;
          companyData.funding_history = engineResults.financial_feasibility.data.funding_requirements;
        }
        
        // From product engine
        if (engineResults.product_strength_ip?.data) {
          companyData.competitive_advantages = engineResults.product_strength_ip.data.competitive_advantages;
          companyData.technology_stack = engineResults.product_strength_ip.data.technology_moat ? [engineResults.product_strength_ip.data.technology_moat] : [];
        }
        
        // From team engine
        if (engineResults.founder_team_strength?.data) {
          companyData.team_info = {
            leadership_team: engineResults.founder_team_strength.data.founder_profile ? [engineResults.founder_team_strength.data.founder_profile] : [],
            total_employees: deal.employee_count
          };
        }
        
        // From market engine
        if (engineResults.market_attractiveness?.data) {
          companyData.market_position = engineResults.market_attractiveness.data.competitive_landscape;
          companyData.growth_trajectory = engineResults.market_attractiveness.data.growth_rate;
        }

        if (Object.keys(companyData).length > 0) {
          setEnrichmentData(companyData);
          setHasEnriched(true);
        }
      }
    } catch (error) {
      console.error('Error checking existing analysis:', error);
    }
  };

  const enrichCompanyData = async () => {
    if (isEnriching) return;
    
    setIsEnriching(true);
    
    try {
      // Call the enhanced deal analysis function to get comprehensive data
      const { data, error } = await supabase.functions.invoke('enhanced-deal-analysis', {
        body: { 
          dealId: deal.id,
          analysis_type: 'comprehensive'
        }
      });

      if (error) throw error;

      if (data?.success && data.analysis) {
        const analysis = data.analysis;
        
        // Map the comprehensive analysis to company enrichment data
        const enrichedData: CompanyEnrichmentData = {
          business_model: analysis.financial_feasibility?.data?.revenue_model || deal.business_model,
          revenue_model: analysis.financial_feasibility?.data?.revenue_model,
          competitive_advantages: analysis.product_strength_ip?.data?.competitive_advantages || [],
          technology_stack: analysis.product_strength_ip?.data?.technology_moat ? [analysis.product_strength_ip.data.technology_moat] : [],
          market_position: analysis.market_attractiveness?.analysis,
          growth_trajectory: analysis.market_attractiveness?.data?.growth_rate,
          team_info: {
            leadership_team: analysis.founder_team_strength?.data?.founder_profile ? [analysis.founder_team_strength.data.founder_profile] : [],
            total_employees: deal.employee_count
          }
        };

        setEnrichmentData(enrichedData);
        setHasEnriched(true);
        
        toast({
          title: "Company data enriched",
          description: "Successfully gathered comprehensive company insights using ReubenAI analysis.",
        });
      } else {
        throw new Error('No analysis data returned');
      }
    } catch (error) {
      console.error('Error enriching company data:', error);
      toast({
        title: "Enrichment failed",
        description: "Unable to gather additional company data at this time.",
        variant: "destructive",
      });
    } finally {
      setIsEnriching(false);
    }
  };

  const LoadingSkeleton = () => (
    <div className="space-y-4">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-20 w-full" />
    </div>
  );

  // Auto-trigger background enrichment when component loads
  useEffect(() => {
    console.log('🏢 [Company Details] Auto-triggering enrichment for:', deal.company_name);
    if (!hasEnriched && !isEnriching) {
      enrichCompanyData();
    }
  }, [deal.id]);

  return (
    <div className="space-y-6">
      {/* Header - Clean Company Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Company Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="space-y-3">
              <div>
                <div className="text-sm font-medium text-muted-foreground">Company Name</div>
                <div className="font-semibold">{deal.company_name}</div>
              </div>
              
              {deal.industry && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Industry</div>
                  <Badge variant="secondary">{deal.industry}</Badge>
                </div>
              )}
              
              {deal.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{deal.location}</span>
                </div>
              )}
            </div>
            
            <div className="space-y-3">
              {deal.website && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Website</div>
                  <a 
                    href={deal.website.startsWith('http') ? deal.website : `https://${deal.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-primary hover:underline"
                  >
                    <Globe className="h-3 w-3" />
                    {deal.website}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
              
              {deal.founder && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Founder</div>
                  <div>{deal.founder}</div>
                </div>
              )}
              
              {deal.employee_count && (
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{deal.employee_count} employees</span>
                </div>
              )}
            </div>
          </div>

          {deal.description && (
            <>
              <Separator className="my-4" />
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-2">Description</div>
                <p className="text-sm text-foreground leading-relaxed">{deal.description}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Enriched Data Sections */}
      {isEnriching && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 animate-spin" />
              Analyzing Company Data...
            </CardTitle>
          </CardHeader>
          <CardContent>
            <LoadingSkeleton />
          </CardContent>
        </Card>
      )}

      {enrichmentData && (
        <>
          {/* Business Model & Revenue */}
          {(enrichmentData.business_model || enrichmentData.revenue_model) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Business Model & Revenue
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {enrichmentData.business_model && (
                  <div>
                    <h4 className="font-medium mb-2">Business Model</h4>
                    <p className="text-sm text-muted-foreground">{enrichmentData.business_model}</p>
                  </div>
                )}
                
                {enrichmentData.revenue_model && (
                  <div>
                    <h4 className="font-medium mb-2">Revenue Model</h4>
                    <p className="text-sm text-muted-foreground">{enrichmentData.revenue_model}</p>
                  </div>
                )}

                {enrichmentData.customer_segments && enrichmentData.customer_segments.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Customer Segments</h4>
                    <div className="flex flex-wrap gap-2">
                      {enrichmentData.customer_segments.map((segment, index) => (
                        <Badge key={index} variant="outline">{segment}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Competitive Advantages */}
          {enrichmentData.competitive_advantages && enrichmentData.competitive_advantages.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Competitive Advantages
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {enrichmentData.competitive_advantages.map((advantage, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>{advantage}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Technology & Innovation */}
          {enrichmentData.technology_stack && enrichmentData.technology_stack.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5" />
                  Technology & Innovation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Technology Stack</h4>
                    <div className="flex flex-wrap gap-2">
                      {enrichmentData.technology_stack.map((tech, index) => (
                        <Badge key={index} variant="secondary">{tech}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Market Position */}
          {(enrichmentData.market_position || enrichmentData.growth_trajectory) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Market Position & Growth
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {enrichmentData.market_position && (
                  <div>
                    <h4 className="font-medium mb-2">Market Position</h4>
                    <p className="text-sm text-muted-foreground">{enrichmentData.market_position}</p>
                  </div>
                )}
                
                {enrichmentData.growth_trajectory && (
                  <div>
                    <h4 className="font-medium mb-2">Growth Trajectory</h4>
                    <p className="text-sm text-muted-foreground">{enrichmentData.growth_trajectory}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Team Information */}
          {enrichmentData.team_info && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Team & Leadership
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {enrichmentData.team_info.leadership_team && enrichmentData.team_info.leadership_team.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Leadership Team</h4>
                    <div className="space-y-2">
                      {enrichmentData.team_info.leadership_team.map((member, index) => (
                        <div key={index} className="bg-muted/30 rounded-lg p-3">
                          <div className="text-sm">
                            {typeof member === 'object' ? (
                              <div className="space-y-1">
                                {member.name && <div className="font-medium">{member.name}</div>}
                                {member.background && <div className="text-muted-foreground">{member.background}</div>}
                                {member.experience && <div className="text-muted-foreground">{member.experience}</div>}
                              </div>
                            ) : (
                              <div>{String(member)}</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {enrichmentData.team_info.total_employees && (
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>Total Employees: {enrichmentData.team_info.total_employees}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}

    </div>
  );
}