import React from 'react';
import { Calendar, MessageSquare, Users, TrendingUp } from 'lucide-react';
import { Deal } from '@/hooks/usePipelineDeals';

interface DealCardFooterProps {
  deal: Deal;
  formatDate: (dateString: string) => string;
  formatAmount: (amount?: number, currency?: string) => string;
  viewDensity: 'compact' | 'comfortable' | 'detailed';
}

const getPriorityIndicator = (deal: Deal) => {
  // Mock priority logic - in real app, this would come from deal metadata
  if (deal.overall_score && deal.overall_score >= 85) {
    return { color: 'bg-red-500', label: 'High' };
  } else if (deal.overall_score && deal.overall_score >= 70) {
    return { color: 'bg-yellow-500', label: 'Medium' };
  }
  return { color: 'bg-green-500', label: 'Low' };
};

export const DealCardFooter: React.FC<DealCardFooterProps> = ({
  deal,
  formatDate,
  formatAmount,
  viewDensity
}) => {
  const priority = getPriorityIndicator(deal);
  const textSize = viewDensity === 'compact' ? 'text-xs' : 'text-sm';
  const iconSize = viewDensity === 'compact' ? 'w-3 h-3' : 'w-4 h-4';

  return (
    <div className="space-y-2">
      {/* CRM Indicators - Only show in comfortable/detailed view */}
      {viewDensity !== 'compact' && (
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <MessageSquare className="w-3 h-3" />
            <span>3</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            <span>2</span>
          </div>
          <div className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${priority.color}`} />
            <span>{priority.label}</span>
          </div>
        </div>
      )}
      
      {/* Bottom Row */}
      <div className={`flex items-center justify-between ${textSize} text-gray-500`}>
        <div className="flex items-center gap-1">
          <Calendar className={`${iconSize} flex-shrink-0`} />
          <span>{formatDate(deal.updated_at)}</span>
        </div>
        
        {/* Valuation or Next Action */}
        {deal.valuation && viewDensity !== 'compact' ? (
          <span className="text-gray-600">
            Val: {formatAmount(deal.valuation, deal.currency)}
          </span>
        ) : (
          <span className="text-blue-600 text-xs">
            Next: Due Diligence
          </span>
        )}
      </div>
      
      {/* Web Presence Validation - Only in detailed view */}
      {viewDensity === 'detailed' && (
        <div className="flex items-center gap-2 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-gray-500">Website Active</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-yellow-500" />
            <span className="text-gray-500">LinkedIn Verified</span>
          </div>
        </div>
      )}
    </div>
  );
};