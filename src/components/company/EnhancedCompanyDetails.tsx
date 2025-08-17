import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Building2, 
  Target, 
  Calendar,
  Users, 
  MapPin, 
  Globe, 
  FileText, 
  User, 
  Mail, 
  DollarSign,
  TrendingUp
} from 'lucide-react';

interface CompanyDetailsProps {
  deal: {
    id: string;
    company_name: string;
    website?: string;
    industry?: string;
    location?: string;
    description?: string;
    deal_size?: number;
    valuation?: number;
  };
}

interface CompanyEnrichmentData {
  business_model?: string;
  revenue_model?: string;
  competitive_advantages?: string | string[];
  technology_stack?: string | string[];
  market_position?: string;
  growth_trajectory?: string;
  team_info?: {
    founders?: string | any[];
    key_employees?: string;
    team_size?: string;
  };
}

export function EnhancedCompanyDetails({ deal }: CompanyDetailsProps) {
  const [enrichmentData, setEnrichmentData] = useState<CompanyEnrichmentData | null>(null);
  const [isEnriching, setIsEnriching] = useState(false);
  const [hasEnriched, setHasEnriched] = useState(false);
  const { toast } = useToast();

  // Check for existing analysis data
  const checkExistingAnalysis = async () => {
    try {
      const { data, error } = await supabase
        .from('deal_analyses')
        .select('engine_results')
        .eq('deal_id', deal.id)
        .order('updated_at', { ascending: false })
        .limit(1);

      if (error) throw error;

      if (data && data.length > 0 && data[0].engine_results) {
        const results = data[0].engine_results as any;
        
        // Map engine results to enrichment data  
        const mappedData: CompanyEnrichmentData = {
          business_model: results?.business_model || results?.company_enrichment?.business_model,
          revenue_model: results?.revenue_model || results?.company_enrichment?.revenue_model,
          competitive_advantages: results?.competitive_advantages || results?.company_enrichment?.competitive_advantages,
          technology_stack: results?.technology_stack || results?.company_enrichment?.technology_stack,
          market_position: results?.market_position || results?.company_enrichment?.market_position,
          growth_trajectory: results?.growth_trajectory || results?.company_enrichment?.growth_trajectory,
          team_info: results?.team_info || results?.company_enrichment?.team_info
        };

        setEnrichmentData(mappedData);
        setHasEnriched(true);
      }
    } catch (error) {
      console.error('Error checking existing analysis:', error);
    }
  };

  useEffect(() => {
    checkExistingAnalysis();
  }, [deal.id]);

  // Silent background enrichment
  const enrichCompanyData = async () => {
    if (isEnriching) return;
    
    try {
      setIsEnriching(true);
      
      const { data, error } = await supabase.functions.invoke('enhanced-deal-analysis', {
        body: {
          deal_id: deal.id,
          analysis_type: 'comprehensive'
        }
      });

      if (error) throw error;

      if (data && data.analysis_results) {
        const results = data.analysis_results;
        
        const mappedData: CompanyEnrichmentData = {
          business_model: results.business_model || results.company_enrichment?.business_model,
          revenue_model: results.revenue_model || results.company_enrichment?.revenue_model,
          competitive_advantages: results.competitive_advantages || results.company_enrichment?.competitive_advantages,
          technology_stack: results.technology_stack || results.company_enrichment?.technology_stack,
          market_position: results.market_position || results.company_enrichment?.market_position,
          growth_trajectory: results.growth_trajectory || results.company_enrichment?.growth_trajectory,
          team_info: results.team_info || results.company_enrichment?.team_info
        };

        setEnrichmentData(mappedData);
        setHasEnriched(true);
      }
    } catch (error) {
      console.error('Company enrichment failed:', error);
    } finally {
      setIsEnriching(false);
    }
  };

  // Auto-trigger silent background enrichment when component loads
  useEffect(() => {
    if (!hasEnriched && !isEnriching) {
      enrichCompanyData();
    }
  }, [deal.id]);

  return (
    <div className="space-y-6">
      {/* Executive Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Executive Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div className="text-sm text-muted-foreground">Capital Raised to Date</div>
              <div className="font-semibold">
                {deal.deal_size ? `$${deal.deal_size.toLocaleString()}` : 'Not specified'}
              </div>
            </div>
            
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <DollarSign className="h-5 w-5 text-blue-600" />
              </div>
              <div className="text-sm text-muted-foreground">Current Round</div>
              <div className="font-semibold">Not specified</div>
            </div>
            
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
              <div className="text-sm text-muted-foreground">Valuation</div>
              <div className="font-semibold">
                {deal.valuation ? `$${deal.valuation.toLocaleString()}` : 'Not specified'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Company Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">COMPANY DETAILS</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <Target className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div className="flex-1">
                <div className="text-sm font-medium">Industry</div>
                <div className="text-sm text-muted-foreground">
                  {deal.industry || 'Not specified'}
                </div>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Building2 className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div className="flex-1">
                <div className="text-sm font-medium">Company Stage</div>
                <div className="text-sm text-muted-foreground">Not specified</div>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div className="flex-1">
                <div className="text-sm font-medium">Founded</div>
                <div className="text-sm text-muted-foreground">Not specified</div>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Users className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div className="flex-1">
                <div className="text-sm font-medium">Team Size</div>
                <div className="text-sm text-muted-foreground">Not specified</div>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div className="flex-1">
                <div className="text-sm font-medium">Headquarters</div>
                <div className="text-sm text-muted-foreground">
                  {deal.location || 'Not specified'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Digital Presence */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">DIGITAL PRESENCE</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <Globe className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div className="flex-1">
                <div className="text-sm font-medium">Website</div>
                <div className="text-sm">
                  {deal.website ? (
                    <a 
                      href={deal.website.startsWith('http') ? deal.website : `https://${deal.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-600 hover:underline"
                    >
                      {deal.website}
                    </a>
                  ) : (
                    <span className="text-muted-foreground">Not specified</span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Building2 className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div className="flex-1">
                <div className="text-sm font-medium">LinkedIn</div>
                <div className="text-sm text-muted-foreground">Not specified</div>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <FileText className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div className="flex-1">
                <div className="text-sm font-medium">Crunchbase</div>
                <div className="text-sm text-muted-foreground">Not specified</div>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Target className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div className="flex-1">
                <div className="text-sm font-medium">Business Model</div>
                <div className="text-sm text-muted-foreground">
                  {enrichmentData?.business_model || 'Not specified'}
                </div>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Users className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div className="flex-1">
                <div className="text-sm font-medium">Target Market</div>
                <div className="text-sm text-muted-foreground">Not specified</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Leadership & Funding */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">LEADERSHIP & FUNDING</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            
            <div className="flex items-start gap-3">
              <Mail className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div className="flex-1">
                <div className="text-sm font-medium">Founder Email</div>
                <div className="text-sm text-muted-foreground">Not specified</div>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Users className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div className="flex-1">
                <div className="text-sm font-medium">Co-Founders</div>
                <div className="text-sm text-muted-foreground">Not specified</div>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <DollarSign className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div className="flex-1">
                <div className="text-sm font-medium">Funding Stage</div>
                <div className="text-sm text-muted-foreground">Not specified</div>
              </div>
            </div>
            
          </CardContent>
        </Card>
      </div>
    </div>
  );
}