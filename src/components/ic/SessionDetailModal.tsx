import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Calendar, Users, Clock, Edit, Save, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ICSession } from '@/services/ICMemoService';

interface SessionDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: ICSession;
  onSessionUpdated: (updatedSession: ICSession) => void;
}

export function SessionDetailModal({ isOpen, onClose, session, onSessionUpdated }: SessionDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: session.name,
    session_date: new Date(session.session_date).toISOString().slice(0, 16),
    notes: session.notes || '',
    status: session.status
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    setIsSubmitting(true);
    
    try {
      const { data, error } = await supabase
        .from('ic_sessions')
        .update({
          name: editForm.name,
          session_date: new Date(editForm.session_date).toISOString(),
          notes: editForm.notes,
          status: editForm.status,
          updated_at: new Date().toISOString()
        })
        .eq('id', session.id)
        .select()
        .single();

      if (error) throw error;

      const updatedSession = { ...session, ...data };
      onSessionUpdated(updatedSession);
      setIsEditing(false);
      
      toast({
        title: "Session Updated",
        description: "IC session details have been updated successfully.",
      });
    } catch (error) {
      console.error('Error updating session:', error);
      toast({
        title: "Error",
        description: "Failed to update session. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setEditForm({
      name: session.name,
      session_date: new Date(session.session_date).toISOString().slice(0, 16),
      notes: session.notes || '',
      status: session.status
    });
    setIsEditing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const agenda = session.agenda && typeof session.agenda === 'object' 
    ? (session.agenda as any).items || [] 
    : [];

  const participants = Array.isArray(session.participants) ? session.participants : [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              IC Session Details
            </div>
            {!isEditing && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="gap-2"
              >
                <Edit className="h-4 w-4" />
                Edit
              </Button>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Session Name */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Session Name</Label>
            {isEditing ? (
              <Input
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                placeholder="Session name"
              />
            ) : (
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-foreground">{session.name}</h3>
                <Badge variant="secondary" className={getStatusColor(session.status)}>
                  {session.status.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>
            )}
          </div>

          {/* Date & Time */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Date & Time</Label>
            {isEditing ? (
              <Input
                type="datetime-local"
                value={editForm.session_date}
                onChange={(e) => setEditForm({ ...editForm, session_date: e.target.value })}
              />
            ) : (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                {new Date(session.session_date).toLocaleString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            )}
          </div>

          {/* Status */}
          {isEditing && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Status</Label>
              <select
                value={editForm.status}
                onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                className="w-full p-2 border rounded-md"
              >
                <option value="scheduled">Scheduled</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          )}

          {/* Participants */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Participants</Label>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>{participants.length} participants</span>
            </div>
            {participants.length > 0 && (
              <div className="text-sm text-muted-foreground">
                {participants.join(', ')}
              </div>
            )}
          </div>

          {/* Agenda */}
          {agenda.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Agenda</Label>
              <div className="space-y-1">
                {agenda.map((item: string, index: number) => (
                  <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="text-xs text-muted-foreground/70">{index + 1}.</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Notes</Label>
            {isEditing ? (
              <Textarea
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                placeholder="Session notes..."
                rows={4}
                className="resize-none"
              />
            ) : (
              <div className="min-h-[100px] p-3 border rounded-md bg-muted/30">
                {session.notes ? (
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{session.notes}</p>
                ) : (
                  <p className="text-sm text-muted-foreground/60 italic">No notes added yet</p>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            {isEditing ? (
              <>
                <Button variant="outline" onClick={handleCancel}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button 
                  onClick={handleSave}
                  disabled={isSubmitting}
                  className="gap-2"
                >
                  <Save className="h-4 w-4" />
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </Button>
              </>
            ) : (
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}