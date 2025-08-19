import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Users, Settings, TrendingUp, Award } from 'lucide-react';

interface ManagementTeamMember {
  name: string;
  role: string;
  experience_years: number;
  track_record: 'excellent' | 'good' | 'average' | 'poor';
  leadership_score: number;
}

interface OperationalMetric {
  metric: string;
  current_value: string;
  benchmark: string;
  performance: 'above' | 'at' | 'below';
  trend: 'improving' | 'stable' | 'declining';
}

interface ProcessQuality {
  area: string;
  maturity_level: number;
  automation_score: number;
  compliance_status: 'compliant' | 'minor_issues' | 'major_issues';
  improvement_opportunities: string[];
}

interface PEOperationalExcellenceData {
  management_team: {
    leadership_strength: number;
    team_depth: number;
    succession_planning: number;
    key_members: ManagementTeamMember[];
  };
  operational_efficiency: {
    overall_efficiency: number;
    cost_optimization: number;
    resource_utilization: number;
    key_metrics: OperationalMetric[];
  };
  process_quality: {
    process_maturity: number;
    quality_systems: number;
    continuous_improvement: number;
    processes: ProcessQuality[];
  };
  technology_systems: {
    technology_adoption: number;
    system_integration: number;
    digital_transformation: number;
    technology_stack: { system: string; score: number; status: string }[];
  };
}

interface PEOperationalExcellenceDeepDiveProps {
  data: PEOperationalExcellenceData;
}

export function PEOperationalExcellenceDeepDive({ data }: PEOperationalExcellenceDeepDiveProps) {
  const getScoreColor = (score: number, thresholds: { good: number; fair: number }) => {
    if (score >= thresholds.good) return 'text-green-600';
    if (score >= thresholds.fair) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPerformanceColor = (performance: 'above' | 'at' | 'below') => {
    if (performance === 'above') return 'text-green-600 bg-green-50';
    if (performance === 'at') return 'text-blue-600 bg-blue-50';
    return 'text-red-600 bg-red-50';
  };

  const getTrendIcon = (trend: 'improving' | 'stable' | 'declining') => {
    if (trend === 'improving') return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (trend === 'declining') return <TrendingUp className="h-4 w-4 text-red-600 rotate-180" />;
    return <TrendingUp className="h-4 w-4 text-gray-600 rotate-90" />;
  };

  const getTrackRecordColor = (track_record: string) => {
    if (track_record === 'excellent') return 'text-green-600 bg-green-50';
    if (track_record === 'good') return 'text-blue-600 bg-blue-50';
    if (track_record === 'average') return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getComplianceColor = (status: string) => {
    if (status === 'compliant') return 'text-green-600 bg-green-50';
    if (status === 'minor_issues') return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  return (
    <div className="space-y-6">
      {/* Management Team Assessment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Management Team Strength
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className={`text-2xl font-bold ${getScoreColor(data.management_team.leadership_strength, { good: 80, fair: 60 })}`}>
                {data.management_team.leadership_strength}/100
              </div>
              <div className="text-sm text-muted-foreground">Leadership Strength</div>
              <Progress value={data.management_team.leadership_strength} className="mt-2" />
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${getScoreColor(data.management_team.team_depth, { good: 75, fair: 50 })}`}>
                {data.management_team.team_depth}/100
              </div>
              <div className="text-sm text-muted-foreground">Team Depth</div>
              <Progress value={data.management_team.team_depth} className="mt-2" />
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${getScoreColor(data.management_team.succession_planning, { good: 70, fair: 40 })}`}>
                {data.management_team.succession_planning}/100
              </div>
              <div className="text-sm text-muted-foreground">Succession Planning</div>
              <Progress value={data.management_team.succession_planning} className="mt-2" />
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium">Key Team Members</h4>
            {data.management_team.key_members.map((member, index) => (
              <div key={index} className="border rounded-lg p-3">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="font-medium">{member.name}</span>
                    <span className="text-sm text-muted-foreground ml-2">({member.role})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getTrackRecordColor(member.track_record)}>
                      {member.track_record}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {member.experience_years}y exp
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm">Leadership Score:</span>
                  <Progress value={member.leadership_score} className="flex-1 max-w-32" />
                  <span className="text-sm font-medium">{member.leadership_score}/100</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Operational Efficiency */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Operational Efficiency
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className={`text-2xl font-bold ${getScoreColor(data.operational_efficiency.overall_efficiency, { good: 85, fair: 70 })}`}>
                {data.operational_efficiency.overall_efficiency}%
              </div>
              <div className="text-sm text-muted-foreground">Overall Efficiency</div>
              <Progress value={data.operational_efficiency.overall_efficiency} className="mt-2" />
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${getScoreColor(data.operational_efficiency.cost_optimization, { good: 80, fair: 60 })}`}>
                {data.operational_efficiency.cost_optimization}%
              </div>
              <div className="text-sm text-muted-foreground">Cost Optimization</div>
              <Progress value={data.operational_efficiency.cost_optimization} className="mt-2" />
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${getScoreColor(data.operational_efficiency.resource_utilization, { good: 85, fair: 70 })}`}>
                {data.operational_efficiency.resource_utilization}%
              </div>
              <div className="text-sm text-muted-foreground">Resource Utilization</div>
              <Progress value={data.operational_efficiency.resource_utilization} className="mt-2" />
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">Key Performance Metrics</h4>
            {data.operational_efficiency.key_metrics.map((metric, index) => (
              <div key={index} className="flex items-center justify-between p-2 border rounded">
                <span className="text-sm font-medium">{metric.metric}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm">{metric.current_value}</span>
                  <span className="text-xs text-muted-foreground">vs {metric.benchmark}</span>
                  <Badge className={getPerformanceColor(metric.performance)}>
                    {metric.performance}
                  </Badge>
                  {getTrendIcon(metric.trend)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Process Quality */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Process Quality & Standards
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className={`text-2xl font-bold ${getScoreColor(data.process_quality.process_maturity, { good: 80, fair: 60 })}`}>
                {data.process_quality.process_maturity}/100
              </div>
              <div className="text-sm text-muted-foreground">Process Maturity</div>
              <Progress value={data.process_quality.process_maturity} className="mt-2" />
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${getScoreColor(data.process_quality.quality_systems, { good: 85, fair: 70 })}`}>
                {data.process_quality.quality_systems}/100
              </div>
              <div className="text-sm text-muted-foreground">Quality Systems</div>
              <Progress value={data.process_quality.quality_systems} className="mt-2" />
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${getScoreColor(data.process_quality.continuous_improvement, { good: 75, fair: 50 })}`}>
                {data.process_quality.continuous_improvement}/100
              </div>
              <div className="text-sm text-muted-foreground">Continuous Improvement</div>
              <Progress value={data.process_quality.continuous_improvement} className="mt-2" />
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium">Process Areas</h4>
            {data.process_quality.processes.map((process, index) => (
              <div key={index} className="border rounded-lg p-3">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-medium">{process.area}</span>
                  <Badge className={getComplianceColor(process.compliance_status)}>
                    {process.compliance_status.replace('_', ' ')}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-2">
                  <div>
                    <div className="text-sm text-muted-foreground">Maturity Level</div>
                    <Progress value={process.maturity_level} className="mt-1" />
                    <span className="text-xs">{process.maturity_level}/100</span>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Automation Score</div>
                    <Progress value={process.automation_score} className="mt-1" />
                    <span className="text-xs">{process.automation_score}/100</span>
                  </div>
                </div>
                {process.improvement_opportunities.length > 0 && (
                  <div>
                    <div className="text-sm font-medium mb-1">Improvement Opportunities:</div>
                    <div className="flex flex-wrap gap-1">
                      {process.improvement_opportunities.map((opp, oppIndex) => (
                        <Badge key={oppIndex} variant="outline" className="text-xs">
                          {opp}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Technology Systems */}
      <Card>
        <CardHeader>
          <CardTitle>Technology & Systems</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className={`text-2xl font-bold ${getScoreColor(data.technology_systems.technology_adoption, { good: 80, fair: 60 })}`}>
                {data.technology_systems.technology_adoption}/100
              </div>
              <div className="text-sm text-muted-foreground">Technology Adoption</div>
              <Progress value={data.technology_systems.technology_adoption} className="mt-2" />
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${getScoreColor(data.technology_systems.system_integration, { good: 85, fair: 65 })}`}>
                {data.technology_systems.system_integration}/100
              </div>
              <div className="text-sm text-muted-foreground">System Integration</div>
              <Progress value={data.technology_systems.system_integration} className="mt-2" />
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${getScoreColor(data.technology_systems.digital_transformation, { good: 75, fair: 50 })}`}>
                {data.technology_systems.digital_transformation}/100
              </div>
              <div className="text-sm text-muted-foreground">Digital Transformation</div>
              <Progress value={data.technology_systems.digital_transformation} className="mt-2" />
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">Technology Stack</h4>
            {data.technology_systems.technology_stack.map((tech, index) => (
              <div key={index} className="flex items-center justify-between p-2 border rounded">
                <span className="text-sm font-medium">{tech.system}</span>
                <div className="flex items-center gap-2">
                  <Progress value={tech.score} className="w-20" />
                  <span className="text-xs font-medium">{tech.score}/100</span>
                  <Badge variant={tech.status === 'modern' ? 'default' : tech.status === 'legacy' ? 'destructive' : 'secondary'}>
                    {tech.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}