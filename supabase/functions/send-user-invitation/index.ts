import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InvitationRequest {
  email: string;
  role: string;
  organizationId: string;
  customMessage?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create service role client for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Create regular client to verify the calling user
    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    );

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Set the auth header for the user client
    supabaseUser.auth.setSession = () => Promise.resolve({ data: { session: null }, error: null });
    
    // Get user from token
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      console.error('User authentication error:', userError);
      return new Response(
        JSON.stringify({ error: 'Invalid authorization token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Authenticated user:', user.email);

    // Check if user has permission to send invitations
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role, organization_id')
      .eq('user_id', user.id)
      .single();

    if (profileError) {
      console.error('Profile lookup error:', profileError);
      return new Response(
        JSON.stringify({ error: 'Failed to verify user permissions' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is super_admin or reuben admin
    const isReubenAdmin = user.email?.includes('@goreuben.com') || user.email?.includes('@reuben.com');
    const isSuperAdmin = profile?.role === 'super_admin';

    if (!isReubenAdmin && !isSuperAdmin) {
      console.error('User lacks permission:', { email: user.email, role: profile?.role });
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions to send invitations' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('User has permission to send invitations');

    const { email, role, organizationId, customMessage }: InvitationRequest = await req.json();

    // Validate input
    if (!email || !role || !organizationId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: email, role, organizationId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify organization exists
    const { data: organization, error: orgError } = await supabaseAdmin
      .from('organizations')
      .select('id, name')
      .eq('id', organizationId)
      .single();

    if (orgError || !organization) {
      console.error('Organization verification error:', orgError);
      return new Response(
        JSON.stringify({ error: 'Invalid organization' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Sending invitation to:', email, 'for organization:', organization.name);

    // Generate invitation token
    const { data: tokenData, error: tokenError } = await supabaseAdmin
      .rpc('generate_invitation_token');

    if (tokenError || !tokenData) {
      console.error('Token generation error:', tokenError);
      return new Response(
        JSON.stringify({ error: 'Failed to generate invitation token' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const invitationToken = tokenData;

    // Store invitation in database
    const { data: invitationData, error: invitationError } = await supabaseAdmin
      .from('user_invitations')
      .insert({
        email,
        role,
        organization_id: organizationId,
        invited_by: user.id,
        custom_message: customMessage,
        invitation_token: invitationToken,
      })
      .select('id')
      .single();

    if (invitationError) {
      console.error('Invitation storage error:', invitationError);
      return new Response(
        JSON.stringify({ error: `Failed to store invitation: ${invitationError.message}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Send custom invitation email
    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
    const origin = req.headers.get('origin') || 'https://localhost:3000';
    const setupUrl = `${origin}/setup-password?token=${invitationToken}`;

    try {
      const emailData = await resend.emails.send({
        from: "ReubenAI <noreply@goreuben.com>",
        to: [email],
        subject: `You're invited to join ${organization.name} on ReubenAI`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="width: 60px; height: 60px; margin: 0 auto 20px; background: #2563eb; border-radius: 12px; display: flex; align-items: center; justify-content: center;">
                <span style="color: white; font-size: 24px; font-weight: bold;">R</span>
              </div>
              <h1 style="color: #1f2937; margin: 0;">Welcome to ReubenAI</h1>
            </div>
            
            <div style="background: #f8fafc; border-radius: 8px; padding: 24px; margin: 20px 0;">
              <h2 style="color: #1f2937; margin: 0 0 16px;">You've been invited!</h2>
              <p style="color: #4b5563; margin: 0 0 16px;">
                <strong>${user.email}</strong> has invited you to join <strong>${organization.name}</strong> on ReubenAI as a <strong>${role}</strong>.
              </p>
              ${customMessage ? `
                <div style="background: white; border-left: 4px solid #2563eb; padding: 16px; margin: 16px 0; border-radius: 4px;">
                  <p style="color: #4b5563; margin: 0; font-style: italic;">"${customMessage}"</p>
                </div>
              ` : ''}
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${setupUrl}" 
                 style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block;">
                Set Up Your Account
              </a>
            </div>

            <div style="background: #fef3c7; border-radius: 6px; padding: 16px; margin: 20px 0;">
              <p style="color: #92400e; margin: 0; font-size: 14px;">
                <strong>Important:</strong> This invitation will expire in 7 days. You'll need to set up your password before you can access the platform.
              </p>
            </div>

            <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
              <p style="color: #6b7280; font-size: 12px; margin: 0;">
                This invitation was sent by ReubenAI. If you didn't expect this invitation, you can safely ignore this email.
              </p>
            </div>
          </div>
        `,
      });

      console.log('Invitation email sent successfully:', emailData);
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      // Don't fail the invitation if email fails - log it but continue
    }

    // Log the activity
    try {
      await supabaseAdmin
        .from('activity_events')
        .insert({
          user_id: user.id,
          fund_id: '00000000-0000-0000-0000-000000000000', // placeholder since this is org-level
          activity_type: 'user_invited',
          title: 'User Invitation Sent',
          description: `Invitation sent to ${email} for ${role} role`,
          context_data: {
            invited_email: email,
            invited_role: role,
            organization_id: organizationId,
            organization_name: organization.name
          }
        });
    } catch (activityError) {
      console.error('Failed to log activity:', activityError);
      // Don't fail the invitation if activity logging fails
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Invitation sent successfully to ${email}`,
        invitationId: invitationData.id
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error: any) {
    console.error('Error in send-user-invitation function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
};

serve(handler);