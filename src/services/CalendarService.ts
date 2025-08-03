import { supabase } from '@/integrations/supabase/client';

export interface CalendarInvite {
  id: string;
  session_id: string;
  meeting_title: string;
  meeting_description?: string;
  start_time: string;
  end_time: string;
  location?: string;
  conference_method: 'zoom' | 'teams' | 'meet' | 'in_person';
  conference_url?: string;
  ics_content?: string;
  attendees: any[];
  organizer_email: string;
  invite_status: 'draft' | 'sent' | 'updated' | 'cancelled';
  calendar_provider: string;
  external_event_id?: string;
  reminder_sent: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateCalendarInviteRequest {
  session_id: string;
  meeting_title: string;
  meeting_description?: string;
  start_time: string;
  end_time: string;
  location?: string;
  conference_method: CalendarInvite['conference_method'];
  conference_url?: string;
  attendees: { email: string; name: string; role?: string }[];
  organizer_email: string;
}

class CalendarService {
  async createCalendarInvite(request: CreateCalendarInviteRequest): Promise<{ success: boolean; invite?: CalendarInvite; error?: string }> {
    try {
      console.log('Creating calendar invite:', request);

      // Generate ICS content
      const icsContent = this.generateICSContent(request);

      const { data, error } = await supabase
        .from('ic_calendar_invites')
        .insert({
          ...request,
          ics_content: icsContent,
          invite_status: 'draft',
          calendar_provider: 'outlook',
          reminder_sent: false,
        })
        .select()
        .single();

      if (error) throw error;

      console.log('Calendar invite created successfully:', data);
      return { success: true, invite: data as CalendarInvite };

    } catch (error: any) {
      console.error('Error creating calendar invite:', error);
      return { success: false, error: error.message };
    }
  }

  async sendInvites(inviteId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Get invite details
      const { data: invite, error: fetchError } = await supabase
        .from('ic_calendar_invites')
        .select('*')
        .eq('id', inviteId)
        .single();

      if (fetchError) throw fetchError;

      // Send via Resend API
      const { data, error } = await supabase.functions.invoke('send-ic-invitation', {
        body: {
          invite,
          action: 'send_calendar_invite'
        }
      });

      if (error) throw error;

      // Update invite status
      await supabase
        .from('ic_calendar_invites')
        .update({ invite_status: 'sent' })
        .eq('id', inviteId);

      console.log('Calendar invites sent successfully');
      return { success: true };

    } catch (error: any) {
      console.error('Error sending calendar invites:', error);
      return { success: false, error: error.message };
    }
  }

  async getInvites(sessionId: string): Promise<CalendarInvite[]> {
    try {
      const { data, error } = await supabase
        .from('ic_calendar_invites')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as CalendarInvite[];
    } catch (error) {
      console.error('Error fetching calendar invites:', error);
      return [];
    }
  }

  private generateICSContent(request: CreateCalendarInviteRequest): string {
    const startDate = new Date(request.start_time);
    const endDate = new Date(request.end_time);
    
    // Format dates for ICS (YYYYMMDDTHHMMSSZ)
    const formatDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const attendeeList = request.attendees
      .map(attendee => `ATTENDEE;CN=${attendee.name};RSVP=TRUE:mailto:${attendee.email}`)
      .join('\n');

    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//ReubenAI//Investment Committee//EN
CALSCALE:GREGORIAN
METHOD:REQUEST
BEGIN:VEVENT
UID:${crypto.randomUUID()}@reubenai.com
DTSTART:${formatDate(startDate)}
DTEND:${formatDate(endDate)}
DTSTAMP:${formatDate(new Date())}
ORGANIZER;CN=Investment Committee:mailto:${request.organizer_email}
${attendeeList}
SUMMARY:${request.meeting_title}
DESCRIPTION:${request.meeting_description || ''}
LOCATION:${request.location || request.conference_url || ''}
STATUS:CONFIRMED
SEQUENCE:0
BEGIN:VALARM
TRIGGER:-PT15M
DESCRIPTION:Reminder
ACTION:DISPLAY
END:VALARM
END:VEVENT
END:VCALENDAR`;

    return icsContent;
  }

  generateConferenceUrl(method: CalendarInvite['conference_method']): string {
    const meetingId = Math.random().toString(36).substring(2, 15);
    
    switch (method) {
      case 'zoom':
        return `https://zoom.us/j/${meetingId}`;
      case 'teams':
        return `https://teams.microsoft.com/l/meetup-join/${meetingId}`;
      case 'meet':
        return `https://meet.google.com/${meetingId}`;
      default:
        return '';
    }
  }
}

export const calendarService = new CalendarService();