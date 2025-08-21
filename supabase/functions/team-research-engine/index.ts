import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const openAIApiKey = Deno.env.get('OPENAI_API_KEY')!;
const googleSearchApiKey = Deno.env.get('GOOGLE_SEARCH_API_KEY')!;
const googleSearchEngineId = Deno.env.get('GOOGLE_SEARCH_ENGINE_ID')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface TeamResearchRequest {
  dealData: any;
  strategyData: any;
  documentData?: any;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { dealData, strategyData, documentData }: TeamResearchRequest = await req.json();
    
    // 🚨 EMERGENCY HARDCODED BLOCK FOR KERNEL & ASTRO DEALS
    const BLOCKED_DEALS = ['7ac26a5f-34c9-4d30-b09c-c05d1d1df81d', '98c22f44-87c7-4808-be1c-31929c3da52f'];
    if (BLOCKED_DEALS.includes(dealData.id)) {
      console.log(`🛑 EMERGENCY BLOCK: Team research terminated for blocked deal: ${dealData.id}`);
      return new Response(JSON.stringify({
        score: 0,
        analysis: 'EMERGENCY_SHUTDOWN_ACTIVE: Deal processing blocked by emergency protocol',
        confidence: 0,
        sources: [],
        data: { emergency_block: true },
        validation_status: 'emergency_blocked'
      }), {
        status: 423, // Locked status
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    console.log('👥 Team Research Engine: Analyzing founder & team for:', dealData.company_name);
    
    // Conduct comprehensive team research
    const teamResult = await analyzeFounderAndTeam(dealData, strategyData, documentData);
    
    // Store source tracking
    await storeSources(dealData.id, 'team-research-engine', teamResult.sources);
    
    return new Response(JSON.stringify(teamResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Team Research Engine Error:', error);
    return new Response(JSON.stringify({
      score: 50,
      analysis: `Team research analysis failed: ${error.message}`,
      confidence: 30,
      sources: [],
      data: {},
      validation_status: 'unvalidated'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function analyzeFounderAndTeam(dealData: any, strategyData: any, documentData: any = null) {
  const validatedData = validateTeamData(dealData);
  
  // Enhanced document-driven team analysis
  const documentInsights = documentData ? await extractTeamInsightsFromDocuments(documentData) : null;
  console.log('📄 Document insights extracted:', !!documentInsights);
  
  // Research founder background with web research
  const founderResearch = await conductFounderResearch(validatedData);
  
  // Enhanced web research for founder and team
  const webResearchData = await conductWebResearch(validatedData);
  
  // Analyze team composition
  const teamComposition = await analyzeTeamComposition(validatedData, founderResearch);
  
  // Research professional backgrounds
  const backgroundResearch = await researchProfessionalBackgrounds(validatedData);
  
  // Assess execution capability
  const executionAssessment = await assessExecutionCapability(validatedData, {
    founderResearch,
    teamComposition,
    backgroundResearch
  });
  
  // Generate comprehensive team analysis with web research data
  const aiAnalysis = await generateTeamAnalysis(validatedData, {
    founderResearch,
    teamComposition,
    backgroundResearch,
    executionAssessment,
    webResearchData
  });
  
  // Calculate team strength score with web data
  const teamScore = calculateTeamScore({
    founderResearch,
    teamComposition,
    backgroundResearch,
    executionAssessment,
    webResearchData,
    documentInsights
  });
  
  // Determine confidence level
  const confidence = calculateTeamConfidence(validatedData, {
    founderResearch,
    teamComposition,
    backgroundResearch
  });
  
  // Combine all sources including web research
  const sources = [
    ...founderResearch.sources,
    ...teamComposition.sources,
    ...backgroundResearch.sources,
    ...executionAssessment.sources,
    ...(webResearchData?.sources || [])
  ];
  
  return {
    score: teamScore,
    analysis: aiAnalysis,
    confidence: confidence,
    sources: sources,
    data: {
      founder_profile: founderResearch.profile,
      team_composition: teamComposition.assessment,
      experience_validation: backgroundResearch.validation,
      execution_factors: executionAssessment.factors,
      leadership_assessment: assessLeadershipStrength({
        founderResearch,
        backgroundResearch,
        executionAssessment
      }),
      web_validation: webResearchData?.data || null
    },
    validation_status: confidence >= 70 ? 'validated' : confidence >= 50 ? 'partial' : 'unvalidated'
  };
}

async function extractTeamInsightsFromDocuments(documentData: any) {
  if (!documentData || !documentData.extractedTexts || documentData.extractedTexts.length === 0) {
    return null;
  }
  
  const allText = documentData.extractedTexts.map(doc => {
    let cleanText = doc.extracted_text;
    
    // Parse JSON structure if needed
    try {
      const parsed = JSON.parse(doc.extracted_text);
      if (parsed && typeof parsed === 'object' && parsed.content) {
        cleanText = parsed.content;
      } else if (parsed && typeof parsed === 'object' && parsed.markdown) {
        cleanText = parsed.markdown;
      }
    } catch (e) {
      // Not JSON, use as-is
    }
    
    return `${doc.name} (${doc.category}):\n${cleanText}`;
  }).join('\n\n');
  
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          {
            role: 'system',
            content: `Extract comprehensive team and leadership intelligence from documents. Parse for:
            1. FOUNDER PROFILES: Names, backgrounds, education, previous companies, achievements
            2. TEAM COMPOSITION: Size, key roles, department structure, hiring plans
            3. LEADERSHIP EXPERIENCE: Years of experience, management roles, industry expertise
            4. ADVISORY BOARD: Advisor names, backgrounds, expertise areas, value-add
            5. ACHIEVEMENTS: Awards, recognitions, successful exits, published work
            6. TRACK RECORD: Previous startup experience, leadership successes, failures learned from
            Return structured team insights with specific names and credentials where available.`
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
        team_info: content,
        founder_profiles: extractFounderProfiles(content),
        team_composition_data: extractTeamCompositionData(content),
        leadership_credentials: extractLeadershipCredentials(content),
        advisory_information: extractAdvisoryInformation(content),
        achievement_data: extractAchievementData(content),
        source: 'extracted_documents',
        confidence: 90,
        hasValidatedData: true
      };
    }
  } catch (error) {
    console.error('❌ Team Research Engine - Document extraction error:', error);
  }
  
  return {
    team_info: 'Document analysis failed',
    source: 'extracted_documents',
    confidence: 20,
    hasValidatedData: false
  };
}

function extractFounderProfiles(content: string): any {
  const founderTerms = ['founder', 'ceo', 'co-founder', 'president'];
  const hasFounderInfo = founderTerms.some(term => content.toLowerCase().includes(term));
  
  // Look for education mentions
  const educationTerms = ['university', 'college', 'mba', 'phd', 'stanford', 'harvard', 'mit'];
  const hasEducation = educationTerms.some(term => content.toLowerCase().includes(term));
  
  return {
    hasFounderProfiles: hasFounderInfo,
    hasEducationData: hasEducation,
    founderMentions: (content.match(/founder[s]?/gi) || []).length,
    ceoMentions: (content.match(/ceo[s]?/gi) || []).length,
    educationMentions: educationTerms.filter(term => content.toLowerCase().includes(term))
  };
}

function extractTeamCompositionData(content: string): any {
  const teamSizeMatch = content.match(/team[s]?\s+of\s+(\d+)/gi);
  const employeeMatch = content.match(/(\d+)\s+employee[s]?/gi);
  
  const roleTerms = ['engineer', 'developer', 'sales', 'marketing', 'operations', 'finance'];
  const rolesFound = roleTerms.filter(role => content.toLowerCase().includes(role));
  
  return {
    hasTeamSizeData: teamSizeMatch || employeeMatch,
    teamSizeExtracted: teamSizeMatch || employeeMatch,
    keyRolesMentioned: rolesFound,
    hasDepartmentStructure: rolesFound.length > 2
  };
}

function extractLeadershipCredentials(content: string): any {
  const experienceTerms = ['years of experience', 'previously', 'former', 'ex-', 'veteran'];
  const hasExperience = experienceTerms.some(term => content.toLowerCase().includes(term));
  
  const leadershipTerms = ['led', 'managed', 'directed', 'headed', 'executive', 'VP', 'director'];
  const hasLeadership = leadershipTerms.some(term => content.toLowerCase().includes(term));
  
  return {
    hasExperienceData: hasExperience,
    hasLeadershipExperience: hasLeadership,
    leadershipTerms: leadershipTerms.filter(term => content.toLowerCase().includes(term)),
    seniorRoleMentions: (content.match(/(vp|vice president|director|executive)/gi) || []).length
  };
}

function extractAdvisoryInformation(content: string): any {
  const advisorTerms = ['advisor', 'advisory board', 'mentor', 'board member'];
  const hasAdvisors = advisorTerms.some(term => content.toLowerCase().includes(term));
  
  return {
    hasAdvisoryData: hasAdvisors,
    advisorMentions: (content.match(/advisor[s]?/gi) || []).length,
    boardMentions: (content.match(/board/gi) || []).length,
    mentorMentions: (content.match(/mentor[s]?/gi) || []).length
  };
}

function extractAchievementData(content: string): any {
  const achievementTerms = ['award', 'recognition', 'achievement', 'success', 'exit', 'sold', 'acquired'];
  const hasAchievements = achievementTerms.some(term => content.toLowerCase().includes(term));
  
  return {
    hasAchievements: hasAchievements,
    awardMentions: (content.match(/award[s]?/gi) || []).length,
    successMentions: (content.match(/success/gi) || []).length,
    exitMentions: (content.match(/(exit|sold|acquired)/gi) || []).length
  };
}

function validateTeamData(dealData: any) {
  return {
    company_name: dealData.company_name || 'N/A',
    founder: dealData.founder || 'N/A',
    description: dealData.description || 'N/A',
    industry: dealData.industry || 'N/A',
    linkedin_url: dealData.linkedin_url || null,
    website: dealData.website || null
  };
}

async function conductFounderResearch(dealData: any) {
  const research = {
    profile: {
      name: dealData.founder,
      background: 'N/A',
      previous_experience: 'N/A',
      education: 'N/A',
      achievements: 'N/A'
    },
    sources: [],
    research_quality: 'limited'
  };
  
  if (dealData.founder !== 'N/A') {
    research.sources.push({
      type: 'web_research',
      source: 'founder_research_simulation',
      validated: false,
      confidence: 50
    });
    
    // In production, this would:
    // - Query LinkedIn API for founder profiles
    // - Search news articles and press releases
    // - Check patent databases and publications
    // - Verify previous company associations
    
    research.profile = await simulateFounderResearch(dealData.founder, dealData.industry);
    research.research_quality = 'simulated';
  }
  
  if (dealData.linkedin_url) {
    research.sources.push({
      type: 'linkedin',
      source: dealData.linkedin_url,
      validated: false,
      confidence: 70
    });
    
    // Would integrate with LinkedIn API for profile verification
    research.research_quality = 'linkedin_available';
  }
  
  return research;
}

async function simulateFounderResearch(founderName: string, industry: string) {
  // This would be replaced with real research APIs and web scraping
  const profiles = {
    'technology': {
      background: 'Technology industry experience',
      previous_experience: 'Software development and product management',
      education: 'Computer Science or Engineering background',
      achievements: 'Technical leadership and product launches'
    },
    'healthcare': {
      background: 'Healthcare and medical industry',
      previous_experience: 'Medical device or healthcare IT',
      education: 'Medical, Life Sciences, or Healthcare MBA',
      achievements: 'Healthcare innovation and regulatory experience'
    },
    'fintech': {
      background: 'Financial services and technology',
      previous_experience: 'Banking, payments, or financial technology',
      education: 'Finance, Economics, or related field',
      achievements: 'Financial product development and compliance'
    }
  };
  
  const industryKey = Object.keys(profiles).find(key => 
    industry.toLowerCase().includes(key)
  );
  
  const baseProfile = industryKey ? profiles[industryKey as keyof typeof profiles] : {
    background: 'Industry background requires verification',
    previous_experience: 'Previous experience not confirmed',
    education: 'Educational background unknown',
    achievements: 'Achievements require validation'
  };
  
  return {
    name: founderName,
    ...baseProfile
  };
}

async function analyzeTeamComposition(dealData: any, founderResearch: any) {
  const analysis = {
    assessment: {
      team_size: 'Unknown',
      key_roles_filled: 'Unknown',
      domain_expertise: 'Requires assessment',
      complementary_skills: 'Unknown'
    },
    sources: []
  };
  
  if (dealData.description !== 'N/A') {
    analysis.sources.push({
      type: 'company_description',
      source: 'team_analysis_from_description',
      validated: false,
      confidence: 60
    });
    
    analysis.assessment = extractTeamInfoFromDescription(dealData.description);
  }
  
  // Analyze founder fit for industry
  if (founderResearch.profile.background !== 'N/A') {
    analysis.assessment.domain_expertise = assessDomainExpertise(
      founderResearch.profile.background, 
      dealData.industry
    );
  }
  
  return analysis;
}

function extractTeamInfoFromDescription(description: string): any {
  const desc = description.toLowerCase();
  const assessment = {
    team_size: 'Not specified',
    key_roles_filled: 'Unknown',
    domain_expertise: 'Mentioned in description',
    complementary_skills: 'Requires verification'
  };
  
  // Look for team size indicators
  if (desc.includes('team of')) {
    const teamMatch = desc.match(/team of (\d+)/);
    if (teamMatch) {
      assessment.team_size = `Approximately ${teamMatch[1]} members`;
    }
  }
  
  // Look for role mentions
  const roles = [];
  if (desc.includes('cto') || desc.includes('technical')) roles.push('Technical leadership');
  if (desc.includes('ceo') || desc.includes('founder')) roles.push('Executive leadership');
  if (desc.includes('marketing') || desc.includes('sales')) roles.push('Commercial roles');
  if (desc.includes('engineer') || desc.includes('developer')) roles.push('Engineering team');
  
  if (roles.length > 0) {
    assessment.key_roles_filled = roles.join(', ');
  }
  
  return assessment;
}

function assessDomainExpertise(founderBackground: string, industry: string): string {
  const background = founderBackground.toLowerCase();
  const industryKey = industry.toLowerCase();
  
  if (background.includes(industryKey) || industryKey.includes(background.split(' ')[0])) {
    return 'Strong domain alignment indicated';
  }
  
  if (background.includes('technology') && industryKey.includes('tech')) {
    return 'Technology background relevant';
  }
  
  return 'Domain expertise alignment requires verification';
}

async function researchProfessionalBackgrounds(dealData: any) {
  const research = {
    validation: {
      previous_companies: 'N/A',
      success_track_record: 'N/A',
      industry_reputation: 'N/A',
      network_strength: 'N/A'
    },
    sources: []
  };
  
  if (dealData.founder !== 'N/A') {
    research.sources.push({
      type: 'professional_research',
      source: 'background_verification_simulation',
      validated: false,
      confidence: 45
    });
    
    // In production, this would:
    // - Verify employment history through LinkedIn API
    // - Check company databases and registrations
    // - Search for publications and patents
    // - Analyze social media presence and thought leadership
    // - Cross-reference with industry databases
    
    research.validation = await simulateBackgroundValidation(dealData.founder, dealData.industry);
  }
  
  return research;
}

async function simulateBackgroundValidation(founderName: string, industry: string) {
  // This would be replaced with real verification services
  return {
    previous_companies: 'Requires LinkedIn API verification',
    success_track_record: 'Requires reference checks and validation',
    industry_reputation: 'Requires industry database search',
    network_strength: 'Requires social media and connection analysis'
  };
}

async function assessExecutionCapability(dealData: any, researchData: any) {
  const assessment = {
    factors: {
      leadership_experience: 'Unknown',
      execution_track_record: 'Requires validation',
      team_building_ability: 'Unknown',
      vision_communication: 'Unknown'
    },
    sources: []
  };
  
  if (dealData.description !== 'N/A') {
    assessment.sources.push({
      type: 'description_analysis',
      source: 'execution_indicators',
      validated: false,
      confidence: 55
    });
    
    assessment.factors = analyzeExecutionFromDescription(dealData.description);
  }
  
  // Synthesize from research data
  if (researchData.founderResearch.research_quality !== 'limited') {
    assessment.factors.leadership_experience = assessLeadershipFromBackground(
      researchData.founderResearch.profile
    );
  }
  
  return assessment;
}

function analyzeExecutionFromDescription(description: string): any {
  const desc = description.toLowerCase();
  const factors = {
    leadership_experience: 'Not evident from description',
    execution_track_record: 'Not evident from description',
    team_building_ability: 'Not evident from description',
    vision_communication: 'Evident in company description'
  };
  
  // Look for execution indicators
  if (desc.includes('launched') || desc.includes('built') || desc.includes('scaled')) {
    factors.execution_track_record = 'Previous execution experience mentioned';
  }
  
  if (desc.includes('team') || desc.includes('hired') || desc.includes('grew')) {
    factors.team_building_ability = 'Team building experience indicated';
  }
  
  if (desc.includes('led') || desc.includes('managed') || desc.includes('founded')) {
    factors.leadership_experience = 'Leadership experience mentioned';
  }
  
  return factors;
}

function assessLeadershipFromBackground(profile: any): string {
  const background = profile.previous_experience?.toLowerCase() || '';
  
  if (background.includes('management') || background.includes('leadership')) {
    return 'Management experience indicated';
  }
  if (background.includes('founder') || background.includes('ceo')) {
    return 'Entrepreneurial leadership background';
  }
  if (background.includes('senior') || background.includes('director')) {
    return 'Senior-level experience';
  }
  
  return 'Leadership experience requires verification';
}

function calculateTeamScore(data: any): number {
  let score = 50; // Base score
  
  // MASSIVE DOCUMENT BONUS - Document team intelligence is critical
  if (data.documentInsights?.hasValidatedData) {
    console.log('🔥 Team Research Engine: Document insights detected - applying heavy scoring boost');
    
    // Founder profiles from documents (heavily weighted)
    if (data.documentInsights.founder_profiles?.hasFounderProfiles) {
      score += 25; // Major boost for validated founder profiles
      console.log('👤 Team Research Engine: Founder profiles found in documents (+25 points)');
      
      if (data.documentInsights.founder_profiles.hasEducationData) {
        score += 15; // Education credentials bonus
        console.log('🎓 Team Research Engine: Education credentials found (+15 points)');
      }
    }
    
    // Team composition data from documents
    if (data.documentInsights.team_composition_data?.hasTeamSizeData) {
      score += 18; // Team structure is critical
      console.log('👥 Team Research Engine: Team composition data found (+18 points)');
      
      if (data.documentInsights.team_composition_data.hasDepartmentStructure) {
        score += 12; // Department structure bonus
        console.log('🏢 Team Research Engine: Department structure documented (+12 points)');
      }
    }
    
    // Leadership credentials from documents
    if (data.documentInsights.leadership_credentials?.hasLeadershipExperience) {
      score += 20; // Leadership experience is critical
      console.log('👔 Team Research Engine: Leadership experience found (+20 points)');
      
      if (data.documentInsights.leadership_credentials.seniorRoleMentions > 0) {
        score += 10; // Senior role experience bonus
        console.log('⭐ Team Research Engine: Senior roles mentioned (+10 points)');
      }
    }
    
    // Advisory board from documents
    if (data.documentInsights.advisory_information?.hasAdvisoryData) {
      score += 15;
      console.log('🤝 Team Research Engine: Advisory board information found (+15 points)');
    }
    
    // Achievement data from documents
    if (data.documentInsights.achievement_data?.hasAchievements) {
      score += 12;
      console.log('🏆 Team Research Engine: Achievements documented (+12 points)');
      
      if (data.documentInsights.achievement_data.exitMentions > 0) {
        score += 8; // Previous exits are valuable
        console.log('💰 Team Research Engine: Previous exits mentioned (+8 points)');
      }
    }
    
    // Base document analysis bonus
    score += 15; // Always reward document-driven analysis
    console.log('📄 Team Research Engine: Document analysis completed (+15 points)');
  } else {
    console.log('⚠️ Team Research Engine: No document insights - limited scoring potential');
  }
  
  // Traditional founder research quality (lower weight if we have documents)
  const researchBonus = data.documentInsights?.hasValidatedData ? 
    (data.founderResearch.research_quality === 'linkedin_available' ? 8 : 3) :
    (data.founderResearch.research_quality === 'linkedin_available' ? 15 : 5);
  score += researchBonus;
  
  // Traditional domain expertise (lower weight if we have documents)
  const domainBonus = data.documentInsights?.hasValidatedData ? 
    (data.teamComposition.assessment.domain_expertise.includes('Strong') ? 10 : 5) :
    (data.teamComposition.assessment.domain_expertise.includes('Strong') ? 20 : 10);
  score += domainBonus;
  
  // Execution factors (lower weight if we have documents)
  const executionFactors = Object.values(data.executionAssessment.factors);
  const positiveFactors = executionFactors.filter((factor: any) => 
    factor.includes('experience') || factor.includes('mentioned') || factor.includes('indicated')
  );
  const executionBonus = data.documentInsights?.hasValidatedData ? 
    positiveFactors.length * 3 : positiveFactors.length * 5;
  score += executionBonus;
  
  // Traditional team composition (lower weight if we have documents)
  if (data.teamComposition.assessment.key_roles_filled !== 'Unknown') {
    const teamBonus = data.documentInsights?.hasValidatedData ? 5 : 10;
    score += teamBonus;
  }
  
  console.log(`🎯 Team Research Engine: Final score calculated: ${Math.min(score, 100)}`);
  return Math.min(score, 100);
}

function calculateTeamConfidence(dealData: any, researchData: any): number {
  let confidence = 25; // Base confidence
  
  // Data availability factors
  if (dealData.founder !== 'N/A') confidence += 25;
  if (dealData.linkedin_url) confidence += 20;
  if (dealData.description !== 'N/A') confidence += 15;
  
  // Research quality factors
  if (researchData.founderResearch.research_quality === 'linkedin_available') {
    confidence += 15;
  } else if (researchData.founderResearch.research_quality === 'simulated') {
    confidence += 5;
  }
  
  return Math.min(confidence, 100);
}

function assessLeadershipStrength(data: any): string {
  const founderQuality = data.founderResearch.research_quality;
  const executionFactors = data.executionAssessment.factors;
  
  if (founderQuality === 'linkedin_available' && 
      executionFactors.leadership_experience.includes('experience')) {
    return 'Strong leadership indicators present';
  } else if (founderQuality !== 'limited') {
    return 'Moderate leadership potential';
  } else {
    return 'Leadership assessment requires deeper research';
  }
}

async function generateTeamAnalysis(dealData: any, researchData: any): Promise<string> {
  const prompt = `Analyze founder and team strength for this investment opportunity:

COMPANY: ${dealData.company_name}
FOUNDER: ${dealData.founder}
INDUSTRY: ${dealData.industry}

FOUNDER RESEARCH:
- Background: ${researchData.founderResearch.profile.background}
- Previous Experience: ${researchData.founderResearch.profile.previous_experience}
- Education: ${researchData.founderResearch.profile.education}

TEAM COMPOSITION:
- Team Size: ${researchData.teamComposition.assessment.team_size}
- Key Roles: ${researchData.teamComposition.assessment.key_roles_filled}
- Domain Expertise: ${researchData.teamComposition.assessment.domain_expertise}

EXECUTION ASSESSMENT:
- Leadership Experience: ${researchData.executionAssessment.factors.leadership_experience}
- Track Record: ${researchData.executionAssessment.factors.execution_track_record}
- Team Building: ${researchData.executionAssessment.factors.team_building_ability}

RESEARCH QUALITY: ${researchData.founderResearch.research_quality}

Instructions:
- Focus on leadership and execution capability
- Highlight experience strengths or gaps
- Note what requires additional verification
- Keep to 2-3 sentences
- Use "N/A" for unverifiable information`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          {
            role: 'system',
            content: 'You are a team and leadership analyst. CRITICAL: Only use provided data. Never fabricate founder backgrounds or achievements. Use "N/A" when data is missing. Be explicit about what requires verification.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.2,
        max_tokens: 250
      }),
    });

    if (!response.ok) throw new Error('OpenAI API error');
    
    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error generating team analysis:', error);
    
    // Fallback analysis
    const researchQuality = researchData.founderResearch.research_quality;
    if (researchQuality === 'limited') {
      return `Team analysis limited due to insufficient founder data. Founder: ${dealData.founder}. Industry experience and leadership background require verification through detailed reference checks and LinkedIn research.`;
    }
    
    return `Founder ${dealData.founder} shows ${researchData.teamComposition.assessment.domain_expertise} for ${dealData.industry}. Leadership experience: ${researchData.executionAssessment.factors.leadership_experience}. Team composition and execution track record require additional verification.`;
  }
}

async function conductWebResearch(dealData: any) {
  try {
    console.log('🔍 Conducting web research for founder and team...');
    
    // Call web-research-engine for founder-specific research
    const { data: webResult, error } = await supabase.functions.invoke('web-research-engine', {
      body: {
        dealData,
        researchType: 'founder',
        searchDepth: 'detailed'
      }
    });

    if (error) {
      console.error('Web research failed:', error);
      return { success: false, sources: [] };
    }

    if (webResult.success && webResult.data) {
      return {
        success: true,
        data: webResult.data,
        sources: webResult.sources || []
      };
    }

    return { success: false, sources: [] };
  } catch (error) {
    console.error('Web research error:', error);
    return { success: false, sources: [] };
  }
}

async function storeSources(dealId: string, engineName: string, sources: any[]) {
  try {
    const sourceRecords = sources.map(source => ({
      deal_id: dealId,
      engine_name: engineName,
      source_type: source.type,
      source_url: source.source,
      confidence_score: source.confidence || 60,
      validated: source.validated || false,
      data_retrieved: {},
      retrieved_at: new Date().toISOString()
    }));
    
    if (sourceRecords.length > 0) {
      await supabase
        .from('deal_analysis_sources')
        .insert(sourceRecords);
    }
  } catch (error) {
    console.error('Error storing sources:', error);
  }
}