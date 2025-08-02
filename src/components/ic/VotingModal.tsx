import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Vote, Clock, CheckCircle, XCircle, Pause } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface VotingModalProps {
  isOpen: boolean;
  onClose: () => void;
  decision: {
    id: string;
    title: string;
    description?: string;
    voting_deadline: string;
    status: string;
    memo_id?: string;
  };
  onVoteSubmitted: () => void;
}

type VoteChoice = 'approve' | 'reject' | 'abstain';

export function VotingModal({ isOpen, onClose, decision, onVoteSubmitted }: VotingModalProps) {
  const [voteChoice, setVoteChoice] = useState<VoteChoice>('approve');
  const [reasoning, setReasoning] = useState('');
  const [confidenceLevel, setConfidenceLevel] = useState(75);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmitVote = async () => {
    if (!reasoning.trim()) {
      toast({
        title: "Reasoning Required",
        description: "Please provide reasoning for your vote.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Submit vote to ic_memo_votes table
      const { error: voteError } = await supabase
        .from('ic_memo_votes')
        .insert({
          decision_id: decision.id,
          voter_id: user.id,
          vote: voteChoice,
          reasoning,
          confidence_level: confidenceLevel
        });

      if (voteError) throw voteError;

      // Update vote summary in the decision
      const { data: existingVotes, error: votesError } = await supabase
        .from('ic_memo_votes')
        .select('vote')
        .eq('decision_id', decision.id);

      if (votesError) throw votesError;

      const voteSummary = existingVotes.reduce((acc, vote) => {
        acc[vote.vote] = (acc[vote.vote] || 0) + 1;
        return acc;
      }, { approve: 0, reject: 0, abstain: 0 });

      const { error: updateError } = await supabase
        .from('ic_voting_decisions')
        .update({ vote_summary: voteSummary })
        .eq('id', decision.id);

      if (updateError) throw updateError;

      // Check if all votes are in and finalize if needed
      const { data: committeeMembers } = await supabase
        .from('ic_committee_members')
        .select('id')
        .eq('is_active', true);

      const totalMembers = committeeMembers?.length || 0;
      const totalVotes = Object.values(voteSummary).reduce((sum, count) => sum + count, 0);

      // If all members have voted, trigger decision finalization
      if (totalVotes >= totalMembers) {
        const majorityVote = Object.entries(voteSummary).reduce((a, b) => 
          voteSummary[a[0] as VoteChoice] > voteSummary[b[0] as VoteChoice] ? a : b
        )[0] as VoteChoice;

        // Call the update-deal-from-decision function
        await supabase.functions.invoke('update-deal-from-decision', {
          body: {
            decisionId: decision.id,
            finalDecision: majorityVote === 'approve' ? 'approved' : 
                          majorityVote === 'reject' ? 'rejected' : 'deferred',
            voteSummary,
            decisionRationale: `Decision finalized with ${totalVotes} votes. Majority vote: ${majorityVote}`
          }
        });
      }

      toast({
        title: "Vote Submitted",
        description: "Your vote has been recorded successfully.",
      });

      onVoteSubmitted();
      onClose();
    } catch (error) {
      console.error('Error submitting vote:', error);
      toast({
        title: "Error",
        description: "Failed to submit vote. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isExpired = new Date(decision.voting_deadline) < new Date();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Vote className="h-5 w-5" />
            Cast Your Vote
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Decision Details */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-foreground">{decision.title}</h3>
              <Badge variant={isExpired ? 'destructive' : 'secondary'}>
                {isExpired ? 'Expired' : 'Active'}
              </Badge>
            </div>
            {decision.description && (
              <p className="text-sm text-muted-foreground">{decision.description}</p>
            )}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Voting deadline: {new Date(decision.voting_deadline).toLocaleString()}</span>
            </div>
          </div>

          {!isExpired && (
            <>
              {/* Vote Choice */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Your Vote</Label>
                <RadioGroup 
                  value={voteChoice} 
                  onValueChange={(value) => setVoteChoice(value as VoteChoice)}
                  className="grid grid-cols-3 gap-4"
                >
                  <div className="flex items-center space-x-2 border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                    <RadioGroupItem value="approve" id="approve" />
                    <Label htmlFor="approve" className="flex items-center gap-2 font-medium text-green-600 cursor-pointer">
                      <CheckCircle className="h-4 w-4" />
                      Approve
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                    <RadioGroupItem value="reject" id="reject" />
                    <Label htmlFor="reject" className="flex items-center gap-2 font-medium text-red-600 cursor-pointer">
                      <XCircle className="h-4 w-4" />
                      Reject
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                    <RadioGroupItem value="abstain" id="abstain" />
                    <Label htmlFor="abstain" className="flex items-center gap-2 font-medium text-muted-foreground cursor-pointer">
                      <Pause className="h-4 w-4" />
                      Abstain
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Confidence Level */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Confidence Level: {confidenceLevel}%</Label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={confidenceLevel}
                  onChange={(e) => setConfidenceLevel(parseInt(e.target.value))}
                  className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Low Confidence</span>
                  <span>High Confidence</span>
                </div>
              </div>

              {/* Reasoning */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Reasoning *</Label>
                <Textarea
                  placeholder="Please provide your reasoning for this vote..."
                  value={reasoning}
                  onChange={(e) => setReasoning(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
              </div>

              {/* Submit */}
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleSubmitVote}
                  disabled={isSubmitting || !reasoning.trim()}
                  className="gap-2"
                >
                  <Vote className="h-4 w-4" />
                  {isSubmitting ? 'Submitting...' : 'Submit Vote'}
                </Button>
              </div>
            </>
          )}

          {isExpired && (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">This voting period has expired.</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}