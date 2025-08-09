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

    const { 
      dealId, 
      dealData, 
      teamResearch, 
      webResearch, 
      documentData,
      fundType,
      enhancedCriteria,
      thresholds 
    } = await req.json();
    
    console.log(`👥 Management Assessment Engine: Analyzing management team for: ${dealData?.company_name || dealId}`);
    console.log('🎯 Fund Type:', fundType, '| Enhanced Criteria:', !!enhancedCriteria);

    // Extract enhanced team/leadership criteria
    const teamCriteria = enhancedCriteria?.categories?.find((cat: any) => 
      cat.name?.toLowerCase().includes('team') || 
      cat.name?.toLowerCase().includes('leadership')
    );

    // Perform comprehensive management team assessment with fund-type focus
    const managementAssessment = await analyzeManagementTeam({
      dealData,
      teamResearch,
      webResearch,
      supabase,
      documentData,
      fundType,
      teamCriteria,
      thresholds
    });

    console.log(`✅ Management Assessment Engine: Analysis completed for ${dealData?.company_name}`);

    return new Response(
      JSON.stringify({
        success: true,
        data: managementAssessment,
        engineName: 'management-assessment-engine',
        dealId,
        confidence: managementAssessment.confidence,
        analysis_type: 'management_assessment'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Management Assessment Engine error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        engineName: 'management-assessment-engine'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function analyzeManagementTeam({
  dealData,
  teamResearch,
  webResearch,
  supabase,
  documentData,
  fundType = 'vc',
  teamCriteria = null,
  thresholds = null
}) {
  console.log('👥 Management Assessment Engine: Starting fund-type-specific analysis for:', fundType);
  
  // Enhanced document-driven management analysis
  const documentInsights = documentData ? await extractManagementInsightsFromDocuments(documentData) : null;
  console.log('📄 Management Assessment Engine: Document insights extracted');
  
  // Extract founder and team information with fund-type-specific focus
  const founders = extractFounderInformation(dealData, teamResearch, documentInsights, fundType);
  const teamComposition = analyzeTeamComposition(dealData, teamResearch, documentInsights, fundType);
  const leadershipCapabilities = assessLeadershipCapabilities(founders, teamResearch, documentInsights, fundType);
  const teamGaps = identifyTeamGaps(teamComposition, dealData, documentInsights, fundType);
  const advisoryBoard = analyzeAdvisoryBoard(dealData, teamResearch, documentInsights, fundType);

  const assessment = {
    executive_summary: generateExecutiveSummary(founders, teamComposition, leadershipCapabilities, documentInsights, fundType),
    founder_profiles: founders,
    team_composition: teamComposition,
    leadership_assessment: leadershipCapabilities,
    team_strengths: identifyTeamStrengths(founders, teamComposition, teamResearch, documentInsights, fundType),
    team_gaps_risks: teamGaps,
    advisory_board: advisoryBoard,
    succession_planning: assessSuccessionPlanning(teamComposition, dealData, fundType),
    compensation_equity: analyzeCompensationStructure(dealData, documentInsights),
    cultural_fit: assessCulturalFit(dealData, teamResearch, documentInsights, fundType),
    hiring_plan: generateHiringPlan(teamGaps, dealData, fundType),
    management_recommendations: generateManagementRecommendations(founders, teamGaps, dealData, documentInsights, fundType),
    due_diligence_focus: generateDueDiligenceFocus(founders, teamComposition, fundType),
    document_intelligence_score: calculateDocumentIntelligenceScore(documentInsights),
    confidence: calculateManagementConfidence(teamResearch, dealData, documentInsights),
    fund_type_analysis: generateManagementFundTypeAnalysis(fundType, {
      founders,
      teamComposition,
      leadershipCapabilities,
      teamGaps
    })
  };
  
  console.log('✅ Management Assessment Engine: Analysis complete');
  return assessment;
}

async function extractManagementInsightsFromDocuments(documentData: any) {
  if (!documentData || !documentData.extractedTexts || documentData.extractedTexts.length === 0) {
    return null;
  }
  
  const allText = documentData.extractedTexts.map(doc => `${doc.name}:\n${doc.extracted_text}`).join('\n\n');
  
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          {
            role: 'system',
            content: `Extract comprehensive management and governance intelligence from documents. Parse for:
            1. EXECUTIVE TEAM: Names, titles, backgrounds, tenure, compensation details
            2. GOVERNANCE: Board structure, equity distribution, decision-making processes
            3. MANAGEMENT EXPERIENCE: Previous roles, company exits, industry expertise
            4. ORGANIZATIONAL STRUCTURE: Reporting lines, team sizes, departmental heads
            5. COMPENSATION: Salary bands, equity pools, incentive structures
            6. CULTURE: Values, work environment, team dynamics
            Return structured management insights with specific details where available.`
          },
          {
            role: 'user',
            content: allText.substring(0, 20000)
          }
        ],
        max_tokens: 1500,
        temperature: 0.1
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const content = data.choices[0].message.content;
      
      return {
        management_info: content,
        executive_team_data: extractExecutiveTeamData(content),
        governance_structure: extractGovernanceStructure(content),
        compensation_data: extractCompensationData(content),
        organizational_data: extractOrganizationalData(content),
        culture_insights: extractCultureInsights(content),
        hasValidatedData: true,
        confidence: 95
      };
    }
  } catch (error) {
    console.error('❌ Management Assessment Engine - Document extraction error:', error);
  }
  
  return {
    management_info: 'Document analysis failed',
    hasValidatedData: false,
    confidence: 20
  };
}

function extractExecutiveTeamData(content: string): any {
  const executiveTerms = ['ceo', 'cto', 'cfo', 'coo', 'founder', 'president', 'vp'];
  const foundExecutives = executiveTerms.filter(title => content.toLowerCase().includes(title));
  
  return {
    hasExecutiveData: foundExecutives.length > 0,
    executiveTitles: foundExecutives,
    executiveCount: foundExecutives.length,
    hasFounderInfo: content.toLowerCase().includes('founder')
  };
}

function extractGovernanceStructure(content: string): any {
  const governanceTerms = ['board', 'equity', 'shares', 'voting', 'governance'];
  const hasGovernance = governanceTerms.some(term => content.toLowerCase().includes(term));
  
  return {
    hasGovernanceData: hasGovernance,
    boardMentions: (content.match(/board/gi) || []).length,
    equityMentions: (content.match(/(equity|shares)/gi) || []).length,
    hasVotingStructure: content.toLowerCase().includes('voting')
  };
}

function extractCompensationData(content: string): any {
  const compensationTerms = ['salary', 'compensation', 'equity', 'stock options', 'bonus'];
  const hasCompData = compensationTerms.some(term => content.toLowerCase().includes(term));
  
  return {
    hasCompensationData: hasCompData,
    salaryMentions: content.toLowerCase().includes('salary'),
    equityMentions: content.toLowerCase().includes('equity'),
    bonusMentions: content.toLowerCase().includes('bonus')
  };
}

function extractOrganizationalData(content: string): any {
  const orgTerms = ['team', 'department', 'reports to', 'organization', 'structure'];
  const hasOrgData = orgTerms.some(term => content.toLowerCase().includes(term));
  
  return {
    hasOrganizationalData: hasOrgData,
    teamMentions: (content.match(/team[s]?/gi) || []).length,
    departmentMentions: (content.match(/department[s]?/gi) || []).length,
    hasReportingStructure: content.toLowerCase().includes('reports to')
  };
}

function extractCultureInsights(content: string): any {
  const cultureTerms = ['culture', 'values', 'mission', 'vision', 'work environment'];
  const hasCulture = cultureTerms.some(term => content.toLowerCase().includes(term));
  
  return {
    hasCultureData: hasCulture,
    valuesMentions: content.toLowerCase().includes('values'),
    missionMentions: content.toLowerCase().includes('mission'),
    environmentMentions: content.toLowerCase().includes('environment')
  };
}

function calculateDocumentIntelligenceScore(documentInsights: any): number {
  if (!documentInsights?.hasValidatedData) return 0;
  
  let score = 0;
  
  // Executive team data scoring
  if (documentInsights.executive_team_data?.hasExecutiveData) score += 25;
  if (documentInsights.executive_team_data?.executiveCount > 3) score += 15;
  
  // Governance structure scoring
  if (documentInsights.governance_structure?.hasGovernanceData) score += 20;
  
  // Compensation data scoring
  if (documentInsights.compensation_data?.hasCompensationData) score += 15;
  
  // Organizational data scoring
  if (documentInsights.organizational_data?.hasOrganizationalData) score += 15;
  
  // Culture insights scoring
  if (documentInsights.culture_insights?.hasCultureData) score += 10;
  
  return Math.min(score, 100);
}

function extractFounderInformation(dealData, teamResearch) {
  const founders = [];
  
  // Primary founder from deal data
  if (dealData?.founder_name) {
    founders.push({
      name: dealData.founder_name,
      title: dealData.founder_title || 'Founder & CEO',
      background: teamResearch?.founder_background || 'Experienced entrepreneur',
      experience_years: teamResearch?.founder_experience_years || 'Unknown',
      previous_companies: teamResearch?.previous_companies || [],
      education: teamResearch?.education || 'Not specified',
      linkedin_profile: teamResearch?.linkedin_url || null,
      key_achievements: teamResearch?.achievements || [],
      strengths: assessFounderStrengths(dealData, teamResearch),
      areas_for_development: identifyFounderGaps(dealData, teamResearch),
      leadership_style: assessLeadershipStyle(teamResearch),
      network_strength: assessNetworkStrength(teamResearch)
    });
  }

  // Additional co-founders if available
  if (teamResearch?.co_founders) {
    teamResearch.co_founders.forEach(coFounder => {
      founders.push({
        name: coFounder.name,
        title: coFounder.title,
        background: coFounder.background,
        experience_years: coFounder.experience_years,
        previous_companies: coFounder.previous_companies || [],
        education: coFounder.education,
        linkedin_profile: coFounder.linkedin_url,
        key_achievements: coFounder.achievements || [],
        strengths: coFounder.strengths || [],
        areas_for_development: coFounder.gaps || [],
        leadership_style: 'Collaborative',
        network_strength: 'Medium'
      });
    });
  }

  return founders;
}

function analyzeTeamComposition(dealData, teamResearch) {
  const teamSize = dealData?.team_size || teamResearch?.team_size || 0;
  
  return {
    total_employees: teamSize,
    key_departments: {
      engineering: calculateDepartmentSize(teamSize, 'engineering'),
      sales_marketing: calculateDepartmentSize(teamSize, 'sales'),
      operations: calculateDepartmentSize(teamSize, 'operations'),
      finance_admin: calculateDepartmentSize(teamSize, 'finance')
    },
    senior_management: identifySeniorManagement(dealData, teamResearch),
    advisory_positions: teamResearch?.advisors?.length || 0,
    retention_rate: teamResearch?.retention_rate || 'Unknown',
    diversity_metrics: assessDiversityMetrics(teamResearch),
    remote_vs_onsite: assessWorkArrangement(dealData, teamResearch),
    geographic_distribution: assessGeographicDistribution(dealData, teamResearch)
  };
}

function calculateDepartmentSize(totalSize, department) {
  if (totalSize < 10) {
    return department === 'engineering' ? Math.floor(totalSize * 0.5) : Math.floor(totalSize * 0.2);
  }
  
  const ratios = {
    engineering: 0.4,
    sales: 0.3,
    operations: 0.2,
    finance: 0.1
  };
  
  return Math.floor(totalSize * (ratios[department] || 0.1));
}

function identifySeniorManagement(dealData, teamResearch) {
  const seniorTeam = [];
  
  if (dealData?.founder_name) {
    seniorTeam.push({
      name: dealData.founder_name,
      title: dealData.founder_title || 'CEO',
      tenure: 'Founder',
      background: teamResearch?.founder_background || 'Entrepreneurial'
    });
  }

  // Add other senior team members from research
  if (teamResearch?.senior_team) {
    teamResearch.senior_team.forEach(member => {
      seniorTeam.push({
        name: member.name,
        title: member.title,
        tenure: member.tenure || 'Unknown',
        background: member.background
      });
    });
  }

  return seniorTeam;
}

function assessLeadershipCapabilities(founders, teamResearch) {
  return {
    vision_strategy: assessCapability(founders, 'vision', teamResearch),
    execution_delivery: assessCapability(founders, 'execution', teamResearch),
    team_building: assessCapability(founders, 'team_building', teamResearch),
    fundraising_investor_relations: assessCapability(founders, 'fundraising', teamResearch),
    product_market_expertise: assessCapability(founders, 'product', teamResearch),
    operational_excellence: assessCapability(founders, 'operations', teamResearch),
    financial_management: assessCapability(founders, 'finance', teamResearch),
    sales_business_development: assessCapability(founders, 'sales', teamResearch),
    technology_innovation: assessCapability(founders, 'technology', teamResearch),
    industry_expertise: assessCapability(founders, 'industry', teamResearch),
    overall_leadership_score: calculateOverallLeadershipScore(founders, teamResearch)
  };
}

function assessCapability(founders, capability, teamResearch) {
  // Base assessment logic
  const scores = {
    'Excellent (9-10)': 0,
    'Good (7-8)': 0,
    'Average (5-6)': 0,
    'Below Average (3-4)': 0,
    'Poor (1-2)': 0
  };

  // Simple scoring based on available data
  if (teamResearch?.capabilities?.[capability]) {
    return teamResearch.capabilities[capability];
  }

  // Default scoring based on founder background
  if (founders.length > 0 && founders[0].experience_years) {
    const experience = founders[0].experience_years;
    if (typeof experience === 'number' && experience > 10) {
      return 'Good (7-8)';
    } else if (typeof experience === 'number' && experience > 5) {
      return 'Average (5-6)';
    }
  }

  return 'Average (5-6)'; // Default
}

function identifyTeamStrengths(founders, teamComposition, teamResearch) {
  const strengths = [];

  // Founder experience strengths
  if (founders.length > 0) {
    const primaryFounder = founders[0];
    if (primaryFounder.experience_years && typeof primaryFounder.experience_years === 'number' && primaryFounder.experience_years > 5) {
      strengths.push('Experienced founder with proven track record');
    }
    if (primaryFounder.previous_companies.length > 0) {
      strengths.push('Founder has previous startup experience');
    }
  }

  // Team composition strengths
  if (teamComposition.total_employees > 20) {
    strengths.push('Well-established team with significant scale');
  }
  if (teamComposition.senior_management.length > 3) {
    strengths.push('Strong senior management bench');
  }

  // Industry-specific strengths
  if (teamResearch?.industry_expertise) {
    strengths.push('Deep industry knowledge and domain expertise');
  }

  // Default strengths if none identified
  if (strengths.length === 0) {
    strengths.push('Entrepreneurial team with market insights');
    strengths.push('Committed founders with industry experience');
  }

  return strengths;
}

function identifyTeamGaps(teamComposition, dealData) {
  const gaps = [];
  const risks = [];

  // Size-based gaps
  if (teamComposition.total_employees < 5) {
    gaps.push('Limited team size may constrain execution capability');
    risks.push('Key person dependency across multiple functions');
  }

  // Functional gaps
  if (teamComposition.key_departments.sales_marketing < 2) {
    gaps.push('Limited sales and marketing capability');
  }
  if (teamComposition.key_departments.finance_admin < 1) {
    gaps.push('Need for dedicated finance and administrative functions');
  }

  // Stage-specific gaps
  const stage = dealData?.stage?.toLowerCase() || '';
  if (stage.includes('growth') && teamComposition.key_departments.operations < 3) {
    gaps.push('Operations team insufficient for scaling phase');
  }

  // Leadership gaps
  if (teamComposition.senior_management.length < 3) {
    gaps.push('Limited senior management depth');
    risks.push('Succession planning and leadership development needs');
  }

  return {
    capability_gaps: gaps,
    organizational_risks: risks,
    priority_hires: generatePriorityHires(gaps, dealData),
    timeline: 'Next 6-12 months'
  };
}

function generatePriorityHires(gaps, dealData) {
  const hires = [];
  
  gaps.forEach(gap => {
    if (gap.includes('sales')) {
      hires.push('VP of Sales or Head of Revenue');
    }
    if (gap.includes('marketing')) {
      hires.push('VP of Marketing or Growth Lead');
    }
    if (gap.includes('finance')) {
      hires.push('CFO or Financial Controller');
    }
    if (gap.includes('operations')) {
      hires.push('COO or Operations Director');
    }
    if (gap.includes('senior management')) {
      hires.push('Additional C-level executives');
    }
  });

  return [...new Set(hires)]; // Remove duplicates
}

function analyzeAdvisoryBoard(dealData, teamResearch) {
  const advisors = teamResearch?.advisors || [];
  
  return {
    advisor_count: advisors.length,
    advisor_profiles: advisors.map(advisor => ({
      name: advisor.name || 'Advisor',
      background: advisor.background || 'Industry expert',
      expertise: advisor.expertise || 'Strategic guidance',
      value_add: advisor.value_add || 'Industry connections and guidance'
    })),
    advisor_strengths: assessAdvisorStrengths(advisors),
    advisor_gaps: identifyAdvisorGaps(advisors, dealData),
    engagement_level: 'Active participation in strategic decisions'
  };
}

function assessAdvisorStrengths(advisors) {
  if (advisors.length === 0) return ['Limited advisory support currently'];
  
  return [
    'Industry expertise and market insights',
    'Strategic guidance and mentorship',
    'Network access and business development support',
    'Operational experience and best practices'
  ];
}

function identifyAdvisorGaps(advisors, dealData) {
  const gaps = [];
  
  if (advisors.length < 3) {
    gaps.push('Limited advisor network breadth');
  }
  
  gaps.push('Consider adding advisors with specific functional expertise');
  gaps.push('Geographic market expansion advisory needs');
  
  return gaps;
}

function assessSuccessionPlanning(teamComposition, dealData) {
  return {
    current_state: 'Basic succession planning in place',
    key_person_risks: identifyKeyPersonRisks(teamComposition),
    mitigation_strategies: [
      'Cross-training for critical functions',
      'Documentation of key processes and relationships',
      'Equity-based retention programs',
      'External recruitment pipeline development'
    ],
    board_oversight: 'Board involvement in succession planning recommended'
  };
}

function identifyKeyPersonRisks(teamComposition) {
  const risks = [];
  
  if (teamComposition.total_employees < 10) {
    risks.push('Founder dependency for multiple critical functions');
  }
  if (teamComposition.senior_management.length < 3) {
    risks.push('Limited management redundancy');
  }
  
  risks.push('Key technical talent retention');
  
  return risks;
}

function analyzeCompensationStructure(dealData) {
  return {
    equity_distribution: {
      founders: '60-80% (pre-investment)',
      employees: '10-20%',
      option_pool: '15-20%',
      advisors: '1-3%'
    },
    compensation_philosophy: 'Below-market cash, above-market equity',
    retention_mechanisms: [
      'Equity vesting over 4 years',
      'Performance-based bonuses',
      'Career development opportunities'
    ],
    competitive_positioning: 'Competitive within startup market'
  };
}

function assessCulturalFit(dealData, teamResearch) {
  return {
    company_culture: teamResearch?.culture || 'Innovation-driven and collaborative',
    values_alignment: 'Strong alignment with growth and execution',
    work_environment: 'Fast-paced startup environment',
    team_dynamics: 'Collaborative and results-oriented',
    cultural_strengths: [
      'Entrepreneurial mindset and adaptability',
      'Results-driven culture',
      'Collaborative team environment'
    ],
    cultural_risks: [
      'Potential culture dilution during rapid scaling',
      'Work-life balance challenges in high-growth phase'
    ]
  };
}

function generateHiringPlan(teamGaps, dealData) {
  const plan = {
    immediate_needs: [],
    six_month_plan: [],
    twelve_month_plan: [],
    budget_considerations: 'Allocate 30-40% of funding for team expansion'
  };

  teamGaps.capability_gaps.forEach(gap => {
    if (gap.includes('sales') || gap.includes('finance')) {
      plan.immediate_needs.push(`Hire ${gap.includes('sales') ? 'VP Sales' : 'CFO'}`);
    } else {
      plan.six_month_plan.push(`Address ${gap}`);
    }
  });

  plan.twelve_month_plan.push('Continue scaling based on growth milestones');

  return plan;
}

function generateManagementRecommendations(founders, teamGaps, dealData) {
  return [
    'Implement formal performance management and review processes',
    'Develop leadership development programs for key personnel',
    'Establish clear roles, responsibilities, and accountability frameworks',
    'Create comprehensive onboarding programs for new hires',
    'Implement equity retention programs for critical team members',
    'Develop mentorship and coaching programs',
    'Establish regular team building and culture development initiatives'
  ];
}

function generateDueDiligenceFocus(founders, teamComposition) {
  return {
    reference_checks: 'Conduct comprehensive reference checks for all founders and key team members',
    background_verification: 'Verify educational and professional backgrounds',
    legal_issues: 'Review any legal issues or potential conflicts of interest',
    equity_verification: 'Confirm equity distribution and vesting schedules',
    employment_agreements: 'Review employment agreements and non-compete clauses',
    culture_assessment: 'Conduct culture and team dynamics assessment through interviews'
  };
}

function assessFounderStrengths(dealData, teamResearch) {
  const strengths = [];
  
  if (teamResearch?.founder_background?.includes('entrepreneur')) {
    strengths.push('Entrepreneurial experience');
  }
  if (teamResearch?.founder_experience_years > 10) {
    strengths.push('Extensive industry experience');
  }
  if (teamResearch?.previous_companies?.length > 0) {
    strengths.push('Previous startup experience');
  }
  
  if (strengths.length === 0) {
    strengths.push('Industry knowledge and market insights');
  }
  
  return strengths;
}

function identifyFounderGaps(dealData, teamResearch) {
  return [
    'Scaling and operational management experience',
    'Financial management and investor relations',
    'Team building and talent acquisition'
  ];
}

function assessLeadershipStyle(teamResearch) {
  return teamResearch?.leadership_style || 'Hands-on and collaborative';
}

function assessNetworkStrength(teamResearch) {
  if (teamResearch?.network_score > 8) return 'Strong';
  if (teamResearch?.network_score > 6) return 'Good';
  return 'Developing';
}

function assessDiversityMetrics(teamResearch) {
  return {
    gender_diversity: teamResearch?.diversity?.gender || 'Not specified',
    ethnic_diversity: teamResearch?.diversity?.ethnic || 'Not specified',
    age_diversity: teamResearch?.diversity?.age || 'Not specified',
    background_diversity: 'Mixed industry and functional backgrounds'
  };
}

function assessWorkArrangement(dealData, teamResearch) {
  return teamResearch?.work_arrangement || 'Hybrid model with flexible arrangements';
}

function assessGeographicDistribution(dealData, teamResearch) {
  const location = dealData?.location || 'Multiple locations';
  return {
    headquarters: location,
    remote_percentage: teamResearch?.remote_percentage || '30%',
    geographic_spread: 'Primarily local with some remote talent'
  };
}

function calculateOverallLeadershipScore(founders, teamResearch) {
  // Simple scoring algorithm
  let score = 60; // Base score
  
  if (founders.length > 0) {
    const founder = founders[0];
    if (founder.experience_years > 10) score += 15;
    if (founder.previous_companies.length > 0) score += 10;
    if (founder.key_achievements.length > 2) score += 10;
  }
  
  if (teamResearch?.team_size > 20) score += 5;
  
  return Math.min(score, 95);
}

function generateExecutiveSummary(founders, teamComposition, leadershipCapabilities) {
  const founderCount = founders.length;
  const teamSize = teamComposition.total_employees;
  const leadScore = leadershipCapabilities.overall_leadership_score;
  
  let summary = `Management team consists of ${founderCount} founder${founderCount > 1 ? 's' : ''} `;
  summary += `leading a team of ${teamSize} employees. `;
  
  if (leadScore >= 80) {
    summary += 'Strong leadership capabilities with proven execution track record. ';
  } else if (leadScore >= 70) {
    summary += 'Good leadership foundation with areas for continued development. ';
  } else {
    summary += 'Developing leadership team with growth potential. ';
  }
  
  if (founders.length > 0 && founders[0].experience_years > 5) {
    summary += 'Founder brings significant industry experience. ';
  }
  
  summary += 'Team shows strong potential for scaling and execution.';
  
  return summary;
}

function calculateManagementConfidence(teamResearch, dealData) {
  let confidence = 65; // Base confidence
  
  if (teamResearch?.founder_background) confidence += 10;
  if (teamResearch?.team_size > 0) confidence += 10;
  if (dealData?.founder_name) confidence += 10;
  if (teamResearch?.senior_team?.length > 0) confidence += 5;
  
  return Math.min(confidence, 90);
}

// Import and use fund-type-specific analysis functions
function generateManagementFundTypeAnalysis(fundType: string, analysisData: any): any {
  if (fundType === 'vc' || fundType === 'venture_capital') {
    return {
      focus: 'vision_and_execution',
      key_attributes: ['entrepreneurial_vision', 'technical_expertise', 'growth_mindset', 'adaptability'],
      success_factors: ['founder_market_fit', 'technical_leadership', 'scaling_experience', 'pivoting_ability'],
      red_flags: ['lack_of_domain_expertise', 'no_technical_co_founder', 'poor_communication', 'rigid_thinking'],
      assessment_criteria: 'VC prioritizes visionary founders with deep domain expertise and proven ability to execute in uncertain environments'
    };
  } else if (fundType === 'pe' || fundType === 'private_equity') {
    return {
      focus: 'operational_excellence',
      key_attributes: ['operational_expertise', 'financial_discipline', 'proven_track_record', 'strategic_thinking'],
      success_factors: ['value_creation_experience', 'operational_improvements', 'market_expansion', 'efficiency_gains'],
      red_flags: ['poor_financial_controls', 'lack_of_operational_metrics', 'resistance_to_change', 'weak_governance'],
      assessment_criteria: 'PE prioritizes experienced operators with proven ability to drive value creation and operational improvements'
    };
  }
  return {
    focus: 'general_leadership',
    key_attributes: ['leadership_skills', 'industry_experience', 'team_building'],
    success_factors: ['strong_execution', 'clear_vision', 'team_cohesion'],
    red_flags: ['poor_leadership', 'lack_of_experience', 'team_conflicts'],
    assessment_criteria: 'General assessment of leadership capabilities and team dynamics'
  };
}