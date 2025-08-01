import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, Clock, TrendingUp, Users, DollarSign, Target, Lightbulb } from 'lucide-react';

interface BatchAnalysisResult {
  dealId: string;
  status: 'processing' | 'complete' | 'error';
  overallScore?: number;
  engines: {
    financial: boolean;
    productIp: boolean;
    market: boolean;
    team: boolean;
    thesis: boolean;
  };
}

interface BatchAnalysisProgressProps {
  results: BatchAnalysisResult[];
}

export const BatchAnalysisProgress: React.FC<BatchAnalysisProgressProps> = ({ results }) => {
  const totalDeals = results.length;
  const completedDeals = results.filter(r => r.status === 'complete').length;
  const errorDeals = results.filter(r => r.status === 'error').length;
  const processingDeals = results.filter(r => r.status === 'processing').length;
  
  const overallProgress = totalDeals > 0 ? (completedDeals / totalDeals) * 100 : 0;

  const getEngineIcon = (engine: string) => {
    switch (engine) {
      case 'financial':
        return <DollarSign className="w-4 h-4" />;
      case 'productIp':
        return <Lightbulb className="w-4 h-4" />;
      case 'market':
        return <TrendingUp className="w-4 h-4" />;
      case 'team':
        return <Users className="w-4 h-4" />;
      case 'thesis':
        return <Target className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getEngineLabel = (engine: string) => {
    switch (engine) {
      case 'financial':
        return 'Financial Analysis';
      case 'productIp':
        return 'Product & IP';
      case 'market':
        return 'Market Research';
      case 'team':
        return 'Team Analysis';
      case 'thesis':
        return 'Thesis Alignment';
      default:
        return engine;
    }
  };

  const getScoreColor = (score?: number) => {
    if (!score) return 'text-muted-foreground';
    if (score >= 8) return 'text-green-600';
    if (score >= 6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadge = (score?: number) => {
    if (!score) return null;
    
    if (score >= 8) {
      return <Badge className="bg-green-100 text-green-800 border-green-200">Strong</Badge>;
    }
    if (score >= 6) {
      return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Moderate</Badge>;
    }
    return <Badge className="bg-red-100 text-red-800 border-red-200">Weak</Badge>;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>AI Analysis Progress</span>
            <div className="flex gap-2">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <CheckCircle className="w-3 h-3 mr-1" />
                {completedDeals} Complete
              </Badge>
              {processingDeals > 0 && (
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  <Clock className="w-3 h-3 mr-1" />
                  {processingDeals} Processing
                </Badge>
              )}
              {errorDeals > 0 && (
                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  {errorDeals} Error
                </Badge>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Overall Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Overall Progress</span>
                <span>{Math.round(overallProgress)}%</span>
              </div>
              <Progress value={overallProgress} className="h-2" />
            </div>

            {/* Individual Deal Progress */}
            <div className="space-y-3">
              {results.map((result, index) => (
                <Card key={result.dealId} className="p-4">
                  <div className="space-y-3">
                    {/* Deal Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Deal {index + 1}</span>
                        {result.status === 'complete' && (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        )}
                        {result.status === 'processing' && (
                          <Clock className="w-4 h-4 text-blue-600 animate-spin" />
                        )}
                        {result.status === 'error' && (
                          <AlertCircle className="w-4 h-4 text-red-600" />
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {result.overallScore && (
                          <>
                            <span className={`text-lg font-bold ${getScoreColor(result.overallScore)}`}>
                              {result.overallScore.toFixed(1)}
                            </span>
                            {getScoreBadge(result.overallScore)}
                          </>
                        )}
                      </div>
                    </div>

                    {/* Engine Progress */}
                    <div className="grid grid-cols-5 gap-2">
                      {Object.entries(result.engines).map(([engine, completed]) => (
                        <div
                          key={engine}
                          className={`p-2 rounded-lg text-center transition-colors ${
                            completed 
                              ? 'bg-green-100 text-green-700 border border-green-200' 
                              : result.status === 'processing'
                                ? 'bg-blue-100 text-blue-700 border border-blue-200'
                                : 'bg-muted text-muted-foreground border'
                          }`}
                        >
                          <div className="flex flex-col items-center gap-1">
                            {getEngineIcon(engine)}
                            <span className="text-xs font-medium">
                              {getEngineLabel(engine)}
                            </span>
                            {completed && result.status === 'complete' && (
                              <CheckCircle className="w-3 h-3" />
                            )}
                            {!completed && result.status === 'processing' && (
                              <Clock className="w-3 h-3 animate-spin" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Status Message */}
                    <div className="text-sm text-muted-foreground">
                      {result.status === 'complete' && 'Comprehensive analysis complete'}
                      {result.status === 'processing' && 'Running AI engines...'}
                      {result.status === 'error' && 'Analysis failed - please retry'}
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Analysis Summary */}
            {completedDeals > 0 && (
              <div className="mt-6 p-4 bg-muted/30 rounded-lg">
                <h4 className="font-medium mb-2">Analysis Summary</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="text-center">
                    <div className="font-bold text-lg text-green-600">{completedDeals}</div>
                    <div className="text-muted-foreground">Analyzed</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-lg text-blue-600">
                      {results.filter(r => r.overallScore && r.overallScore >= 8).length}
                    </div>
                    <div className="text-muted-foreground">Strong Deals</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-lg text-yellow-600">
                      {results.filter(r => r.overallScore && r.overallScore >= 6 && r.overallScore < 8).length}
                    </div>
                    <div className="text-muted-foreground">Moderate Deals</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-lg text-purple-600">
                      {results.reduce((sum, r) => sum + Object.values(r.engines).filter(Boolean).length, 0)}
                    </div>
                    <div className="text-muted-foreground">Engine Runs</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};