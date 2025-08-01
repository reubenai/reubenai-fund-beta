import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

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

    // Send invitation using admin client
    const redirectUrl = `${req.headers.get('origin') || 'https://localhost:3000'}/auth`;
    
    const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      redirectTo: redirectUrl,
      data: {
        invited_role: role,
        invited_organization_id: organizationId,
        custom_message: customMessage,
        invited_by: user.email,
        organization_name: organization.name
      }
    });

    if (error) {
      console.error('Invitation error:', error);
      return new Response(
        JSON.stringify({ error: `Failed to send invitation: ${error.message}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Invitation sent successfully:', data);

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
        data 
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