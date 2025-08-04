import React from 'react';
import { useFund } from '@/contexts/FundContext';
import { EnhancedFundMemoryDashboard } from '@/components/fund-memory/EnhancedFundMemoryDashboard';

export default function FundMemory() {
  const { selectedFund } = useFund();

  if (!selectedFund) {
    return (
      <div className="space-y-8 p-8">
        <div>
          <h1 className="text-4xl font-bold text-foreground">Enhanced Fund Memory</h1>
          <p className="text-lg text-muted-foreground mt-2">Please select a fund to view institutional memory insights</p>
        </div>
      </div>
    );
  }

  return (
    <EnhancedFundMemoryDashboard 
      fundId={selectedFund.id} 
      fundName={selectedFund.name} 
    />
  );
}