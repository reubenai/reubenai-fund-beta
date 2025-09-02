import React from 'react';
import { EnhancedPipelineView } from '@/components/pipeline/EnhancedPipelineView';
import { InvestmentStatusIndicator } from '@/components/pipeline/InvestmentStatusIndicator';
import { useFund } from '@/contexts/FundContext';
import { useCrunchbasePostProcessor } from '@/hooks/useCrunchbasePostProcessor';

import { useSearchParams } from 'react-router-dom';
// Breadcrumbs removed - using Layout breadcrumbs
import { useUserRole } from '@/hooks/useUserRole';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { triggerVCScoring, validateVCDeal } from '@/services/vcScoringService';
import { usePipelineDeals } from '@/hooks/usePipelineDeals';

export default function Pipeline() {
  const { selectedFund, funds, setSelectedFund } = useFund();
  const { isSuperAdmin, role, organizationId } = useUserRole();
  const { isBackfilling, backfillAllRawRecords } = useCrunchbasePostProcessor();
  const [searchParams] = useSearchParams();
  const fundIdParam = searchParams.get('fund');
  const { toast } = useToast();
  
  // VC Scoring state
  const [selectedDealId, setSelectedDealId] = React.useState<string>('');
  const [isScoring, setIsScoring] = React.useState(false);
  
  // Get all deals for the selected fund
  const { deals: allDeals } = usePipelineDeals(selectedFund?.id);

  // If there's a fund ID in the URL, select that fund
  React.useEffect(() => {
    if (fundIdParam && funds.length > 0) {
      const fund = funds.find(f => f.id === fundIdParam);
      if (fund && fund.id !== selectedFund?.id) {
        setSelectedFund(fund);
      }
    }
  }, [fundIdParam, funds, selectedFund, setSelectedFund]);

  const handleBackfill = async () => {
    try {
      await backfillAllRawRecords();
    } catch (error) {
      console.error('Backfill failed:', error);
    }
  };

  const handleVCScoring = async () => {
    if (!selectedDealId) {
      toast({
        title: "No Deal Selected",
        description: "Please select a deal to analyze",
        variant: "destructive"
      });
      return;
    }

    const selectedDeal = Object.values(allDeals).flat().find(deal => deal.id === selectedDealId);
    if (!selectedDeal) {
      toast({
        title: "Deal Not Found",
        description: "Selected deal could not be found",
        variant: "destructive"
      });
      return;
    }

    if (!validateVCDeal(selectedDeal, selectedFund?.fund_type)) {
      toast({
        title: "Invalid Deal Type",
        description: "VC scoring is only available for Venture Capital deals",
        variant: "destructive"
      });
      return;
    }

    setIsScoring(true);
    try {
      const result = await triggerVCScoring(selectedDealId);
      
      toast({
        title: "VC Analysis Completed",
        description: `Analysis completed with score ${result.overall_score}/100. ${result.memo_generation.success ? 'IC memo generated successfully.' : 'Memo generation failed.'}`,
        variant: "default"
      });
      
      setSelectedDealId('');
    } catch (error) {
      console.error('VC Scoring failed:', error);
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Failed to analyze deal",
        variant: "destructive"
      });
    } finally {
      setIsScoring(false);
    }
  };

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
          The v1 Deal Pipeline enables teams to upload and stage deals, attach key documents for AI parsing, and begin basic analysis—rubrics will refine as deal activity increases. Moving a Deal to Investment Committee stage will trigger IC workflows.
        </p>
      </div>

      {/* Admin Section - Only for Super Admins */}
      {isSuperAdmin && (
        <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
          <h3 className="font-semibold text-orange-800 dark:text-orange-200 mb-2 flex items-center gap-2">
            🔧 Admin Tools
            <Badge variant="secondary" className="text-xs">Super Admin Only</Badge>
          </h3>
          <div className="flex gap-3 flex-wrap">
            <Button 
              onClick={handleBackfill} 
              disabled={isBackfilling}
              variant="outline"
              size="sm"
              className="text-xs"
            >
              {isBackfilling ? 'Processing...' : 'Backfill Crunchbase Records'}
            </Button>
            
            <div className="flex gap-2 items-center">
              <Select value={selectedDealId} onValueChange={setSelectedDealId}>
                <SelectTrigger className="w-48 h-8 text-xs">
                  <SelectValue placeholder="Select deal to analyze" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(allDeals).flat().map((deal) => (
                    <SelectItem key={deal.id} value={deal.id}>
                      {deal.company_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Button 
                onClick={handleVCScoring} 
                disabled={isScoring || !selectedDealId}
                variant="outline"
                size="sm"
                className="text-xs"
              >
                {isScoring ? 'Analyzing...' : 'Trigger VC Scoring'}
              </Button>
            </div>
          </div>
          <p className="text-xs text-orange-700 dark:text-orange-300 mt-2">
            Process all raw Crunchbase data that's stuck in the queue
          </p>
        </div>
      )}
      
      {/* Controlled Analysis Status - Temporarily disabled */}
      {/* <InvestmentStatusIndicator /> */}
      
      <EnhancedPipelineView fundId={selectedFund.id} />
    </div>
  );
}