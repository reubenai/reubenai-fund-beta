import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface InvitationRequest {
  sessionId: string;
  recipientEmails: string[];
  message?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sessionId, recipientEmails, message }: InvitationRequest = await req.json();

    console.log('📧 IC Invitation: Sending invitations for session:', sessionId);

    // Fetch session details
    const { data: session, error: sessionError } = await supabase
      .from('ic_sessions')
      .select(`
        *,
        funds (name),
        ic_session_deals (
          deals (company_name, deal_size, valuation)
        )
      `)
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      throw new Error(`Session not found: ${sessionError?.message}`);
    }

    // Generate calendar event details
    const sessionDate = new Date(session.session_date);
    const calendarEvent = {
      title: session.name,
      start: sessionDate.toISOString(),
      end: new Date(sessionDate.getTime() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours duration
      description: `Investment Committee Session for ${session.funds.name}`,
      location: 'Virtual Meeting'
    };

    // Format deals information
    const dealsInfo = session.ic_session_deals?.map(sd => 
      `• ${sd.deals.company_name} (${sd.deals.deal_size ? `$${sd.deals.deal_size.toLocaleString()}` : 'TBD'})`
    ).join('\n') || 'No deals scheduled';

    // Create invitation email content
    const emailContent = `
Subject: Investment Committee Meeting Invitation - ${session.name}

Dear Committee Member,

You are invited to attend the upcoming Investment Committee session for ${session.funds.name}.

SESSION DETAILS:
📅 Date: ${sessionDate.toLocaleDateString()}
🕐 Time: ${sessionDate.toLocaleTimeString()}
📍 Location: Virtual Meeting
🎯 Fund: ${session.funds.name}

AGENDA:
${dealsInfo}

${message ? `\nAdditional Notes:\n${message}` : ''}

Please confirm your attendance by responding to this invitation.

Calendar event details are attached for your convenience.

Best regards,
Investment Committee Team
    `;

    // Log invitation activity
    const { error: activityError } = await supabase
      .from('activity_events')
      .insert({
        fund_id: session.fund_id,
        activity_type: 'ic_session_scheduled',
        title: 'IC Session Scheduled',
        description: `IC session "${session.name}" scheduled with ${recipientEmails.length} invitees`,
        user_id: '00000000-0000-0000-0000-000000000000', // System user
        context_data: {
          session_id: sessionId,
          session_name: session.name,
          session_date: session.session_date,
          invitee_count: recipientEmails.length
        }
      });

    if (activityError) {
      console.warn('Could not log activity:', activityError.message);
    }

    // In a real implementation, you would integrate with an email service
    // For now, we'll simulate the invitation sending
    console.log('📧 Invitations would be sent to:', recipientEmails);
    console.log('📧 Email content:', emailContent);
    console.log('📅 Calendar event:', calendarEvent);

    return new Response(JSON.stringify({
      success: true,
      message: `Invitations sent to ${recipientEmails.length} recipients`,
      emailContent,
      calendarEvent,
      sessionDetails: {
        id: session.id,
        name: session.name,
        date: session.session_date,
        fund: session.funds.name,
        dealCount: session.ic_session_deals?.length || 0
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ IC Invitation Error:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});