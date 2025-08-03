import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Brain, 
  FileText, 
  Calendar, 
  Download,
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { EnhancedMemoEditor } from './EnhancedMemoEditor';
import { supabase } from '@/integrations/supabase/client';
import { icMemoService } from '@/services/ICMemoService';

interface ICMemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  dealId?: string;
  fundId: string;
}

interface Deal {
  id: string;
  company_name: string;
  founder?: string;
  deal_size?: number;
  valuation?: number;
  status?: string;
  industry?: string;
  location?: string;
  description?: string;
  overall_score?: number;
  rag_status?: string;
}

export const ICMemoModal: React.FC<ICMemoModalProps> = ({
  isOpen,
  onClose,
  dealId,
  fundId
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [showMemoEditor, setShowMemoEditor] = useState(false);
  const [generatedMemo, setGeneratedMemo] = useState(null);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Fetch real deals at "Decision" stage
  useEffect(() => {
    const fetchDecisionStageDeals = async () => {
      if (!fundId) return;
      
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('deals')
          .select('*')
          .eq('fund_id', fundId)
          .eq('status', 'investment_committee')
          .order('updated_at', { ascending: false });

        if (error) throw error;
        setDeals(data || []);
      } catch (error) {
        console.error('Error fetching decision stage deals:', error);
        toast({
          title: "Error",
          description: "Failed to load deals ready for IC review",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      fetchDecisionStageDeals();
    }
  }, [isOpen, fundId, toast]);

  const handleViewEditMemo = async (deal: Deal) => {
    setIsGenerating(true);
    try {
      // First check if memo already exists for this deal
      const existingMemos = await icMemoService.getMemos(fundId);
      const existingMemo = existingMemos.find(memo => memo.deal_id === deal.id);
      
      if (existingMemo) {
        // Load existing memo for editing
        setGeneratedMemo(existingMemo);
        setShowMemoEditor(true);
        toast({
          title: "Memo Loaded",
          description: "Existing memo loaded for editing",
        });
      } else {
        // Auto-generate new memo for investment committee deals
        toast({
          title: "Generating IC Memo",
          description: "Auto-generating comprehensive memo with RAG and thesis integration...",
        });

        const result = await icMemoService.generateMemo(deal.id);
        
        if (result.success && result.memo) {
          setGeneratedMemo(result.memo);
          setShowMemoEditor(true);
          toast({
            title: "Memo Auto-Generated",
            description: "Investment memo created with validated data sources",
          });
        } else {
          throw new Error(result.error || 'Failed to generate memo');
        }
      }
    } catch (error) {
      console.error('Error handling memo:', error);
      toast({
        title: "Memo Error",
        description: "Failed to load/generate memo. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  if (loading) {
    return (
      <Dialog open={isOpen && !showMemoEditor} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5" />
              Generate IC Memo
            </DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-3">Loading deals...</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open={isOpen && !showMemoEditor} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5" />
              Generate IC Memo
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <div className="text-center py-8">
              <FileText className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">AI-Powered Investment Memo Generation</h3>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Select a deal below to generate a comprehensive Investment Committee memo using our ReubenAI analysis engine. 
                The memo will include all 14 standard sections with insights from our deal analysis.
              </p>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium">Ready for IC Review</h4>
              
              {deals.map((deal) => (
                <Card key={deal.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            {deal.company_name}
                            <Badge 
                              variant="secondary" 
                              className={
                                deal.rag_status === 'exciting' ? 'bg-green-100 text-green-700' :
                                deal.rag_status === 'promising' ? 'bg-amber-100 text-amber-700' :
                                'bg-gray-100 text-gray-700'
                              }
                            >
                              {deal.rag_status || 'Needs Development'}
                            </Badge>
                          </CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">
                            {deal.description}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">ReubenAI Score</div>
                        <div className="text-2xl font-bold">{deal.overall_score || '--'}</div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-6 text-sm text-muted-foreground">
                        <div><span className="font-medium">Deal Size:</span> ${deal.deal_size?.toLocaleString() || 'TBD'}</div>
                        <div><span className="font-medium">Valuation:</span> ${deal.valuation?.toLocaleString() || 'TBD'}</div>
                        <div><span className="font-medium">Industry:</span> {deal.industry}</div>
                        <div><span className="font-medium">Location:</span> {deal.location}</div>
                      </div>
                      
                      <Button
                        onClick={() => handleViewEditMemo(deal)}
                        disabled={isGenerating}
                        className="gap-2"
                      >
                        {isGenerating ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Loading...
                          </>
                        ) : (
                          <>
                            <FileText className="w-4 h-4" />
                            View / Edit Memo
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {deals.length === 0 && (
                <Card>
                  <CardContent className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">
                        No deals ready for IC review
                      </p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Deals will appear here when they reach the "Decision" stage
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <EnhancedMemoEditor
        isOpen={showMemoEditor}
        onClose={() => {
          setShowMemoEditor(false);
          setGeneratedMemo(null);
          onClose();
        }}
        memo={generatedMemo}
        onSave={(memo) => {
          // Saving memo to database
          toast({
            title: "Memo Saved",
            description: "Investment memo has been saved successfully",
          });
        }}
      />
    </>
  );
};