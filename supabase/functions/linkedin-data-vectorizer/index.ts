import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface VectorizationRequest {
  dealId?: string;
  linkedinExportId?: string;
  forceReprocess?: boolean;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { dealId, linkedinExportId, forceReprocess = false }: VectorizationRequest = await req.json();
    
    if (!dealId && !linkedinExportId) {
      throw new Error('Either dealId or linkedinExportId is required');
    }

    console.log('🔮 [LinkedIn Vectorizer] Processing vectorization request');

    // Query for LinkedIn exports to process
    let query = supabase.from('deal_enrichment_linkedin_export').select('*');
    
    if (linkedinExportId) {
      query = query.eq('id', linkedinExportId);
    } else if (dealId) {
      query = query.eq('deal_id', dealId);
      if (!forceReprocess) {
        query = query.in('processing_status', ['raw', 'failed']);
      }
    }

    const { data: linkedinExports, error: exportError } = await query.order('created_at', { ascending: false });

    if (exportError) {
      throw new Error(`Failed to fetch LinkedIn exports: ${exportError.message}`);
    }

    if (!linkedinExports || linkedinExports.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        message: 'No LinkedIn exports found for vectorization'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const results = [];

    for (const linkedinData of linkedinExports) {
      try {
        console.log(`🔮 [LinkedIn Vectorizer] Processing export for deal: ${linkedinData.deal_id}`);

        // Update status to processing
        await supabase
          .from('deal_enrichment_linkedin_export')
          .update({ processing_status: 'vectorizing' })
          .eq('id', linkedinData.id);

        const embeddingTexts = [];

        // Company description embedding
        if (linkedinData.about || linkedinData.description) {
          const description = linkedinData.about || linkedinData.description;
          embeddingTexts.push({
            text: description,
            contentType: 'company_description',
            metadata: {
              source: 'linkedin_export',
              industry: linkedinData.industries,
              founded: linkedinData.founded,
              employee_count: linkedinData.employees?.length || linkedinData.employees_in_linkedin,
              followers: linkedinData.followers
            }
          });
        }

        // Team and personnel embedding
        if (linkedinData.employees && Array.isArray(linkedinData.employees) && linkedinData.employees.length > 0) {
          const teamText = linkedinData.employees
            .slice(0, 10) // First 10 employees
            .map(emp => `${emp.title || ''} ${emp.subtitle || ''}`)
            .filter(text => text.trim())
            .join('. ');

          if (teamText.trim()) {
            embeddingTexts.push({
              text: teamText,
              contentType: 'team_personnel',
              metadata: {
                source: 'linkedin_export',
                team_size: linkedinData.employees.length,
                key_roles: linkedinData.employees.map(emp => emp.subtitle).filter(Boolean).slice(0, 5)
              }
            });
          }
        }

        // Company updates embedding
        if (linkedinData.updates && Array.isArray(linkedinData.updates) && linkedinData.updates.length > 0) {
          const updatesText = linkedinData.updates
            .slice(0, 5) // Latest 5 updates
            .map(update => update.text || update.title || '')
            .filter(Boolean)
            .join('. ');

          if (updatesText.trim()) {
            embeddingTexts.push({
              text: updatesText,
              contentType: 'company_updates',
              metadata: {
                source: 'linkedin_export',
                updates_count: linkedinData.updates.length,
                latest_update: linkedinData.updates[0]?.time || linkedinData.updates[0]?.date
              }
            });
          }
        }

        // Generate embeddings for each text
        let successCount = 0;
        for (const embeddingData of embeddingTexts) {
          try {
            const { data, error } = await supabase.functions.invoke('vector-embedding-generator', {
              body: {
                text: embeddingData.text,
                contentType: embeddingData.contentType,
                contentId: linkedinData.deal_id,
                fundId: linkedinData.deal_id, // We'll need to get the actual fund_id later
                metadata: {
                  ...embeddingData.metadata,
                  linkedin_export_id: linkedinData.id,
                  snapshot_id: linkedinData.snapshot_id,
                  generated_at: new Date().toISOString()
                }
              }
            });

            if (error) {
              console.error(`❌ [LinkedIn Vectorizer] Failed to generate ${embeddingData.contentType} embedding:`, error);
            } else {
              console.log(`✅ [LinkedIn Vectorizer] Generated ${embeddingData.contentType} embedding`);
              successCount++;
            }
          } catch (error) {
            console.error(`❌ [LinkedIn Vectorizer] Error generating ${embeddingData.contentType} embedding:`, error.message);
          }
        }

        // Update processing status
        const finalStatus = successCount > 0 ? 'vectorized' : 'failed';
        await supabase
          .from('deal_enrichment_linkedin_export')
          .update({ 
            processing_status: finalStatus,
            processed_at: new Date().toISOString()
          })
          .eq('id', linkedinData.id);

        results.push({
          linkedinExportId: linkedinData.id,
          dealId: linkedinData.deal_id,
          success: successCount > 0,
          embeddingsGenerated: successCount,
          totalTexts: embeddingTexts.length
        });

      } catch (error) {
        console.error(`❌ [LinkedIn Vectorizer] Error processing export ${linkedinData.id}:`, error.message);
        
        // Mark as failed
        await supabase
          .from('deal_enrichment_linkedin_export')
          .update({ 
            processing_status: 'failed',
            error_details: error.message,
            processed_at: new Date().toISOString()
          })
          .eq('id', linkedinData.id);

        results.push({
          linkedinExportId: linkedinData.id,
          dealId: linkedinData.deal_id,
          success: false,
          error: error.message
        });
      }
    }

    return new Response(JSON.stringify({
      success: true,
      message: `Processed ${results.length} LinkedIn exports`,
      results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ [LinkedIn Vectorizer] Error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});