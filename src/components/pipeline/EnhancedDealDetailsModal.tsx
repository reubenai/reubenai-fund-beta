import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { 
  Building2, 
  MapPin, 
  DollarSign, 
  Users, 
  Globe, 
  Linkedin, 
  ExternalLink,
  TrendingUp,
  Clock,
  AlertCircle,
  CheckCircle,
  Brain,
  Target,
  User,
  Edit,
  Activity,
  FileText,
  Zap,
  Eye,
  RefreshCw
} from 'lucide-react';
import { DocumentManager } from '@/components/documents/DocumentManager';
import { EnhancedDocumentAnalysis } from '@/components/documents/EnhancedDocumentAnalysis';
import { useToast } from '@/hooks/use-toast';
import { useStrategyThresholds } from '@/hooks/useStrategyThresholds';
import { supabase } from '@/integrations/supabase/client';

interface Deal {
  id: string;
  company_name: string;
  industry?: string;
  location?: string;
  deal_size?: number;
  valuation?: number;
  currency?: string;
  founder?: string;
  employee_count?: number;
  business_model?: string;
  website?: string;
  linkedin_url?: string;
  crunchbase_url?: string;
  primary_source?: string;
  web_presence_confidence?: number;
  source_confidence_score?: number;
  company_validation_status?: string;
  rag_reasoning?: any;
  rag_confidence?: number;
  next_action?: string;
  priority?: string;
  overall_score?: number;
  score_level?: string;
  status?: string;
  description?: string;
  created_at: string;
  updated_at: string;
  notes_count?: number;
}

interface EnhancedDealDetailsModalProps {
  deal: Deal | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDealUpdated?: () => void;
}

interface ActivityEvent {
  id: string;
  title: string;
  description: string;
  activity_type: string;
  occurred_at: string;
  user_id: string;
  context_data?: any;
}

interface CompanyDetails {
  description?: string;
  business_model?: string;
  revenue_model?: string;
  customer_segments?: string[];
  competitive_advantages?: string[];
  funding_history?: any[];
  team_size?: number;
  key_partnerships?: string[];
  technology_stack?: string[];
  ip_portfolio?: string[];
}

export function EnhancedDealDetailsModal({ 
  deal, 
  open, 
  onOpenChange, 
  onDealUpdated
}: EnhancedDealDetailsModalProps) {
  const [isEnriching, setIsEnriching] = useState(false);
  const [companyDetails, setCompanyDetails] = useState<CompanyDetails | null>(null);
  const [activityEvents, setActivityEvents] = useState<ActivityEvent[]>([]);
  const [analysisData, setAnalysisData] = useState<any>(null);
  const { toast } = useToast();
  const { getRAGCategory } = useStrategyThresholds();

  useEffect(() => {
    if (deal && open) {
      loadEnhancedData();
    }
  }, [deal?.id, open]);

  const loadEnhancedData = async () => {
    if (!deal) return;

    try {
      // Load activity events
      const { data: activities, error: activityError } = await supabase
        .from('activity_events')
        .select('*')
        .eq('deal_id', deal.id)
        .order('occurred_at', { ascending: false })
        .limit(20);

      if (!activityError && activities) {
        setActivityEvents(activities);
      }

      // Load analysis data
      const { data: analysis, error: analysisError } = await supabase
        .from('deal_analyses')
        .select('*')
        .eq('deal_id', deal.id)
        .order('analyzed_at', { ascending: false })
        .limit(1);

      if (!analysisError && analysis && analysis.length > 0) {
        setAnalysisData(analysis[0]);
      }

      // Check if we need to enrich data
      if (!companyDetails) {
        enrichCompanyData();
      }
    } catch (error) {
      console.error('Error loading enhanced data:', error);
    }
  };

  const enrichCompanyData = async () => {
    if (!deal || isEnriching) return;

    setIsEnriching(true);
    try {
      // Use the enhanced deal analysis engine for comprehensive enrichment
      const { data, error } = await supabase.functions.invoke('enhanced-deal-analysis', {
        body: { 
          dealId: deal.id,
          enrichmentLevel: 'comprehensive',
          includeWebResearch: true,
          includeFinancialAnalysis: true,
          includeMarketAnalysis: true,
          includeCompetitiveAnalysis: true
        }
      });

      if (error) throw error;

      const enrichedData = data?.enrichment || data;
      setCompanyDetails(enrichedData?.company_details || {});
      
      // Update deal with enriched information
      if (enrichedData) {
        const { error: updateError } = await supabase
          .from('deals')
          .update({
            description: enrichedData.company_details?.description || deal.description,
            business_model: enrichedData.company_details?.business_model || deal.business_model,
            employee_count: enrichedData.company_details?.team_size || deal.employee_count,
            updated_at: new Date().toISOString()
          })
          .eq('id', deal.id);

        if (!updateError) {
          onDealUpdated?.();
        }
      }

      toast({
        title: "Company Data Enriched",
        description: "Enhanced company information has been loaded",
      });
    } catch (error) {
      console.error('Error enriching company data:', error);
      toast({
        title: "Enrichment Error",
        description: "Failed to enrich company data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsEnriching(false);
    }
  };

  if (!deal) return null;

  const formatAmount = (amount?: number, currency: string = 'USD') => {
    if (!amount) return 'Not specified';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      notation: amount >= 1000000 ? 'compact' : 'standard',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const rag = getRAGCategory(deal.overall_score);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Building2 className="h-6 w-6" />
            {deal.company_name}
            <Badge variant="outline" className={rag.color}>
              {rag.label}
            </Badge>
            {deal.overall_score && (
              <Badge variant="secondary">
                Score: {deal.overall_score}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="company">
              Company Details
              {isEnriching && (
                <div className="ml-2 animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
              )}
            </TabsTrigger>
            <TabsTrigger value="analysis">AI Analysis</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Key Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Key Metrics
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={enrichCompanyData}
                    disabled={isEnriching}
                    className="ml-auto"
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${isEnriching ? 'animate-spin' : ''}`} />
                    Enrich Data
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Deal Size</p>
                  <p className="font-semibold">{formatAmount(deal.deal_size, deal.currency)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Valuation</p>
                  <p className="font-semibold">{formatAmount(deal.valuation, deal.currency)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant="outline">{deal.status || 'Unknown'}</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Priority</p>
                  <Badge variant={deal.priority === 'high' ? 'destructive' : 'secondary'}>
                    {deal.priority || 'Medium'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Enhanced Company Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Company Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {deal.industry && (
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{deal.industry}</span>
                    </div>
                  )}
                  {deal.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{deal.location}</span>
                    </div>
                  )}
                  {deal.founder && (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{deal.founder}</span>
                    </div>
                  )}
                  {(deal.employee_count || companyDetails?.team_size) && (
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {companyDetails?.team_size || deal.employee_count} employees
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Digital Presence
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {deal.website && (
                    <div className="flex items-center gap-2">
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                      <a 
                        href={deal.website.startsWith('http') ? deal.website : `https://${deal.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline"
                      >
                        {deal.website.replace(/^https?:\/\//, '')}
                      </a>
                    </div>
                  )}
                  {deal.linkedin_url && (
                    <div className="flex items-center gap-2">
                      <Linkedin className="h-4 w-4 text-muted-foreground" />
                      <a 
                        href={deal.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline"
                      >
                        LinkedIn Profile
                      </a>
                    </div>
                  )}
                  {deal.web_presence_confidence && (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Web Validation: {deal.web_presence_confidence}%</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Description */}
            {(deal.description || companyDetails?.description) && (
              <Card>
                <CardHeader>
                  <CardTitle>Company Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {companyDetails?.description || deal.description}
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="company" className="space-y-6">
            {/* Business Model */}
            <Card>
              <CardHeader>
                <CardTitle>Business Model & Strategy</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {(deal.business_model || companyDetails?.business_model) && (
                  <div>
                    <h4 className="font-medium mb-2">Business Model</h4>
                    <p className="text-sm text-muted-foreground">
                      {companyDetails?.business_model || deal.business_model}
                    </p>
                  </div>
                )}
                
                {companyDetails?.revenue_model && (
                  <div>
                    <h4 className="font-medium mb-2">Revenue Model</h4>
                    <p className="text-sm text-muted-foreground">{companyDetails.revenue_model}</p>
                  </div>
                )}

                {companyDetails?.customer_segments && (
                  <div>
                    <h4 className="font-medium mb-2">Customer Segments</h4>
                    <div className="flex flex-wrap gap-2">
                      {companyDetails.customer_segments.map((segment, index) => (
                        <Badge key={index} variant="secondary">{segment}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Competitive Advantages */}
            {companyDetails?.competitive_advantages && (
              <Card>
                <CardHeader>
                  <CardTitle>Competitive Advantages</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {companyDetails.competitive_advantages.map((advantage, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>{advantage}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Technology & IP */}
            {(companyDetails?.technology_stack || companyDetails?.ip_portfolio) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {companyDetails?.technology_stack && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Technology Stack</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {companyDetails.technology_stack.map((tech, index) => (
                          <Badge key={index} variant="outline">{tech}</Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {companyDetails?.ip_portfolio && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Intellectual Property</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-1">
                        {companyDetails.ip_portfolio.map((ip, index) => (
                          <li key={index} className="text-sm">{ip}</li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="analysis" className="space-y-6">
            <EnhancedDocumentAnalysis 
              dealId={deal.id}
              companyName={deal.company_name}
            />
          </TabsContent>

          <TabsContent value="documents" className="space-y-6">
            <DocumentManager
              dealId={deal.id}
              companyName={deal.company_name}
            />
          </TabsContent>

          <TabsContent value="activity" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                {activityEvents.length > 0 ? (
                  <div className="space-y-4">
                    {activityEvents.map((event) => (
                      <div key={event.id} className="flex items-start gap-3 pb-4 border-b border-border last:border-0">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                          <Activity className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{event.title}</p>
                          <p className="text-sm text-muted-foreground">{event.description}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(event.occurred_at), 'MMM d, yyyy at h:mm a')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Clock className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                    <p className="text-sm text-muted-foreground">No activity recorded yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}