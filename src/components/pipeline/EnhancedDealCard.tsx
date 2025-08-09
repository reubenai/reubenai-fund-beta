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
  const { selectedFund } = useFund();
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

            {/* Enhanced Analysis Indicators */}
            <div className="mb-3">
              <EnhancedAnalysisIndicators 
                deal={deal}
                viewDensity={viewDensity}
              />
            </div>

            {/* Metrics */}
            <DealCardMetrics 
              deal={deal}
              formatAmount={formatAmount}
              formatWebsite={formatWebsite}
              viewDensity={viewDensity}
            />

            {/* Enhanced Analysis Sections - Only show in detailed view and simplified */}
            {viewDensity === 'detailed' && deal.enhanced_analysis && (
              <div className="mt-3 space-y-2">
                {/* Only show Rubric Breakdown if it exists */}
                {deal.enhanced_analysis.rubric_breakdown && (
                  <RubricScoreRadar 
                    rubricBreakdown={deal.enhanced_analysis.rubric_breakdown}
                    fundType={selectedFund?.fund_type === 'pe' ? 'pe' : 'vc'}
                  />
                )}
              </div>
            )}

            {/* Remove Analysis Queue Status to reduce clutter */}

            {/* Footer */}
            <WebPresenceSection 
              deal={deal}
              viewDensity={viewDensity}
            />
              
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