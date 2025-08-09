import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Lightbulb, 
  Shield, 
  Zap,
  Calendar,
  Award,
  FileText,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { ProductDeepDive } from '@/types/enhanced-deal-analysis';

interface ProductTechnologyDeepDiveProps {
  data: ProductDeepDive;
}

export function ProductTechnologyDeepDive({ data }: ProductTechnologyDeepDiveProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Lightbulb className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Product & Technology Deep Dive</h3>
      </div>

      {/* IP Portfolio */}
      {data.ip_portfolio && data.ip_portfolio.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4" />
              Intellectual Property Portfolio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {data.ip_portfolio.map((ip, index) => (
                <div key={index} className="border border-border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="capitalize">
                        {ip.type.replace('_', ' ')}
                      </Badge>
                      <span className="font-semibold">{ip.status}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Defensibility:</span>
                      <Progress value={ip.defensibility_score} className="w-20" />
                      <span className="text-sm font-medium">{ip.defensibility_score}/100</span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{ip.strategic_value}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Competitive Moats */}
      {data.competitive_moats && data.competitive_moats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="h-4 w-4" />
              Competitive Moats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.competitive_moats.map((moat, index) => (
                <div key={index} className="border border-border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold">{moat.moat_type}</h4>
                    <Badge 
                      variant={
                        moat.strength === 'strong' ? 'default' :
                        moat.strength === 'moderate' ? 'secondary' : 'outline'
                      }
                    >
                      {moat.strength}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{moat.sustainability}</p>
                  {moat.competitive_response_time && (
                    <div className="text-xs text-primary">
                      Competitive Response Time: {moat.competitive_response_time}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Technical Advantages */}
      {data.technical_advantages && data.technical_advantages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Zap className="h-4 w-4" />
              Technical Advantages
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {data.technical_advantages.map((advantage, index) => (
                <div key={index} className="flex items-center justify-between p-3 border border-border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm">{advantage.technology}</h4>
                    <p className="text-sm text-muted-foreground">{advantage.advantage_type}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={
                        advantage.differentiation_level === 'high' ? 'default' :
                        advantage.differentiation_level === 'medium' ? 'secondary' : 'outline'
                      }
                      className="text-xs"
                    >
                      {advantage.differentiation_level} differentiation
                    </Badge>
                    {advantage.time_to_replicate && (
                      <Badge variant="outline" className="text-xs">
                        {advantage.time_to_replicate} to replicate
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Development Roadmap */}
      {data.development_roadmap && data.development_roadmap.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="h-4 w-4" />
              Development Roadmap
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.development_roadmap.map((item, index) => (
                <div key={index} className="border border-border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold">{item.feature}</h4>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{item.timeline}</Badge>
                      <Badge 
                        variant={
                          item.strategic_importance === 'critical' ? 'destructive' :
                          item.strategic_importance === 'important' ? 'secondary' : 'outline'
                        }
                      >
                        {item.strategic_importance}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{item.market_demand}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}