import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface BatchResetRequest {
  newPassword: string;
  confirmReset: boolean;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== Batch Password Reset Started ===');

    // Initialize Supabase admin client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Parse request body
    const { newPassword = 'ReubenDemo123!', confirmReset = false }: BatchResetRequest = await req.json();

    if (!confirmReset) {
      return new Response(
        JSON.stringify({ 
          error: 'Password reset not confirmed. Set confirmReset: true to proceed.' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Fetching all authenticated users...');

    // Get all users who should have passwords reset
    const { data: users, error: usersError } = await supabaseAdmin.auth.admin.listUsers();

    if (usersError) {
      console.error('Error fetching users:', usersError);
      throw new Error(`Failed to fetch users: ${usersError.message}`);
    }

    console.log(`Found ${users.users.length} users to process`);

    const results = {
      total: users.users.length,
      successful: 0,
      failed: 0,
      errors: [] as { email: string; error: string }[]
    };

    // Process each user
    for (const user of users.users) {
      try {
        console.log(`Processing user: ${user.email} (${user.id})`);

        // Reset password using admin API
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
          user.id,
          {
            password: newPassword,
            email_confirm: true, // Ensure email is confirmed
          }
        );

        if (updateError) {
          console.error(`Failed to update user ${user.email}:`, updateError);
          results.failed++;
          results.errors.push({
            email: user.email || 'unknown',
            error: updateError.message
          });
        } else {
          console.log(`Successfully updated password for: ${user.email}`);
          results.successful++;
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`Error processing user ${user.email}:`, error);
        results.failed++;
        results.errors.push({
          email: user.email || 'unknown',
          error: error.message
        });
      }
    }

    console.log('=== Batch Password Reset Summary ===');
    console.log(`Total users: ${results.total}`);
    console.log(`Successful: ${results.successful}`);
    console.log(`Failed: ${results.failed}`);

    // Clear all sessions to force re-login
    console.log('Clearing all sessions to force re-login...');
    
    try {
      // Use raw SQL to clear sessions since admin client doesn't have direct session management
      const { error: sessionError } = await supabaseAdmin
        .from('auth.sessions')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all sessions

      if (sessionError) {
        console.warn('Could not clear sessions via table access:', sessionError.message);
      } else {
        console.log('Successfully cleared all sessions');
      }
    } catch (sessionErr) {
      console.warn('Session cleanup failed:', sessionErr);
    }

    return new Response(
      JSON.stringify({
        message: 'Batch password reset completed',
        results,
        instructions: [
          'All users must now log out and log back in',
          `New temporary password: ${newPassword}`,
          'Users should be prompted to change their password after login'
        ]
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Batch password reset failed:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});