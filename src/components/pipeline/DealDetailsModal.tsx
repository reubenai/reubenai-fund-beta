import React from 'react';
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
  User
} from 'lucide-react';

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
}

export function DealDetailsModal({ deal, open, onOpenChange }: DealDetailsModalProps) {
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
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="company">Company Details</TabsTrigger>
            <TabsTrigger value="analysis">AI Analysis</TabsTrigger>
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
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  AI Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {deal.overall_score && (
                  <div>
                    <h4 className="font-medium mb-2">Overall AI Score</h4>
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${getScoreColor(deal.overall_score)}`} />
                      <span className="font-semibold">{deal.overall_score}/100</span>
                    </div>
                  </div>
                )}

                {deal.rag_reasoning && (
                  <div>
                    <h4 className="font-medium mb-2">AI Reasoning</h4>
                    <div className="bg-muted p-3 rounded-lg">
                      <pre className="text-sm whitespace-pre-wrap">
                        {typeof deal.rag_reasoning === 'string' 
                          ? deal.rag_reasoning 
                          : JSON.stringify(deal.rag_reasoning, null, 2)
                        }
                      </pre>
                    </div>
                  </div>
                )}

                {deal.rag_confidence && (
                  <div>
                    <h4 className="font-medium mb-2">Analysis Confidence</h4>
                    <Badge variant="outline">{deal.rag_confidence}%</Badge>
                  </div>
                )}
              </CardContent>
            </Card>
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
          </div>
          <div className="space-x-2">
            <Button variant="outline" size="sm">
              Edit Deal
            </Button>
            <Button size="sm">
              Run AI Analysis
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}