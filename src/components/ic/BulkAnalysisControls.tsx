import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  RefreshCw, 
  Play, 
  Pause, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  Users
} from 'lucide-react';
import { useControlledAnalysis } from '@/hooks/useControlledAnalysis';
import { useUserRole } from '@/hooks/useUserRole';
import { useToast } from '@/hooks/use-toast';

interface Deal {
  id: string;
  company_name: string;
  overall_score?: number;
  status: string;
  analysis_queue_status?: string;
}

interface BulkAnalysisControlsProps {
  deals: Deal[];
  fundId: string;
  onRefresh?: () => void;
}

export function BulkAnalysisControls({ deals, fundId, onRefresh }: BulkAnalysisControlsProps) {
  const { triggerBulkAnalysis, blockAnalysis } = useControlledAnalysis();
  const { role, isSuperAdmin } = useUserRole();
  const isFundManager = role === 'fund_manager';
  const isAdmin = role === 'admin';
  const { toast } = useToast();
  const [selectedDeals, setSelectedDeals] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Only fund managers, admins, and super admins can use bulk controls
  if (!isFundManager && !isAdmin && !isSuperAdmin) {
    return null;
  }

  const eligibleDeals = deals.filter(deal => 
    deal.analysis_queue_status !== 'processing' && 
    deal.analysis_queue_status !== 'queued'
  );

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedDeals(eligibleDeals.map(deal => deal.id));
    } else {
      setSelectedDeals([]);
    }
  };

  const handleSelectDeal = (dealId: string, checked: boolean) => {
    if (checked) {
      setSelectedDeals(prev => [...prev, dealId]);
    } else {
      setSelectedDeals(prev => prev.filter(id => id !== dealId));
    }
  };

  const handleBulkAnalysis = async () => {
    if (selectedDeals.length === 0) return;
    if (selectedDeals.length > 5) {
      toast({
        title: "Batch Size Limit",
        description: "Maximum 5 deals can be analyzed at once",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    try {
      const result = await triggerBulkAnalysis(selectedDeals, {
        batchSize: 5,
        forceOverride: false
      });

      if (result.success) {
        toast({
          title: "Bulk Analysis Started",
          description: `${selectedDeals.length} deals queued for analysis`
        });
        setSelectedDeals([]);
        onRefresh?.();
      } else {
        toast({
          title: "Analysis Failed",
          description: result.reason || "Failed to queue bulk analysis",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start bulk analysis",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getQueueStatusBadge = (status: string) => {
    switch (status) {
      case 'processing':
        return <Badge variant="default" className="bg-blue-100 text-blue-800"><RefreshCw className="h-3 w-3 mr-1 animate-spin" />Processing</Badge>;
      case 'queued':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Queued</Badge>;
      case 'completed':
        return <Badge variant="outline" className="text-green-600"><CheckCircle className="h-3 w-3 mr-1" />Complete</Badge>;
      case 'failed':
        return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />Failed</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5" />
              Bulk Analysis Controls
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Manage deal analysis for multiple deals (Fund Manager+ only)
            </p>
          </div>
          <Badge variant="outline" className="text-xs">
            {selectedDeals.length} / 5 selected
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {selectedDeals.length > 5 && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Maximum 5 deals can be analyzed at once. Please reduce your selection.
            </AlertDescription>
          </Alert>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="select-all"
              checked={selectedDeals.length === eligibleDeals.length && eligibleDeals.length > 0}
              onCheckedChange={handleSelectAll}
            />
            <label htmlFor="select-all" className="text-sm font-medium">
              Select All Eligible Deals ({eligibleDeals.length})
            </label>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedDeals([])}
              disabled={selectedDeals.length === 0}
            >
              Clear Selection
            </Button>
            <Button
              size="sm"
              onClick={handleBulkAnalysis}
              disabled={selectedDeals.length === 0 || selectedDeals.length > 5 || isProcessing}
              className="flex items-center gap-2"
            >
              {isProcessing ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              {isProcessing ? 'Processing...' : `Analyze ${selectedDeals.length} Deals`}
            </Button>
          </div>
        </div>

        <div className="max-h-60 overflow-y-auto space-y-2">
          {eligibleDeals.map((deal) => (
            <div
              key={deal.id}
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/30"
            >
              <div className="flex items-center space-x-3">
                <Checkbox
                  checked={selectedDeals.includes(deal.id)}
                  onCheckedChange={(checked) => handleSelectDeal(deal.id, checked as boolean)}
                />
                <div>
                  <p className="text-sm font-medium">{deal.company_name}</p>
                  <p className="text-xs text-muted-foreground">
                    Score: {deal.overall_score || 'N/A'} • Status: {deal.status}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getQueueStatusBadge(deal.analysis_queue_status || 'pending')}
              </div>
            </div>
          ))}
        </div>

        {eligibleDeals.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Pause className="h-8 w-8 mx-auto mb-2" />
            <p className="text-sm">No deals available for bulk analysis</p>
            <p className="text-xs">All deals are either being processed or queued</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}