import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WebhookPayload {
  event: string;
  session: {
    user: {
      id: string;
      email: string;
    };
  };
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: WebhookPayload = await req.json();
    
    console.log('Custom Access Token Hook triggered:', {
      event: payload.event,
      userId: payload.session?.user?.id,
      email: payload.session?.user?.email
    });

    // Create Supabase client with service role key
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const userId = payload.session?.user?.id;
    const userEmail = payload.session?.user?.email;

    if (!userId) {
      console.error('No user ID in payload');
      return new Response(
        JSON.stringify({ error: 'No user ID provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user has Reuben admin privileges
    const isReubenAdmin = userEmail?.includes('@goreuben.com') || userEmail?.includes('@reuben.com');
    
    let customClaims: any = {
      user_role: 'viewer', // default role
      org_id: '550e8400-e29b-41d4-a716-446655440000', // default Reuben org
      is_super_admin: isReubenAdmin
    };

    // If Reuben admin, set super admin privileges
    if (isReubenAdmin) {
      customClaims = {
        user_role: 'super_admin',
        org_id: '550e8400-e29b-41d4-a716-446655440000',
        is_super_admin: true
      };
      
      console.log('Reuben admin detected, setting super admin claims:', customClaims);
    } else {
      // Fetch user profile for regular users
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role, organization_id, is_deleted')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching user profile:', error);
        // Return default claims if profile fetch fails
      } else if (profile && !profile.is_deleted) {
        customClaims = {
          user_role: profile.role || 'viewer',
          org_id: profile.organization_id || '550e8400-e29b-41d4-a716-446655440000',
          is_super_admin: false
        };
        
        console.log('Profile found, setting custom claims:', customClaims);
      } else {
        console.log('No active profile found for user, using default claims');
      }
    }

    // Return the custom claims to be added to the JWT
    const response = {
      claims: customClaims
    };

    console.log('Returning custom claims:', response);

    return new Response(
      JSON.stringify(response),
      { 
        status: 200, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Error in custom access token hook:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});