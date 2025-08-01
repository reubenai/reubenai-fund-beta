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
    case 'exciting': return 'bg-green-500';
    case 'promising': return 'bg-yellow-500';
    case 'needs_development': return 'bg-orange-500';
    case 'not_aligned': return 'bg-red-500';
    default: return 'bg-gray-400';
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
            mb-3 cursor-pointer transition-all duration-200 hover:shadow-md
            ${snapshot.isDragging ? 'shadow-lg rotate-3 scale-105' : ''}
            ${snapshot.isDragging ? 'bg-white border-brand-emerald' : 'bg-white border-slate-200'}
          `}
          onClick={() => onDealClick?.(deal)}
        >
          <CardContent className="p-4">
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 truncate">
                  {deal.company_name}
                </h3>
                {deal.industry && (
                  <p className="text-sm text-gray-600 truncate mt-1">
                    {deal.industry}
                  </p>
                )}
              </div>
              
              {/* RAG Status */}
              {deal.score_level && (
                <div className="flex items-center gap-1 ml-2">
                  <div className={`w-3 h-3 rounded-full ${getRAGColor(deal.score_level)}`} />
                </div>
              )}
            </div>

            {/* Metrics */}
            <div className="space-y-2 mb-3">
              {deal.deal_size && (
                <div className="flex items-center gap-2 text-sm">
                  <DollarSign className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-700">
                    {formatAmount(deal.deal_size, deal.currency)}
                  </span>
                </div>
              )}
              
              {deal.location && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600 truncate">{deal.location}</span>
                </div>
              )}
            </div>

            {/* RAG Score */}
            {deal.overall_score && (
              <div className="mb-3">
                {(() => {
                  const rag = getRAGCategory(deal.overall_score);
                  return (
                    <Badge variant="outline" className={rag.color}>
                      {rag.label}
                    </Badge>
                  );
                })()}
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>{formatDate(deal.updated_at)}</span>
              </div>
              
              {deal.valuation && (
                <span className="text-gray-600">
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