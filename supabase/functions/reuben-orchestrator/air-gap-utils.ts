// Air Gap Protection Utilities for Reuben Orchestrator
// CRITICAL: These functions ensure fund-specific data never contaminates general AI training

export function generalizeIndustry(industry: string): string {
  const industryMap: { [key: string]: string } = {
    'fintech': 'financial_services',
    'healthtech': 'healthcare',
    'edtech': 'education',
    'proptech': 'real_estate',
    'insurtech': 'insurance',
    'regtech': 'regulatory',
    'climate tech': 'sustainability',
    'deep tech': 'advanced_technology',
    'biotech': 'life_sciences',
    'medtech': 'medical_devices'
  };
  
  const normalized = industry.toLowerCase();
  return industryMap[normalized] || 'technology';
}

export function generalizeStage(stage: string): string {
  const stageMap: { [key: string]: string } = {
    'pre-seed': 'early_stage',
    'seed': 'early_stage',
    'series a': 'growth_stage',
    'series b': 'growth_stage',
    'series c': 'late_stage',
    'series d+': 'late_stage',
    'growth': 'late_stage',
    'pre-ipo': 'mature_stage'
  };
  
  const normalized = stage.toLowerCase();
  return stageMap[normalized] || 'unknown_stage';
}

export function extractGeneralPatterns(engineResult: any): any {
  if (!engineResult) return null;
  
  return {
    confidence_band: engineResult.confidence >= 80 ? 'high' : 
                    engineResult.confidence >= 60 ? 'medium' : 'low',
    score_pattern: engineResult.score >= 85 ? 'exceptional' :
                   engineResult.score >= 70 ? 'strong' :
                   engineResult.score >= 50 ? 'moderate' : 'weak',
    methodology_signals: extractMethodologySignals(engineResult)
  };
}

function extractMethodologySignals(result: any): string[] {
  const signals: string[] = [];
  
  if (result.data_completeness >= 80) signals.push('high_data_quality');
  if (result.external_validation) signals.push('external_validation_available');
  if (result.competitive_analysis) signals.push('competitive_context_strong');
  if (result.financial_projections) signals.push('financial_modeling_complete');
  
  return signals;
}

export function calculateEnginePerformance(engineResults: any): any {
  const engines = Object.keys(engineResults);
  const performance = {
    total_engines: engines.length,
    successful_engines: 0,
    average_confidence: 0,
    data_quality_score: 0
  };
  
  let totalConfidence = 0;
  let totalDataQuality = 0;
  
  engines.forEach(engine => {
    const result = engineResults[engine];
    if (result && result.confidence) {
      performance.successful_engines++;
      totalConfidence += result.confidence;
      totalDataQuality += result.data_completeness || 50;
    }
  });
  
  if (performance.successful_engines > 0) {
    performance.average_confidence = totalConfidence / performance.successful_engines;
    performance.data_quality_score = totalDataQuality / performance.successful_engines;
  }
  
  return performance;
}

export function extractDataQuality(engineResults: any): string[] {
  const qualityIndicators: string[] = [];
  
  Object.values(engineResults).forEach((result: any) => {
    if (result?.data_completeness >= 90) qualityIndicators.push('excellent_data');
    if (result?.external_sources > 5) qualityIndicators.push('rich_external_data');
    if (result?.validation_checks) qualityIndicators.push('validation_complete');
  });
  
  return qualityIndicators;
}