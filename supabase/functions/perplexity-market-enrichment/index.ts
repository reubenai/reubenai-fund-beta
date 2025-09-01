import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MarketEnrichmentRequest {
  dealId: string;
  companyName: string;
  additionalContext?: {
    website?: string;
    linkedin?: string;
    crunchbase?: string;
    primaryIndustries?: string[];
    industry?: string;
    location?: string;
    founders?: string[];
    founder?: string;
  };
}

// Comprehensive VC Research Schema
interface VCResearchResponse {
  subject: {
    company_name: string;
    website?: string;
    linkedin?: string;
    crunchbase?: string;
    industries: string[];
    country?: string;
    founders: string[];
  };
  team_leadership: {
    founder_experience: {
      data: {
        companies: string[];
        outcomes: string[];
        years_active?: string;
      };
      sources: Array<{title: string; url: string}>;
      confidence: 'High' | 'Medium' | 'Low';
      notes?: string;
    };
    domain_expertise: {
      data: {
        evidence: string[];
      };
      sources: Array<{title: string; url: string}>;
      confidence: 'High' | 'Medium' | 'Low';
      notes?: string;
    };
    execution_track_record: {
      data: {
        shipped_milestones: string[];
        deployments_case_studies: string[];
      };
      sources: Array<{title: string; url: string}>;
      confidence: 'High' | 'Medium' | 'Low';
      notes?: string;
    };
  };
  market_opportunity: {
    market_size: {
      data: {
        tam?: string;
        sam?: string;
        som?: string;
        methodology?: string;
        year?: string;
      };
      sources: Array<{title: string; url: string}>;
      confidence: 'High' | 'Medium' | 'Low';
      notes?: string;
    };
    market_growth_rate: {
      data: {
        cagr?: string;
        growth_drivers: string[];
      };
      sources: Array<{title: string; url: string}>;
      confidence: 'High' | 'Medium' | 'Low';
      notes?: string;
    };
    market_timing: {
      data: {
        why_now?: string;
        catalysts: string[];
      };
      sources: Array<{title: string; url: string}>;
      confidence: 'High' | 'Medium' | 'Low';
      notes?: string;
    };
    competitive_landscape: {
      data: {
        competitors: string[];
        differentiation?: string;
        share_estimates: string[];
      };
      sources: Array<{title: string; url: string}>;
      confidence: 'High' | 'Medium' | 'Low';
      notes?: string;
    };
  };
  product_technology: {
    product_market_fit: {
      data: {
        signals: string[];
      };
      sources: Array<{title: string; url: string}>;
      confidence: 'High' | 'Medium' | 'Low';
      notes?: string;
    };
    technology_differentiation: {
      data: {
        moats: string[];
      };
      sources: Array<{title: string; url: string}>;
      confidence: 'High' | 'Medium' | 'Low';
      notes?: string;
    };
    scalability: {
      data: {
        bottlenecks: string[];
        evidence: string[];
      };
      sources: Array<{title: string; url: string}>;
      confidence: 'High' | 'Medium' | 'Low';
      notes?: string;
    };
  };
  business_traction: {
    revenue_growth: {
      data: {
        arr_mrr?: string;
        yoy_growth?: string;
      };
      sources: Array<{title: string; url: string}>;
      confidence: 'High' | 'Medium' | 'Low';
      notes?: string;
    };
    customer_metrics: {
      data: {
        cac?: string;
        ltv?: string;
        ltv_cac?: string;
        churn?: string;
        ndr?: string;
        active_customers?: string;
      };
      sources: Array<{title: string; url: string}>;
      confidence: 'High' | 'Medium' | 'Low';
      notes?: string;
    };
    partnerships_validation: {
      data: {
        strategic_partners: string[];
        certifications_validations: string[];
      };
      sources: Array<{title: string; url: string}>;
      confidence: 'High' | 'Medium' | 'Low';
      notes?: string;
    };
  };
  financial_health: {
    unit_economics: {
      data: {
        gross_margin?: string;
        contribution_margin?: string;
        cac?: string;
        ltv?: string;
        ltv_cac?: string;
      };
      sources: Array<{title: string; url: string}>;
      confidence: 'High' | 'Medium' | 'Low';
      notes?: string;
    };
    burn_runway: {
      data: {
        monthly_burn?: string;
        runway_months?: string;
      };
      sources: Array<{title: string; url: string}>;
      confidence: 'High' | 'Medium' | 'Low';
      notes?: string;
    };
    funding_history: {
      data: {
        rounds: string[];
      };
      sources: Array<{title: string; url: string}>;
      confidence: 'High' | 'Medium' | 'Low';
      notes?: string;
    };
  };
  strategic_timing: {
    market_entry_timing: {
      data: {
        optimal_entry_rationale: string[];
        trigger_events: string[];
      };
      sources: Array<{title: string; url: string}>;
      confidence: 'High' | 'Medium' | 'Low';
      notes?: string;
    };
    competitive_timing: {
      data: {
        recent_competitor_moves: string[];
        window_of_opportunity?: string;
      };
      sources: Array<{title: string; url: string}>;
      confidence: 'High' | 'Medium' | 'Low';
      notes?: string;
    };
  };
  trust_transparency: {
    corporate_governance: {
      data: {
        board_members: Array<{
          name: string;
          role?: string;
          affiliation?: string;
          url?: string;
        }>;
        auditor?: string;
        policies: string[];
      };
      sources: Array<{title: string; url: string}>;
      confidence: 'High' | 'Medium' | 'Low';
      notes?: string;
    };
    stakeholder_relations: {
      data: {
        investor_updates_frequency?: string;
        customer_sentiment_summary?: string;
        employee_sentiment_summary?: string;
      };
      sources: Array<{title: string; url: string}>;
      confidence: 'High' | 'Medium' | 'Low';
      notes?: string;
    };
    esg_compliance: {
      data: {
        policies: string[];
        certifications: string[];
        risks: string[];
      };
      sources: Array<{title: string; url: string}>;
      confidence: 'High' | 'Medium' | 'Low';
      notes?: string;
    };
  };
  metadata: {
    last_updated: string;
    overall_confidence: 'High' | 'Medium' | 'Low';
    origin?: string;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 Perplexity Market Enrichment - Starting request processing');

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { dealId, companyName, additionalContext }: MarketEnrichmentRequest = await req.json();

    console.log(`🔍 Processing comprehensive VC research for: ${companyName}`);

    // Pull richer context from `additionalContext`
    const companyWebsite = additionalContext?.website ?? "Not Provided";
    const companyLinkedIn = additionalContext?.linkedin ?? "Not Provided";
    const companyCrunchbase = additionalContext?.crunchbase ?? "Not Provided";
    const industries = 
      Array.isArray(additionalContext?.primaryIndustries)
        ? additionalContext.primaryIndustries.join(", ")
        : (additionalContext?.industry ?? "Not Provided");
    const country = additionalContext?.location ?? "Not Provided";
    const founders = 
      Array.isArray(additionalContext?.founders)
        ? additionalContext.founders.join(", ")
        : (additionalContext?.founder ?? "Not Provided");

    // Verify this is a venture capital deal
    const { data: dealData, error: dealError } = await supabase
      .from('deals')
      .select(`
        id,
        fund_id,
        funds!deals_fund_id_fkey(fund_type)
      `)
      .eq('id', dealId)
      .single();

    if (dealError || !dealData) {
      console.error('❌ Deal not found:', dealError);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Deal not found' 
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if fund is venture capital
    if (dealData.funds.fund_type !== 'venture_capital') {
      console.log(`🚫 Skipping comprehensive VC research for ${companyName} - Fund type is ${dealData.funds.fund_type}, not venture_capital`);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'VC research only available for venture capital deals',
        data: null 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`✅ Deal ${dealId} confirmed as venture capital - proceeding with comprehensive VC research`);

    // Generate unique snapshot ID
    const snapshotId = `vc_research_${dealId}_${Date.now()}`;
    console.log(`📝 Generated snapshot ID: ${snapshotId}`);

    // ------------------------------
    // Build the messages (SYSTEM/USER) from the comprehensive template
    // ------------------------------
    const systemContent = `
You are Perplexity, a cautious data search engine and market research analyst. You return only verifiable facts with citations. Never fabricate numbers or entities. If data cannot be verified from credible sources, return null (or an empty array) and add a short reason in the notes field. Respond in pure JSON that strictly matches the provided schema.
`.trim();

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

    console.log('🔍 Calling Perplexity API with structured query...');

    const perplexityApiKey = Deno.env.get('PERPLEXITY_API_KEY');
    if (!perplexityApiKey) {
      throw new Error('Perplexity API key not found');
    }

    // Call Perplexity API with comprehensive VC rubric
    const perplexityResponse = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${perplexityApiKey}`,
        'Content-Type': 'application/json',
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
            schema: {
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
                    founder_experience: {
                      type: "object",
                      properties: {
                        data: {
                          type: "object",
                          properties: {
                            companies: { type: "array", items: { type: "string" } },
                            outcomes: { type: "array", items: { type: "string" } },
                            years_active: { type: ["string", "null"] }
                          },
                          additionalProperties: false
                        },
                        sources: { type: "array", items: { 
                          type: "object", 
                          properties: { title: { type: "string" }, url: { type: "string" } },
                          required: ["title", "url"]
                        }},
                        confidence: { type: "string", enum: ["High", "Medium", "Low"] },
                        notes: { type: ["string", "null"] }
                      },
                      required: ["data", "sources", "confidence"],
                      additionalProperties: false
                    },
                    domain_expertise: {
                      type: "object",
                      properties: {
                        data: {
                          type: "object",
                          properties: {
                            evidence: { type: "array", items: { type: "string" } }
                          },
                          additionalProperties: false
                        },
                        sources: { type: "array", items: { 
                          type: "object", 
                          properties: { title: { type: "string" }, url: { type: "string" } },
                          required: ["title", "url"]
                        }},
                        confidence: { type: "string", enum: ["High", "Medium", "Low"] },
                        notes: { type: ["string", "null"] }
                      },
                      required: ["data", "sources", "confidence"],
                      additionalProperties: false
                    },
                    execution_track_record: {
                      type: "object",
                      properties: {
                        data: {
                          type: "object",
                          properties: {
                            shipped_milestones: { type: "array", items: { type: "string" } },
                            deployments_case_studies: { type: "array", items: { type: "string" } }
                          },
                          additionalProperties: false
                        },
                        sources: { type: "array", items: { 
                          type: "object", 
                          properties: { title: { type: "string" }, url: { type: "string" } },
                          required: ["title", "url"]
                        }},
                        confidence: { type: "string", enum: ["High", "Medium", "Low"] },
                        notes: { type: ["string", "null"] }
                      },
                      required: ["data", "sources", "confidence"],
                      additionalProperties: false
                    }
                  },
                  required: ["founder_experience", "domain_expertise", "execution_track_record"],
                  additionalProperties: false
                },
                market_opportunity: {
                  type: "object",
                  properties: {
                    market_size: {
                      type: "object",
                      properties: {
                        data: {
                          type: "object",
                          properties: {
                            tam: { type: ["string", "null"] },
                            sam: { type: ["string", "null"] },
                            som: { type: ["string", "null"] },
                            methodology: { type: ["string", "null"] },
                            year: { type: ["string", "null"] }
                          },
                          additionalProperties: false
                        },
                        sources: { type: "array", items: { 
                          type: "object", 
                          properties: { title: { type: "string" }, url: { type: "string" } },
                          required: ["title", "url"]
                        }},
                        confidence: { type: "string", enum: ["High", "Medium", "Low"] },
                        notes: { type: ["string", "null"] }
                      },
                      required: ["data", "sources", "confidence"],
                      additionalProperties: false
                    },
                    market_growth_rate: {
                      type: "object",
                      properties: {
                        data: {
                          type: "object",
                          properties: {
                            cagr: { type: ["string", "null"] },
                            growth_drivers: { type: "array", items: { type: "string" } }
                          },
                          additionalProperties: false
                        },
                        sources: { type: "array", items: { 
                          type: "object", 
                          properties: { title: { type: "string" }, url: { type: "string" } },
                          required: ["title", "url"]
                        }},
                        confidence: { type: "string", enum: ["High", "Medium", "Low"] },
                        notes: { type: ["string", "null"] }
                      },
                      required: ["data", "sources", "confidence"],
                      additionalProperties: false
                    },
                    market_timing: {
                      type: "object",
                      properties: {
                        data: {
                          type: "object",
                          properties: {
                            why_now: { type: ["string", "null"] },
                            catalysts: { type: "array", items: { type: "string" } }
                          },
                          additionalProperties: false
                        },
                        sources: { type: "array", items: { 
                          type: "object", 
                          properties: { title: { type: "string" }, url: { type: "string" } },
                          required: ["title", "url"]
                        }},
                        confidence: { type: "string", enum: ["High", "Medium", "Low"] },
                        notes: { type: ["string", "null"] }
                      },
                      required: ["data", "sources", "confidence"],
                      additionalProperties: false
                    },
                    competitive_landscape: {
                      type: "object",
                      properties: {
                        data: {
                          type: "object",
                          properties: {
                            competitors: { type: "array", items: { type: "string" } },
                            differentiation: { type: ["string", "null"] },
                            share_estimates: { type: "array", items: { type: "string" } }
                          },
                          additionalProperties: false
                        },
                        sources: { type: "array", items: { 
                          type: "object", 
                          properties: { title: { type: "string" }, url: { type: "string" } },
                          required: ["title", "url"]
                        }},
                        confidence: { type: "string", enum: ["High", "Medium", "Low"] },
                        notes: { type: ["string", "null"] }
                      },
                      required: ["data", "sources", "confidence"],
                      additionalProperties: false
                    }
                  },
                  required: ["market_size", "market_growth_rate", "market_timing", "competitive_landscape"],
                  additionalProperties: false
                },
                product_technology: {
                  type: "object",
                  properties: {
                    product_market_fit: {
                      type: "object",
                      properties: {
                        data: {
                          type: "object",
                          properties: {
                            signals: { type: "array", items: { type: "string" } }
                          },
                          additionalProperties: false
                        },
                        sources: { type: "array", items: { 
                          type: "object", 
                          properties: { title: { type: "string" }, url: { type: "string" } },
                          required: ["title", "url"]
                        }},
                        confidence: { type: "string", enum: ["High", "Medium", "Low"] },
                        notes: { type: ["string", "null"] }
                      },
                      required: ["data", "sources", "confidence"],
                      additionalProperties: false
                    },
                    technology_differentiation: {
                      type: "object",
                      properties: {
                        data: {
                          type: "object",
                          properties: {
                            moats: { type: "array", items: { type: "string" } }
                          },
                          additionalProperties: false
                        },
                        sources: { type: "array", items: { 
                          type: "object", 
                          properties: { title: { type: "string" }, url: { type: "string" } },
                          required: ["title", "url"]
                        }},
                        confidence: { type: "string", enum: ["High", "Medium", "Low"] },
                        notes: { type: ["string", "null"] }
                      },
                      required: ["data", "sources", "confidence"],
                      additionalProperties: false
                    },
                    scalability: {
                      type: "object",
                      properties: {
                        data: {
                          type: "object",
                          properties: {
                            bottlenecks: { type: "array", items: { type: "string" } },
                            evidence: { type: "array", items: { type: "string" } }
                          },
                          additionalProperties: false
                        },
                        sources: { type: "array", items: { 
                          type: "object", 
                          properties: { title: { type: "string" }, url: { type: "string" } },
                          required: ["title", "url"]
                        }},
                        confidence: { type: "string", enum: ["High", "Medium", "Low"] },
                        notes: { type: ["string", "null"] }
                      },
                      required: ["data", "sources", "confidence"],
                      additionalProperties: false
                    }
                  },
                  required: ["product_market_fit", "technology_differentiation", "scalability"],
                  additionalProperties: false
                },
                business_traction: {
                  type: "object",
                  properties: {
                    revenue_growth: {
                      type: "object",
                      properties: {
                        data: {
                          type: "object",
                          properties: {
                            arr_mrr: { type: ["string", "null"] },
                            yoy_growth: { type: ["string", "null"] }
                          },
                          additionalProperties: false
                        },
                        sources: { type: "array", items: { 
                          type: "object", 
                          properties: { title: { type: "string" }, url: { type: "string" } },
                          required: ["title", "url"]
                        }},
                        confidence: { type: "string", enum: ["High", "Medium", "Low"] },
                        notes: { type: ["string", "null"] }
                      },
                      required: ["data", "sources", "confidence"],
                      additionalProperties: false
                    },
                    customer_metrics: {
                      type: "object",
                      properties: {
                        data: {
                          type: "object",
                          properties: {
                            cac: { type: ["string", "null"] },
                            ltv: { type: ["string", "null"] },
                            ltv_cac: { type: ["string", "null"] },
                            churn: { type: ["string", "null"] },
                            ndr: { type: ["string", "null"] },
                            active_customers: { type: ["string", "null"] }
                          },
                          additionalProperties: false
                        },
                        sources: { type: "array", items: { 
                          type: "object", 
                          properties: { title: { type: "string" }, url: { type: "string" } },
                          required: ["title", "url"]
                        }},
                        confidence: { type: "string", enum: ["High", "Medium", "Low"] },
                        notes: { type: ["string", "null"] }
                      },
                      required: ["data", "sources", "confidence"],
                      additionalProperties: false
                    },
                    partnerships_validation: {
                      type: "object",
                      properties: {
                        data: {
                          type: "object",
                          properties: {
                            strategic_partners: { type: "array", items: { type: "string" } },
                            certifications_validations: { type: "array", items: { type: "string" } }
                          },
                          additionalProperties: false
                        },
                        sources: { type: "array", items: { 
                          type: "object", 
                          properties: { title: { type: "string" }, url: { type: "string" } },
                          required: ["title", "url"]
                        }},
                        confidence: { type: "string", enum: ["High", "Medium", "Low"] },
                        notes: { type: ["string", "null"] }
                      },
                      required: ["data", "sources", "confidence"],
                      additionalProperties: false
                    }
                  },
                  required: ["revenue_growth", "customer_metrics", "partnerships_validation"],
                  additionalProperties: false
                },
                financial_health: {
                  type: "object",
                  properties: {
                    unit_economics: {
                      type: "object",
                      properties: {
                        data: {
                          type: "object",
                          properties: {
                            gross_margin: { type: ["string", "null"] },
                            contribution_margin: { type: ["string", "null"] },
                            cac: { type: ["string", "null"] },
                            ltv: { type: ["string", "null"] },
                            ltv_cac: { type: ["string", "null"] }
                          },
                          additionalProperties: false
                        },
                        sources: { type: "array", items: { 
                          type: "object", 
                          properties: { title: { type: "string" }, url: { type: "string" } },
                          required: ["title", "url"]
                        }},
                        confidence: { type: "string", enum: ["High", "Medium", "Low"] },
                        notes: { type: ["string", "null"] }
                      },
                      required: ["data", "sources", "confidence"],
                      additionalProperties: false
                    },
                    burn_runway: {
                      type: "object",
                      properties: {
                        data: {
                          type: "object",
                          properties: {
                            monthly_burn: { type: ["string", "null"] },
                            runway_months: { type: ["string", "null"] }
                          },
                          additionalProperties: false
                        },
                        sources: { type: "array", items: { 
                          type: "object", 
                          properties: { title: { type: "string" }, url: { type: "string" } },
                          required: ["title", "url"]
                        }},
                        confidence: { type: "string", enum: ["High", "Medium", "Low"] },
                        notes: { type: ["string", "null"] }
                      },
                      required: ["data", "sources", "confidence"],
                      additionalProperties: false
                    },
                    funding_history: {
                      type: "object",
                      properties: {
                        data: {
                          type: "object",
                          properties: {
                            rounds: { type: "array", items: { type: "string" } }
                          },
                          additionalProperties: false
                        },
                        sources: { type: "array", items: { 
                          type: "object", 
                          properties: { title: { type: "string" }, url: { type: "string" } },
                          required: ["title", "url"]
                        }},
                        confidence: { type: "string", enum: ["High", "Medium", "Low"] },
                        notes: { type: ["string", "null"] }
                      },
                      required: ["data", "sources", "confidence"],
                      additionalProperties: false
                    }
                  },
                  required: ["unit_economics", "burn_runway", "funding_history"],
                  additionalProperties: false
                },
                strategic_timing: {
                  type: "object",
                  properties: {
                    market_entry_timing: {
                      type: "object",
                      properties: {
                        data: {
                          type: "object",
                          properties: {
                            optimal_entry_rationale: { type: "array", items: { type: "string" } },
                            trigger_events: { type: "array", items: { type: "string" } }
                          },
                          additionalProperties: false
                        },
                        sources: { type: "array", items: { 
                          type: "object", 
                          properties: { title: { type: "string" }, url: { type: "string" } },
                          required: ["title", "url"]
                        }},
                        confidence: { type: "string", enum: ["High", "Medium", "Low"] },
                        notes: { type: ["string", "null"] }
                      },
                      required: ["data", "sources", "confidence"],
                      additionalProperties: false
                    },
                    competitive_timing: {
                      type: "object",
                      properties: {
                        data: {
                          type: "object",
                          properties: {
                            recent_competitor_moves: { type: "array", items: { type: "string" } },
                            window_of_opportunity: { type: ["string", "null"] }
                          },
                          additionalProperties: false
                        },
                        sources: { type: "array", items: { 
                          type: "object", 
                          properties: { title: { type: "string" }, url: { type: "string" } },
                          required: ["title", "url"]
                        }},
                        confidence: { type: "string", enum: ["High", "Medium", "Low"] },
                        notes: { type: ["string", "null"] }
                      },
                      required: ["data", "sources", "confidence"],
                      additionalProperties: false
                    }
                  },
                  required: ["market_entry_timing", "competitive_timing"],
                  additionalProperties: false
                },
                trust_transparency: {
                  type: "object",
                  properties: {
                    corporate_governance: {
                      type: "object",
                      properties: {
                        data: {
                          type: "object",
                          properties: {
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
                          },
                          additionalProperties: false
                        },
                        sources: { type: "array", items: { 
                          type: "object", 
                          properties: { title: { type: "string" }, url: { type: "string" } },
                          required: ["title", "url"]
                        }},
                        confidence: { type: "string", enum: ["High", "Medium", "Low"] },
                        notes: { type: ["string", "null"] }
                      },
                      required: ["data", "sources", "confidence"],
                      additionalProperties: false
                    },
                    stakeholder_relations: {
                      type: "object",
                      properties: {
                        data: {
                          type: "object",
                          properties: {
                            investor_updates_frequency: { type: ["string", "null"] },
                            customer_sentiment_summary: { type: ["string", "null"] },
                            employee_sentiment_summary: { type: ["string", "null"] }
                          },
                          additionalProperties: false
                        },
                        sources: { type: "array", items: { 
                          type: "object", 
                          properties: { title: { type: "string" }, url: { type: "string" } },
                          required: ["title", "url"]
                        }},
                        confidence: { type: "string", enum: ["High", "Medium", "Low"] },
                        notes: { type: ["string", "null"] }
                      },
                      required: ["data", "sources", "confidence"],
                      additionalProperties: false
                    },
                    esg_compliance: {
                      type: "object",
                      properties: {
                        data: {
                          type: "object",
                          properties: {
                            policies: { type: "array", items: { type: "string" } },
                            certifications: { type: "array", items: { type: "string" } },
                            risks: { type: "array", items: { type: "string" } }
                          },
                          additionalProperties: false
                        },
                        sources: { type: "array", items: { 
                          type: "object", 
                          properties: { title: { type: "string" }, url: { type: "string" } },
                          required: ["title", "url"]
                        }},
                        confidence: { type: "string", enum: ["High", "Medium", "Low"] },
                        notes: { type: ["string", "null"] }
                      },
                      required: ["data", "sources", "confidence"],
                      additionalProperties: false
                    }
                  },
                  required: ["corporate_governance", "stakeholder_relations", "esg_compliance"],
                  additionalProperties: false
                },
                metadata: {
                  type: "object",
                  properties: {
                    last_updated: { type: "string" },
                    overall_confidence: { type: "string", enum: ["High", "Medium", "Low"] },
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
            },
            strict: true
          }
        }
      }),
    });

    if (!perplexityResponse.ok) {
      throw new Error(`Perplexity API error: ${perplexityResponse.status}`);
    }

    console.log('✅ Perplexity API response received');

    const perplexityData = await perplexityResponse.json();
    const rawContent = perplexityData.choices[0].message.content;

    console.log(`📥 Raw Perplexity content: ${rawContent}`);

    // Process the comprehensive VC research response
    console.log('🔄 Processing Perplexity VC research response...');
    
    let parsedResponse: VCResearchResponse;
    try {
      // First attempt: direct parsing of content
      parsedResponse = JSON.parse(rawContent);
      console.log('✅ Successfully parsed JSON on first attempt');
    } catch (firstError) {
      console.log('❌ First parse attempt failed, trying to clean JSON...');
      
      try {
        // Second attempt: extract JSON from response and clean it
        const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error('No JSON found in response');
        }
        
        const cleanedContent = jsonMatch[0]
          .replace(/\\n/g, '')              // Remove escaped newlines
          .replace(/\n/g, ' ')              // Replace actual newlines with spaces
          .replace(/\r/g, '')               // Remove carriage returns
          .replace(/\t/g, ' ')              // Replace tabs with spaces
          .replace(/\s+/g, ' ')             // Collapse multiple spaces
          .replace(/,(\s*[}\]])/g, '$1')    // Remove trailing commas
          .trim();
        
        parsedResponse = JSON.parse(cleanedContent);
        console.log('✅ Successfully parsed cleaned JSON');
      } catch (secondError) {
        console.error('❌ Failed to parse JSON response:', secondError);
        console.error('Raw content length:', rawContent.length);
        console.error('Content preview:', rawContent.substring(0, 500));
        
        // Return error response with better details
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Failed to parse VC research data after multiple attempts',
          parsing_error: secondError.message,
          raw_response: rawContent.substring(0, 1000) // Limit to avoid massive logs
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Extract comprehensive data points from structured response
    const vcResearchData = {
      // Team & Leadership
      founder_experience: parsedResponse.team_leadership?.founder_experience?.data?.companies?.join('; ') || null,
      team_composition: parsedResponse.team_leadership?.domain_expertise?.data?.evidence?.join('; ') || null,
      vision_communication: parsedResponse.team_leadership?.execution_track_record?.data?.shipped_milestones?.join('; ') || null,
      
      // Market Opportunity
      competitive_landscape: parsedResponse.market_opportunity?.competitive_landscape?.data?.competitors?.join('; ') || null,
      market_size: parsedResponse.market_opportunity?.market_size?.data?.tam || null,
      market_timing: parsedResponse.market_opportunity?.market_timing?.data?.why_now || null,
      market_validation: parsedResponse.market_opportunity?.competitive_landscape?.data?.differentiation || null,
      
      // Product & Technology
      product_innovation: parsedResponse.product_technology?.product_market_fit?.data?.signals?.join('; ') || null,
      technology_advantage: parsedResponse.product_technology?.technology_differentiation?.data?.moats?.join('; ') || null,
      product_market_fit: parsedResponse.product_technology?.scalability?.data?.evidence?.join('; ') || null,
      
      // Business Traction
      revenue_growth: parsedResponse.business_traction?.revenue_growth?.data?.yoy_growth || null,
      customer_metrics: parsedResponse.business_traction?.customer_metrics?.data?.ltv_cac || null,
      
      // Financial Health
      financial_performance: parsedResponse.financial_health?.unit_economics?.data?.gross_margin || null,
      capital_efficiency: parsedResponse.financial_health?.burn_runway?.data?.runway_months || null,
      financial_planning: parsedResponse.financial_health?.funding_history?.data?.rounds?.join('; ') || null,
      
      // Strategic Timing
      portfolio_synergies: parsedResponse.strategic_timing?.market_entry_timing?.data?.optimal_entry_rationale?.join('; ') || null,
      investment_thesis_alignment: parsedResponse.strategic_timing?.competitive_timing?.data?.window_of_opportunity || null,
      value_creation_potential: parsedResponse.trust_transparency?.stakeholder_relations?.data?.customer_sentiment_summary || null,

      // Legacy fields for backward compatibility
      tam: parsedResponse.market_opportunity?.market_size?.data?.tam || null,
      sam: parsedResponse.market_opportunity?.market_size?.data?.sam || null,
      som: parsedResponse.market_opportunity?.market_size?.data?.som || null,
      cagr: parsedResponse.market_opportunity?.market_growth_rate?.data?.cagr || null,
      growth_drivers: parsedResponse.market_opportunity?.market_growth_rate?.data?.growth_drivers || [],
      key_market_players: parsedResponse.market_opportunity?.competitive_landscape?.data?.competitors || [],
      addressable_customers: parsedResponse.business_traction?.customer_metrics?.data?.active_customers || null,
      whitespace_opportunities: parsedResponse.strategic_timing?.market_entry_timing?.data?.trigger_events || [],
      ltv_cac_ratio: parsedResponse.business_traction?.customer_metrics?.data?.ltv_cac || null,
      cac_trend: parsedResponse.business_traction?.customer_metrics?.data?.cac || null,
      retention_rate: parsedResponse.business_traction?.customer_metrics?.data?.churn || null,
      strategic_advisors: parsedResponse.trust_transparency?.corporate_governance?.data?.board_members?.map(m => m.name) || [],
      investor_network: parsedResponse.financial_health?.funding_history?.data?.rounds || [],
      market_share_distribution: {},
      channel_effectiveness: {},
      partnership_ecosystem: {}
    };

    // Collect comprehensive subcategory sources and confidence
    const subcategorySources = {
      team_leadership: [
        ...(parsedResponse.team_leadership?.founder_experience?.sources || []),
        ...(parsedResponse.team_leadership?.domain_expertise?.sources || []),
        ...(parsedResponse.team_leadership?.execution_track_record?.sources || [])
      ],
      market_opportunity: [
        ...(parsedResponse.market_opportunity?.market_size?.sources || []),
        ...(parsedResponse.market_opportunity?.market_growth_rate?.sources || []),
        ...(parsedResponse.market_opportunity?.market_timing?.sources || []),
        ...(parsedResponse.market_opportunity?.competitive_landscape?.sources || [])
      ],
      product_technology: [
        ...(parsedResponse.product_technology?.product_market_fit?.sources || []),
        ...(parsedResponse.product_technology?.technology_differentiation?.sources || []),
        ...(parsedResponse.product_technology?.scalability?.sources || [])
      ],
      business_traction: [
        ...(parsedResponse.business_traction?.revenue_growth?.sources || []),
        ...(parsedResponse.business_traction?.customer_metrics?.sources || []),
        ...(parsedResponse.business_traction?.partnerships_validation?.sources || [])
      ],
      financial_health: [
        ...(parsedResponse.financial_health?.unit_economics?.sources || []),
        ...(parsedResponse.financial_health?.burn_runway?.sources || []),
        ...(parsedResponse.financial_health?.funding_history?.sources || [])
      ],
      strategic_timing: [
        ...(parsedResponse.strategic_timing?.market_entry_timing?.sources || []),
        ...(parsedResponse.strategic_timing?.competitive_timing?.sources || [])
      ],
      trust_transparency: [
        ...(parsedResponse.trust_transparency?.corporate_governance?.sources || []),
        ...(parsedResponse.trust_transparency?.stakeholder_relations?.sources || []),
        ...(parsedResponse.trust_transparency?.esg_compliance?.sources || [])
      ]
    };

    const subcategoryConfidence = {
      team_leadership: parsedResponse.team_leadership?.founder_experience?.confidence || 'Low',
      market_opportunity: parsedResponse.market_opportunity?.market_size?.confidence || 'Low',
      product_technology: parsedResponse.product_technology?.product_market_fit?.confidence || 'Low',
      business_traction: parsedResponse.business_traction?.revenue_growth?.confidence || 'Low',
      financial_health: parsedResponse.financial_health?.unit_economics?.confidence || 'Low',
      strategic_timing: parsedResponse.strategic_timing?.market_entry_timing?.confidence || 'Low',
      trust_transparency: parsedResponse.trust_transparency?.corporate_governance?.confidence || 'Low'
    };

    // Calculate overall data quality score
    const totalSources = Object.values(subcategorySources).flat().length;
    const highConfidenceCount = Object.values(subcategoryConfidence).filter(c => c === 'High').length;
    const dataQualityScore = Math.min(100, (totalSources * 10) + (highConfidenceCount * 15));

    console.log('💾 Inserting comprehensive VC research data into database...');

    // Insert into database with comprehensive data
    const { error: insertError } = await supabase
      .from('deal_enrichment_perplexity_market_export_vc')
      .insert({
        deal_id: dealId,
        snapshot_id: snapshotId,
        company_name: companyName,
        primary_industry: industries,
        location: country,
        ...vcResearchData,
        subcategory_sources: subcategorySources,
        subcategory_confidence: subcategoryConfidence,
        raw_perplexity_response: {
          query: userContent,
          response: rawContent,
          parsed_data: parsedResponse,
          api_metadata: {
            model: 'sonar',
            timestamp: new Date().toISOString(),
            sources_count: totalSources
          }
        },
        processing_status: 'completed',
        data_quality_score: dataQualityScore,
        confidence_level: highConfidenceCount >= 3 ? 'High' : highConfidenceCount >= 2 ? 'Medium' : 'Low',
        processed_at: new Date().toISOString()
      });

    if (insertError) {
      console.error('❌ Database insertion failed:', insertError);
      throw insertError;
    }

    console.log('✅ Processed market data inserted successfully');

    // Build and update JSON column
    console.log('📊 Building comprehensive VC research JSON structure...');
    const vcResearchJSON = await buildVCResearchJSON(supabase, dealId, vcResearchData, subcategorySources, subcategoryConfidence);
    
    console.log('💾 Updating JSON column...');
    const { error: jsonUpdateError } = await supabase
      .from('deal_enrichment_perplexity_market_export_vc')
      .update({ 
        deal_enrichment_perplexity_market_export_vc_json: vcResearchJSON
      })
      .eq('deal_id', dealId)
      .eq('snapshot_id', snapshotId);

    if (jsonUpdateError) {
      console.error('⚠️ Failed to update JSON column:', jsonUpdateError);
      // Continue execution - don't fail the entire process for JSON update issues
    } else {
      console.log('✅ JSON column updated successfully');
    }

    // Update deal_analysis_datapoints_vc table with comprehensive VC research data
    console.log('🎯 Updating deal_analysis_datapoints_vc with comprehensive VC research data...');
    try {
      await updateDealAnalysisDatapointsVCWithVCResearch(supabase, dealId, vcResearchData, parsedResponse);
      console.log('✅ Successfully updated deal_analysis_datapoints_vc with comprehensive VC research data');
    } catch (datapointsError) {
      console.error('❌ Failed to update deal_analysis_datapoints_vc with VC research data:', datapointsError);
      // Don't fail the entire process, just log the error
    }

    const result = {
      success: true,
      data: {
        ...vcResearchData,
        subcategory_sources: subcategorySources,
        subcategory_confidence: subcategoryConfidence,
        data_quality_score: dataQualityScore,
        confidence_level: highConfidenceCount >= 3 ? 'High' : highConfidenceCount >= 2 ? 'Medium' : 'Low'
      },
      snapshot_id: snapshotId,
      data_quality_score: dataQualityScore
    };

    console.log('✅ Comprehensive VC research enrichment completed successfully');

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Error in perplexity-market-enrichment function:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Helper function to build comprehensive VC Research JSON structure
async function buildVCResearchJSON(supabase: any, dealId: string, vcResearchData: any, subcategorySources: any, subcategoryConfidence: any) {
  try {
    console.log('🔧 Building comprehensive VC research JSON structure...');
    
    // Collect all sources for embedding
    const allSources = [
      ...(subcategorySources.team_leadership || []),
      ...(subcategorySources.market_opportunity || []),
      ...(subcategorySources.product_technology || []),
      ...(subcategorySources.business_traction || []),
      ...(subcategorySources.financial_health || []),
      ...(subcategorySources.strategic_timing || []),
      ...(subcategorySources.trust_transparency || [])
    ];

    return {
      // Team & Leadership
      "Founder Experience": vcResearchData.founder_experience || null,
      "Team Composition": vcResearchData.team_composition || null,
      "Vision Communication": vcResearchData.vision_communication || null,
      
      // Market Opportunity
      "Market Size": vcResearchData.market_size || null,
      "Market Timing": vcResearchData.market_timing || null,
      "Competitive Landscape": vcResearchData.competitive_landscape || null,
      "Market Validation": vcResearchData.market_validation || null,
      
      // Product & Technology
      "Product Innovation": vcResearchData.product_innovation || null,
      "Technology Advantage": vcResearchData.technology_advantage || null,
      "Product Market Fit": vcResearchData.product_market_fit || null,
      
      // Business Traction
      "Revenue Growth": vcResearchData.revenue_growth || null,
      "Customer Metrics": vcResearchData.customer_metrics || null,
      
      // Financial Health
      "Financial Performance": vcResearchData.financial_performance || null,
      "Capital Efficiency": vcResearchData.capital_efficiency || null,
      "Financial Planning": vcResearchData.financial_planning || null,
      
      // Strategic Timing
      "Portfolio Synergies": vcResearchData.portfolio_synergies || null,
      "Investment Thesis Alignment": vcResearchData.investment_thesis_alignment || null,
      "Value Creation Potential": vcResearchData.value_creation_potential || null,
      
      // Legacy compatibility fields
      "TAM": vcResearchData.tam || null,
      "SAM": vcResearchData.sam || null,
      "SOM": vcResearchData.som || null,
      "CAGR": vcResearchData.cagr || null,
      "Growth Drivers": vcResearchData.growth_drivers || [],
      "Key Market Players": vcResearchData.key_market_players || [],
      
      // Sources by category
      "Team Sources": subcategorySources.team_leadership || [],
      "Market Sources": subcategorySources.market_opportunity || [],
      "Product Sources": subcategorySources.product_technology || [],
      "Traction Sources": subcategorySources.business_traction || [],
      "Financial Sources": subcategorySources.financial_health || [],
      "Strategic Sources": subcategorySources.strategic_timing || [],
      "Governance Sources": subcategorySources.trust_transparency || [],
      
      // Metadata
      "metadata": {
        "source": "perplexity_api_comprehensive",
        "version": "2.0", 
        "last_updated": new Date().toISOString(),
        "overall_confidence": subcategoryConfidence.market_opportunity || "Medium",
        "data_completeness_percentage": Math.min(95, allSources.length * 5 + 60)
      }
    };

  } catch (error) {
    console.error('❌ Error building VC research JSON:', error);
    return {
      error: "Failed to build VC research JSON structure",
      timestamp: new Date().toISOString()
    };
  }
}

// Helper function to update deal_analysis_datapoints_vc table with comprehensive VC research data
async function updateDealAnalysisDatapointsVCWithVCResearch(supabase: any, dealId: string, vcResearchData: any, parsedResponse: any) {
  console.log('📋 Mapping comprehensive VC research data to deal_analysis_datapoints_vc...');

  // First, get deal and fund information
  const { data: dealData, error: dealError } = await supabase
    .from('deals')
    .select(`
      id,
      fund_id,
      funds!deals_fund_id_fkey(
        id,
        organization_id
      )
    `)
    .eq('id', dealId)
    .single();

  if (dealError) {
    throw new Error(`Failed to fetch deal data: ${dealError.message}`);
  }

  // Prepare the comprehensive mapped data for all 18 new columns
  const vcMappedData = {
    deal_id: dealId,
    fund_id: dealData.fund_id,
    organization_id: dealData.funds.organization_id,
    
    // Map all 18 comprehensive VC research fields
    founder_experience: vcResearchData.founder_experience,
    team_composition: vcResearchData.team_composition,
    vision_communication: vcResearchData.vision_communication,
    competitive_landscape: vcResearchData.competitive_landscape,
    product_innovation: vcResearchData.product_innovation,
    technology_advantage: vcResearchData.technology_advantage,
    product_market_fit: vcResearchData.product_market_fit,
    revenue_growth: vcResearchData.revenue_growth,
    customer_metrics: vcResearchData.customer_metrics,
    market_validation: vcResearchData.market_validation,
    financial_performance: vcResearchData.financial_performance,
    capital_efficiency: vcResearchData.capital_efficiency,
    financial_planning: vcResearchData.financial_planning,
    portfolio_synergies: vcResearchData.portfolio_synergies,
    investment_thesis_alignment: vcResearchData.investment_thesis_alignment,
    value_creation_potential: vcResearchData.value_creation_potential,
    
    // Source tracking and metadata
    updated_at: new Date().toISOString()
  };

  // Calculate comprehensive data completeness score
  let vcCompletenessScore = 0;
  const vcFields = Object.keys(vcMappedData).filter(key => 
    key !== 'deal_id' && key !== 'fund_id' && key !== 'organization_id' && key !== 'updated_at'
  );

  vcFields.forEach(field => {
    const value = vcMappedData[field as keyof typeof vcMappedData];
    if (value !== null && value !== undefined && value !== '') {
      vcCompletenessScore += 6; // Each field contributes 6% (16 fields = 96%)
    }
  });

  // Check if record exists
  const { data: existingRecord } = await supabase
    .from('deal_analysis_datapoints_vc')
    .select('id, source_engines, data_completeness_score')
    .eq('deal_id', dealId)
    .maybeSingle();

  if (existingRecord) {
    // Update existing record
    const existingEngines = existingRecord.source_engines || [];
    const updatedEngines = [...new Set([...existingEngines, 'perplexity_vc_comprehensive'])];
    const updatedCompletenessScore = (existingRecord.data_completeness_score || 0) + vcCompletenessScore;
    
    const updateData = {
      ...vcMappedData,
      source_engines: updatedEngines,
      data_completeness_score: Math.min(updatedCompletenessScore, 100)
    };

    const { error: updateError } = await supabase
      .from('deal_analysis_datapoints_vc')
      .update(updateData)
      .eq('deal_id', dealId);

    if (updateError) {
      throw new Error(`Failed to update deal_analysis_datapoints_vc: ${updateError.message}`);
    }

    console.log('✅ Updated existing record with comprehensive VC research data');
  } else {
    // Insert new record
    const insertData = {
      ...vcMappedData,
      source_engines: ['perplexity_vc_comprehensive'],
      data_completeness_score: vcCompletenessScore
    };

    const { error: insertError } = await supabase
      .from('deal_analysis_datapoints_vc')
      .insert(insertData);

    if (insertError) {
      throw new Error(`Failed to insert VC research data: ${insertError.message}`);
    }

    console.log('✅ Inserted new record with comprehensive VC research data');
  }

  console.log(`📊 Mapped ${vcFields.length} VC research fields with ${vcCompletenessScore}% data completeness contribution`);
}