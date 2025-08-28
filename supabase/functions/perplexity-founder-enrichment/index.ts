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

    // Check if the deal's fund is venture capital only
    const { data: dealData, error: dealError } = await supabase
      .from('deals')
      .select(`
        id,
        fund_id,
        funds!deals_fund_id_fkey(
          id,
          fund_type
        )
      `)
      .eq('id', dealId)
      .single();

    if (dealError) {
      console.error('❌ Error fetching deal data:', dealError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to fetch deal information',
          dataSource: 'perplexity_founder_search',
          trustScore: 0,
          dataQuality: 0
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Only process if fund type is venture_capital
    if (dealData.funds.fund_type !== 'venture_capital') {
      console.log(`🚫 Skipping Perplexity founder enrichment for ${founderName} at ${companyName} - Fund type is ${dealData.funds.fund_type}, not venture_capital`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Perplexity founder enrichment is only available for venture capital deals',
          fund_type: dealData.funds.fund_type,
          dataSource: 'perplexity_founder_search',
          trustScore: 0,
          dataQuality: 0
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`✅ Deal ${dealId} confirmed as venture capital - proceeding with founder enrichment`);

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

    // Build structured search query with VC subcategories
    const searchQuery = `
    Research ${founderName}, founder of ${companyName}, and return the information in the following JSON structure organized by venture capital evaluation subcategories:

    {
        "founder_name": "${founderName}",
        "company_name": "${companyName}",
        "team_leadership": {
            "data": {
                "previous_roles": [
                    {
                        "company": "Company Name",
                        "position": "Job Title",
                        "duration": "Years",
                        "description": "Role description"
                    }
                ],
                "leadership_experience": {
                    "years_experience": 0,
                    "team_sizes_managed": [10, 50, 100],
                    "leadership_style": "Description",
                    "key_achievements": ["Achievement 1", "Achievement 2"]
                },
                "team_building": {
                    "summary": "Team building experience",
                    "team_sizes": ["Size ranges managed"],
                    "notable_hires": ["Key hire 1", "Key hire 2"],
                    "hiring_record": ["Hiring achievement 1", "Hiring achievement 2"],
                    "team_culture": "Team culture description"
                }
            },
            "sources": ["URL 1", "URL 2"],
            "confidence": "High"
        },
        "innovation_expertise": {
            "data": {
                "technical_skills": ["Skill 1", "Skill 2", "Skill 3"],
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
                    ],
                    "institutions": ["University 1", "University 2"]
                },
                "certifications": [
                    {
                        "name": "Certification Name",
                        "issuer": "Issuing Organization",
                        "year": "Year Obtained"
                    }
                ]
            },
            "sources": ["URL 1", "URL 2"],
            "confidence": "Medium"
        },
        "market_knowledge": {
            "data": {
                "market_knowledge": {
                    "industries": ["Industry 1", "Industry 2"],
                    "expertise_areas": ["Area 1", "Area 2"],
                    "market_insights": ["Insight 1", "Insight 2"]
                },
                "thought_leadership": {
                    "publications": ["Article 1", "Article 2"],
                    "speaking_engagements": ["Event 1", "Event 2"],
                    "media_appearances": ["Media 1", "Media 2"]
                }
            },
            "sources": ["URL 1", "URL 2"],
            "confidence": "Medium"
        },
        "track_record": {
            "data": {
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
                    "financial_achievements": ["Achievement 1", "Achievement 2"],
                    "growth_metrics": ["Metric 1", "Metric 2"]
                }
            },
            "sources": ["URL 1", "URL 2"],
            "confidence": "Low"
        },
        "metadata": {
            "last_updated": "2025-01-27",
            "overall_confidence": "Medium"
        }
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
        presence_penalty: 0,
        response_format: {
          type: 'json_schema',
          json_schema: {
            schema: {
              type: 'object',
              properties: {
                founder_name: { type: 'string' },
                company_name: { type: 'string' },
                team_leadership: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'object',
                      properties: {
                        previous_roles: { 
                          type: 'array', 
                          items: { 
                            type: 'object',
                            properties: {
                              company: { type: 'string' },
                              position: { type: 'string' },
                              duration: { type: 'string' },
                              description: { type: 'string' }
                            }
                          }
                        },
                        leadership_experience: {
                          type: 'object',
                          properties: {
                            years_experience: { type: 'number' },
                            team_sizes_managed: { type: 'array', items: { type: 'number' } },
                            leadership_style: { type: 'string' },
                            key_achievements: { type: 'array', items: { type: 'string' } }
                          }
                        },
                        team_building: {
                          type: 'object',
                          properties: {
                            summary: { type: 'string' },
                            team_sizes: { type: 'array', items: { type: 'string' } },
                            notable_hires: { type: 'array', items: { type: 'string' } },
                            hiring_record: { type: 'array', items: { type: 'string' } },
                            team_culture: { type: 'string' }
                          }
                        }
                      }
                    },
                    sources: { type: 'array', items: { type: 'string' } },
                    confidence: { type: 'string' }
                  }
                },
                innovation_expertise: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'object',
                      properties: {
                        technical_skills: { type: 'array', items: { type: 'string' } },
                        innovation_record: {
                          type: 'object',
                          properties: {
                            patents: { type: 'array', items: { type: 'string' } },
                            innovations: { type: 'array', items: { type: 'string' } },
                            breakthrough_work: { type: 'array', items: { type: 'string' } }
                          }
                        },
                        academic_background: {
                          type: 'object',
                          properties: {
                            degrees: { 
                              type: 'array', 
                              items: {
                                type: 'object',
                                properties: {
                                  degree: { type: 'string' },
                                  institution: { type: 'string' },
                                  year: { type: 'string' },
                                  field: { type: 'string' }
                                }
                              }
                            },
                            institutions: { type: 'array', items: { type: 'string' } }
                          }
                        },
                        certifications: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              name: { type: 'string' },
                              issuer: { type: 'string' },
                              year: { type: 'string' }
                            }
                          }
                        }
                      }
                    },
                    sources: { type: 'array', items: { type: 'string' } },
                    confidence: { type: 'string' }
                  }
                },
                market_knowledge: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'object',
                      properties: {
                        market_knowledge: {
                          type: 'object',
                          properties: {
                            industries: { type: 'array', items: { type: 'string' } },
                            expertise_areas: { type: 'array', items: { type: 'string' } },
                            market_insights: { type: 'array', items: { type: 'string' } }
                          }
                        },
                        thought_leadership: {
                          type: 'object',
                          properties: {
                            publications: { type: 'array', items: { type: 'string' } },
                            speaking_engagements: { type: 'array', items: { type: 'string' } },
                            media_appearances: { type: 'array', items: { type: 'string' } }
                          }
                        }
                      }
                    },
                    sources: { type: 'array', items: { type: 'string' } },
                    confidence: { type: 'string' }
                  }
                },
                track_record: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'object',
                      properties: {
                        exit_history: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              company: { type: 'string' },
                              exit_type: { type: 'string' },
                              year: { type: 'string' },
                              valuation: { type: 'string' }
                            }
                          }
                        },
                        value_creation: {
                          type: 'object',
                          properties: {
                            summary: { type: 'string' },
                            financial_achievements: { type: 'array', items: { type: 'string' } },
                            growth_metrics: { type: 'array', items: { type: 'string' } }
                          }
                        }
                      }
                    },
                    sources: { type: 'array', items: { type: 'string' } },
                    confidence: { type: 'string' }
                  }
                },
                metadata: {
                  type: 'object',
                  properties: {
                    last_updated: { type: 'string' },
                    overall_confidence: { type: 'string' }
                  }
                }
              },
              required: ['founder_name', 'company_name', 'team_leadership']
            }
          }
        }
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
      
      // Handle both plain JSON and markdown-wrapped JSON
      let jsonContent = content;
      if (content.includes('```json')) {
        // Extract JSON from markdown code blocks
        const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          jsonContent = jsonMatch[1];
          console.log('🔧 Extracted JSON from markdown wrapper');
        }
      } else if (content.includes('```')) {
        // Handle generic code blocks
        const codeMatch = content.match(/```\s*([\s\S]*?)\s*```/);
        if (codeMatch) {
          jsonContent = codeMatch[1];
          console.log('🔧 Extracted JSON from code wrapper');
        }
      }
      
      founderData = JSON.parse(jsonContent.trim());
      console.log('✅ Successfully parsed founder data from Perplexity response');
    } catch (parseError) {
      console.error('❌ Failed to parse Perplexity response:', parseError);
      console.error('❌ Raw content:', perplexityResult.choices[0].message.content);
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
    // Extract subcategory-level data with sources and confidence
    const teamLeadership = founderData.team_leadership || {};
    const innovationExpertise = founderData.innovation_expertise || {};
    const marketKnowledge = founderData.market_knowledge || {};
    const trackRecord = founderData.track_record || {};
    const metadata = founderData.metadata || {};

    // Build subcategory sources object
    const subcategorySources = {
      team_leadership: teamLeadership.sources || [],
      innovation_expertise: innovationExpertise.sources || [],
      market_knowledge: marketKnowledge.sources || [],
      track_record: trackRecord.sources || []
    };

    // Build subcategory confidence object
    const subcategoryConfidence = {
      team_leadership: teamLeadership.confidence || 'Unknown',
      innovation_expertise: innovationExpertise.confidence || 'Unknown',
      market_knowledge: marketKnowledge.confidence || 'Unknown',
      track_record: trackRecord.confidence || 'Unknown'
    };

    // Extract data for backward compatibility
    const teamData = teamLeadership.data || {};
    const innovationData = innovationExpertise.data || {};
    const marketData = marketKnowledge.data || {};
    const trackData = trackRecord.data || {};

    const perplexityFounderExportData = {
      deal_id: dealId,
      snapshot_id: snapshotId,
      founder_name: founderName,
      company_name: companyName,
      
      // Map structured data fields for backward compatibility
      previous_roles: teamData.previous_roles || [],
      leadership_experience: teamData.leadership_experience || {},
      technical_skills: innovationData.technical_skills || [],
      market_knowledge: marketData.market_knowledge || {},
      innovation_record: innovationData.innovation_record || {},
      academic_background: innovationData.academic_background || {},
      certifications: innovationData.certifications || [],
      thought_leadership: marketData.thought_leadership || {},
      exit_history: trackData.exit_history || [],
      value_creation: trackData.value_creation || {},
      team_building: teamData.team_building || {},
      
      // NEW: Add subcategory-level source tracking
      subcategory_sources: subcategorySources,
      subcategory_confidence: subcategoryConfidence,
      
      // System fields
      raw_perplexity_response: founderData,
      processing_status: 'processed',
      data_quality_score: calculateFounderDataQualityWithSubcategories(founderData),
      confidence_score: metadata.overall_confidence === 'High' ? 90 : metadata.overall_confidence === 'Medium' ? 75 : 60,
      processed_at: new Date().toISOString()
    };

    console.log('💾 Inserting processed founder data into database...');

    // Insert the processed data
    const { data: insertedData, error: insertError } = await supabase
      .from('deal_enrichment_perplexity_founder_export_vc')
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
        confidence_score: 70,
        subcategory_sources: {},
        subcategory_confidence: {}
      };

      const { error: fallbackError } = await supabase
        .from('deal_enrichment_perplexity_founder_export_vc')
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
        previous_roles: teamData.previous_roles || [],
        leadership_summary: teamData.leadership_experience?.summary || null,
        technical_expertise: innovationData.technical_skills || [],
        industry_knowledge: marketData.market_knowledge?.industries || [],
        academic_credentials: innovationData.academic_background?.degrees || [],
        exit_experience: trackData.exit_history || [],
        thought_leadership: marketData.thought_leadership || {}
      },
      data_quality: calculateFounderDataQualityWithSubcategories(founderData),
      confidence_score: metadata.overall_confidence === 'High' ? 90 : metadata.overall_confidence === 'Medium' ? 75 : 60,
      sources: getAllSourcesFromSubcategories(subcategorySources),
      enrichment_timestamp: new Date().toISOString(),
      subcategory_sources: subcategorySources,
      subcategory_confidence: subcategoryConfidence
    };

  } catch (error) {
    console.error('❌ Error processing founder response:', error);
    throw error;
  }
}

function calculateFounderDataQualityWithSubcategories(founderData: any): number {
  let qualityScore = 0;
  
  // Team & Leadership scoring (25 points)
  const teamLeadership = founderData.team_leadership?.data || {};
  if (teamLeadership.previous_roles?.length > 0) qualityScore += 10;
  if (teamLeadership.leadership_experience?.key_achievements?.length > 0) qualityScore += 8;
  if (teamLeadership.team_building?.notable_hires?.length > 0) qualityScore += 7;
  
  // Innovation & Expertise scoring (25 points)
  const innovationExpertise = founderData.innovation_expertise?.data || {};
  if (innovationExpertise.technical_skills?.length > 0) qualityScore += 8;
  if (innovationExpertise.innovation_record?.patents?.length > 0) qualityScore += 10;
  if (innovationExpertise.academic_background?.degrees?.length > 0) qualityScore += 7;
  
  // Market Knowledge scoring (25 points)
  const marketKnowledge = founderData.market_knowledge?.data || {};
  if (marketKnowledge.market_knowledge?.industries?.length > 0) qualityScore += 10;
  if (marketKnowledge.thought_leadership?.publications?.length > 0) qualityScore += 8;
  if (marketKnowledge.thought_leadership?.speaking_engagements?.length > 0) qualityScore += 7;
  
  // Track Record scoring (25 points)
  const trackRecord = founderData.track_record?.data || {};
  if (trackRecord.exit_history?.length > 0) qualityScore += 15;
  if (trackRecord.value_creation?.financial_achievements?.length > 0) qualityScore += 10;
  
  return Math.min(qualityScore, 100);
}

function getAllSourcesFromSubcategories(subcategorySources: any): string[] {
  const allSources: string[] = [];
  
  Object.values(subcategorySources).forEach((sources: any) => {
    if (Array.isArray(sources)) {
      allSources.push(...sources);
    }
  });
  
  // Remove duplicates
  return [...new Set(allSources)];
}

function calculateFounderDataQuality(founderData: any): number {
  // Fallback for old format - delegate to new function
  if (founderData.team_leadership) {
    return calculateFounderDataQualityWithSubcategories(founderData);
  }
  
  // Legacy calculation for backward compatibility
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