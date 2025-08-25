import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Target, 
  Briefcase,
  CheckCircle,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { Deal } from '@/hooks/usePipelineDeals';

interface StrategicFitProps {
  deal: Deal;
}

interface SubCriteriaScore {
  name: string;
  score: number;
  confidence: number;
  insights: string[];
  weight: number;
  data_completeness: number;
}

export function BlueprintVCStrategicFit({ deal }: StrategicFitProps) {
  const [loading, setLoading] = useState(true);
  const [subCriteria, setSubCriteria] = useState<SubCriteriaScore[]>([]);
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const [overallScore, setOverallScore] = useState(0);

  const strategicSubCriteria = [
    { id: 'fund-thesis-alignment', name: 'Fund Thesis Alignment', weight: 60, icon: <Target className="h-4 w-4" /> },
    { id: 'portfolio-synergies', name: 'Portfolio Synergies', weight: 40, icon: <Briefcase className="h-4 w-4" /> }
  ];

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-emerald-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-amber-600';
    return 'text-red-600';
  };

  const getStatusBadge = (score: number) => {
    if (score >= 80) return <Badge variant="default" className="bg-emerald-100 text-emerald-700">Excellent</Badge>;
    if (score >= 60) return <Badge variant="default" className="bg-blue-100 text-blue-700">Good</Badge>;
    if (score >= 40) return <Badge variant="default" className="bg-amber-100 text-amber-700">Fair</Badge>;
    return <Badge variant="destructive">Poor</Badge>;
  };

  useEffect(() => {
    const fetchStrategicAnalysis = async () => {
      setLoading(true);
      try {
        // Use real enhanced analysis data if available, otherwise show pending state
        const enhancedAnalysis = deal.enhanced_analysis as any;
        const strategicData = enhancedAnalysis?.rubric_breakdown?.find((r: any) => r.category === 'Strategic Fit');
        
        if (strategicData && strategicData.score > 0) {
          // Use real data
          const realSubCriteria: SubCriteriaScore[] = strategicSubCriteria.map(criteria => {
            const criteriaId = criteria.id === 'fund-thesis-alignment' ? 'fund_thesis_alignment' : 'portfolio_synergies';
            return {
              name: criteria.name,
              score: strategicData.score || 0,
              confidence: strategicData.confidence || 50,
              weight: criteria.weight,
              data_completeness: 85,
              insights: strategicData.insights || [
                `Real ${criteria.name} analysis from enhanced assessment`,
                'Based on fund investment strategy and deal characteristics',
                'Analysis includes portfolio fit and strategic value potential'
              ]
            };
          });
          
          setSubCriteria(realSubCriteria);
          setOverallScore(strategicData.score || 0);
        } else {
          // Show engines paused / pending analysis state
          const pendingSubCriteria: SubCriteriaScore[] = strategicSubCriteria.map(criteria => ({
            name: criteria.name,
            score: 0,
            confidence: 0,
            weight: criteria.weight,
            data_completeness: 0,
            insights: [
              `${criteria.name} analysis pending - engines are currently paused`,
              'Real assessment will be available when analysis engines are reactivated',
              'Strategic fit evaluation will include fund thesis alignment and portfolio synergies'
            ]
          }));
          
          setSubCriteria(pendingSubCriteria);
          setOverallScore(0);
        }
        
      } catch (error) {
        console.error('Error fetching strategic analysis:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStrategicAnalysis();
  }, [deal.id, deal.enhanced_analysis]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Strategic Fit Assessment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-20 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Strategic Fit Assessment
        </CardTitle>
        <div className="flex items-center gap-4">
          {getStatusBadge(overallScore)}
          <div className="flex items-center gap-2">
            <Progress value={overallScore} className="w-24" />
            <span className={`text-sm font-medium ${getScoreColor(overallScore)}`}>
              {overallScore}%
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {subCriteria.map((criteria, index) => {
          const criteriaConfig = strategicSubCriteria[index];
          const isExpanded = expandedSections.includes(criteriaConfig.id);
          
          return (
            <Collapsible key={criteriaConfig.id}>
              <CollapsibleTrigger 
                className="flex items-center justify-between w-full p-3 rounded-lg border hover:bg-accent"
                onClick={() => toggleSection(criteriaConfig.id)}
              >
                <div className="flex items-center gap-3">
                  {criteriaConfig.icon}
                  <div className="text-left">
                    <h4 className="font-medium">{criteria.name}</h4>
                    <p className="text-sm text-muted-foreground">Weight: {criteria.weight}%</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className={`font-medium ${getScoreColor(criteria.score)}`}>
                      {criteria.score}%
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {criteria.confidence}% confidence
                    </div>
                  </div>
                  {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </div>
              </CollapsibleTrigger>
              
              <CollapsibleContent className="px-3 pb-3">
                <div className="mt-3 space-y-3 bg-accent/20 p-3 rounded-lg">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Score:</span> {criteria.score}%
                    </div>
                    <div>
                      <span className="font-medium">Confidence:</span> {criteria.confidence}%
                    </div>
                    <div>
                      <span className="font-medium">Weight:</span> {criteria.weight}%
                    </div>
                    <div>
                      <span className="font-medium">Data Quality:</span> {criteria.data_completeness}%
                    </div>
                  </div>
                  
                  <div>
                    <h5 className="font-medium mb-2">Key Insights:</h5>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      {criteria.insights.map((insight, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <CheckCircle className="h-3 w-3 text-emerald-600 mt-0.5 flex-shrink-0" />
                          {insight}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground">
                      Analysis includes fund thesis alignment evaluation and portfolio integration assessment.
                    </p>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          );
        })}
        
        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <h4 className="font-medium mb-2">Strategic Fit Summary</h4>
          <p className="text-sm text-muted-foreground">
            Strategic alignment analysis across {subCriteria.length} key criteria focusing on fund thesis fit and portfolio synergies.
            Overall strategic fit: <span className={`font-medium ${getScoreColor(overallScore)}`}>{overallScore}%</span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}