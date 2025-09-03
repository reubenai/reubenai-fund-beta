import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Clock, 
  CheckCircle, 
  Users, 
  Vote, 
  FileText, 
  Calendar, 
  TrendingUp,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from '@/hooks/useUserRole';
import { usePermissions } from '@/hooks/usePermissions';

interface NextStepSummary {
  pendingReviews: number;
  pendingApprovals: number;
  upcomingMeetings: number;
  activeVoting: number;
  readyForIC: number;
  requiresAction: string[];
}

interface NextStepSummaryBarProps {
  fundId: string;
  onActionClick: (action: string) => void;
}

export const NextStepSummaryBar: React.FC<NextStepSummaryBarProps> = ({
  fundId,
  onActionClick
}) => {
  const [summary, setSummary] = useState<NextStepSummary>({
    pendingReviews: 0,
    pendingApprovals: 0,
    upcomingMeetings: 0,
    activeVoting: 0,
    readyForIC: 0,
    requiresAction: []
  });
  const [loading, setLoading] = useState(true);
  const { role, isSuperAdmin } = useUserRole();
  const { canReviewMemos, canVoteOnDeals, canManageICMembers } = usePermissions();

  useEffect(() => {
    if (fundId) {
      fetchSummaryData();
    }
  }, [fundId, role]);

  const fetchSummaryData = async () => {
    try {
      setLoading(true);
      
      // Fetch pending reviews (for Fund Managers and Admins)
      let pendingReviews = 0;
      if (canReviewMemos) {
        const { count: reviewCount } = await supabase
          .from('ic_memos')
          .select('*', { count: 'exact', head: true })
          .eq('fund_id', fundId)
          .eq('status', 'review');
        pendingReviews = reviewCount || 0;
      }

      // Fetch pending approvals (approved memos not yet scheduled)
      const { count: approvalCount } = await supabase
        .from('ic_memos')
        .select('*', { count: 'exact', head: true })
        .eq('fund_id', fundId)
        .eq('status', 'approved');
      const pendingApprovals = approvalCount || 0;

      // Fetch upcoming meetings (next 7 days)
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      
      const { count: meetingCount } = await supabase
        .from('ic_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('fund_id', fundId)
        .eq('status', 'scheduled')
        .gte('session_date', new Date().toISOString())
        .lte('session_date', nextWeek.toISOString());
      const upcomingMeetings = meetingCount || 0;

      // Fetch active voting decisions
      const { count: votingCount } = await supabase
        .from('ic_voting_decisions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')
        .gte('voting_deadline', new Date().toISOString());
      const activeVoting = votingCount || 0;

      // Fetch deals ready for IC (approved memos but not scheduled)
      const { count: readyCount } = await supabase
        .from('deals')
        .select('*', { count: 'exact', head: true })
        .eq('fund_id', fundId)
        .eq('status', 'investment_committee');
      const readyForIC = readyCount || 0;

      // Determine required actions based on role
      const requiresAction: string[] = [];
      
      if (canReviewMemos && pendingReviews > 0) {
        requiresAction.push(`Review ${pendingReviews} memo${pendingReviews > 1 ? 's' : ''}`);
      }
      
      if (canManageICMembers && pendingApprovals > 0) {
        requiresAction.push(`Schedule ${pendingApprovals} approved deal${pendingApprovals > 1 ? 's' : ''}`);
      }
      
      if (canVoteOnDeals && activeVoting > 0) {
        requiresAction.push(`Vote on ${activeVoting} decision${activeVoting > 1 ? 's' : ''}`);
      }
      
      if (upcomingMeetings > 0) {
        requiresAction.push(`Prepare for ${upcomingMeetings} meeting${upcomingMeetings > 1 ? 's' : ''}`);
      }

      setSummary({
        pendingReviews,
        pendingApprovals,
        upcomingMeetings,
        activeVoting,
        readyForIC,
        requiresAction
      });

    } catch (error) {
      console.error('Error fetching summary data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUrgencyLevel = () => {
    const totalActions = summary.requiresAction.length;
    if (totalActions >= 3) return 'high';
    if (totalActions >= 1) return 'medium';
    return 'low';
  };

  const urgencyLevel = getUrgencyLevel();
  const urgencyColors = {
    high: 'bg-red-50 border-red-200 text-red-800',
    medium: 'bg-amber-50 border-amber-200 text-amber-800',
    low: 'bg-green-50 border-green-200 text-green-800'
  };

  if (loading) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="animate-pulse flex space-x-4">
            <div className="rounded-full bg-muted h-10 w-10"></div>
            <div className="flex-1 space-y-2 py-1">
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Hide component when no actions are required
  if (summary.requiresAction.length === 0) {
    return null;
  }

  return (
    <Card className={`border-l-4 ${urgencyLevel === 'high' ? 'border-l-red-500' : urgencyLevel === 'medium' ? 'border-l-amber-500' : 'border-l-green-500'} shadow-sm`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className={`p-2 rounded-full ${urgencyColors[urgencyLevel]}`}>
              {urgencyLevel === 'high' ? (
                <AlertTriangle className="h-5 w-5" />
              ) : urgencyLevel === 'medium' ? (
                <Clock className="h-5 w-5" />
              ) : (
                <CheckCircle className="h-5 w-5" />
              )}
            </div>
            
            <div>
              <h3 className="font-semibold text-foreground">
                {summary.requiresAction.length === 0 ? 'All Caught Up!' : 'Next Steps Required'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {summary.requiresAction.length === 0 
                  ? 'No immediate actions required' 
                  : summary.requiresAction.join(' • ')
                }
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-6">
            {/* Key Metrics */}
            {canReviewMemos && summary.pendingReviews > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onActionClick('reviews')}
                className="flex items-center space-x-2 text-sm"
              >
                <FileText className="h-4 w-4" />
                <Badge variant="secondary">{summary.pendingReviews}</Badge>
                <span>Reviews</span>
              </Button>
            )}

            {summary.activeVoting > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onActionClick('voting')}
                className="flex items-center space-x-2 text-sm"
              >
                <Vote className="h-4 w-4" />
                <Badge variant="secondary">{summary.activeVoting}</Badge>
                <span>Votes</span>
              </Button>
            )}

            {summary.upcomingMeetings > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onActionClick('meetings')}
                className="flex items-center space-x-2 text-sm"
              >
                <Calendar className="h-4 w-4" />
                <Badge variant="secondary">{summary.upcomingMeetings}</Badge>
                <span>Meetings</span>
              </Button>
            )}

            {summary.readyForIC > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onActionClick('pipeline')}
                className="flex items-center space-x-2 text-sm"
              >
                <TrendingUp className="h-4 w-4" />
                <Badge variant="secondary">{summary.readyForIC}</Badge>
                <span>Ready for IC</span>
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={fetchSummaryData}
              className="flex items-center space-x-2"
            >
              <Clock className="h-4 w-4" />
              <span>Refresh</span>
            </Button>
          </div>
        </div>

        {/* Progress indicator for role-relevant actions */}
        {summary.requiresAction.length > 0 && (
          <div className="mt-3 flex items-center space-x-2">
            <div className="flex-1 bg-muted rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  urgencyLevel === 'high' ? 'bg-red-500' : 
                  urgencyLevel === 'medium' ? 'bg-amber-500' : 'bg-green-500'
                }`}
                style={{ 
                  width: `${Math.min(100, (summary.requiresAction.length / 5) * 100)}%` 
                }}
              />
            </div>
            <span className="text-xs text-muted-foreground">
              {summary.requiresAction.length} action{summary.requiresAction.length !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};