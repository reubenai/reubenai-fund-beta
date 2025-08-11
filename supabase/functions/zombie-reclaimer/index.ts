import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🧹 Zombie Reclaimer: Starting zombie job reclamation...');

    // Call the zombie reclaimer function
    const { data: result, error } = await supabase.rpc('reclaim_zombie_analysis_jobs');

    if (error) {
      console.error('❌ Zombie reclaimer error:', error);
      throw error;
    }

    console.log('✅ Zombie reclamation complete:', result);

    return new Response(JSON.stringify({
      success: true,
      ...result,
      message: 'Zombie job reclamation completed'
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('💥 Zombie reclaimer error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Zombie reclaimer failed'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});