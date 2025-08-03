import React from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { Badge } from '@/components/ui/badge';
import { RAGBadge } from '@/components/ui/rag-badge';
import { 
  MapPin, 
  DollarSign,
  User,
  Calendar
} from 'lucide-react';
import { Deal } from '@/hooks/usePipelineDeals';
import { useStrategyThresholds } from '@/hooks/useStrategyThresholds';

interface CleanDealCardProps {
  deal: Deal;
  index: number;
  onDealClick?: (deal: Deal) => void;
}

export const CleanDealCard: React.FC<CleanDealCardProps> = ({ 
  deal, 
  index, 
  onDealClick
}) => {
  const { getRAGCategory } = useStrategyThresholds();
  const formatAmount = (amount?: number) => {
    if (!amount) return 'N/A';
    
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`;
    }
    return `$${amount.toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)}w ago`;
    return `${Math.ceil(diffDays / 30)}mo ago`;
  };

  const getScoreColor = (score?: number) => {
    if (!score) return 'text-gray-400';
    if (score >= 85) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadgeVariant = (score?: number) => {
    if (!score) return 'secondary';
    if (score >= 85) return 'default'; // Green
    if (score >= 70) return 'secondary'; // Yellow
    return 'destructive'; // Red
  };

  const getStageInfo = () => {
    // Map status to display stage
    const stageMap: Record<string, string> = {
      'sourced': 'Pre-Seed',
      'screening': 'Seed',
      'due_diligence': 'Series A',
      'decision': 'Series B',
      'closed': 'Series C'
    };
    return stageMap[deal.status || 'sourced'] || 'Pre-Seed';
  };

  return (
    <Draggable draggableId={deal.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => onDealClick?.(deal)}
          className={`
            bg-white border border-gray-200 rounded-lg p-4 cursor-pointer
            transition-all duration-200 hover:shadow-md hover:border-gray-300
            ${snapshot.isDragging ? 'shadow-lg rotate-2' : ''}
          `}
          style={provided.draggableProps.style}
        >
          {/* Company Name & Score */}
          <div className="flex items-start justify-between mb-3">
            <div>
              <h4 className="font-medium text-gray-900 text-sm leading-tight">
                {deal.company_name}
              </h4>
              <div className="text-xs text-gray-500 mt-1">
                {deal.industry || 'N/A'}
              </div>
            </div>
            {deal.overall_score && (
              (() => {
                const ragCategory = getRAGCategory(deal.overall_score);
                return (
                  <RAGBadge 
                    level={ragCategory.level as any}
                    score={deal.overall_score}
                    label={ragCategory.label}
                    size="sm"
                  />
                );
              })()
            )}
          </div>

          {/* Stage */}
          <div className="mb-3">
            <Badge variant="outline" className="text-xs text-gray-600 border-gray-300">
              {getStageInfo()}
            </Badge>
          </div>

          {/* Amount */}
          <div className="flex items-center gap-1 mb-2">
            <DollarSign className="w-3 h-3 text-gray-400" />
            <span className="text-sm font-medium text-gray-900">
              {formatAmount(deal.deal_size)}
            </span>
          </div>

          {/* Location */}
          {deal.location && (
            <div className="flex items-center gap-1 mb-2">
              <MapPin className="w-3 h-3 text-gray-400" />
              <span className="text-xs text-gray-600">{deal.location}</span>
            </div>
          )}

          {/* Founder */}
          {deal.founder && (
            <div className="flex items-center gap-1 mb-2">
              <User className="w-3 h-3 text-gray-400" />
              <span className="text-xs text-gray-600">{deal.founder}</span>
            </div>
          )}

          {/* Date */}
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3 text-gray-400" />
            <span className="text-xs text-gray-500">
              {formatDate(deal.updated_at)}
            </span>
          </div>
        </div>
      )}
    </Draggable>
  );
};