import React from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, DollarSign, MapPin, Calendar } from 'lucide-react';
import { Deal } from '@/hooks/usePipelineDeals';
import { useStrategyThresholds } from '@/hooks/useStrategyThresholds';

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
  
  const formatAmount = (amount?: number, currency = 'USD') => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Draggable draggableId={deal.id} index={index}>
      {(provided, snapshot) => (
        <Card
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`
            mb-3 cursor-pointer card-xero
            ${snapshot.isDragging ? 'shadow-lg rotate-2 scale-[1.02]' : ''}
            ${snapshot.isDragging ? 'border-slate-300' : 'border-border/60'}
          `}
          onClick={() => onDealClick?.(deal)}
        >
          <CardContent className="p-4 spacing-element">
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0">
                <h3 className="text-hierarchy-3 truncate">
                  {deal.company_name}
                </h3>
                {deal.industry && (
                  <p className="text-sm text-muted-foreground truncate mt-1">
                    {deal.industry}
                  </p>
                )}
              </div>
              
              {/* RAG Status */}
              {deal.score_level && (
                <div className="flex items-center gap-2 ml-2">
                  <div className={`w-3 h-3 rounded-full ${getRAGColor(deal.score_level)} shadow-sm`} />
                </div>
              )}
            </div>

            {/* Metrics */}
            <div className="space-y-2 mb-3">
              {deal.deal_size && (
                <div className="flex items-center gap-2 text-sm">
                  <DollarSign className="w-4 h-4 text-muted-foreground" />
                  <span className="text-foreground font-medium">
                    {formatAmount(deal.deal_size, deal.currency)}
                  </span>
                </div>
              )}
              
              {deal.location && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground truncate">{deal.location}</span>
                </div>
              )}
            </div>

            {/* RAG Score Badge - Using enhanced_analysis score if available */}
            {deal.overall_score && (
              <div className="mb-3">
                {(() => {
                  // Calculate score from enhanced analysis if available, otherwise use stored score
                  let finalScore = deal.overall_score;
                  
                  // Type guard and check for enhanced analysis
                  if (deal.enhanced_analysis && 
                      typeof deal.enhanced_analysis === 'object' &&
                      'rubric_breakdown' in deal.enhanced_analysis &&
                      Array.isArray(deal.enhanced_analysis.rubric_breakdown)) {
                    const rubricBreakdown = deal.enhanced_analysis.rubric_breakdown as any[];
                    const totalWeight = rubricBreakdown.reduce((sum, item) => sum + (item.weight || 0), 0);
                    if (totalWeight > 0) {
                      finalScore = Math.round(
                        rubricBreakdown.reduce(
                          (sum, item) => sum + ((item.score || 0) * (item.weight || 0) / totalWeight), 0
                        )
                      );
                    }
                  }
                  
                  const rag = getRAGCategory(finalScore);
                  return (
                    <Badge variant="outline" className={`${rag.color} shadow-sm`}>
                      {finalScore}/100 · {rag.label}
                    </Badge>
                  );
                })()}
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>{formatDate(deal.updated_at)}</span>
              </div>
              
              {deal.valuation && (
                <span className="text-muted-foreground font-medium">
                  Val: {formatAmount(deal.valuation, deal.currency)}
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </Draggable>
  );
};