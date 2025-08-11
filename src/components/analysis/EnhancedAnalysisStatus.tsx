import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  ChevronDown, 
  Zap, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  BarChart3,
  Brain,
  Target
} from 'lucide-react';
import { EnhancedDealAnalysis } from '@/types/enhanced-deal-analysis';

interface EnhancedAnalysisStatusProps {
  enhancedAnalysis?: EnhancedDealAnalysis;
  dealId: string;
  onAnalysisUpdate?: () => void;
}

export function EnhancedAnalysisStatus({ 
  enhancedAnalysis, 
  dealId, 
  onAnalysisUpdate 
}: EnhancedAnalysisStatusProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState<any>(null);

  // Check if we have real engine data (fix status detection)
  const hasRealData = enhancedAnalysis?.analysis_engines ? 
    Object.values(enhancedAnalysis.analysis_engines).some((engine: any) => 
      engine.status === 'completed' && engine.analysis_data && Object.keys(engine.analysis_data).length > 0
    ) : false;

  const completedEngines = enhancedAnalysis?.analysis_engines ? 
    Object.values(enhancedAnalysis.analysis_engines).filter((engine: any) => 
      engine.status === 'completed'
    ).length : 0;

  const totalEngines = enhancedAnalysis?.analysis_engines ? 
    Object.keys(enhancedAnalysis.analysis_engines).length : 5;

  const completionPercentage = totalEngines > 0 ? Math.round((completedEngines / totalEngines) * 100) : 0;

  const getStatusColor = () => {
    if (hasRealData) return 'text-green-600';
    if (completedEngines > 0) return 'text-blue-600';
    return 'text-amber-600';
  };

  const getStatusIcon = () => {
    if (hasRealData) return <CheckCircle className="h-4 w-4" />;
    if (completedEngines > 0) return <Brain className="h-4 w-4" />;
    return <Clock className="h-4 w-4" />;
  };

  const getStatusText = () => {
    if (hasRealData) return 'Real Analysis Data Available';
    if (completedEngines > 0) return `Analysis In Progress (${completedEngines}/${totalEngines})`;
    return 'Waiting for Analysis';
  };

  return (
    <Card className="border-l-4 border-l-primary">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Enhanced Analysis Status
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-1 ${getStatusColor()}`}>
              {getStatusIcon()}
              <span className="text-xs font-medium">{getStatusText()}</span>
            </div>
            <Badge variant="outline" className="text-xs">
              {completionPercentage}%
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full justify-between p-2">
              <span className="text-xs">View Engine Details</span>
              <ChevronDown className={`h-3 w-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
            </Button>
          </CollapsibleTrigger>
          
          <CollapsibleContent className="mt-3 space-y-2">
            {enhancedAnalysis?.analysis_engines ? (
              <div className="grid gap-2">
                {Object.entries(enhancedAnalysis.analysis_engines).map(([engineName, engine]) => {
                  const engineData = engine as any;
                  const isComplete = engineData.status === 'completed';
                  const hasRealData = engineData.analysis_data && Object.keys(engineData.analysis_data).length > 0;
                  
                  return (
                    <div 
                      key={engineName}
                      className="flex items-center justify-between p-2 rounded border bg-muted/30"
                    >
                      <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full ${
                          hasRealData ? 'bg-green-500' : 
                          isComplete ? 'bg-blue-500' : 'bg-amber-500'
                        }`} />
                        <span className="text-xs font-medium">
                          {engineData.name || engineName.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs px-1">
                          {engineData.score || 0}
                        </Badge>
                        <Badge 
                          variant={hasRealData ? 'default' : 'secondary'} 
                          className="text-xs px-1"
                        >
                          {hasRealData ? 'Real Data' : engineData.status || 'pending'}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-4">
                <div className="flex items-center justify-center gap-2 text-muted-foreground mb-2">
                  <Target className="h-4 w-4" />
                  <span className="text-sm">No Engine Data Available</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Analysis engines will populate this section when comprehensive analysis runs
                </p>
              </div>
            )}
            
            {/* Analysis Completeness Indicator */}
            {enhancedAnalysis?.analysis_completeness && (
              <div className="mt-3 p-2 bg-primary/5 rounded border">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium">Analysis Completeness</span>
                  <Badge variant="outline">
                    {enhancedAnalysis.analysis_completeness}%
                  </Badge>
                </div>
                <div className="mt-1 w-full bg-muted rounded-full h-1.5">
                  <div 
                    className="bg-primary h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${enhancedAnalysis.analysis_completeness}%` }}
                  />
                </div>
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}