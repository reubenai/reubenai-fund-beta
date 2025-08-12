import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Send, 
  CheckCircle, 
  XCircle, 
  ArrowLeft,
  Clock,
  User,
  Loader2 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { usePermissions } from '@/hooks/usePermissions';
import { useEnhancedActivityTracking } from '@/hooks/useEnhancedActivityTracking';
import { supabase } from '@/integrations/supabase/client';

interface MemoWorkflowControlsProps {
  memoId: string;
  status: string;
  dealName: string;
  fundId: string;
  createdBy?: string;
  reviewedBy?: string;
  onStatusUpdate: () => void;
}

export const MemoWorkflowControls: React.FC<MemoWorkflowControlsProps> = ({
  memoId,
  status,
  dealName,
  fundId,
  createdBy,
  reviewedBy,
  onStatusUpdate
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const { toast } = useToast();
  const { canSubmitForReview, canReviewMemos } = usePermissions();
  const { logMemoGeneration } = useEnhancedActivityTracking();

  const handleSubmitForReview = async () => {
    try {
      setIsSubmitting(true);
      
      const { error } = await supabase
        .from('ic_memos')
        .update({
          workflow_state: 'submitted',
          submitted_for_review_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', memoId);

      if (error) throw error;

      // Log activity
      logMemoGeneration(
        memoId,
        dealName,
        { status: 'review', action: 'submitted_for_review' }
      );

      toast({
        title: "Submitted for Review",
        description: `${dealName} memo has been submitted to Fund Managers for review.`,
      });

      onStatusUpdate();
    } catch (error) {
      console.error('Error submitting memo for review:', error);
      toast({
        title: "Submission Failed",
        description: "Failed to submit memo for review. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReviewAction = async () => {
    if (!reviewAction) return;

    try {
      setIsSubmitting(true);
      
      const { data: user } = await supabase.auth.getUser();
      const userId = user.user?.id;
      
      const { error } = await supabase
        .from('ic_memos')
        .update({
          workflow_state: reviewAction === 'approve' ? 'approved' : 'rejected',
          reviewed_by: userId,
          reviewed_at: new Date().toISOString(),
          review_notes: reviewNotes,
          updated_at: new Date().toISOString()
        })
        .eq('id', memoId);

      if (error) throw error;

      // Log activity
      logMemoGeneration(
        memoId,
        dealName,
        { 
          status: reviewAction === 'approve' ? 'approved' : 'rejected', 
          action: reviewAction,
          review_notes: reviewNotes 
        }
      );

      toast({
        title: reviewAction === 'approve' ? "Memo Approved" : "Memo Rejected",
        description: `${dealName} memo has been ${reviewAction}d.`,
      });

      setShowReviewDialog(false);
      setReviewAction(null);
      setReviewNotes('');
      onStatusUpdate();
    } catch (error) {
      console.error('Error updating memo status:', error);
      toast({
        title: "Review Failed",
        description: "Failed to update memo status. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWithdraw = async () => {
    try {
      setIsSubmitting(true);
      
      const { error } = await supabase
        .from('ic_memos')
        .update({
          workflow_state: 'draft',
          submitted_for_review_at: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', memoId);

      if (error) throw error;

      toast({
        title: "Withdrawn from Review",
        description: `${dealName} memo has been withdrawn and returned to draft status.`,
      });

      onStatusUpdate();
    } catch (error) {
      console.error('Error withdrawing memo:', error);
      toast({
        title: "Withdrawal Failed",
        description: "Failed to withdraw memo from review. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusDisplay = () => {
    switch (status) {
      case 'draft':
        return (
          <Badge className="bg-gray-50 text-gray-700 border-gray-200">
            <Clock className="w-3 h-3 mr-1" />
            Draft
          </Badge>
        );
      case 'review':
        return (
          <Badge className="bg-amber-50 text-amber-700 border-amber-200">
            <User className="w-3 h-3 mr-1" />
            Under Review
          </Badge>
        );
      case 'approved':
        return (
          <Badge className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Approved
          </Badge>
        );
      case 'rejected':
        return (
          <Badge className="bg-red-50 text-red-700 border-red-200">
            <XCircle className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        );
      case 'published':
        return (
          <Badge className="bg-blue-50 text-blue-700 border-blue-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Published
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex items-center gap-2">
      {getStatusDisplay()}
      
      {/* Submit for Review - Analysts can submit draft memos */}
      {status === 'draft' && canSubmitForReview && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleSubmitForReview}
          disabled={isSubmitting}
          className="gap-2"
        >
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
          Submit for Review
        </Button>
      )}

      {/* Withdraw from Review - Authors can withdraw */}
      {status === 'review' && canSubmitForReview && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleWithdraw}
          disabled={isSubmitting}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Withdraw
        </Button>
      )}

      {/* Review Actions - Fund Managers can approve/reject */}
      {status === 'review' && canReviewMemos && (
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setReviewAction('approve');
              setShowReviewDialog(true);
            }}
            disabled={isSubmitting}
            className="gap-2 text-green-700 border-green-200 hover:bg-green-50"
          >
            <CheckCircle className="w-4 h-4" />
            Approve
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setReviewAction('reject');
              setShowReviewDialog(true);
            }}
            disabled={isSubmitting}
            className="gap-2 text-red-700 border-red-200 hover:bg-red-50"
          >
            <XCircle className="w-4 h-4" />
            Reject
          </Button>
        </>
      )}

      {/* Review Dialog */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {reviewAction === 'approve' ? 'Approve' : 'Reject'} Memo
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                You are about to {reviewAction} the memo for <strong>{dealName}</strong>.
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="review-notes">
                {reviewAction === 'approve' ? 'Approval Notes (Optional)' : 'Rejection Reason'}
              </Label>
              <Textarea
                id="review-notes"
                placeholder={
                  reviewAction === 'approve' 
                    ? "Add any notes about the approval..."
                    : "Please provide specific feedback for improvement..."
                }
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                rows={3}
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowReviewDialog(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleReviewAction}
                disabled={isSubmitting || (reviewAction === 'reject' && !reviewNotes.trim())}
                className={
                  reviewAction === 'approve' 
                    ? "bg-green-600 hover:bg-green-700" 
                    : "bg-red-600 hover:bg-red-700"
                }
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  reviewAction === 'approve' ? (
                    <CheckCircle className="w-4 h-4 mr-2" />
                  ) : (
                    <XCircle className="w-4 h-4 mr-2" />
                  )
                )}
                {reviewAction === 'approve' ? 'Approve Memo' : 'Reject Memo'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};