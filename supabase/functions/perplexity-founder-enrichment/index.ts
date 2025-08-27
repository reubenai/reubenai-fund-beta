import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PerplexityFounderRequest {
  dealId: string;
  founderName: string;
  companyName: string;
  companyWebsite?: string;
  linkedinUrl?: string;
  crunchbaseUrl?: string;
}

interface PerplexityFounderResponse {
  success: boolean;
  data?: any;
  error?: string;
  dataSource: string;
  trustScore: number;
  dataQuality: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('🚀 Perplexity Founder Enrichment - Starting request processing');

  try {
    // Initialize Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body
    const { dealId, founderName, companyName, companyWebsite, linkedinUrl, crunchbaseUrl }: PerplexityFounderRequest = await req.json();

    console.log(`📊 Processing founder enrichment for: ${founderName} at ${companyName}`);

    // Validate required fields
    if (!founderName || !companyName) {
      console.error('❌ Missing required fields:', { founderName, companyName });
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Founder name and company name are required',
          dataSource: 'perplexity_founder_search',
          trustScore: 0,
          dataQuality: 0
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Get Perplexity API key from environment
    const perplexityApiKey = Deno.env.get('PERPLEXITY_API_KEY');
    if (!perplexityApiKey) {
      console.error('❌ PERPLEXITY_API_KEY not found in environment variables');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Perplexity API key not configured',
          dataSource: 'perplexity_founder_search',
          trustScore: 0,
          dataQuality: 0
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Generate unique snapshot ID for tracking
    const snapshotId = `founder_${dealId}_${Date.now()}`;
    console.log(`📝 Generated snapshot ID: ${snapshotId}`);

    // Build structured search query
    const searchQuery = `
    Research ${founderName}, founder of ${companyName}, and return the information in the following JSON structure:

    {
        "founder_name": "${founderName}",
        "company_name": "${companyName}",
        "research_data": {
            "previous_roles": [
                {
                    "company": "Company Name",
                    "position": "Job Title",
                    "duration": "Years",
                    "description": "Role description"
                }
            ],
            "leadership_experience": {
                "summary": "Leadership background summary",
                "key_achievements": ["Achievement 1", "Achievement 2"]
            },
            "technical_skills": [
                "Skill 1", "Skill 2", "Skill 3"
            ],
            "market_knowledge": {
                "industries": ["Industry 1", "Industry 2"],
                "expertise_areas": ["Area 1", "Area 2"]
            },
            "innovation_record": {
                "patents": ["Patent 1", "Patent 2"],
                "innovations": ["Innovation 1", "Innovation 2"],
                "breakthrough_work": ["Work 1", "Work 2"]
            },
            "academic_background": {
                "degrees": [
                    {
                        "degree": "Degree Type",
                        "institution": "University Name",
                        "year": "Graduation Year",
                        "field": "Field of Study"
                    }
                ]
            },
            "certifications": [
                {
                    "name": "Certification Name",
                    "issuer": "Issuing Organization",
                    "year": "Year Obtained"
                }
            ],
            "thought_leadership": {
                "publications": ["Article 1", "Article 2"],
                "speaking_engagements": ["Event 1", "Event 2"],
                "media_appearances": ["Media 1", "Media 2"]
            },
            "exit_history": [
                {
                    "company": "Company Name",
                    "exit_type": "IPO/Acquisition/etc",
                    "year": "Exit Year",
                    "valuation": "Exit Value"
                }
            ],
            "value_creation": {
                "summary": "Value creation track record",
                "metrics": ["Metric 1", "Metric 2"]
            },
            "team_building": {
                "summary": "Team building experience",
                "team_sizes": ["Size ranges managed"],
                "notable_hires": ["Key hire 1", "Key hire 2"]
            }
        },
        "sources": [
            {
                "title": "Source Title",
                "url": "Source URL",
                "relevance": "How this source contributed"
            }
        ]
    }

    Additional context:
    ${companyWebsite ? `- Website: ${companyWebsite}` : ""}
    ${linkedinUrl ? `- LinkedIn: ${linkedinUrl}` : ""}
    ${crunchbaseUrl ? `- Crunchbase: ${crunchbaseUrl}` : ""}

    Return only valid JSON. If information is not available, use null or empty arrays.
    `;

    console.log('🔍 Calling Perplexity API with structured query...');

    // Call Perplexity API
    const perplexityResponse = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${perplexityApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [
          {
            role: 'system',
            content: 'You are a research assistant that returns structured JSON data about founders and executives. Always return valid JSON format.'
          },
          {
            role: 'user',
            content: searchQuery
          }
        ],
        max_tokens: 3000,
        top_p: 0.9,
        return_images: false,
        return_related_questions: false,
        search_recency_filter: 'month',
        frequency_penalty: 1,
        presence_penalty: 0
      }),
    });

    if (!perplexityResponse.ok) {
      const errorText = await perplexityResponse.text();
      console.error('❌ Perplexity API error:', perplexityResponse.status, errorText);
      throw new Error(`Perplexity API error: ${perplexityResponse.status} - ${errorText}`);
    }

    const perplexityResult = await perplexityResponse.json();
    console.log('✅ Perplexity API response received');

    // Parse the structured response
    let founderData;
    try {
      const content = perplexityResult.choices[0].message.content;
      founderData = JSON.parse(content);
    } catch (parseError) {
      console.error('❌ Failed to parse Perplexity response:', parseError);
      throw new Error('Failed to parse Perplexity JSON response');
    }

    // Process and store the data
    const processedData = await processPerplexityFounderResponse(
      founderData,
      founderName,
      companyName,
      dealId,
      snapshotId,
      supabase
    );

    // Insert source record for audit trail
    await supabase
      .from('deal_analysis_sources')
      .insert({
        deal_id: dealId,
        engine_name: 'perplexity-founder-enrichment',
        source_type: 'perplexity_founder_search',
        source_url: 'https://api.perplexity.ai',
        data_retrieved: processedData,
        confidence_score: processedData.confidence_score || 85
      });

    console.log('✅ Perplexity founder enrichment completed successfully');

    return new Response(
      JSON.stringify({
        success: true,
        data: processedData,
        dataSource: 'perplexity_founder_search',
        trustScore: processedData.confidence_score || 85,
        dataQuality: calculateFounderDataQuality(founderData)
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('❌ Perplexity founder enrichment error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Unknown error occurred',
        dataSource: 'perplexity_founder_search',
        trustScore: 0,
        dataQuality: 0
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function processPerplexityFounderResponse(
  founderData: any,
  founderName: string,
  companyName: string,
  dealId: string,
  snapshotId: string,
  supabase: any
) {
  console.log('🔄 Processing Perplexity founder response...');

  try {
    // Extract structured data from response
    const researchData = founderData.research_data || {};

    const perplexityFounderExportData = {
      deal_id: dealId,
      snapshot_id: snapshotId,
      founder_name: founderName,
      company_name: companyName,
      
      // Map structured data fields
      previous_roles: researchData.previous_roles || [],
      leadership_experience: researchData.leadership_experience || {},
      technical_skills: researchData.technical_skills || [],
      market_knowledge: researchData.market_knowledge || {},
      innovation_record: researchData.innovation_record || {},
      academic_background: researchData.academic_background || {},
      certifications: researchData.certifications || [],
      thought_leadership: researchData.thought_leadership || {},
      exit_history: researchData.exit_history || [],
      value_creation: researchData.value_creation || {},
      team_building: researchData.team_building || {},
      
      // System fields
      raw_perplexity_response: founderData,
      processing_status: 'processed',
      data_quality_score: calculateFounderDataQuality(founderData),
      confidence_score: 85,
      processed_at: new Date().toISOString()
    };

    console.log('💾 Inserting processed founder data into database...');

    // Insert the processed data
    const { data: insertedData, error: insertError } = await supabase
      .from('deal_enrichment_perplexity_founder_export')
      .insert(perplexityFounderExportData)
      .select()
      .single();

    if (insertError) {
      console.error('❌ Database insert error:', insertError);
      
      // Fallback: insert minimal data to preserve raw response
      console.log('🔄 Attempting fallback insert...');
      const fallbackData = {
        deal_id: dealId,
        snapshot_id: snapshotId,
        founder_name: founderName,
        company_name: companyName,
        raw_perplexity_response: founderData,
        processing_status: 'raw',
        data_quality_score: 50,
        confidence_score: 70
      };

      const { error: fallbackError } = await supabase
        .from('deal_enrichment_perplexity_founder_export')
        .insert(fallbackData);

      if (fallbackError) {
        console.error('❌ Fallback insert also failed:', fallbackError);
        throw fallbackError;
      }

      console.log('⚠️ Fallback insert successful - data saved as raw');
    } else {
      console.log('✅ Processed founder data inserted successfully');
    }

    // Return legacy format for backward compatibility
    return {
      founder_profile: {
        name: founderName,
        company: companyName,
        previous_roles: researchData.previous_roles || [],
        leadership_summary: researchData.leadership_experience?.summary || null,
        technical_expertise: researchData.technical_skills || [],
        industry_knowledge: researchData.market_knowledge?.industries || [],
        academic_credentials: researchData.academic_background?.degrees || [],
        exit_experience: researchData.exit_history || [],
        thought_leadership: researchData.thought_leadership || {}
      },
      data_quality: calculateFounderDataQuality(founderData),
      confidence_score: 85,
      sources: founderData.sources || [],
      enrichment_timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('❌ Error processing founder response:', error);
    throw error;
  }
}

function calculateFounderDataQuality(founderData: any): number {
  let qualityScore = 0;
  const researchData = founderData.research_data || {};

  // Weight different data points
  if (researchData.previous_roles?.length > 0) qualityScore += 20;
  if (researchData.leadership_experience?.summary) qualityScore += 15;
  if (researchData.technical_skills?.length > 0) qualityScore += 10;
  if (researchData.market_knowledge?.industries?.length > 0) qualityScore += 10;
  if (researchData.innovation_record?.patents?.length > 0) qualityScore += 10;
  if (researchData.academic_background?.degrees?.length > 0) qualityScore += 15;
  if (researchData.thought_leadership?.publications?.length > 0) qualityScore += 10;
  if (researchData.exit_history?.length > 0) qualityScore += 10;

  return Math.min(qualityScore, 100);
}