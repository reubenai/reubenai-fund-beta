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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { dealId } = await req.json();

    console.log(`🧹 [Queue Cleaner] Clearing stale analysis queue entries...`);

    // Clear stale queue entries for deals with auto_analysis_enabled = false
    const { data: clearedEntries, error: clearError } = await supabase
      .from('analysis_queue')
      .delete()
      .in('deal_id', 
        supabase
          .from('deals')
          .select('id')
          .eq('auto_analysis_enabled', false)
      )
      .select();

    if (clearError) {
      console.error(`❌ [Queue Cleaner] Error clearing queue:`, clearError);
      throw clearError;
    }

    console.log(`✅ [Queue Cleaner] Cleared ${clearedEntries?.length || 0} stale queue entries`);

    // Reset analysis_queue_status for deals with auto_analysis disabled
    const { data: updatedDeals, error: updateError } = await supabase
      .from('deals')
      .update({ analysis_queue_status: null })
      .eq('auto_analysis_enabled', false)
      .neq('analysis_queue_status', null)
      .select('id, company_name');

    if (updateError) {
      console.error(`❌ [Queue Cleaner] Error updating deal status:`, updateError);
      throw updateError;
    }

    console.log(`✅ [Queue Cleaner] Reset queue status for ${updatedDeals?.length || 0} deals`);

    // If specific dealId provided, also fix LinkedIn URL
    if (dealId) {
      console.log(`🔧 [Queue Cleaner] Fixing LinkedIn URL for deal: ${dealId}`);
      
      const { data: deal, error: fetchError } = await supabase
        .from('deals')
        .select('linkedin_url, company_name')
        .eq('id', dealId)
        .single();

      if (fetchError) {
        console.error(`❌ [Queue Cleaner] Error fetching deal:`, fetchError);
      } else if (deal?.linkedin_url?.includes('/about/')) {
        const cleanUrl = deal.linkedin_url.replace(/\/about\/.*$/, '');
        
        const { error: urlUpdateError } = await supabase
          .from('deals')
          .update({ linkedin_url: cleanUrl })
          .eq('id', dealId);

        if (urlUpdateError) {
          console.error(`❌ [Queue Cleaner] Error updating LinkedIn URL:`, urlUpdateError);
        } else {
          console.log(`✅ [Queue Cleaner] Fixed LinkedIn URL for ${deal.company_name}: ${cleanUrl}`);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        clearedQueueEntries: clearedEntries?.length || 0,
        updatedDeals: updatedDeals?.length || 0,
        message: 'Stale analysis queue entries cleared successfully'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error(`❌ [Queue Cleaner] Fatal error:`, error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});