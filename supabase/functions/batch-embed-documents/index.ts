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

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { batchSize = 10, fundId = null } = await req.json();

    console.log(`🔄 Starting batch embedding process for documents (batch size: ${batchSize})`);

    // Get documents with extracted text but no vector embeddings
    let query = supabaseClient
      .from('deal_documents')
      .select('id, name, extracted_text, fund_id, deal_id, document_category')
      .not('extracted_text', 'is', null)
      .neq('extracted_text', '');

    if (fundId) {
      query = query.eq('fund_id', fundId);
    }

    const { data: documents, error: docsError } = await query.limit(batchSize);

    if (docsError) {
      throw new Error(`Failed to fetch documents: ${docsError.message}`);
    }

    if (!documents || documents.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No documents found that need embedding',
          processed: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📄 Found ${documents.length} documents to process`);

    const results = [];
    let processed = 0;
    let errors = 0;

    for (const doc of documents) {
      try {
        // Check if embedding already exists
        const { data: existingEmbedding } = await supabaseClient
          .from('vector_embeddings')
          .select('id')
          .eq('content_type', 'deal_document')
          .eq('content_id', doc.id)
          .single();

        if (existingEmbedding) {
          console.log(`⏭️ Embedding already exists for document: ${doc.name}`);
          continue;
        }

        console.log(`🔄 Processing document: ${doc.name}`);

        // Generate vector embedding
        const embeddingResult = await supabaseClient.functions.invoke('vector-embedding-generator', {
          body: {
            text: doc.extracted_text,
            contentType: 'deal_document',
            contentId: doc.id,
            fundId: doc.fund_id,
            metadata: {
              document_name: doc.name,
              document_category: doc.document_category,
              deal_id: doc.deal_id,
              batch_processed: true,
              processed_at: new Date().toISOString()
            }
          }
        });

        if (embeddingResult.error) {
          console.error(`❌ Failed to generate embedding for ${doc.name}:`, embeddingResult.error);
          errors++;
          results.push({
            document_id: doc.id,
            document_name: doc.name,
            success: false,
            error: embeddingResult.error.message
          });
        } else {
          console.log(`✅ Successfully generated embedding for: ${doc.name}`);
          processed++;
          results.push({
            document_id: doc.id,
            document_name: doc.name,
            success: true,
            embedding_dimensions: embeddingResult.data?.dimensions || 'unknown'
          });
        }

        // Small delay to avoid overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (docError) {
        console.error(`❌ Error processing document ${doc.name}:`, docError);
        errors++;
        results.push({
          document_id: doc.id,
          document_name: doc.name,
          success: false,
          error: docError instanceof Error ? docError.message : 'Unknown error'
        });
      }
    }

    console.log(`🎯 Batch processing complete: ${processed} processed, ${errors} errors`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Batch embedding completed: ${processed} processed, ${errors} errors`,
        processed,
        errors,
        total_documents: documents.length,
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Batch embedding process failed:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        details: 'Failed to process batch document embeddings'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});