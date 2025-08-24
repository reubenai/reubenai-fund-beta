import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CleanupRequest {
  action: 'cleanup_sources' | 'cleanup_artifacts' | 'detect_duplicates' | 'get_status'
  limit?: number
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const { action, limit } = await req.json() as CleanupRequest;

    console.log(`🧹 [Emergency Cleanup] Action: ${action}`);

    switch (action) {
      case 'cleanup_sources': {
        console.log('🚨 [Cleanup] Starting deal_analysis_sources cleanup...');
        
        // Call the cleanup function
        const { data: cleanupResult, error: cleanupError } = await supabaseClient
          .rpc('emergency_cleanup_duplicate_sources');
        
        if (cleanupError) {
          console.error('❌ [Cleanup] Sources cleanup failed:', cleanupError);
          throw cleanupError;
        }

        console.log('✅ [Cleanup] Sources cleanup completed:', cleanupResult);
        
        return new Response(
          JSON.stringify({
            success: true,
            action: 'cleanup_sources',
            result: cleanupResult,
            timestamp: new Date().toISOString()
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200 
          }
        );
      }

      case 'cleanup_artifacts': {
        console.log('🚨 [Cleanup] Starting artifacts cleanup...');
        
        // Call the cleanup function
        const { data: cleanupResult, error: cleanupError } = await supabaseClient
          .rpc('emergency_cleanup_duplicate_artifacts');
        
        if (cleanupError) {
          console.error('❌ [Cleanup] Artifacts cleanup failed:', cleanupError);
          throw cleanupError;
        }

        console.log('✅ [Cleanup] Artifacts cleanup completed:', cleanupResult);
        
        return new Response(
          JSON.stringify({
            success: true,
            action: 'cleanup_artifacts',
            result: cleanupResult,
            timestamp: new Date().toISOString()
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200 
          }
        );
      }

      case 'detect_duplicates': {
        console.log('🔍 [Monitor] Detecting duplicates...');
        
        // Call the detection function
        const { data: duplicateResult, error: duplicateError } = await supabaseClient
          .rpc('detect_duplicate_sources');
        
        if (duplicateError) {
          console.error('❌ [Monitor] Duplicate detection failed:', duplicateError);
          throw duplicateError;
        }

        console.log('✅ [Monitor] Duplicate detection completed:', duplicateResult);
        
        return new Response(
          JSON.stringify({
            success: true,
            action: 'detect_duplicates',
            result: duplicateResult,
            timestamp: new Date().toISOString()
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200 
          }
        );
      }

      case 'get_status': {
        console.log('📊 [Status] Getting system status...');
        
        // Get current counts
        const { data: sourcesCount, error: sourcesError } = await supabaseClient
          .from('deal_analysis_sources')
          .select('deal_id, engine_name', { count: 'exact' });

        const { data: artifactsCount, error: artifactsError } = await supabaseClient
          .from('artifacts')
          .select('deal_id, artifact_type', { count: 'exact' });

        if (sourcesError || artifactsError) {
          throw sourcesError || artifactsError;
        }

        // Get recent duplicates
        const { data: recentDuplicates, error: duplicatesError } = await supabaseClient
          .rpc('detect_duplicate_sources');

        if (duplicatesError) {
          console.warn('⚠️ [Status] Could not detect duplicates:', duplicatesError);
        }

        const status = {
          total_sources: sourcesCount?.length || 0,
          total_artifacts: artifactsCount?.length || 0,
          recent_duplicates: recentDuplicates || { sources_duplicates: [], artifacts_duplicates: [] },
          prevention_active: true,
          last_check: new Date().toISOString()
        };

        console.log('✅ [Status] System status retrieved:', status);
        
        return new Response(
          JSON.stringify({
            success: true,
            action: 'get_status',
            result: status,
            timestamp: new Date().toISOString()
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200 
          }
        );
      }

      default:
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `Unknown action: ${action}`,
            available_actions: ['cleanup_sources', 'cleanup_artifacts', 'detect_duplicates', 'get_status']
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400 
          }
        );
    }

  } catch (error) {
    console.error('💥 [Emergency Cleanup] Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});