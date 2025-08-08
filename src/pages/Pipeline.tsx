import React from 'react';
import { KanbanBoard } from '@/components/pipeline/KanbanBoard';
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

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      
      
      {/* Debug info for super admin users */}
      {isSuperAdmin && (
        <div className="mb-4 p-4 bg-muted rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="secondary">Super Admin Access</Badge>
            <span className="text-sm text-muted-foreground">
              Role: {role} | Org ID: {organizationId} | Total Funds: {funds.length}
            </span>
          </div>
          <div className="text-xs text-muted-foreground">
            You can see funds across all organizations: {funds.map(f => f.name).join(', ')}
          </div>
        </div>
      )}
      
      <KanbanBoard fundId={selectedFund.id} />
    </div>
  );
}