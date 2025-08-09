import React, { useState } from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { 
  Building2, 
  DollarSign, 
  MapPin, 
  Globe, 
  MoreVertical,
  CheckCircle,
  Brain,
  Clock,
  Bot,
  MessageSquare,
  Users,
  ExternalLink,
  Star,
  Zap
} from 'lucide-react';
import { Deal as BaseDeal } from '@/hooks/usePipelineDeals';
import { EnhancedDealAnalysis } from '@/types/enhanced-deal-analysis';

type Deal = BaseDeal & {
  enhanced_analysis?: EnhancedDealAnalysis;
};

import { useStrategyThresholds } from '@/hooks/useStrategyThresholds';
import { useEnhancedAnalysisQueue } from '@/hooks/useEnhancedAnalysisQueue';
import { useFund } from '@/contexts/FundContext';
import { DealCardHeader } from './DealCardHeader';
import { DealCardMetrics } from './DealCardMetrics';
import { DealCardFooter } from './DealCardFooter';
import { WebPresenceSection } from './WebPresenceSection';
import { AnalysisQueueStatus } from './AnalysisQueueStatus';
import { EnhancedAnalysisIndicators } from './EnhancedAnalysisIndicators';
import { RubricScoreRadar } from './RubricScoreRadar';
import { FundTypeAnalysisPanel } from './FundTypeAnalysisPanel';
import { DealAnalysisRefreshButton } from './DealAnalysisRefreshButton';
import { usePermissions } from '@/hooks/usePermissions';

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
  const { forceAnalysisNow, queueDealAnalysis } = useEnhancedAnalysisQueue();
  const permissions = usePermissions();
  const [isLoading, setIsLoading] = useState(false);
  
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

  const handleTriggerAnalysis = async (immediate = false) => {
    setIsLoading(true);
    try {
      if (immediate) {
        await forceAnalysisNow(deal.id);
      } else {
        await queueDealAnalysis(deal.id, { 
          priority: 'normal',
          triggerReason: 'manual'
        });
      }
    } catch (error) {
      console.error('Failed to trigger analysis:', error);
    } finally {
      setIsLoading(false);
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
                  {deal.company_name || 'Unnamed Company'}
                </h4>
                {deal.industry && (
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {deal.industry}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1">
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
                      <Badge variant="outline" className={`text-xs ${rag.color}`}>
                        {finalScore} · {rag.label}
                      </Badge>
                    );
                  })()
                )}
                
                {/* Analysis Refresh Button for Fund Managers */}
                {permissions.canTriggerAnalysis && (
                  <div onClick={(e) => e.stopPropagation()}>
                    <DealAnalysisRefreshButton 
                      dealId={deal.id}
                      lastAnalyzed={deal.updated_at}
                      variant="badge"
                    />
                  </div>
                )}
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <MoreVertical className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                    {permissions.canTriggerAnalysis && (
                      <>
                        <DropdownMenuItem 
                          onClick={() => handleTriggerAnalysis(false)}
                          disabled={isLoading}
                        >
                          <Brain className="w-3 h-3 mr-2" />
                          Queue Analysis (5min)
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleTriggerAnalysis(true)}
                          disabled={isLoading}
                        >
                          <Zap className="w-3 h-3 mr-2" />
                          Analyze Now
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Core Metrics */}
            <div className="space-y-1 mb-2">
              {deal.deal_size && (
                <div className="flex items-center gap-1">
                  <DollarSign className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs font-medium">{formatAmount(deal.deal_size)}</span>
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

            {/* Footer with location, website, and founder */}
            <div className="space-y-1 text-xs text-muted-foreground">
              {deal.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  <span className="truncate">{deal.location}</span>
                </div>
              )}
              
              {deal.website && (
                <div className="flex items-center gap-1">
                  <Globe className="w-3 h-3" />
                  <span className="truncate">{deal.website}</span>
                </div>
              )}
              
              {deal.founder && (
                <div className="flex items-center gap-1">
                  <Building2 className="w-3 h-3" />
                  <span className="truncate">{deal.founder}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </Draggable>
  );
};