import { Target } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { StrategyConfigurationManager } from './StrategyConfigurationManager';

interface InvestmentStrategyManagerProps {
  fundId: string;
  fundName: string;
}

export function InvestmentStrategyManager({ fundId, fundName }: InvestmentStrategyManagerProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Clean header */}
      <div className="bg-card border-b">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Investment Strategy</h1>
            <p className="text-muted-foreground mt-1">Define and refine your investment criteria and approach</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <Card className="shadow-sm border-0">
          <StrategyConfigurationManager fundId={fundId} fundName={fundName} />
        </Card>
      </div>
    </div>
  );
}