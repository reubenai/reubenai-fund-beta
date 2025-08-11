import React from 'react';
import { EnhancedPipelineView } from '@/components/pipeline/EnhancedPipelineView';
import { InvestmentStatusIndicator } from '@/components/pipeline/InvestmentStatusIndicator';
import { useFund } from '@/contexts/FundContext';

import { useSearchParams } from 'react-router-dom';
// Breadcrumbs removed - using Layout breadcrumbs
import { useUserRole } from '@/hooks/useUserRole';
import { Badge } from '@/components/ui/badge';

export default function Pipeline() {
  const { selectedFund, funds, setSelectedFund } = useFund();
  const { isSuperAdmin, role, organizationId } = useUserRole();
  const [searchParams] = useSearchParams();
  const fundIdParam = searchParams.get('fund');

  // If there's a fund ID in the URL, select that fund
  React.useEffect(() => {
    if (fundIdParam && funds.length > 0) {
      const fund = funds.find(f => f.id === fundIdParam);
      if (fund && fund.id !== selectedFund?.id) {
        setSelectedFund(fund);
      }
    }
  }, [fundIdParam, funds, selectedFund, setSelectedFund]);

  if (!selectedFund) {
    console.log('No selected fund. Available funds:', funds.length, 'Fund param:', fundIdParam);
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Please select a fund to view the deal pipeline</p>
          {funds.length === 0 ? (
            <p className="text-sm text-muted-foreground">No active funds found</p>
          ) : (
            <div>
              <p className="text-sm text-muted-foreground mb-2">Use the fund selector in the sidebar</p>
              <p className="text-xs text-muted-foreground">Available funds: {funds.map(f => f.name).join(', ')}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
      {/* Beta v1 Notice */}
      <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
        <h3 className="font-semibold text-primary mb-2">Beta v1 Notice</h3>
        <p className="text-sm text-muted-foreground">
          The objective of the Deal Pipeline in v1 is to enable Investment Teams to upload Deals, move Deals between investment stages, upload relevant documents (such as Pitch Decks and Financial Models) to engage our intelligent parsing and deal analysis engines. These engines require training to improve accuracy and depth. In the first instance, rubrics applied will be basic, but this will refine and iterate as Reuben is able to facilitate more deal activities.
        </p>
      </div>

      
      {/* Controlled Analysis Status - Temporarily disabled */}
      {/* <InvestmentStatusIndicator /> */}
      
      <EnhancedPipelineView fundId={selectedFund.id} />
    </div>
  );
}