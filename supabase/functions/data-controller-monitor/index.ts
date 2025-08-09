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

interface DataFlowRequest {
  action: 'validate_flow' | 'enforce_isolation' | 'track_lineage' | 'monitor_leakage';
  sourceService: string;
  targetService: string;
  fundId?: string;
  dealId?: string;
  data: any;
}

interface DataLineage {
  id: string;
  source_service: string;
  target_service: string;
  fund_id?: string;
  deal_id?: string;
  data_classification: 'fund_specific' | 'general_training' | 'aggregated_insights';
  transfer_reason: string;
  approved: boolean;
  timestamp: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🛡️ Data Controller Monitor: Processing request');
    
    const { action, sourceService, targetService, fundId, dealId, data }: DataFlowRequest = await req.json();
    
    let result;
    
    switch (action) {
      case 'validate_flow':
        result = await validateDataFlow(sourceService, targetService, fundId, data);
        break;
      case 'enforce_isolation':
        result = await enforceDataIsolation(fundId, data);
        break;
      case 'track_lineage':
        result = await trackDataLineage(sourceService, targetService, fundId, dealId, data);
        break;
      case 'monitor_leakage':
        result = await monitorDataLeakage(fundId);
        break;
      default:
        throw new Error(`Unknown action: ${action}`);
    }
    
    return new Response(JSON.stringify({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Data Controller Monitor Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function validateDataFlow(sourceService: string, targetService: string, fundId: string | undefined, data: any): Promise<any> {
  console.log(`🔍 Validating data flow: ${sourceService} → ${targetService}`);
  
  // CRITICAL: Prevent fund-specific data from reaching general training
  const isFundSpecificSource = sourceService === 'fund-memory-engine' || sourceService.includes('fund');
  const isGeneralTrainingTarget = targetService.includes('reuben-orchestrator') || targetService.includes('general');
  
  // BLOCK: Fund-specific data to general training
  if (isFundSpecificSource && isGeneralTrainingTarget && fundId) {
    console.warn('🚫 BLOCKED: Fund-specific data attempting to reach general training system');
    return {
      allowed: false,
      reason: 'Fund-specific data cannot be used for general model training',
      classification: 'fund_specific',
      recommendation: 'Use aggregated insights only'
    };
  }
  
  // ALLOW: General data flows
  const allowedFlows = [
    { from: 'reuben-orchestrator', to: 'enhanced-deal-analysis' },
    { from: 'enhanced-deal-analysis', to: 'fund-memory-engine' },
    { from: 'ai-memo-generator', to: 'fund-memory-engine' },
    { from: 'web-research-engine', to: 'reuben-orchestrator' },
    { from: 'market-research-engine', to: 'reuben-orchestrator' },
    { from: 'financial-engine', to: 'reuben-orchestrator' },
    { from: 'team-research-engine', to: 'reuben-orchestrator' },
    { from: 'thesis-alignment-engine', to: 'reuben-orchestrator' },
    { from: 'product-ip-engine', to: 'reuben-orchestrator' }
  ];
  
  const flowAllowed = allowedFlows.some(flow => 
    flow.from === sourceService && flow.to === targetService
  );
  
  // Data classification
  let classification = 'general_training';
  if (fundId && data) {
    classification = containsFundSpecificInfo(data) ? 'fund_specific' : 'aggregated_insights';
  }
  
  return {
    allowed: flowAllowed,
    classification,
    sanitizedData: classification === 'fund_specific' ? sanitizeForGeneralUse(data) : data,
    reason: flowAllowed ? 'Approved data flow' : 'Unauthorized data transfer'
  };
}

async function enforceDataIsolation(fundId: string | undefined, data: any): Promise<any> {
  console.log('🔒 Enforcing data isolation for fund:', fundId);
  
  if (!fundId) {
    return { isolated: false, reason: 'No fund context provided' };
  }
  
  // Ensure fund-specific data stays within fund boundaries
  const isolatedData = {
    ...data,
    fund_isolation_marker: fundId,
    isolated_at: new Date().toISOString(),
    access_restriction: 'fund_members_only'
  };
  
  // Remove any cross-fund references
  if (isolatedData.similar_deals) {
    isolatedData.similar_deals = isolatedData.similar_deals.filter((deal: any) => 
      deal.fund_id === fundId || !deal.fund_id
    );
  }
  
  return {
    isolated: true,
    isolatedData,
    restrictions: ['fund_members_only', 'no_cross_fund_sharing', 'no_general_training']
  };
}

async function trackDataLineage(
  sourceService: string, 
  targetService: string, 
  fundId: string | undefined, 
  dealId: string | undefined, 
  data: any
): Promise<any> {
  console.log(`📋 Tracking data lineage: ${sourceService} → ${targetService}`);
  
  const classification = fundId && containsFundSpecificInfo(data) 
    ? 'fund_specific' 
    : 'general_training';
  
  const lineageEntry = {
    source_service: sourceService,
    target_service: targetService,
    fund_id: fundId,
    deal_id: dealId,
    data_classification: classification,
    transfer_reason: `Data flow from ${sourceService} to ${targetService}`,
    approved: classification !== 'fund_specific' || targetService.includes('fund'),
    data_size: JSON.stringify(data).length,
    contains_pii: detectPII(data),
    timestamp: new Date().toISOString()
  };
  
  // Store lineage record
  const { data: lineageRecord, error } = await supabase
    .from('data_lineage_log')
    .insert(lineageEntry)
    .select()
    .single();
  
  if (error && error.code !== '42P01') { // Ignore if table doesn't exist yet
    console.warn('Could not store lineage record:', error);
  }
  
  return {
    lineageId: lineageRecord?.id || 'temp-' + Date.now(),
    classification,
    approved: lineageEntry.approved,
    dataSize: lineageEntry.data_size,
    containsPII: lineageEntry.contains_pii
  };
}

async function monitorDataLeakage(fundId: string | undefined): Promise<any> {
  console.log('🕵️ Monitoring data leakage for fund:', fundId);
  
  if (!fundId) {
    return { leakageDetected: false, reason: 'No fund specified' };
  }
  
  // Check for unauthorized data flows
  const unauthorizedFlows = [
    'fund-memory-engine → general-training',
    'fund-specific → public-model',
    'private-data → aggregated-insights'
  ];
  
  // In a real implementation, this would check actual data flows
  const leakageRisks = [];
  
  // Check if fund memory is being accessed by unauthorized services
  try {
    const { data: recentMemoryAccess } = await supabase
      .from('fund_memory_entries')
      .select('ai_service_name, created_at')
      .eq('fund_id', fundId)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false });
    
    const suspiciousServices = ['general-trainer', 'public-model', 'cross-fund-analyzer'];
    const leakageDetected = recentMemoryAccess?.some(access => 
      suspiciousServices.some(service => access.ai_service_name?.includes(service))
    );
    
    if (leakageDetected) {
      leakageRisks.push('Unauthorized AI service accessing fund memory');
    }
  } catch (error) {
    console.warn('Could not check memory access:', error);
  }
  
  return {
    leakageDetected: leakageRisks.length > 0,
    risks: leakageRisks,
    recommendations: leakageRisks.length > 0 
      ? ['Review AI service permissions', 'Audit recent data access', 'Strengthen isolation'] 
      : ['Continue monitoring', 'Maintain current security posture']
  };
}

function containsFundSpecificInfo(data: any): boolean {
  if (!data || typeof data !== 'object') return false;
  
  const sensitiveFields = [
    'fund_id', 'deal_id', 'company_name', 'founder_name', 
    'investment_amount', 'valuation', 'financial_details',
    'strategy', 'decision_rationale', 'member_comments'
  ];
  
  const dataStr = JSON.stringify(data).toLowerCase();
  return sensitiveFields.some(field => dataStr.includes(field.toLowerCase()));
}

function sanitizeForGeneralUse(data: any): any {
  if (!data || typeof data !== 'object') return data;
  
  const sanitized = { ...data };
  
  // Remove fund-specific identifiers
  delete sanitized.fund_id;
  delete sanitized.deal_id;
  delete sanitized.company_name;
  delete sanitized.founder_name;
  delete sanitized.investment_amount;
  delete sanitized.valuation;
  delete sanitized.financial_details;
  
  // Generalize industry and stage information
  if (sanitized.industry) {
    sanitized.industry_category = generalizeIndustry(sanitized.industry);
    delete sanitized.industry;
  }
  
  if (sanitized.stage) {
    sanitized.stage_category = generalizeStage(sanitized.stage);
    delete sanitized.stage;
  }
  
  return sanitized;
}

function generalizeIndustry(industry: string): string {
  const industryMap: { [key: string]: string } = {
    'fintech': 'financial_services',
    'healthtech': 'healthcare',
    'edtech': 'education',
    'proptech': 'real_estate',
    'cybersecurity': 'enterprise_software',
    'ai/ml': 'artificial_intelligence',
    'biotech': 'life_sciences'
  };
  
  return industryMap[industry.toLowerCase()] || 'other';
}

function generalizeStage(stage: string): string {
  const stageMap: { [key: string]: string } = {
    'pre-seed': 'early',
    'seed': 'early',
    'series-a': 'growth',
    'series-b': 'growth',
    'series-c': 'late',
    'series-d': 'late',
    'ipo': 'public'
  };
  
  return stageMap[stage.toLowerCase()] || 'unknown';
}

function detectPII(data: any): boolean {
  if (!data || typeof data !== 'object') return false;
  
  const piiPatterns = [
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email
    /\b\d{3}-?\d{2}-?\d{4}\b/, // SSN
    /\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/, // Credit card
    /\b\+?1?[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/ // Phone
  ];
  
  const dataStr = JSON.stringify(data);
  return piiPatterns.some(pattern => pattern.test(dataStr));
}