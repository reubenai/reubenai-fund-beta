import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { ChevronRight, ChevronDown, Shield, Users, Leaf, Building2, Award, AlertTriangle } from 'lucide-react';
import { Deal } from '@/hooks/usePipelineDeals';
import { supabase } from '@/integrations/supabase/client';

interface TrustTransparencyAssessmentProps {
  deal: Deal;
}

interface TrustCriterion {
  id: string;
  name: string;
  weight: number;
  score: number;
  status: string;
  description: string;
  icon: React.ComponentType<any>;
  breakdown?: any;
}

export function TrustTransparencyAssessment({ deal }: TrustTransparencyAssessmentProps) {
  const [expandedCriteria, setExpandedCriteria] = useState<Set<string>>(new Set());
  const [trustData, setTrustData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrustDataAndAssess();
    
    // Listen for background refresh events
    const handleDealEnrichmentComplete = (event: CustomEvent) => {
      if (event.detail?.dealId === deal.id) {
        fetchTrustDataAndAssess();
      }
    };

    window.addEventListener('dealEnrichmentComplete', handleDealEnrichmentComplete as EventListener);
    return () => {
      window.removeEventListener('dealEnrichmentComplete', handleDealEnrichmentComplete as EventListener);
    };
  }, [deal.id]);

  const fetchTrustDataAndAssess = async () => {
    setLoading(true);
    try {
      // Mock trust data - will be replaced with actual research data
      setTrustData(null);
    } catch (error) {
      console.error('Error fetching trust data:', error);
    } finally {
      setLoading(false);
    }
  };

  const assessTrustTransparency = () => {
    const hasTrustData = trustData && trustData.length > 0;
    
    // Corporate Governance (40% weight)
    const governanceBreakdown = hasTrustData ? {
      category: 'Corporate Governance Analysis',
      factors: [
        'Board composition and independence',
        'Management accountability structures',
        'Decision-making processes',
        'Audit and compliance frameworks'
      ],
      methodology: 'Comprehensive governance assessment evaluating board effectiveness, management structures, and compliance frameworks against industry best practices',
      dataRequirements: [
        'Board composition and tenure data',
        'Management team backgrounds',
        'Audit history and findings',
        'Compliance track record'
      ],
      insights: [
        'Governance strength indicators',
        'Management accountability assessment',
        'Board effectiveness evaluation',
        'Compliance risk factors'
      ]
    } : null;

    const corporateGovernance: TrustCriterion = {
      id: 'governance',
      name: 'Corporate Governance',
      weight: 40,
      score: hasTrustData ? 60 : 0,
      status: hasTrustData ? 'Corporate governance assessment in progress' : 'Governance data not available - compliance research required',
      description: hasTrustData ? 'Governance structures evaluated' : 'Corporate governance not assessed',
      icon: Building2,
      breakdown: governanceBreakdown
    };

    // Stakeholder Trust (35% weight)
    const stakeholderBreakdown = hasTrustData ? {
      category: 'Stakeholder Trust Analysis',
      factors: [
        'Customer satisfaction and loyalty',
        'Employee engagement and retention',
        'Supplier relationship strength',
        'Community and regulatory standing'
      ],
      methodology: 'Multi-stakeholder trust evaluation examining relationships with customers, employees, suppliers, and community stakeholders',
      dataRequirements: [
        'Customer satisfaction metrics',
        'Employee retention rates',
        'Supplier relationship data',
        'Community engagement history'
      ],
      insights: [
        'Stakeholder trust levels',
        'Relationship strength indicators',
        'Reputation risk assessment',
        'Trust-building opportunities'
      ]
    } : null;

    const stakeholderTrust: TrustCriterion = {
      id: 'stakeholder_trust',
      name: 'Stakeholder Trust',
      weight: 35,
      score: hasTrustData ? 65 : 0,
      status: hasTrustData ? 'Stakeholder trust evaluation pending' : 'Stakeholder analysis not completed',
      description: hasTrustData ? 'Stakeholder relationships assessed' : 'Trust metrics not evaluated',
      icon: Users,
      breakdown: stakeholderBreakdown
    };

    // ESG Standards (25% weight)
    const esgBreakdown = hasTrustData ? {
      category: 'ESG Standards Assessment',
      factors: [
        'Environmental impact and sustainability',
        'Social responsibility initiatives',
        'Governance and ethical practices',
        'ESG reporting and transparency'
      ],
      methodology: 'Comprehensive ESG evaluation covering environmental impact, social responsibility, and governance practices aligned with industry standards',
      dataRequirements: [
        'Environmental impact data',
        'Social responsibility programs',
        'ESG reporting standards',
        'Sustainability initiatives'
      ],
      insights: [
        'ESG performance indicators',
        'Sustainability risk assessment',
        'Social impact evaluation',
        'ESG compliance status'
      ]
    } : null;

    const esgStandards: TrustCriterion = {
      id: 'esg_standards',
      name: 'ESG Standards',
      weight: 25,
      score: hasTrustData ? 55 : 0,
      status: hasTrustData ? 'ESG standards assessment ongoing' : 'ESG evaluation not completed',
      description: hasTrustData ? 'ESG practices evaluated' : 'ESG standards not assessed',
      icon: Leaf,
      breakdown: esgBreakdown
    };

    return [corporateGovernance, stakeholderTrust, esgStandards];
  };

  const criteria = assessTrustTransparency();
  const totalScore = criteria.reduce((sum, criterion) => sum + (criterion.score * criterion.weight / 100), 0);
  const overallStatus = totalScore >= 75 ? 'Strong' : totalScore >= 50 ? 'Moderate' : totalScore >= 25 ? 'Weak' : 'Poor';
  
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'strong': return 'bg-green-100 text-green-800 border-green-200';
      case 'moderate': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'weak': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'poor': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const toggleCriteriaExpansion = (criteriaId: string) => {
    const newExpanded = new Set(expandedCriteria);
    if (newExpanded.has(criteriaId)) {
      newExpanded.delete(criteriaId);
    } else {
      newExpanded.add(criteriaId);
    }
    setExpandedCriteria(newExpanded);
  };

  const renderExpandedContent = (criterion: TrustCriterion) => {
    if (!criterion.breakdown) {
      return (
        <div className="mt-4 p-4 bg-muted/50 rounded-lg border">
          <p className="text-sm text-muted-foreground">
            Detailed analysis will be available once trust and governance research is completed.
          </p>
        </div>
      );
    }

    const { breakdown } = criterion;
    return (
      <div className="mt-4 space-y-4">
        <div className="p-4 bg-muted/50 rounded-lg border">
          <h5 className="font-medium text-sm mb-2 flex items-center gap-2">
            <Award className="w-4 h-4" />
            Analysis Framework
          </h5>
          <div className="space-y-3">
            <div>
              <h6 className="text-xs font-medium text-muted-foreground mb-1">METHODOLOGY</h6>
              <p className="text-xs">{breakdown.methodology}</p>
            </div>
            <div>
              <h6 className="text-xs font-medium text-muted-foreground mb-1">KEY FACTORS</h6>
              <ul className="text-xs space-y-1">
                {breakdown.factors.map((factor: string, index: number) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="w-1 h-1 bg-muted-foreground rounded-full mt-2 flex-shrink-0"></span>
                    {factor}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="p-4 bg-background rounded-lg border">
            <h6 className="text-xs font-medium text-muted-foreground mb-2">DATA REQUIREMENTS</h6>
            <ul className="text-xs space-y-1">
              {breakdown.dataRequirements.map((req: string, index: number) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="w-1 h-1 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                  {req}
                </li>
              ))}
            </ul>
          </div>

          <div className="p-4 bg-background rounded-lg border">
            <h6 className="text-xs font-medium text-muted-foreground mb-2">KEY INSIGHTS</h6>
            <ul className="text-xs space-y-1">
              {breakdown.insights.map((insight: string, index: number) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="w-1 h-1 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                  {insight}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Trust & Transparency
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-20 bg-muted rounded-lg"></div>
            <div className="space-y-3">
              <div className="h-12 bg-muted rounded-lg"></div>
              <div className="h-12 bg-muted rounded-lg"></div>
              <div className="h-12 bg-muted rounded-lg"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Trust & Transparency
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Score Box */}
        <div className="p-4 bg-muted/30 rounded-lg border">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-background rounded-lg border">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-medium text-sm">Trust & Transparency</h4>
                <p className="text-xs text-muted-foreground">Based on 3 trust factors</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className={getStatusColor(overallStatus)}>
                {overallStatus}
              </Badge>
              <span className="text-sm font-medium">{Math.round(totalScore)}%</span>
            </div>
          </div>
          <Progress value={totalScore} className="h-2" />
        </div>

        {/* Trust Factors */}
        <div>
          <h4 className="font-medium text-sm mb-4 text-muted-foreground">Trust Factors</h4>
          <div className="space-y-3">
            {criteria.map((criterion) => {
              const isExpanded = expandedCriteria.has(criterion.id);
              const Icon = criterion.icon;
              
              return (
                <div key={criterion.id} className="border rounded-lg overflow-hidden">
                  <Button
                    variant="ghost"
                    className="w-full h-auto p-4 justify-between hover:bg-muted/50"
                    onClick={() => toggleCriteriaExpansion(criterion.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-background rounded border">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="text-left">
                        <div className="font-medium text-sm">{criterion.name}</div>
                        <div className="text-xs text-muted-foreground">{criterion.status}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground">Weight: {criterion.weight}%</div>
                        <div className="text-sm font-medium">{criterion.score}/100</div>
                      </div>
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </div>
                  </Button>
                  
                  {isExpanded && (
                    <div className="px-4 pb-4">
                      {renderExpandedContent(criterion)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Trust & Transparency Concerns */}
        <div className="flex items-start gap-2 p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <AlertTriangle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
          <span className="text-sm text-orange-800">
            Trust and transparency assessment pending - governance and ESG analysis required.
          </span>
        </div>
      </CardContent>
    </Card>
  );
}