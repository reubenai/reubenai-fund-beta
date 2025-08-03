import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { calendarService, CreateCalendarInviteRequest } from '@/services/CalendarService';
import { Calendar, Clock, Users, Video, MapPin, Mail, Plus, X } from 'lucide-react';

interface ICSession {
  id: string;
  name: string;
  session_date: string;
  participants: any[];
  agenda?: any;
}

interface EnhancedCalendarSchedulerProps {
  isOpen: boolean;
  onClose: () => void;
  session: ICSession | null;
  onScheduled: () => void;
}

const conferenceOptions = [
  { value: 'zoom', label: 'Zoom', icon: Video },
  { value: 'teams', label: 'Microsoft Teams', icon: Video },
  { value: 'meet', label: 'Google Meet', icon: Video },
  { value: 'in_person', label: 'In Person', icon: MapPin },
];

export function EnhancedCalendarScheduler({ isOpen, onClose, session, onScheduled }: EnhancedCalendarSchedulerProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<{
    meeting_title: string;
    meeting_description: string;
    start_time: string;
    end_time: string;
    location: string;
    conference_method: 'zoom' | 'teams' | 'meet' | 'in_person';
    conference_url: string;
    organizer_email: string;
  }>({
    meeting_title: '',
    meeting_description: '',
    start_time: '',
    end_time: '',
    location: '',
    conference_method: 'zoom',
    conference_url: '',
    organizer_email: '',
  });
  const [attendees, setAttendees] = useState<{ email: string; name: string; role?: string }[]>([]);
  const [newAttendee, setNewAttendee] = useState({ email: '', name: '', role: '' });
  const [sendReminders, setSendReminders] = useState(true);
  const [includeAgenda, setIncludeAgenda] = useState(true);

  React.useEffect(() => {
    if (session) {
      // Pre-populate with session data
      const sessionDate = new Date(session.session_date);
      const endDate = new Date(sessionDate.getTime() + 2 * 60 * 60 * 1000); // 2 hours default

      setFormData({
        meeting_title: `IC Session: ${session.name}`,
        meeting_description: generateMeetingDescription(session),
        start_time: sessionDate.toISOString().slice(0, 16),
        end_time: endDate.toISOString().slice(0, 16),
        location: '',
        conference_method: 'zoom',
        conference_url: '',
        organizer_email: '',
      });

      // Pre-populate attendees from session participants
      if (session.participants && Array.isArray(session.participants)) {
        setAttendees(session.participants.map(p => ({
          email: p.email || '',
          name: p.name || `${p.first_name || ''} ${p.last_name || ''}`.trim(),
          role: p.role || 'Member'
        })));
      }
    }
  }, [session]);

  const generateMeetingDescription = (session: ICSession): string => {
    let description = `Investment Committee Session\n\n`;
    description += `Session: ${session.name}\n`;
    description += `Date: ${new Date(session.session_date).toLocaleDateString()}\n\n`;
    
    if (session.agenda) {
      description += `Agenda:\n`;
      if (typeof session.agenda === 'object' && session.agenda.items) {
        session.agenda.items.forEach((item: any, index: number) => {
          description += `${index + 1}. ${item.title || item}\n`;
        });
      }
    }
    
    description += `\nPlease join on time. All materials will be shared prior to the meeting.`;
    return description;
  };

  const addAttendee = () => {
    if (newAttendee.email && newAttendee.name) {
      setAttendees([...attendees, { ...newAttendee }]);
      setNewAttendee({ email: '', name: '', role: '' });
    }
  };

  const removeAttendee = (index: number) => {
    setAttendees(attendees.filter((_, i) => i !== index));
  };

  const generateConferenceUrl = () => {
    if (formData.conference_method !== 'in_person') {
      const url = calendarService.generateConferenceUrl(formData.conference_method);
      setFormData({ ...formData, conference_url: url });
    }
  };

  const handleSubmit = async () => {
    if (!session) return;

    // Validation
    if (!formData.meeting_title || !formData.start_time || !formData.end_time || !formData.organizer_email) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    if (attendees.length === 0) {
      toast({
        title: "No Attendees",
        description: "Please add at least one attendee.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const request: CreateCalendarInviteRequest = {
        session_id: session.id,
        ...formData,
        attendees,
      };

      const result = await calendarService.createCalendarInvite(request);

      if (result.success && result.invite) {
        // Send the invites
        const sendResult = await calendarService.sendInvites(result.invite.id);
        
        if (sendResult.success) {
          toast({
            title: "Calendar Invites Sent",
            description: `Meeting scheduled and invites sent to ${attendees.length} attendees.`,
            variant: "default",
          });
        } else {
          toast({
            title: "Meeting Scheduled",
            description: "Meeting created but there was an issue sending invites. You can resend them later.",
            variant: "default",
          });
        }

        onScheduled();
        onClose();
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      console.error('Error scheduling meeting:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to schedule meeting",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!session) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Schedule IC Session: {session.name}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Meeting Details */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="meeting_title">Meeting Title *</Label>
              <Input
                id="meeting_title"
                value={formData.meeting_title}
                onChange={(e) => setFormData({ ...formData, meeting_title: e.target.value })}
                placeholder="IC Session Meeting Title"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="start_time">Start Time *</Label>
                <Input
                  id="start_time"
                  type="datetime-local"
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_time">End Time *</Label>
                <Input
                  id="end_time"
                  type="datetime-local"
                  value={formData.end_time}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Conference Method</Label>
              <Select value={formData.conference_method} onValueChange={(value: any) => setFormData({ ...formData, conference_method: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {conferenceOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <option.icon className="h-4 w-4" />
                        {option.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formData.conference_method !== 'in_person' && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="conference_url">Conference URL</Label>
                  <Button type="button" variant="outline" size="sm" onClick={generateConferenceUrl}>
                    Generate
                  </Button>
                </div>
                <Input
                  id="conference_url"
                  value={formData.conference_url}
                  onChange={(e) => setFormData({ ...formData, conference_url: e.target.value })}
                  placeholder="Meeting URL will be generated"
                />
              </div>
            )}

            {formData.conference_method === 'in_person' && (
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Meeting room or address"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="organizer_email">Organizer Email *</Label>
              <Input
                id="organizer_email"
                type="email"
                value={formData.organizer_email}
                onChange={(e) => setFormData({ ...formData, organizer_email: e.target.value })}
                placeholder="your.email@company.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="meeting_description">Meeting Description</Label>
              <Textarea
                id="meeting_description"
                value={formData.meeting_description}
                onChange={(e) => setFormData({ ...formData, meeting_description: e.target.value })}
                className="min-h-[100px]"
                placeholder="Meeting agenda and details..."
              />
            </div>
          </div>

          {/* Right Column - Attendees */}
          <div className="space-y-4">
            <div>
              <Label className="text-base font-semibold">Attendees</Label>
              <p className="text-sm text-muted-foreground">Add committee members and stakeholders</p>
            </div>

            {/* Add New Attendee */}
            <div className="space-y-3 p-3 border rounded-lg">
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="Name"
                  value={newAttendee.name}
                  onChange={(e) => setNewAttendee({ ...newAttendee, name: e.target.value })}
                />
                <Input
                  placeholder="Role (optional)"
                  value={newAttendee.role}
                  onChange={(e) => setNewAttendee({ ...newAttendee, role: e.target.value })}
                />
              </div>
              <div className="flex gap-2">
                <Input
                  className="flex-1"
                  placeholder="email@company.com"
                  type="email"
                  value={newAttendee.email}
                  onChange={(e) => setNewAttendee({ ...newAttendee, email: e.target.value })}
                />
                <Button type="button" onClick={addAttendee} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Attendee List */}
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {attendees.map((attendee, index) => (
                <div key={index} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex-1">
                    <div className="font-medium">{attendee.name}</div>
                    <div className="text-sm text-muted-foreground">{attendee.email}</div>
                    {attendee.role && (
                      <div className="text-xs text-muted-foreground">{attendee.role}</div>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeAttendee(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            {/* Options */}
            <div className="space-y-3 pt-4 border-t">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="sendReminders"
                  checked={sendReminders}
                  onCheckedChange={(checked) => setSendReminders(checked === true)}
                />
                <Label htmlFor="sendReminders">Send reminder emails</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeAgenda"
                  checked={includeAgenda}
                  onCheckedChange={(checked) => setIncludeAgenda(checked === true)}
                />
                <Label htmlFor="includeAgenda">Include agenda in description</Label>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-6 border-t">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Scheduling...' : 'Schedule & Send Invites'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}