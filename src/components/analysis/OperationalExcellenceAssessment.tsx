import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Settings, 
  Users, 
  Zap, 
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Cog
} from 'lucide-react';

interface OperationalExcellenceAssessmentProps {
  deal: any;
}

export function OperationalExcellenceAssessment({ deal }: OperationalExcellenceAssessmentProps) {
  // Extract operational metrics from enhanced analysis
  const analysis = deal?.enhanced_analysis;
  const operationalScore = analysis?.rubric_breakdown?.find((item: any) => 
    item.category === 'Operational Excellence'
  )?.score || 0;

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusBadge = (score: number) => {
    if (score >= 85) return <Badge variant="secondary" className="bg-green-100 text-green-800">Excellent</Badge>;
    if (score >= 70) return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Good</Badge>;
    return <Badge variant="secondary" className="bg-red-100 text-red-800">Needs Improvement</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Overall Operational Score */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Operational Excellence Overview
            </CardTitle>
            {getStatusBadge(operationalScore)}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Excellence Score</span>
              <span className={`text-2xl font-bold ${getScoreColor(operationalScore)}`}>
                {operationalScore}/100
              </span>
            </div>
            <Progress value={operationalScore} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Management Team Quality */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" />
            Management Team & Leadership
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Team Size</p>
              <p className="text-lg font-semibold">
                {deal?.employee_count ? `${deal.employee_count} employees` : 'Not disclosed'}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Leadership</p>
              <p className="text-sm font-medium">
                {deal?.founder ? `Led by ${deal.founder}` : 'Founder information available'}
              </p>
            </div>
          </div>
          
          {deal?.co_founders?.length > 0 && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">Co-founders</p>
              <div className="flex flex-wrap gap-2">
                {deal.co_founders.slice(0, 3).map((coFounder: string, index: number) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {coFounder}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          <div className="text-sm text-muted-foreground">
            <p>Management assessment includes leadership experience, organizational structure, and decision-making processes.</p>
          </div>
        </CardContent>
      </Card>

      {/* Process & Systems */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Cog className="h-4 w-4" />
            Process Quality & Systems
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Process Documentation</span>
              <Badge variant="outline">Analyzing</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Quality Management</span>
              <Badge variant="outline">Analyzing</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Technology Infrastructure</span>
              <Badge variant="outline">Analyzing</Badge>
            </div>
          </div>
          
          {deal?.technology_stack?.length > 0 && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">Technology Stack</p>
              <div className="flex flex-wrap gap-2">
                {deal.technology_stack.slice(0, 4).map((tech: string, index: number) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {tech}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Operational Efficiency */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Efficiency & Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm">Operational metrics analysis in progress</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              <span className="text-sm">Efficiency benchmarking pending</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              <span className="text-sm">Performance optimization opportunities being identified</span>
            </div>
            
            <p className="text-xs text-muted-foreground mt-2">
              Operational excellence assessment includes process efficiency, resource utilization, and performance metrics analysis.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}