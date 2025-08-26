import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // 🚫 HARD CODED KILL SWITCH - ENGINE PERMANENTLY DISABLED
  console.log('🚫 Force Analysis Refresh: PERMANENTLY DISABLED');
  return new Response(JSON.stringify({ 
    success: false, 
    error: 'Analysis refresh permanently disabled',
    message: 'This engine has been shut down permanently'
  }), {
    status: 503,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { dealId, skipGoogleSearch = true, forceRefresh = true } = await req.json();

    if (!dealId) {
      throw new Error('Deal ID is required');
    }

    console.log(`🔄 Force refreshing analysis for deal: ${dealId}`);

    // First, clear any stuck queue items
    const { error: clearError } = await supabaseClient
      .from('analysis_queue')
      .delete()
      .eq('deal_id', dealId)
      .in('status', ['queued', 'processing']);

    if (clearError) {
      console.warn('Failed to clear queue:', clearError);
    }

    // Get deal details
    const { data: deal, error: dealError } = await supabaseClient
      .from('deals')
      .select('*')
      .eq('id', dealId)
      .single();

    if (dealError || !deal) {
      throw new Error(`Deal not found: ${dealError?.message}`);
    }

    console.log(`📊 Analyzing ${deal.company_name} in ${deal.industry} industry`);

    // Trigger analysis engines in parallel (skip Google Search to avoid quota)
    const engines = [
      'market-intelligence-engine',
      'financial-engine', 
      'team-research-engine',
      'product-ip-engine'
    ];

    if (!skipGoogleSearch) {
      engines.push('thesis-alignment-engine');
    }

    const engineResults = [];

    for (const engine of engines) {
      try {
        console.log(`🚀 Triggering ${engine}...`);
        
        const engineResponse = await supabaseClient.functions.invoke(engine, {
          body: { 
            dealId: dealId,
            forceRefresh: true,
            skipExternalAPIs: skipGoogleSearch // Skip external APIs if quota issues
          }
        });

        if (engineResponse.error) {
          console.error(`❌ ${engine} failed:`, engineResponse.error);
          engineResults.push({
            engine,
            success: false,
            error: engineResponse.error.message
          });
        } else {
          console.log(`✅ ${engine} completed successfully`);
          engineResults.push({
            engine,
            success: true,
            data: engineResponse.data
          });
        }
      } catch (engineError) {
        console.error(`❌ ${engine} exception:`, engineError);
        engineResults.push({
          engine,
          success: false,
          error: engineError.message
        });
      }
    }

    // Update deal with enhanced analysis flag
    await supabaseClient
      .from('deals')
      .update({
        last_analysis_trigger: new Date().toISOString(),
        last_analysis_trigger_reason: 'force_refresh',
        analysis_queue_status: 'completed'
      })
      .eq('id', dealId);

    // Log the refresh activity
    await supabaseClient.from('activity_events').insert({
      fund_id: deal.fund_id,
      deal_id: dealId,
      activity_type: 'analysis_refreshed',
      title: `Analysis refreshed for ${deal.company_name}`,
      description: `Force refreshed analysis engines to fix market opportunity assessment`,
      context_data: {
        company_name: deal.company_name,
        industry: deal.industry,
        engines_triggered: engines,
        skip_google_search: skipGoogleSearch
      },
      priority: 'high',
      tags: ['analysis', 'refresh', 'market_opportunity'],
      is_system_event: true
    });

    console.log(`🎯 Analysis refresh completed for ${deal.company_name}`);

    return new Response(
      JSON.stringify({
        success: true,
        dealId,
        companyName: deal.company_name,
        industry: deal.industry,
        enginesTriggered: engines,
        results: engineResults,
        skippedGoogleSearch: skipGoogleSearch,
        message: `Analysis refreshed for ${deal.company_name}. Market opportunity analysis should now reflect the correct industry data.`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('❌ Force analysis refresh failed:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        details: 'Failed to refresh deal analysis'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});