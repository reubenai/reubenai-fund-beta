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
    const { dealId, fundId, triggerReason = 'priority_bypass' }: {
      dealId: string;
      fundId: string;
      triggerReason?: string;
    } = await req.json();

    console.log('🚀 Priority Analysis Bypass: Processing deal:', dealId);

    // Get fund-specific slot allocation (future enhancement)
    const fundSlots = 2; // Reserve 2 slots per fund to prevent blocking

    // Check current fund-specific processing count
    const { data: fundProcessing, error: processingError } = await supabase
      .from('analysis_queue')
      .select('deal_id')
      .eq('status', 'processing')
      .in('deal_id', 
        supabase
          .from('deals')
          .select('id')
          .eq('fund_id', fundId)
      );

    if (processingError) throw processingError;

    const currentFundProcessing = fundProcessing?.length || 0;

    if (currentFundProcessing >= fundSlots) {
      // Queue with high priority instead of immediate processing
      const { data: queueResult, error: queueError } = await supabase
        .rpc('queue_deal_analysis', {
          deal_id_param: dealId,
          trigger_reason_param: triggerReason,
          priority_param: 'high',
          delay_minutes: 0
        });

      if (queueError) throw queueError;

      return new Response(JSON.stringify({
        success: true,
        action: 'queued_high_priority',
        message: `Fund has ${currentFundProcessing}/${fundSlots} slots in use. Queued with high priority.`,
        queueId: queueResult
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Direct processing bypass - immediately trigger analysis
    console.log('🚀 Direct processing bypass for deal:', dealId);
    
    const { data: analysisResult, error: analysisError } = await supabase.functions.invoke(
      'enhanced-deal-analysis',
      {
        body: {
          dealId,
          analysisType: 'comprehensive',
          triggerReason,
          priority: 'immediate'
        }
      }
    );

    if (analysisError) {
      console.error('❌ Direct analysis failed:', analysisError);
      throw analysisError;
    }

    console.log('✅ Priority bypass analysis completed for deal:', dealId);

    return new Response(JSON.stringify({
      success: true,
      action: 'immediate_processing',
      message: 'Analysis completed immediately via priority bypass',
      result: analysisResult
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Priority Analysis Bypass error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Unknown error occurred'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});