import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  User, 
  Award,
  AlertTriangle,
  Linkedin,
  CheckCircle,
  ExternalLink,
  Target
} from 'lucide-react';
import { TeamDeepDive } from '@/types/enhanced-deal-analysis';

interface TeamLeadershipDeepDiveProps {
  data: TeamDeepDive;
}

export function TeamLeadershipDeepDive({ data }: TeamLeadershipDeepDiveProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Users className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Team & Leadership Deep Dive</h3>
      </div>

      {/* Founder Profiles */}
      {data.founder_profiles && data.founder_profiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="h-4 w-4" />
              Founder Profiles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {data.founder_profiles.map((founder, index) => (
                <div key={index} className="border border-border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-lg">{founder.name}</h4>
                      <Badge variant="outline" className="mt-1">{founder.role}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      {founder.linkedin_validated && (
                        <Badge variant="default" className="flex items-center gap-1">
                          <Linkedin className="h-3 w-3" />
                          Verified
                        </Badge>
                      )}
                      {founder.previous_exits && founder.previous_exits.length > 0 && (
                        <Badge variant="secondary">
                          {founder.previous_exits.length} Previous Exit{founder.previous_exits.length > 1 ? 's' : ''}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-4">{founder.background}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h5 className="font-medium mb-2">Expertise Areas</h5>
                      <div className="flex flex-wrap gap-1">
                        {founder.expertise_areas.map((area, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {area}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    {founder.previous_exits && founder.previous_exits.length > 0 && (
                      <div>
                        <h5 className="font-medium mb-2">Previous Exits</h5>
                        <ul className="space-y-1">
                          {founder.previous_exits.map((exit, i) => (
                            <li key={i} className="text-sm flex items-center gap-2">
                              <ExternalLink className="h-3 w-3 text-success" />
                              {exit}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Team Gaps */}
      {data.team_gaps && data.team_gaps.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4 text-warning" />
              Team Gaps & Hiring Needs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {data.team_gaps.map((gap, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <span className="w-1.5 h-1.5 bg-warning rounded-full mt-2 flex-shrink-0" />
                  {gap}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Execution Track Record */}
      {data.execution_track_record && data.execution_track_record.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="h-4 w-4" />
              Execution Track Record
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.execution_track_record.map((metric, index) => (
                <div key={index} className="border border-border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">{metric.milestone}</h4>
                    <Badge variant="outline">{metric.achievement_date}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{metric.impact}</p>
                  {metric.validation_source && (
                    <div className="text-xs text-success flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Validated by: {metric.validation_source}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Advisory Strength */}
      {data.advisory_strength && data.advisory_strength.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Award className="h-4 w-4" />
              Advisory Board Strength
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {data.advisory_strength.map((advisor, index) => (
                <div key={index} className="flex items-center justify-between p-3 border border-border rounded-lg">
                  <div className="flex-1">
                    {advisor.name && (
                      <h4 className="font-semibold text-sm">{advisor.name}</h4>
                    )}
                    <p className="text-sm text-muted-foreground">{advisor.expertise}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={
                        advisor.influence_level === 'high' ? 'default' :
                        advisor.influence_level === 'medium' ? 'secondary' : 'outline'
                      }
                      className="text-xs"
                    >
                      {advisor.influence_level} influence
                    </Badge>
                    {advisor.active_involvement && (
                      <Badge variant="outline" className="text-xs">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Active
                      </Badge>
                    )}
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