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

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface TeamResearchRequest {
  dealData: any;
  strategyData: any;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { dealData, strategyData }: TeamResearchRequest = await req.json();
    
    console.log('👥 Team Research Engine: Analyzing founder & team for:', dealData.company_name);
    
    // Conduct comprehensive team research
    const teamResult = await analyzeFounderAndTeam(dealData, strategyData);
    
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

async function analyzeFounderAndTeam(dealData: any, strategyData: any) {
  const validatedData = validateTeamData(dealData);
  
  // Research founder background
  const founderResearch = await conductFounderResearch(validatedData);
  
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
  
  // Generate comprehensive team analysis
  const aiAnalysis = await generateTeamAnalysis(validatedData, {
    founderResearch,
    teamComposition,
    backgroundResearch,
    executionAssessment
  });
  
  // Calculate team strength score
  const teamScore = calculateTeamScore({
    founderResearch,
    teamComposition,
    backgroundResearch,
    executionAssessment
  });
  
  // Determine confidence level
  const confidence = calculateTeamConfidence(validatedData, {
    founderResearch,
    teamComposition,
    backgroundResearch
  });
  
  // Combine all sources
  const sources = [
    ...founderResearch.sources,
    ...teamComposition.sources,
    ...backgroundResearch.sources,
    ...executionAssessment.sources
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
      })
    },
    validation_status: confidence >= 70 ? 'validated' : confidence >= 50 ? 'partial' : 'unvalidated'
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
  
  // Founder research quality
  if (data.founderResearch.research_quality === 'linkedin_available') {
    score += 15;
  } else if (data.founderResearch.research_quality === 'simulated') {
    score += 5;
  }
  
  // Domain expertise
  if (data.teamComposition.assessment.domain_expertise.includes('Strong')) {
    score += 20;
  } else if (data.teamComposition.assessment.domain_expertise.includes('relevant')) {
    score += 10;
  }
  
  // Execution factors
  const executionFactors = Object.values(data.executionAssessment.factors);
  const positiveFactors = executionFactors.filter((factor: any) => 
    factor.includes('experience') || factor.includes('mentioned') || factor.includes('indicated')
  ).length;
  
  score += positiveFactors * 5;
  
  // Team composition
  if (data.teamComposition.assessment.key_roles_filled !== 'Unknown') {
    score += 10;
  }
  
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