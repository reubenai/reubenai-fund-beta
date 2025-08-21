import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Shield,
  Users,
  Leaf,
  CheckCircle,
  AlertTriangle,
  FileText,
  Award,
  ExternalLink,
  Eye,
  Building2
} from 'lucide-react';

interface GovernanceMetric {
  area: string;
  score: number;
  assessment: 'excellent' | 'good' | 'adequate' | 'needs_improvement';
  key_strengths: string[];
  improvement_areas: string[];
}

interface StakeholderGroup {
  group: string;
  trust_level: number;
  engagement_quality: 'high' | 'medium' | 'low';
  key_concerns: string[];
  satisfaction_drivers: string[];
}

interface ESGMetric {
  category: 'environmental' | 'social' | 'governance';
  subcategory: string;
  rating: 'A' | 'B' | 'C' | 'D' | 'F';
  score: number;
  benchmark_comparison: 'above' | 'at' | 'below';
  improvement_initiatives: string[];
}

interface PETrustTransparencyData {
  corporate_governance: {
    overall_governance_score: number;
    board_effectiveness: number;
    transparency_rating: number;
    governance_metrics: GovernanceMetric[];
    compliance_status: 'fully_compliant' | 'mostly_compliant' | 'some_issues' | 'significant_issues';
  };
  stakeholder_trust: {
    overall_trust_score: number;
    management_credibility: number;
    investor_confidence: number;
    stakeholder_groups: StakeholderGroup[];
    reputation_score: number;
  };
  esg_standards: {
    overall_esg_score: number;
    environmental_score: number;
    social_score: number;
    governance_score: number;
    esg_metrics: ESGMetric[];
    certification_status: string[];
  };
}

interface PETrustTransparencyDeepDiveProps {
  data: PETrustTransparencyData;
}

export function PETrustTransparencyDeepDive({ data }: PETrustTransparencyDeepDiveProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getAssessmentColor = (assessment: 'excellent' | 'good' | 'adequate' | 'needs_improvement') => {
    switch (assessment) {
      case 'excellent': return 'bg-green-100 text-green-800';
      case 'good': return 'bg-blue-100 text-blue-800';
      case 'adequate': return 'bg-yellow-100 text-yellow-800';
      case 'needs_improvement': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getEngagementIcon = (quality: 'high' | 'medium' | 'low') => {
    switch (quality) {
      case 'high': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'medium': return <Eye className="h-4 w-4 text-yellow-600" />;
      case 'low': return <AlertTriangle className="h-4 w-4 text-red-600" />;
    }
  };

  const getRatingColor = (rating: 'A' | 'B' | 'C' | 'D' | 'F') => {
    switch (rating) {
      case 'A': return 'bg-green-100 text-green-800';
      case 'B': return 'bg-blue-100 text-blue-800';
      case 'C': return 'bg-yellow-100 text-yellow-800';
      case 'D': return 'bg-orange-100 text-orange-800';
      case 'F': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getBenchmarkIcon = (comparison: 'above' | 'at' | 'below') => {
    switch (comparison) {
      case 'above': return <CheckCircle className="h-3 w-3 text-green-600" />;
      case 'at': return <Eye className="h-3 w-3 text-yellow-600" />;
      case 'below': return <AlertTriangle className="h-3 w-3 text-red-600" />;
    }
  };

  const getComplianceColor = (status: string) => {
    switch (status) {
      case 'fully_compliant': return 'text-green-700 bg-green-50 border-green-200';
      case 'mostly_compliant': return 'text-blue-700 bg-blue-50 border-blue-200';
      case 'some_issues': return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      case 'significant_issues': return 'text-red-700 bg-red-50 border-red-200';
      default: return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Shield className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Trust & Transparency Deep Dive</h3>
      </div>

      {/* Trust & Transparency Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Governance</p>
                <p className={`text-3xl font-bold ${getScoreColor(data.corporate_governance.overall_governance_score)}`}>
                  {data.corporate_governance.overall_governance_score}
                </p>
              </div>
              <Shield className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Stakeholder Trust</p>
                <p className={`text-3xl font-bold ${getScoreColor(data.stakeholder_trust.overall_trust_score)}`}>
                  {data.stakeholder_trust.overall_trust_score}
                </p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">ESG Score</p>
                <p className={`text-3xl font-bold ${getScoreColor(data.esg_standards.overall_esg_score)}`}>
                  {data.esg_standards.overall_esg_score}
                </p>
              </div>
              <Leaf className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Reputation</p>
                <p className={`text-3xl font-bold ${getScoreColor(data.stakeholder_trust.reputation_score)}`}>
                  {data.stakeholder_trust.reputation_score}
                </p>
              </div>
              <Award className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Corporate Governance */}
      <Card className={`border-2 ${getComplianceColor(data.corporate_governance.compliance_status)}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="h-4 w-4" />
            Corporate Governance Assessment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Badge className={getComplianceColor(data.corporate_governance.compliance_status)}>
              {data.corporate_governance.compliance_status.replace(/_/g, ' ').toUpperCase()}
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Board Effectiveness</span>
                <Badge variant="outline">{data.corporate_governance.board_effectiveness}%</Badge>
              </div>
              <Progress value={data.corporate_governance.board_effectiveness} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Transparency Rating</span>
                <Badge variant="outline">{data.corporate_governance.transparency_rating}%</Badge>
              </div>
              <Progress value={data.corporate_governance.transparency_rating} className="h-2" />
            </div>
          </div>

          <div className="space-y-4">
            {data.corporate_governance.governance_metrics?.map((metric, index) => (
              <div key={index} className="border border-border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold">{metric.area}</h4>
                  <div className="flex items-center gap-2">
                    <Badge className={getAssessmentColor(metric.assessment)}>
                      {metric.assessment.replace(/_/g, ' ')}
                    </Badge>
                    <Badge variant="outline">{metric.score}/100</Badge>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <h5 className="font-medium text-green-600 mb-2">Key Strengths</h5>
                    <ul className="space-y-1">
                      {metric.key_strengths.map((strength, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle className="h-3 w-3 text-green-600 mt-0.5 flex-shrink-0" />
                          {strength}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h5 className="font-medium text-yellow-600 mb-2">Improvement Areas</h5>
                    <ul className="space-y-1">
                      {metric.improvement_areas.map((area, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <AlertTriangle className="h-3 w-3 text-yellow-600 mt-0.5 flex-shrink-0" />
                          {area}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Stakeholder Trust Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4" />
            Stakeholder Trust Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Management Credibility</span>
                <Badge variant="outline">{data.stakeholder_trust.management_credibility}%</Badge>
              </div>
              <Progress value={data.stakeholder_trust.management_credibility} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Investor Confidence</span>
                <Badge variant="outline">{data.stakeholder_trust.investor_confidence}%</Badge>
              </div>
              <Progress value={data.stakeholder_trust.investor_confidence} className="h-2" />
            </div>
          </div>

          <div className="space-y-4">
            {data.stakeholder_trust.stakeholder_groups?.map((group, index) => (
              <div key={index} className="border border-border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    {getEngagementIcon(group.engagement_quality)}
                    {group.group}
                  </h4>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Trust: {group.trust_level}%</Badge>
                    <Badge variant={group.engagement_quality === 'high' ? 'default' : 
                                   group.engagement_quality === 'medium' ? 'secondary' : 'outline'}>
                      {group.engagement_quality} engagement
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <h5 className="font-medium text-yellow-600 mb-2">Key Concerns</h5>
                    <ul className="space-y-1">
                      {group.key_concerns.map((concern, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <AlertTriangle className="h-3 w-3 text-yellow-600 mt-0.5 flex-shrink-0" />
                          {concern}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h5 className="font-medium text-green-600 mb-2">Satisfaction Drivers</h5>
                    <ul className="space-y-1">
                      {group.satisfaction_drivers.map((driver, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle className="h-3 w-3 text-green-600 mt-0.5 flex-shrink-0" />
                          {driver}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ESG Standards */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Leaf className="h-4 w-4" />
            ESG Standards & Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <div className={`text-xl font-bold ${getScoreColor(data.esg_standards.environmental_score)}`}>
                {data.esg_standards.environmental_score}
              </div>
              <div className="text-sm text-muted-foreground">Environmental</div>
            </div>
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <div className={`text-xl font-bold ${getScoreColor(data.esg_standards.social_score)}`}>
                {data.esg_standards.social_score}
              </div>
              <div className="text-sm text-muted-foreground">Social</div>
            </div>
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <div className={`text-xl font-bold ${getScoreColor(data.esg_standards.governance_score)}`}>
                {data.esg_standards.governance_score}
              </div>
              <div className="text-sm text-muted-foreground">Governance</div>
            </div>
          </div>

          {data.esg_standards.certification_status && data.esg_standards.certification_status.length > 0 && (
            <div className="mb-4">
              <h5 className="font-medium mb-2">ESG Certifications</h5>
              <div className="flex flex-wrap gap-2">
                {data.esg_standards.certification_status.map((cert, index) => (
                  <Badge key={index} variant="secondary" className="gap-1">
                    <Award className="h-3 w-3" />
                    {cert}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-3">
            {data.esg_standards.esg_metrics?.map((metric, index) => (
              <div key={index} className="border border-border rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold capitalize flex items-center gap-2">
                    {getBenchmarkIcon(metric.benchmark_comparison)}
                    {metric.subcategory}
                  </h4>
                  <div className="flex items-center gap-2">
                    <Badge className={getRatingColor(metric.rating)}>
                      Grade: {metric.rating}
                    </Badge>
                    <Badge variant="outline">{metric.score}/100</Badge>
                    <Badge variant="outline">{metric.benchmark_comparison} benchmark</Badge>
                  </div>
                </div>
                
                {metric.improvement_initiatives.length > 0 && (
                  <div className="text-sm">
                    <h5 className="font-medium mb-1">Improvement Initiatives</h5>
                    <ul className="space-y-1">
                      {metric.improvement_initiatives.map((initiative, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <FileText className="h-3 w-3 text-blue-600 mt-0.5 flex-shrink-0" />
                          {initiative}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}