import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, FileText, Vote, Users, Plus, Clock, CheckCircle, XCircle, Clock3, Send, Eye, Edit, Trash2 } from 'lucide-react';
import { useFund } from '@/contexts/FundContext';
import { ICMemoModal } from '@/components/ic/ICMemoModal';
import { icMemoService, ICSession, ICVotingDecision } from '@/services/ICMemoService';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useStrategyThresholds } from '@/hooks/useStrategyThresholds';

interface Deal {
  id: string;
  company_name: string;
  deal_size?: number;
  valuation?: number;
  overall_score?: number;
  status: string;
  industry?: string;
  description?: string;
  currency?: string;
}

interface ICCommitteeMember {
  id: string;
  user_id: string;
  role: string;
  voting_weight: number;
  profiles?: {
    first_name: string;
    last_name: string;
    email: string;
  } | null;
}

export default function EnhancedICPage() {
  const { selectedFund } = useFund();
  const { toast } = useToast();
  const { getRAGCategory } = useStrategyThresholds();
  const [activeTab, setActiveTab] = useState('pipeline');
  const [showMemoModal, setShowMemoModal] = useState(false);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [showVotingModal, setShowVotingModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  
  // Data states
  const [deals, setDeals] = useState<Deal[]>([]);
  const [sessions, setSessions] = useState<ICSession[]>([]);
  const [votingDecisions, setVotingDecisions] = useState<ICVotingDecision[]>([]);
  const [committeeMembers, setCommitteeMembers] = useState<ICCommitteeMember[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [sessionForm, setSessionForm] = useState({
    name: '',
    session_date: '',
    agenda: '',
    participants: [] as string[]
  });
  
  const [votingForm, setVotingForm] = useState({
    title: '',
    description: '',
    voting_deadline: '',
    memo_id: ''
  });

  const [memberForm, setMemberForm] = useState({
    email: '',
    role: 'member',
    voting_weight: 1.0
  });

  // Fetch IC data
  useEffect(() => {
    const fetchICData = async () => {
      if (!selectedFund) return;
      
      try {
        setLoading(true);
        const [dealsData, sessionsData, votingData, membersData] = await Promise.all([
          fetchDealsForIC(),
          icMemoService.getSessions(selectedFund.id),
          icMemoService.getVotingDecisions(selectedFund.id),
          fetchCommitteeMembers()
        ]);
        
        setDeals(dealsData || []);
        setSessions(sessionsData);
        setVotingDecisions(votingData);
        setCommitteeMembers(membersData || []);
      } catch (error) {
        console.error('Error fetching IC data:', error);
        toast({
          title: "Error",
          description: "Failed to load IC data",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchICData();
  }, [selectedFund]);

  const fetchDealsForIC = async () => {
    if (!selectedFund) return [];
    
    const { data, error } = await supabase
      .from('deals')
      .select('*')
      .eq('fund_id', selectedFund.id)
      .in('status', ['investment_committee', 'due_diligence', 'approved'])
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching deals:', error);
      return [];
    }
    
    return data || [];
  };

  const fetchCommitteeMembers = async () => {
    if (!selectedFund) return [];
    
    try {
      // Fetch members and their profiles separately to avoid join issues
      const { data: membersData, error: membersError } = await supabase
        .from('ic_committee_members')
        .select('*')
        .eq('fund_id', selectedFund.id)
        .eq('is_active', true);

      if (membersError) throw membersError;
      if (!membersData || membersData.length === 0) return [];

      // Fetch profiles for each member
      const userIds = membersData.map(member => member.user_id);
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name, email')
        .in('user_id', userIds);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        // Return members without profile data if profiles fetch fails
        return membersData.map(member => ({ ...member, profiles: null }));
      }

      // Merge member data with profile data
      const membersWithProfiles = membersData.map(member => {
        const profile = profilesData?.find(p => p.user_id === member.user_id);
        return {
          ...member,
          profiles: profile ? {
            first_name: profile.first_name || '',
            last_name: profile.last_name || '',
            email: profile.email || ''
          } : null
        };
      });

      return membersWithProfiles;
    } catch (error) {
      console.error('Error fetching committee members:', error);
      return [];
    }
  };

  const handleCreateSession = async () => {
    if (!selectedFund) return;

    try {
      const sessionData = {
        fund_id: selectedFund.id,
        name: sessionForm.name,
        session_date: new Date(sessionForm.session_date).toISOString(),
        agenda: { items: sessionForm.agenda.split('\n').filter(Boolean) },
        participants: sessionForm.participants,
        status: 'scheduled' as const,
        created_by: (await supabase.auth.getUser()).data.user?.id || ''
      };

      const newSession = await icMemoService.createSession(sessionData);
      if (newSession) {
        setSessions([...sessions, newSession]);
        setShowSessionModal(false);
        setSessionForm({ name: '', session_date: '', agenda: '', participants: [] });
        toast({
          title: "Success",
          description: "IC session scheduled successfully"
        });
      }
    } catch (error) {
      console.error('Error creating session:', error);
      toast({
        title: "Error",
        description: "Failed to create IC session",
        variant: "destructive"
      });
    }
  };

  const handleCreateVotingDecision = async () => {
    if (!selectedFund) return;

    try {
      const votingData = {
        memo_id: votingForm.memo_id,
        title: votingForm.title,
        description: votingForm.description,
        voting_deadline: new Date(votingForm.voting_deadline).toISOString(),
        status: 'active' as const,
        vote_summary: {},
        created_by: (await supabase.auth.getUser()).data.user?.id || ''
      };

      const newVoting = await icMemoService.createVotingDecision(votingData);
      if (newVoting) {
        setVotingDecisions([...votingDecisions, newVoting]);
        setShowVotingModal(false);
        setVotingForm({ title: '', description: '', voting_deadline: '', memo_id: '' });
        toast({
          title: "Success",
          description: "Voting decision created successfully"
        });
      }
    } catch (error) {
      console.error('Error creating voting decision:', error);
      toast({
        title: "Error",
        description: "Failed to create voting decision",
        variant: "destructive"
      });
    }
  };

  const handleAddMember = async () => {
    if (!selectedFund) return;

    try {
      // First find user by email
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('email', memberForm.email)
        .single();

      if (userError || !userData) {
        toast({
          title: "Error",
          description: "User not found with this email",
          variant: "destructive"
        });
        return;
      }

      const { data, error } = await supabase
        .from('ic_committee_members')
        .insert({
          fund_id: selectedFund.id,
          user_id: userData.user_id,
          role: memberForm.role,
          voting_weight: memberForm.voting_weight
        })
        .select('*')
        .single();

      if (error) throw error;

      // Fetch the profile data for the new member
      const { data: profileData } = await supabase
        .from('profiles')
        .select('first_name, last_name, email')
        .eq('user_id', userData.user_id)
        .single();

      const memberWithProfile = {
        ...data,
        profiles: profileData ? {
          first_name: profileData.first_name || '',
          last_name: profileData.last_name || '',
          email: profileData.email || ''
        } : null
      };

      setCommitteeMembers([...committeeMembers, memberWithProfile]);
      setShowMemberModal(false);
      setMemberForm({ email: '', role: 'member', voting_weight: 1.0 });
      toast({
        title: "Success",
        description: "Committee member added successfully"
      });
    } catch (error) {
      console.error('Error adding member:', error);
      toast({
        title: "Error",
        description: "Failed to add committee member",
        variant: "destructive"
      });
    }
  };

  const formatAmount = (amount?: number, currency = 'USD') => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      notation: amount >= 1000000 ? 'compact' : 'standard',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (!selectedFund) {
    return (
      <div className="flex-1 space-y-8 p-8">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-foreground">Investment Committee</h1>
          <p className="text-sm text-muted-foreground">Manage IC meetings, memos, and decisions</p>
        </div>
        
        <Card className="border-0 shadow-sm">
          <CardContent className="flex items-center justify-center py-16">
            <p className="text-muted-foreground">Please select a fund to access Investment Committee features</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex-1 space-y-8 p-8">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-foreground">Investment Committee</h1>
          <p className="text-sm text-muted-foreground">Loading IC data...</p>
        </div>
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-8 p-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-foreground">Investment Committee</h1>
        <p className="text-sm text-muted-foreground">
          Manage IC meetings, memos, and decisions for {selectedFund.name}
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
        <TabsList className="h-12 w-auto bg-background border rounded-lg p-1">
          <TabsTrigger value="pipeline" className="h-10 px-6 rounded-md text-sm font-medium data-[state=active]:bg-card data-[state=active]:shadow-sm">
            <FileText className="h-4 w-4 mr-2" />
            Deal Pipeline ({deals.length})
          </TabsTrigger>
          <TabsTrigger value="sessions" className="h-10 px-6 rounded-md text-sm font-medium data-[state=active]:bg-card data-[state=active]:shadow-sm">
            <Calendar className="h-4 w-4 mr-2" />
            IC Sessions ({sessions.length})
          </TabsTrigger>
          <TabsTrigger value="voting" className="h-10 px-6 rounded-md text-sm font-medium data-[state=active]:bg-card data-[state=active]:shadow-sm">
            <Vote className="h-4 w-4 mr-2" />
            Voting & Decisions ({votingDecisions.length})
          </TabsTrigger>
          <TabsTrigger value="members" className="h-10 px-6 rounded-md text-sm font-medium data-[state=active]:bg-card data-[state=active]:shadow-sm">
            <Users className="h-4 w-4 mr-2" />
            Committee ({committeeMembers.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pipeline" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-medium text-foreground">Deal Pipeline</h2>
              <p className="text-sm text-muted-foreground">
                Deals ready for IC review and memo generation
              </p>
            </div>
            <Button 
              onClick={() => setShowMemoModal(true)}
              className="h-9 px-4 text-sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Generate Memo
            </Button>
          </div>

          <div className="space-y-4">
            {deals.length > 0 ? (
              deals.map((deal) => {
                const rag = getRAGCategory(deal.overall_score);
                return (
                  <Card key={deal.id} className="border-0 shadow-sm">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-base font-medium text-foreground">{deal.company_name}</h3>
                            <Badge variant="outline" className={rag.color}>
                              {rag.label}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {deal.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-4">
                            {deal.description || 'No description available'}
                          </p>
                          <div className="flex items-center gap-6 text-sm text-muted-foreground">
                            <span><span className="font-medium text-foreground">Deal Size:</span> {formatAmount(deal.deal_size, deal.currency)}</span>
                            <span><span className="font-medium text-foreground">Valuation:</span> {formatAmount(deal.valuation, deal.currency)}</span>
                            <span><span className="font-medium text-foreground">Industry:</span> {deal.industry || 'N/A'}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="text-xs text-muted-foreground">ReubenAI Score</div>
                            <div className="text-sm font-medium text-foreground">
                              {deal.overall_score ? getRAGCategory(deal.overall_score).label : 'N/A'}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4 mr-2" />
                              Review
                            </Button>
                            <Button size="sm">
                              <FileText className="h-4 w-4 mr-2" />
                              Memo
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <Card className="border-0 shadow-sm border-dashed border-border">
                <CardContent className="flex items-center justify-center py-16">
                  <div className="text-center">
                    <FileText className="h-10 w-10 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-sm text-muted-foreground">
                      No deals ready for IC review
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Deals will appear here when they reach the "Decision" stage
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="sessions" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-medium text-foreground">IC Sessions</h2>
              <p className="text-sm text-muted-foreground">
                Schedule and manage Investment Committee meetings
              </p>
            </div>
            <Dialog open={showSessionModal} onOpenChange={setShowSessionModal}>
              <DialogTrigger asChild>
                <Button className="h-9 px-4 text-sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Schedule Session
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Schedule IC Session</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="session-name">Session Name</Label>
                    <Input
                      id="session-name"
                      value={sessionForm.name}
                      onChange={(e) => setSessionForm({ ...sessionForm, name: e.target.value })}
                      placeholder="e.g., Monthly IC Meeting"
                    />
                  </div>
                  <div>
                    <Label htmlFor="session-date">Date & Time</Label>
                    <Input
                      id="session-date"
                      type="datetime-local"
                      value={sessionForm.session_date}
                      onChange={(e) => setSessionForm({ ...sessionForm, session_date: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="session-agenda">Agenda (one item per line)</Label>
                    <Textarea
                      id="session-agenda"
                      value={sessionForm.agenda}
                      onChange={(e) => setSessionForm({ ...sessionForm, agenda: e.target.value })}
                      placeholder="Review Deal A&#10;Discuss Strategy Updates&#10;Vote on Investment B"
                      rows={4}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowSessionModal(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateSession}>
                      Schedule
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-4">
            {sessions.length > 0 ? (
              sessions.map((session) => (
                <Card key={session.id} className="border-0 shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-base font-medium text-foreground">{session.name}</h3>
                          <Badge variant="secondary" className="text-xs">
                            {session.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {new Date(session.session_date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>{Array.isArray(session.participants) ? session.participants.length : 0} participants</span>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      {session.notes && (
                        <div>
                          <h4 className="text-sm font-medium text-foreground mb-2">Notes</h4>
                          <p className="text-sm text-muted-foreground">{session.notes}</p>
                        </div>
                      )}
                      <div className="flex justify-end gap-2 pt-2">
                        <Button variant="outline" size="sm" className="h-8 px-3 text-xs">
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button size="sm" className="h-8 px-3 text-xs">
                          <Eye className="h-4 w-4 mr-1" />
                          View Details
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="border-0 shadow-sm border-dashed border-border">
                <CardContent className="flex items-center justify-center py-16">
                  <div className="text-center">
                    <Calendar className="h-10 w-10 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-sm text-muted-foreground">
                      No IC sessions scheduled
                    </p>
                    <Button variant="outline" className="mt-4 h-9 px-4 text-sm" onClick={() => setShowSessionModal(true)}>
                      Schedule Your First Session
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="voting" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-medium text-foreground">Voting & Decisions</h2>
              <p className="text-sm text-muted-foreground">
                Track voting progress and investment decisions
              </p>
            </div>
            <Dialog open={showVotingModal} onOpenChange={setShowVotingModal}>
              <DialogTrigger asChild>
                <Button className="h-9 px-4 text-sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Vote
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Create Voting Decision</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="vote-title">Title</Label>
                    <Input
                      id="vote-title"
                      value={votingForm.title}
                      onChange={(e) => setVotingForm({ ...votingForm, title: e.target.value })}
                      placeholder="Investment Decision for Company X"
                    />
                  </div>
                  <div>
                    <Label htmlFor="vote-description">Description</Label>
                    <Textarea
                      id="vote-description"
                      value={votingForm.description}
                      onChange={(e) => setVotingForm({ ...votingForm, description: e.target.value })}
                      placeholder="Details about the investment opportunity..."
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="vote-deadline">Voting Deadline</Label>
                    <Input
                      id="vote-deadline"
                      type="datetime-local"
                      value={votingForm.voting_deadline}
                      onChange={(e) => setVotingForm({ ...votingForm, voting_deadline: e.target.value })}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowVotingModal(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateVotingDecision}>
                      Create Vote
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-4">
            {votingDecisions.length > 0 ? (
              votingDecisions.map((decision) => (
                <Card key={decision.id} className="border-0 shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-base font-medium text-foreground">{decision.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {decision.description} - Deadline: {new Date(decision.voting_deadline).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {decision.status}
                      </Badge>
                    </div>
                    
                    <div className="space-y-4">
                      {decision.vote_summary && typeof decision.vote_summary === 'object' && (
                        <div className="grid grid-cols-3 gap-6">
                          <div className="text-center p-4 bg-green-50/50 rounded-lg">
                            <div className="text-xl font-semibold text-green-600">
                              {(decision.vote_summary as any).approve || 0}
                            </div>
                            <div className="text-xs text-muted-foreground">Approve</div>
                          </div>
                          <div className="text-center p-4 bg-red-50/50 rounded-lg">
                            <div className="text-xl font-semibold text-red-600">
                              {(decision.vote_summary as any).reject || 0}
                            </div>
                            <div className="text-xs text-muted-foreground">Reject</div>
                          </div>
                          <div className="text-center p-4 bg-muted/30 rounded-lg">
                            <div className="text-xl font-semibold text-muted-foreground">
                              {(decision.vote_summary as any).pending || 0}
                            </div>
                            <div className="text-xs text-muted-foreground">Pending</div>
                          </div>
                        </div>
                      )}
                      <div className="flex justify-end gap-2 pt-2">
                        <Button variant="outline" size="sm" className="h-8 px-3 text-xs">
                          <Vote className="h-4 w-4 mr-1" />
                          Vote
                        </Button>
                        <Button variant="outline" size="sm" className="h-8 px-3 text-xs">
                          <Eye className="h-4 w-4 mr-1" />
                          Details
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="border-0 shadow-sm border-dashed border-border">
                <CardContent className="flex items-center justify-center py-16">
                  <div className="text-center">
                    <Vote className="h-10 w-10 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-sm text-muted-foreground">
                      No voting decisions created
                    </p>
                    <Button variant="outline" className="mt-4 h-9 px-4 text-sm" onClick={() => setShowVotingModal(true)}>
                      Create Voting Decision
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="members" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-medium text-foreground">Committee Members</h2>
              <p className="text-sm text-muted-foreground">
                Manage Investment Committee membership and voting rights
              </p>
            </div>
            <Dialog open={showMemberModal} onOpenChange={setShowMemberModal}>
              <DialogTrigger asChild>
                <Button className="h-9 px-4 text-sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Member
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Add Committee Member</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="member-email">Email Address</Label>
                    <Input
                      id="member-email"
                      value={memberForm.email}
                      onChange={(e) => setMemberForm({ ...memberForm, email: e.target.value })}
                      placeholder="member@example.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="member-role">Role</Label>
                    <Select value={memberForm.role} onValueChange={(value) => setMemberForm({ ...memberForm, role: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="chair">Chair</SelectItem>
                        <SelectItem value="member">Member</SelectItem>
                        <SelectItem value="observer">Observer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="voting-weight">Voting Weight</Label>
                    <Input
                      id="voting-weight"
                      type="number"
                      step="0.1"
                      value={memberForm.voting_weight}
                      onChange={(e) => setMemberForm({ ...memberForm, voting_weight: parseFloat(e.target.value) || 1.0 })}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowMemberModal(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddMember}>
                      Add Member
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-4">
            {committeeMembers.length > 0 ? (
              committeeMembers.map((member) => (
                <Card key={member.id} className="border-0 shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <Users className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-base font-medium text-foreground">
                            {member.profiles?.first_name} {member.profiles?.last_name}
                          </h3>
                          <p className="text-sm text-muted-foreground">{member.profiles?.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <Badge variant="outline" className="mb-1">
                            {member.role}
                          </Badge>
                          <p className="text-xs text-muted-foreground">
                            Weight: {member.voting_weight}
                          </p>
                        </div>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="border-0 shadow-sm border-dashed border-border">
                <CardContent className="flex items-center justify-center py-16">
                  <div className="text-center">
                    <Users className="h-10 w-10 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-sm text-muted-foreground">
                      No committee members added
                    </p>
                    <Button variant="outline" className="mt-4 h-9 px-4 text-sm" onClick={() => setShowMemberModal(true)}>
                      Add First Member
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <ICMemoModal
        isOpen={showMemoModal}
        onClose={() => setShowMemoModal(false)}
        fundId={selectedFund.id}
      />
    </div>
  );
}