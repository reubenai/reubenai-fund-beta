import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    const { dealId } = await req.json()

    // EMERGENCY BLACKLIST CHECK - HARD CODED FOR CRITICAL DEAL
    const criticalBlacklistedDealId = '7ac26a5f-34c9-4d30-b09c-c05d1d1df81d'
    
    if (dealId === criticalBlacklistedDealId) {
      console.log(`🚨 EMERGENCY BRAKE: Deal ${dealId} is HARD BLOCKED - excessive activity detected`)
      return new Response(
        JSON.stringify({ 
          blocked: true, 
          reason: 'EMERGENCY_SHUTDOWN_EXCESSIVE_ACTIVITY',
          message: 'This deal has been emergency blocked due to excessive engine activity (13,455+ hits in 30 minutes)'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check emergency blacklist table
    const { data: blacklistEntry, error: blacklistError } = await supabase
      .from('emergency_deal_blacklist')
      .select('*')
      .eq('deal_id', dealId)
      .single()

    if (blacklistEntry) {
      console.log(`🚨 EMERGENCY BRAKE: Deal ${dealId} found in blacklist - ${blacklistEntry.reason}`)
      return new Response(
        JSON.stringify({ 
          blocked: true, 
          reason: blacklistEntry.reason,
          blockedAt: blacklistEntry.blocked_at,
          message: `Deal blocked: ${blacklistEntry.reason}`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check deal-level blocks
    const { data: deal, error: dealError } = await supabase
      .from('deals')
      .select('analysis_blocked_until, auto_analysis_enabled, analysis_queue_status')
      .eq('id', dealId)
      .single()

    if (dealError) {
      console.error('Error checking deal:', dealError)
      return new Response(
        JSON.stringify({ error: 'Failed to check deal status' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if analysis is blocked until future date
    if (deal?.analysis_blocked_until && new Date(deal.analysis_blocked_until) > new Date()) {
      console.log(`🚫 Deal ${dealId} analysis blocked until ${deal.analysis_blocked_until}`)
      return new Response(
        JSON.stringify({ 
          blocked: true, 
          reason: 'ANALYSIS_BLOCKED_UNTIL_DATE',
          blockedUntil: deal.analysis_blocked_until,
          message: `Analysis blocked until ${deal.analysis_blocked_until}`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check analysis allowlist for permanent disables
    const { data: allowlistEntry } = await supabase
      .from('analysis_allowlist')
      .select('*')
      .eq('deal_id', dealId)
      .eq('test_phase', 'permanently_disabled')
      .single()

    if (allowlistEntry) {
      console.log(`🚫 Deal ${dealId} permanently disabled in allowlist`)
      return new Response(
        JSON.stringify({ 
          blocked: true, 
          reason: 'PERMANENTLY_DISABLED',
          message: 'Deal analysis permanently disabled'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Deal is not blocked
    return new Response(
      JSON.stringify({ 
        blocked: false,
        autoAnalysisEnabled: deal?.auto_analysis_enabled || false,
        queueStatus: deal?.analysis_queue_status
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Emergency checker error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})