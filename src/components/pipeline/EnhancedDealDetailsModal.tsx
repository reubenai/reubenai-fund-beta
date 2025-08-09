import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { DetailedAnalysisSection } from '@/components/analysis/DetailedAnalysisSection';
import { EnhancedCompanyDetails } from '@/components/company/EnhancedCompanyDetails';
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
import { DealNotesManager } from '@/components/notes/DealNotesManager';
import { EnhancedDealAnalysisTab } from './EnhancedDealAnalysisTab';
import { Deal as BaseDeal } from '@/hooks/usePipelineDeals';
import { EnhancedDealAnalysis } from '@/types/enhanced-deal-analysis';
import { useToast } from '@/hooks/use-toast';
import { useStrategyThresholds } from '@/hooks/useStrategyThresholds';
import { usePermissions } from '@/hooks/usePermissions';
import { supabase } from '@/integrations/supabase/client';

// Extend the Deal type to include enhanced_analysis
type Deal = BaseDeal & {
  enhanced_analysis?: EnhancedDealAnalysis;
};

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
  const { canViewActivities, canViewAnalysis, role, loading } = usePermissions();

  // Debug logging
  console.log('Deal Modal Permissions Debug:', {
    canViewActivities,
    canViewAnalysis,
    role,
    loading,
    userEmail: 'checking permissions'
  });

  useEffect(() => {
    if (deal && open) {
      loadEnhancedData();
    }
  }, [deal?.id, open]);

  const loadEnhancedData = async () => {
    if (!deal) return;

    try {
      // Load activity events with better error handling
      const { data: activities, error: activityError } = await supabase
        .from('activity_events')
        .select('*')
        .eq('deal_id', deal.id)
        .order('occurred_at', { ascending: false })
        .limit(20);

      if (activityError) {
        console.error('Error loading activity events:', activityError);
      } else if (activities) {
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

    } catch (error) {
      console.error('Error loading enhanced data:', error);
    }
  };

  const enrichCompanyData = async () => {
    if (!deal || isEnriching) return;

    setIsEnriching(true);
    try {
      // Use the reuben-orchestrator for comprehensive analysis
      const { data, error } = await supabase.functions.invoke('reuben-orchestrator', {
        body: { 
          dealId: deal.id,
          analysisType: 'comprehensive',
          includeDocuments: true,
          includeWebResearch: true,
          includeFinancialAnalysis: true,
          includeMarketAnalysis: true,
          includeCompetitiveAnalysis: true
        }
      });

      if (error) throw error;

      console.log('Enrichment response:', data);
      
      // Extract enhanced analysis data from the response
      const engineResults = data?.engines || {};
      const analysisResults = data?.analysis || {};
      
      // Create enhanced analysis object
      const enhancedAnalysis = {
        rubric_breakdown: analysisResults.rubric_breakdown || [],
        notes_intelligence: analysisResults.notes_intelligence || null,
        analysis_engines: engineResults,
        fund_type_analysis: analysisResults.fund_type_analysis || null,
        analysis_completeness: Object.keys(engineResults).length > 0 ? 85 : 30, // Calculate based on available data
        last_comprehensive_analysis: new Date().toISOString()
      };

      // Update deal with enhanced analysis data
      const { error: updateError } = await supabase
        .from('deals')
        .update({
          enhanced_analysis: enhancedAnalysis,
          description: data?.company_details?.description || deal.description,
          business_model: data?.company_details?.business_model || deal.business_model,
          employee_count: data?.company_details?.team_size || deal.employee_count,
          updated_at: new Date().toISOString()
        })
        .eq('id', deal.id);

      if (updateError) {
        console.error('Error updating deal with enhanced analysis:', updateError);
        throw updateError;
      }

      // Also store in company details state
      setCompanyDetails(data?.company_details || {});
      
      // Force refresh of the deal data
      setTimeout(() => {
        onDealUpdated?.();
        // Reload enhanced data after update
        loadEnhancedData();
      }, 1000);

      toast({
        title: "Analysis Complete",
        description: "Enhanced analysis data has been generated and stored",
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
          <TabsList className={`grid w-full ${
            canViewAnalysis && canViewActivities 
              ? 'grid-cols-6' 
              : canViewAnalysis || canViewActivities 
                ? 'grid-cols-5' 
                : 'grid-cols-4'
          }`}>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="company">Company Details</TabsTrigger>
            {canViewAnalysis && <TabsTrigger value="analysis">ReubenAI Analysis</TabsTrigger>}
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
            {canViewActivities && <TabsTrigger value="activity">Activity</TabsTrigger>}
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
            <EnhancedCompanyDetails deal={deal} />
          </TabsContent>

          {canViewAnalysis && (
            <TabsContent value="analysis" className="space-y-6">
              <EnhancedDealAnalysisTab deal={deal} />
            </TabsContent>
          )}

          <TabsContent value="documents" className="space-y-6">
            <DocumentManager
              dealId={deal.id}
              companyName={deal.company_name}
            />
          </TabsContent>

          <TabsContent value="notes" className="space-y-6">
            <DealNotesManager
              dealId={deal.id}
              companyName={deal.company_name}
            />
          </TabsContent>

          {canViewActivities && (
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
          )}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}