import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { dealId, dealData, dealAnalysis, allEngineResults } = await req.json();
    
    console.log(`⚠️ Risk Mitigation Engine: Analyzing risks and mitigation strategies for: ${dealData?.company_name || dealId}`);

    // Aggregate risks from all other engines and create comprehensive mitigation plan
    const riskMitigation = await analyzeRiskMitigation({
      dealData,
      dealAnalysis,
      allEngineResults,
      supabase
    });

    console.log(`✅ Risk Mitigation Engine: Analysis completed for ${dealData?.company_name}`);

    return new Response(
      JSON.stringify({
        success: true,
        data: riskMitigation,
        engineName: 'risk-mitigation-engine',
        dealId,
        confidence: riskMitigation.confidence,
        analysis_type: 'risk_mitigation'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Risk Mitigation Engine error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        engineName: 'risk-mitigation-engine'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function analyzeRiskMitigation({
  dealData,
  dealAnalysis,
  allEngineResults,
  supabase
}) {
  // Aggregate all identified risks from different engines
  const aggregatedRisks = await aggregateRisksFromEngines(allEngineResults, dealData);
  
  // Categorize risks by type and severity
  const categorizedRisks = categorizeRisksBySeverity(aggregatedRisks);
  
  // Generate mitigation strategies for each risk
  const mitigationStrategies = await generateMitigationStrategies(categorizedRisks, dealData);
  
  // Create monitoring and governance framework
  const monitoringFramework = createMonitoringFramework(categorizedRisks);
  
  // Develop contingency plans
  const contingencyPlans = createContingencyPlans(categorizedRisks, dealData);

  const analysis = {
    risk_summary: {
      total_risks_identified: aggregatedRisks.length,
      high_severity_count: categorizedRisks.high.length,
      medium_severity_count: categorizedRisks.medium.length,
      low_severity_count: categorizedRisks.low.length,
      overall_risk_score: calculateOverallRiskScore(categorizedRisks)
    },
    risk_categories: {
      market_risks: extractRisksByCategory(aggregatedRisks, 'market'),
      operational_risks: extractRisksByCategory(aggregatedRisks, 'operational'),
      financial_risks: extractRisksByCategory(aggregatedRisks, 'financial'),
      technology_risks: extractRisksByCategory(aggregatedRisks, 'technology'),
      team_risks: extractRisksByCategory(aggregatedRisks, 'team'),
      regulatory_risks: extractRisksByCategory(aggregatedRisks, 'regulatory')
    },
    mitigation_strategies: mitigationStrategies,
    monitoring_framework: monitoringFramework,
    contingency_plans: contingencyPlans,
    key_risk_indicators: generateKeyRiskIndicators(categorizedRisks),
    governance_recommendations: generateGovernanceRecommendations(categorizedRisks, dealData),
    insurance_recommendations: generateInsuranceRecommendations(aggregatedRisks, dealData),
    due_diligence_focus: generateDueDiligenceFocus(categorizedRisks),
    board_oversight: generateBoardOversightRecommendations(categorizedRisks),
    confidence: calculateRiskConfidence(allEngineResults, dealData)
  };

  return analysis;
}

async function aggregateRisksFromEngines(allEngineResults, dealData) {
  const risks = [];
  
  // Extract risks from market research engine
  if (allEngineResults?.marketResearch?.risks) {
    allEngineResults.marketResearch.risks.forEach(risk => {
      risks.push({
        source: 'market-research-engine',
        category: 'market',
        risk: risk,
        severity: assessRiskSeverity(risk, 'market'),
        probability: 'Medium'
      });
    });
  }

  // Extract risks from financial engine
  if (allEngineResults?.financialAnalysis?.risk_factors) {
    allEngineResults.financialAnalysis.risk_factors.forEach(risk => {
      risks.push({
        source: 'financial-engine',
        category: 'financial',
        risk: risk,
        severity: assessRiskSeverity(risk, 'financial'),
        probability: 'Medium-High'
      });
    });
  }

  // Extract risks from team research engine
  if (allEngineResults?.teamResearch?.risks) {
    allEngineResults.teamResearch.risks.forEach(risk => {
      risks.push({
        source: 'team-research-engine',
        category: 'team',
        risk: risk,
        severity: assessRiskSeverity(risk, 'team'),
        probability: 'Medium'
      });
    });
  }

  // Extract risks from product/technology engine
  if (allEngineResults?.productAnalysis?.technology_risks) {
    allEngineResults.productAnalysis.technology_risks.forEach(risk => {
      risks.push({
        source: 'product-ip-engine',
        category: 'technology',
        risk: risk,
        severity: assessRiskSeverity(risk, 'technology'),
        probability: 'Medium'
      });
    });
  }

  // Add common investment risks based on deal characteristics
  risks.push(...generateCommonInvestmentRisks(dealData));

  return risks;
}

function generateCommonInvestmentRisks(dealData) {
  const commonRisks = [];
  
  const stage = dealData?.stage?.toLowerCase() || '';
  const industry = dealData?.industry?.toLowerCase() || '';
  
  // Stage-specific risks
  if (stage.includes('seed') || stage.includes('early')) {
    commonRisks.push({
      source: 'risk-mitigation-engine',
      category: 'operational',
      risk: 'Early-stage execution risk and product-market fit uncertainty',
      severity: 'High',
      probability: 'High'
    });
  }

  // Industry-specific risks
  if (industry.includes('technology') || industry.includes('software')) {
    commonRisks.push({
      source: 'risk-mitigation-engine',
      category: 'technology',
      risk: 'Technology obsolescence and competitive disruption',
      severity: 'Medium',
      probability: 'Medium'
    });
  }

  // General investment risks
  commonRisks.push(
    {
      source: 'risk-mitigation-engine',
      category: 'market',
      risk: 'Economic downturn affecting customer demand and funding availability',
      severity: 'Medium',
      probability: 'Medium'
    },
    {
      source: 'risk-mitigation-engine',
      category: 'operational',
      risk: 'Key person dependency and talent retention challenges',
      severity: 'Medium-High',
      probability: 'Medium'
    },
    {
      source: 'risk-mitigation-engine',
      category: 'financial',
      risk: 'Cash flow management and future funding requirements',
      severity: 'Medium',
      probability: 'Medium-High'
    }
  );

  return commonRisks;
}

function assessRiskSeverity(risk, category) {
  const riskText = risk.toLowerCase();
  
  // High severity indicators
  if (riskText.includes('bankruptcy') || riskText.includes('failure') || 
      riskText.includes('critical') || riskText.includes('severe')) {
    return 'High';
  }
  
  // Medium-high severity indicators
  if (riskText.includes('significant') || riskText.includes('major') || 
      riskText.includes('substantial')) {
    return 'Medium-High';
  }
  
  // Low severity indicators
  if (riskText.includes('minor') || riskText.includes('limited') || 
      riskText.includes('small')) {
    return 'Low';
  }
  
  return 'Medium'; // Default
}

function categorizeRisksBySeverity(risks) {
  return {
    high: risks.filter(r => r.severity === 'High'),
    medium_high: risks.filter(r => r.severity === 'Medium-High'),
    medium: risks.filter(r => r.severity === 'Medium'),
    low: risks.filter(r => r.severity === 'Low')
  };
}

function extractRisksByCategory(risks, category) {
  return risks
    .filter(r => r.category === category)
    .map(r => ({
      risk: r.risk,
      severity: r.severity,
      probability: r.probability,
      source: r.source
    }));
}

async function generateMitigationStrategies(categorizedRisks, dealData) {
  const strategies = {};
  
  // High severity risks - immediate action required
  strategies.high_priority = categorizedRisks.high.map(risk => ({
    risk: risk.risk,
    mitigation_strategy: generateSpecificMitigation(risk, 'high'),
    timeline: 'Immediate (0-3 months)',
    responsible_party: determinateResponsibleParty(risk),
    success_metrics: generateSuccessMetrics(risk)
  }));

  // Medium severity risks - planned mitigation
  strategies.medium_priority = [...categorizedRisks.medium_high, ...categorizedRisks.medium].map(risk => ({
    risk: risk.risk,
    mitigation_strategy: generateSpecificMitigation(risk, 'medium'),
    timeline: 'Near-term (3-12 months)',
    responsible_party: determinateResponsibleParty(risk),
    success_metrics: generateSuccessMetrics(risk)
  }));

  // Low severity risks - monitoring required
  strategies.low_priority = categorizedRisks.low.map(risk => ({
    risk: risk.risk,
    mitigation_strategy: generateSpecificMitigation(risk, 'low'),
    timeline: 'Ongoing monitoring',
    responsible_party: determinateResponsibleParty(risk),
    success_metrics: generateSuccessMetrics(risk)
  }));

  return strategies;
}

function generateSpecificMitigation(risk, priority) {
  const riskText = risk.risk.toLowerCase();
  const category = risk.category;
  
  // Market risks
  if (category === 'market') {
    if (riskText.includes('competition')) {
      return 'Develop differentiated value proposition, build customer loyalty programs, accelerate product development cycle';
    }
    if (riskText.includes('demand') || riskText.includes('economic')) {
      return 'Diversify customer base, develop recession-resistant revenue streams, maintain flexible cost structure';
    }
  }
  
  // Financial risks
  if (category === 'financial') {
    if (riskText.includes('cash flow') || riskText.includes('funding')) {
      return 'Establish credit facilities, develop multiple funding sources, implement cash flow forecasting and controls';
    }
    if (riskText.includes('revenue') || riskText.includes('sales')) {
      return 'Diversify revenue streams, improve sales predictability, implement revenue recognition controls';
    }
  }
  
  // Technology risks
  if (category === 'technology') {
    if (riskText.includes('obsolescence') || riskText.includes('disruption')) {
      return 'Invest in R&D, monitor emerging technologies, develop technology partnerships and licensing agreements';
    }
    if (riskText.includes('security') || riskText.includes('cyber')) {
      return 'Implement comprehensive cybersecurity framework, conduct regular security audits, obtain cyber insurance';
    }
  }
  
  // Team risks
  if (category === 'team') {
    if (riskText.includes('key person') || riskText.includes('retention')) {
      return 'Implement equity retention programs, develop succession planning, cross-train critical functions';
    }
    if (riskText.includes('talent') || riskText.includes('hiring')) {
      return 'Develop employer branding, implement competitive compensation packages, create talent pipeline programs';
    }
  }
  
  // Operational risks
  if (category === 'operational') {
    if (riskText.includes('execution') || riskText.includes('scaling')) {
      return 'Implement operational frameworks, hire experienced management, establish KPI monitoring systems';
    }
  }
  
  return 'Develop comprehensive risk management plan with regular monitoring and review processes';
}

function determinateResponsibleParty(risk) {
  switch (risk.category) {
    case 'financial': return 'CFO/Finance Team';
    case 'technology': return 'CTO/Engineering Team';
    case 'market': return 'CEO/Sales Team';
    case 'team': return 'CEO/HR Team';
    case 'operational': return 'COO/Management Team';
    case 'regulatory': return 'Legal/Compliance Team';
    default: return 'Management Team';
  }
}

function generateSuccessMetrics(risk) {
  switch (risk.category) {
    case 'financial':
      return ['Monthly cash flow positive', 'Debt-to-equity ratio <2:1', '12+ months runway maintained'];
    case 'technology':
      return ['99.9% uptime maintained', 'Zero critical security incidents', 'R&D spend >15% of revenue'];
    case 'market':
      return ['Market share maintained/grown', 'Customer churn <5% monthly', 'Net promoter score >50'];
    case 'team':
      return ['Employee turnover <10% annually', 'Key positions filled', 'Employee satisfaction >80%'];
    case 'operational':
      return ['Operational metrics on track', 'Process compliance >95%', 'Quality standards maintained'];
    default:
      return ['Risk indicators within acceptable ranges', 'Regular monitoring completed', 'Mitigation actions executed'];
  }
}

function createMonitoringFramework(categorizedRisks) {
  return {
    monitoring_frequency: {
      high_risks: 'Weekly review',
      medium_risks: 'Monthly review',
      low_risks: 'Quarterly review'
    },
    reporting_structure: {
      board_reporting: 'Monthly risk dashboard for high/medium risks',
      management_reporting: 'Weekly risk status updates',
      investor_reporting: 'Quarterly comprehensive risk report'
    },
    escalation_procedures: {
      trigger_conditions: 'Risk severity increase or mitigation failure',
      escalation_path: 'Management Team → Board → Investors',
      response_timeline: '24-48 hours for high severity risks'
    },
    monitoring_tools: [
      'Risk register with regular updates',
      'KPI dashboards with risk indicators',
      'Early warning systems for critical metrics',
      'Regular risk assessment surveys'
    ]
  };
}

function createContingencyPlans(categorizedRisks, dealData) {
  return {
    financial_contingency: {
      scenario: 'Funding runway drops below 6 months',
      actions: [
        'Activate bridge funding discussions',
        'Implement cost reduction measures',
        'Accelerate revenue collection',
        'Consider strategic partnership or acquisition'
      ]
    },
    market_contingency: {
      scenario: 'Significant market downturn or competitive pressure',
      actions: [
        'Pivot to more resilient market segments',
        'Accelerate product differentiation',
        'Implement defensive pricing strategies',
        'Focus on customer retention and expansion'
      ]
    },
    operational_contingency: {
      scenario: 'Key personnel departure or operational disruption',
      actions: [
        'Activate succession plans',
        'Implement knowledge transfer protocols',
        'Engage interim management resources',
        'Accelerate hiring for critical positions'
      ]
    },
    technology_contingency: {
      scenario: 'Technology failure or security breach',
      actions: [
        'Activate disaster recovery procedures',
        'Implement incident response plan',
        'Engage cybersecurity experts',
        'Communicate with stakeholders and customers'
      ]
    }
  };
}

function generateKeyRiskIndicators(categorizedRisks) {
  return [
    {
      indicator: 'Monthly Cash Burn Rate',
      threshold: '±20% of budget',
      frequency: 'Monthly',
      action: 'Review spending and adjust runway projections'
    },
    {
      indicator: 'Customer Churn Rate',
      threshold: '>5% monthly',
      frequency: 'Monthly',
      action: 'Implement customer retention initiatives'
    },
    {
      indicator: 'Employee Turnover',
      threshold: '>15% annually',
      frequency: 'Quarterly',
      action: 'Review compensation and culture initiatives'
    },
    {
      indicator: 'Revenue Growth Rate',
      threshold: '<20% YoY',
      frequency: 'Monthly',
      action: 'Assess market strategy and execution'
    },
    {
      indicator: 'System Uptime',
      threshold: '<99.5%',
      frequency: 'Weekly',
      action: 'Investigate infrastructure improvements'
    }
  ];
}

function generateGovernanceRecommendations(categorizedRisks, dealData) {
  return [
    'Establish risk committee at board level for oversight',
    'Implement monthly risk reporting to investors',
    'Create cross-functional risk management team',
    'Develop risk appetite framework and tolerance levels',
    'Conduct quarterly risk assessment reviews',
    'Maintain comprehensive risk register with regular updates'
  ];
}

function generateInsuranceRecommendations(risks, dealData) {
  const recommendations = [
    'General liability and professional indemnity insurance',
    'Directors and officers (D&O) insurance coverage',
    'Cyber liability and data breach coverage'
  ];

  if (risks.some(r => r.category === 'technology')) {
    recommendations.push('Technology errors and omissions insurance');
  }

  if (risks.some(r => r.risk.toLowerCase().includes('key person'))) {
    recommendations.push('Key person life and disability insurance');
  }

  return recommendations;
}

function generateDueDiligenceFocus(categorizedRisks) {
  return {
    priority_areas: [
      'Financial controls and cash management systems',
      'Technology infrastructure and security protocols',
      'Management team depth and succession planning',
      'Market position and competitive dynamics',
      'Regulatory compliance and legal structure'
    ],
    recommended_experts: [
      'Financial auditors for accounting and controls review',
      'Technology consultants for security assessment',
      'Industry experts for market validation',
      'Legal counsel for compliance review'
    ]
  };
}

function generateBoardOversightRecommendations(categorizedRisks) {
  return [
    'Monthly risk dashboard reporting to board',
    'Quarterly deep-dive risk assessment presentations',
    'Board committee focused on audit and risk management',
    'Independent directors with relevant risk expertise',
    'Regular executive sessions on risk management',
    'Annual risk management strategy review and approval'
  ];
}

function calculateOverallRiskScore(categorizedRisks) {
  const weights = { high: 4, medium_high: 3, medium: 2, low: 1 };
  const totalScore = 
    categorizedRisks.high.length * weights.high +
    categorizedRisks.medium_high.length * weights.medium_high +
    categorizedRisks.medium.length * weights.medium +
    categorizedRisks.low.length * weights.low;
  
  const totalRisks = Object.values(categorizedRisks).reduce((sum, risks) => sum + risks.length, 0);
  const averageScore = totalRisks > 0 ? totalScore / totalRisks : 0;
  
  if (averageScore >= 3.5) return 'High Risk';
  if (averageScore >= 2.5) return 'Medium-High Risk';
  if (averageScore >= 1.5) return 'Medium Risk';
  return 'Low Risk';
}

function calculateRiskConfidence(allEngineResults, dealData) {
  let confidence = 70; // Base confidence
  
  if (allEngineResults && Object.keys(allEngineResults).length > 3) confidence += 15;
  if (dealData?.industry) confidence += 5;
  if (dealData?.stage) confidence += 5;
  if (dealData?.valuation > 0) confidence += 5;
  
  return Math.min(confidence, 95);
}