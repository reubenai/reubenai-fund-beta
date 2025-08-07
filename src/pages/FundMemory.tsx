import React from 'react';
import { useFund } from '@/contexts/FundContext';
import { EnhancedFundMemoryDashboard } from '@/components/fund-memory/EnhancedFundMemoryDashboard';
import { ActivityInsightsDashboard } from '@/components/activity/ActivityInsightsDashboard';
import { ActivityDigest } from '@/components/activity/ActivityDigest';

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
    <div className="space-y-6 p-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <EnhancedFundMemoryDashboard 
            fundId={selectedFund.id} 
            fundName={selectedFund.name} 
          />
        </div>
        <div className="space-y-6">
          <ActivityInsightsDashboard timeRange="7d" />
          <ActivityDigest timeRange="24h" showSignificantOnly={true} maxItems={8} />
        </div>
      </div>
    </div>
  );
}