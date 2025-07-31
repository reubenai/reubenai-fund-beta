import React, { useState } from 'react';
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
  const { toast } = useToast();

  const handleGenerateMemo = async (deal: Deal) => {
    setIsGenerating(true);
    try {
      toast({
        title: "Generating IC Memo",
        description: "Creating comprehensive memo with AI analysis...",
      });

      // TODO: Call ai-memo-generator Edge Function
      // const result = await supabase.functions.invoke('ai-memo-generator', {
      //   body: { dealId: deal.id, fundId }
      // });

      // Simulate memo generation
      setTimeout(() => {
        const mockMemo = {
          id: `memo-${deal.id}`,
          dealId: deal.id,
          company: deal.company_name,
          founder: deal.founder || 'Unknown',
          amount: deal.deal_size ? `$${deal.deal_size.toLocaleString()}` : 'TBD',
          stage: 'Series A',
          sector: deal.industry || 'Technology',
          valuation: deal.valuation ? `$${deal.valuation.toLocaleString()}` : 'TBD',
          status: 'draft' as const,
          createdByAi: true,
          createdDate: new Date().toISOString(),
          template: 'standard',
          dealData: deal,
          content: {
            opportunity_overview: `Investment opportunity in ${deal.company_name}, a ${deal.industry || 'technology'} company...`,
            executive_summary: `${deal.company_name} represents a compelling investment opportunity...`,
            company_overview: deal.description || `${deal.company_name} is an innovative company...`,
            market_opportunity: `The market for ${deal.industry || 'technology'} solutions is experiencing significant growth...`,
            product_service: `${deal.company_name} offers innovative solutions...`,
            business_model: `The company operates on a sustainable business model...`,
            competitive_landscape: `In the competitive landscape...`,
            management_team: `Led by ${deal.founder || 'experienced leadership'}...`,
            financial_analysis: `Financial projections indicate...`,
            investment_terms: `Proposed investment terms...`,
            risks_mitigants: `Key risks and mitigation strategies...`,
            exit_strategy: `Potential exit opportunities...`,
            recommendation: deal.rag_status === 'exciting' ? 'Strong recommendation for investment' : 
                           deal.rag_status === 'promising' ? 'Conditional recommendation pending due diligence' :
                           'Requires further development before investment consideration',
            appendices: `Supporting documentation and analysis...`
          }
        };

        setGeneratedMemo(mockMemo);
        setShowMemoEditor(true);
        setIsGenerating(false);
        
        toast({
          title: "Memo Generated",
          description: "AI-powered memo has been created successfully",
        });
      }, 3000);

    } catch (error) {
      setIsGenerating(false);
      toast({
        title: "Generation Failed",
        description: "Failed to generate memo. Please try again.",
        variant: "destructive"
      });
    }
  };

  const mockDeals: Deal[] = [
    {
      id: '1',
      company_name: 'CleanTech Solutions',
      founder: 'Michael Brown',
      deal_size: 2500000,
      valuation: 15000000,
      status: 'Decision',
      industry: 'CleanTech',
      location: 'Austin, TX',
      description: 'Solar energy optimization platform for industrial applications',
      overall_score: 72,
      rag_status: 'promising'
    },
    {
      id: '2',
      company_name: 'DataFlow AI',
      founder: 'Sarah Chen',
      deal_size: 5000000,
      valuation: 25000000,
      status: 'Due Diligence',
      industry: 'AI/ML',
      location: 'San Francisco, CA',
      description: 'AI-powered data analytics platform for enterprise customers',
      overall_score: 85,
      rag_status: 'exciting'
    }
  ];

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
                Select a deal below to generate a comprehensive Investment Committee memo using our AI analysis engine. 
                The memo will include all 14 standard sections with insights from our deal analysis.
              </p>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium">Ready for IC Review</h4>
              
              {mockDeals.map((deal) => (
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
                        <div className="text-sm text-muted-foreground">AI Score</div>
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
                        onClick={() => handleGenerateMemo(deal)}
                        disabled={isGenerating}
                        className="gap-2"
                      >
                        {isGenerating ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Brain className="w-4 h-4" />
                            Generate Memo
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {mockDeals.length === 0 && (
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
          console.log('Saving memo:', memo);
          toast({
            title: "Memo Saved",
            description: "Investment memo has been saved successfully",
          });
        }}
      />
    </>
  );
};