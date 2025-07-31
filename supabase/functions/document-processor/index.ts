import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DocumentProcessRequest {
  documentId: string;
  analysisType?: 'full' | 'quick' | 'financial' | 'legal';
}

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

    const { documentId, analysisType = 'quick' }: DocumentProcessRequest = await req.json();

    if (!documentId) {
      throw new Error('Document ID is required');
    }

    console.log(`Processing document ${documentId} with analysis type: ${analysisType}`);

    // Get document record
    const { data: document, error: docError } = await supabaseClient
      .from('deal_documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (docError || !document) {
      throw new Error(`Document not found: ${docError?.message}`);
    }

    // Update status to processing
    const { error: statusError } = await supabaseClient
      .from('deal_documents')
      .update({ 
        document_analysis_status: 'processing',
        metadata: {
          ...document.metadata,
          analysis_started_at: new Date().toISOString(),
          analysis_type: analysisType
        }
      })
      .eq('id', documentId);

    if (statusError) {
      console.warn('Failed to update status to processing:', statusError);
    }

    // Get signed URL for document
    const { data: urlData, error: urlError } = await supabaseClient.storage
      .from(document.bucket_name)
      .createSignedUrl(document.file_path, 3600);

    if (urlError || !urlData) {
      throw new Error(`Failed to get document URL: ${urlError?.message}`);
    }

    // Simulate document analysis (replace with actual analysis logic)
    const analysisResult = await analyzeDocument(urlData.signedUrl, document, analysisType);

    // Update document with analysis results
    const { error: updateError } = await supabaseClient
      .from('deal_documents')
      .update({
        document_analysis_status: 'completed',
        metadata: {
          ...document.metadata,
          analysis_completed_at: new Date().toISOString(),
          analysis_result: analysisResult,
          analysis_type: analysisType
        }
      })
      .eq('id', documentId);

    if (updateError) {
      console.error('Failed to update document with analysis:', updateError);
      throw new Error('Failed to save analysis results');
    }

    // Log activity
    await supabaseClient.from('activity_events').insert({
      fund_id: document.fund_id,
      user_id: (await supabaseClient.auth.getUser()).data.user?.id || '',
      activity_type: 'document_analyzed',
      title: `Document analyzed: ${document.name}`,
      description: `Completed ${analysisType} analysis of ${document.name}`,
      deal_id: document.deal_id,
      resource_type: 'document',
      resource_id: document.id,
      context_data: {
        document_name: document.name,
        analysis_type: analysisType,
        analysis_summary: analysisResult.summary
      },
      priority: 'medium',
      tags: ['document', 'analysis', analysisType],
      is_system_event: true
    });

    console.log(`Document ${documentId} analysis completed successfully`);

    return new Response(
      JSON.stringify({
        success: true,
        documentId,
        analysisType,
        result: analysisResult
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Document processing error:', error);

    // Try to update document status to failed if we have the documentId
    try {
      const { documentId } = await req.json();
      if (documentId) {
        const supabaseClient = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        await supabaseClient
          .from('deal_documents')
          .update({ 
            document_analysis_status: 'failed',
            metadata: {
              analysis_failed_at: new Date().toISOString(),
              error_message: error instanceof Error ? error.message : 'Unknown error'
            }
          })
          .eq('id', documentId);
      }
    } catch (updateError) {
      console.error('Failed to update error status:', updateError);
    }

    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

async function analyzeDocument(documentUrl: string, document: any, analysisType: string) {
  // This is a placeholder for actual document analysis
  // In a real implementation, you would:
  // 1. Download the document
  // 2. Extract text/data based on file type
  // 3. Use AI/ML services for analysis
  // 4. Return structured analysis results

  const isFinancial = document.document_category === 'financial_statements' || 
                     document.document_type?.toLowerCase().includes('financial');
  
  const isPitchDeck = document.document_category === 'pitch_deck';
  
  // Simulate different analysis types
  const baseAnalysis = {
    summary: `Analyzed ${document.name} using ${analysisType} analysis`,
    confidence: Math.floor(Math.random() * 30) + 70, // 70-100%
    extracted_data: {},
    insights: [],
    flags: []
  };

  switch (analysisType) {
    case 'financial':
      return {
        ...baseAnalysis,
        extracted_data: {
          revenue: isFinancial ? `$${Math.floor(Math.random() * 10000000)}` : null,
          growth_rate: isFinancial ? `${Math.floor(Math.random() * 50)}%` : null,
          burn_rate: isFinancial ? `$${Math.floor(Math.random() * 100000)}` : null,
          runway: isFinancial ? `${Math.floor(Math.random() * 24)} months` : null
        },
        insights: isFinancial ? [
          'Strong revenue growth trajectory',
          'Healthy gross margins',
          'Efficient capital utilization'
        ] : ['Not a financial document'],
        flags: isFinancial && Math.random() > 0.7 ? ['High burn rate identified'] : []
      };

    case 'legal':
      return {
        ...baseAnalysis,
        extracted_data: {
          document_type: document.document_category,
          jurisdiction: 'Delaware',
          key_terms: ['intellectual property', 'liquidation preference', 'anti-dilution'],
          compliance_status: 'Compliant'
        },
        insights: [
          'Standard VC-friendly terms',
          'IP protection adequate',
          'Regulatory compliance verified'
        ],
        flags: Math.random() > 0.8 ? ['Unusual liquidation preference terms'] : []
      };

    case 'full':
      return {
        ...baseAnalysis,
        extracted_data: {
          key_metrics: isPitchDeck ? {
            market_size: `$${Math.floor(Math.random() * 100)}B`,
            traction: `${Math.floor(Math.random() * 1000)}+ customers`,
            team_size: Math.floor(Math.random() * 50) + 10
          } : {},
          business_model: isPitchDeck ? 'SaaS' : 'Unknown',
          competitive_landscape: isPitchDeck ? ['Strong differentiation', 'Large addressable market'] : []
        },
        insights: [
          'Well-structured business plan',
          'Clear value proposition',
          'Experienced team',
          'Scalable business model'
        ],
        flags: Math.random() > 0.9 ? ['Market size claims need verification'] : []
      };

    default: // 'quick'
      return {
        ...baseAnalysis,
        extracted_data: {
          file_type: document.content_type,
          page_count: Math.floor(Math.random() * 50) + 1,
          word_count: Math.floor(Math.random() * 10000) + 1000
        },
        insights: [
          'Document is well-formatted',
          'Contains relevant business information',
          'Standard document structure'
        ],
        flags: []
      };
  }
}