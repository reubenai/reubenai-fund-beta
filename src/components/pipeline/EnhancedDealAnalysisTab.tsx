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
  BarChart3,
  Clock,
  Zap
} from 'lucide-react';
import { Deal as BaseDeal } from '@/hooks/usePipelineDeals';
import { EnhancedDealAnalysis } from '@/types/enhanced-deal-analysis';
import { RubricScoreRadar } from './RubricScoreRadar';
import { FundTypeAnalysisPanel } from './FundTypeAnalysisPanel';
import { useFund } from '@/contexts/FundContext';

// Extend the Deal type to include enhanced_analysis
type Deal = BaseDeal & {
  enhanced_analysis?: EnhancedDealAnalysis;
};

interface EnhancedDealAnalysisTabProps {
  deal: Deal;
}

export const EnhancedDealAnalysisTab: React.FC<EnhancedDealAnalysisTabProps> = ({ deal }) => {
  const { selectedFund } = useFund();
  const { enhanced_analysis } = deal;

  if (!enhanced_analysis) {
    return (
      <div className="space-y-6">
        <Card className="border-amber-200 bg-amber-50/30">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Brain className="h-12 w-12 text-amber-500 mb-4" />
            <h3 className="text-lg font-medium mb-2 text-amber-800">Analysis In Progress</h3>
            <p className="text-amber-700 text-center max-w-md">
              Enhanced analysis is being generated. Use the "Enrich Data" button to accelerate the process.
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
      {/* Executive Analysis Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-emerald-100 bg-emerald-50/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="h-4 w-4 text-emerald-600" />
              <span className="text-sm font-medium text-emerald-800">Overall Score</span>
            </div>
            <div className="text-2xl font-bold text-emerald-700">
              {analysisScore ? `${analysisScore}%` : 'Calculating'}
            </div>
            <div className="text-xs text-emerald-600 mt-1">
              Weighted average
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-100 bg-blue-50/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">Completeness</span>
            </div>
            <div className="text-2xl font-bold text-blue-700">
              {enhanced_analysis.analysis_completeness}%
            </div>
            <div className="text-xs text-blue-600 mt-1">
              Data coverage
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-100 bg-purple-50/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-800">Sentiment</span>
            </div>
            <div className="text-lg font-semibold capitalize text-purple-700">
              {enhanced_analysis.notes_intelligence?.sentiment || 'Neutral'}
            </div>
            <div className="text-xs text-purple-600 mt-1">
              Notes analysis
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-100 bg-slate-50/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-slate-600" />
              <span className="text-sm font-medium text-slate-800">Last Updated</span>
            </div>
            <div className="text-sm font-medium text-slate-700">
              {enhanced_analysis.last_comprehensive_analysis 
                ? new Date(enhanced_analysis.last_comprehensive_analysis).toLocaleDateString()
                : 'Unknown'
              }
            </div>
            <div className="text-xs text-slate-600 mt-1">
              Analysis date
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Comprehensive Analysis Tabs */}
      <Tabs defaultValue="rubric" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-slate-50">
          <TabsTrigger value="rubric" className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white">
            <BarChart3 className="w-4 h-4 mr-2" />
            Rubric Breakdown
          </TabsTrigger>
          <TabsTrigger value="engines" className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white">
            <Brain className="w-4 h-4 mr-2" />
            Engine Performance
          </TabsTrigger>
          <TabsTrigger value="fund-alignment" className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white">
            <Target className="w-4 h-4 mr-2" />
            Fund Alignment
          </TabsTrigger>
          <TabsTrigger value="intelligence" className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white">
            <Lightbulb className="w-4 h-4 mr-2" />
            Intelligence Report
          </TabsTrigger>
        </TabsList>

        {/* Comprehensive Rubric Analysis */}
        <TabsContent value="rubric" className="space-y-6">
          {enhanced_analysis.rubric_breakdown ? (
            <>
              {/* Radar Chart Overview */}
              <Card className="border-emerald-100">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-emerald-800">
                    <BarChart3 className="h-5 w-5" />
                    Comprehensive Rubric Analysis
                  </CardTitle>
                  <p className="text-sm text-slate-600">
                    Detailed breakdown of all evaluation criteria with weighted scoring and confidence levels
                  </p>
                </CardHeader>
                <CardContent>
                  <RubricScoreRadar 
                    rubricBreakdown={enhanced_analysis.rubric_breakdown}
                    fundType={selectedFund?.fund_type === 'pe' ? 'pe' : 'vc'}
                  />
                </CardContent>
              </Card>

              {/* Detailed Criteria Deep Dive */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-slate-800 border-b border-slate-200 pb-2">
                  Detailed Criteria Analysis
                </h3>
                
                {enhanced_analysis.rubric_breakdown.map((item, index) => (
                  <Card key={index} className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg text-slate-700 flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${
                            item.score >= 80 ? 'bg-emerald-500' :
                            item.score >= 60 ? 'bg-amber-500' :
                            'bg-red-500'
                          }`} />
                          {item.category}
                        </CardTitle>
                        <div className="flex items-center gap-3">
                          <Badge 
                            variant="outline" 
                            className={`${
                              item.score >= 80 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                              item.score >= 60 ? 'bg-amber-50 text-amber-700 border-amber-200' :
                              'bg-red-50 text-red-700 border-red-200'
                            }`}
                          >
                            {item.score}% Score
                          </Badge>
                          <Badge variant="secondary" className="bg-slate-100 text-slate-700">
                            {item.weight}% Weight
                          </Badge>
                          <Badge variant="outline" className="border-blue-200 text-blue-700">
                            {item.confidence}% Confidence
                          </Badge>
                        </div>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="space-y-2">
                        <Progress value={item.score} className="h-3" />
                        <div className="flex justify-between text-xs text-slate-500">
                          <span>Impact: {Math.round(item.score * item.weight / 100)}% of total</span>
                          <span>Data Quality: {item.confidence >= 80 ? 'High' : item.confidence >= 60 ? 'Medium' : 'Low'}</span>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-6">
                      {/* Strengths Section */}
                      {item.strengths && item.strengths.length > 0 && (
                        <div className="bg-emerald-50 rounded-lg p-4">
                          <h4 className="font-medium text-emerald-800 mb-3 flex items-center gap-2">
                            <CheckCircle className="w-5 h-5" />
                            Key Strengths & Advantages
                          </h4>
                          <ul className="space-y-2">
                            {item.strengths.map((strength, idx) => (
                              <li key={idx} className="text-sm text-emerald-700 flex items-start gap-3">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 mt-2 flex-shrink-0"></span>
                                <span className="leading-relaxed">{strength}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Concerns Section */}
                      {item.concerns && item.concerns.length > 0 && (
                        <div className="bg-amber-50 rounded-lg p-4">
                          <h4 className="font-medium text-amber-800 mb-3 flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5" />
                            Areas of Concern & Risk Factors
                          </h4>
                          <ul className="space-y-2">
                            {item.concerns.map((concern, idx) => (
                              <li key={idx} className="text-sm text-amber-700 flex items-start gap-3">
                                <span className="w-2 h-2 rounded-full bg-amber-500 mt-2 flex-shrink-0"></span>
                                <span className="leading-relaxed">{concern}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Detailed Insights Section */}
                      {item.insights && item.insights.length > 0 && (
                        <div className="bg-blue-50 rounded-lg p-4">
                          <h4 className="font-medium text-blue-800 mb-3 flex items-center gap-2">
                            <Lightbulb className="w-5 h-5" />
                            Deep Analysis & Market Intelligence
                          </h4>
                          <div className="space-y-3">
                            {item.insights.map((insight, idx) => (
                              <div key={idx} className="text-sm text-blue-700 leading-relaxed p-3 bg-white rounded border border-blue-100">
                                {insight}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <BarChart3 className="h-12 w-12 text-slate-400 mb-4" />
                <h3 className="text-lg font-medium text-slate-600 mb-2">Rubric Analysis Unavailable</h3>
                <p className="text-slate-500 text-center">
                  Run enhanced analysis to generate comprehensive rubric scoring
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Analysis Engines Performance */}
        <TabsContent value="engines" className="space-y-6">
          {enhanced_analysis.analysis_engines && Object.keys(enhanced_analysis.analysis_engines).length > 0 ? (
            <>
              <Card className="border-blue-100">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-800">
                    <Brain className="h-5 w-5" />
                    AI Engine Performance Dashboard
                  </CardTitle>
                  <p className="text-sm text-slate-600">
                    Performance metrics and reliability scores for each analysis engine
                  </p>
                </CardHeader>
              </Card>
              
              <div className="grid gap-6">
                {Object.entries(enhanced_analysis.analysis_engines).map(([engineKey, engine]: [string, any]) => (
                  <Card key={engineKey} className="border-slate-200 hover:border-blue-300 transition-colors">
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg text-slate-700 flex items-center gap-2">
                          <Zap className="w-5 h-5 text-blue-600" />
                          {engine.name || engineKey.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                        </CardTitle>
                        <div className="flex items-center gap-3">
                          <Badge 
                            variant={engine.status === 'complete' ? 'default' : 'secondary'}
                            className={engine.status === 'complete' ? 'bg-emerald-600' : 'bg-amber-500'}
                          >
                            {engine.status || 'Unknown'}
                          </Badge>
                          <Badge variant="outline" className="border-blue-200 text-blue-700">
                            v{engine.version || '1.0'}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Performance Metrics */}
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-slate-600">Analysis Score</span>
                            <span className="text-sm font-bold text-emerald-700">{engine.score || 0}%</span>
                          </div>
                          <Progress value={engine.score || 0} className="h-3" />
                          <p className="text-xs text-slate-500">
                            {engine.score >= 80 ? 'Excellent performance' : 
                             engine.score >= 60 ? 'Good performance' : 
                             'Needs improvement'}
                          </p>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-slate-600">Confidence Level</span>
                            <span className="text-sm font-bold text-blue-700">{engine.confidence || 0}%</span>
                          </div>
                          <Progress value={engine.confidence || 0} className="h-3" />
                          <p className="text-xs text-slate-500">
                            {engine.confidence >= 80 ? 'High confidence' : 
                             engine.confidence >= 60 ? 'Medium confidence' : 
                             'Low confidence'}
                          </p>
                        </div>
                      </div>
                      
                      {/* Engine Metadata */}
                      <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                        {engine.last_run && (
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-600">Last Execution:</span>
                            <span className="font-medium text-slate-700">
                              {new Date(engine.last_run).toLocaleString()}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-600">Engine Status:</span>
                          <span className={`font-medium ${
                            engine.status === 'complete' ? 'text-emerald-700' : 'text-amber-700'
                          }`}>
                            {engine.status === 'complete' ? 'Operational' : 'Processing'}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Brain className="h-12 w-12 text-slate-400 mb-4" />
                <h3 className="text-lg font-medium text-slate-600 mb-2">No Engine Data Available</h3>
                <p className="text-slate-500 text-center">
                  Run comprehensive analysis to see AI engine performance metrics
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Fund Alignment Analysis */}
        <TabsContent value="fund-alignment" className="space-y-6">
          {enhanced_analysis.fund_type_analysis ? (
            <FundTypeAnalysisPanel 
              analysis={enhanced_analysis.fund_type_analysis}
            />
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Target className="h-12 w-12 text-slate-400 mb-4" />
                <h3 className="text-lg font-medium text-slate-600 mb-2">Fund Alignment Pending</h3>
                <p className="text-slate-500 text-center">
                  Strategy alignment analysis will appear here once generated
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Comprehensive Intelligence Report */}
        <TabsContent value="intelligence" className="space-y-6">
          {enhanced_analysis.notes_intelligence ? (
            <div className="space-y-6">
              {/* Intelligence Overview */}
              <Card className="border-purple-100 bg-purple-50/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-purple-800">
                    <MessageSquare className="h-5 w-5" />
                    Intelligence Analysis Overview
                  </CardTitle>
                  <p className="text-sm text-purple-700">
                    AI-powered insights extracted from notes, documents, and research data
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white rounded-lg p-4 border border-purple-100">
                      <h4 className="font-medium text-purple-800 mb-2">Overall Sentiment</h4>
                      <div className="flex items-center gap-3">
                        <Badge 
                          variant="outline"
                          className={`${
                            enhanced_analysis.notes_intelligence.sentiment === 'positive' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            enhanced_analysis.notes_intelligence.sentiment === 'negative' ? 'bg-red-50 text-red-700 border-red-200' :
                            enhanced_analysis.notes_intelligence.sentiment === 'mixed' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                            'bg-slate-50 text-slate-700 border-slate-200'
                          } capitalize text-sm`}
                        >
                          {enhanced_analysis.notes_intelligence.sentiment}
                        </Badge>
                        <span className="text-sm text-purple-600">
                          {enhanced_analysis.notes_intelligence.confidence_level}% Confidence
                        </span>
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-lg p-4 border border-purple-100">
                      <h4 className="font-medium text-purple-800 mb-2">Analysis Date</h4>
                      <p className="text-sm text-purple-700">
                        {enhanced_analysis.notes_intelligence.last_analyzed 
                          ? new Date(enhanced_analysis.notes_intelligence.last_analyzed).toLocaleDateString()
                          : 'Not available'
                        }
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Key Insights */}
              {enhanced_analysis.notes_intelligence.key_insights && enhanced_analysis.notes_intelligence.key_insights.length > 0 && (
                <Card className="border-emerald-100">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-emerald-800">
                      <Lightbulb className="h-5 w-5" />
                      Strategic Insights & Opportunities
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {enhanced_analysis.notes_intelligence.key_insights.map((insight: string, idx: number) => (
                        <div key={idx} className="bg-emerald-50 rounded-lg p-4 border border-emerald-100">
                          <div className="flex items-start gap-3">
                            <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-emerald-800 leading-relaxed">{insight}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Risk Flags */}
              {enhanced_analysis.notes_intelligence.risk_flags && enhanced_analysis.notes_intelligence.risk_flags.length > 0 && (
                <Card className="border-red-100">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-red-800">
                      <AlertTriangle className="h-5 w-5" />
                      Risk Assessment & Red Flags
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {enhanced_analysis.notes_intelligence.risk_flags.map((risk: string, idx: number) => (
                        <div key={idx} className="bg-red-50 rounded-lg p-4 border border-red-100">
                          <div className="flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-red-800 leading-relaxed">{risk}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Trend Indicators */}
              {enhanced_analysis.notes_intelligence.trend_indicators && enhanced_analysis.notes_intelligence.trend_indicators.length > 0 && (
                <Card className="border-blue-100">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-blue-800">
                      <TrendingUp className="h-5 w-5" />
                      Market Trends & Indicators
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {enhanced_analysis.notes_intelligence.trend_indicators.map((trend: string, idx: number) => (
                        <div key={idx} className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                          <div className="flex items-start gap-3">
                            <TrendingUp className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-blue-800 leading-relaxed">{trend}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <MessageSquare className="h-12 w-12 text-slate-400 mb-4" />
                <h3 className="text-lg font-medium text-slate-600 mb-2">Intelligence Report Pending</h3>
                <p className="text-slate-500 text-center">
                  Add notes and documents to generate comprehensive intelligence insights
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};