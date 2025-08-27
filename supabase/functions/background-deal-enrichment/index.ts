import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface BackgroundEnrichmentRequest {
  dealId: string;
  fundId: string;
  linkedinUrl?: string;
  crunchbaseUrl?: string;
  founderName?: string;
  companyName: string;
  website?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  console.log('🚀 Background Deal Enrichment Function Called')

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('✅ Supabase client initialized')

    const requestBody = await req.json() as BackgroundEnrichmentRequest
    console.log('📥 Request received:', {
      dealId: requestBody.dealId,
      companyName: requestBody.companyName,
      hasLinkedinUrl: !!requestBody.linkedinUrl,
      hasCrunchbaseUrl: !!requestBody.crunchbaseUrl,
      hasFounderName: !!requestBody.founderName
    })

    const { 
      dealId, 
      fundId, 
      linkedinUrl, 
      crunchbaseUrl, 
      founderName,
      companyName,
      website
    } = requestBody

    console.log(`🚀 Background Deal Enrichment: Starting parallel enrichment for ${companyName} (${dealId})`)

    // Start all enrichment processes in parallel using background tasks
    const enrichmentPromises: Promise<any>[] = []

    // 1. LinkedIn Company Enrichment (if LinkedIn URL exists)
    if (linkedinUrl) {
      const linkedinEnrichment = async () => {
        try {
          console.log(`🔗 Starting LinkedIn company enrichment for ${companyName}`)
          const { data, error } = await supabase.functions.invoke('brightdata-linkedin-enrichment', {
            body: {
              companyName: companyName.toLowerCase(),
              linkedinUrl: linkedinUrl,
              dealId: dealId
            }
          })

          if (error) {
            console.error('❌ LinkedIn company enrichment failed:', error)
            return { type: 'linkedin_company', success: false, error }
          } else {
            console.log('✅ LinkedIn company enrichment completed')
            return { type: 'linkedin_company', success: true, data }
          }
        } catch (error) {
          console.error('💥 LinkedIn company enrichment error:', error)
          return { type: 'linkedin_company', success: false, error: error.message }
        }
      }
      enrichmentPromises.push(linkedinEnrichment())
    } else {
      console.log('⚠️ Skipping LinkedIn company enrichment - no URL provided')
    }

    // 2. Crunchbase Enrichment (if Crunchbase URL exists)
    if (crunchbaseUrl) {
      const crunchbaseEnrichment = async () => {
        try {
          console.log(`🏢 Starting Crunchbase enrichment for ${companyName}`)
          const { data, error } = await supabase.functions.invoke('company-enrichment-engine', {
            body: {
              dealId: dealId,
              companyName: companyName,
              website: website,
              linkedinUrl: linkedinUrl,
              crunchbaseUrl: crunchbaseUrl,
              triggerReanalysis: false,
              forceCrunchbase: true // Force Crunchbase enrichment
            }
          })

          if (error) {
            console.error('❌ Crunchbase enrichment failed:', error)
            return { type: 'crunchbase', success: false, error }
          } else {
            console.log('✅ Crunchbase enrichment completed')
            return { type: 'crunchbase', success: true, data }
          }
        } catch (error) {
          console.error('💥 Crunchbase enrichment error:', error)
          return { type: 'crunchbase', success: false, error: error.message }
        }
      }
      enrichmentPromises.push(crunchbaseEnrichment())
    } else {
      console.log('⚠️ Skipping Crunchbase enrichment - no URL provided')
    }

    // 3. LinkedIn Profile Enrichment (if founder name exists)
    if (founderName) {
      const profileEnrichment = async () => {
        try {
          console.log(`👤 Starting LinkedIn profile enrichment for ${founderName}`)
          const { data, error } = await supabase.functions.invoke('brightdata-linkedin-profile-enrichment', {
            body: {
              profileName: founderName,
              dealId: dealId,
              companyName: companyName
            }
          })

          if (error) {
            console.error('❌ LinkedIn profile enrichment failed:', error)
            return { type: 'linkedin_profile', success: false, error }
          } else {
            console.log('✅ LinkedIn profile enrichment completed')
            return { type: 'linkedin_profile', success: true, data }
          }
        } catch (error) {
          console.error('💥 LinkedIn profile enrichment error:', error)
          return { type: 'linkedin_profile', success: false, error: error.message }
        }
      }
      enrichmentPromises.push(profileEnrichment())
    } else {
      console.log('⚠️ Skipping LinkedIn profile enrichment - no founder name provided')
    }

    console.log(`📊 Total enrichment processes to run: ${enrichmentPromises.length}`)

    // Execute background tasks without blocking response
    if (enrichmentPromises.length > 0) {
      EdgeRuntime.waitUntil(
        (async () => {
          try {
            console.log(`⏳ Running ${enrichmentPromises.length} enrichment processes in parallel...`)
            const results = await Promise.allSettled(enrichmentPromises)
            
            // Log results
            const summary = {
              total: results.length,
              successful: 0,
              failed: 0,
              details: [] as any[]
            }

            results.forEach((result, index) => {
              if (result.status === 'fulfilled') {
                if (result.value.success) {
                  summary.successful++
                } else {
                  summary.failed++
                }
                summary.details.push(result.value)
              } else {
                summary.failed++
                summary.details.push({ 
                  type: 'unknown', 
                  success: false, 
                  error: result.reason 
                })
              }
            })

            console.log('🎉 Background enrichment summary:', summary)

            // Log activity
            await supabase
              .from('activity_events')
              .insert({
                deal_id: dealId,
                fund_id: fundId,
                activity_type: 'enrichment_completed',
                title: 'Background Enrichment Completed',
                description: `Parallel enrichment completed: ${summary.successful}/${summary.total} successful`,
                context_data: {
                  enrichment_summary: summary,
                  processes_run: enrichmentPromises.length,
                  deal_name: companyName
                }
              })

          } catch (error) {
            console.error('💥 Background enrichment process failed:', error)
            
            // Log failure
            try {
              await supabase
                .from('activity_events')
                .insert({
                  deal_id: dealId,
                  fund_id: fundId,
                  activity_type: 'enrichment_failed',
                  title: 'Background Enrichment Failed',
                  description: 'Parallel enrichment process encountered errors',
                  context_data: {
                    error: error.message || 'Unknown error',
                    deal_name: companyName
                  }
                })
            } catch (logError) {
              console.error('Failed to log enrichment failure:', logError)
            }
          }
        })()
      )
    } else {
      console.log('⚠️ No enrichment processes to run - no URLs or data provided')
    }

    // Return immediate response
    const response = {
      success: true,
      message: 'Background enrichment started successfully',
      dealId: dealId,
      processesStarted: enrichmentPromises.length,
      processes: {
        linkedin_company: !!linkedinUrl,
        crunchbase: !!crunchbaseUrl,
        linkedin_profile: !!founderName
      },
      timestamp: new Date().toISOString()
    }

    console.log(`✅ Background enrichment initiated for ${companyName}:`, response)

    return new Response(
      JSON.stringify(response),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('💥 Background Deal Enrichment Error:', error)
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        details: 'Background deal enrichment failed',
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})