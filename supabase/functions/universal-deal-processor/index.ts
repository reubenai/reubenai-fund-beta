import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DealProcessingRequest {
  dealId?: string;
  dealData?: any;
  source: 'single_upload' | 'batch_csv' | 'ai_sourcing';
  fundId: string;
  options?: {
    skipEnrichment?: boolean;
    skipAnalysis?: boolean;
    priority?: 'low' | 'normal' | 'high';
    metadata?: any;
  };
}

interface ProcessingResult {
  dealId: string;
  enrichmentStatus: 'completed' | 'failed' | 'skipped';
  analysisStatus: 'queued' | 'failed' | 'skipped';
  fieldsCompleted: string[];
  confidence: number;
  source: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { dealId, dealData, source, fundId, options = {} } = await req.json() as DealProcessingRequest
    
    console.log(`🔄 Universal Deal Processor: Processing ${source} deal`, { dealId, fundId })

    let targetDealId = dealId
    let deal: any

    // Step 1: Create or fetch deal
    if (dealId) {
      const { data: existingDeal, error } = await supabase
        .from('deals')
        .select('*')
        .eq('id', dealId)
        .single()
      
      if (error) throw error
      deal = existingDeal
      targetDealId = dealId
    } else if (dealData) {
      const { data: newDeal, error } = await supabase
        .from('deals')
        .insert({
          ...dealData,
          fund_id: fundId,
          status: 'sourced',
          primary_source: source,
          auto_analysis_enabled: true
        })
        .select()
        .single()
      
      if (error) throw error
      deal = newDeal
      targetDealId = newDeal.id
    } else {
      throw new Error('Either dealId or dealData must be provided')
    }

    console.log(`📝 Deal prepared: ${deal.company_name} (${targetDealId})`)

    const result: ProcessingResult = {
      dealId: targetDealId,
      enrichmentStatus: 'skipped',
      analysisStatus: 'skipped',
      fieldsCompleted: [],
      confidence: 0,
      source
    }

    // Step 2: Data completion and enrichment
    if (!options.skipEnrichment) {
      try {
        console.log('🔍 Starting data enrichment...')
        
        // Intelligent field completion
        const completionResult = await completeDataFields(supabase, deal)
        result.fieldsCompleted = completionResult.fieldsCompleted
        result.confidence = completionResult.confidence

        // Company enrichment via Coresignal/AI with LinkedIn and Crunchbase URLs
        if (deal.company_name) {
          console.log('💼 Calling company enrichment engine with enhanced data...')
          
          const enrichmentResponse = await supabase.functions.invoke('company-enrichment-engine', {
            body: {
              dealId: targetDealId,
              companyName: deal.company_name,
              website: deal.website,
              linkedinUrl: deal.linkedin_url, // Pass LinkedIn URL for better matching
              crunchbaseUrl: deal.crunchbase_url, // Pass Crunchbase URL for additional context
              triggerReanalysis: false // We'll handle analysis separately
            }
          })

          if (enrichmentResponse.error) {
            console.error('Company enrichment failed:', enrichmentResponse.error)
            result.enrichmentStatus = 'failed'
          } else {
            console.log('✅ Company enrichment completed with enhanced data sources')
            result.enrichmentStatus = 'completed'
          }
        }

        // Notes intelligence processing
        await processNotesIntelligence(supabase, targetDealId)

      } catch (error) {
        console.error('Enrichment failed:', error)
        result.enrichmentStatus = 'failed'
      }
    }

    // Step 3: Queue comprehensive analysis
    if (!options.skipAnalysis) {
      try {
        console.log('🎯 Queueing comprehensive AI analysis...')
        
        const priority = options.priority || (source === 'ai_sourcing' ? 'high' : 'normal')
        const delay = source === 'batch_csv' ? 30 : 5 // Stagger batch uploads

        const { error: queueError } = await supabase.rpc('queue_deal_analysis', {
          deal_id_param: targetDealId,
          trigger_reason_param: `universal_processor_${source}`,
          priority_param: priority,
          delay_minutes: delay
        })

        if (queueError) throw queueError

        result.analysisStatus = 'queued'
        console.log('✅ Analysis queued successfully')

      } catch (error) {
        console.error('Analysis queueing failed:', error)
        result.analysisStatus = 'failed'
      }
    }

    // Step 4: Log processing activity
    await logProcessingActivity(supabase, targetDealId, fundId, source, result)

    console.log(`🎉 Universal processor completed for ${deal.company_name}`)

    return new Response(
      JSON.stringify({ success: true, result }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Universal Deal Processor Error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Universal deal processing failed'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})

async function completeDataFields(supabase: any, deal: any) {
  const fieldsCompleted: string[] = []
  let confidence = 70

  try {
    // Use LlamaParseAPI for intelligent data extraction if we have documents
    if (deal.company_name && deal.website) {
      const websiteData = await extractFromWebsite(deal.website, deal.company_name)
      
      if (websiteData.location && !deal.location) {
        await supabase
          .from('deals')
          .update({ location: websiteData.location })
          .eq('id', deal.id)
        fieldsCompleted.push('location')
      }

      if (websiteData.founder && !deal.founder) {
        await supabase
          .from('deals')
          .update({ founder: websiteData.founder })
          .eq('id', deal.id)
        fieldsCompleted.push('founder')
      }

      if (websiteData.employee_count && !deal.employee_count) {
        await supabase
          .from('deals')
          .update({ employee_count: websiteData.employee_count })
          .eq('id', deal.id)
        fieldsCompleted.push('employee_count')
      }

      if (websiteData.industry && !deal.industry) {
        await supabase
          .from('deals')
          .update({ industry: websiteData.industry })
          .eq('id', deal.id)
        fieldsCompleted.push('industry')
      }

      confidence = Math.min(95, confidence + fieldsCompleted.length * 5)
    }

  } catch (error) {
    console.error('Data completion failed:', error)
  }

  return { fieldsCompleted, confidence }
}

async function extractFromWebsite(website: string, companyName: string) {
  try {
    // Use Perplexity for intelligent website analysis
    const perplexityResponse = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('PERPLEXITY_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-small-128k-online',
        messages: [
          {
            role: 'system',
            content: 'Extract company information from website. Return JSON with: location, founder, employee_count, industry. Be precise.'
          },
          {
            role: 'user',
            content: `Visit ${website} and extract key information about ${companyName}: location/headquarters, founder/CEO name, approximate employee count, and industry/sector.`
          }
        ],
        temperature: 0.1,
        max_tokens: 500,
        return_images: false
      })
    })

    if (perplexityResponse.ok) {
      const data = await perplexityResponse.json()
      const content = data.choices[0]?.message?.content || '{}'
      
      try {
        return JSON.parse(content)
      } catch {
        // Fallback: extract manually from text
        return parseWebsiteText(content)
      }
    }

  } catch (error) {
    console.error('Website extraction failed:', error)
  }

  return {}
}

function parseWebsiteText(text: string) {
  const result: any = {}
  
  // Simple regex patterns for common data
  const locationMatch = text.match(/(?:location|headquarters|based in|located in)[:\s]+([^,\n]+)/i)
  if (locationMatch) result.location = locationMatch[1].trim()
  
  const founderMatch = text.match(/(?:founder|ceo|chief executive)[:\s]+([^,\n]+)/i)
  if (founderMatch) result.founder = founderMatch[1].trim()
  
  const employeeMatch = text.match(/(\d+)[+\s]*(?:employees|people|team members)/i)
  if (employeeMatch) result.employee_count = parseInt(employeeMatch[1])
  
  return result
}

async function processNotesIntelligence(supabase: any, dealId: string) {
  try {
    console.log('📝 Processing notes intelligence...')
    
    // Check if deal has notes
    const { data: notes, error: notesError } = await supabase
      .from('deal_notes')
      .select('*')
      .eq('deal_id', dealId)
    
    if (notesError || !notes || notes.length === 0) {
      console.log('No notes found for processing')
      return
    }

    // Call notes intelligence processor
    const { error: processingError } = await supabase.functions.invoke('notes-intelligence-processor', {
      body: {
        dealId: dealId,
        processNotes: true
      }
    })

    if (processingError) {
      console.error('Notes intelligence processing failed:', processingError)
    } else {
      console.log('✅ Notes intelligence processed')
    }

  } catch (error) {
    console.error('Notes processing error:', error)
  }
}

async function logProcessingActivity(supabase: any, dealId: string, fundId: string, source: string, result: ProcessingResult) {
  try {
    await supabase
      .from('activity_events')
      .insert({
        deal_id: dealId,
        fund_id: fundId,
        activity_type: 'deal_processed',
        title: `Deal Processed via Universal Pipeline`,
        description: `Deal processed through universal pipeline from ${source}`,
        context_data: {
          source,
          enrichment_status: result.enrichmentStatus,
          analysis_status: result.analysisStatus,
          fields_completed: result.fieldsCompleted,
          confidence: result.confidence,
          processor_version: '1.0'
        }
      })
  } catch (error) {
    console.error('Failed to log activity:', error)
  }
}
