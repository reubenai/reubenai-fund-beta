import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, DollarSign, BarChart3 } from 'lucide-react';

interface FinancialMetric {
  label: string;
  value: string;
  trend: 'up' | 'down' | 'stable';
  percentage?: number;
}

interface PEFinancialPerformanceData {
  revenue_growth: {
    current_revenue: string;
    growth_rate: number;
    three_year_cagr: number;
    historical_trends: FinancialMetric[];
  };
  profitability: {
    ebitda_margin: number;
    net_margin: number;
    gross_margin: number;
    margin_trends: FinancialMetric[];
  };
  cash_flow: {
    operating_cash_flow: string;
    free_cash_flow: string;
    cash_conversion: number;
    seasonal_patterns: string[];
  };
  financial_stability: {
    debt_to_equity: number;
    current_ratio: number;
    interest_coverage: number;
    risk_factors: string[];
  };
}

interface PEFinancialPerformanceDeepDiveProps {
  data: PEFinancialPerformanceData;
}

export function PEFinancialPerformanceDeepDive({ data }: PEFinancialPerformanceDeepDiveProps) {
  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    if (trend === 'up') return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (trend === 'down') return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <BarChart3 className="h-4 w-4 text-gray-600" />;
  };

  const getMarginColor = (margin: number, threshold: { good: number; fair: number }) => {
    if (margin >= threshold.good) return 'text-green-600';
    if (margin >= threshold.fair) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRatioStatus = (ratio: number, ideal: { min: number; max?: number }) => {
    if (ratio >= ideal.min && (!ideal.max || ratio <= ideal.max)) return 'healthy';
    if (ratio < ideal.min) return 'below';
    return 'above';
  };

  return (
    <div className="space-y-6">
      {/* Revenue Growth Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Revenue Growth Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{data.revenue_growth.current_revenue}</div>
              <div className="text-sm text-muted-foreground">Current Revenue</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {data.revenue_growth.growth_rate}%
              </div>
              <div className="text-sm text-muted-foreground">Annual Growth Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {data.revenue_growth.three_year_cagr}%
              </div>
              <div className="text-sm text-muted-foreground">3-Year CAGR</div>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">Historical Trends</h4>
            {data.revenue_growth.historical_trends.map((metric, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm">{metric.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{metric.value}</span>
                  {getTrendIcon(metric.trend)}
                  {metric.percentage && (
                    <Badge variant={metric.trend === 'up' ? 'default' : 'destructive'}>
                      {metric.percentage > 0 ? '+' : ''}{metric.percentage}%
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Profitability Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Profitability Analysis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className={`text-2xl font-bold ${getMarginColor(data.profitability.ebitda_margin, { good: 20, fair: 10 })}`}>
                {data.profitability.ebitda_margin}%
              </div>
              <div className="text-sm text-muted-foreground">EBITDA Margin</div>
              <Progress value={Math.min(data.profitability.ebitda_margin, 100)} className="mt-2" />
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${getMarginColor(data.profitability.net_margin, { good: 15, fair: 5 })}`}>
                {data.profitability.net_margin}%
              </div>
              <div className="text-sm text-muted-foreground">Net Margin</div>
              <Progress value={Math.min(data.profitability.net_margin, 100)} className="mt-2" />
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${getMarginColor(data.profitability.gross_margin, { good: 60, fair: 40 })}`}>
                {data.profitability.gross_margin}%
              </div>
              <div className="text-sm text-muted-foreground">Gross Margin</div>
              <Progress value={Math.min(data.profitability.gross_margin, 100)} className="mt-2" />
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">Margin Trends</h4>
            {data.profitability.margin_trends.map((metric, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm">{metric.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{metric.value}</span>
                  {getTrendIcon(metric.trend)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Cash Flow Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Cash Flow Health</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{data.cash_flow.operating_cash_flow}</div>
              <div className="text-sm text-muted-foreground">Operating Cash Flow</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{data.cash_flow.free_cash_flow}</div>
              <div className="text-sm text-muted-foreground">Free Cash Flow</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {data.cash_flow.cash_conversion}%
              </div>
              <div className="text-sm text-muted-foreground">Cash Conversion</div>
            </div>
          </div>

          {data.cash_flow.seasonal_patterns.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Seasonal Patterns</h4>
              <div className="flex flex-wrap gap-2">
                {data.cash_flow.seasonal_patterns.map((pattern, index) => (
                  <Badge key={index} variant="outline">{pattern}</Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Financial Stability */}
      <Card>
        <CardHeader>
          <CardTitle>Financial Stability Metrics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{data.financial_stability.debt_to_equity}</div>
              <div className="text-sm text-muted-foreground">Debt-to-Equity</div>
              <Badge variant={getRatioStatus(data.financial_stability.debt_to_equity, { min: 0, max: 2 }) === 'healthy' ? 'default' : 'destructive'}>
                {getRatioStatus(data.financial_stability.debt_to_equity, { min: 0, max: 2 })}
              </Badge>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{data.financial_stability.current_ratio}</div>
              <div className="text-sm text-muted-foreground">Current Ratio</div>
              <Badge variant={getRatioStatus(data.financial_stability.current_ratio, { min: 1.2, max: 3 }) === 'healthy' ? 'default' : 'destructive'}>
                {getRatioStatus(data.financial_stability.current_ratio, { min: 1.2, max: 3 })}
              </Badge>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{data.financial_stability.interest_coverage}x</div>
              <div className="text-sm text-muted-foreground">Interest Coverage</div>
              <Badge variant={getRatioStatus(data.financial_stability.interest_coverage, { min: 2.5 }) === 'healthy' ? 'default' : 'destructive'}>
                {getRatioStatus(data.financial_stability.interest_coverage, { min: 2.5 })}
              </Badge>
            </div>
          </div>

          {data.financial_stability.risk_factors.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Risk Factors</h4>
              <div className="space-y-1">
                {data.financial_stability.risk_factors.map((risk, index) => (
                  <div key={index} className="text-sm text-red-600 bg-red-50 p-2 rounded">
                    {risk}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}