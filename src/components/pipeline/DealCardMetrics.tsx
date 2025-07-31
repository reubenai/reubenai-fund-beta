import React from 'react';
import { DollarSign, MapPin, ExternalLink, User } from 'lucide-react';
import { Deal } from '@/hooks/usePipelineDeals';

interface DealCardMetricsProps {
  deal: Deal;
  formatAmount: (amount?: number, currency?: string) => string;
  formatWebsite: (url?: string) => string | null;
  viewDensity: 'compact' | 'comfortable' | 'detailed';
}

export const DealCardMetrics: React.FC<DealCardMetricsProps> = ({
  deal,
  formatAmount,
  formatWebsite,
  viewDensity
}) => {
  const textSize = viewDensity === 'compact' ? 'text-xs' : 'text-sm';
  const iconSize = viewDensity === 'compact' ? 'w-3 h-3' : 'w-4 h-4';

  return (
    <div className={`space-y-1 mb-3 ${viewDensity === 'compact' ? 'space-y-1' : 'space-y-2'}`}>
      {/* Deal Size */}
      {deal.deal_size && (
        <div className={`flex items-center gap-2 ${textSize}`}>
          <DollarSign className={`${iconSize} text-gray-400 flex-shrink-0`} />
          <span className="text-gray-700 font-medium">
            {formatAmount(deal.deal_size, deal.currency)}
          </span>
        </div>
      )}
      
      {/* Location */}
      {deal.location && (
        <div className={`flex items-center gap-2 ${textSize}`}>
          <MapPin className={`${iconSize} text-gray-400 flex-shrink-0`} />
          <span className="text-gray-600 truncate">{deal.location}</span>
        </div>
      )}
      
      {/* Website - Only show in comfortable/detailed view */}
      {deal.website && viewDensity !== 'compact' && (
        <div className={`flex items-center gap-2 ${textSize}`}>
          <ExternalLink className={`${iconSize} text-gray-400 flex-shrink-0`} />
          <a 
            href={deal.website}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-700 truncate"
            onClick={(e) => e.stopPropagation()}
          >
            {formatWebsite(deal.website)}
          </a>
        </div>
      )}
      
      {/* Founder */}
      {deal.founder && (
        <div className={`flex items-center gap-2 ${textSize}`}>
          <User className={`${iconSize} text-gray-400 flex-shrink-0`} />
          <span className="text-gray-600 truncate">
            {deal.founder}
          </span>
        </div>
      )}
      
      {/* Company Details - Only show in detailed view */}
      {viewDensity === 'detailed' && (
        <>
          {deal.employee_count && (
            <div className={`flex items-center gap-2 ${textSize}`}>
              <User className={`${iconSize} text-gray-400 flex-shrink-0`} />
              <span className="text-gray-600 truncate">
                {deal.employee_count} employees
              </span>
            </div>
          )}
          
          {deal.business_model && (
            <div className={`flex items-center gap-2 ${textSize}`}>
              <span className="text-gray-600 truncate text-xs">
                {deal.business_model}
              </span>
            </div>
          )}
        </>
      )}
      
      {/* Description - Only show in detailed view */}
      {deal.description && viewDensity === 'detailed' && (
        <p className="text-xs text-gray-500 mt-2 line-clamp-2">
          {deal.description}
        </p>
      )}
    </div>
  );
};