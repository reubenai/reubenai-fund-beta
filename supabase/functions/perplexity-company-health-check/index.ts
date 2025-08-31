import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🏥 Starting Perplexity Company Enrichment health check...');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Check API key availability
    const perplexityApiKey = Deno.env.get('PERPLEXITY_API_KEY');
    const hasApiKey = !!perplexityApiKey;
    
    // Get enrichment statistics
    const { data: stats, error: statsError } = await supabase
      .from('deal_enrichment_perplexity_company_export_vc')
      .select('processing_status')
      .order('created_at', { ascending: false })
      .limit(100);
    
    if (statsError) {
      throw new Error(`Stats query failed: ${statsError.message}`);
    }
    
    // Calculate status distribution
    const statusCounts = {
      processed: 0,
      failed: 0,
      pending: 0,
      retry_needed: 0,
      total: stats?.length || 0
    };
    
    stats?.forEach(record => {
      const status = record.processing_status || 'unknown';
      if (status in statusCounts) {
        statusCounts[status as keyof typeof statusCounts]++;
      }
    });
    
    // Get recent activity (last 24 hours)
    const { data: recentActivity, error: activityError } = await supabase
      .from('deal_enrichment_perplexity_company_export_vc')
      .select('id, processing_status, created_at')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false });
    
    if (activityError) {
      throw new Error(`Activity query failed: ${activityError.message}`);
    }
    
    // Calculate success rate
    const successRate = statusCounts.total > 0 
      ? Math.round((statusCounts.processed / statusCounts.total) * 100) 
      : 0;
    
    // Determine overall health
    let healthStatus = 'healthy';
    const warnings = [];
    
    if (!hasApiKey) {
      healthStatus = 'critical';
      warnings.push('Perplexity API key not configured');
    }
    
    if (successRate < 70) {
      healthStatus = healthStatus === 'critical' ? 'critical' : 'degraded';
      warnings.push(`Low success rate: ${successRate}%`);
    }
    
    if (statusCounts.failed > 10) {
      healthStatus = healthStatus === 'critical' ? 'critical' : 'degraded';
      warnings.push(`High failure count: ${statusCounts.failed} failed records`);
    }
    
    console.log(`✅ Health check completed - Status: ${healthStatus}`);
    
    return new Response(
      JSON.stringify({
        status: healthStatus,
        timestamp: new Date().toISOString(),
        api_key_configured: hasApiKey,
        statistics: {
          ...statusCounts,
          success_rate: `${successRate}%`,
          recent_activity_24h: recentActivity?.length || 0
        },
        warnings,
        recent_records: recentActivity?.slice(0, 10) || []
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
    
  } catch (error) {
    console.error('❌ Health check failed:', error);
    return new Response(
      JSON.stringify({ 
        status: 'critical',
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});