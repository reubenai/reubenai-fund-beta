import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, contentType, contentId, fundId, metadata = {} } = await req.json();

    if (!text) {
      throw new Error('Text is required for embedding generation');
    }

    console.log(`🔄 Generating embedding for ${contentType || 'unknown'} content`);

    // Generate embedding using OpenAI
    const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-ada-002',
        input: text.substring(0, 8000), // Limit text length
      }),
    });

    if (!embeddingResponse.ok) {
      const errorData = await embeddingResponse.text();
      throw new Error(`OpenAI API error: ${embeddingResponse.status} - ${errorData}`);
    }

    const embeddingData = await embeddingResponse.json();
    const embedding = embeddingData.data[0].embedding;

    console.log(`✅ Generated embedding with ${embedding.length} dimensions`);

    // Store embedding if contentId and fundId are provided
    if (contentId && fundId) {
      const { error: insertError } = await supabase
        .from('vector_embeddings')
        .upsert({
          content_type: contentType || 'unknown',
          content_id: contentId,
          fund_id: fundId,
          embedding: embedding,
          content_text: text.substring(0, 2000), // Store first 2000 chars
          metadata: {
            ...metadata,
            generated_at: new Date().toISOString(),
            model: 'text-embedding-ada-002',
            text_length: text.length
          },
          confidence_score: 90
        }, {
          onConflict: 'content_type,content_id,fund_id',
          ignoreDuplicates: false
        });

      if (insertError) {
        console.error('Error storing embedding:', insertError);
        // Don't fail the request if storage fails
      } else {
        console.log(`💾 Stored embedding for ${contentType}:${contentId}`);
      }
    }

    return new Response(
      JSON.stringify({ 
        embedding,
        dimensions: embedding.length,
        stored: !!(contentId && fundId)
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in vector-embedding-generator:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Failed to generate or store embedding'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});