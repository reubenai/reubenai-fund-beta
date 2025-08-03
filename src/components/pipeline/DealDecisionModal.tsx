import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { dealDecisionService, CreateDecisionRequest } from '@/services/DealDecisionService';
import { CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';

interface Deal {
  id: string;
  company_name: string;
  fund_id: string;
  overall_score?: number;
  rag_status?: string;
  industry?: string;
  deal_size?: number;
}

interface DealDecisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  deal: Deal | null;
  onDecisionMade: () => void;
}

const rejectionCategories = [
  { value: 'strategy_misalignment', label: 'Strategy Misalignment' },
  { value: 'team_concerns', label: 'Team Concerns' },
  { value: 'market_issues', label: 'Market Issues' },
  { value: 'financial_concerns', label: 'Financial Concerns' },
  { value: 'other', label: 'Other' },
];

export function DealDecisionModal({ isOpen, onClose, deal, onDecisionMade }: DealDecisionModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [decisionType, setDecisionType] = useState<'accept' | 'reject' | 'defer'>('accept');
  const [rationale, setRationale] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectionCategory, setRejectionCategory] = useState('');
  const [confidenceLevel, setConfidenceLevel] = useState([75]);
  const [sourcingFeedback, setSourcingFeedback] = useState('');

  const handleSubmit = async () => {
    if (!deal) return;

    if (!rationale.trim()) {
      toast({
        title: "Rationale Required",
        description: "Please provide a rationale for your decision.",
        variant: "destructive",
      });
      return;
    }

    if (decisionType === 'reject' && !rejectionCategory) {
      toast({
        title: "Rejection Category Required",
        description: "Please select a category for the rejection.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const request: CreateDecisionRequest = {
        deal_id: deal.id,
        fund_id: deal.fund_id,
        decision_type: decisionType,
        decision_rationale: rationale,
        confidence_level: confidenceLevel[0],
        ...(decisionType === 'reject' && {
          rejection_reason: rejectionReason,
          rejection_category: rejectionCategory as any,
        }),
        sourcing_feedback: sourcingFeedback ? { feedback: sourcingFeedback } : {},
        impact_on_strategy: {
          industry_impact: deal.industry,
          deal_size_impact: deal.deal_size,
        },
      };

      const result = await dealDecisionService.createDecision(request);

      if (result.success) {
        toast({
          title: "Decision Recorded",
          description: `Deal ${decisionType}ed successfully. AI learning systems updated.`,
          variant: "default",
        });
        onDecisionMade();
        onClose();
        resetForm();
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      console.error('Error submitting decision:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to record decision",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setDecisionType('accept');
    setRationale('');
    setRejectionReason('');
    setRejectionCategory('');
    setConfidenceLevel([75]);
    setSourcingFeedback('');
  };

  const getDecisionIcon = (type: string) => {
    switch (type) {
      case 'accept':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'reject':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'defer':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getAIAlignment = () => {
    if (!deal?.overall_score && !deal?.rag_status) return null;

    const score = deal.overall_score || 0;
    const status = deal.rag_status;

    let aiRecommendation = '';
    if (score >= 85 || status === 'exciting') aiRecommendation = 'strongly recommends accepting';
    else if (score >= 70 || status === 'promising') aiRecommendation = 'suggests accepting';
    else aiRecommendation = 'suggests more development needed';

    const willContradict = 
      (decisionType === 'reject' && (score >= 70 || status === 'exciting' || status === 'promising')) ||
      (decisionType === 'accept' && score < 50);

    return (
      <div className={`p-3 rounded-lg border ${willContradict ? 'bg-amber-50 border-amber-200' : 'bg-blue-50 border-blue-200'}`}>
        <div className="flex items-center gap-2 mb-2">
          {willContradict && <AlertTriangle className="h-4 w-4 text-amber-600" />}
          <span className="text-sm font-medium">
            AI Analysis {willContradict ? '(Contradiction Detected)' : ''}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          Based on analysis (Score: {score || 'N/A'}, Status: {status || 'N/A'}), 
          AI {aiRecommendation}.
          {willContradict && ' Your decision differs from AI recommendation and will help improve future accuracy.'}
        </p>
      </div>
    );
  };

  if (!deal) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Make Decision: {deal.company_name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* AI Alignment Check */}
          {getAIAlignment()}

          {/* Decision Type */}
          <div className="space-y-3">
            <Label>Decision</Label>
            <div className="grid grid-cols-3 gap-3">
              {['accept', 'reject', 'defer'].map((type) => (
                <Button
                  key={type}
                  variant={decisionType === type ? 'default' : 'outline'}
                  onClick={() => setDecisionType(type as any)}
                  className="flex items-center gap-2 justify-center"
                >
                  {getDecisionIcon(type)}
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Button>
              ))}
            </div>
          </div>

          {/* Confidence Level */}
          <div className="space-y-3">
            <Label>Confidence Level: {confidenceLevel[0]}%</Label>
            <Slider
              value={confidenceLevel}
              onValueChange={setConfidenceLevel}
              max={100}
              min={1}
              step={5}
              className="w-full"
            />
          </div>

          {/* Rationale */}
          <div className="space-y-2">
            <Label htmlFor="rationale">Decision Rationale *</Label>
            <Textarea
              id="rationale"
              value={rationale}
              onChange={(e) => setRationale(e.target.value)}
              placeholder="Explain your reasoning for this decision..."
              className="min-h-[100px]"
            />
          </div>

          {/* Rejection Fields */}
          {decisionType === 'reject' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Rejection Category *</Label>
                <Select value={rejectionCategory} onValueChange={setRejectionCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select rejection reason category" />
                  </SelectTrigger>
                  <SelectContent>
                    {rejectionCategories.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="rejectionReason">Specific Rejection Reason</Label>
                <Textarea
                  id="rejectionReason"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Provide specific details about why this deal was rejected..."
                />
              </div>
            </div>
          )}

          {/* Sourcing Feedback */}
          <div className="space-y-2">
            <Label htmlFor="sourcingFeedback">Sourcing Feedback (Optional)</Label>
            <Textarea
              id="sourcingFeedback"
              value={sourcingFeedback}
              onChange={(e) => setSourcingFeedback(e.target.value)}
              placeholder="How can we improve deal sourcing for better alignment with your criteria?"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Recording Decision...' : 'Record Decision'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}