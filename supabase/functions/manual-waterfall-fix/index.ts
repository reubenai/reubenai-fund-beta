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
    const { dealId } = await req.json();
    console.log(`🔧 Manually fixing waterfall processing for deal ${dealId}`);
    
    // Get deal information
    const { data: deal, error: dealError } = await supabase
      .from('deals')
      .select('fund_id, organization_id')
      .eq('id', dealId)
      .single();
    
    if (dealError || !deal) {
      throw new Error(`Deal not found: ${dealError?.message}`);
    }
    
    // Get fund type
    const { data: fund } = await supabase
      .from('funds')
      .select('fund_type')
      .eq('id', deal.fund_id)
      .single();
    
    const fundType = fund?.fund_type === 'private_equity' ? 'pe' : 'vc';
    
    // Call the data integration service directly
    const { data: integrationResult, error: integrationError } = await supabase.functions.invoke('deal-data-integration', {
      body: {
        dealId,
        fundId: deal.fund_id,
        organizationId: deal.organization_id,
        fundType,
        triggerReason: 'manual_refresh'
      }
    });
    
    if (integrationError) {
      console.error('❌ Integration failed:', integrationError);
      throw integrationError;
    }
    
    console.log('✅ Manual integration completed:', integrationResult);
    
    // Check if data was created
    const tableName = fundType === 'vc' ? 'deal_analysis_datapoints_vc' : 'deal_analysis_datapoints_pe';
    const { data: dataPoints } = await supabase
      .from(tableName)
      .select('id')
      .eq('deal_id', dealId);
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Manual waterfall fix completed',
      dealId,
      fundType,
      integrationResult,
      dataPointsCreated: dataPoints?.length || 0
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('💥 Manual waterfall fix failed:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Manual waterfall fix failed'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});