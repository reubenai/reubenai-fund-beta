import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  PieChart,
  Calculator,
  Target,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { FinancialDeepDive } from '@/types/enhanced-deal-analysis';

interface FinancialHealthDeepDiveProps {
  data: FinancialDeepDive;
}

export function FinancialHealthDeepDive({ data }: FinancialHealthDeepDiveProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <DollarSign className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Financial Health Deep Dive</h3>
      </div>

      {/* Revenue Breakdown */}
      {data.revenue_breakdown && data.revenue_breakdown.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <PieChart className="h-4 w-4" />
              Revenue Stream Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.revenue_breakdown.map((stream, index) => (
                <div key={index} className="border border-border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold">{stream.source}</h4>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{stream.percentage}% of revenue</Badge>
                      <Badge 
                        variant={
                          stream.sustainability === 'high' ? 'default' :
                          stream.sustainability === 'medium' ? 'secondary' : 'outline'
                        }
                      >
                        {stream.sustainability} sustainability
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Revenue Contribution</span>
                      <span className="font-medium">{stream.percentage}%</span>
                    </div>
                    <Progress value={stream.percentage} className="h-2" />
                    {stream.growth_rate && (
                      <div className="text-xs text-success flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        Growth Rate: {stream.growth_rate}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Unit Economics */}
      {data.unit_economics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Calculator className="h-4 w-4" />
              Unit Economics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <div className="text-xl font-bold text-primary">{data.unit_economics.cac}</div>
                <div className="text-xs text-muted-foreground">Customer Acquisition Cost</div>
              </div>
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <div className="text-xl font-bold text-secondary">{data.unit_economics.ltv}</div>
                <div className="text-xs text-muted-foreground">Lifetime Value</div>
              </div>
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <div className="text-xl font-bold text-accent">{data.unit_economics.ltv_cac_ratio}</div>
                <div className="text-xs text-muted-foreground">LTV:CAC Ratio</div>
              </div>
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <div className="text-xl font-bold text-warning">{data.unit_economics.payback_period}</div>
                <div className="text-xs text-muted-foreground">Payback Period</div>
              </div>
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <div className="text-xl font-bold text-success">{data.unit_economics.gross_margin}</div>
                <div className="text-xs text-muted-foreground">Gross Margin</div>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-muted/20 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                {data.unit_economics.ltv_cac_ratio >= 3 ? (
                  <CheckCircle className="h-4 w-4 text-success" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-warning" />
                )}
                <span className="text-sm font-medium">
                  Unit Economics Health: {data.unit_economics.ltv_cac_ratio >= 3 ? 'Healthy' : 'Needs Improvement'}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {data.unit_economics.ltv_cac_ratio >= 3 
                  ? 'Strong unit economics with healthy LTV:CAC ratio above 3:1'
                  : 'LTV:CAC ratio below 3:1 indicates potential efficiency issues'
                }
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Burn Analysis */}
      {data.burn_analysis && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingDown className="h-4 w-4" />
              Burn Rate Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <div className="text-xl font-bold text-destructive">{data.burn_analysis.monthly_burn}</div>
                <div className="text-xs text-muted-foreground">Monthly Burn Rate</div>
              </div>
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <div className="text-xl font-bold text-warning">{data.burn_analysis.runway_months}</div>
                <div className="text-xs text-muted-foreground">Months of Runway</div>
              </div>
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <div className="text-xl font-bold text-primary">{data.burn_analysis.burn_efficiency}</div>
                <div className="text-xs text-muted-foreground">Burn Efficiency</div>
              </div>
            </div>
            
            {data.burn_analysis.optimization_opportunities && data.burn_analysis.optimization_opportunities.length > 0 && (
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary" />
                  Optimization Opportunities
                </h4>
                <ul className="space-y-1">
                  {data.burn_analysis.optimization_opportunities.map((opportunity, index) => (
                    <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                      {opportunity}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Funding Scenarios */}
      {data.funding_scenarios && data.funding_scenarios.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="h-4 w-4" />
              Funding Scenario Modeling
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.funding_scenarios.map((scenario, index) => (
                <div key={index} className="border border-border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold capitalize">{scenario.scenario} Case</h4>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{scenario.amount_needed}</Badge>
                      <Badge variant="secondary">{scenario.timeline}</Badge>
                    </div>
                  </div>
                  
                  <div>
                    <h5 className="font-medium mb-2">Key Milestones</h5>
                    <ul className="space-y-1">
                      {scenario.milestones.map((milestone, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                          {milestone}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}