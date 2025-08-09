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
              
              {/* RAG Score Badge */}
              {deal.overall_score && (
                (() => {
                  const rag = getRAGCategory(deal.overall_score);
                  return (
                    <Badge variant="outline" className={`text-xs ml-2 ${rag.color}`}>
                      {deal.overall_score} · {rag.label}
                    </Badge>
                  );
                })()
              )}
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