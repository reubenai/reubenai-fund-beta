import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Send, 
  CheckCircle, 
  XCircle, 
  Calendar, 
  Vote, 
  Shield,
  Clock,
  AlertCircle,
  FileText,
  History
} from 'lucide-react';

import { useICWorkflow } from '@/hooks/useICWorkflow';
import { useUserRole } from '@/hooks/useUserRole';
import { WorkflowStatusBadge } from './WorkflowStatusBadge';

type WorkflowState = 'draft' | 'submitted' | 'approved' | 'rejected' | 'scheduled' | 'voting' | 'decided';

interface EnhancedWorkflowManagerProps {
  memo: {
    id: string;
    title: string;
    workflow_state: WorkflowState;
    deal_id: string;
    submitted_at?: string;
    submitted_by?: string;
    approved_at?: string;
    approved_by?: string;
    rejected_at?: string;
    rejected_by?: string;
    rejection_reason?: string;
    scheduled_at?: string;
    scheduled_by?: string;
  };
  onStateChange?: () => void;
}

export function EnhancedWorkflowManager({ memo, onStateChange }: EnhancedWorkflowManagerProps) {
  const { 
    submitMemoForReview,
    approveMemo,
    rejectMemo,
    scheduleForIC,
    startVoting,
    recordDecision,
    overrideWorkflow,
    getWorkflowAudit,
    canTransition
  } = useICWorkflow();
  
  const { role, isSuperAdmin } = useUserRole();
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showOverrideDialog, setShowOverrideDialog] = useState(false);
  const [showAuditDialog, setShowAuditDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [overrideReason, setOverrideReason] = useState('');
  const [overrideTargetState, setOverrideTargetState] = useState<WorkflowState>('draft');
  const [auditTrail, setAuditTrail] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const currentState = memo.workflow_state || 'draft';

  useEffect(() => {
    if (showAuditDialog) {
      loadAuditTrail();
    }
  }, [showAuditDialog]);

  const loadAuditTrail = async () => {
    const trail = await getWorkflowAudit(memo.id);
    setAuditTrail(trail);
  };

  const handleAction = async (action: () => Promise<any>) => {
    setLoading(true);
    try {
      const result = await action();
      if (result.success && onStateChange) {
        onStateChange();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitForReview = () => {
    handleAction(() => submitMemoForReview(memo.id));
  };

  const handleApprove = () => {
    handleAction(() => approveMemo(memo.id));
  };

  const handleReject = () => {
    if (!rejectionReason.trim()) return;
    handleAction(() => rejectMemo(memo.id, rejectionReason));
    setShowRejectDialog(false);
    setRejectionReason('');
  };

  const handleSchedule = () => {
    handleAction(() => scheduleForIC(memo.id));
  };

  const handleStartVoting = () => {
    handleAction(() => startVoting(memo.id));
  };

  const handleOverride = () => {
    if (!overrideReason.trim()) return;
    handleAction(() => overrideWorkflow(memo.id, overrideTargetState, overrideReason));
    setShowOverrideDialog(false);
    setOverrideReason('');
  };

  // Get available actions based on current state and user role
  const getAvailableActions = () => {
    const actions = [];

    // Check what transitions are allowed for this user
    if (canTransition(currentState, 'submitted', role).allowed && currentState === 'draft') {
      actions.push({
        key: 'submit',
        label: 'Submit for Review',
        icon: Send,
        action: handleSubmitForReview,
        variant: 'default' as const
      });
    }

    if (canTransition(currentState, 'approved', role).allowed && currentState === 'submitted') {
      actions.push({
        key: 'approve',
        label: 'Approve',
        icon: CheckCircle,
        action: handleApprove,
        variant: 'default' as const
      });
    }

    if (canTransition(currentState, 'rejected', role).allowed && ['submitted', 'approved'].includes(currentState)) {
      actions.push({
        key: 'reject',
        label: 'Reject',
        icon: XCircle,
        action: () => setShowRejectDialog(true),
        variant: 'destructive' as const
      });
    }

    if (canTransition(currentState, 'scheduled', role).allowed && currentState === 'approved') {
      actions.push({
        key: 'schedule',
        label: 'Schedule for IC',
        icon: Calendar,
        action: handleSchedule,
        variant: 'default' as const
      });
    }

    if (canTransition(currentState, 'voting', role).allowed && currentState === 'scheduled') {
      actions.push({
        key: 'voting',
        label: 'Start Voting',
        icon: Vote,
        action: handleStartVoting,
        variant: 'default' as const
      });
    }

    return actions;
  };

  const actions = getAvailableActions();

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Workflow Status</CardTitle>
            <CardDescription>IC memo workflow management</CardDescription>
          </div>
          <WorkflowStatusBadge state={currentState} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current State Info */}
        <div className="space-y-2">
          {memo.submitted_at && (
            <p className="text-sm text-muted-foreground">
              <Clock className="h-3 w-3 inline mr-1" />
              Submitted: {new Date(memo.submitted_at).toLocaleDateString()}
            </p>
          )}
          {memo.approved_at && (
            <p className="text-sm text-muted-foreground">
              <CheckCircle className="h-3 w-3 inline mr-1" />
              Approved: {new Date(memo.approved_at).toLocaleDateString()}
            </p>
          )}
          {memo.rejected_at && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Rejected: {memo.rejection_reason || 'No reason provided'}
                <br />
                <span className="text-xs text-muted-foreground">
                  {new Date(memo.rejected_at).toLocaleDateString()}
                </span>
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Action Buttons */}
        {actions.length > 0 && (
          <>
            <Separator />
            <div className="flex flex-wrap gap-2">
              {actions.map((action) => {
                const Icon = action.icon;
                return (
                  <Button
                    key={action.key}
                    variant={action.variant}
                    size="sm"
                    onClick={action.action}
                    disabled={loading}
                    className="flex items-center gap-2"
                  >
                    <Icon className="h-4 w-4" />
                    {action.label}
                  </Button>
                );
              })}
            </div>
          </>
        )}

        {/* Admin Controls */}
        <div className="flex justify-between items-center pt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAuditDialog(true)}
            className="text-muted-foreground"
          >
            <History className="h-4 w-4 mr-2" />
            View Audit Trail
          </Button>
          
          {isSuperAdmin && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowOverrideDialog(true)}
              className="text-orange-600 hover:text-orange-700"
            >
              <Shield className="h-4 w-4 mr-2" />
              Override
            </Button>
          )}
        </div>

        {/* Reject Dialog */}
        <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject Memo</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="rejection-reason">Rejection Reason</Label>
                <Textarea
                  id="rejection-reason"
                  placeholder="Please provide a clear reason for rejection..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="mt-2"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={handleReject}
                  disabled={!rejectionReason.trim() || loading}
                >
                  Reject Memo
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Override Dialog */}
        <Dialog open={showOverrideDialog} onOpenChange={setShowOverrideDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Super Admin Override</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  You are about to override the normal workflow. This action will be logged.
                </AlertDescription>
              </Alert>
              <div>
                <Label htmlFor="target-state">Target State</Label>
                <select
                  id="target-state"
                  value={overrideTargetState}
                  onChange={(e) => setOverrideTargetState(e.target.value as WorkflowState)}
                  className="w-full mt-2 p-2 border rounded"
                >
                  <option value="draft">Draft</option>
                  <option value="submitted">Submitted</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="voting">Voting</option>
                  <option value="decided">Decided</option>
                </select>
              </div>
              <div>
                <Label htmlFor="override-reason">Override Reason</Label>
                <Textarea
                  id="override-reason"
                  placeholder="Please provide a reason for this override..."
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  className="mt-2"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowOverrideDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={handleOverride}
                  disabled={!overrideReason.trim() || loading}
                >
                  Execute Override
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Audit Trail Dialog */}
        <Dialog open={showAuditDialog} onOpenChange={setShowAuditDialog}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Workflow Audit Trail</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {auditTrail.length === 0 ? (
                <p className="text-muted-foreground">No audit trail available</p>
              ) : (
                auditTrail.map((entry, index) => (
                  <div key={entry.id} className="border rounded p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <WorkflowStatusBadge state={entry.to_state} />
                        {entry.is_override && (
                          <Badge variant="destructive" className="text-xs">
                            <Shield className="h-3 w-3 mr-1" />
                            Override
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(entry.action_at).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">
                        {entry.from_state ? `${entry.from_state} → ${entry.to_state}` : `Set to ${entry.to_state}`}
                      </span>
                      {entry.reason && (
                        <p className="text-muted-foreground mt-1">{entry.reason}</p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}