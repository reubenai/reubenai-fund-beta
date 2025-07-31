import React from 'react';
import { KanbanBoard } from '@/components/pipeline/KanbanBoard';
import { useFund } from '@/contexts/FundContext';
import { useSearchParams } from 'react-router-dom';

export default function Pipeline() {
  const { selectedFund, funds, setSelectedFund } = useFund();
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
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Please select a fund to view the deal pipeline</p>
          {funds.length === 0 ? (
            <p className="text-sm text-muted-foreground">No active funds found</p>
          ) : (
            <p className="text-sm text-muted-foreground">Use the fund selector in the sidebar</p>
          )}
        </div>
      </div>
    );
  }

  return <KanbanBoard fundId={selectedFund.id} />;
}