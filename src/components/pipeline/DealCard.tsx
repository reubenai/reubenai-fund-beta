import React, { useState } from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Building2, DollarSign, MapPin, Calendar, MoreVertical, Brain, Zap } from 'lucide-react';
import { Deal } from '@/hooks/usePipelineDeals';
import { useStrategyThresholds } from '@/hooks/useStrategyThresholds';
import { useAnalysisQueue } from '@/hooks/useAnalysisQueue';

interface DealCardProps {
  deal: Deal;
  index: number;
  onDealClick?: (deal: Deal) => void;
}


const getRAGColor = (level?: string) => {
  switch (level) {
    case 'exciting': return 'bg-slate-600';
    case 'promising': return 'bg-blue-600';
    case 'needs_development': return 'bg-amber-600';
    case 'not_aligned': return 'bg-slate-400';
    default: return 'bg-slate-300';
  }
};

export const DealCard: React.FC<DealCardProps> = ({ deal, index, onDealClick }) => {
  const { getRAGCategory } = useStrategyThresholds();
  const { forceAnalysisNow, queueDealAnalysis } = useAnalysisQueue();
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
          <CardContent className="p-3">
            {/* Company Name & Score */}
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
              
              <div className="flex items-center gap-1">
                {/* RAG Score Badge */}
                {deal.overall_score && (
                  (() => {
                    const rag = getRAGCategory(deal.overall_score);
                    return (
                      <Badge variant="outline" className={`text-xs ${rag.color}`}>
                        {deal.overall_score} · {rag.label}
                      </Badge>
                    );
                  })()
                )}
                
                {/* Analysis Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <MoreVertical className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
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
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Essential Info */}
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

            {/* Footer with date and founder */}
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