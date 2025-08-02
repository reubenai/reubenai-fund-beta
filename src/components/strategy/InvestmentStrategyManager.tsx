import { Target } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { StrategyConfigurationManager } from './StrategyConfigurationManager';

interface InvestmentStrategyManagerProps {
  fundId: string;
  fundName: string;
  fundType: 'vc' | 'pe';
  isModal?: boolean;
}

export function InvestmentStrategyManager({ fundId, fundName, fundType, isModal = false }: InvestmentStrategyManagerProps) {
  if (isModal) {
    // Simplified layout for modal context
    return (
      <div className="space-y-4">
        <StrategyConfigurationManager fundId={fundId} fundName={fundName} fundType={fundType} />
      </div>
    );
  }

  return (
    <StrategyConfigurationManager fundId={fundId} fundName={fundName} fundType={fundType} />
  );
}