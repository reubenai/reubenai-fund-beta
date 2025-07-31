import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
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
  Trash2
} from 'lucide-react';
import { EditDealModal } from './EditDealModal';
import { DocumentManager } from '@/components/documents/DocumentManager';
import { useToast } from '@/hooks/use-toast';
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

interface DealDetailsModalProps {
  deal: Deal | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDealUpdated?: () => void;
  onDealDeleted?: () => void;
}

export function DealDetailsModal({ 
  deal, 
  open, 
  onOpenChange, 
  onDealUpdated, 
  onDealDeleted 
}: DealDetailsModalProps) {
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isGeneratingAnalysis, setIsGeneratingAnalysis] = useState(false);
  const [analysisData, setAnalysisData] = useState<any>(null);
  const { toast } = useToast();

  // Auto-generate analysis when modal opens
  useEffect(() => {
    if (deal && open) {
      generateAnalysis();
    }
  }, [deal?.id, open]);

  const generateAnalysis = async () => {
    if (!deal || isGeneratingAnalysis) return;

    setIsGeneratingAnalysis(true);
    try {
      const { data, error } = await supabase.functions.invoke('enhanced-deal-analysis', {
        body: { dealId: deal.id }
      });

      if (error) throw error;

      setAnalysisData(data);
      toast({
        title: "Analysis Generated",
        description: "Enhanced deal analysis has been completed",
      });
    } catch (error) {
      console.error('Error generating analysis:', error);
      toast({
        title: "Analysis Error",
        description: "Failed to generate analysis. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingAnalysis(false);
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

  const getScoreColor = (score?: number) => {
    if (!score) return 'bg-muted';
    if (score >= 85) return 'bg-green-500';
    if (score >= 70) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getRAGColor = (level?: string) => {
    switch (level?.toLowerCase()) {
      case 'green': return 'bg-green-500';
      case 'yellow': return 'bg-yellow-500';
      case 'red': return 'bg-red-500';
      default: return 'bg-muted';
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority?.toLowerCase()) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-muted';
    }
  };
  const handleDeleteDeal = async () => {
    if (!deal) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('deals')
        .delete()
        .eq('id', deal.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Deal deleted successfully",
      });

      onDealDeleted?.();
      onOpenChange(false);
      setShowDeleteDialog(false);
    } catch (error) {
      console.error('Error deleting deal:', error);
      toast({
        title: "Error",
        description: "Failed to delete deal",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditComplete = () => {
    onDealUpdated?.();
    setShowEditModal(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Building2 className="h-6 w-6" />
            {deal.company_name}
            {deal.overall_score && (
              <Badge variant="outline" className="ml-auto">
                AI Score: {deal.overall_score}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="company">Company Details</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="analysis">Analysis</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Key Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Key Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
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
                {deal.priority && (
                  <div>
                    <p className="text-sm text-muted-foreground">Priority</p>
                    <Badge className={`${getPriorityColor(deal.priority)} text-white`}>
                      {deal.priority}
                    </Badge>
                  </div>
                )}
                {deal.score_level && (
                  <div>
                    <p className="text-sm text-muted-foreground">RAG Level</p>
                    <Badge className={`${getRAGColor(deal.score_level)} text-white`}>
                      {deal.score_level}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Company Info
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
                  {deal.employee_count && (
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{deal.employee_count} employees</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Web Presence
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
                  {deal.crunchbase_url && (
                    <div className="flex items-center gap-2">
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                      <a 
                        href={deal.crunchbase_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline"
                      >
                        Crunchbase
                      </a>
                    </div>
                  )}
                  {deal.web_presence_confidence && (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Validation: {deal.web_presence_confidence}%</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="documents" className="space-y-6">
            <DocumentManager
              dealId={deal.id}
              companyName={deal.company_name}
            />
          </TabsContent>

          <TabsContent value="company" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Company Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {deal.description && (
                  <div>
                    <h4 className="font-medium mb-2">Description</h4>
                    <p className="text-sm text-muted-foreground">{deal.description}</p>
                  </div>
                )}
                
                <Separator />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {deal.business_model && (
                    <div>
                      <h4 className="font-medium mb-1">Business Model</h4>
                      <p className="text-sm text-muted-foreground">{deal.business_model}</p>
                    </div>
                  )}
                  {deal.primary_source && (
                    <div>
                      <h4 className="font-medium mb-1">Deal Source</h4>
                      <Badge variant="outline">{deal.primary_source}</Badge>
                    </div>
                  )}
                  {deal.company_validation_status && (
                    <div>
                      <h4 className="font-medium mb-1">Validation Status</h4>
                      <Badge variant="outline">{deal.company_validation_status}</Badge>
                    </div>
                  )}
                  {deal.source_confidence_score && (
                    <div>
                      <h4 className="font-medium mb-1">Source Confidence</h4>
                      <Badge variant="outline">{deal.source_confidence_score}%</Badge>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analysis" className="space-y-6">
            {isGeneratingAnalysis ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5 animate-spin" />
                    Generating Analysis...
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">AI is analyzing this deal opportunity...</p>
                </CardContent>
              </Card>
            ) : analysisData ? (
              <div className="space-y-6">
                {/* Executive Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5" />
                      Executive Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed">{analysisData.executive_summary}</p>
                  </CardContent>
                </Card>

                {/* Analysis Categories */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Investment Thesis Alignment */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center justify-between">
                        Investment Thesis Alignment
                        <Badge className={`${getScoreColor(analysisData.investment_thesis_alignment.score)} text-white`}>
                          {analysisData.investment_thesis_alignment.score}/100
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm text-muted-foreground">{analysisData.investment_thesis_alignment.analysis}</p>
                      {analysisData.investment_thesis_alignment.key_points?.length > 0 && (
                        <div>
                          <h5 className="text-sm font-medium mb-1">Key Points:</h5>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            {analysisData.investment_thesis_alignment.key_points.map((point: string, i: number) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="text-primary">•</span>
                                <span>{point}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Market Attractiveness */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center justify-between">
                        Market Attractiveness
                        <Badge className={`${getScoreColor(analysisData.market_attractiveness.score)} text-white`}>
                          {analysisData.market_attractiveness.score}/100
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm text-muted-foreground">{analysisData.market_attractiveness.analysis}</p>
                      <div className="space-y-2 text-sm">
                        <div><span className="font-medium">Market Size:</span> {analysisData.market_attractiveness.market_size}</div>
                        <div><span className="font-medium">Growth:</span> {analysisData.market_attractiveness.growth_potential}</div>
                        <div><span className="font-medium">Competition:</span> {analysisData.market_attractiveness.competitive_landscape}</div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Product Strength & IP */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center justify-between">
                        Product Strength & IP
                        <Badge className={`${getScoreColor(analysisData.product_strength_ip.score)} text-white`}>
                          {analysisData.product_strength_ip.score}/100
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm text-muted-foreground">{analysisData.product_strength_ip.analysis}</p>
                      {analysisData.product_strength_ip.competitive_advantages?.length > 0 && (
                        <div>
                          <h5 className="text-sm font-medium mb-1">Competitive Advantages:</h5>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            {analysisData.product_strength_ip.competitive_advantages.map((adv: string, i: number) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="text-primary">•</span>
                                <span>{adv}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <div className="space-y-1 text-sm">
                        <div><span className="font-medium">IP Assessment:</span> {analysisData.product_strength_ip.ip_assessment}</div>
                        <div><span className="font-medium">Technology Moat:</span> {analysisData.product_strength_ip.technology_moat}</div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Financial Feasibility */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center justify-between">
                        Financial Feasibility
                        <Badge className={`${getScoreColor(analysisData.financial_feasibility.score)} text-white`}>
                          {analysisData.financial_feasibility.score}/100
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm text-muted-foreground">{analysisData.financial_feasibility.analysis}</p>
                      <div className="space-y-2 text-sm">
                        <div><span className="font-medium">Revenue Model:</span> {analysisData.financial_feasibility.revenue_model}</div>
                        <div><span className="font-medium">Unit Economics:</span> {analysisData.financial_feasibility.unit_economics}</div>
                        <div><span className="font-medium">Funding Needs:</span> {analysisData.financial_feasibility.funding_requirements}</div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Founder & Team Strength */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Founder & Team Strength
                      </span>
                      <Badge className={`${getScoreColor(analysisData.founder_team_strength.score)} text-white`}>
                        {analysisData.founder_team_strength.score}/100
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">{analysisData.founder_team_strength.analysis}</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <h5 className="font-medium mb-1">Experience</h5>
                        <p className="text-muted-foreground">{analysisData.founder_team_strength.experience_assessment}</p>
                      </div>
                      <div>
                        <h5 className="font-medium mb-1">Team Composition</h5>
                        <p className="text-muted-foreground">{analysisData.founder_team_strength.team_composition}</p>
                      </div>
                      <div>
                        <h5 className="font-medium mb-1">Execution Capability</h5>
                        <p className="text-muted-foreground">{analysisData.founder_team_strength.execution_capability}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Recommendation & Risk Factors */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Overall Recommendation</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{analysisData.overall_recommendation}</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        Risk Factors
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {analysisData.risk_factors?.map((risk: string, i: number) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-red-500">•</span>
                            <span>{risk}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>

                {/* Next Steps */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Recommended Next Steps</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {analysisData.next_steps?.map((step: string, i: number) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-primary">•</span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5" />
                    Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button onClick={generateAnalysis} disabled={isGeneratingAnalysis}>
                    {isGeneratingAnalysis ? 'Generating...' : 'Generate Analysis'}
                  </Button>
                  {deal.overall_score && (
                    <div>
                      <h4 className="font-medium mb-2">Overall AI Score</h4>
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${getScoreColor(deal.overall_score)}`} />
                        <span className="font-semibold">{deal.overall_score}/100</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="activity" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Deal Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {deal.next_action && (
                  <div>
                    <h4 className="font-medium mb-2">Next Action</h4>
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm">{deal.next_action}</span>
                    </div>
                  </div>
                )}

                <Separator />

                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium mb-1">Notes</h4>
                    <p className="text-sm text-muted-foreground">
                      {deal.notes_count || 0} notes recorded
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium mb-1">Created</h4>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(deal.created_at), 'PPp')}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium mb-1">Last Updated</h4>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(deal.updated_at), 'PPp')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-between pt-4">
          <div className="space-x-2">
            <Button variant="outline" size="sm">
              Add Note
            </Button>
            <Button variant="outline" size="sm">
              Schedule Follow-up
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowDeleteDialog(true)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Delete
            </Button>
          </div>
          <div className="space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowEditModal(true)}
            >
              <Edit className="w-4 h-4 mr-1" />
              Edit Deal
            </Button>
          </div>
        </div>
      </DialogContent>

      {/* Edit Modal */}
      <EditDealModal
        deal={deal}
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        onUpdateComplete={handleEditComplete}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Deal</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deal.company_name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteDeal}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Deleting...' : 'Delete Deal'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}