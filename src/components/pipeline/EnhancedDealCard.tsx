import React from 'react';
import { Draggable } from 'react-beautiful-dnd';
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
import { Deal } from '@/hooks/usePipelineDeals';
import { DealCardHeader } from './DealCardHeader';
import { DealCardMetrics } from './DealCardMetrics';
import { DealCardFooter } from './DealCardFooter';

interface EnhancedDealCardProps {
  deal: Deal;
  index: number;
  onDealClick?: (deal: Deal) => void;
  viewDensity: 'compact' | 'comfortable' | 'detailed';
}

const getScoreColor = (score?: number) => {
  if (!score) return 'bg-gray-100 text-gray-600';
  if (score >= 85) return 'bg-green-100 text-green-700 border-green-200';
  if (score >= 70) return 'bg-yellow-100 text-yellow-700 border-yellow-200';
  return 'bg-red-100 text-red-700 border-red-200';
};

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
  const formatAmount = (amount?: number, currency = 'USD') => {
    if (!amount) return 'N/A';
    
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`;
    }
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatWebsite = (url?: string) => {
    if (!url) return null;
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return url;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const analysisStatus = getAnalysisStatus(deal);
  const StatusIcon = analysisStatus.icon;

  const getCardHeight = () => {
    switch (viewDensity) {
      case 'compact': return 'min-h-[120px]';
      case 'detailed': return 'min-h-[200px]';
      default: return 'min-h-[160px]';
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
            mb-3 cursor-pointer transition-all duration-200 hover:shadow-md ${getCardHeight()}
            ${snapshot.isDragging ? 'shadow-lg rotate-3 scale-105' : ''}
            ${snapshot.isDragging ? 'bg-white border-brand-emerald' : 'bg-white border-slate-200'}
          `}
          onClick={() => onDealClick?.(deal)}
        >
          <CardContent className={`${viewDensity === 'compact' ? 'p-3' : 'p-4'}`}>
            {/* Header */}
            <DealCardHeader 
              deal={deal}
              analysisStatus={analysisStatus}
              viewDensity={viewDensity}
            />

            {/* Metrics */}
            <DealCardMetrics 
              deal={deal}
              formatAmount={formatAmount}
              formatWebsite={formatWebsite}
              viewDensity={viewDensity}
            />

            {/* AI Score */}
            {deal.overall_score && viewDensity !== 'compact' && (
              <div className="mb-3">
                <Badge variant="outline" className={getScoreColor(deal.overall_score)}>
                  AI Score: {deal.overall_score}
                </Badge>
              </div>
            )}

            {/* Footer */}
            <DealCardFooter 
              deal={deal}
              formatDate={formatDate}
              formatAmount={formatAmount}
              viewDensity={viewDensity}
            />
          </CardContent>
        </Card>
      )}
    </Draggable>
  );
};