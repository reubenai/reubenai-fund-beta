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
    console.log('🔄 Perplexity Market Batch Processor Starting...');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { batchSize = 10, dryRun = true } = await req.json();

    console.log(`📊 Processing batch of ${batchSize} deals (dry run: ${dryRun})`);

    // Find VC deals without market enrichment data
    const { data: dealsWithoutEnrichment, error: dealsError } = await supabase
      .from('deals')
      .select(`
        id,
        company_name,
        industry,
        location,
        created_at,
        funds!deals_fund_id_fkey(fund_type)
      `)
      .eq('funds.fund_type', 'venture_capital')
      .not('industry', 'is', null)
      .not('location', 'is', null)
      .limit(100); // Get more than needed to filter out enriched ones

    if (dealsError) {
      throw new Error(`Failed to fetch deals: ${dealsError.message}`);
    }

    console.log(`🔍 Found ${dealsWithoutEnrichment?.length || 0} potential VC deals`);

    // Check which deals already have market enrichment
    const dealIds = dealsWithoutEnrichment?.map(d => d.id) || [];
    const { data: enrichedDeals, error: enrichedError } = await supabase
      .from('deal_enrichment_perplexity_market_export_vc')
      .select('deal_id')
      .in('deal_id', dealIds);

    if (enrichedError) {
      console.error('⚠️ Error checking enriched deals:', enrichedError);
    }

    const enrichedDealIds = new Set(enrichedDeals?.map(e => e.deal_id) || []);
    const dealsNeedingEnrichment = dealsWithoutEnrichment?.filter(
      deal => !enrichedDealIds.has(deal.id)
    ).slice(0, batchSize) || [];

    console.log(`📋 Found ${dealsNeedingEnrichment.length} deals needing market enrichment`);

    if (dryRun) {
      return new Response(JSON.stringify({
        success: true,
        dry_run: true,
        deals_found: dealsNeedingEnrichment.length,
        deals_preview: dealsNeedingEnrichment.map(d => ({
          id: d.id,
          company_name: d.company_name,
          industry: d.industry?.[0] || 'N/A',
          location: d.location?.[0] || 'N/A',
          created_at: d.created_at
        }))
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Process deals in actual run
    const results = [];
    let processed = 0;
    let successful = 0;
    let failed = 0;

    for (const deal of dealsNeedingEnrichment) {
      try {
        console.log(`🚀 Processing ${deal.company_name} (${processed + 1}/${dealsNeedingEnrichment.length})`);
        
        const { data: enrichmentData, error: enrichmentError } = await supabase.functions.invoke(
          'perplexity-market-enrichment',
          {
            body: {
              dealId: deal.id,
              primaryIndustry: deal.industry[0],
              location: deal.location[0]
            }
          }
        );

        processed++;

        if (enrichmentError || !enrichmentData?.success) {
          failed++;
          results.push({
            deal_id: deal.id,
            company_name: deal.company_name,
            success: false,
            error: enrichmentError?.message || enrichmentData?.error || 'Unknown error'
          });
        } else {
          successful++;
          results.push({
            deal_id: deal.id,
            company_name: deal.company_name,
            success: true,
            snapshot_id: enrichmentData.snapshot_id
          });
        }

        // Small delay to avoid overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        processed++;
        failed++;
        console.error(`❌ Error processing ${deal.company_name}:`, error);
        results.push({
          deal_id: deal.id,
          company_name: deal.company_name,
          success: false,
          error: error.message
        });
      }
    }

    console.log(`✅ Batch processing complete: ${successful} successful, ${failed} failed`);

    return new Response(JSON.stringify({
      success: true,
      dry_run: false,
      batch_results: {
        total_processed: processed,
        successful: successful,
        failed: failed,
        details: results
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Batch processor error:', error);
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