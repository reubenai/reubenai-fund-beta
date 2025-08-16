import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🧹 Starting queue cleanup service...');

    // 1. Clean up very old failed items (older than 24 hours)
    const { data: deletedFailed, error: deleteError } = await supabase
      .from('analysis_queue')
      .delete()
      .eq('status', 'failed')
      .lt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    if (deleteError) {
      console.error('❌ Error deleting old failed items:', deleteError);
    } else {
      console.log(`✅ Deleted ${deletedFailed?.length || 0} old failed items`);
    }

    // 2. Reset items that have been stuck in "processing" for over 2 hours
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    const { data: stuckProcessing, error: stuckError } = await supabase
      .from('analysis_queue')
      .select('id, deal_id, attempts')
      .eq('status', 'processing')
      .lt('created_at', twoHoursAgo);

    if (stuckError) {
      console.error('❌ Error finding stuck processing items:', stuckError);
    } else if (stuckProcessing && stuckProcessing.length > 0) {
      console.log(`🔄 Found ${stuckProcessing.length} stuck processing items`);
      
      // Reset them back to queued with incremented attempts
      const resetPromises = stuckProcessing.map(async (item) => {
        const newAttempts = (item.attempts || 0) + 1;
        
        // If too many attempts, mark as failed
        if (newAttempts > 3) {
          return supabase
            .from('analysis_queue')
            .update({
              status: 'failed',
              error_message: 'Max attempts exceeded - stuck in processing',
              updated_at: new Date().toISOString()
            })
            .eq('id', item.id);
        } else {
          // Reset to queued with incremented attempts
          return supabase
            .from('analysis_queue')
            .update({
              status: 'queued',
              attempts: newAttempts,
              started_at: null,
              updated_at: new Date().toISOString(),
              scheduled_for: new Date(Date.now() + 5 * 60 * 1000).toISOString() // Retry in 5 minutes
            })
            .eq('id', item.id);
        }
      });

      const resetResults = await Promise.allSettled(resetPromises);
      const successfulResets = resetResults.filter(r => r.status === 'fulfilled').length;
      console.log(`✅ Reset ${successfulResets} stuck processing items`);
    }

    // 3. Clean up very old queued items (older than 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: deletedOld, error: oldError } = await supabase
      .from('analysis_queue')
      .delete()
      .eq('status', 'queued')
      .lt('created_at', sevenDaysAgo);

    if (oldError) {
      console.error('❌ Error deleting very old queued items:', oldError);
    } else {
      console.log(`✅ Deleted ${deletedOld?.length || 0} very old queued items`);
    }

    // 4. Get current queue statistics
    const { data: queueStats, error: statsError } = await supabase
      .from('analysis_queue')
      .select('status')
      .limit(1000);

    let stats = { queued: 0, processing: 0, failed: 0, completed: 0 };
    if (!statsError && queueStats) {
      stats = queueStats.reduce((acc, item) => {
        acc[item.status as keyof typeof acc] = (acc[item.status as keyof typeof acc] || 0) + 1;
        return acc;
      }, stats);
    }

    const result = {
      success: true,
      cleanup_summary: {
        deleted_failed_items: deletedFailed?.length || 0,
        reset_stuck_items: stuckProcessing?.length || 0,
        deleted_old_items: deletedOld?.length || 0,
        current_queue_stats: stats
      },
      message: 'Queue cleanup completed successfully'
    };

    console.log('✅ Queue cleanup completed:', result);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('💥 Queue cleanup service error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Queue cleanup failed'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});