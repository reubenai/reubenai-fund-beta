import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface EvidenceIntegrityRequest {
  deal_id: string;
  fund_id: string;
  evidence_data: any;
}

interface EvidenceIntegrityResponse {
  integrity_check: "pass" | "fail";
  block_code?: "evidence_block";
  evidence_appendix: any;
  validation_details: {
    source_ids_valid: boolean;
    domain_count: number;
    recency_compliant: boolean;
    appendix_built: boolean;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { deal_id, fund_id, evidence_data }: EvidenceIntegrityRequest = await req.json();
    
    console.log(`🔍 Evidence Integrity Gate: Validating evidence for deal ${deal_id}`);
    
    // Step 1: Build evidence appendix FIRST (before scoring)
    const evidence_appendix = await buildEvidenceAppendix(deal_id, evidence_data);
    
    // Step 2: Validate all source_ids exist in evidence_sources table
    const sourceIdsValid = await validateSourceIds(evidence_appendix.source_ids);
    
    // Step 3: Require ≥2 unique eTLD+1 domains
    const domainCount = await countUniqueDomains(evidence_appendix.sources);
    
    // Step 4: Enforce mandate-specific recency thresholds
    const recencyCompliant = await validateRecencyThresholds(fund_id, evidence_appendix.sources);
    
    // Hard gate logic: Block if any validation fails
    const allChecksPass = sourceIdsValid && domainCount >= 2 && recencyCompliant;
    
    if (!allChecksPass) {
      // Block analysis instead of "best guess" substitution
      await blockAnalysis(deal_id, "evidence_block");
      
      console.log(`❌ Evidence integrity check failed for deal ${deal_id}`);
      
      return new Response(JSON.stringify({
        integrity_check: "fail",
        block_code: "evidence_block",
        evidence_appendix,
        validation_details: {
          source_ids_valid: sourceIdsValid,
          domain_count: domainCount,
          recency_compliant: recencyCompliant,
          appendix_built: true
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // All checks passed
    console.log(`✅ Evidence integrity check passed for deal ${deal_id}`);
    
    return new Response(JSON.stringify({
      integrity_check: "pass",
      evidence_appendix,
      validation_details: {
        source_ids_valid: sourceIdsValid,
        domain_count: domainCount,
        recency_compliant: recencyCompliant,
        appendix_built: true
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Evidence Integrity Check Error:', error);
    return new Response(JSON.stringify({
      integrity_check: "fail",
      block_code: "evidence_block",
      evidence_appendix: {},
      validation_details: {
        source_ids_valid: false,
        domain_count: 0,
        recency_compliant: false,
        appendix_built: false
      },
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function buildEvidenceAppendix(deal_id: string, evidence_data: any): Promise<any> {
  console.log('📋 Building evidence appendix...');
  
  // Get all evidence sources for this deal
  const { data: sources, error } = await supabase
    .from('deal_analysis_sources')
    .select('*')
    .eq('deal_id', deal_id);

  if (error) {
    throw new Error(`Failed to fetch evidence sources: ${error.message}`);
  }

  // Build comprehensive evidence appendix
  const evidence_appendix = {
    deal_id,
    source_ids: sources?.map(s => s.id) || [],
    sources: sources || [],
    evidence_count: sources?.length || 0,
    unique_engines: [...new Set(sources?.map(s => s.engine_name) || [])],
    domains: extractDomains(sources || []),
    recency_data: sources?.map(s => ({
      source_id: s.id,
      retrieved_at: s.retrieved_at,
      engine_name: s.engine_name
    })) || [],
    built_at: new Date().toISOString()
  };

  // Store the committed evidence appendix
  await supabase
    .from('evidence_appendix')
    .upsert({
      deal_id,
      appendix_data: evidence_appendix,
      created_at: new Date().toISOString()
    });

  return evidence_appendix;
}

async function validateSourceIds(source_ids: string[]): Promise<boolean> {
  if (!source_ids || source_ids.length === 0) {
    return false;
  }

  console.log(`🔗 Validating ${source_ids.length} source IDs...`);

  // Check that all source_ids exist in evidence_sources table
  const { data: existingSources, error } = await supabase
    .from('deal_analysis_sources')
    .select('id')
    .in('id', source_ids);

  if (error) {
    console.error('Error validating source IDs:', error);
    return false;
  }

  const existingIds = existingSources?.map(s => s.id) || [];
  const allExist = source_ids.every(id => existingIds.includes(id));

  console.log(`Source IDs validation: ${existingIds.length}/${source_ids.length} exist`);
  
  return allExist;
}

function extractDomains(sources: any[]): string[] {
  const domains = new Set<string>();
  
  sources.forEach(source => {
    if (source.source_url) {
      try {
        const url = new URL(source.source_url);
        // Extract eTLD+1 (effective top-level domain + 1)
        const hostname = url.hostname;
        const parts = hostname.split('.');
        
        if (parts.length >= 2) {
          // Simple eTLD+1 extraction (would be more sophisticated in production)
          const etldPlus1 = parts.slice(-2).join('.');
          domains.add(etldPlus1);
        }
      } catch {
        // Invalid URL, skip
      }
    }
  });
  
  return Array.from(domains);
}

async function countUniqueDomains(sources: any[]): Promise<number> {
  const domains = extractDomains(sources);
  
  console.log(`🌐 Found ${domains.length} unique eTLD+1 domains:`, domains);
  
  return domains.length;
}

async function validateRecencyThresholds(fund_id: string, sources: any[]): Promise<boolean> {
  console.log('⏰ Validating recency thresholds...');
  
  // Get mandate-specific recency thresholds
  const { data: strategy, error } = await supabase
    .from('investment_strategies')
    .select('recency_thresholds')
    .eq('fund_id', fund_id)
    .single();

  if (error || !strategy?.recency_thresholds) {
    console.log('No specific recency thresholds found, using defaults');
    // Default thresholds: 90 days for most sources
    const defaultThreshold = 90 * 24 * 60 * 60 * 1000; // 90 days in ms
    const now = Date.now();
    
    return sources.every(source => {
      if (!source.retrieved_at) return false;
      const sourceTime = new Date(source.retrieved_at).getTime();
      return (now - sourceTime) <= defaultThreshold;
    });
  }

  const thresholds = strategy.recency_thresholds;
  const now = Date.now();
  
  return sources.every(source => {
    if (!source.retrieved_at || !source.engine_name) return false;
    
    // Get threshold for this engine (in days)
    const thresholdDays = thresholds[source.engine_name] || thresholds.default || 90;
    const thresholdMs = thresholdDays * 24 * 60 * 60 * 1000;
    
    const sourceTime = new Date(source.retrieved_at).getTime();
    const isRecent = (now - sourceTime) <= thresholdMs;
    
    if (!isRecent) {
      console.log(`❌ Source ${source.id} from ${source.engine_name} is stale (${Math.floor((now - sourceTime) / (24 * 60 * 60 * 1000))} days old, threshold: ${thresholdDays} days)`);
    }
    
    return isRecent;
  });
}

async function blockAnalysis(deal_id: string, block_code: string): Promise<void> {
  console.log(`🚫 Blocking analysis for deal ${deal_id} with code: ${block_code}`);
  
  // Update analysis queue status
  await supabase
    .from('analysis_queue')
    .update({
      status: 'failed',
      error_message: `Evidence integrity check failed: ${block_code}`
    })
    .eq('deal_id', deal_id);

  // Update deal status
  await supabase
    .from('deals')
    .update({
      analysis_queue_status: 'blocked'
    })
    .eq('id', deal_id);
}