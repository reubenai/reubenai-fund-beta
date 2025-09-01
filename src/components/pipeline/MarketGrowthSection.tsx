import React from 'react';
import { TrendingUp, AlertCircle } from 'lucide-react';
import { useVCMarketData } from '@/hooks/useVCMarketData';

interface MarketGrowthSectionProps {
  dealId: string;
  viewDensity: 'compact' | 'comfortable' | 'detailed';
}

const getSourceDisplayName = (source: string): string => {
  const sourceMap: Record<string, string> = {
    'perplexity': 'Perplexity Market Research',
    'crunchbase': 'Crunchbase Market Data',
    'linkedin': 'LinkedIn Market Analysis',
    'documents': 'Document Analysis',
    'enrichment': 'Market Enrichment Service'
  };
  return sourceMap[source] || source;
};

export const MarketGrowthSection: React.FC<MarketGrowthSectionProps> = ({
  dealId,
  viewDensity
}) => {
  const { data, isLoading } = useVCMarketData(dealId);

  if (isLoading || !data) return null;

  const textSize = viewDensity === 'compact' ? 'text-xs' : 'text-sm';
  const iconSize = viewDensity === 'compact' ? 'w-3 h-3' : 'w-4 h-4';

  const hasCagr = data.cagr !== null && data.cagr !== undefined;
  const hasGrowthDrivers = data.growth_drivers && data.growth_drivers.length > 0;
  
  // Don't render if no market data available
  if (!hasCagr && !hasGrowthDrivers) return null;

  return (
    <div className={`space-y-1 mb-3 ${viewDensity === 'compact' ? 'space-y-1' : 'space-y-2'}`}>
      {/* Market Growth Rate - CAGR */}
      {hasCagr ? (
        <div className={`flex items-center gap-2 ${textSize}`}>
          <TrendingUp className={`${iconSize} text-emerald-500 flex-shrink-0`} />
          <span className="text-foreground font-medium">
            Market Growth: {data.cagr}% CAGR
          </span>
        </div>
      ) : (
        <div className={`flex items-center gap-2 ${textSize}`}>
          <TrendingUp className={`${iconSize} text-muted-foreground flex-shrink-0`} />
          <span className="text-muted-foreground">
            Market Growth: Data not available
          </span>
        </div>
      )}

      {/* Growth Drivers - Only show in detailed view */}
      {viewDensity === 'detailed' && hasGrowthDrivers && (
        <div className="ml-5 space-y-1">
          <div className="text-xs text-muted-foreground font-medium">Growth Drivers:</div>
          {data.growth_drivers!.slice(0, 3).map((driver, index) => (
            <div key={index} className="text-xs text-muted-foreground">
              • {driver}
            </div>
          ))}
          {data.growth_drivers!.length > 3 && (
            <div className="text-xs text-muted-foreground">
              +{data.growth_drivers!.length - 3} more factors
            </div>
          )}
        </div>
      )}

      {/* Source Attribution - Only show in detailed view */}
      {viewDensity === 'detailed' && data.source_engines && data.source_engines.length > 0 && (
        <div className="ml-5 text-xs text-muted-foreground">
          Sources: {data.source_engines.map(getSourceDisplayName).join(', ')}
        </div>
      )}
    </div>
  );
};