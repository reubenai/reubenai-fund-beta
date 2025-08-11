import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Users,
  GraduationCap,
  Briefcase,
  Award,
  Network,
  Lightbulb,
  Star
} from 'lucide-react';
import { Deal } from '@/hooks/usePipelineDeals';
import { supabase } from '@/integrations/supabase/client';

interface FounderTeamStrengthAssessmentProps {
  deal: Deal;
}

interface TeamCheck {
  criterion: string;
  aligned: boolean;
  reasoning: string;
  icon: React.ReactNode;
  weight: number;
  score?: number;
}

interface TeamAssessment {
  overallStatus: 'Exceptional' | 'Strong' | 'Adequate' | 'Weak';
  overallScore: number;
  checks: TeamCheck[];
}

const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    'Exceptional': 'bg-purple-100 text-purple-700 border-purple-200',
    'Strong': 'bg-emerald-100 text-emerald-700 border-emerald-200',
    'Adequate': 'bg-amber-100 text-amber-700 border-amber-200',
    'Weak': 'bg-red-100 text-red-700 border-red-200',
  };
  return colors[status] || 'bg-gray-100 text-gray-700 border-gray-200';
};

const getStatusIcon = (aligned: boolean) => {
  return aligned ? (
    <CheckCircle className="h-4 w-4 text-emerald-600" />
  ) : (
    <XCircle className="h-4 w-4 text-red-600" />
  );
};

export function FounderTeamStrengthAssessment({ deal }: FounderTeamStrengthAssessmentProps) {
  const [loading, setLoading] = useState(true);
  const [assessment, setAssessment] = useState<TeamAssessment | null>(null);
  const [teamData, setTeamData] = useState<any>(null);

  useEffect(() => {
    const fetchTeamDataAndAssess = async () => {
      try {
        setLoading(true);
        
        // Fetch team research data for this deal
        const { data: teamResearch, error } = await supabase
          .from('deal_analysis_sources')
          .select('*')
          .eq('deal_id', deal.id)
          .eq('engine_name', 'team-research-engine')
          .order('retrieved_at', { ascending: false })
          .limit(1);

        if (!error && teamResearch && teamResearch.length > 0) {
          setTeamData(teamResearch[0].data_retrieved);
        }

        // Perform team strength assessment
        const teamAssessment = assessFounderTeamStrength(deal, teamResearch?.[0]?.data_retrieved);
        setAssessment(teamAssessment);
      } catch (error) {
        console.error('Error in team strength assessment:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTeamDataAndAssess();
  }, [deal]);

  const assessFounderTeamStrength = (deal: Deal, teamData?: any): TeamAssessment => {
    const checks: TeamCheck[] = [];

    // Founder Experience
    const founderExperience = teamData?.founder_experience || teamData?.founders;
    const experienceStrong = founderExperience && (
      founderExperience.senior_roles ||
      founderExperience.previous_startups ||
      founderExperience.industry_experience_years > 5 ||
      (Array.isArray(founderExperience) && founderExperience.some((f: any) => 
        f.previous_roles || f.experience_years > 5 || f.previous_exits
      ))
    );
    
    checks.push({
      criterion: 'Founder Experience',
      aligned: experienceStrong || false,
      reasoning: experienceStrong 
        ? 'Founders demonstrate relevant industry experience and leadership roles' 
        : founderExperience 
          ? 'Some founder experience noted - depth assessment needed'
          : 'Founder experience data not available - team research required',
      icon: <Briefcase className="h-4 w-4" />,
      weight: 25,
      score: experienceStrong ? 85 : founderExperience ? 60 : 35
    });

    // Domain Expertise
    const domainExpertise = teamData?.domain_expertise || 
      (deal.industry && teamData?.relevant_experience);
    const expertiseStrong = domainExpertise && (
      domainExpertise.deep_knowledge ||
      domainExpertise.industry_veteran ||
      (typeof domainExpertise === 'boolean' && domainExpertise) ||
      (deal.industry && teamData?.industry_background?.includes(deal.industry.toLowerCase()))
    );
    
    checks.push({
      criterion: 'Domain Expertise',
      aligned: expertiseStrong || false,
      reasoning: expertiseStrong 
        ? `Team demonstrates deep expertise in ${deal.industry || 'target industry'}` 
        : domainExpertise 
          ? 'Some domain knowledge present - expertise depth to be validated'
          : 'Domain expertise assessment pending',
      icon: <Lightbulb className="h-4 w-4" />,
      weight: 20,
      score: expertiseStrong ? 80 : domainExpertise ? 55 : 40
    });

    // Education & Credentials
    const education = teamData?.education || teamData?.credentials;
    const educationStrong = education && (
      education.tier_1_institutions ||
      education.advanced_degrees ||
      education.relevant_certifications ||
      (Array.isArray(education) && education.some((e: any) => 
        e.institution?.toLowerCase().includes('stanford') ||
        e.institution?.toLowerCase().includes('harvard') ||
        e.institution?.toLowerCase().includes('mit') ||
        e.degree?.toLowerCase().includes('mba') ||
        e.degree?.toLowerCase().includes('phd')
      ))
    );
    
    checks.push({
      criterion: 'Education & Credentials',
      aligned: educationStrong || false,
      reasoning: educationStrong 
        ? 'Strong educational background from top institutions' 
        : education 
          ? 'Educational background documented'
          : 'Educational credentials not assessed',
      icon: <GraduationCap className="h-4 w-4" />,
      weight: 15,
      score: educationStrong ? 75 : education ? 60 : 45
    });

    // Previous Successes/Exits
    const previousSuccesses = teamData?.previous_exits || teamData?.track_record;
    const successesStrong = previousSuccesses && (
      previousSuccesses.successful_exits ||
      previousSuccesses.ipo_experience ||
      previousSuccesses.acquisition_experience ||
      (Array.isArray(previousSuccesses) && previousSuccesses.length > 0)
    );
    
    checks.push({
      criterion: 'Previous Successes',
      aligned: successesStrong || false,
      reasoning: successesStrong 
        ? 'Team has track record of successful exits or major achievements' 
        : previousSuccesses 
          ? 'Some previous accomplishments noted'
          : 'Previous success history not available',
      icon: <Award className="h-4 w-4" />,
      weight: 20,
      score: successesStrong ? 90 : previousSuccesses ? 50 : 30
    });

    // Team Composition & Completeness
    const teamComposition = teamData?.team_composition || teamData?.key_roles;
    const teamComplete = teamComposition && (
      teamComposition.technical_founder ||
      teamComposition.business_founder ||
      teamComposition.balanced_skillsets ||
      (teamData?.team_size && teamData.team_size >= 2) ||
      deal.founder?.includes(',') // Multiple founders indicated
    );
    
    checks.push({
      criterion: 'Team Composition',
      aligned: teamComplete || false,
      reasoning: teamComplete 
        ? 'Well-balanced team with complementary skills' 
        : teamComposition 
          ? 'Team structure identified - balance assessment needed'
          : 'Team composition analysis pending',
      icon: <Users className="h-4 w-4" />,
      weight: 15,
      score: teamComplete ? 70 : teamComposition ? 55 : 40
    });

    // Network & Advisors
    const networkStrength = teamData?.advisor_network || teamData?.connections;
    const networkStrong = networkStrength && (
      networkStrength.industry_advisors ||
      networkStrength.investor_connections ||
      networkStrength.strategic_advisors ||
      (Array.isArray(networkStrength) && networkStrength.length > 2)
    );
    
    checks.push({
      criterion: 'Network & Advisors',
      aligned: networkStrong || false,
      reasoning: networkStrong 
        ? 'Strong advisory network and industry connections' 
        : networkStrength 
          ? 'Some network connections identified'
          : 'Network assessment not completed',
      icon: <Network className="h-4 w-4" />,
      weight: 5,
      score: networkStrong ? 75 : networkStrength ? 50 : 35
    });

    // Calculate overall score
    const totalWeight = checks.reduce((sum, check) => sum + check.weight, 0);
    const weightedScore = checks.reduce((sum, check) => 
      sum + ((check.score || (check.aligned ? 70 : 30)) * check.weight / 100), 0);
    const overallScore = totalWeight > 0 ? Math.round(weightedScore) : 0;

    // Determine overall status
    let overallStatus: TeamAssessment['overallStatus'];
    if (overallScore >= 80) {
      overallStatus = 'Exceptional';
    } else if (overallScore >= 65) {
      overallStatus = 'Strong';
    } else if (overallScore >= 50) {
      overallStatus = 'Adequate';
    } else {
      overallStatus = 'Weak';
    }

    return {
      overallStatus,
      overallScore,
      checks
    };
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Founder & Team Strength Assessment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!assessment) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Founder & Team Strength Assessment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Team analysis unavailable</p>
              <p className="text-sm">Trigger AI analysis to assess founder and team strength</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6 space-y-6">
        {/* Overall Status */}
        <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-background">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium">Team Strength</p>
              <p className="text-sm text-muted-foreground">
                Based on {assessment.checks.length} team factors
              </p>
            </div>
          </div>
          <div className="text-right">
            <Badge variant="outline" className={`${getStatusColor(assessment.overallStatus)} mb-2`}>
              {assessment.overallStatus}
            </Badge>
            <div className="flex items-center gap-2">
              <Progress value={assessment.overallScore} className="w-24" />
              <span className="text-sm font-medium">{assessment.overallScore}%</span>
            </div>
          </div>
        </div>

        {/* Individual Checks */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm text-muted-foreground">Team Factors</h4>
          {assessment.checks.map((check, index) => (
            <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  {check.icon}
                  {getStatusIcon(check.aligned)}
                </div>
                <div>
                  <p className="font-medium text-sm">{check.criterion}</p>
                  <p className="text-xs text-muted-foreground">{check.reasoning}</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-muted-foreground">Weight: {check.weight}%</span>
                {check.score && (
                  <div className="text-xs font-medium">{check.score}/100</div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Team Insights */}
        <div className="p-4 rounded-lg bg-muted/30 border">
          <h4 className="font-medium text-sm mb-2">Team Insights</h4>
          <div className="text-sm text-muted-foreground space-y-1">
            {assessment.overallStatus === 'Exceptional' && (
              <p>🌟 Outstanding founding team with exceptional track record and deep expertise.</p>
            )}
            {assessment.overallStatus === 'Strong' && (
              <p>💪 Strong team foundation with relevant experience and good potential for execution.</p>
            )}
            {assessment.overallStatus === 'Adequate' && (
              <p>⚠️ Team shows promise but may need additional validation or strengthening in key areas.</p>
            )}
            {assessment.overallStatus === 'Weak' && (
              <p>🔍 Team strength concerns identified - thorough assessment of execution capability needed.</p>
            )}
            
            {teamData && (
              <p className="mt-2 pt-2 border-t border-muted-foreground/20">
                💡 Team research data available from recent analysis
              </p>
            )}
            
            {deal.founder && (
              <p className="text-xs">
                <span className="font-medium">Founder(s):</span> {deal.founder}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}