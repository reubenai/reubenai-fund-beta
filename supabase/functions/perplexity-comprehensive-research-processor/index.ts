import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔄 Perplexity Comprehensive Research Processor Starting...');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { batchSize = 5, dryRun = false } = await req.json();

    console.log(`📊 Processing batch of ${batchSize} queued research requests (dry run: ${dryRun})`);

    // Find queued research requests
    const { data: queuedRequests, error: queueError } = await supabase
      .from('perplexity_datamining_vc')
      .select(`
        id,
        deal_id,
        fund_id,
        organization_id,
        company_name,
        category,
        processing_status,
        created_at
      `)
      .eq('processing_status', 'queued')
      .order('created_at', { ascending: true })
      .limit(batchSize);

    if (queueError) {
      throw new Error(`Failed to fetch queued requests: ${queueError.message}`);
    }

    console.log(`🔍 Found ${queuedRequests?.length || 0} queued research requests`);

    if (dryRun) {
      return new Response(JSON.stringify({
        success: true,
        dry_run: true,
        requests_found: queuedRequests?.length || 0,
        requests_preview: queuedRequests?.map(r => ({
          id: r.id,
          company_name: r.company_name,
          category: r.category,
          created_at: r.created_at
        })) || []
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!queuedRequests || queuedRequests.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: 'No queued research requests found',
        processed: 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check for Perplexity API key
    const perplexityApiKey = Deno.env.get('PERPLEXITY_API_KEY');
    if (!perplexityApiKey) {
      throw new Error('Perplexity API key not configured');
    }

    // Process requests in actual run
    const results = [];
    let processed = 0;
    let successful = 0;
    let failed = 0;

    for (const request of queuedRequests) {
      try {
        console.log(`🚀 Processing comprehensive research for ${request.company_name} (${processed + 1}/${queuedRequests.length})`);
        
        // Mark as processing
        await supabase
          .from('perplexity_datamining_vc')
          .update({ 
            processing_status: 'processing',
            processing_started_at: new Date().toISOString()
          })
          .eq('id', request.id);

        // Get additional context from deal
        const { data: dealData } = await supabase
          .from('deals')
          .select(`
            id,
            company_name,
            industry,
            location,
            founding_year,
            website,
            description,
            linkedin_url,
            crunchbase_url
          `)
          .eq('id', request.deal_id)
          .maybeSingle();

        // Build additional context
        const additionalContext = {
          website: dealData?.website || "Not Provided",
          linkedin: dealData?.linkedin_url || "Not Provided",
          crunchbase: dealData?.crunchbase_url || "Not Provided",
          industry: dealData?.industry?.[0] || "Not Provided",
          location: dealData?.location?.[0] || "Not Provided",
          founder: "Not Provided" // Will be enhanced later
        };

        // Call comprehensive research function
        const researchResult = await performComprehensiveResearch(
          request.company_name,
          additionalContext,
          perplexityApiKey
        );

        if (researchResult.success) {
          // Store results and mark as completed
          await supabase
            .from('perplexity_datamining_vc')
            .update({
              processing_status: 'processed',
              perplexity_datamining_vc_json: researchResult.data,
              processing_completed_at: new Date().toISOString(),
              data_quality_score: researchResult.qualityScore || 0
            })
            .eq('id', request.id);

          successful++;
          results.push({
            request_id: request.id,
            company_name: request.company_name,
            success: true,
            quality_score: researchResult.qualityScore
          });
        } else {
          throw new Error(researchResult.error || 'Research failed');
        }

        processed++;
        
        // Small delay to avoid overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        processed++;
        failed++;
        console.error(`❌ Error processing ${request.company_name}:`, error);
        
        // Mark as failed
        await supabase
          .from('perplexity_datamining_vc')
          .update({
            processing_status: 'failed',
            error_message: error.message,
            processing_completed_at: new Date().toISOString()
          })
          .eq('id', request.id);

        results.push({
          request_id: request.id,
          company_name: request.company_name,
          success: false,
          error: error.message
        });
      }
    }

    console.log(`✅ Batch processing complete: ${successful} successful, ${failed} failed`);

    return new Response(JSON.stringify({
      success: true,
      batch_results: {
        total_processed: processed,
        successful: successful,
        failed: failed,
        details: results
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Comprehensive research processor error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      stack: error.stack
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Comprehensive research function using the provided prompt and schema
async function performComprehensiveResearch(companyName: string, additionalContext: any, perplexityApiKey: string) {
  try {
    // Build the messages (SYSTEM/USER) from the template
    const systemContent = `
You are Perplexity, a cautious data search engine and market research analyst. You return only verifiable facts with citations. Never fabricate numbers or entities. If data cannot be verified from credible sources, return null (or an empty array) and add a short reason in the notes field. Respond in pure JSON that strictly matches the provided schema.
`.trim();

    // Pull richer context from additionalContext
    const companyWebsite = additionalContext?.website ?? "Not Provided";
    const companyLinkedIn = additionalContext?.linkedin ?? "Not Provided";
    const companyCrunchbase = additionalContext?.crunchbase ?? "Not Provided";
    const industries = additionalContext?.industry ?? "Not Provided";
    const country = additionalContext?.location ?? "Not Provided";
    const founders = additionalContext?.founder ?? "Not Provided";

    const userContent = `
Research the target: company=${companyName}; website=${companyWebsite}; LinkedIn=${companyLinkedIn}, Crunchbase=${companyCrunchbase}, industry=${industries}; country=${country}; founders=${founders}. Answer the rubric below. For each subcriterion: (1) answer the guiding questions, (2) populate the structured fields, (3) include sources as [{title, url}], (4) set confidence to High/Medium/Low based on source quality and agreement.

General rules:
- Use primary sources where possible (stat filings, regulator data, official releases), then reputable analysts/press.
- Prefer data from the last 24 months; allow older for TAM/SAM/SOM or foundational market sizing.
- Currency: USD unless the source is clearly another currency (then convert and note).
- No markdown; return JSON only.

Rubric & guiding questions to answer:

TEAM & LEADERSHIP
1. Founder Experience — What prior startups and roles are verifiably linked to the founders? Outcomes (IPO, acquisition, shutdown), years active?
2. Domain Expertise — What evidence shows deep, relevant expertise (education, prior roles, publications, patents)?
3. Execution Track Record — Which milestones shipped on time/quality? Any case studies, deployments, or measurable delivery examples?

MARKET OPPORTUNITY
4) Market Size/TAM/SAM/SOM — What is the verifiable size of the total/serviceable/obtainable market? Methodology and year?
5) Market Growth Rate — What CAGR and growth drivers are supported by credible sources?
6) Market Timing — Why now? Adoption/readiness signals, regulatory catalysts, macro drivers?
7) Competitive Landscape — Who are key competitors; how is the target differentiated; any share estimates?

PRODUCT & TECHNOLOGY
8) Product–Market Fit — What hard signals (NPS, retention, expansion, waitlists, case studies) exist?
9) Technology Differentiation — What defensible moats (IP, algorithms, data, integrations)?
10) Scalability — What are known bottlenecks and evidence of scaling (architecture notes, SLAs, volumes)?

BUSINESS TRACTION
11) Revenue Growth — Current ARR/MRR and YoY growth (if disclosed)?
12) Customer Metrics — CAC, LTV, LTV/CAC, churn, NDR, active customers (if disclosed)?
13) Partnership/Validation — Strategic partners, certifications, or third-party validations?

FINANCIAL HEALTH
14) Unit Economics — Gross margin, contribution margin, CAC, LTV, LTV/CAC.
15) Burn Rate/Runway — Monthly burn and runway months (if disclosed).
16) Funding History — Round details, amounts, dates, investors.

STRATEGIC TIMING
17) Market Entry Timing — What triggers make this an opportune entry point?
18) Competitive Timing — What competitor moves open a window (product sunsets, price hikes, regulatory actions)?

TRUST & TRANSPARENCY
19) Corporate Governance — Board composition, committees, auditor, key policies.
20) Stakeholder Relations — Investor updates cadence, customer satisfaction signals, employee sentiment.
21) ESG Compliance — Policies, certifications, and salient risks.

Return only valid JSON according to the schema provided.
`.trim();

    // Define the comprehensive research schema
    const confidenceEnum = { type: "string", enum: ["High", "Medium", "Low"] as const };
    const notesType = { type: ["string", "null"] as const };
    const sourceItem = {
      type: "object",
      properties: { title: { type: "string" }, url: { type: "string" } },
      required: ["title", "url"]
    };
    const sourcesArray = { type: "array", items: sourceItem };

    const section = (dataProps: Record<string, any>) => ({
      type: "object",
      properties: {
        data: { type: "object", properties: dataProps, additionalProperties: false },
        sources: sourcesArray,
        confidence: confidenceEnum,
        notes: notesType
      },
      required: ["data", "sources", "confidence"],
      additionalProperties: false
    });

    const researchSchema = {
      type: "object",
      properties: {
        subject: {
          type: "object",
          properties: {
            company_name: { type: "string" },
            website: { type: ["string", "null"] },
            linkedin: { type: ["string", "null"] },
            crunchbase: { type: ["string", "null"] },
            industries: { type: "array", items: { type: "string" } },
            country: { type: ["string", "null"] },
            founders: { type: "array", items: { type: "string" } }
          },
          required: ["company_name"],
          additionalProperties: false
        },
        team_leadership: {
          type: "object",
          properties: {
            founder_experience: section({
              companies: { type: "array", items: { type: "string" } },
              outcomes: { type: "array", items: { type: "string" } },
              years_active: { type: ["string", "null"] }
            }),
            domain_expertise: section({
              evidence: { type: "array", items: { type: "string" } }
            }),
            execution_track_record: section({
              shipped_milestones: { type: "array", items: { type: "string" } },
              deployments_case_studies: { type: "array", items: { type: "string" } }
            })
          },
          required: ["founder_experience", "domain_expertise", "execution_track_record"],
          additionalProperties: false
        },
        market_opportunity: {
          type: "object",
          properties: {
            market_size: section({
              tam: { type: ["string", "null"] },
              sam: { type: ["string", "null"] },
              som: { type: ["string", "null"] },
              methodology: { type: ["string", "null"] },
              year: { type: ["string", "null"] }
            }),
            market_growth_rate: section({
              cagr: { type: ["string", "null"] },
              growth_drivers: { type: "array", items: { type: "string" } }
            }),
            market_timing: section({
              why_now: { type: ["string", "null"] },
              catalysts: { type: "array", items: { type: "string" } }
            }),
            competitive_landscape: section({
              competitors: { type: "array", items: { type: "string" } },
              differentiation: { type: ["string", "null"] },
              share_estimates: { type: "array", items: { type: "string" } }
            })
          },
          required: ["market_size", "market_growth_rate", "market_timing", "competitive_landscape"],
          additionalProperties: false
        },
        product_technology: {
          type: "object",
          properties: {
            product_market_fit: section({
              signals: { type: "array", items: { type: "string" } }
            }),
            technology_differentiation: section({
              moats: { type: "array", items: { type: "string" } }
            }),
            scalability: section({
              bottlenecks: { type: "array", items: { type: "string" } },
              evidence: { type: "array", items: { type: "string" } }
            })
          },
          required: ["product_market_fit", "technology_differentiation", "scalability"],
          additionalProperties: false
        },
        business_traction: {
          type: "object",
          properties: {
            revenue_growth: section({
              arr_mrr: { type: ["string", "null"] },
              yoy_growth: { type: ["string", "null"] }
            }),
            customer_metrics: section({
              cac: { type: ["string", "null"] },
              ltv: { type: ["string", "null"] },
              ltv_cac: { type: ["string", "null"] },
              churn: { type: ["string", "null"] },
              ndr: { type: ["string", "null"] },
              active_customers: { type: ["string", "null"] }
            }),
            partnerships_validation: section({
              strategic_partners: { type: "array", items: { type: "string" } },
              certifications_validations: { type: "array", items: { type: "string" } }
            })
          },
          required: ["revenue_growth", "customer_metrics", "partnerships_validation"],
          additionalProperties: false
        },
        financial_health: {
          type: "object",
          properties: {
            unit_economics: section({
              gross_margin: { type: ["string", "null"] },
              contribution_margin: { type: ["string", "null"] },
              cac: { type: ["string", "null"] },
              ltv: { type: ["string", "null"] },
              ltv_cac: { type: ["string", "null"] }
            }),
            burn_runway: section({
              monthly_burn: { type: ["string", "null"] },
              runway_months: { type: ["string", "null"] }
            }),
            funding_history: section({
              rounds: { type: "array", items: { type: "string" } }
            })
          },
          required: ["unit_economics", "burn_runway", "funding_history"],
          additionalProperties: false
        },
        strategic_timing: {
          type: "object",
          properties: {
            market_entry_timing: section({
              optimal_entry_rationale: { type: "array", items: { type: "string" } },
              trigger_events: { type: "array", items: { type: "string" } }
            }),
            competitive_timing: section({
              recent_competitor_moves: { type: "array", items: { type: "string" } },
              window_of_opportunity: { type: ["string", "null"] }
            })
          },
          required: ["market_entry_timing", "competitive_timing"],
          additionalProperties: false
        },
        trust_transparency: {
          type: "object",
          properties: {
            corporate_governance: section({
              board_members: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    role: { type: ["string", "null"] },
                    affiliation: { type: ["string", "null"] },
                    url: { type: ["string", "null"] }
                  },
                  required: ["name"],
                  additionalProperties: false
                }
              },
              auditor: { type: ["string", "null"] },
              policies: { type: "array", items: { type: "string" } }
            }),
            stakeholder_relations: section({
              investor_updates_frequency: { type: ["string", "null"] },
              customer_sentiment_summary: { type: ["string", "null"] },
              employee_sentiment_summary: { type: ["string", "null"] }
            }),
            esg_compliance: section({
              policies: { type: "array", items: { type: "string" } },
              certifications: { type: "array", items: { type: "string" } },
              risks: { type: "array", items: { type: "string" } }
            })
          },
          required: ["corporate_governance", "stakeholder_relations", "esg_compliance"],
          additionalProperties: false
        },
        metadata: {
          type: "object",
          properties: {
            last_updated: { type: "string" },
            overall_confidence: confidenceEnum,
            origin: { type: ["string", "null"] }
          },
          required: ["last_updated", "overall_confidence"],
          additionalProperties: false
        }
      },
      required: [
        "subject",
        "team_leadership", 
        "market_opportunity",
        "product_technology",
        "business_traction",
        "financial_health",
        "strategic_timing",
        "trust_transparency",
        "metadata"
      ],
      additionalProperties: false
    } as const;

    console.log('🔍 Calling Perplexity API with comprehensive research rubric...');

    const perplexityResponse = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${perplexityApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [
          { role: 'system', content: systemContent },
          { role: 'user', content: userContent }
        ],
        max_tokens: 4000,
        top_p: 0.9,
        frequency_penalty: 1,
        presence_penalty: 0,
        return_images: false,
        return_related_questions: false,
        search_recency_filter: 'month',
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'VCResearchSchema',
            schema: researchSchema,
            strict: true
          }
        }
      })
    });

    if (!perplexityResponse.ok) {
      const errorText = await perplexityResponse.text();
      console.error('❌ Perplexity API error:', errorText);
      return { success: false, error: 'Perplexity API request failed' };
    }

    const perplexityData = await perplexityResponse.json();
    console.log('✅ Perplexity API response received');

    // Extract and parse the response
    let researchData;
    try {
      const content = perplexityData.choices[0].message.content;
      console.log('📥 Raw Perplexity content received');

      try {
        researchData = JSON.parse(content);
      } catch (parseError) {
        // Fallback: extract JSON from markdown code blocks
        const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
        if (jsonMatch) {
          researchData = JSON.parse(jsonMatch[1]);
        } else {
          throw new Error('No valid JSON found in response');
        }
      }

      console.log('✅ Successfully parsed comprehensive research data');
    } catch (parseError) {
      console.error('❌ Failed to parse Perplexity response:', parseError);
      return { success: false, error: 'Failed to parse Perplexity response' };
    }

    // Calculate quality score
    const qualityScore = calculateResearchQualityScore(researchData);

    return {
      success: true,
      data: researchData,
      qualityScore
    };

  } catch (error) {
    console.error('❌ Error in comprehensive research:', error);
    return { success: false, error: error.message };
  }
}

// Calculate quality score based on data completeness
function calculateResearchQualityScore(data: any): number {
  let score = 0;
  let maxScore = 0;

  // Helper to check section completeness
  const checkSection = (section: any, weight: number) => {
    maxScore += weight;
    if (!section) return;
    
    let sectionScore = 0;
    const subsections = Object.values(section);
    
    subsections.forEach((subsection: any) => {
      if (subsection?.data && typeof subsection.data === 'object') {
        const dataValues = Object.values(subsection.data);
        const nonEmptyValues = dataValues.filter(val => 
          val !== null && val !== undefined && 
          (typeof val === 'string' ? val.trim() !== '' : true) &&
          (Array.isArray(val) ? val.length > 0 : true)
        );
        sectionScore += (nonEmptyValues.length / dataValues.length) * (weight / subsections.length);
      }
    });
    
    score += sectionScore;
  };

  // Weight sections based on importance
  checkSection(data.team_leadership, 20);
  checkSection(data.market_opportunity, 25);
  checkSection(data.product_technology, 20);
  checkSection(data.business_traction, 20);
  checkSection(data.financial_health, 15);

  return Math.round((score / maxScore) * 100);
}