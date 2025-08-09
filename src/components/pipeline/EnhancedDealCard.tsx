import React from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { 
  Building2, 
  DollarSign, 
  MapPin, 
  Calendar, 
  MoreVertical,
  CheckCircle,
  Brain,
  Clock,
  Bot,
  MessageSquare,
  Users,
  ExternalLink,
  Star
} from 'lucide-react';
import { Deal as BaseDeal } from '@/hooks/usePipelineDeals';
import { EnhancedDealAnalysis } from '@/types/enhanced-deal-analysis';

type Deal = BaseDeal & {
  enhanced_analysis?: EnhancedDealAnalysis;
};

import { useStrategyThresholds } from '@/hooks/useStrategyThresholds';
import { useFund } from '@/contexts/FundContext';
import { DealCardHeader } from './DealCardHeader';
import { DealCardMetrics } from './DealCardMetrics';
import { DealCardFooter } from './DealCardFooter';
import { WebPresenceSection } from './WebPresenceSection';
import { AnalysisQueueStatus } from './AnalysisQueueStatus';
import { EnhancedAnalysisIndicators } from './EnhancedAnalysisIndicators';
import { RubricScoreRadar } from './RubricScoreRadar';
import { FundTypeAnalysisPanel } from './FundTypeAnalysisPanel';

interface EnhancedDealCardProps {
  deal: Deal;
  index: number;
  onDealClick?: (deal: Deal) => void;
  viewDensity: 'compact' | 'comfortable' | 'detailed';
}


const getRAGColor = (level?: string) => {
  switch (level) {
    case 'exciting': return 'bg-green-500';
    case 'promising': return 'bg-yellow-500';
    case 'needs_development': return 'bg-orange-500';
    case 'not_aligned': return 'bg-red-500';
    default: return 'bg-gray-400';
  }
};

const getAnalysisStatus = (deal: Deal) => {
  // Mock analysis status - in real app, this would come from AI analysis
  if (deal.overall_score && deal.overall_score >= 80) {
    return { icon: CheckCircle, color: 'text-green-600', status: 'Complete - High Confidence' };
  } else if (deal.overall_score && deal.overall_score >= 60) {
    return { icon: Brain, color: 'text-blue-600', status: 'Complete - Moderate Confidence' };
  } else if (deal.overall_score) {
    return { icon: Clock, color: 'text-amber-600', status: 'Partial Analysis' };
  }
  return { icon: Bot, color: 'text-gray-500', status: 'Analysis Needed' };
};

export const EnhancedDealCard: React.FC<EnhancedDealCardProps> = ({ 
  deal, 
  index, 
  onDealClick,
  viewDensity 
}) => {
  const { getRAGCategory } = useStrategyThresholds();
  
  const formatAmount = (amount?: number) => {
    if (!amount) return 'N/A';
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
    return `$${amount.toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const getCardPadding = () => {
    switch (viewDensity) {
      case 'compact': return 'p-3';
      case 'detailed': return 'p-4';
      default: return 'p-3';
    }
  };

  return (
    <Draggable draggableId={deal.id} index={index}>
      {(provided, snapshot) => (
        <Card
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`
            mb-3 cursor-pointer transition-all duration-200
            ${snapshot.isDragging ? 'shadow-lg scale-105' : 'hover:shadow-sm'}
          `}
          onClick={() => onDealClick?.(deal)}
        >
          <CardContent className={getCardPadding()}>
            {/* Company Name & Enhanced Score */}
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-foreground truncate text-sm">
                  {deal.company_name}
                </h4>
                {deal.industry && (
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {deal.industry}
                  </p>
                )}
              </div>
              
              {/* Enhanced RAG Score */}
              {deal.overall_score && (
                (() => {
                  // Use enhanced analysis if available
                  let finalScore = deal.overall_score;
                  if (deal.enhanced_analysis?.rubric_breakdown) {
                    const rubrics = deal.enhanced_analysis.rubric_breakdown as any[];
                    const totalWeight = rubrics.reduce((sum, r) => sum + (r.weight || 0), 0);
                    if (totalWeight > 0) {
                      finalScore = Math.round(
                        rubrics.reduce((sum, r) => sum + ((r.score || 0) * (r.weight || 0) / totalWeight), 0)
                      );
                    }
                  }
                  
                  const rag = getRAGCategory(finalScore);
                  return (
                    <Badge variant="outline" className={`text-xs ml-2 ${rag.color}`}>
                      {finalScore} · {rag.label}
                    </Badge>
                  );
                })()
              )}
            </div>

            {/* Core Metrics */}
            <div className="space-y-1 mb-2">
              {deal.deal_size && (
                <div className="flex items-center gap-1">
                  <DollarSign className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs font-medium">{formatAmount(deal.deal_size)}</span>
                </div>
              )}
              
              {deal.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground truncate">{deal.location}</span>
                </div>
              )}
            </div>

            {/* Enhanced Analysis Indicators for detailed view */}
            {viewDensity === 'detailed' && deal.enhanced_analysis && (
              <div className="mb-2">
                <EnhancedAnalysisIndicators 
                  deal={deal}
                  viewDensity={viewDensity}
                />
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>{formatDate(deal.updated_at)}</span>
              </div>
              
              {deal.founder && (
                <div className="flex items-center gap-1">
                  <Building2 className="w-3 h-3" />
                  <span className="truncate max-w-20">{deal.founder}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </Draggable>
  );
};