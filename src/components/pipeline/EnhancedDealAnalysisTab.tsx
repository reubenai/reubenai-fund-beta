import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Brain, 
  Target, 
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  MessageSquare,
  Lightbulb,
  BarChart3
} from 'lucide-react';
import { Deal } from '@/hooks/useOptimizedPipelineDeals';
import { RubricScoreRadar } from './RubricScoreRadar';
import { FundTypeAnalysisPanel } from './FundTypeAnalysisPanel';
import { useFund } from '@/contexts/FundContext';

interface EnhancedDealAnalysisTabProps {
  deal: Deal;
}

export const EnhancedDealAnalysisTab: React.FC<EnhancedDealAnalysisTabProps> = ({ deal }) => {
  const { selectedFund } = useFund();
  const { enhanced_analysis } = deal;

  if (!enhanced_analysis) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Brain className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Enhanced Analysis Available</h3>
            <p className="text-muted-foreground text-center max-w-md">
              Enhanced analysis data is not available for this deal. Use the "Enrich Data" button to generate comprehensive analysis.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getAnalysisScore = () => {
    if (!enhanced_analysis.rubric_breakdown) return null;
    const weightedScore = enhanced_analysis.rubric_breakdown.reduce(
      (sum, item) => sum + (item.score * item.weight / 100), 0
    );
    return Math.round(weightedScore);
  };

  const analysisScore = getAnalysisScore();

  return (
    <div className="space-y-6">
      {/* Analysis Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">Analysis Score</span>
            </div>
            <div className="text-2xl font-bold text-blue-600">
              {analysisScore ? `${analysisScore}%` : 'N/A'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Completeness</span>
            </div>
            <div className="text-2xl font-bold text-green-600">
              {enhanced_analysis.analysis_completeness}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium">Notes Sentiment</span>
            </div>
            <div className="text-lg font-semibold capitalize text-purple-600">
              {enhanced_analysis.notes_intelligence?.sentiment || 'None'}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="rubric" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="rubric">Rubric Analysis</TabsTrigger>
          <TabsTrigger value="fund-alignment">Fund Alignment</TabsTrigger>
          <TabsTrigger value="notes-intelligence">Notes Intelligence</TabsTrigger>
          <TabsTrigger value="engines">Analysis Engines</TabsTrigger>
        </TabsList>

        <TabsContent value="rubric" className="space-y-4">
          {enhanced_analysis.rubric_breakdown ? (
            <RubricScoreRadar 
              rubricBreakdown={enhanced_analysis.rubric_breakdown}
              fundType={selectedFund?.fund_type === 'pe' ? 'pe' : 'vc'}
            />
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <TrendingUp className="h-8 w-8 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No rubric analysis available</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="fund-alignment" className="space-y-4">
          {enhanced_analysis.fund_type_analysis ? (
            <FundTypeAnalysisPanel analysis={enhanced_analysis.fund_type_analysis} />
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <Target className="h-8 w-8 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No fund alignment analysis available</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="notes-intelligence" className="space-y-4">
          {enhanced_analysis.notes_intelligence ? (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Notes Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Sentiment</span>
                      <Badge variant={
                        enhanced_analysis.notes_intelligence.sentiment === 'positive' ? 'default' :
                        enhanced_analysis.notes_intelligence.sentiment === 'negative' ? 'destructive' :
                        'secondary'
                      }>
                        {enhanced_analysis.notes_intelligence.sentiment}
                      </Badge>
                    </div>
                    <Progress value={enhanced_analysis.notes_intelligence.confidence_level} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-1">
                      Confidence: {enhanced_analysis.notes_intelligence.confidence_level}%
                    </p>
                  </div>

                  {enhanced_analysis.notes_intelligence.key_insights.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                        <Lightbulb className="h-4 w-4" />
                        Key Insights
                      </h4>
                      <div className="space-y-2">
                        {enhanced_analysis.notes_intelligence.key_insights.map((insight, index) => (
                          <div key={index} className="text-sm text-muted-foreground bg-blue-50 rounded px-3 py-2">
                            • {insight}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {enhanced_analysis.notes_intelligence.risk_flags.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                        Risk Flags
                      </h4>
                      <div className="space-y-2">
                        {enhanced_analysis.notes_intelligence.risk_flags.map((flag, index) => (
                          <div key={index} className="text-sm text-amber-700 bg-amber-50 rounded px-3 py-2">
                            • {flag}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No notes intelligence available</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="engines" className="space-y-4">
          {enhanced_analysis.analysis_engines ? (
            <div className="grid gap-4">
              {Object.entries(enhanced_analysis.analysis_engines).map(([engineName, engine]) => (
                <Card key={engineName}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium capitalize">{engineName.replace(/_/g, ' ')}</h4>
                      <Badge variant={
                        engine.status === 'complete' ? 'default' :
                        engine.status === 'pending' ? 'secondary' :
                        'destructive'
                      }>
                        {engine.status}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Score</span>
                        <span className="font-medium">{engine.score}%</span>
                      </div>
                      <Progress value={engine.score} className="h-2" />
                      
                      <div className="flex items-center justify-between text-sm">
                        <span>Confidence</span>
                        <span className="font-medium">{engine.confidence}%</span>
                      </div>
                      <Progress value={engine.confidence} className="h-2" />
                      
                      <p className="text-xs text-muted-foreground">
                        Last run: {new Date(engine.last_run).toLocaleDateString()}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <Brain className="h-8 w-8 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No engine analysis available</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};