import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CostGuardRequest {
  agent_name: string
  current_cost_per_deal?: number
  current_cost_per_minute?: number
  execution_id: string
  deal_id?: string
  fund_id?: string
  model_costs?: Record<string, number>
  // Enhanced for Phase 3
  model_id?: string
  model_version?: string
  temperature?: number
  top_p?: number
  prompt_hash?: string
  content_hash?: string
}

interface CostGuardResponse {
  allowed: boolean
  degradation_mode: boolean
  reason?: string
  limit_type?: 'per_deal' | 'per_minute'
  current_limits: {
    max_cost_per_deal: number
    max_cost_per_minute: number
  }
  usage_stats: {
    utilization_percentage: number
    recent_cost_trend: 'increasing' | 'stable' | 'decreasing'
  }
  // Enhanced for Phase 3
  cache_hit?: boolean
  retry_count?: number
  degradation_banner?: string
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

    const { 
      agent_name, 
      current_cost_per_deal = 0, 
      current_cost_per_minute = 0,
      execution_id,
      deal_id,
      fund_id,
      model_costs = {}
    } = await req.json() as CostGuardRequest

    if (!agent_name || !execution_id) {
      return new Response(
        JSON.stringify({ error: 'Agent name and execution ID are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Cost guard check for agent: ${agent_name}, execution: ${execution_id}`)

    // Check cost limits using database function
    const { data: limitCheck, error: limitError } = await supabase
      .rpc('check_cost_limits', {
        agent_name_param: agent_name,
        current_cost_per_deal,
        current_cost_per_minute
      })

    if (limitError) {
      console.error('Error checking cost limits:', limitError)
      // In case of error, allow execution but log the issue
      return new Response(
        JSON.stringify({
          allowed: true,
          degradation_mode: false,
          reason: 'Cost check failed - allowing execution',
          error: limitError.message
        } as CostGuardResponse),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get current agent configuration
    const { data: agentConfig, error: configError } = await supabase
      .from('ops_control_switches')
      .select('*')
      .eq('agent_name', agent_name)
      .single()

    if (configError) {
      console.warn('Could not fetch agent config:', configError)
    }

    const config = agentConfig?.config || { max_cost_per_deal: 5.0, max_cost_per_minute: 2.0 }

    // Calculate usage statistics
    const { data: recentCosts, error: statsError } = await supabase
      .from('analysis_cost_tracking')
      .select('total_cost, created_at')
      .eq('fund_id', fund_id || 'unknown')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // Last 7 days
      .order('created_at', { ascending: false })
      .limit(20)

    let utilizationPercentage = 0
    let costTrend: 'increasing' | 'stable' | 'decreasing' = 'stable'

    if (!statsError && recentCosts && recentCosts.length > 0) {
      // Calculate utilization
      utilizationPercentage = Math.min(100, (current_cost_per_deal / config.max_cost_per_deal) * 100)

      // Analyze trend
      if (recentCosts.length >= 5) {
        const recent = recentCosts.slice(0, Math.floor(recentCosts.length / 2))
        const older = recentCosts.slice(Math.floor(recentCosts.length / 2))
        
        const recentAvg = recent.reduce((sum, c) => sum + (c.total_cost || 0), 0) / recent.length
        const olderAvg = older.reduce((sum, c) => sum + (c.total_cost || 0), 0) / older.length
        
        if (recentAvg > olderAvg * 1.1) costTrend = 'increasing'
        else if (recentAvg < olderAvg * 0.9) costTrend = 'decreasing'
      }
    }

    // Record this cost check
    if (deal_id && fund_id) {
      const { error: trackingError } = await supabase
        .from('analysis_cost_tracking')
        .insert({
          deal_id,
          fund_id,
          execution_id,
          cost_per_deal: current_cost_per_deal,
          cost_per_minute: current_cost_per_minute,
          total_cost: current_cost_per_deal, // Simplified for now
          model_costs,
          degradation_triggered: !limitCheck.allowed
        })

      if (trackingError) {
        console.warn('Failed to record cost tracking:', trackingError)
      }
    }

    // Update circuit breaker if needed
    if (!limitCheck.allowed && agentConfig) {
      const { error: updateError } = await supabase
        .from('ops_control_switches')
        .update({
          failure_count: (agentConfig.failure_count || 0) + 1,
          last_failure_at: new Date().toISOString(),
          circuit_breaker_open: (agentConfig.failure_count || 0) >= 3 // Open after 3 failures
        })
        .eq('agent_name', agent_name)

      if (updateError) {
        console.warn('Failed to update circuit breaker:', updateError)
      }
    }

    const response: CostGuardResponse = {
      allowed: limitCheck.allowed,
      degradation_mode: limitCheck.degradation_mode,
      reason: limitCheck.reason,
      limit_type: limitCheck.limit_type,
      current_limits: {
        max_cost_per_deal: config.max_cost_per_deal,
        max_cost_per_minute: config.max_cost_per_minute
      },
      usage_stats: {
        utilization_percentage,
        recent_cost_trend: costTrend
      }
    }

    return new Response(
      JSON.stringify(response),
      {
        status: 200,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'X-Cost-Guard-Version': '1.0',
          'X-Agent-Status': limitCheck.allowed ? 'allowed' : 'blocked'
        }
      }
    )

  } catch (error) {
    console.error('Cost guard error:', error)
    
    // In case of error, default to allowing execution to prevent system lockup
    return new Response(
      JSON.stringify({ 
        allowed: true,
        degradation_mode: false,
        reason: 'Cost guard system error - defaulting to allow',
        error: error instanceof Error ? error.message : 'Unknown error',
        current_limits: {
          max_cost_per_deal: 5.0,
          max_cost_per_minute: 2.0
        },
        usage_stats: {
          utilization_percentage: 0,
          recent_cost_trend: 'stable' as const
        }
      } as CostGuardResponse),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})