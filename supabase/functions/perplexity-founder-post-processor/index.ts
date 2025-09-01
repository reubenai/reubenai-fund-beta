import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PostProcessRequest {
  dealId?: string;
  founderEnrichmentId?: string;
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

    const { dealId, founderEnrichmentId, forceReprocess = false }: PostProcessRequest = await req.json();

    console.log(`🔄 [Founder Post-Processor] Starting post-processing...`);
    console.log(`📊 [Founder Post-Processor] Deal ID: ${dealId}, Enrichment ID: ${founderEnrichmentId}, Force: ${forceReprocess}`);

    // Build query to find records to process
    let query = supabase
      .from('deal_enrichment_perplexity_founder_export_vc')
      .select('*')
      .in('processing_status', ['raw', 'pending']);

    if (dealId) {
      query = query.eq('deal_id', dealId);
    }
    if (founderEnrichmentId) {
      query = query.eq('id', founderEnrichmentId);
    }

    const { data: rawRecords, error: fetchError } = await query;

    if (fetchError) {
      console.error(`❌ [Founder Post-Processor] Error fetching raw records:`, fetchError);
      return new Response(
        JSON.stringify({ success: false, error: fetchError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📊 [Founder Post-Processor] Found ${rawRecords?.length || 0} raw records to process`);

    const results = [];

    for (const record of rawRecords || []) {
      try {
        console.log(`🔄 [Founder Post-Processor] Processing record ${record.id} for ${record.founder_name} at ${record.company_name}`);

        // Update processing status
        await supabase
          .from('deal_enrichment_perplexity_founder_export_vc')
          .update({ processing_status: 'processing' })
          .eq('id', record.id);

        // Extract data from raw_perplexity_response
        const rawData = record.raw_perplexity_response;
        if (!rawData) {
          console.log(`⚠️ [Founder Post-Processor] No raw data found for record ${record.id}`);
          continue;
        }

        // Helper function to ensure array format
        const ensureArray = (value: any): string[] => {
          if (!value) return [];
          if (Array.isArray(value)) return value;
          if (typeof value === 'string') {
            // Try to parse as JSON array first
            try {
              const parsed = JSON.parse(value);
              return Array.isArray(parsed) ? parsed : [value];
            } catch {
              return [value];
            }
          }
          return [String(value)];
        };

        // Helper function to ensure JSONB format
        const ensureJSONB = (value: any): object => {
          if (!value) return {};
          if (typeof value === 'object' && !Array.isArray(value)) return value;
          if (typeof value === 'string') {
            try {
              return JSON.parse(value);
            } catch {
              return { value };
            }
          }
          return { value };
        };

        // Get existing datapoints record or create new one
        const { data: existingDatapoints, error: datapointsError } = await supabase
          .from('deal_analysis_datapoints_vc')
          .select('*')
          .eq('deal_id', record.deal_id)
          .single();

        if (datapointsError && datapointsError.code !== 'PGRST116') {
          console.error(`❌ [Founder Post-Processor] Error fetching datapoints:`, datapointsError);
          continue;
        }

        // Extract and map founder data with proper type conversions
        const founderUpdateData = {
          // JSONB fields
          previous_roles: ensureJSONB(rawData.previous_roles),
          exit_history: ensureJSONB(rawData.exit_history),
          
          // ARRAY fields
          leadership_experience: ensureArray(rawData.leadership_experience),
          technical_skills: ensureArray(rawData.technical_skills),
          market_knowledge: ensureArray(rawData.market_knowledge),
          innovation_record: ensureArray(rawData.innovation_record),
          academic_background: ensureArray(rawData.academic_background),
          certifications: ensureArray(rawData.certifications),
          thought_leadership: ensureArray(rawData.thought_leadership),
          value_creation: ensureArray(rawData.value_creation),
          team_building: ensureArray(rawData.team_building),
          
          // Update source engines and completeness
          source_engines: existingDatapoints?.source_engines ? 
            [...new Set([...existingDatapoints.source_engines, 'perplexity_founder'])] : 
            ['perplexity_founder'],
          updated_at: new Date().toISOString()
        };

        // Calculate data completeness score for founder fields
        const founderFields = [
          'previous_roles', 'leadership_experience', 'technical_skills', 'market_knowledge',
          'innovation_record', 'academic_background', 'certifications', 'thought_leadership',
          'exit_history', 'value_creation', 'team_building'
        ];

        let founderCompleteness = 0;
        founderFields.forEach(field => {
          const value = founderUpdateData[field];
          if (field === 'previous_roles' || field === 'exit_history') {
            // JSONB fields
            if (value && typeof value === 'object' && Object.keys(value).length > 0) {
              founderCompleteness += Math.floor(100 / founderFields.length);
            }
          } else {
            // ARRAY fields
            if (Array.isArray(value) && value.length > 0) {
              founderCompleteness += Math.floor(100 / founderFields.length);
            }
          }
        });

        // Update existing completeness score
        if (existingDatapoints) {
          founderUpdateData.data_completeness_score = Math.min(100, 
            (existingDatapoints.data_completeness_score || 0) + founderCompleteness
          );
        } else {
          founderUpdateData.data_completeness_score = founderCompleteness;
        }

        console.log(`📊 [Founder Post-Processor] Updating datapoints with founder data:`, founderUpdateData);

        // Upsert the datapoints record
        const { error: upsertError } = await supabase
          .from('deal_analysis_datapoints_vc')
          .upsert({
            deal_id: record.deal_id,
            ...founderUpdateData
          }, {
            onConflict: 'deal_id'
          });

        if (upsertError) {
          console.error(`❌ [Founder Post-Processor] Error upserting datapoints for ${record.id}:`, upsertError);
          
          // Mark as failed
          await supabase
            .from('deal_enrichment_perplexity_founder_export_vc')
            .update({ processing_status: 'failed' })
            .eq('id', record.id);

          results.push({
            id: record.id,
            founder_name: record.founder_name,
            company_name: record.company_name,
            success: false,
            error: upsertError.message
          });
        } else {
          // Mark as processed
          await supabase
            .from('deal_enrichment_perplexity_founder_export_vc')
            .update({ 
              processing_status: 'processed',
              processed_at: new Date().toISOString()
            })
            .eq('id', record.id);

          console.log(`✅ [Founder Post-Processor] Successfully processed ${record.founder_name} at ${record.company_name}`);
          results.push({
            id: record.id,
            founder_name: record.founder_name,
            company_name: record.company_name,
            success: true
          });
        }

      } catch (recordError) {
        console.error(`❌ [Founder Post-Processor] Error processing record ${record.id}:`, recordError);
        
        // Mark as failed
        await supabase
          .from('deal_enrichment_perplexity_founder_export_vc')
          .update({ processing_status: 'failed' })
          .eq('id', record.id);

        results.push({
          id: record.id,
          founder_name: record.founder_name,
          company_name: record.company_name,
          success: false,
          error: recordError.message
        });
      }
    }

    console.log(`✅ [Founder Post-Processor] Completed processing ${results.length} records`);

    return new Response(
      JSON.stringify({
        success: true,
        processed_count: results.length,
        results: results
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error(`❌ [Founder Post-Processor] Fatal error:`, error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});