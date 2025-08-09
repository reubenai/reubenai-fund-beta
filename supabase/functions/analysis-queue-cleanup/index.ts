import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🧹 Analysis Queue Cleanup: Starting...');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Clear stuck processing jobs older than 30 minutes
    const stuckJobsThreshold = new Date(Date.now() - 30 * 60 * 1000); // 30 minutes ago
    
    const { data: stuckJobs, error: fetchError } = await supabase
      .from('analysis_queue')
      .select('*')
      .eq('status', 'processing')
      .lt('started_at', stuckJobsThreshold.toISOString());

    if (fetchError) {
      console.error('❌ Error fetching stuck jobs:', fetchError);
      throw fetchError;
    }

    console.log(`🔍 Found ${stuckJobs?.length || 0} stuck processing jobs`);

    // Reset stuck jobs to queued status
    if (stuckJobs && stuckJobs.length > 0) {
      const { error: resetError } = await supabase
        .from('analysis_queue')
        .update({
          status: 'queued',
          started_at: null,
          error_message: 'Reset from stuck processing state',
          updated_at: new Date().toISOString()
        })
        .in('id', stuckJobs.map(job => job.id));

      if (resetError) {
        console.error('❌ Error resetting stuck jobs:', resetError);
        throw resetError;
      }

      console.log(`✅ Reset ${stuckJobs.length} stuck jobs to queued status`);
    }

    // Clean up old completed/failed jobs older than 7 days
    const cleanupThreshold = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
    
    const { error: cleanupError } = await supabase
      .from('analysis_queue')
      .delete()
      .in('status', ['completed', 'failed'])
      .lt('completed_at', cleanupThreshold.toISOString());

    if (cleanupError) {
      console.error('❌ Error cleaning up old jobs:', cleanupError);
      // Don't throw here, as the main function (unsticking) succeeded
    } else {
      console.log('🗑️ Cleaned up old completed/failed jobs');
    }

    // Get current queue stats
    const { data: queueStats, error: statsError } = await supabase
      .from('analysis_queue')
      .select('status, priority')
      .order('created_at', { ascending: false })
      .limit(100);

    const stats = {
      total: queueStats?.length || 0,
      queued: queueStats?.filter(item => item.status === 'queued').length || 0,
      processing: queueStats?.filter(item => item.status === 'processing').length || 0,
      completed: queueStats?.filter(item => item.status === 'completed').length || 0,
      failed: queueStats?.filter(item => item.status === 'failed').length || 0,
      stuck_jobs_reset: stuckJobs?.length || 0
    };

    console.log('📊 Queue cleanup completed:', stats);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Queue cleanup completed successfully',
        stats,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        } 
      }
    );

  } catch (error) {
    console.error('❌ Queue cleanup failed:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        } 
      }
    );
  }
});