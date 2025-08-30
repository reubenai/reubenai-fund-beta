import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const openaiApiKey = Deno.env.get('OPENAI_API_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface DocumentProcessingRequest {
  documentId: string;
  fundType: 'venture_capital' | 'private_equity';
}

// VC Data Points structure
const VC_DATA_POINTS = [
  'TAM', 'SAM', 'SOM', 'CAGR', 'Growth Drivers', 'Market Share Distribution',
  'Key Market Players', 'Whitespace Opportunities', 'Addressable Customers',
  'CAC Trend', 'LTV:CAC Ratio', 'Retention Rate', 'Channel Effectiveness',
  'Strategic Advisors', 'Investor Network', 'Partnership Ecosystem'
];

// PE Data Points structure
const PE_DATA_POINTS = [
  'Revenue Quality', 'Profitability Analysis', 'Cash Management',
  'Management Team Strength', 'Operational Efficiency', 'Technology & Systems',
  'Market Share & Position', 'Competitive Advantages', 'Customer Base Quality',
  'Leadership Track Record', 'Organizational Strength', 'Strategic Vision',
  'Market Expansion Opportunities', 'Value Creation Initiatives', 'Exit Strategy Potential',
  'Fund Strategy Alignment', 'Portfolio Synergies', 'Risk-Return Profile'
];

async function extractTextFromDocument(documentId: string): Promise<string> {
  try {
    // Get document details from database
    const { data: document, error } = await supabase
      .from('deal_documents')
      .select('name, file_path, document_type')
      .eq('id', documentId)
      .single();

    if (error || !document) {
      throw new Error(`Document not found: ${error?.message}`);
    }

    // Download file from Supabase Storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('deal-documents')
      .download(document.file_path);

    if (downloadError || !fileData) {
      throw new Error(`Failed to download document: ${downloadError?.message}`);
    }

    // Convert blob to text (basic implementation)
    // In production, you'd want proper PDF/Word parsing libraries
    const text = await fileData.text();
    
    return text || `Document content from ${document.name}`;
  } catch (error) {
    console.error('Error extracting text:', error);
    return `Unable to extract text from document. Error: ${error.message}`;
  }
}

async function generateSummary(documentText: string, companyName: string): Promise<string> {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an expert investment analyst. Create a concise, professional narrative summary of the document that captures the key business insights, market position, financial highlights, and strategic opportunities. Focus on investment-relevant information.`
          },
          {
            role: 'user',
            content: `Please analyze this document for ${companyName} and provide a comprehensive narrative summary:\n\n${documentText.slice(0, 15000)}`
          }
        ],
        max_tokens: 1000,
        temperature: 0.3,
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`OpenAI API error: ${data.error?.message || 'Unknown error'}`);
    }

    return data.choices[0]?.message?.content || 'Unable to generate summary';
  } catch (error) {
    console.error('Error generating summary:', error);
    return `Summary generation failed: ${error.message}`;
  }
}

async function extractVCDataPoints(documentText: string, companyName: string): Promise<Record<string, string>> {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a VC investment analyst. Extract specific data points from the document. For each data point, provide a concise value or "Not specified" if not found. Be precise and factual.`
          },
          {
            role: 'user',
            content: `Extract the following VC data points for ${companyName} from this document:\n\n${VC_DATA_POINTS.join(', ')}\n\nDocument:\n${documentText.slice(0, 12000)}\n\nProvide response as JSON with each data point as a key.`
          }
        ],
        max_tokens: 1500,
        temperature: 0.1,
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`OpenAI API error: ${data.error?.message || 'Unknown error'}`);
    }

    const content = data.choices[0]?.message?.content || '{}';
    
    try {
      const parsed = JSON.parse(content);
      
      // Ensure all VC data points are present
      const vcDataPoints: Record<string, string> = {};
      VC_DATA_POINTS.forEach(point => {
        vcDataPoints[point] = parsed[point] || 'Not specified';
      });
      
      return vcDataPoints;
    } catch (parseError) {
      console.error('Error parsing VC data points:', parseError);
      // Return default structure
      const defaultVCData: Record<string, string> = {};
      VC_DATA_POINTS.forEach(point => {
        defaultVCData[point] = 'Not specified';
      });
      return defaultVCData;
    }
  } catch (error) {
    console.error('Error extracting VC data points:', error);
    const errorVCData: Record<string, string> = {};
    VC_DATA_POINTS.forEach(point => {
      errorVCData[point] = 'Extraction failed';
    });
    return errorVCData;
  }
}

async function extractPEDataPoints(documentText: string, companyName: string): Promise<Record<string, string>> {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a PE investment analyst. Extract specific data points from the document. For each data point, provide a concise value or "Not specified" if not found. Focus on operational metrics, financial performance, and value creation opportunities.`
          },
          {
            role: 'user',
            content: `Extract the following PE data points for ${companyName} from this document:\n\n${PE_DATA_POINTS.join(', ')}\n\nDocument:\n${documentText.slice(0, 12000)}\n\nProvide response as JSON with each data point as a key.`
          }
        ],
        max_tokens: 1500,
        temperature: 0.1,
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`OpenAI API error: ${data.error?.message || 'Unknown error'}`);
    }

    const content = data.choices[0]?.message?.content || '{}';
    
    try {
      const parsed = JSON.parse(content);
      
      // Ensure all PE data points are present
      const peDataPoints: Record<string, string> = {};
      PE_DATA_POINTS.forEach(point => {
        peDataPoints[point] = parsed[point] || 'Not specified';
      });
      
      return peDataPoints;
    } catch (parseError) {
      console.error('Error parsing PE data points:', parseError);
      // Return default structure
      const defaultPEData: Record<string, string> = {};
      PE_DATA_POINTS.forEach(point => {
        defaultPEData[point] = 'Not specified';
      });
      return defaultPEData;
    }
  } catch (error) {
    console.error('Error extracting PE data points:', error);
    const errorPEData: Record<string, string> = {};
    PE_DATA_POINTS.forEach(point => {
      errorPEData[point] = 'Extraction failed';
    });
    return errorPEData;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(NULL, { headers: corsHeaders });
  }

  try {
    console.log('Modern Document Processor started');
    
    const { documentId, fundType }: DocumentProcessingRequest = await req.json();
    
    if (!documentId || !fundType) {
      throw new Error('Missing required parameters: documentId and fundType');
    }

    console.log(`Processing document ${documentId} for fund type: ${fundType}`);

    // Get document and deal information
    const { data: document, error: docError } = await supabase
      .from('deal_documents')
      .select(`
        *,
        deals!inner(
          id,
          company_name,
          fund_id,
          funds!inner(fund_type)
        )
      `)
      .eq('id', documentId)
      .single();

    if (docError || !document) {
      throw new Error(`Document not found: ${docError?.message}`);
    }

    const companyName = document.deals.company_name;
    console.log(`Processing document for company: ${companyName}`);

    // Step 1: Extract text from document
    console.log('Extracting text from document...');
    const documentText = await extractTextFromDocument(documentId);

    // Step 2: Generate narrative summary
    console.log('Generating narrative summary...');
    const narrative = await generateSummary(documentText, companyName);

    // Step 3: Extract data points based on fund type
    let vcDataPoints = null;
    let peDataPoints = null;

    if (fundType === 'venture_capital') {
      console.log('Extracting VC data points...');
      vcDataPoints = await extractVCDataPoints(documentText, companyName);
    } else if (fundType === 'private_equity') {
      console.log('Extracting PE data points...');
      peDataPoints = await extractPEDataPoints(documentText, companyName);
    }

    // Step 4: Update the document in the database
    console.log('Updating document in database...');
    const { error: updateError } = await supabase
      .from('deal_documents')
      .update({
        document_summary: { narrative },
        data_points_vc: vcDataPoints,
        data_points_pe: peDataPoints,
        updated_at: new Date().toISOString()
      })
      .eq('id', documentId);

    if (updateError) {
      throw new Error(`Failed to update document: ${updateError.message}`);
    }

    console.log('Document processing completed successfully');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Document processed successfully',
        results: {
          documentId,
          companyName,
          fundType,
          summaryGenerated: !!narrative,
          dataPointsExtracted: fundType === 'venture_capital' ? !!vcDataPoints : !!peDataPoints
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in modern-document-processor:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});