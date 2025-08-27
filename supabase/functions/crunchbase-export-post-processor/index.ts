import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PostProcessRequest {
  dealId?: string;
  crunchbaseExportId?: string;
  forceReprocess?: boolean;
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

    const { dealId, crunchbaseExportId, forceReprocess = false }: PostProcessRequest = await req.json();

    console.log(`🔄 [Crunchbase Post-Processor] Starting post-processing...`);
    console.log(`📊 [Crunchbase Post-Processor] Deal ID: ${dealId}, Export ID: ${crunchbaseExportId}, Force: ${forceReprocess}`);

    // Build query to find records to process
    let query = supabase
      .from('deal_enrichment_crunchbase_export')
      .select('*')
      .eq('processing_status', 'raw');

    if (dealId) {
      query = query.eq('deal_id', dealId);
    }
    if (crunchbaseExportId) {
      query = query.eq('id', crunchbaseExportId);
    }

    const { data: rawRecords, error: fetchError } = await query;

    if (fetchError) {
      console.error(`❌ [Crunchbase Post-Processor] Error fetching raw records:`, fetchError);
      return new Response(
        JSON.stringify({ success: false, error: fetchError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📊 [Crunchbase Post-Processor] Found ${rawRecords?.length || 0} raw records to process`);

    const results = [];

    for (const record of rawRecords || []) {
      try {
        console.log(`🔄 [Crunchbase Post-Processor] Processing record ${record.id} for ${record.name}`);

        // Update processing status
        await supabase
          .from('deal_enrichment_crunchbase_export')
          .update({ processing_status: 'processing' })
          .eq('id', record.id);

        // Extract data from raw_brightdata_response
        const rawData = record.raw_brightdata_response;
        if (!rawData || !Array.isArray(rawData) || rawData.length === 0) {
          console.log(`⚠️ [Crunchbase Post-Processor] No raw data found for record ${record.id}`);
          continue;
        }

        const firstRecord = rawData[0];

        // Helper functions for data processing
        const safeJsonField = (value: any): any => {
          if (value === null || value === undefined) return null;
          if (typeof value === 'object') return value;
          if (typeof value === 'string') {
            try {
              return JSON.parse(value);
            } catch {
              return value;
            }
          }
          return value;
        };

        const parseFoundedDate = (dateStr: string | null): string | null => {
          if (!dateStr) return null;
          try {
            // Handle various date formats from Crunchbase
            const date = new Date(dateStr);
            return date.toISOString().split('T')[0]; // Return YYYY-MM-DD format
          } catch {
            return dateStr; // Return as-is if parsing fails
          }
        };

        const parseEmployeeRange = (empData: any): string | null => {
          if (!empData) return null;
          if (typeof empData === 'string') return empData;
          if (typeof empData === 'object') {
            return empData.range || empData.size || empData.count || null;
          }
          return null;
        };

        // Extract and update structured data
        const updateData = {
          // Basic company info
          name: firstRecord?.name || record.name,
          legal_name: firstRecord?.legal_name || null,
          website: firstRecord?.website || firstRecord?.url || null,
          about: firstRecord?.about || firstRecord?.full_description || null,
          founded_date: parseFoundedDate(firstRecord?.founded_date),
          
          // Location data
          headquarters_regions: safeJsonField(firstRecord?.headquarters_regions),
          region: firstRecord?.region || null,
          location: firstRecord?.location || null,
          address: firstRecord?.address || null,
          country_code: firstRecord?.country_code || null,
          hq_continent: firstRecord?.hq_continent || null,
          
          // Industry and business info
          industries: firstRecord?.industries || null,
          company_type: firstRecord?.company_type || firstRecord?.type || null,
          operating_status: firstRecord?.operating_status || null,
          ipo_status: firstRecord?.ipo_status || null,
          stock_symbol: firstRecord?.stock_symbol || null,
          
          // Contact information
          contact_email: firstRecord?.contact_email || firstRecord?.email_address || null,
          contact_phone: firstRecord?.contact_phone || firstRecord?.phone_number || null,
          
          // Employee and team data
          current_employees: safeJsonField(firstRecord?.current_employees),
          current_advisors: safeJsonField(firstRecord?.current_advisors),
          founders: safeJsonField(firstRecord?.founders),
          leadership_hire: safeJsonField(firstRecord?.leadership_hire),
          
          // Investment and funding data
          funding_rounds_list: safeJsonField(firstRecord?.funding_rounds_list),
          funds_raised: safeJsonField(firstRecord?.funds_raised),
          funds_total: firstRecord?.funds_total ? parseFloat(firstRecord.funds_total) : null,
          investors: safeJsonField(firstRecord?.investors),
          investments: safeJsonField(firstRecord?.investments),
          
          // Business metrics and highlights
          overview_highlights: safeJsonField(firstRecord?.overview_highlights),
          people_highlights: safeJsonField(firstRecord?.people_highlights),
          technology_highlights: safeJsonField(firstRecord?.technology_highlights),
          financials_highlights: safeJsonField(firstRecord?.financials_highlights),
          
          // Technology and products
          built_with_tech: safeJsonField(firstRecord?.built_with_tech),
          built_with_num_technologies_used: firstRecord?.built_with_num_technologies_used || null,
          products_and_services: safeJsonField(firstRecord?.products_and_services),
          siftery_products: safeJsonField(firstRecord?.siftery_products),
          
          // Market and traffic data
          web_traffic_by_semrush: safeJsonField(firstRecord?.web_traffic_by_semrush),
          semrush_location_list: safeJsonField(firstRecord?.semrush_location_list),
          apptopia: safeJsonField(firstRecord?.apptopia),
          apptopia_total_downloads: firstRecord?.apptopia_total_downloads || null,
          apptopia_total_downloads_mom_pct: firstRecord?.apptopia_total_downloads_mom_pct || null,
          
          // Counts and metrics
          num_investors: firstRecord?.num_investors || firstRecord?.number_of_investors || null,
          num_acquisitions: firstRecord?.num_acquisitions || firstRecord?.number_of_acquisitions || null,
          num_investments: firstRecord?.num_investments || firstRecord?.number_of_investments || null,
          num_exits: firstRecord?.num_exits || firstRecord?.number_of_exits || null,
          num_alumni: firstRecord?.num_alumni || firstRecord?.number_of_alumni || null,
          num_funds: firstRecord?.num_funds || firstRecord?.number_of_funds || null,
          
          // Social and external data
          socila_media_urls: safeJsonField(firstRecord?.socila_media_urls),
          news: safeJsonField(firstRecord?.news),
          contacts: safeJsonField(firstRecord?.contacts),
          
          // Scoring and trends
          growth_score: firstRecord?.growth_score ? parseFloat(firstRecord.growth_score) : null,
          heat_score: firstRecord?.heat_score ? parseFloat(firstRecord.heat_score) : null,
          growth_trend: firstRecord?.growth_trend || null,
          heat_trend: firstRecord?.heat_trend || null,
          
          // Meta fields
          company_id: firstRecord?.company_id || null,
          cb_id: firstRecord?.cb_id || null,
          uuid: firstRecord?.uuid || null,
          
          // Processing status
          processing_status: 'processed',
          processed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        console.log(`📊 [Crunchbase Post-Processor] Updating record with structured data`);

        const { error: updateError } = await supabase
          .from('deal_enrichment_crunchbase_export')
          .update(updateData)
          .eq('id', record.id);

        if (updateError) {
          console.error(`❌ [Crunchbase Post-Processor] Error updating record ${record.id}:`, updateError);
          
          // Mark as failed
          await supabase
            .from('deal_enrichment_crunchbase_export')
            .update({ 
              processing_status: 'failed',
              error_details: updateError.message 
            })
            .eq('id', record.id);

          results.push({
            id: record.id,
            company_name: record.name,
            success: false,
            error: updateError.message
          });
        } else {
          console.log(`✅ [Crunchbase Post-Processor] Successfully processed ${record.name}`);
          results.push({
            id: record.id,
            company_name: record.name,
            success: true
          });
        }

      } catch (recordError) {
        console.error(`❌ [Crunchbase Post-Processor] Error processing record ${record.id}:`, recordError);
        
        // Mark as failed
        await supabase
          .from('deal_enrichment_crunchbase_export')
          .update({ 
            processing_status: 'failed',
            error_details: recordError.message 
          })
          .eq('id', record.id);

        results.push({
          id: record.id,
          company_name: record.name,
          success: false,
          error: recordError.message
        });
      }
    }

    console.log(`✅ [Crunchbase Post-Processor] Completed processing ${results.length} records`);

    return new Response(
      JSON.stringify({
        success: true,
        processed_count: results.length,
        results: results
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error(`❌ [Crunchbase Post-Processor] Fatal error:`, error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});