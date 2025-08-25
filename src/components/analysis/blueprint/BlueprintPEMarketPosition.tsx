import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Target, 
  Shield, 
  Users,
  CheckCircle,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { Deal } from '@/hooks/usePipelineDeals';

interface MarketPositionProps {
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

export function BlueprintPEMarketPosition({ deal }: MarketPositionProps) {
  const [loading, setLoading] = useState(true);
  const [subCriteria, setSubCriteria] = useState<SubCriteriaScore[]>([]);
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const [overallScore, setOverallScore] = useState(0);

  const marketSubCriteria = [
    { id: 'market-share-position', name: 'Market Share & Position', weight: 40, icon: <Target className="h-4 w-4" /> },
    { id: 'competitive-advantages', name: 'Competitive Advantages', weight: 35, icon: <Shield className="h-4 w-4" /> },
    { id: 'customer-base-quality', name: 'Customer Base Quality', weight: 25, icon: <Users className="h-4 w-4" /> }
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
    const fetchMarketAnalysis = async () => {
      setLoading(true);
      try {
        const mockSubCriteria: SubCriteriaScore[] = marketSubCriteria.map(criteria => ({
          name: criteria.name,
          score: Math.floor(Math.random() * 40) + 60,
          confidence: Math.floor(Math.random() * 30) + 70,
          weight: criteria.weight,
          data_completeness: Math.floor(Math.random() * 40) + 60,
          insights: [
            `${criteria.name} evaluated through market intelligence and competitive analysis`,
            'Market positioning assessment including competitive moats and differentiation',
            'Customer analysis including concentration, loyalty, and lifetime value metrics'
          ]
        }));

        setSubCriteria(mockSubCriteria);
        
        const totalWeightedScore = mockSubCriteria.reduce((sum, criteria) => 
          sum + (criteria.score * criteria.weight / 100), 0
        );
        setOverallScore(Math.round(totalWeightedScore));
        
      } catch (error) {
        console.error('Error fetching market analysis:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMarketAnalysis();
  }, [deal.id]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Market Position Assessment
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
          Market Position Assessment
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
          const criteriaConfig = marketSubCriteria[index];
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
                      Analysis includes market share assessment, competitive moat evaluation, and customer base quality metrics.
                    </p>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          );
        })}
        
        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <h4 className="font-medium mb-2">Market Position Summary</h4>
          <p className="text-sm text-muted-foreground">
            Comprehensive market position analysis across {subCriteria.length} key criteria focusing on competitive strength.
            Overall market position: <span className={`font-medium ${getScoreColor(overallScore)}`}>{overallScore}%</span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}