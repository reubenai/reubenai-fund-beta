import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BatchRecoveryRequest {
  processingType?: 'failed' | 'retry_needed' | 'pending' | 'all';
  maxRecords?: number;
  dryRun?: boolean;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔄 Starting Perplexity Company batch recovery...');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Parse request parameters
    const { 
      processingType = 'failed',
      maxRecords = 10,
      dryRun = false 
    }: BatchRecoveryRequest = await req.json().catch(() => ({}));
    
    console.log(`🎯 Recovery parameters: type=${processingType}, max=${maxRecords}, dryRun=${dryRun}`);
    
    // Build query based on processing type
    let query = supabase
      .from('deal_enrichment_perplexity_company_export_vc')
      .select(`
        id,
        deal_id,
        company_name,
        processing_status,
        created_at,
        deals!inner(
          id,
          company_name,
          industry,
          website,
          description
        )
      `)
      .order('created_at', { ascending: true })
      .limit(maxRecords);
    
    // Filter by processing status
    if (processingType === 'all') {
      query = query.in('processing_status', ['failed', 'retry_needed', 'pending']);
    } else {
      query = query.eq('processing_status', processingType);
    }
    
    const { data: recordsToRecover, error: queryError } = await query;
    
    if (queryError) {
      throw new Error(`Query failed: ${queryError.message}`);
    }
    
    if (!recordsToRecover || recordsToRecover.length === 0) {
      console.log('✅ No records found for recovery');
      return new Response(
        JSON.stringify({
          success: true,
          message: `No ${processingType} records found for recovery`,
          processed: 0,
          results: []
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`📋 Found ${recordsToRecover.length} records for recovery`);
    
    if (dryRun) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Dry run completed',
          would_process: recordsToRecover.length,
          records: recordsToRecover.map(r => ({
            deal_id: r.deal_id,
            company_name: r.company_name,
            status: r.processing_status,
            created_at: r.created_at
          }))
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Process each record by calling the main enrichment function
    const results = [];
    let processed = 0;
    let failed = 0;
    
    for (const record of recordsToRecover) {
      try {
        console.log(`🔄 Recovering deal ${record.deal_id}: ${record.company_name}`);
        
        // Call the main perplexity-company-enrichment function
        const enrichmentResponse = await supabase.functions.invoke('perplexity-company-enrichment', {
          body: {
            dealId: record.deal_id,
            companyName: record.deals.company_name || record.company_name,
            additionalContext: {
              industry: record.deals.industry,
              website: record.deals.website,
              description: record.deals.description
            }
          }
        });
        
        if (enrichmentResponse.error) {
          throw new Error(`Enrichment failed: ${enrichmentResponse.error.message}`);
        }
        
        const result = enrichmentResponse.data;
        if (result.success) {
          processed++;
          console.log(`✅ Successfully recovered ${record.company_name}`);
          results.push({
            deal_id: record.deal_id,
            company_name: record.company_name,
            status: 'recovered',
            data_quality_score: result.data_quality_score
          });
        } else {
          throw new Error(result.error || 'Unknown enrichment error');
        }
        
      } catch (error) {
        failed++;
        console.error(`❌ Failed to recover ${record.company_name}:`, error);
        results.push({
          deal_id: record.deal_id,
          company_name: record.company_name,
          status: 'recovery_failed',
          error: error.message
        });
      }
      
      // Add delay between requests to avoid rate limiting
      if (recordsToRecover.indexOf(record) < recordsToRecover.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
      }
    }
    
    console.log(`✅ Batch recovery completed: ${processed} processed, ${failed} failed`);
    
    return new Response(
      JSON.stringify({
        success: true,
        message: `Batch recovery completed`,
        processed,
        failed,
        total_attempted: recordsToRecover.length,
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('❌ Batch recovery failed:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message
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