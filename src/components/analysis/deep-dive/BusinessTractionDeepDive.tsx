import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Target, 
  TrendingUp, 
  TrendingDown,
  Users,
  Handshake,
  BarChart3,
  CheckCircle,
  AlertTriangle,
  Clock
} from 'lucide-react';
import { TractionDeepDive } from '@/types/enhanced-deal-analysis';

interface BusinessTractionDeepDiveProps {
  data: TractionDeepDive;
}

export function BusinessTractionDeepDive({ data }: BusinessTractionDeepDiveProps) {
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return <TrendingUp className="h-3 w-3 text-success" />;
      case 'declining': return <TrendingDown className="h-3 w-3 text-destructive" />;
      default: return <BarChart3 className="h-3 w-3 text-muted-foreground" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'improving': return 'text-success';
      case 'declining': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Target className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Business Traction Deep Dive</h3>
      </div>

      {/* Customer Metrics */}
      {data.customer_metrics && data.customer_metrics.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4" />
              Customer Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {data.customer_metrics.map((metric, index) => (
                <div key={index} className="border border-border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold">{metric.metric}</h4>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-lg font-mono">
                        {metric.value}
                      </Badge>
                      <div className={`flex items-center gap-1 ${getTrendColor(metric.trend)}`}>
                        {getTrendIcon(metric.trend)}
                        <span className="text-xs font-medium capitalize">{metric.trend}</span>
                      </div>
                    </div>
                  </div>
                  {metric.benchmark && (
                    <div className="text-sm text-muted-foreground">
                      Industry Benchmark: {metric.benchmark}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Partnership Pipeline */}
      {data.partnership_pipeline && data.partnership_pipeline.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Handshake className="h-4 w-4" />
              Partnership Pipeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.partnership_pipeline.map((partnership, index) => (
                <div key={index} className="border border-border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold">{partnership.partner}</h4>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{partnership.type}</Badge>
                      <Badge 
                        variant={
                          partnership.status === 'active' ? 'default' :
                          partnership.status === 'negotiating' ? 'secondary' : 'outline'
                        }
                      >
                        {partnership.status === 'active' && <CheckCircle className="h-3 w-3 mr-1" />}
                        {partnership.status === 'negotiating' && <Clock className="h-3 w-3 mr-1" />}
                        {partnership.status}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{partnership.strategic_value}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Market Penetration */}
      {data.market_penetration && data.market_penetration.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="h-4 w-4" />
              Market Penetration Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.market_penetration.map((penetration, index) => (
                <div key={index} className="border border-border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold">{penetration.segment}</h4>
                    <Badge variant="outline">{penetration.current_penetration}</Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <h5 className="font-medium text-muted-foreground mb-1">Addressable Market</h5>
                      <p className="text-primary">{penetration.addressable_market}</p>
                    </div>
                    <div>
                      <h5 className="font-medium text-muted-foreground mb-1">Growth Potential</h5>
                      <p className="text-success">{penetration.growth_potential}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Growth Trajectory */}
      {data.growth_trajectory && data.growth_trajectory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4" />
              Growth Trajectory
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.growth_trajectory.map((growth, index) => (
                <div key={index} className="border border-border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-semibold">{growth.metric}</h4>
                      <Badge variant="outline" className="mt-1">{growth.period}</Badge>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-primary">{growth.value}</div>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{growth.context}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}