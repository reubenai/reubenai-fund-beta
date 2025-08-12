import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Shield, 
  AlertTriangle, 
  TrendingDown, 
  Eye,
  Target,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface RiskAssessmentSectionProps {
  deal: any;
}

export function RiskAssessmentSection({ deal }: RiskAssessmentSectionProps) {
  // Extract risk metrics from enhanced analysis
  const analysis = deal?.enhanced_analysis;
  const riskScore = analysis?.rubric_breakdown?.find((item: any) => 
    item.category === 'Risk Assessment'
  )?.score || 0;

  const getRiskLevel = (score: number) => {
    if (score >= 85) return { level: 'Low Risk', color: 'text-green-600', bgColor: 'bg-green-100' };
    if (score >= 70) return { level: 'Medium Risk', color: 'text-yellow-600', bgColor: 'bg-yellow-100' };
    return { level: 'High Risk', color: 'text-red-600', bgColor: 'bg-red-100' };
  };

  const riskLevel = getRiskLevel(riskScore);

  return (
    <div className="space-y-6">
      {/* Overall Risk Score */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Risk Assessment Overview
            </CardTitle>
            <Badge variant="secondary" className={`${riskLevel.bgColor} ${riskLevel.color}`}>
              {riskLevel.level}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Risk Score</span>
              <span className={`text-2xl font-bold ${riskLevel.color}`}>
                {riskScore}/100
              </span>
            </div>
            <Progress value={riskScore} className="h-2" />
            <p className="text-sm text-muted-foreground">
              Higher scores indicate lower risk profile
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Market & Competitive Risks */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingDown className="h-4 w-4" />
            Market & Competitive Risks
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Market Concentration Risk</span>
              <Badge variant="outline">Analyzing</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Competitive Threats</span>
              <Badge variant="outline">Analyzing</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Market Cyclicality</span>
              <Badge variant="outline">Analyzing</Badge>
            </div>
          </div>
          
          {deal?.competitors?.length > 0 && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">Competitive Landscape</p>
              <div className="flex flex-wrap gap-2">
                {deal.competitors.slice(0, 3).map((competitor: string, index: number) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {competitor}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Operational & Execution Risks */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Operational & Execution Risks
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-blue-500" />
              <span className="text-sm">Management team assessment in progress</span>
            </div>
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-yellow-500" />
              <span className="text-sm">Execution capability analysis pending</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm">Operational scalability review ongoing</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <p className="text-sm text-muted-foreground">Team Size</p>
              <p className="text-sm font-medium">
                {deal?.employee_count ? `${deal.employee_count} employees` : 'Not disclosed'}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Company Stage</p>
              <p className="text-sm font-medium">
                {deal?.company_stage || deal?.funding_stage || 'Growth stage'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Financial & Liquidity Risks */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <XCircle className="h-4 w-4" />
            Financial & Liquidity Risks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Cash Flow Stability</span>
              <Badge variant="outline">Analyzing</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Funding Runway</span>
              <Badge variant="outline">Analyzing</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Revenue Concentration</span>
              <Badge variant="outline">Analyzing</Badge>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground">
              Comprehensive risk assessment includes market dynamics, operational challenges, financial stability, and competitive positioning analysis. Full report available once document analysis is complete.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}