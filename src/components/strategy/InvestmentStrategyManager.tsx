import { Target } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { StrategyConfigurationManager } from './StrategyConfigurationManager';

interface InvestmentStrategyManagerProps {
  fundId: string;
  fundName: string;
}

export function InvestmentStrategyManager({ fundId, fundName }: InvestmentStrategyManagerProps) {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Orange-branded header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Target className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Investment Strategy</h1>
              <p className="text-gray-600">Define and refine your investment criteria and approach</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="bg-white">
          <StrategyConfigurationManager fundId={fundId} fundName={fundName} />
        </Card>
      </div>
    </div>
  );
}