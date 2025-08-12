import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from '@/hooks/useUserRole';
import { CheckCircle, XCircle, Clock, MessageSquare, User, Calendar } from 'lucide-react';

interface ICMemo {
  id: string;
  deal_id: string;
  title: string;
  memo_content: any;
  status: string;
  workflow_state: string;
  created_by: string;
  reviewed_by?: string;
  approved_by?: string;
  submitted_at?: string;
  reviewed_at?: string;
  approved_at?: string;
  review_notes?: string;
  approval_notes?: string;
  deal: {
    company_name: string;
    fund_id: string;
  };
}

interface ICMemoApprovalFlowProps {
  memoId?: string;
  fundId: string;
  onStatusChange?: (status: string) => void;
}

export function ICMemoApprovalFlow({ memoId, fundId, onStatusChange }: ICMemoApprovalFlowProps) {
  const [memo, setMemo] = useState<ICMemo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  const [approvalNotes, setApprovalNotes] = useState('');
  const { toast } = useToast();
  const { role } = useUserRole();

  const canReview = role === 'fund_manager' || role === 'super_admin';
  const canApprove = role === 'fund_manager' || role === 'super_admin';
  const canBypass = role === 'super_admin';

  useEffect(() => {
    if (memoId) {
      fetchMemo();
    }
  }, [memoId]);

  const fetchMemo = async () => {
    try {
      const { data, error } = await supabase
        .from('ic_memos')
        .select(`
          *,
          deal:deals(company_name, fund_id)
        `)
        .eq('id', memoId)
        .single();

      if (error) throw error;
      setMemo(data as ICMemo);
      setReviewNotes((data as any).review_notes || '');
      setApprovalNotes((data as any).approval_notes || '');
    } catch (error) {
      console.error('Error fetching memo:', error);
      toast({
        title: "Error",
        description: "Failed to load memo details",
        variant: "destructive"
      });
    }
  };

  const handleSubmitForReview = async () => {
    if (!memo) return;
    
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('ic_memos')
        .update({
          workflow_state: 'submitted',
          submitted_at: new Date().toISOString()
        })
        .eq('id', memo.id);

      if (error) throw error;

      // Log activity
      await supabase
        .from('activity_events')
        .insert({
          user_id: (await supabase.auth.getUser()).data.user?.id,
          fund_id: memo.deal.fund_id,
          deal_id: memo.deal_id,
          activity_type: 'deal_updated',
          title: 'IC Memo Submitted for Review',
          description: `Memo for ${memo.deal.company_name} submitted for fund manager review`,
          context_data: {
            memo_id: memo.id,
            company_name: memo.deal.company_name
          }
        });

      toast({
        title: "Memo Submitted",
        description: "IC memo has been submitted for review",
        variant: "default"
      });

      onStatusChange?.('submitted');
      await fetchMemo();
    } catch (error) {
      console.error('Error submitting memo:', error);
      toast({
        title: "Submission Failed",
        description: "Failed to submit memo for review",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReview = async (approved: boolean) => {
    if (!memo || !canReview) return;
    
    setIsLoading(true);
    try {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      
      const { error } = await supabase
        .from('ic_memos')
        .update({
          workflow_state: approved ? 'approved' : 'rejected',
          reviewed_by: userId,
          reviewed_at: new Date().toISOString(),
          review_notes: reviewNotes,
          ...(approved ? {
            approved_by: userId,
            approved_at: new Date().toISOString(),
            approval_notes: approvalNotes
          } : {})
        })
        .eq('id', memo.id);

      if (error) throw error;

      // Log activity
      await supabase
        .from('activity_events')
        .insert({
          user_id: userId,
          fund_id: memo.deal.fund_id,
          deal_id: memo.deal_id,
          activity_type: 'deal_updated',
          title: `IC Memo ${approved ? 'Approved' : 'Rejected'}`,
          description: `Memo for ${memo.deal.company_name} ${approved ? 'approved' : 'rejected'} by fund manager`,
          context_data: {
            memo_id: memo.id,
            company_name: memo.deal.company_name,
            review_notes: reviewNotes,
            approval_notes: approved ? approvalNotes : undefined
          }
        });

      toast({
        title: approved ? "Memo Approved" : "Memo Rejected",
        description: `IC memo has been ${approved ? 'approved' : 'rejected'}`,
        variant: approved ? "default" : "destructive"
      });

      onStatusChange?.(approved ? 'approved' : 'rejected');
      await fetchMemo();
    } catch (error) {
      console.error('Error reviewing memo:', error);
      toast({
        title: "Review Failed",
        description: "Failed to process memo review",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBypassApproval = async () => {
    if (!memo || !canBypass) return;
    
    setIsLoading(true);
    try {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      
      const { error } = await supabase
        .from('ic_memos')
        .update({
          workflow_state: 'approved',
          reviewed_by: userId,
          approved_by: userId,
          reviewed_at: new Date().toISOString(),
          approved_at: new Date().toISOString(),
          review_notes: 'Super Admin bypass - approved directly',
          approval_notes: approvalNotes || 'Approved by Super Admin'
        })
        .eq('id', memo.id);

      if (error) throw error;

      // Log activity
      await supabase
        .from('activity_events')
        .insert({
          user_id: userId,
          fund_id: memo.deal.fund_id,
          deal_id: memo.deal_id,
          activity_type: 'deal_updated',
          title: 'IC Memo Approved (Super Admin Bypass)',
          description: `Memo for ${memo.deal.company_name} approved directly by Super Admin`,
          context_data: {
            memo_id: memo.id,
            company_name: memo.deal.company_name,
            bypass: true
          }
        });

      toast({
        title: "Memo Approved",
        description: "IC memo approved via Super Admin bypass",
        variant: "default"
      });

      onStatusChange?.('approved');
      await fetchMemo();
    } catch (error) {
      console.error('Error bypassing approval:', error);
      toast({
        title: "Bypass Failed",
        description: "Failed to bypass approval process",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!memo) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            {memoId ? 'Loading memo details...' : 'Select a memo to view approval flow'}
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusIcon = (workflowState: string) => {
    switch (workflowState) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-destructive" />;
      case 'submitted':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (workflowState: string) => {
    switch (workflowState) {
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'submitted':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-muted text-muted-foreground border-muted';
    }
  };

  return (
    <div className="space-y-6">
      {/* Memo Status Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              {getStatusIcon(memo.workflow_state || memo.status)}
              IC Memo Approval Flow
            </CardTitle>
            <Badge className={getStatusColor(memo.workflow_state || memo.status)}>
              {(memo.workflow_state || memo.status).toUpperCase().replace('_', ' ')}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold">{memo.title}</h3>
              <p className="text-sm text-muted-foreground">Company: {memo.deal.company_name}</p>
            </div>

            {/* Timeline */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <User className="h-4 w-4" />
                <span>Created by Analyst</span>
                {memo.submitted_at && (
                  <span className="text-muted-foreground">
                    • Submitted {new Date(memo.submitted_at).toLocaleDateString()}
                  </span>
                )}
              </div>
              
              {memo.reviewed_at && (
                <div className="flex items-center gap-3 text-sm">
                  <MessageSquare className="h-4 w-4" />
                  <span>Reviewed by Fund Manager</span>
                  <span className="text-muted-foreground">
                    • {new Date(memo.reviewed_at).toLocaleDateString()}
                  </span>
                </div>
              )}
              
              {memo.approved_at && (
                <div className="flex items-center gap-3 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Approved</span>
                  <span className="text-muted-foreground">
                    • {new Date(memo.approved_at).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Cards */}
      {(memo.workflow_state === 'draft' || (!memo.workflow_state && memo.status === 'draft')) && (
        <Card>
          <CardHeader>
            <CardTitle>Submit for Review</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Submit this memo to the Fund Manager for review and approval.
            </p>
            <Button 
              onClick={handleSubmitForReview}
              disabled={isLoading}
              className="w-full"
            >
              Submit for Review
            </Button>
          </CardContent>
        </Card>
      )}

      {memo.workflow_state === 'submitted' && canReview && (
        <Card>
          <CardHeader>
            <CardTitle>Review Memo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Review Notes</label>
              <Textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Add your review comments..."
                className="mt-1"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Approval Notes (if approving)</label>
              <Textarea
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                placeholder="Add approval notes..."
                className="mt-1"
              />
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={() => handleReview(true)}
                disabled={isLoading}
                className="flex-1"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Approve
              </Button>
              <Button 
                onClick={() => handleReview(false)}
                disabled={isLoading}
                variant="destructive"
                className="flex-1"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {canBypass && memo.workflow_state !== 'approved' && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-yellow-800">Super Admin Bypass</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-yellow-700">
              As a Super Admin, you can bypass the approval process and approve this memo directly.
            </p>
            
            <div>
              <label className="text-sm font-medium">Bypass Notes</label>
              <Textarea
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                placeholder="Reason for bypassing approval process..."
                className="mt-1"
              />
            </div>
            
            <Button 
              onClick={handleBypassApproval}
              disabled={isLoading}
              variant="outline"
              className="w-full border-yellow-300 text-yellow-700 hover:bg-yellow-100"
            >
              Bypass and Approve
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Review History */}
      {(memo.review_notes || memo.approval_notes) && (
        <Card>
          <CardHeader>
            <CardTitle>Review History</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {memo.review_notes && (
              <div>
                <label className="text-sm font-medium">Review Notes</label>
                <div className="mt-1 p-3 bg-muted rounded-md text-sm">
                  {memo.review_notes}
                </div>
              </div>
            )}
            
            {memo.approval_notes && (
              <div>
                <label className="text-sm font-medium">Approval Notes</label>
                <div className="mt-1 p-3 bg-green-50 border border-green-200 rounded-md text-sm">
                  {memo.approval_notes}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}