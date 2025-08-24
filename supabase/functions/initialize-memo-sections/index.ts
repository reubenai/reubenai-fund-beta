import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Call the function to create default memo sections for all deals
    const { data, error } = await supabase
      .rpc('create_default_memo_sections_for_all_deals')

    if (error) {
      throw error
    }

    console.log(`✅ Initialized default memo sections for ${data} deals`)

    // Get updated statistics
    const { data: stats, error: statsError } = await supabase
      .from('deals')
      .select(`
        id,
        ic_memos!inner(id)
      `)

    if (statsError) {
      console.warn('Could not fetch updated statistics:', statsError)
    }

    const totalMemos = stats?.length || 0

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully initialized default memo sections for ${data} deals`,
        dealsInitialized: data,
        totalMemosNow: totalMemos
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Error initializing memo sections:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to initialize memo sections'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})