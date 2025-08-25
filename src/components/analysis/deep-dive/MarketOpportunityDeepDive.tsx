import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  Globe, 
  Users, 
  Target,
  Building2,
  MapPin,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { MarketDeepDive } from '@/types/enhanced-deal-analysis';

interface MarketOpportunityDeepDiveProps {
  data: MarketDeepDive;
}

export function MarketOpportunityDeepDive({ data }: MarketOpportunityDeepDiveProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Market Opportunity Deep Dive</h3>
      </div>

      {/* Enhanced TAM/SAM/SOM Analysis with Global/Regional/Local Breakdown */}
      {data.tam_sam_som && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Globe className="h-4 w-4" />
              Market Sizing Analysis (TAM/SAM/SOM)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Primary Market Size Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <div className="text-2xl font-bold text-primary">{data.tam_sam_som.tam}</div>
                <div className="text-sm text-muted-foreground">Total Addressable Market (Global)</div>
              </div>
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <div className="text-2xl font-bold text-secondary">{data.tam_sam_som.sam}</div>
                <div className="text-sm text-muted-foreground">Serviceable Addressable Market (Regional)</div>
              </div>
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <div className="text-2xl font-bold text-accent">{data.tam_sam_som.som}</div>
                <div className="text-sm text-muted-foreground">Serviceable Obtainable Market (Local)</div>
              </div>
            </div>

            {/* Global/Regional/Local Market Breakdown */}
            <div className="space-y-4">
              <div className="border border-border rounded-lg p-4">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Global Market Analysis (TAM)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <h5 className="font-medium text-primary mb-2">Global Drivers</h5>
                    <ul className="space-y-1">
                      {data.tam_sam_som?.global_analysis?.drivers?.map((driver, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                          {driver}
                        </li>
                      )) || (
                        <>
                          <li className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                            Worldwide digital transformation trends
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                            Cross-border regulatory harmonization
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                            International adoption patterns
                          </li>
                        </>
                      )}
                    </ul>
                  </div>
                  <div>
                    <h5 className="font-medium text-warning mb-2">Global Challenges</h5>
                    <ul className="space-y-1">
                      {data.tam_sam_som?.global_analysis?.challenges?.map((challenge, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 bg-warning rounded-full mt-2 flex-shrink-0" />
                          {challenge}
                        </li>
                      )) || (
                        <>
                          <li className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 bg-warning rounded-full mt-2 flex-shrink-0" />
                            Regulatory complexity across regions
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 bg-warning rounded-full mt-2 flex-shrink-0" />
                            Cultural adaptation requirements
                          </li>
                        </>
                      )}
                    </ul>
                  </div>
                </div>
              </div>

              <div className="border border-border rounded-lg p-4">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Regional Market Focus (SAM)
                  {data.regional_growth_rate && (
                    <Badge variant="outline" className="ml-2">
                      {data.regional_growth_rate.rate}% CAGR ({data.regional_growth_rate.vs_global})
                    </Badge>
                  )}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <h5 className="font-medium text-secondary mb-2">Regional Opportunities</h5>
                    <ul className="space-y-1">
                      {data.tam_sam_som?.regional_analysis?.opportunities?.map((opportunity, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 bg-secondary rounded-full mt-2 flex-shrink-0" />
                          {opportunity}
                        </li>
                      )) || (
                        <>
                          <li className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 bg-secondary rounded-full mt-2 flex-shrink-0" />
                            Targeted regulatory environment
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 bg-secondary rounded-full mt-2 flex-shrink-0" />
                            Regional partnership networks
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 bg-secondary rounded-full mt-2 flex-shrink-0" />
                            Market maturity advantages
                          </li>
                        </>
                      )}
                    </ul>
                  </div>
                  <div>
                    <h5 className="font-medium text-warning mb-2">Regional Barriers</h5>
                    <ul className="space-y-1">
                      {data.tam_sam_som?.regional_analysis?.barriers?.map((barrier, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 bg-warning rounded-full mt-2 flex-shrink-0" />
                          {barrier}
                        </li>
                      )) || (
                        <>
                          <li className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 bg-warning rounded-full mt-2 flex-shrink-0" />
                            Regional competitive pressure
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 bg-warning rounded-full mt-2 flex-shrink-0" />
                            Local market preferences
                          </li>
                        </>
                      )}
                    </ul>
                  </div>
                </div>
                {data.regional_growth_rate?.growth_comparison && (
                  <div className="mt-3 p-2 bg-blue-50/50 rounded border text-sm">
                    <strong>Growth Comparison:</strong> {data.regional_growth_rate.growth_comparison}
                  </div>
                )}
              </div>

              <div className="border border-border rounded-lg p-4">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Local Market Penetration (SOM)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <h5 className="font-medium text-accent mb-2">Local Advantages</h5>
                    <ul className="space-y-1">
                      {data.tam_sam_som?.local_analysis?.advantages?.map((advantage, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 bg-accent rounded-full mt-2 flex-shrink-0" />
                          {advantage}
                        </li>
                      )) || (
                        <>
                          <li className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 bg-accent rounded-full mt-2 flex-shrink-0" />
                            Direct market access and presence
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 bg-accent rounded-full mt-2 flex-shrink-0" />
                            Local customer relationships
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 bg-accent rounded-full mt-2 flex-shrink-0" />
                            Operational infrastructure
                          </li>
                        </>
                      )}
                    </ul>
                  </div>
                  <div>
                    <h5 className="font-medium text-warning mb-2">Penetration Constraints</h5>
                    <ul className="space-y-1">
                      {data.tam_sam_som?.local_analysis?.constraints?.map((constraint, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 bg-warning rounded-full mt-2 flex-shrink-0" />
                          {constraint}
                        </li>
                      )) || (
                        <>
                          <li className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 bg-warning rounded-full mt-2 flex-shrink-0" />
                            Resource allocation limits
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 bg-warning rounded-full mt-2 flex-shrink-0" />
                            Market capture timeline
                          </li>
                        </>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Growth Drivers & Market Risks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.growth_drivers && data.growth_drivers.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CheckCircle className="h-4 w-4 text-success" />
                Growth Drivers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {data.growth_drivers.map((driver, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <span className="w-1.5 h-1.5 bg-success rounded-full mt-2 flex-shrink-0" />
                    {driver}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {data.market_risks && data.market_risks.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <AlertTriangle className="h-4 w-4 text-warning" />
                Market Risks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {data.market_risks.map((risk, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <span className="w-1.5 h-1.5 bg-warning rounded-full mt-2 flex-shrink-0" />
                    {risk}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Competitive Positioning */}
      {data.competitive_positioning && data.competitive_positioning.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="h-4 w-4" />
              Competitive Landscape
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.competitive_positioning.map((competitor, index) => (
                <div key={index} className="border border-border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold">{competitor.name}</h4>
                    <div className="flex items-center gap-2">
                      {competitor.market_share && (
                        <Badge variant="outline">{competitor.market_share} market share</Badge>
                      )}
                      {competitor.funding_stage && (
                        <Badge variant="secondary">{competitor.funding_stage}</Badge>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{competitor.positioning}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <h5 className="font-medium text-success mb-1">Strengths</h5>
                      <ul className="space-y-1">
                        {competitor.strengths.map((strength, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="w-1 h-1 bg-success rounded-full mt-2 flex-shrink-0" />
                            {strength}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h5 className="font-medium text-warning mb-1">Weaknesses</h5>
                      <ul className="space-y-1">
                        {competitor.weaknesses.map((weakness, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="w-1 h-1 bg-warning rounded-full mt-2 flex-shrink-0" />
                            {weakness}
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
      )}

      {/* Customer Validation */}
      {data.customer_validation && data.customer_validation.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4" />
              Customer Validation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {data.customer_validation.map((validation, index) => (
                <div key={index} className="border border-border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">{validation.segment}</h4>
                    <Badge 
                      variant={
                        validation.validation_level === 'high' ? 'default' :
                        validation.validation_level === 'medium' ? 'secondary' : 'outline'
                      }
                    >
                      {validation.validation_level} validation
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{validation.feedback}</p>
                  {validation.revenue_potential && (
                    <div className="text-xs text-primary">
                      Revenue Potential: {validation.revenue_potential}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Geographic Opportunities */}
      {data.geographic_opportunities && data.geographic_opportunities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPin className="h-4 w-4" />
              Geographic Expansion
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {data.geographic_opportunities.map((geo, index) => (
                <div key={index} className="border border-border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">{geo.region}</h4>
                    <Badge variant="outline">{geo.market_size}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{geo.penetration_opportunity}</p>
                  {geo.regulatory_barriers && geo.regulatory_barriers.length > 0 && (
                    <div>
                      <h5 className="text-xs font-medium text-warning mb-1">Regulatory Barriers</h5>
                      <ul className="text-xs space-y-1">
                        {geo.regulatory_barriers.map((barrier, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="w-1 h-1 bg-warning rounded-full mt-1.5 flex-shrink-0" />
                            {barrier}
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
      )}
    </div>
  );
}