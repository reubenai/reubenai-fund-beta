import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Eye,
  Clock,
  User,
  CheckCircle,
  XCircle,
  Calendar,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface ReviewQueueItem {
  id: string;
  title: string;
  workflow_state: string;
  deal_id: string;
  created_by: string;
  reviewed_by?: string;
  submitted_for_review_at?: string;
  review_priority: string;
  overall_score?: number;
  rag_status?: string;
  deals: {
    company_name: string;
    industry?: string;
    deal_size?: number;
  };
  profiles?: {
    first_name?: string;
    last_name?: string;
    email: string;
  };
}

interface EnhancedReviewQueueProps {
  fundId: string;
  onViewMemo: (dealId: string) => void;
}

export const EnhancedReviewQueue: React.FC<EnhancedReviewQueueProps> = ({
  fundId,
  onViewMemo
}) => {
  const [reviewQueue, setReviewQueue] = useState<ReviewQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchReviewQueue();
  }, [fundId]);

  const fetchReviewQueue = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('ic_memos')
        .select(`
          id,
          title,
          workflow_state,
          deal_id,
          created_by,
          reviewed_by,
          submitted_for_review_at,
          review_priority,
          overall_score,
          rag_status,
          deals!inner (
            company_name,
            industry,
            deal_size
          )
        `)
        .eq('fund_id', fundId)
        .eq('workflow_state', 'submitted')
        .order('submitted_for_review_at', { ascending: true });

      if (error) throw error;
      setReviewQueue(data || []);
    } catch (error) {
      console.error('Error fetching review queue:', error);
      toast({
        title: "Error",
        description: "Failed to load review queue",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge className="bg-red-50 text-red-700 border-red-200">🔥 High Priority</Badge>;
      case 'medium':
        return <Badge className="bg-amber-50 text-amber-700 border-amber-200">⚡ Medium Priority</Badge>;
      case 'low':
        return <Badge className="bg-gray-50 text-gray-700 border-gray-200">📋 Low Priority</Badge>;
      default:
        return <Badge variant="outline">Standard</Badge>;
    }
  };

  const getRAGBadge = (ragStatus?: string) => {
    switch (ragStatus) {
      case 'exciting':
        return <Badge className="bg-green-50 text-green-700 border-green-200">🚀 Exciting</Badge>;
      case 'promising':
        return <Badge className="bg-blue-50 text-blue-700 border-blue-200">📈 Promising</Badge>;
      case 'needs_development':
        return <Badge className="bg-amber-50 text-amber-700 border-amber-200">🔧 Needs Development</Badge>;
      default:
        return <Badge className="bg-gray-50 text-gray-700 border-gray-200">📊 Pending</Badge>;
    }
  };

  const getSubmissionTime = (submittedAt?: string) => {
    if (!submittedAt) return 'Unknown';
    
    try {
      const distance = formatDistanceToNow(new Date(submittedAt), { addSuffix: true });
      const isOverdue = Date.now() - new Date(submittedAt).getTime() > 24 * 60 * 60 * 1000; // 24 hours
      
      return (
        <div className={`flex items-center gap-1 ${isOverdue ? 'text-red-600' : 'text-muted-foreground'}`}>
          {isOverdue && <AlertTriangle className="w-3 h-3" />}
          <span className="text-xs">{distance}</span>
        </div>
      );
    } catch (error) {
      return 'Unknown';
    }
  };

  const getCreatorName = (memo: ReviewQueueItem) => {
    // For now, show the user ID since we don't have profile data
    // In a production app, you might want to fetch this separately or use a different approach
    return `User ${memo.created_by.slice(0, 8)}...`;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-3">Loading review queue...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Eye className="w-5 h-5" />
          Review Queue ({reviewQueue.length})
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchReviewQueue}
          className="gap-2"
        >
          <Clock className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {reviewQueue.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
              <p className="text-muted-foreground">
                All caught up! No memos pending review.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {reviewQueue.map((memo) => (
            <Card key={memo.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {memo.deals.company_name}
                      {getRAGBadge(memo.rag_status)}
                    </CardTitle>
                    
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        <span>Created by {getCreatorName(memo)}</span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {getSubmissionTime(memo.submitted_for_review_at)}
                      </div>
                      
                      {memo.overall_score && (
                        <div className="flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" />
                          <span>Score: {memo.overall_score}/100</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {getPriorityBadge(memo.review_priority)}
                    <Button
                      onClick={() => onViewMemo(memo.deal_id)}
                      className="gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      Review
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-4">
                    <div>
                      <span className="font-medium">Industry:</span> {memo.deals.industry || 'Not specified'}
                    </div>
                    {memo.deals.deal_size && (
                      <div>
                        <span className="font-medium">Deal Size:</span> ${memo.deals.deal_size.toLocaleString('en-US')}
                      </div>
                    )}
                  </div>
                  
                  <div className="text-xs">
                    Memo ID: {memo.id.slice(0, 8)}...
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};