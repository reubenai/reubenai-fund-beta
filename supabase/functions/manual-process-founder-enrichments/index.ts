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

    console.log('🚀 Starting manual processing of all pending founder enrichments...')

    // Get count of pending records first
    const { count: pendingCount, error: countError } = await supabase
      .from('deal_enrichment_perplexity_founder_export_vc')
      .select('id', { count: 'exact', head: true })
      .in('processing_status', ['raw', 'pending'])
      .not('raw_perplexity_response', 'is', null)

    if (countError) {
      console.error('❌ Error counting pending records:', countError)
      return new Response(
        JSON.stringify({ success: false, error: `Failed to count pending records: ${countError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`📊 Found ${pendingCount} total pending records to process`)

    if (pendingCount === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No pending records found to process',
          totalRecords: 0,
          processedCount: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Process in batches to avoid timeout
    const batchSize = 25
    let totalProcessed = 0
    let totalErrors = 0
    const allErrors: string[] = []

    for (let offset = 0; offset < pendingCount; offset += batchSize) {
      console.log(`🔄 Processing batch ${Math.floor(offset/batchSize) + 1}/${Math.ceil(pendingCount/batchSize)}...`)

      // Call the post-processor for this batch
      const { data: batchResult, error: batchError } = await supabase.functions.invoke(
        'perplexity-founder-post-processor',
        {
          body: {
            forceReprocess: false // Only process pending records
          }
        }
      )

      if (batchError) {
        console.error(`❌ Error processing batch ${Math.floor(offset/batchSize) + 1}:`, batchError)
        totalErrors++
        allErrors.push(`Batch ${Math.floor(offset/batchSize) + 1}: ${batchError.message}`)
        continue
      }

      if (batchResult) {
        console.log(`✅ Batch ${Math.floor(offset/batchSize) + 1} completed:`, batchResult)
        totalProcessed += batchResult.processedCount || 0
        if (batchResult.errors) {
          allErrors.push(...batchResult.errors)
        }
      }

      // If no more records were processed, break
      if (!batchResult?.processedCount || batchResult.processedCount === 0) {
        console.log('ℹ️ No more records to process, finishing...')
        break
      }

      // Small delay between batches to prevent overwhelming the system
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    // Log completion activity
    await supabase
      .from('activity_events')
      .insert({
        user_id: '00000000-0000-0000-0000-000000000000',
        fund_id: '00000000-0000-0000-0000-000000000000',
        activity_type: 'system_manual',
        title: 'Manual Founder Enrichment Processing Completed',
        description: `Manually processed ${totalProcessed} out of ${pendingCount} pending founder enrichment records. ${totalErrors > 0 ? `Encountered ${totalErrors} batch errors.` : 'All batches successful.'}`,
        context_data: {
          operation: 'manual_process_founder_enrichments',
          total_pending: pendingCount,
          total_processed: totalProcessed,
          total_errors: totalErrors,
          batch_size: batchSize,
          has_errors: allErrors.length > 0,
          timestamp: new Date().toISOString()
        },
        priority: totalErrors > 0 ? 'high' : 'medium',
        is_system_event: true
      })

    console.log(`🏁 Manual processing completed. Total processed: ${totalProcessed}/${pendingCount}, Errors: ${totalErrors}`)

    return new Response(
      JSON.stringify({
        success: true,
        message: `Manual processing completed`,
        totalRecords: pendingCount,
        processedCount: totalProcessed,
        errorCount: totalErrors,
        errors: allErrors.length > 0 ? allErrors.slice(0, 10) : undefined, // Limit error output
        batchSize
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Manual processing error:', error)
    
    // Try to log the error
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      const supabase = createClient(supabaseUrl, supabaseServiceKey)
      
      await supabase
        .from('activity_events')
        .insert({
          user_id: '00000000-0000-0000-0000-000000000000',
          fund_id: '00000000-0000-0000-0000-000000000000',
          activity_type: 'system_manual',
          title: 'Manual Founder Enrichment Processing Failed',
          description: `Critical error during manual processing: ${error.message}`,
          context_data: {
            operation: 'manual_process_founder_enrichments',
            error: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
          },
          priority: 'critical',
          is_system_event: true
        })
    } catch (logError) {
      console.error('❌ Failed to log manual processing error:', logError)
    }
    
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})