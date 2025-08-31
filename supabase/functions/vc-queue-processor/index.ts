import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('🔄 VC Queue Processor started')
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    })

    // Get all queued VC deals from analysis_queue
    const { data: queueItems, error: queueError } = await supabase
      .from('analysis_queue')
      .select(`
        id,
        deal_id,
        fund_id,
        trigger_reason,
        created_at,
        attempts,
        metadata
      `)
      .eq('status', 'queued')
      .order('created_at', { ascending: true })
      .limit(10) // Process up to 10 deals at a time

    if (queueError) {
      console.error('❌ Error fetching queue items:', queueError)
      return new Response(JSON.stringify({ error: 'Failed to fetch queue items' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (!queueItems || queueItems.length === 0) {
      console.log('✅ No queued VC deals to process')
      return new Response(JSON.stringify({ 
        message: 'No queued items to process',
        processed: 0
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log(`📋 Found ${queueItems.length} queued VC deals to process`)

    let processed = 0
    let failed = 0
    const results = []

    // Process each queued deal
    for (const item of queueItems) {
      try {
        console.log(`🔄 Processing deal ${item.deal_id} (queue ID: ${item.id})`)
        
        // Mark as processing
        await supabase
          .from('analysis_queue')
          .update({ 
            status: 'processing',
            started_at: new Date().toISOString(),
            attempts: item.attempts + 1
          })
          .eq('id', item.id)

        // Call vc-data-aggregator directly
        const { data: aggResult, error: aggError } = await supabase.functions.invoke('vc-data-aggregator', {
          body: { deal_id: item.deal_id }
        })

        if (aggError) {
          console.error(`❌ VC aggregation failed for deal ${item.deal_id}:`, aggError)
          
          // Mark as failed
          await supabase
            .from('analysis_queue')
            .update({ 
              status: 'failed',
              error_message: aggError.message || 'VC aggregation failed',
              completed_at: new Date().toISOString()
            })
            .eq('id', item.id)
          
          failed++
          results.push({
            deal_id: item.deal_id,
            queue_id: item.id,
            status: 'failed',
            error: aggError.message
          })
        } else {
          console.log(`✅ VC aggregation completed for deal ${item.deal_id}`)
          
          // Mark as completed
          await supabase
            .from('analysis_queue')
            .update({ 
              status: 'completed',
              completed_at: new Date().toISOString()
            })
            .eq('id', item.id)
          
          processed++
          results.push({
            deal_id: item.deal_id,
            queue_id: item.id,
            status: 'completed',
            result: aggResult
          })
        }
      } catch (error) {
        console.error(`❌ Unexpected error processing deal ${item.deal_id}:`, error)
        
        // Mark as failed with error details
        await supabase
          .from('analysis_queue')
          .update({ 
            status: 'failed',
            error_message: error.message || 'Unexpected processing error',
            completed_at: new Date().toISOString()
          })
          .eq('id', item.id)
        
        failed++
        results.push({
          deal_id: item.deal_id,
          queue_id: item.id,
          status: 'failed',
          error: error.message
        })
      }
    }

    const summary = {
      total_found: queueItems.length,
      processed: processed,
      failed: failed,
      results: results
    }

    console.log(`🎯 VC Queue Processing Summary:`, summary)

    return new Response(JSON.stringify(summary), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('❌ Fatal error in VC queue processor:', error)
    return new Response(JSON.stringify({ 
      error: 'Fatal processing error',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})