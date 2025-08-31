import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log('🚀 Starting Perplexity founder enrichment post-processor cron job...')

    // Check for records that need post-processing
    const { data: recordsToProcess, error: fetchError } = await supabase
      .from('deal_enrichment_perplexity_founder_export_vc')
      .select('id, deal_id, created_at')
      .in('processing_status', ['raw', 'pending'])
      .not('raw_perplexity_response', 'is', null)
      .order('created_at', { ascending: true })
      .limit(20) // Process in batches to avoid timeout

    if (fetchError) {
      console.error('❌ Error fetching records to process:', fetchError)
      
      // Log the cron activity
      await supabase
        .from('activity_events')
        .insert({
          user_id: '00000000-0000-0000-0000-000000000000',
          fund_id: '00000000-0000-0000-0000-000000000000',
          activity_type: 'system_cron',
          title: 'Perplexity Founder Post-Processor Cron - Error',
          description: `Failed to fetch records for post-processing: ${fetchError.message}`,
          context_data: {
            cron_job: 'perplexity-founder-post-processor',
            error: fetchError.message,
            timestamp: new Date().toISOString()
          },
          priority: 'high',
          is_system_event: true
        })

      return new Response(
        JSON.stringify({ success: false, error: `Failed to fetch records: ${fetchError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!recordsToProcess || recordsToProcess.length === 0) {
      console.log('ℹ️ No records found that need post-processing')
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No records found that need post-processing',
          processedCount: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`📋 Found ${recordsToProcess.length} records that need post-processing`)

    // Call the post-processor function
    const { data: postProcessorResult, error: postProcessorError } = await supabase.functions.invoke(
      'perplexity-founder-post-processor',
      {
        body: {
          // Process all pending records
          forceReprocess: false
        }
      }
    )

    let processedCount = 0
    let errorMessage = ''

    if (postProcessorError) {
      console.error('❌ Post-processor function error:', postProcessorError)
      errorMessage = postProcessorError.message
    } else if (postProcessorResult) {
      console.log('✅ Post-processor completed:', postProcessorResult)
      processedCount = postProcessorResult.processedCount || 0
    }

    // Log the cron activity
    await supabase
      .from('activity_events')
      .insert({
        user_id: '00000000-0000-0000-0000-000000000000',
        fund_id: '00000000-0000-0000-0000-000000000000',
        activity_type: 'system_cron',
        title: 'Perplexity Founder Post-Processor Cron - Completed',
        description: `Processed ${processedCount} founder enrichment records. ${errorMessage ? 'Errors: ' + errorMessage : 'All successful.'}`,
        context_data: {
          cron_job: 'perplexity-founder-post-processor',
          records_found: recordsToProcess.length,
          records_processed: processedCount,
          has_errors: !!errorMessage,
          error_message: errorMessage,
          timestamp: new Date().toISOString()
        },
        priority: errorMessage ? 'high' : 'low',
        is_system_event: true
      })

    console.log(`🏁 Cron job completed. Found: ${recordsToProcess.length}, Processed: ${processedCount}`)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Perplexity founder post-processor cron completed',
        recordsFound: recordsToProcess.length,
        processedCount,
        hasErrors: !!errorMessage,
        errorMessage: errorMessage || undefined
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Cron job error:', error)
    
    // Try to log the error activity
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      const supabase = createClient(supabaseUrl, supabaseServiceKey)
      
      await supabase
        .from('activity_events')
        .insert({
          user_id: '00000000-0000-0000-0000-000000000000',
          fund_id: '00000000-0000-0000-0000-000000000000',
          activity_type: 'system_cron',
          title: 'Perplexity Founder Post-Processor Cron - Critical Error',
          description: `Critical error in cron job: ${error.message}`,
          context_data: {
            cron_job: 'perplexity-founder-post-processor',
            error: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
          },
          priority: 'critical',
          is_system_event: true
        })
    } catch (logError) {
      console.error('❌ Failed to log cron error:', logError)
    }
    
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})