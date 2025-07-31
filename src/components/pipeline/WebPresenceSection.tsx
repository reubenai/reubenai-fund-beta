import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Globe, Linkedin, Building2 } from 'lucide-react';
import { Deal } from '@/hooks/usePipelineDeals';

interface WebPresenceSectionProps {
  deal: Deal;
  viewDensity: 'compact' | 'comfortable' | 'detailed';
}

export const WebPresenceSection: React.FC<WebPresenceSectionProps> = ({
  deal,
  viewDensity
}) => {
  if (viewDensity === 'compact') return null;

  const hasWebPresence = deal.website || deal.linkedin_url || deal.crunchbase_url;
  
  if (!hasWebPresence && !deal.company_validation_status && !deal.web_presence_confidence) {
    return null;
  }

  return (
    <div className="space-y-2 mt-3 pt-3 border-t border-gray-100">
      {/* Web Presence Links */}
      {hasWebPresence && (
        <div className="flex items-center gap-3">
          {deal.website && (
            <a
              href={deal.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
              onClick={(e) => e.stopPropagation()}
            >
              <Globe className="w-3 h-3" />
              <span>Website</span>
            </a>
          )}
          
          {deal.linkedin_url && (
            <a
              href={deal.linkedin_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
              onClick={(e) => e.stopPropagation()}
            >
              <Linkedin className="w-3 h-3" />
              <span>LinkedIn</span>
            </a>
          )}
          
          {deal.crunchbase_url && (
            <a
              href={deal.crunchbase_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
              onClick={(e) => e.stopPropagation()}
            >
              <Building2 className="w-3 h-3" />
              <span>Crunchbase</span>
            </a>
          )}
        </div>
      )}

      {/* Validation Status & Confidence Scores */}
      {viewDensity === 'detailed' && (
        <div className="flex items-center gap-2 flex-wrap">
          {deal.company_validation_status === 'validated' && (
            <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
              Verified
            </Badge>
          )}
          
          {deal.web_presence_confidence && (
            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
              Web: {deal.web_presence_confidence}%
            </Badge>
          )}
          
          {deal.source_confidence_score && (
            <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
              Source: {deal.source_confidence_score}%
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};