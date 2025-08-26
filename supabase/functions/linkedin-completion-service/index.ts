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

  // 🚫 HARD CODED KILL SWITCH - ENGINE PERMANENTLY DISABLED
  console.log('🚫 LinkedIn Completion Service: PERMANENTLY DISABLED');
  return new Response(JSON.stringify({ 
    success: false, 
    error: 'LinkedIn completion processing permanently disabled',
    message: 'This engine has been shut down permanently'
  }), {
    status: 503,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });

  try {
    console.log('🔧 LinkedIn Completion Service: Starting completion and vectorization...');

    let updatedExports = 0;
    let vectorizedExports = 0;
    let completedQueues = 0;

    // 1. Mark processed LinkedIn exports as completed if they have data
    const { data: processedExports, error: fetchError } = await supabase
      .from('deal_enrichment_linkedin_export')
      .select('id, deal_id, company_name, processing_status, created_at')
      .eq('processing_status', 'processed')
      .not('raw_brightdata_response', 'is', null)
      .lt('created_at', new Date(Date.now() - 15 * 60 * 1000).toISOString());

    if (fetchError) {
      console.error('❌ Error fetching processed exports:', fetchError);
    } else if (processedExports && processedExports.length > 0) {
      console.log(`📋 Found ${processedExports.length} LinkedIn exports to complete`);

      for (const exportRecord of processedExports) {
        // Update export status to completed
        const { error: updateError } = await supabase
          .from('deal_enrichment_linkedin_export')
          .update({
            processing_status: 'completed',
            processed_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', exportRecord.id);

        if (updateError) {
          console.error(`❌ Error updating export ${exportRecord.id}:`, updateError);
        } else {
          updatedExports++;
          console.log(`✅ Completed LinkedIn export for ${exportRecord.company_name}`);

          // Trigger vectorization for this export
          try {
            const { data: vectorResult, error: vectorError } = await supabase.functions.invoke(
              'linkedin-data-vectorizer',
              {
                body: {
                  dealId: exportRecord.deal_id,
                  linkedinExportId: exportRecord.id,
                  forceReprocess: false
                }
              }
            );

            if (vectorError) {
              console.error(`❌ Vectorization failed for ${exportRecord.company_name}:`, vectorError);
            } else {
              vectorizedExports++;
              console.log(`🔗 Triggered vectorization for ${exportRecord.company_name}`);
            }
          } catch (vectorizationError) {
            console.error(`💥 Vectorization exception for ${exportRecord.company_name}:`, vectorizationError);
          }
        }
      }
    }

    // 2. Complete stuck analysis queue items for completed LinkedIn exports
    const { data: completedExportDeals } = await supabase
      .from('deal_enrichment_linkedin_export')
      .select('deal_id')
      .eq('processing_status', 'completed')
      .gte('processed_at', new Date(Date.now() - 5 * 60 * 1000).toISOString());

    if (completedExportDeals && completedExportDeals.length > 0) {
      const dealIds = completedExportDeals.map(d => d.deal_id);
      
      const { error: queueUpdateError } = await supabase
        .from('analysis_queue')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .in('deal_id', dealIds)
        .in('status', ['queued', 'processing']);

      if (!queueUpdateError) {
        completedQueues = dealIds.length;
        console.log(`✅ Completed ${completedQueues} analysis queue items`);
      }
    }

    const result = {
      success: true,
      message: 'LinkedIn completion service executed successfully',
      statistics: {
        updatedExports,
        vectorizedExports,
        completedQueues
      },
      timestamp: new Date().toISOString()
    };

    console.log('🏁 LinkedIn Completion Service Summary:', result);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ LinkedIn completion service error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Unknown error occurred'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});