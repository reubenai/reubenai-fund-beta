import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🧪 Manual Perplexity Market Enrichment Test Starting...');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { dealId, testMode = true } = await req.json();
    
    // Get a test deal or use provided dealId
    let targetDealId = dealId;
    let testDeal = null;

    if (!targetDealId || testMode) {
      console.log('🔍 Finding a suitable VC deal for testing...');
      
      const { data: testDeals, error: testError } = await supabase
        .from('deals')
        .select(`
          id, 
          company_name, 
          industry, 
          location,
          funds!deals_fund_id_fkey(fund_type)
        `)
        .eq('funds.fund_type', 'venture_capital')
        .not('industry', 'is', null)
        .not('location', 'is', null)
        .limit(5);

      if (testError || !testDeals || testDeals.length === 0) {
        throw new Error(`No suitable VC deals found for testing: ${testError?.message}`);
      }

      testDeal = testDeals[0];
      targetDealId = testDeal.id;
      
      console.log(`🎯 Using test deal: ${testDeal.company_name} (${testDeal.industry[0]} in ${testDeal.location[0]})`);
    }

    // Call the perplexity-market-enrichment function
    console.log('📡 Calling perplexity-market-enrichment function...');
    
    const { data: enrichmentData, error: enrichmentError } = await supabase.functions.invoke(
      'perplexity-market-enrichment', 
      {
        body: {
          dealId: targetDealId,
          primaryIndustry: testDeal ? testDeal.industry[0] : 'technology',
          location: testDeal ? testDeal.location[0] : 'United States'
        }
      }
    );

    if (enrichmentError) {
      console.error('❌ Enrichment function error:', enrichmentError);
      throw enrichmentError;
    }

    console.log('📊 Enrichment function response:', enrichmentData);

    // Check if data was saved to database
    console.log('🔍 Checking database for saved enrichment data...');
    
    const { data: savedData, error: queryError } = await supabase
      .from('deal_enrichment_perplexity_market_export_vc')
      .select('*')
      .eq('deal_id', targetDealId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (queryError) {
      console.error('❌ Database query error:', queryError);
    }

    console.log('💾 Saved data in database:', savedData?.length ? 'Found' : 'Not found');

    return new Response(JSON.stringify({
      success: true,
      test_results: {
        deal_id: targetDealId,
        deal_info: testDeal,
        enrichment_response: enrichmentData,
        database_saved: !!savedData?.length,
        saved_record: savedData?.[0] ? {
          snapshot_id: savedData[0].snapshot_id,
          processing_status: savedData[0].processing_status,
          data_quality_score: savedData[0].data_quality_score,
          confidence_level: savedData[0].confidence_level,
          created_at: savedData[0].created_at
        } : null
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Test function error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      stack: error.stack
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});