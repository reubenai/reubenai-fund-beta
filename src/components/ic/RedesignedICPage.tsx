import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  ChevronDown, 
  Users, 
  Vote, 
  Calendar, 
  FileText, 
  TrendingUp,
  Bot,
  Settings,
  RefreshCw
} from 'lucide-react';

import { useFund } from '@/contexts/FundContext';
import { useUserRole } from '@/hooks/useUserRole';
import { usePermissions } from '@/hooks/usePermissions';
import { useToast } from '@/hooks/use-toast';

import { NextStepSummaryBar } from './NextStepSummaryBar';
import { RoleBasedDealPipeline } from './RoleBasedDealPipeline';
import { LoadControlGuards } from './LoadControlGuards';
import { EnhancedReviewQueue } from './EnhancedReviewQueue';
import { SpecialistAIAgents } from './SpecialistAIAgents';
import { BulkAnalysisControls } from './BulkAnalysisControls';
import { ICMemoModal } from './ICMemoModal';
import { VotingModal } from './VotingModal';
import { ICMemoApprovalFlow } from './ICMemoApprovalFlow';
import { ICVotingAndDecisions } from './ICVotingAndDecisions';
import { EnhancedMemoPreviewModal } from './EnhancedMemoPreviewModal';
import { supabase } from '@/integrations/supabase/client';

interface Deal {
  id: string;
  company_name: string;
  industry?: string;
  deal_size?: number;
  valuation?: number;
  overall_score?: number;
  rag_status?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export default function RedesignedICPage() {
  const { selectedFund } = useFund();
  const { role, isSuperAdmin } = useUserRole();
  const { 
    canReviewMemos, 
    canVoteOnDeals, 
    canManageICMembers, 
    canTriggerAnalysis,
    canBatchOperations 
  } = usePermissions();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState('pipeline');
  const [selectedDeals, setSelectedDeals] = useState<string[]>([]);
  const [showMemoModal, setShowMemoModal] = useState(false);
  const [showVotingModal, setShowVotingModal] = useState(false);
  const [selectedDealForMemo, setSelectedDealForMemo] = useState<string | null>(null);
  const [isAIAgentsExpanded, setIsAIAgentsExpanded] = useState(false);
  const [degradationMode, setDegradationMode] = useState(false);
  
  // Memo preview modal state
  const [showMemoPreviewModal, setShowMemoPreviewModal] = useState(false);
  const [selectedDealForPreview, setSelectedDealForPreview] = useState<Deal | null>(null);
  const [loadingDealData, setLoadingDealData] = useState(false);

  // Always default to pipeline tab
  useEffect(() => {
    setActiveTab('pipeline');
  }, []);

  const fetchDealData = async (dealId: string): Promise<Deal | null> => {
    try {
      const { data, error } = await supabase
        .from('deals')
        .select('*')
        .eq('id', dealId)
        .single();

      if (error) throw error;
      return data as Deal;
    } catch (error) {
      console.error('Error fetching deal data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch deal data",
        variant: "destructive"
      });
      return null;
    }
  };

  const handleActionClick = (action: string) => {
    switch (action) {
      case 'reviews':
        setActiveTab('reviews');
        break;
      case 'voting':
        setActiveTab('voting');
        break;
      case 'meetings':
        setActiveTab('committee');
        break;
      case 'pipeline':
        setActiveTab('pipeline');
        break;
      default:
        break;
    }
  };

  const handleDealSelect = async (dealId: string) => {
    if (!dealId) return;
    
    setLoadingDealData(true);
    try {
      const dealData = await fetchDealData(dealId);
      if (dealData) {
        setSelectedDealForPreview(dealData);
        setShowMemoPreviewModal(true);
      }
    } catch (error) {
      console.error('Error handling deal selection:', error);
    } finally {
      setLoadingDealData(false);
    }
  };

  const handleCreateMemo = (dealId: string) => {
    setSelectedDealForMemo(dealId);
    setShowMemoModal(true);
  };

  const handleCostThresholdReached = () => {
    toast({
      title: "Cost Threshold Alert",
      description: "Analysis costs are approaching limits. Consider reducing frequency.",
      variant: "destructive"
    });
  };

  const handleDegradationMode = (enabled: boolean) => {
    setDegradationMode(enabled);
    if (enabled) {
      toast({
        title: "Degradation Mode Activated",
        description: "AI features are running in reduced capacity to control costs.",
        variant: "default"
      });
    }
  };

  if (!selectedFund) {
    return (
      <div className="flex-1 space-y-8 p-8">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-foreground">Investment Committee</h1>
          <p className="text-sm text-muted-foreground">Role-optimized IC workflow management</p>
        </div>
        
        <Card className="border-0 shadow-sm">
          <CardContent className="flex items-center justify-center py-16">
            <p className="text-muted-foreground">Please select a fund to access Investment Committee features</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header with role context */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Investment Committee</h1>
            <p className="text-sm text-muted-foreground">
              {selectedFund.name} • {role.replace('_', ' ').toUpperCase()} Dashboard
            </p>
          </div>
          <div className="flex items-center gap-2">
            {degradationMode && (
              <Badge variant="destructive" className="text-xs">
                Degraded Mode
              </Badge>
            )}
            <Badge variant="outline" className="text-xs">
              {role.replace('_', ' ').toUpperCase()}
            </Badge>
          </div>
        </div>
      </div>

      {/* Next Step Summary Bar - Always visible for action-oriented workflow */}
      <NextStepSummaryBar 
        fundId={selectedFund.id}
        onActionClick={handleActionClick}
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content Area */}
        <div className="lg:col-span-3 space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="h-12 w-auto bg-background border rounded-lg p-1">
              <TabsTrigger value="pipeline" className="h-10 px-6 rounded-md">
                <FileText className="h-4 w-4 mr-2" />
                Pipeline
              </TabsTrigger>

              <TabsTrigger value="reviews" className="h-10 px-6 rounded-md" disabled>
                <FileText className="h-4 w-4 mr-2" />
                Review Queue
                <Badge variant="secondary" className="ml-2 text-xs">Soon</Badge>
              </TabsTrigger>

              <TabsTrigger value="schedule" className="h-10 px-6 rounded-md" disabled>
                <Calendar className="h-4 w-4 mr-2" />
                Schedule IC
                <Badge variant="secondary" className="ml-2 text-xs">Soon</Badge>
              </TabsTrigger>

              <TabsTrigger value="voting" className="h-10 px-6 rounded-md" disabled>
                <Vote className="h-4 w-4 mr-2" />
                Voting & Decisions
                <Badge variant="secondary" className="ml-2 text-xs">Soon</Badge>
              </TabsTrigger>

              <TabsTrigger value="committee" className="h-10 px-6 rounded-md" disabled>
                <Users className="h-4 w-4 mr-2" />
                Committee
                <Badge variant="secondary" className="ml-2 text-xs">Soon</Badge>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pipeline" className="space-y-6">
              <RoleBasedDealPipeline
                fundId={selectedFund.id}
                onDealSelect={handleDealSelect}
                onCreateMemo={handleCreateMemo}
              />
            </TabsContent>


            <TabsContent value="schedule" className="space-y-6">
              <Card className="border-0 shadow-sm">
                <CardContent className="p-6">
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Schedule IC Session</h3>
                    <p className="text-muted-foreground">
                      Schedule and manage investment committee meetings
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="voting" className="space-y-6">
              <ICVotingAndDecisions fundId={selectedFund.id} userRole={role} />
            </TabsContent>

            <TabsContent value="committee" className="space-y-6">
              <Card className="border-0 shadow-sm">
                <CardContent className="p-6">
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">IC Committee</h3>
                    <p className="text-muted-foreground">
                      Committee member management and meeting scheduling
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Specialist AI Agents - Collapsible and only visible when deals are selected */}
          {(canTriggerAnalysis && selectedDeals.length > 0) && (
            <Collapsible open={isAIAgentsExpanded} onOpenChange={setIsAIAgentsExpanded}>
              <CollapsibleTrigger asChild>
                <Card className="border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Bot className="h-5 w-5" />
                        <span className="font-medium">Specialist AI Agents</span>
                        <Badge variant="secondary" className="text-xs">
                          {selectedDeals.length} deal{selectedDeals.length !== 1 ? 's' : ''} selected
                        </Badge>
                      </div>
                      <ChevronDown className={`h-4 w-4 transition-transform ${isAIAgentsExpanded ? 'rotate-180' : ''}`} />
                    </div>
                  </CardContent>
                </Card>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-4">
                    <div className="text-center py-4">
                      <Bot className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Specialist AI agents will analyze selected deals
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>
      </div>

      {/* Modals */}
      {showMemoModal && selectedDealForMemo && (
        <ICMemoModal
          isOpen={showMemoModal}
          dealId={selectedDealForMemo}
          fundId={selectedFund.id}
          onClose={() => {
            setShowMemoModal(false);
            setSelectedDealForMemo(null);
          }}
        />
      )}

      {/* Memo Preview Modal */}
      {showMemoPreviewModal && selectedDealForPreview && (
        <EnhancedMemoPreviewModal
          isOpen={showMemoPreviewModal}
          onClose={() => {
            setShowMemoPreviewModal(false);
            setSelectedDealForPreview(null);
          }}
          deal={selectedDealForPreview}
          fundId={selectedFund.id}
        />
      )}
    </div>
  );
}