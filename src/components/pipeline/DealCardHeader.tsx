import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreVertical, ExternalLink, Star, CheckCircle, Brain, Clock, Bot } from 'lucide-react';
import { Deal } from '@/hooks/usePipelineDeals';

interface DealCardHeaderProps {
  deal: Deal;
  analysisStatus: {
    icon: React.ComponentType<any>;
    color: string;
    status: string;
  };
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

const getSourceBadge = (deal: Deal) => {
  // Mock source detection - in real app, this would come from deal metadata
  if (deal.company_name.includes('AI')) {
    return <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">AI Sourced</Badge>;
  }
  return null;
};

export const DealCardHeader: React.FC<DealCardHeaderProps> = ({
  deal,
  analysisStatus,
  viewDensity
}) => {
  const StatusIcon = analysisStatus.icon;

  return (
    <div className="flex items-start justify-between mb-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className={`font-semibold text-gray-900 truncate ${
            viewDensity === 'compact' ? 'text-sm' : 'text-base'
          }`}>
            {deal.company_name}
          </h3>
          
          {/* Analysis Status Icon */}
          <StatusIcon className={`w-4 h-4 ${analysisStatus.color} flex-shrink-0`} />
        </div>
        
        {deal.industry && (
          <p className={`text-gray-600 truncate ${
            viewDensity === 'compact' ? 'text-xs' : 'text-sm'
          }`}>
            {deal.industry}
          </p>
        )}
        
        {/* Source Badge */}
        {viewDensity === 'detailed' && getSourceBadge(deal)}
      </div>
      
      <div className="flex items-center gap-1 ml-2">
        {/* RAG Status */}
        {deal.score_level && (
          <div className={`w-3 h-3 rounded-full ${getRAGColor(deal.score_level)}`} />
        )}
        
        {/* Actions Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              size="sm" 
              variant="ghost" 
              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="w-3 h-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <ExternalLink className="w-4 h-4 mr-2" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Star className="w-4 h-4 mr-2" />
              Add to Favorites
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Brain className="w-4 h-4 mr-2" />
              Trigger Analysis
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};