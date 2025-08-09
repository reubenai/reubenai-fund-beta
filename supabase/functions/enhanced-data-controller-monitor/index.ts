import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface DataFlowRequest {
  action: 'validate_flow' | 'enforce_isolation' | 'track_lineage' | 'monitor_leakage' | 'real_time_enforce';
  sourceService: string;
  targetService: string;
  fundId?: string;
  dealId?: string;
  dataType: string;
  payload?: any;
  classification?: 'fund_specific' | 'general_training' | 'aggregated_insights';
}

interface AirGapViolation {
  violationType: 'fund_data_leak' | 'unauthorized_access' | 'contamination_risk';
  severity: 'critical' | 'high' | 'medium' | 'low';
  sourceService: string;
  targetService: string;
  fundId?: string;
  detectedAt: string;
  details: any;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const request: DataFlowRequest = await req.json();
    console.log('🔐 Enhanced Data Controller: Processing', request.action, 'for', request.sourceService, '->', request.targetService);

    let result: any;
    
    switch (request.action) {
      case 'validate_flow':
        result = await validateDataFlowEnhanced(request);
        break;
      case 'enforce_isolation':
        result = await enforceDataIsolationEnhanced(request);
        break;
      case 'track_lineage':
        result = await trackDataLineageEnhanced(request);
        break;
      case 'monitor_leakage':
        result = await monitorDataLeakageEnhanced(request);
        break;
      case 'real_time_enforce':
        result = await realTimeAirGapEnforcement(request);
        break;
      default:
        throw new Error(`Unknown action: ${request.action}`);
    }

    return new Response(JSON.stringify({
      success: true,
      action: request.action,
      result,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Enhanced Data Controller Error:', error);
    
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

async function validateDataFlowEnhanced(request: DataFlowRequest): Promise<any> {
  console.log('🔍 Enhanced validation for data flow');
  
  const isAuthorized = await checkDataFlowAuthorization(request);
  const classification = classifyData(request.payload);
  const airGapCompliance = checkAirGapCompliance(request, classification);
  
  // CRITICAL: Block fund-specific data to general training systems
  if (classification === 'fund_specific' && isFundMemoryViolation(request.targetService)) {
    await logAirGapViolation({
      violationType: 'fund_data_leak',
      severity: 'critical',
      sourceService: request.sourceService,
      targetService: request.targetService,
      fundId: request.fundId,
      detectedAt: new Date().toISOString(),
      details: { 
        blocked: true, 
        reason: 'Fund-specific data blocked from general training system',
        classification 
      }
    });
    
    return { 
      allowed: false, 
      reason: 'CRITICAL: Fund-specific data cannot flow to general training systems',
      airGapViolation: true,
      classification,
      recommendedAction: 'Sanitize data or route through Fund Memory Engine'
    };
  }
  
  return {
    allowed: isAuthorized && airGapCompliance.compliant,
    classification,
    airGapCompliance,
    sanitizationRequired: classification === 'fund_specific' && !isKnownSafeTarget(request.targetService)
  };
}

async function enforceDataIsolationEnhanced(request: DataFlowRequest): Promise<any> {
  console.log('🛡️ Enhanced data isolation enforcement');
  
  if (!request.fundId) {
    return { isolated: false, reason: 'No fund ID provided' };
  }
  
  // Add enhanced isolation markers
  const isolatedData = {
    ...request.payload,
    _isolation: {
      fundId: request.fundId,
      isolationLevel: 'strict',
      accessRestrictions: ['fund_members_only'],
      dataClassification: 'fund_specific',
      expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      auditTrail: [{
        action: 'isolation_applied',
        service: request.sourceService,
        timestamp: new Date().toISOString()
      }]
    },
    _sanitized: sanitizeForGeneralUse(request.payload)
  };
  
  // Filter out cross-fund references
  const cleanedData = filterCrossFundReferences(isolatedData, request.fundId);
  
  return {
    isolated: true,
    data: cleanedData,
    isolationMarkers: isolatedData._isolation
  };
}

async function trackDataLineageEnhanced(request: DataFlowRequest): Promise<any> {
  console.log('📊 Enhanced data lineage tracking');
  
  const lineageRecord = {
    source_service: request.sourceService,
    target_service: request.targetService,
    fund_id: request.fundId,
    deal_id: request.dealId,
    data_classification: classifyData(request.payload),
    transfer_reason: `Enhanced data flow: ${request.dataType}`,
    approved: true,
    pii_detected: detectPII(request.payload),
    air_gap_compliant: checkAirGapCompliance(request, classifyData(request.payload)).compliant,
    metadata: {
      dataSize: JSON.stringify(request.payload || {}).length,
      transferType: request.dataType,
      securityLevel: 'enhanced',
      timestamp: new Date().toISOString()
    }
  };
  
  const { error } = await supabase
    .from('data_lineage_log')
    .insert(lineageRecord);
    
  if (error) {
    console.error('Failed to log data lineage:', error);
    return { tracked: false, error: error.message };
  }
  
  return { tracked: true, lineageId: lineageRecord };
}

async function monitorDataLeakageEnhanced(request: DataFlowRequest): Promise<any> {
  console.log('🚨 Enhanced data leakage monitoring');
  
  const violations: AirGapViolation[] = [];
  
  // Check for unauthorized fund memory access
  if (request.targetService === 'reuben-orchestrator' && containsFundSpecificInfo(request.payload)) {
    violations.push({
      violationType: 'fund_data_leak',
      severity: 'critical',
      sourceService: request.sourceService,
      targetService: request.targetService,
      fundId: request.fundId,
      detectedAt: new Date().toISOString(),
      details: { 
        reason: 'Fund-specific data detected flowing to general orchestrator',
        dataType: request.dataType 
      }
    });
  }
  
  // Check for suspicious AI service access patterns
  if (isAITrainingService(request.targetService) && request.fundId) {
    violations.push({
      violationType: 'contamination_risk',
      severity: 'high',
      sourceService: request.sourceService,
      targetService: request.targetService,
      fundId: request.fundId,
      detectedAt: new Date().toISOString(),
      details: { 
        reason: 'Fund-specific data may contaminate general AI training',
        preventiveAction: 'required' 
      }
    });
  }
  
  // Log all violations
  for (const violation of violations) {
    await logAirGapViolation(violation);
  }
  
  return {
    leakageDetected: violations.length > 0,
    violations,
    totalViolations: violations.length,
    criticalViolations: violations.filter(v => v.severity === 'critical').length
  };
}

async function realTimeAirGapEnforcement(request: DataFlowRequest): Promise<any> {
  console.log('⚡ Real-time air gap enforcement');
  
  const validation = await validateDataFlowEnhanced(request);
  
  if (!validation.allowed) {
    // Block the flow immediately
    return {
      blocked: true,
      reason: validation.reason,
      airGapViolation: validation.airGapViolation,
      enforcement: 'immediate_block'
    };
  }
  
  if (validation.sanitizationRequired) {
    // Apply sanitization in real-time
    const sanitized = sanitizeForGeneralUse(request.payload);
    return {
      allowed: true,
      sanitized: true,
      data: sanitized,
      enforcement: 'sanitized_flow'
    };
  }
  
  return {
    allowed: true,
    enforcement: 'permitted_flow'
  };
}

// Utility Functions

function classifyData(data: any): 'fund_specific' | 'general_training' | 'aggregated_insights' {
  if (!data) return 'general_training';
  
  const fundSpecificFields = [
    'fund_id', 'deal_id', 'company_name', 'founder', 'valuation', 
    'investment_amount', 'board_composition', 'financial_projections'
  ];
  
  const hasFundSpecific = fundSpecificFields.some(field => 
    data[field] !== undefined || 
    JSON.stringify(data).toLowerCase().includes(field.replace('_', ' '))
  );
  
  if (hasFundSpecific) return 'fund_specific';
  
  const isAggregated = data.aggregation_level || data.anonymized || data.pattern_insights;
  return isAggregated ? 'aggregated_insights' : 'general_training';
}

function isFundMemoryViolation(targetService: string): boolean {
  const prohibitedServices = [
    'reuben-orchestrator',
    'ai-memo-generator',
    'general-training-engine'
  ];
  return prohibitedServices.includes(targetService);
}

function isKnownSafeTarget(targetService: string): boolean {
  const safeTargets = [
    'enhanced-fund-memory-engine',
    'fund-specific-analysis',
    'deal-analysis-engine'
  ];
  return safeTargets.includes(targetService);
}

function isAITrainingService(service: string): boolean {
  return service.includes('training') || service.includes('learning') || service === 'reuben-orchestrator';
}

async function checkDataFlowAuthorization(request: DataFlowRequest): Promise<boolean> {
  // Enhanced authorization logic
  return true; // Simplified for this implementation
}

function checkAirGapCompliance(request: DataFlowRequest, classification: string): any {
  const compliant = !(classification === 'fund_specific' && isFundMemoryViolation(request.targetService));
  
  return {
    compliant,
    classification,
    airGapLevel: compliant ? 'secure' : 'violation',
    recommendation: compliant ? 'proceed' : 'block_or_sanitize'
  };
}

function containsFundSpecificInfo(data: any): boolean {
  if (!data) return false;
  
  const sensitiveFields = [
    'fund_id', 'deal_id', 'company_name', 'founder_name', 'valuation',
    'investment_amount', 'board_composition', 'cap_table', 'financial_projections'
  ];
  
  return sensitiveFields.some(field => 
    data[field] !== undefined ||
    JSON.stringify(data).toLowerCase().includes(field.replace('_', ' '))
  );
}

function sanitizeForGeneralUse(data: any): any {
  if (!data) return data;
  
  const sanitized = { ...data };
  
  // Remove sensitive fund-specific fields
  const sensitiveFields = [
    'fund_id', 'deal_id', 'company_name', 'founder_name', 'founder',
    'valuation', 'investment_amount', 'board_composition', 'cap_table',
    'financial_projections', 'investor_list', 'contact_information'
  ];
  
  sensitiveFields.forEach(field => {
    delete sanitized[field];
  });
  
  // Generalize remaining data
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
  const mapping: { [key: string]: string } = {
    'fintech': 'financial_services',
    'healthtech': 'healthcare',
    'edtech': 'education',
    'proptech': 'real_estate'
  };
  
  return mapping[industry.toLowerCase()] || 'technology';
}

function generalizeStage(stage: string): string {
  const mapping: { [key: string]: string } = {
    'pre-seed': 'early_stage',
    'seed': 'early_stage',
    'series a': 'growth_stage',
    'series b': 'growth_stage'
  };
  
  return mapping[stage.toLowerCase()] || 'unknown_stage';
}

function filterCrossFundReferences(data: any, currentFundId: string): any {
  // Filter out any references to other funds
  const cleaned = { ...data };
  
  if (cleaned.fund_references) {
    cleaned.fund_references = cleaned.fund_references.filter((ref: any) => 
      ref.fund_id === currentFundId
    );
  }
  
  return cleaned;
}

function detectPII(data: any): boolean {
  if (!data) return false;
  
  const dataString = JSON.stringify(data);
  const piiPatterns = [
    /\b\d{3}-\d{2}-\d{4}\b/, // SSN
    /\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/, // Credit card
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email
    /\b\d{3}[- ]?\d{3}[- ]?\d{4}\b/ // Phone
  ];
  
  return piiPatterns.some(pattern => pattern.test(dataString));
}

async function logAirGapViolation(violation: AirGapViolation): Promise<void> {
  try {
    await supabase.from('air_gap_violations').insert({
      violation_type: violation.violationType,
      severity: violation.severity,
      source_service: violation.sourceService,
      target_service: violation.targetService,
      fund_id: violation.fundId,
      detected_at: violation.detectedAt,
      details: violation.details,
      status: 'active'
    });
    
    console.error('🚨 AIR GAP VIOLATION LOGGED:', violation);
  } catch (error) {
    console.error('Failed to log air gap violation:', error);
  }
}