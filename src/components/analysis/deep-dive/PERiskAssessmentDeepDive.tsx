import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  AlertTriangle,
  Shield,
  TrendingDown,
  Building2,
  Users,
  DollarSign,
  Clock,
  ExternalLink
} from 'lucide-react';

interface RiskFactor {
  factor: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  probability: number;
  impact: number;
  mitigation_strategies: string[];
  monitoring_indicators: string[];
}

interface PERiskAssessmentData {
  market_risks: {
    overall_risk_score: number;
    market_volatility: number;
    competitive_threats: number;
    regulatory_risks: RiskFactor[];
    cyclical_exposure: number;
  };
  operational_risks: {
    overall_risk_score: number;
    key_person_dependency: number;
    operational_complexity: number;
    operational_factors: RiskFactor[];
    supply_chain_risks: number;
  };
  financial_risks: {
    overall_risk_score: number;
    leverage_risk: number;
    cash_flow_volatility: number;
    financial_factors: RiskFactor[];
    covenant_compliance: number;
  };
  execution_risks: {
    overall_risk_score: number;
    integration_complexity: number;
    change_management: number;
    execution_factors: RiskFactor[];
    timeline_risk: number;
  };
}

interface PERiskAssessmentDeepDiveProps {
  data: PERiskAssessmentData;
}

export function PERiskAssessmentDeepDive({ data }: PERiskAssessmentDeepDiveProps) {
  const getRiskColor = (severity: 'low' | 'medium' | 'high' | 'critical') => {
    switch (severity) {
      case 'critical': return 'text-red-700 bg-red-50 border-red-200';
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getRiskIcon = (severity: 'low' | 'medium' | 'high' | 'critical') => {
    switch (severity) {
      case 'critical': 
      case 'high': 
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'medium': 
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'low': 
        return <Shield className="h-4 w-4 text-green-600" />;
      default: 
        return <AlertTriangle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Risk Assessment Deep Dive</h3>
      </div>

      {/* Risk Overview Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <Building2 className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Market Risk</p>
              <p className={`text-2xl font-bold ${getScoreColor(100 - data.market_risks.overall_risk_score)}`}>
                {100 - data.market_risks.overall_risk_score}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <Users className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Operational Risk</p>
              <p className={`text-2xl font-bold ${getScoreColor(100 - data.operational_risks.overall_risk_score)}`}>
                {100 - data.operational_risks.overall_risk_score}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <DollarSign className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Financial Risk</p>
              <p className={`text-2xl font-bold ${getScoreColor(100 - data.financial_risks.overall_risk_score)}`}>
                {100 - data.financial_risks.overall_risk_score}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <Clock className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Execution Risk</p>
              <p className={`text-2xl font-bold ${getScoreColor(100 - data.execution_risks.overall_risk_score)}`}>
                {100 - data.execution_risks.overall_risk_score}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Market Risks */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="h-4 w-4" />
            Market & Regulatory Risks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.market_risks.regulatory_risks?.map((risk, index) => (
              <div key={index} className={`border rounded-lg p-4 ${getRiskColor(risk.severity)}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {getRiskIcon(risk.severity)}
                    <h4 className="font-semibold">{risk.factor}</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={risk.severity === 'high' || risk.severity === 'critical' ? 'destructive' : 
                                   risk.severity === 'medium' ? 'secondary' : 'outline'}>
                      {risk.severity} risk
                    </Badge>
                    <Badge variant="outline">P: {risk.probability}%</Badge>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <h5 className="font-medium mb-2">Mitigation Strategies</h5>
                    <ul className="space-y-1">
                      {risk.mitigation_strategies.map((strategy, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="w-1 h-1 bg-current rounded-full mt-2 flex-shrink-0" />
                          {strategy}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h5 className="font-medium mb-2">Monitoring Indicators</h5>
                    <ul className="space-y-1">
                      {risk.monitoring_indicators.map((indicator, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="w-1 h-1 bg-current rounded-full mt-2 flex-shrink-0" />
                          {indicator}
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

      {/* Operational Risks */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4" />
            Operational Risks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <div className={`text-xl font-bold ${getScoreColor(100 - data.operational_risks.key_person_dependency)}`}>
                {100 - data.operational_risks.key_person_dependency}
              </div>
              <div className="text-sm text-muted-foreground">Key Person Independence</div>
            </div>
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <div className={`text-xl font-bold ${getScoreColor(100 - data.operational_risks.operational_complexity)}`}>
                {100 - data.operational_risks.operational_complexity}
              </div>
              <div className="text-sm text-muted-foreground">Operational Simplicity</div>
            </div>
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <div className={`text-xl font-bold ${getScoreColor(100 - data.operational_risks.supply_chain_risks)}`}>
                {100 - data.operational_risks.supply_chain_risks}
              </div>
              <div className="text-sm text-muted-foreground">Supply Chain Stability</div>
            </div>
          </div>

          <div className="space-y-3">
            {data.operational_risks.operational_factors?.map((risk, index) => (
              <div key={index} className="border border-border rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">{risk.factor}</h4>
                  <Badge variant={risk.severity === 'high' || risk.severity === 'critical' ? 'destructive' : 
                                 risk.severity === 'medium' ? 'secondary' : 'outline'}>
                    {risk.severity}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Impact: {risk.impact}% | Probability: {risk.probability}%
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Financial & Execution Risks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <DollarSign className="h-4 w-4" />
              Financial Risks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Leverage Risk</span>
                  <Badge variant="outline">{data.financial_risks.leverage_risk}%</Badge>
                </div>
                <Progress value={data.financial_risks.leverage_risk} className="h-2" />
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Cash Flow Volatility</span>
                  <Badge variant="outline">{data.financial_risks.cash_flow_volatility}%</Badge>
                </div>
                <Progress value={data.financial_risks.cash_flow_volatility} className="h-2" />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Covenant Compliance</span>
                  <Badge variant="outline">{100 - data.financial_risks.covenant_compliance}%</Badge>
                </div>
                <Progress value={100 - data.financial_risks.covenant_compliance} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-4 w-4" />
              Execution Risks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Integration Complexity</span>
                  <Badge variant="outline">{data.execution_risks.integration_complexity}%</Badge>
                </div>
                <Progress value={data.execution_risks.integration_complexity} className="h-2" />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Change Management Risk</span>
                  <Badge variant="outline">{data.execution_risks.change_management}%</Badge>
                </div>
                <Progress value={data.execution_risks.change_management} className="h-2" />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Timeline Risk</span>
                  <Badge variant="outline">{data.execution_risks.timeline_risk}%</Badge>
                </div>
                <Progress value={data.execution_risks.timeline_risk} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}