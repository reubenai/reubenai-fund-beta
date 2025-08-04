// Enhanced fallback memo generation that leverages available specialist engine data
export function generateEnhancedFallbackMemo(
  dealData: any, 
  fundData: any, 
  sections: any[], 
  analysisData: any, 
  ragData: any, 
  thesisData: any, 
  specialistEngines: any,
  orchestratorData: any
): any {
  console.log('🚀 Generating ENHANCED fallback memo with rich specialist data...');
  
  const memoSections: any = {};
  
  // Extract specialist engine data with comprehensive null checking and error handling
  const safeSpecialistEngines = specialistEngines || {};
  
  const marketData = safeSpecialistEngines.marketResearch?.data || {};
  const managementData = safeSpecialistEngines.management?.data || {};
  const investmentTermsData = safeSpecialistEngines.investmentTerms?.data || {};
  const riskData = safeSpecialistEngines.riskMitigation?.data || {};
  const exitData = safeSpecialistEngines.exitStrategy?.data || {};
  
  // Add validation logging
  console.log('📊 Specialist engine data validation:', {
    marketData: !!marketData && Object.keys(marketData).length > 0,
    managementData: !!managementData && Object.keys(managementData).length > 0,
    investmentTermsData: !!investmentTermsData && Object.keys(investmentTermsData).length > 0,
    riskData: !!riskData && Object.keys(riskData).length > 0,
    exitData: !!exitData && Object.keys(exitData).length > 0
  });
  
  // Generate enhanced content for each section with error handling
  sections.forEach(section => {
    try {
      switch (section.key) {
        case 'executive_summary':
          memoSections[section.key] = generateExecutiveSummary(dealData, analysisData, ragData, thesisData, orchestratorData);
          break;
      
      case 'company_overview':
        memoSections[section.key] = generateCompanyOverview(dealData, analysisData);
        break;
      
      case 'market_opportunity':
        memoSections[section.key] = generateMarketOpportunity(dealData, marketData, analysisData);
        break;
      
      case 'financial_analysis':
        memoSections[section.key] = generateFinancialAnalysis(dealData, analysisData, orchestratorData);
        break;
      
      case 'management_team':
        memoSections[section.key] = generateManagementTeam(dealData, managementData, analysisData);
        break;
      
      case 'product_service':
        memoSections[section.key] = generateProductService(dealData, analysisData);
        break;
      
      case 'business_model':
        memoSections[section.key] = generateBusinessModel(dealData, analysisData);
        break;
      
      case 'investment_terms':
        memoSections[section.key] = generateInvestmentTerms(dealData, investmentTermsData);
        break;
      
      case 'risks_mitigants':
        memoSections[section.key] = generateRisksAndMitigants(dealData, riskData, orchestratorData);
        break;
      
      case 'exit_strategy':
        memoSections[section.key] = generateExitStrategy(dealData, exitData, orchestratorData);
        break;
      
      case 'competitive_landscape':
        memoSections[section.key] = generateCompetitiveLandscape(dealData, marketData, analysisData);
        break;
      
      case 'investment_recommendation':
        memoSections[section.key] = generateInvestmentRecommendation(dealData, ragData, thesisData, orchestratorData);
        break;
      
        default:
          memoSections[section.key] = `${section.title} analysis for ${dealData.company_name}: Comprehensive evaluation pending. This section will be populated with detailed analysis based on specialist engine assessments and validated market data.`;
      }
    } catch (error) {
      console.error(`❌ Error generating section ${section.key}:`, error);
      memoSections[section.key] = `${section.title} analysis for ${dealData.company_name}: Section generation temporarily unavailable. Data processing will resume shortly.`;
    }
  });
  
  return {
    content: {
      ...memoSections,
      generated_at: new Date().toISOString(),
      enhanced_fallback_mode: true,
      data_sources: {
        deal_analysis: !!analysisData,
        orchestrator: !!orchestratorData,
        rag_assessment: !!ragData,
        thesis_alignment: !!thesisData,
        market_research: !!marketData,
        management_assessment: !!managementData,
        investment_terms: !!investmentTermsData,
        risk_mitigation: !!riskData,
        exit_strategy: !!exitData
      }
    },
    executive_summary: generateExecutiveSummary(dealData, analysisData, ragData, thesisData, orchestratorData),
    investment_recommendation: generateInvestmentRecommendation(dealData, ragData, thesisData, orchestratorData)
  };
}

function generateExecutiveSummary(dealData: any, analysisData: any, ragData: any, thesisData: any, orchestratorData: any): string {
  const dealSize = dealData.deal_size ? `$${(dealData.deal_size / 1000000).toFixed(1)}M` : 'TBD';
  const valuation = dealData.valuation ? `$${(dealData.valuation / 1000000).toFixed(1)}M` : 'TBD';
  const overallScore = dealData.overall_score || 'Pending';
  const ragStatus = ragData?.ragStatus || dealData.rag_status || 'Under review';
  const thesisScore = thesisData?.alignment_score ? `${thesisData.alignment_score}/100 thesis alignment` : 'thesis alignment pending';
  
  const keyInsights = orchestratorData?.opportunities?.slice(0, 2) || [];
  const keyRisks = orchestratorData?.risks?.slice(0, 2) || [];
  
  let summary = `Investment Analysis: ${dealData.company_name}, ${dealData.industry || 'technology'} company based in ${dealData.location || 'undisclosed location'}. `;
  summary += `Deal Structure: ${dealSize} investment at ${valuation} valuation. `;
  summary += `Assessment: ${overallScore}/100 overall score, ${ragStatus} RAG status, ${thesisScore}. `;
  
  if (keyInsights.length > 0) {
    summary += `Key Opportunities: ${keyInsights.join(', ')}. `;
  }
  
  if (keyRisks.length > 0) {
    summary += `Primary Risks: ${keyRisks.join(', ')}. `;
  }
  
  summary += `Recommendation: ${parseInt(overallScore) >= 70 ? 'Proceed with detailed due diligence' : 'Requires enhanced evaluation before proceeding'}.`;
  
  return summary;
}

function generateCompanyOverview(dealData: any, analysisData: any): string {
  let overview = `${dealData.company_name} is a ${dealData.industry || 'technology'} company `;
  overview += `${dealData.location ? `headquartered in ${dealData.location}` : 'with global operations'}. `;
  
  if (dealData.description) {
    overview += `Business Focus: ${dealData.description} `;
  }
  
  if (dealData.business_model) {
    overview += `Business Model: ${dealData.business_model}. `;
  }
  
  if (dealData.employee_count) {
    overview += `Team Size: ${dealData.employee_count} employees. `;
  }
  
  if (dealData.founder) {
    overview += `Leadership: Founded by ${dealData.founder}. `;
  }
  
  if (dealData.website) {
    overview += `Digital Presence: ${dealData.website}. `;
  }
  
  if (analysisData?.product_score) {
    overview += `Product Maturity: ${analysisData.product_score}/100 assessment score. `;
  }
  
  overview += `The company represents ${dealData.industry ? `a strategic opportunity in the ${dealData.industry} sector` : 'an emerging market opportunity'} with ${dealData.overall_score ? (parseInt(dealData.overall_score) >= 70 ? 'strong' : 'developing') : 'assessed'} fundamentals.`;
  
  return overview;
}

function generateMarketOpportunity(dealData: any, marketData: any, analysisData: any): string {
  let market = `Market Analysis for ${dealData.industry || 'Technology'} Sector: `;
  
  // Use market research engine data if available
  if (marketData.market_size && marketData.market_size !== 'N/A') {
    market += `Total Addressable Market: ${marketData.market_size}. `;
  } else {
    market += `Market sizing analysis in progress for ${dealData.industry || 'target'} sector. `;
  }
  
  if (marketData.growth_rate && marketData.growth_rate !== 'N/A') {
    market += `Growth Rate: ${marketData.growth_rate}. `;
  }
  
  if (marketData.competitive_landscape && marketData.competitive_landscape !== 'N/A') {
    market += `Competitive Environment: ${marketData.competitive_landscape.substring(0, 150)}... `;
  }
  
  if (marketData.market_trends && Array.isArray(marketData.market_trends)) {
    market += `Key Trends: ${marketData.market_trends.slice(0, 3).join(', ')}. `;
  }
  
  if (analysisData?.market_score) {
    market += `Market Attractiveness Score: ${analysisData.market_score}/100. `;
  }
  
  if (dealData.location) {
    market += `Geographic Focus: ${dealData.location} provides ${dealData.location.includes('Silicon Valley') || dealData.location.includes('San Francisco') ? 'premium' : 'strategic'} market access. `;
  }
  
  market += `Market Validation: ${marketData.market_size ? 'Initial validation complete' : 'Requires comprehensive market research'} with ${marketData.confidence ? `${marketData.confidence}% confidence` : 'ongoing validation'} in market assumptions.`;
  
  return market;
}

function generateFinancialAnalysis(dealData: any, analysisData: any, orchestratorData: any): string {
  let financial = `Financial Assessment: `;
  
  if (dealData.deal_size) {
    financial += `Investment Amount: $${(dealData.deal_size / 1000000).toFixed(1)}M. `;
  }
  
  if (dealData.valuation) {
    financial += `Pre-money Valuation: $${(dealData.valuation / 1000000).toFixed(1)}M. `;
  }
  
  if (dealData.deal_size && dealData.valuation) {
    const ownership = ((dealData.deal_size / (dealData.valuation + dealData.deal_size)) * 100).toFixed(1);
    financial += `Ownership Stake: ~${ownership}%. `;
  }
  
  if (analysisData?.financial_score) {
    financial += `Financial Health Score: ${analysisData.financial_score}/100. `;
  }
  
  if (orchestratorData?.financial_metrics) {
    financial += `Key Metrics: ${Object.entries(orchestratorData.financial_metrics).map(([key, value]) => `${key}: ${value}`).join(', ')}. `;
  }
  
  financial += `Revenue Model: ${dealData.business_model || 'Business model validation required'}. `;
  
  if (dealData.currency && dealData.currency !== 'USD') {
    financial += `Currency: All figures in ${dealData.currency}. `;
  }
  
  financial += `Financial Due Diligence: ${analysisData?.financial_score >= 70 ? 'Preliminary metrics favorable' : 'Comprehensive financial review required'} including revenue validation, unit economics assessment, and growth trajectory analysis.`;
  
  return financial;
}

function generateManagementTeam(dealData: any, managementData: any, analysisData: any): string {
  let team = `Management Team Assessment: `;
  
  if (dealData.founder) {
    team += `Founder/CEO: ${dealData.founder}. `;
  }
  
  if (managementData.team_analysis) {
    team += `Team Evaluation: ${managementData.team_analysis.substring(0, 200)}... `;
  }
  
  if (managementData.founder_score) {
    team += `Founder Assessment: ${managementData.founder_score}/100. `;
  }
  
  if (analysisData?.leadership_score) {
    team += `Leadership Strength: ${analysisData.leadership_score}/100. `;
  }
  
  if (dealData.employee_count) {
    team += `Current Team: ${dealData.employee_count} employees across ${dealData.employee_count > 50 ? 'multiple departments' : 'core functions'}. `;
  }
  
  if (managementData.experience_assessment) {
    team += `Experience Profile: ${managementData.experience_assessment}. `;
  }
  
  team += `Team Depth: ${analysisData?.leadership_score >= 70 ? 'Strong leadership team with relevant experience' : 'Team assessment ongoing with focus on domain expertise and execution capability'}. `;
  
  team += `Key Personnel Review: ${managementData.founder_score ? 'Initial leadership assessment complete' : 'Comprehensive management interviews and reference checks required'} for investment committee evaluation.`;
  
  return team;
}

function generateProductService(dealData: any, analysisData: any): string {
  let product = `Product & Technology Analysis: `;
  
  if (dealData.description) {
    product += `Core Offering: ${dealData.description} `;
  }
  
  if (analysisData?.product_score) {
    product += `Product Assessment: ${analysisData.product_score}/100. `;
  }
  
  if (analysisData?.product_notes) {
    product += `Key Insights: ${analysisData.product_notes.substring(0, 150)}... `;
  }
  
  product += `Technology Stack: ${analysisData?.product_score >= 70 ? 'Robust technical foundation' : 'Technology assessment in progress'}. `;
  
  if (dealData.business_model) {
    product += `Product Market Fit: ${dealData.business_model.includes('SaaS') ? 'Software-as-a-Service model' : 'Product-market validation ongoing'}. `;
  }
  
  product += `Competitive Differentiation: ${analysisData?.product_score >= 70 ? 'Clear technical advantages identified' : 'Differentiation analysis required'}. `;
  
  product += `Development Roadmap: ${analysisData?.product_score ? 'Product development trajectory assessed' : 'Technical roadmap review required'} including scalability, IP protection, and innovation pipeline evaluation.`;
  
  return product;
}

function generateBusinessModel(dealData: any, analysisData: any): string {
  let business = `Business Model Analysis: `;
  
  if (dealData.business_model) {
    business += `Revenue Model: ${dealData.business_model}. `;
  }
  
  if (dealData.business_model?.includes('SaaS')) {
    business += `SaaS Metrics: Subscription-based revenue model with recurring revenue streams. `;
  } else if (dealData.business_model?.includes('marketplace')) {
    business += `Marketplace Dynamics: Platform-based model with network effects potential. `;
  }
  
  business += `Scalability Assessment: ${dealData.business_model ? 'Business model scalability under evaluation' : 'Revenue model validation required'}. `;
  
  if (analysisData?.financial_score) {
    business += `Unit Economics: ${analysisData.financial_score >= 70 ? 'Preliminary metrics indicate viable unit economics' : 'Unit economics validation required'}. `;
  }
  
  business += `Go-to-Market: ${dealData.industry ? `${dealData.industry} sector strategy` : 'Market entry strategy'} with ${dealData.location ? `${dealData.location} market focus` : 'geographic expansion planning'}. `;
  
  business += `Revenue Streams: ${dealData.business_model ? 'Primary revenue model identified' : 'Multiple revenue stream analysis pending'} with ${analysisData?.financial_score >= 60 ? 'sustainable growth potential' : 'monetization strategy validation required'}.`;
  
  return business;
}

function generateInvestmentTerms(dealData: any, investmentTermsData: any): string {
  let terms = `Investment Terms Structure: `;
  
  if (dealData.deal_size) {
    terms += `Investment Amount: $${(dealData.deal_size / 1000000).toFixed(1)}M. `;
  }
  
  if (dealData.valuation) {
    terms += `Pre-money Valuation: $${(dealData.valuation / 1000000).toFixed(1)}M. `;
  }
  
  if (investmentTermsData.recommended_structure) {
    terms += `Recommended Structure: ${investmentTermsData.recommended_structure}. `;
  }
  
  if (investmentTermsData.equity_percentage) {
    terms += `Equity Stake: ${investmentTermsData.equity_percentage}%. `;
  }
  
  terms += `Security Type: ${investmentTermsData.security_type || 'Preferred equity (standard VC terms)'}. `;
  
  if (investmentTermsData.board_composition) {
    terms += `Board Rights: ${investmentTermsData.board_composition}. `;
  }
  
  terms += `Liquidation Preference: ${investmentTermsData.liquidation_preference || '1x non-participating preferred'}. `;
  
  terms += `Anti-dilution: ${investmentTermsData.anti_dilution || 'Weighted average broad-based'}. `;
  
  terms += `Terms Negotiation: ${investmentTermsData.recommended_structure ? 'Preliminary terms structure identified' : 'Detailed terms negotiation required'} including investor rights, information rights, and exit provisions.`;
  
  return terms;
}

function generateRisksAndMitigants(dealData: any, riskData: any, orchestratorData: any): string {
  let risks = `Risk Assessment & Mitigation: `;
  
  // Robust null checking and type validation
  const safeRiskData = riskData || {};
  const safeOrchestratorData = orchestratorData || {};
  
  if (safeRiskData.risk_score && typeof safeRiskData.risk_score === 'number') {
    risks += `Overall Risk Score: ${safeRiskData.risk_score}/100. `;
  }
  
  // Handle primary risks with comprehensive type checking
  if (safeRiskData.primary_risks && Array.isArray(safeRiskData.primary_risks) && safeRiskData.primary_risks.length > 0) {
    const validRisks = safeRiskData.primary_risks.filter(risk => risk && typeof risk === 'string').slice(0, 3);
    if (validRisks.length > 0) {
      risks += `Primary Risk Factors: ${validRisks.join(', ')}. `;
    }
  } else if (safeOrchestratorData.risks && Array.isArray(safeOrchestratorData.risks) && safeOrchestratorData.risks.length > 0) {
    const validRisks = safeOrchestratorData.risks.filter(risk => risk && typeof risk === 'string').slice(0, 3);
    if (validRisks.length > 0) {
      risks += `Identified Risks: ${validRisks.join(', ')}. `;
    }
  }
  
  // Comprehensive mitigation strategies handling
  if (safeRiskData.mitigation_strategies) {
    try {
      let mitigationStr = '';
      if (typeof safeRiskData.mitigation_strategies === 'string') {
        mitigationStr = safeRiskData.mitigation_strategies;
      } else if (Array.isArray(safeRiskData.mitigation_strategies)) {
        mitigationStr = safeRiskData.mitigation_strategies.filter(strategy => strategy && typeof strategy === 'string').join(', ');
      } else if (typeof safeRiskData.mitigation_strategies === 'object') {
        mitigationStr = JSON.stringify(safeRiskData.mitigation_strategies);
      } else {
        mitigationStr = String(safeRiskData.mitigation_strategies);
      }
      
      if (mitigationStr && mitigationStr.length > 0) {
        risks += `Mitigation Strategies: ${mitigationStr.substring(0, 150)}... `;
      }
    } catch (error) {
      console.warn('⚠️ Error processing mitigation strategies:', error);
      risks += `Mitigation Strategies: Risk mitigation analysis in progress. `;
    }
  }
  
  risks += `Market Risk: ${dealData.industry} sector volatility and competitive dynamics. `;
  
  risks += `Execution Risk: ${dealData.employee_count ? (dealData.employee_count < 20 ? 'Early-stage team scaling challenges' : 'Operational scaling complexity') : 'Team execution capability assessment required'}. `;
  
  risks += `Financial Risk: ${dealData.deal_size ? `$${(dealData.deal_size / 1000000).toFixed(1)}M capital efficiency and burn rate management` : 'Capital requirements and runway assessment'}. `;
  
  if (riskData.regulatory_assessment) {
    risks += `Regulatory Risk: ${riskData.regulatory_assessment}. `;
  }
  
  risks += `Risk Mitigation: ${riskData.risk_score <= 60 ? 'Comprehensive risk management plan recommended' : 'Standard risk monitoring protocols applicable'} with quarterly review and contingency planning.`;
  
  return risks;
}

function generateExitStrategy(dealData: any, exitData: any, orchestratorData: any): string {
  let exit = `Exit Strategy Analysis: `;
  
  if (exitData.primary_exit_path) {
    exit += `Primary Exit Path: ${exitData.primary_exit_path}. `;
  }
  
  if (exitData.exit_timeline) {
    exit += `Expected Timeline: ${exitData.exit_timeline} years. `;
  }
  
  if (exitData.exit_multiple) {
    exit += `Target Multiple: ${exitData.exit_multiple}x. `;
  }
  
  exit += `Strategic Acquirers: ${dealData.industry} sector consolidation with potential acquirers in ${dealData.industry || 'technology'} space. `;
  
  if (exitData.ipo_potential) {
    exit += `IPO Potential: ${exitData.ipo_potential}. `;
  }
  
  exit += `Exit Valuation: ${dealData.valuation ? `Current $${(dealData.valuation / 1000000).toFixed(1)}M valuation provides ${exitData.exit_multiple || '3-5'}x exit potential` : 'Exit valuation modeling in progress'}. `;
  
  if (orchestratorData?.exit_scenarios) {
    exit += `Exit Scenarios: ${orchestratorData.exit_scenarios.slice(0, 2).join(', ')}. `;
  }
  
  exit += `Market Conditions: ${dealData.industry} sector ${exitData.market_conditions || 'exit environment assessment'} with ${exitData.exit_timeline || '3-7'} year investment horizon. `;
  
  exit += `Return Projections: ${exitData.primary_exit_path ? 'Exit strategy modeling complete' : 'Comprehensive exit analysis required'} including multiple scenario planning and market timing considerations.`;
  
  return exit;
}

function generateCompetitiveLandscape(dealData: any, marketData: any, analysisData: any): string {
  let competitive = `Competitive Landscape Analysis: `;
  
  if (marketData.competitive_landscape && marketData.competitive_landscape !== 'N/A') {
    competitive += `Market Position: ${marketData.competitive_landscape.substring(0, 200)}... `;
  }
  
  competitive += `${dealData.industry || 'Technology'} Sector Competition: ${marketData.competitive_landscape ? 'Competitive analysis completed' : 'Comprehensive competitive mapping in progress'}. `;
  
  if (analysisData?.market_score) {
    competitive += `Competitive Strength: ${analysisData.market_score}/100 market position assessment. `;
  }
  
  competitive += `Direct Competitors: ${marketData.direct_competitors || 'Competitor identification and analysis ongoing'}. `;
  
  competitive += `Competitive Advantages: ${dealData.description ? 'Product differentiation assessed' : 'Competitive differentiation analysis required'}. `;
  
  if (marketData.market_share_analysis) {
    competitive += `Market Share: ${marketData.market_share_analysis}. `;
  }
  
  competitive += `Barriers to Entry: ${marketData.barriers_to_entry || dealData.industry ? `${dealData.industry} sector entry barriers assessment` : 'Market entry barriers evaluation required'}. `;
  
  competitive += `Competitive Moat: ${analysisData?.market_score >= 70 ? 'Sustainable competitive advantages identified' : 'Competitive positioning validation required'} with ongoing competitive intelligence and market monitoring.`;
  
  return competitive;
}

function generateInvestmentRecommendation(dealData: any, ragData: any, thesisData: any, orchestratorData: any): string {
  const overallScore = dealData.overall_score || 0;
  const ragStatus = ragData?.ragStatus || dealData.rag_status || 'needs_review';
  const thesisScore = thesisData?.alignment_score || 0;
  
  let recommendation = `INVESTMENT RECOMMENDATION: `;
  
  if (overallScore >= 85) {
    recommendation += `STRONG BUY - PROCEED TO TERM SHEET. `;
  } else if (overallScore >= 70) {
    recommendation += `BUY - PROCEED WITH DUE DILIGENCE. `;
  } else if (overallScore >= 50) {
    recommendation += `HOLD - REQUIRES ADDITIONAL EVALUATION. `;
  } else {
    recommendation += `PASS - INSUFFICIENT ALIGNMENT WITH INVESTMENT CRITERIA. `;
  }
  
  recommendation += `${dealData.company_name} presents ${overallScore >= 70 ? 'a compelling' : 'an emerging'} investment opportunity with ${overallScore}/100 overall assessment score. `;
  
  recommendation += `RAG Analysis: ${ragStatus.toUpperCase()} status with ${ragData?.confidence || 'moderate'} confidence in assessment. `;
  
  if (thesisScore > 0) {
    recommendation += `Thesis Alignment: ${thesisScore}/100 alignment with fund investment criteria${thesisScore >= 70 ? ' - strong strategic fit' : ' - requires strategic evaluation'}. `;
  }
  
  if (orchestratorData?.recommendation) {
    recommendation += `AI Assessment: ${orchestratorData.recommendation}. `;
  }
  
  recommendation += `Next Steps: ${overallScore >= 70 ? '1) Proceed to detailed due diligence, 2) Schedule management presentations, 3) Conduct financial and technical review' : '1) Address key evaluation gaps, 2) Enhanced market validation, 3) Management team assessment'}. `;
  
  recommendation += `Investment Rationale: ${dealData.industry} sector opportunity with ${dealData.valuation ? `$${(dealData.valuation / 1000000).toFixed(1)}M valuation entry point` : 'competitive valuation'} and ${overallScore >= 70 ? 'strong' : 'developing'} execution potential for target returns.`;
  
  return recommendation;
}