import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RAGBadge } from '@/components/ui/rag-badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreVertical, ExternalLink, Star, CheckCircle, Brain, Clock, Bot } from 'lucide-react';
import { Deal } from '@/hooks/usePipelineDeals';
import { useStrategyThresholds } from '@/hooks/useStrategyThresholds';

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
  if (!deal.primary_source) return null;
  
  const sourceLabels: Record<string, string> = {
    'sourced': 'AI Sourced',
    'batch_upload': 'Batch Upload',
    'manual': 'Manual Entry',
    'referral': 'Referral',
    'inbound': 'Inbound'
  };
  
  const label = sourceLabels[deal.primary_source] || deal.primary_source;
  
  return (
    <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
      {label}
    </Badge>
  );
};

export const DealCardHeader: React.FC<DealCardHeaderProps> = ({
  deal,
  analysisStatus,
  viewDensity
}) => {
  const StatusIcon = analysisStatus.icon;
  const { getRAGCategory } = useStrategyThresholds();

  return (
    <div className="flex items-start justify-between mb-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className={`font-semibold text-gray-900 truncate ${
            viewDensity === 'compact' ? 'text-sm' : 'text-base'
          }`}>
            {deal.company_name || 'Unnamed Company'}
          </h3>
          
          {/* Analysis Status Icon */}
          <StatusIcon className={`w-4 h-4 ${analysisStatus.color} flex-shrink-0`} />
          
          {/* RAG Score Badge - Show score/100 with label */}
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
        
        {deal.industry && (
          <p className={`text-gray-600 truncate ${
            viewDensity === 'compact' ? 'text-xs' : 'text-sm'
          }`}>
            {deal.industry}
          </p>
        )}
        
        {/* Source Badge and AI Insight */}
        <div className="space-y-1">
          {viewDensity === 'detailed' && getSourceBadge(deal)}
          
          {/* AI-Generated Insight */}
          {deal.rag_reasoning && typeof deal.rag_reasoning === 'object' && 
           'reasoning' in deal.rag_reasoning && 
           Array.isArray(deal.rag_reasoning.reasoning) && 
           deal.rag_reasoning.reasoning[0] && 
           typeof deal.rag_reasoning.reasoning[0] === 'string' && 
           viewDensity !== 'compact' && (
            <p className="text-xs text-gray-600 line-clamp-2 mt-1">
              💡 {deal.rag_reasoning.reasoning[0]}
            </p>
          )}
          
          {/* Confidence Score */}
          {deal.rag_confidence && viewDensity === 'detailed' && (
            <div className="flex items-center gap-1 mt-1">
              <span className="text-xs text-gray-500">Confidence:</span>
              <Badge variant="outline" className="text-xs">
                {deal.rag_confidence}%
              </Badge>
            </div>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-1 ml-2">
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