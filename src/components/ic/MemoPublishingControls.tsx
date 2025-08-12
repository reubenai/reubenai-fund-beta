import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Send, Clock, CheckCircle, Eye, Globe, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { usePermissions } from '@/hooks/usePermissions';
import { supabase } from '@/integrations/supabase/client';

interface MemoPublishingControlsProps {
  memoId: string;
  currentStatus: string;
  isPublished: boolean;
  dealName: string;
  onStatusUpdate: () => void;
}

export function MemoPublishingControls({ 
  memoId, 
  currentStatus, 
  isPublished, 
  dealName,
  onStatusUpdate
}: MemoPublishingControlsProps) {
  const { canSubmitForReview, loading } = usePermissions();
  const [isPublishing, setIsPublishing] = useState(false);
  const [isSubmittingForReview, setIsSubmittingForReview] = useState(false);
  const [publishingNotes, setPublishingNotes] = useState('');
  const [reviewerNotes, setReviewerNotes] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const { toast } = useToast();

  const handlePublishMemo = async () => {
    try {
      setIsPublishing(true);
      
      const { error } = await supabase
        .from('ic_memos')
        .update({ 
          status: 'published',
          is_published: true,
          published_at: new Date().toISOString(),
          publishing_notes: publishingNotes || null
        })
        .eq('id', memoId);

      if (error) throw error;

      toast({
        title: "Memo Published",
        description: `${dealName} memo is now available to all IC members`,
      });

      onStatusUpdate();
      setPublishingNotes('');
    } catch (error) {
      console.error('Error publishing memo:', error);
      toast({
        title: "Error",
        description: "Failed to publish memo. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsPublishing(false);
    }
  };

  const handleSubmitForReview = async () => {
    try {
      setIsSubmittingForReview(true);
      
      const { error } = await supabase
        .from('ic_memos')
        .update({ 
          workflow_state: 'submitted',
          review_priority: priority,
          review_notes: reviewerNotes || null,
          submitted_for_review_at: new Date().toISOString()
        })
        .eq('id', memoId);

      if (error) throw error;

      toast({
        title: "Submitted for Review",
        description: `${dealName} memo has been submitted for IC review`,
      });

      onStatusUpdate();
      setReviewerNotes('');
    } catch (error) {
      console.error('Error submitting for review:', error);
      toast({
        title: "Error",
        description: "Failed to submit memo for review. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmittingForReview(false);
    }
  };

  const handleUnpublishMemo = async () => {
    try {
      setIsPublishing(true);
      
      const { error } = await supabase
        .from('ic_memos')
        .update({ 
          status: 'draft',
          is_published: false,
          published_at: null
        })
        .eq('id', memoId);

      if (error) throw error;

      toast({
        title: "Memo Unpublished",
        description: `${dealName} memo is now in draft status`,
      });

      onStatusUpdate();
    } catch (error) {
      console.error('Error unpublishing memo:', error);
      toast({
        title: "Error",
        description: "Failed to unpublish memo. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsPublishing(false);
    }
  };

  const getStatusBadge = () => {
    switch (currentStatus) {
      case 'draft':
        return <Badge variant="outline" className="gap-1"><Lock className="h-3 w-3" />Draft</Badge>;
      case 'submitted':
        return <Badge variant="outline" className="gap-1 bg-amber-50 text-amber-700 border-amber-200"><Clock className="h-3 w-3" />Under Review</Badge>;
      case 'published':
        return <Badge variant="outline" className="gap-1 bg-green-50 text-green-700 border-green-200"><Globe className="h-3 w-3" />Published</Badge>;
      case 'approved':
        return <Badge variant="outline" className="gap-1 bg-green-50 text-green-700 border-green-200"><CheckCircle className="h-3 w-3" />Approved</Badge>;
      default:
        return <Badge variant="outline">{currentStatus}</Badge>;
    }
  };

  return (
    <div className="flex items-center gap-3">
      {getStatusBadge()}
      
      {!loading && canSubmitForReview && currentStatus === 'draft' && (
        <>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Eye className="h-4 w-4" />
                Submit for Review
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md" aria-describedby="submit-memo-description">
              <DialogHeader>
                <DialogTitle>Submit for IC Review</DialogTitle>
              </DialogHeader>
              <p id="submit-memo-description" className="sr-only">
                Submit this memo for Investment Committee review with priority level and optional notes.
              </p>
              <div className="space-y-4">
                <div>
                  <Label>Priority Level</Label>
                  <Select value={priority} onValueChange={(value: 'low' | 'medium' | 'high') => setPriority(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low Priority</SelectItem>
                      <SelectItem value="medium">Medium Priority</SelectItem>
                      <SelectItem value="high">High Priority</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Review Notes (Optional)</Label>
                  <Textarea
                    placeholder="Add any notes for the reviewers..."
                    value={reviewerNotes}
                    onChange={(e) => setReviewerNotes(e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <DialogTrigger asChild>
                    <Button variant="outline">Cancel</Button>
                  </DialogTrigger>
                  <Button 
                    onClick={handleSubmitForReview}
                    disabled={isSubmittingForReview}
                    className="gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    Submit for Review
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </>
      )}

      {currentStatus === 'submitted' && (
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Send className="h-4 w-4" />
                Publish Memo
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md" aria-describedby="publish-memo-description">
              <DialogHeader>
                <DialogTitle>Publish IC Memo</DialogTitle>
              </DialogHeader>
              <p id="publish-memo-description" className="sr-only">
                Publish this memo to make it available to all Investment Committee members for upcoming sessions.
              </p>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Publishing this memo will make it available to all IC members and include it in upcoming sessions.
              </p>
              <div>
                <Label>Publishing Notes (Optional)</Label>
                <Textarea
                  placeholder="Add any publishing notes..."
                  value={publishingNotes}
                  onChange={(e) => setPublishingNotes(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <DialogTrigger asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogTrigger>
                <Button 
                  onClick={handlePublishMemo}
                  disabled={isPublishing}
                  className="gap-2"
                >
                  <Send className="h-4 w-4" />
                  Publish Memo
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {isPublished && currentStatus === 'published' && (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleUnpublishMemo}
          disabled={isPublishing}
          className="gap-2"
        >
          <Lock className="h-4 w-4" />
          Unpublish
        </Button>
      )}
    </div>
  );
}