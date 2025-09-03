import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Send, 
  MessageSquare,
  AlertTriangle,
  Eye
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { usePermissions } from '@/hooks/usePermissions';

interface ReviewWorkflowProps {
  memoId: string;
  dealName: string;
  currentStatus: string;
  onStatusChange: (newStatus: string) => void;
  onViewMemo: () => void;
  onSubmissionSuccess?: () => void;
}

export const ICReviewWorkflow: React.FC<ReviewWorkflowProps> = ({
  memoId,
  dealName,
  currentStatus,
  onStatusChange,
  onViewMemo,
  onSubmissionSuccess
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const { toast } = useToast();
  const { canReviewMemos, canSubmitForReview } = usePermissions();

  const handleSubmitForReview = async () => {
    if (currentStatus !== 'draft') return;
    
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('ic_memos')
        .update({
          workflow_state: 'submitted',
          submitted_for_review_at: new Date().toISOString(),
          review_priority: 'medium'
        })
        .eq('id', memoId);

      if (error) throw error;

      onStatusChange('submitted');
      toast({
        title: "Memo Submitted for Review",
        description: `${dealName} memo has been submitted to the review queue`,
      });
      
      // Call success callback to close modal
      onSubmissionSuccess?.();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit memo for review",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApproveMemo = async () => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('ic_memos')
        .update({
          workflow_state: 'approved',
          approved_at: new Date().toISOString(),
          approved_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('id', memoId);

      if (error) throw error;

      onStatusChange('approved');
      toast({
        title: "Memo Approved",
        description: `${dealName} memo has been approved for IC scheduling`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to approve memo",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRejectMemo = async () => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('ic_memos')
        .update({
          workflow_state: 'rejected',
          rejected_at: new Date().toISOString(),
          rejected_by: (await supabase.auth.getUser()).data.user?.id,
          rejection_reason: rejectionReason
        })
        .eq('id', memoId);

      if (error) throw error;

      onStatusChange('rejected');
      setShowRejectDialog(false);
      setRejectionReason('');
      toast({
        title: "Memo Rejected",
        description: `${dealName} memo has been rejected and returned to draft`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reject memo",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="outline" className="gap-1"><Clock className="w-3 h-3" />Draft</Badge>;
      case 'submitted':
        return <Badge className="bg-amber-50 text-amber-700 border-amber-200 gap-1"><Eye className="w-3 h-3" />Under Review</Badge>;
      case 'approved':
        return <Badge className="bg-green-50 text-green-700 border-green-200 gap-1"><CheckCircle className="w-3 h-3" />Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-50 text-red-700 border-red-200 gap-1"><XCircle className="w-3 h-3" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            Review Workflow
            {getStatusBadge(currentStatus)}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={onViewMemo}
            className="gap-2"
          >
            <Eye className="w-4 h-4" />
            View Memo
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Draft Status */}
        {currentStatus === 'draft' && canSubmitForReview && (
          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
            <div>
              <p className="font-medium text-blue-900">Ready to submit for review</p>
              <p className="text-sm text-blue-700">
                Once submitted, fund managers will be notified to review this memo
              </p>
            </div>
            <Button
              onClick={handleSubmitForReview}
              disabled={isSubmitting}
              className="gap-2"
            >
              <Send className="w-4 h-4" />
              {isSubmitting ? 'Submitting...' : 'Submit for Review'}
            </Button>
          </div>
        )}

        {/* Review Status */}
        {currentStatus === 'submitted' && (
          <div className="space-y-3">
            <div className="p-4 bg-amber-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <p className="font-medium text-amber-900">Pending Review</p>
              </div>
              <p className="text-sm text-amber-700">
                This memo is in the review queue waiting for approval from fund managers
              </p>
            </div>

            {canReviewMemos && (
              <div className="flex gap-3">
                <Button
                  onClick={handleApproveMemo}
                  disabled={isSubmitting}
                  className="gap-2 bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="w-4 h-4" />
                  {isSubmitting ? 'Approving...' : 'Approve Memo'}
                </Button>

                <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="gap-2 border-red-200 text-red-700 hover:bg-red-50"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject Memo
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Reject Memo</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        Please provide a reason for rejecting this memo to help the author improve it.
                      </p>
                      <Textarea
                        placeholder="Explain why this memo needs to be revised..."
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        className="min-h-[100px]"
                      />
                      <div className="flex justify-end gap-3">
                        <Button
                          variant="outline"
                          onClick={() => setShowRejectDialog(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleRejectMemo}
                          disabled={isSubmitting || !rejectionReason.trim()}
                          variant="destructive"
                          className="gap-2"
                        >
                          <XCircle className="w-4 h-4" />
                          {isSubmitting ? 'Rejecting...' : 'Reject Memo'}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </div>
        )}

        {/* Approved Status */}
        {currentStatus === 'approved' && (
          <div className="p-4 bg-green-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <p className="font-medium text-green-900">Memo Approved</p>
            </div>
            <p className="text-sm text-green-700">
              This memo has been approved and can now be scheduled for IC review
            </p>
          </div>
        )}

        {/* Rejected Status */}
        {currentStatus === 'rejected' && (
          <div className="p-4 bg-red-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <XCircle className="w-5 h-5 text-red-600" />
              <p className="font-medium text-red-900">Memo Rejected</p>
            </div>
            <p className="text-sm text-red-700">
              This memo has been rejected and needs revision before resubmission
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};