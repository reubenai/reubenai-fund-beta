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
    const { llamaParseId, documentId } = await req.json();
    
    console.log(`🔍 Checking LlamaParse status for job: ${llamaParseId}, document: ${documentId}`);

    const llamaParseApiKey = Deno.env.get('LLAMAPARSE_API_KEY');
    
    if (!llamaParseApiKey) {
      throw new Error('LlamaParse API key not configured');
    }

    // Check LlamaParse job status
    const statusResponse = await fetch(`https://api.cloud.llamaindex.ai/api/v1/parsing/job/${llamaParseId}`, {
      headers: {
        'Authorization': `Bearer ${llamaParseApiKey}`,
        'accept': 'application/json',
      },
    });

    if (!statusResponse.ok) {
      throw new Error(`Failed to check LlamaParse status: ${statusResponse.statusText}`);
    }

    const statusResult = await statusResponse.json();
    console.log(`📊 LlamaParse job status: ${statusResult.status}`);

    // Get our document record
    let document = null;
    if (documentId) {
      const { data: docData, error: docError } = await supabase
        .from('deal_documents')
        .select('*')
        .eq('id', documentId)
        .single();

      if (!docError && docData) {
        document = docData;
      }
    }

    const result = {
      success: true,
      llamaParseId,
      documentId,
      llamaParse: {
        status: statusResult.status,
        job_id: statusResult.id,
        created_at: statusResult.created_at,
        updated_at: statusResult.updated_at
      },
      document: document ? {
        parsing_status: document.parsing_status,
        document_analysis_status: document.document_analysis_status,
        metadata: document.metadata
      } : null,
      status_mismatch: document && statusResult.status === 'SUCCESS' && document.parsing_status === 'processing',
      recommended_action: null
    };

    // If there's a status mismatch, provide recommendations
    if (result.status_mismatch) {
      result.recommended_action = 'llamaparse_successful_but_document_stuck';
      
      // Optionally auto-fix the mismatch
      if (document) {
        console.log('🔧 Auto-fixing status mismatch...');
        
        try {
          // Get the parsed results if available
          let extractedText = null;
          if (statusResult.status === 'SUCCESS') {
            const resultResponse = await fetch(`https://api.cloud.llamaindex.ai/api/v1/parsing/job/${llamaParseId}/result/markdown`, {
              headers: {
                'Authorization': `Bearer ${llamaParseApiKey}`,
                'accept': 'application/json',
              },
            });

            if (resultResponse.ok) {
              extractedText = await resultResponse.text();
              console.log('✅ Retrieved LlamaParse results');
            }
          }

          // Update document with corrected status and extracted text
          const updateData = {
            parsing_status: 'completed',
            document_analysis_status: 'completed',
            metadata: {
              ...document.metadata,
              llamaparse_status_reconciled: true,
              reconciliation_timestamp: new Date().toISOString(),
              llamaparse_job_id: llamaParseId
            }
          };

          if (extractedText) {
            updateData.extracted_text = extractedText;
            updateData.metadata.text_extraction_completed = true;
          }

          const { error: updateError } = await supabase
            .from('deal_documents')
            .update(updateData)
            .eq('id', documentId);

          if (updateError) {
            console.error('Failed to update document status:', updateError);
            result.auto_fix_error = updateError.message;
          } else {
            console.log('✅ Document status automatically reconciled');
            result.auto_fix_applied = true;
            result.extracted_text_updated = !!extractedText;
          }
        } catch (autoFixError) {
          console.error('Auto-fix failed:', autoFixError);
          result.auto_fix_error = autoFixError.message;
        }
      }
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ LlamaParse status check error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Unknown error occurred'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});