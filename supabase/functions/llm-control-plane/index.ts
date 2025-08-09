import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface LLMControlRequest {
  model_id: string
  model_version: string
  temperature: number
  top_p: number
  prompt: string
  content: string
  deal_id?: string
  fund_id?: string
  agent_name: string
  execution_id: string
  provider?: string
}

interface LLMControlResponse {
  success: boolean
  response?: any
  cache_hit: boolean
  retry_count: number
  degradation_mode: boolean
  degradation_banner?: string
  cost_info: {
    current_cost: number
    remaining_budget: number
  }
}

// Cost caps as specified
const COST_CAPS = {
  per_deal: 25.00,     // USD 25.00 per deal
  per_minute: 100.00   // USD 100.00 per minute
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const {
      model_id,
      model_version,
      temperature,
      top_p,
      prompt,
      content,
      deal_id,
      fund_id,
      agent_name,
      execution_id,
      provider = 'openai'
    } = await req.json() as LLMControlRequest

    console.log(`🤖 LLM Control Plane: ${provider}:${model_id} for ${agent_name}`)

    // Generate cache key as specified: (model_id, model_version, temperature, top_p, prompt_hash, content_hash)
    const prompt_hash = await hashString(prompt)
    const content_hash = await hashString(content)
    const cache_key = `${model_id}:${model_version}:${temperature}:${top_p}:${prompt_hash}:${content_hash}`

    console.log(`🔑 Cache key: ${cache_key.substring(0, 50)}...`)

    // Check cache first (TTL = 24h)
    const cacheResult = await checkCache(supabase, cache_key)
    if (cacheResult.hit) {
      console.log('✅ Cache hit - returning cached response')
      return new Response(JSON.stringify({
        success: true,
        response: cacheResult.data,
        cache_hit: true,
        retry_count: 0,
        degradation_mode: false,
        cost_info: {
          current_cost: 0, // No cost for cache hit
          remaining_budget: COST_CAPS.per_deal
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Check cost caps before making LLM call
    const costCheck = await checkCostCaps(supabase, deal_id, fund_id)
    if (costCheck.exceed_caps) {
      // Set status="draft", degradation_mode="essential_only", emit UI banner
      if (deal_id) {
        await supabase
          .from('deals')
          .update({ 
            analysis_queue_status: 'draft'
          })
          .eq('id', deal_id)
      }

      console.log('💰 Cost caps exceeded - entering degradation mode')

      return new Response(JSON.stringify({
        success: false,
        cache_hit: false,
        retry_count: 0,
        degradation_mode: true,
        degradation_banner: `Cost limit exceeded. Analysis limited to essential functions only. Budget: $${costCheck.current_cost.toFixed(2)}/$${COST_CAPS.per_deal}`,
        cost_info: {
          current_cost: costCheck.current_cost,
          remaining_budget: Math.max(0, COST_CAPS.per_deal - costCheck.current_cost)
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Implement retry logic: max 3 retries, exponential backoff, jitter
    let retry_count = 0
    let response = null
    let success = false

    while (retry_count < 3 && !success) {
      try {
        // Check per-provider & per-model rate limits
        const rateLimitCheck = await checkRateLimits(supabase, provider, model_id)
        if (rateLimitCheck.limited) {
          console.log(`⏱️ Rate limited for ${provider}:${model_id} - bucket: ${rateLimitCheck.bucket}`)
          
          // Log bucket hit to ops dashboard
          await logRateLimitHit(supabase, provider, model_id, rateLimitCheck.bucket)
          
          // Apply exponential backoff with jitter
          const backoff = Math.pow(2, retry_count) * 1000 + Math.random() * 1000
          await new Promise(resolve => setTimeout(resolve, backoff))
          retry_count++
          continue
        }

        // Make LLM call (simplified for this implementation)
        response = await makeLLMCall(model_id, prompt, content, temperature, top_p)
        success = true

        // Cache the response (TTL = 24h)
        await cacheResponse(supabase, cache_key, response)

        // Track cost
        const estimated_cost = estimateCost(model_id, prompt, content, response)
        await trackCost(supabase, deal_id, fund_id, execution_id, estimated_cost, model_id)

      } catch (error) {
        console.error(`❌ LLM call failed (attempt ${retry_count + 1}):`, error)
        
        if (error.message.includes('429') || error.message.includes('rate limit')) {
          // Apply exponential backoff with jitter for 429 errors
          const backoff = Math.pow(2, retry_count) * 1000 + Math.random() * 1000
          console.log(`⏰ Retrying in ${backoff}ms...`)
          await new Promise(resolve => setTimeout(resolve, backoff))
          retry_count++
        } else {
          // Non-retryable error
          break
        }
      }
    }

    if (!success) {
      return new Response(JSON.stringify({
        success: false,
        cache_hit: false,
        retry_count,
        degradation_mode: false,
        error: 'LLM call failed after max retries',
        cost_info: {
          current_cost: costCheck.current_cost,
          remaining_budget: Math.max(0, COST_CAPS.per_deal - costCheck.current_cost)
        }
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({
      success: true,
      response,
      cache_hit: false,
      retry_count,
      degradation_mode: false,
      cost_info: {
        current_cost: costCheck.current_cost + estimateCost(model_id, prompt, content, response),
        remaining_budget: Math.max(0, COST_CAPS.per_deal - costCheck.current_cost)
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('LLM Control Plane error:', error)
    return new Response(JSON.stringify({
      success: false,
      cache_hit: false,
      retry_count: 0,
      degradation_mode: false,
      error: error.message,
      cost_info: {
        current_cost: 0,
        remaining_budget: COST_CAPS.per_deal
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

async function hashString(str: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(str)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

async function checkCache(supabase: any, cache_key: string): Promise<{ hit: boolean; data?: any }> {
  try {
    const { data, error } = await supabase
      .from('llm_cache')
      .select('response_data, created_at')
      .eq('cache_key', cache_key)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // 24h TTL
      .single()

    if (error || !data) {
      return { hit: false }
    }

    return { hit: true, data: data.response_data }
  } catch {
    return { hit: false }
  }
}

async function cacheResponse(supabase: any, cache_key: string, response: any): Promise<void> {
  try {
    await supabase
      .from('llm_cache')
      .upsert({
        cache_key,
        response_data: response,
        created_at: new Date().toISOString()
      })
  } catch (error) {
    console.warn('Failed to cache response:', error)
  }
}

async function checkCostCaps(supabase: any, deal_id?: string, fund_id?: string): Promise<{ exceed_caps: boolean; current_cost: number }> {
  if (!deal_id) {
    return { exceed_caps: false, current_cost: 0 }
  }

  try {
    const { data, error } = await supabase
      .from('analysis_cost_tracking')
      .select('total_cost')
      .eq('deal_id', deal_id)

    if (error || !data) {
      return { exceed_caps: false, current_cost: 0 }
    }

    const current_cost = data.reduce((sum: number, item: any) => sum + (item.total_cost || 0), 0)
    
    return {
      exceed_caps: current_cost >= COST_CAPS.per_deal,
      current_cost
    }
  } catch {
    return { exceed_caps: false, current_cost: 0 }
  }
}

async function checkRateLimits(supabase: any, provider: string, model_id: string): Promise<{ limited: boolean; bucket: string }> {
  const bucket = `${provider}:${model_id}`
  
  try {
    // Simple rate limit check - would be more sophisticated in production
    const { data, error } = await supabase
      .from('rate_limit_buckets')
      .select('requests_count, last_reset')
      .eq('bucket_id', bucket)
      .single()

    if (error || !data) {
      return { limited: false, bucket }
    }

    // Reset bucket if more than 1 minute has passed
    const lastReset = new Date(data.last_reset).getTime()
    const now = Date.now()
    if (now - lastReset > 60000) {
      await supabase
        .from('rate_limit_buckets')
        .update({
          requests_count: 0,
          last_reset: new Date().toISOString()
        })
        .eq('bucket_id', bucket)
      return { limited: false, bucket }
    }

    // Check if limit exceeded (example: 100 requests per minute)
    return {
      limited: data.requests_count >= 100,
      bucket
    }
  } catch {
    return { limited: false, bucket }
  }
}

async function logRateLimitHit(supabase: any, provider: string, model_id: string, bucket: string): Promise<void> {
  try {
    await supabase
      .from('ops_dashboard_events')
      .insert({
        event_type: 'rate_limit_hit',
        provider,
        model_id,
        bucket,
        timestamp: new Date().toISOString()
      })
  } catch (error) {
    console.warn('Failed to log rate limit hit:', error)
  }
}

async function makeLLMCall(model_id: string, prompt: string, content: string, temperature: number, top_p: number): Promise<any> {
  // Simplified LLM call - would use actual API in production
  return {
    model: model_id,
    choices: [{
      message: {
        content: `Mock response for ${prompt.substring(0, 50)}...`
      }
    }],
    usage: {
      prompt_tokens: Math.ceil(prompt.length / 4),
      completion_tokens: 100,
      total_tokens: Math.ceil(prompt.length / 4) + 100
    }
  }
}

function estimateCost(model_id: string, prompt: string, content: string, response: any): number {
  // Simplified cost estimation - would use actual pricing in production
  const prompt_tokens = Math.ceil((prompt + content).length / 4)
  const completion_tokens = response.usage?.completion_tokens || 100
  
  // Example pricing (per 1K tokens)
  const pricing = {
    'gpt-4o-mini': { input: 0.00015, output: 0.0006 },
    'gpt-4o': { input: 0.0025, output: 0.01 }
  }
  
  const modelPricing = pricing[model_id as keyof typeof pricing] || pricing['gpt-4o-mini']
  
  return (prompt_tokens / 1000) * modelPricing.input + (completion_tokens / 1000) * modelPricing.output
}

async function trackCost(supabase: any, deal_id?: string, fund_id?: string, execution_id?: string, cost?: number, model_id?: string): Promise<void> {
  if (!deal_id || !fund_id || !cost) return
  
  try {
    await supabase
      .from('analysis_cost_tracking')
      .insert({
        deal_id,
        fund_id,
        execution_id,
        total_cost: cost,
        model_costs: { [model_id || 'unknown']: cost },
        created_at: new Date().toISOString()
      })
  } catch (error) {
    console.warn('Failed to track cost:', error)
  }
}