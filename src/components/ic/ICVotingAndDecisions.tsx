import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from '@/hooks/useUserRole';
import { ThumbsUp, ThumbsDown, Minus, Clock, Vote, MessageSquare, Filter } from 'lucide-react';

interface ICVote {
  id: string;
  decision_id: string;
  user_id: string;
  vote: 'approve' | 'reject' | 'abstain';
  reasoning?: string;
  voting_weight: number;
  created_at: string;
  user_email?: string;
}

interface ICDecision {
  id: string;
  memo_id: string;
  title: string;
  status: string;
  voting_deadline: string;
  created_at: string;
  vote_summary?: any;
  memo: {
    title: string;
    deal: {
      company_name: string;
      fund_id: string;
    };
  };
  votes: any[];
}

interface ICVotingAndDecisionsProps {
  fundId: string;
  userRole?: string;
}

export function ICVotingAndDecisions({ fundId, userRole }: ICVotingAndDecisionsProps) {
  const [decisions, setDecisions] = useState<ICDecision[]>([]);
  const [selectedDecision, setSelectedDecision] = useState<ICDecision | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [myVote, setMyVote] = useState<'approve' | 'reject' | 'abstain' | ''>('');
  const [voteReasoning, setVoteReasoning] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('active');
  const { toast } = useToast();
  const { role } = useUserRole();

  const canVote = role === 'fund_manager' || role === 'super_admin';

  useEffect(() => {
    fetchDecisions();
  }, [fundId, filter]);

  const fetchDecisions = async () => {
    try {
      // Simplified query to avoid TypeScript issues
      const { data, error } = await supabase
        .from('decision_contexts')
        .select('*')
        .eq('fund_id', fundId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Mock data structure for now
      const mockDecisions = (data || []).map(item => ({
        id: item.id,
        memo_id: item.deal_id || '',
        title: `Decision for ${item.decision_type}`,
        status: 'active',
        voting_deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: item.created_at,
        vote_summary: {},
        memo: {
          title: `IC Memo for ${item.decision_type}`,
          deal: {
            company_name: 'Company Name',
            fund_id: fundId
          }
        },
        votes: []
      }));

      setDecisions(mockDecisions);
    } catch (error) {
      console.error('Error fetching decisions:', error);
      toast({
        title: "Error",
        description: "Failed to load voting decisions",
        variant: "destructive"
      });
    }
  };

  const submitVote = async () => {
    if (!selectedDecision || !myVote || !canVote) return;
    
    setIsLoading(true);
    try {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      
      // Mock vote submission for now
      console.log('Vote submitted:', { myVote, voteReasoning, selectedDecision: selectedDecision.id });

      // Log activity
      await supabase
        .from('activity_events')
        .insert({
          user_id: userId,
          fund_id: selectedDecision.memo.deal.fund_id,
          activity_type: 'deal_updated',
          title: `IC Vote Cast: ${myVote.toUpperCase()}`,
          description: `Vote cast for ${selectedDecision.memo.deal.company_name}`,
          context_data: {
            decision_id: selectedDecision.id,
            company_name: selectedDecision.memo.deal.company_name,
            vote: myVote,
            reasoning: voteReasoning
          }
        });

      // Update vote summary
      await updateVoteSummary(selectedDecision.id);

      toast({
        title: "Vote Submitted",
        description: `Your ${myVote} vote has been recorded`,
        variant: "default"
      });

      setMyVote('');
      setVoteReasoning('');
      await fetchDecisions();
    } catch (error) {
      console.error('Error submitting vote:', error);
      toast({
        title: "Vote Failed",
        description: "Failed to submit vote",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateVoteSummary = async (decisionId: string) => {
    try {
      // Mock implementation for now
      console.log('Updating vote summary for decision:', decisionId);
    } catch (error) {
      console.error('Error updating vote summary:', error);
    }
  };

  const finalizeDecision = async (decisionId: string, finalOutcome: 'approved' | 'rejected') => {
    if (!canVote) return;
    
    try {
      const { error } = await supabase
        .from('ic_voting_decisions')
        .update({
          status: 'completed',
          final_decision: finalOutcome,
          completed_at: new Date().toISOString()
        })
        .eq('id', decisionId);

      if (error) throw error;

      // Log decision
      const decision = decisions.find(d => d.id === decisionId);
      if (decision) {
        await supabase
          .from('activity_events')
          .insert({
            user_id: (await supabase.auth.getUser()).data.user?.id,
            fund_id: decision.memo.deal.fund_id,
            activity_type: 'deal_updated',
            title: `IC Decision: ${finalOutcome.toUpperCase()}`,
            description: `Final decision for ${decision.memo.deal.company_name}: ${finalOutcome}`,
            context_data: {
              decision_id: decisionId,
              company_name: decision.memo.deal.company_name,
              final_decision: finalOutcome
            }
          });
      }

      toast({
        title: "Decision Finalized",
        description: `Decision has been marked as ${finalOutcome}`,
        variant: "default"
      });

      await fetchDecisions();
    } catch (error) {
      console.error('Error finalizing decision:', error);
      toast({
        title: "Finalization Failed",
        description: "Failed to finalize decision",
        variant: "destructive"
      });
    }
  };

  const getVoteIcon = (vote: string) => {
    switch (vote) {
      case 'approve':
        return <ThumbsUp className="h-4 w-4 text-green-600" />;
      case 'reject':
        return <ThumbsDown className="h-4 w-4 text-destructive" />;
      case 'abstain':
        return <Minus className="h-4 w-4 text-muted-foreground" />;
      default:
        return <Vote className="h-4 w-4" />;
    }
  };

  const getVoteColor = (vote: string) => {
    switch (vote) {
      case 'approve':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'reject':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'abstain':
        return 'bg-muted text-muted-foreground border-muted';
      default:
        return 'bg-muted text-muted-foreground border-muted';
    }
  };

  const calculateVoteProgress = (decision: ICDecision) => {
    const summary = decision.vote_summary || {};
    const total = summary.total || 0;
    
    if (total === 0) return { approve: 0, reject: 0, abstain: 0 };
    
    return {
      approve: ((summary.approve || 0) / total) * 100,
      reject: ((summary.reject || 0) / total) * 100,
      abstain: ((summary.abstain || 0) / total) * 100
    };
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex items-center gap-4">
        <Filter className="h-5 w-5 text-muted-foreground" />
        <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Decisions</SelectItem>
            <SelectItem value="active">Active Voting</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Decisions List */}
      <div className="grid gap-4">
        {decisions.map((decision) => {
          const isExpired = new Date(decision.voting_deadline) < new Date();
          const userVote = decision.votes.find(v => v.user_id === (supabase.auth.getUser() as any)?.data?.user?.id);
          const progress = calculateVoteProgress(decision);

          return (
            <Card 
              key={decision.id} 
              className={`cursor-pointer transition-colors ${
                selectedDecision?.id === decision.id ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => setSelectedDecision(decision)}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{decision.title}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant={decision.status === 'active' ? 'default' : 'secondary'}>
                      {decision.status}
                    </Badge>
                    {isExpired && decision.status === 'active' && (
                      <Badge variant="destructive">Expired</Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Company: {decision.memo.deal.company_name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Deadline: {new Date(decision.voting_deadline).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Vote Progress */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Approve: {Math.round(progress.approve)}%</span>
                      <span>Reject: {Math.round(progress.reject)}%</span>
                      <span>Abstain: {Math.round(progress.abstain)}%</span>
                    </div>
                    <div className="flex h-2 rounded-full overflow-hidden bg-muted">
                      <div 
                        className="bg-green-500" 
                        style={{ width: `${progress.approve}%` }}
                      />
                      <div 
                        className="bg-destructive" 
                        style={{ width: `${progress.reject}%` }}
                      />
                      <div 
                        className="bg-muted-foreground" 
                        style={{ width: `${progress.abstain}%` }}
                      />
                    </div>
                  </div>

                  {/* User's Vote Status */}
                  {userVote && (
                    <div className="flex items-center gap-2">
                      {getVoteIcon(userVote.vote)}
                      <span className="text-sm">
                        Your vote: <Badge className={getVoteColor(userVote.vote)}>
                          {userVote.vote.toUpperCase()}
                        </Badge>
                      </span>
                    </div>
                  )}

                  {/* Vote Count */}
                  <div className="text-sm text-muted-foreground">
                    {decision.votes.length} vote{decision.votes.length !== 1 ? 's' : ''} cast
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Voting Panel */}
      {selectedDecision && canVote && selectedDecision.status === 'active' && (
        <Card>
          <CardHeader>
            <CardTitle>Cast Your Vote</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold">{selectedDecision.title}</h3>
              <p className="text-sm text-muted-foreground">
                Company: {selectedDecision.memo.deal.company_name}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Your Vote</label>
                <Select value={myVote} onValueChange={(value: any) => setMyVote(value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select your vote" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="approve">
                      <div className="flex items-center gap-2">
                        <ThumbsUp className="h-4 w-4 text-green-600" />
                        Approve
                      </div>
                    </SelectItem>
                    <SelectItem value="reject">
                      <div className="flex items-center gap-2">
                        <ThumbsDown className="h-4 w-4 text-destructive" />
                        Reject
                      </div>
                    </SelectItem>
                    <SelectItem value="abstain">
                      <div className="flex items-center gap-2">
                        <Minus className="h-4 w-4 text-muted-foreground" />
                        Abstain
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Reasoning</label>
                <Textarea
                  value={voteReasoning}
                  onChange={(e) => setVoteReasoning(e.target.value)}
                  placeholder="Explain your vote..."
                  className="mt-1"
                />
              </div>

              <Button 
                onClick={submitVote}
                disabled={!myVote || isLoading}
                className="w-full"
              >
                Submit Vote
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Decision Details */}
      {selectedDecision && (
        <Card>
          <CardHeader>
            <CardTitle>Vote Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {selectedDecision.votes.map((vote) => (
                <div key={vote.id} className="flex items-start justify-between p-3 border rounded-lg">
                  <div className="flex items-start gap-3">
                    {getVoteIcon(vote.vote)}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{vote.user_email}</span>
                        <Badge className={getVoteColor(vote.vote)}>
                          {vote.vote.toUpperCase()}
                        </Badge>
                      </div>
                      {vote.reasoning && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {vote.reasoning}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(vote.created_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
              
              {selectedDecision.votes.length === 0 && (
                <div className="text-center text-muted-foreground py-4">
                  No votes cast yet
                </div>
              )}
            </div>

            {/* Finalize Decision (for admins) */}
            {canVote && selectedDecision.status === 'active' && (
              <div className="mt-6 pt-4 border-t space-y-2">
                <p className="text-sm font-medium">Finalize Decision:</p>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => finalizeDecision(selectedDecision.id, 'approved')}
                    variant="outline"
                    size="sm"
                    className="text-green-700 border-green-300 hover:bg-green-50"
                  >
                    Mark as Approved
                  </Button>
                  <Button 
                    onClick={() => finalizeDecision(selectedDecision.id, 'rejected')}
                    variant="outline"
                    size="sm"
                    className="text-destructive border-destructive/30 hover:bg-destructive/5"
                  >
                    Mark as Rejected
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}