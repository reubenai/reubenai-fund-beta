import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CalendarInviteRequest {
  invite: {
    id: string;
    meeting_title: string;
    meeting_description?: string;
    start_time: string;
    end_time: string;
    location?: string;
    conference_url?: string;
    ics_content?: string;
    attendees: any[];
    organizer_email: string;
  };
  action: 'send_calendar_invite' | 'send_reminder' | 'send_update';
  customMessage?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { invite, action }: CalendarInviteRequest = await req.json();

    console.log(`Processing ${action} for invite:`, invite.id);

    const subject = `📅 Investment Committee Meeting: ${invite.meeting_title}`;
    const htmlContent = generateInviteEmail(invite);

    // Send to all attendees
    const emailPromises = invite.attendees.map(async (attendee) => {
      const attachments = invite.ics_content ? [{
        filename: 'meeting.ics',
        content: btoa(invite.ics_content),
        content_type: 'text/calendar; charset=utf-8',
      }] : [];

      return resend.emails.send({
        from: `Investment Committee <${invite.organizer_email}>`,
        to: [attendee.email],
        subject,
        html: htmlContent,
        attachments,
      });
    });

    const results = await Promise.allSettled(emailPromises);
    const successCount = results.filter(r => r.status === 'fulfilled').length;
    const failureCount = results.filter(r => r.status === 'rejected').length;

    console.log(`Email results: ${successCount} sent, ${failureCount} failed`);

    return new Response(JSON.stringify({
      success: true,
      sent: successCount,
      failed: failureCount,
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("Error in send-ic-invitation function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

function generateInviteEmail(invite: any): string {
  const startDate = new Date(invite.start_time);
  const endDate = new Date(invite.end_time);
  
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: white; border-radius: 8px; padding: 30px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <h1 style="color: #1f2937; font-size: 24px; margin: 0 0 20px 0; text-align: center;">
          📅 Investment Committee Meeting
        </h1>
        
        <h2 style="color: #374151; font-size: 18px; margin: 0 0 20px 0;">
          ${invite.meeting_title}
        </h2>
        
        <div style="background: #f3f4f6; border-radius: 6px; padding: 20px; margin-bottom: 20px;">
          <p><strong>📅 Date:</strong> ${startDate.toLocaleDateString()}</p>
          <p><strong>⏰ Time:</strong> ${startDate.toLocaleTimeString()} - ${endDate.toLocaleTimeString()}</p>
          ${invite.location ? `<p><strong>📍 Location:</strong> ${invite.location}</p>` : ''}
          ${invite.conference_url ? `<p><strong>💻 Join:</strong> <a href="${invite.conference_url}">${invite.conference_url}</a></p>` : ''}
        </div>
        
        ${invite.meeting_description ? `
        <div style="margin-bottom: 20px;">
          <h3>Agenda</h3>
          <div style="white-space: pre-line;">${invite.meeting_description}</div>
        </div>
        ` : ''}
        
        <p style="text-align: center; color: #6b7280;">
          Please confirm your attendance. See you there!
        </p>
      </div>
    </div>
  `;
}

serve(handler);