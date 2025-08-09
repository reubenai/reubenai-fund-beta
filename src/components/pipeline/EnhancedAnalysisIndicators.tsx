import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Brain, 
  MessageSquare, 
  FileText, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap
} from 'lucide-react';
import { Deal } from '@/hooks/useOptimizedPipelineDeals';
import { NotesIntelligence, AnalysisEngine } from '@/types/enhanced-deal-analysis';

interface EnhancedAnalysisIndicatorsProps {
  deal: Deal;
  viewDensity: 'compact' | 'comfortable' | 'detailed';
}

export const EnhancedAnalysisIndicators: React.FC<EnhancedAnalysisIndicatorsProps> = ({
  deal,
  viewDensity
}) => {
  const { enhanced_analysis } = deal;
  
  if (!enhanced_analysis) return null;

  const getNotesIndicator = (notes: NotesIntelligence) => {
    const sentimentColors = {
      positive: 'bg-green-100 text-green-700',
      neutral: 'bg-blue-100 text-blue-700',
      negative: 'bg-red-100 text-red-700',
      mixed: 'bg-amber-100 text-amber-700'
    };

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <Badge variant="outline" className={`${sentimentColors[notes.sentiment]} text-xs`}>
              <MessageSquare className="w-3 h-3 mr-1" />
              {notes.sentiment}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-xs">
              <p className="font-medium">Notes Intelligence</p>
              <p>Sentiment: {notes.sentiment}</p>
              <p>Confidence: {notes.confidence_level}%</p>
              {notes.key_insights.length > 0 && (
                <p>Key insights: {notes.key_insights.length}</p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  const getEngineIndicator = (engines: Record<string, AnalysisEngine>) => {
    const engineCount = Object.keys(engines).length;
    const completedEngines = Object.values(engines).filter(e => e.status === 'complete').length;
    const pendingEngines = Object.values(engines).filter(e => e.status === 'pending').length;
    
    let icon = Brain;
    let colorClass = 'bg-blue-100 text-blue-700';
    
    if (pendingEngines > 0) {
      icon = Clock;
      colorClass = 'bg-amber-100 text-amber-700';
    } else if (completedEngines === engineCount) {
      icon = CheckCircle;
      colorClass = 'bg-green-100 text-green-700';
    }

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <Badge variant="outline" className={`${colorClass} text-xs`}>
              {React.createElement(icon, { className: "w-3 h-3 mr-1" })}
              {completedEngines}/{engineCount}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-xs">
              <p className="font-medium">Analysis Engines</p>
              <p>Completed: {completedEngines}/{engineCount}</p>
              {pendingEngines > 0 && <p>Pending: {pendingEngines}</p>}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  const getCompletenessIndicator = (completeness: number) => {
    let colorClass = 'bg-red-100 text-red-700';
    let icon = AlertTriangle;
    
    if (completeness >= 80) {
      colorClass = 'bg-green-100 text-green-700';
      icon = Zap;
    } else if (completeness >= 60) {
      colorClass = 'bg-amber-100 text-amber-700';
      icon = TrendingUp;
    }

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <Badge variant="outline" className={`${colorClass} text-xs`}>
              {React.createElement(icon, { className: "w-3 h-3 mr-1" })}
              {completeness}%
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-xs">
              <p className="font-medium">Analysis Completeness</p>
              <p>{completeness}% of analysis complete</p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  const iconSize = viewDensity === 'compact' ? 'w-3 h-3' : 'w-4 h-4';
  
  return (
    <div className={`flex items-center gap-1 flex-wrap ${viewDensity === 'compact' ? 'gap-1' : 'gap-2'}`}>
      {/* Show only most important indicators */}
      {enhanced_analysis.notes_intelligence && viewDensity !== 'compact' && 
        getNotesIndicator(enhanced_analysis.notes_intelligence)}
      
      {/* Analysis Engines Status - only in detailed view */}
      {viewDensity === 'detailed' && enhanced_analysis.analysis_engines && 
        getEngineIndicator(enhanced_analysis.analysis_engines)}
      
      {/* Overall Completeness - always shown but simplified */}
      {getCompletenessIndicator(enhanced_analysis.analysis_completeness)}
    </div>
  );
};