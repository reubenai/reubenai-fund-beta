/**
 * Deal Analysis Status Panel Component
 * Shows the status of deal analysis including data integration completion
 */

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  RefreshCw, 
  Database,
  BarChart3
} from 'lucide-react';
import { useDealDataIntegration } from '@/hooks/useDealDataIntegration';
import { SimplifiedOrchestrationService } from '@/services/simplifiedOrchestrationService';
import { AnyFundType } from '@/utils/fundTypeConversion';
import { useToast } from '@/hooks/use-toast';

interface DealAnalysisStatusPanelProps {
  dealId: string;
  fundId: string;
  fundType: AnyFundType;
  organizationId: string;
}

export function DealAnalysisStatusPanel({ 
  dealId, 
  fundId, 
  fundType, 
  organizationId 
}: DealAnalysisStatusPanelProps) {
  const [orchestrationStatus, setOrchestrationStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { integrateDealData, isIntegrating } = useDealDataIntegration();
  const { toast } = useToast();

  // Load orchestration status
  const loadStatus = async () => {
    try {
      setLoading(true);
      const status = await SimplifiedOrchestrationService.getOrchestrationStatus(dealId, fundType);
      setOrchestrationStatus(status);
    } catch (error) {
      console.error('Error loading orchestration status:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, [dealId, fundType]);

  // Manual trigger analysis
  const handleTriggerAnalysis = async () => {
    try {
      const result = await SimplifiedOrchestrationService.orchestrateAnalysis({
        dealId,
        fundId,
        organizationId,
        fundType,
        triggerReason: 'manual_trigger',
        priority: 'high'
      });

      if (result.success) {
        toast({
          title: "Analysis Started",
          description: `Data integration initiated with ${result.dataCompleteness}% completeness`,
          variant: "default"
        });
        
        // Reload status
        await loadStatus();
      } else {
        toast({
          title: "Analysis Failed",
          description: result.error || "Failed to start analysis",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to trigger analysis",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Analysis Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Loading analysis status...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'complete':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'processing':
        return <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'complete':
        return 'default';
      case 'processing':
        return 'secondary';
      case 'failed':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Analysis Status
          </div>
          <Button
            onClick={handleTriggerAnalysis}
            disabled={isIntegrating}
            size="sm"
            variant="outline"
          >
            {isIntegrating ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                Processing...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Analysis
              </>
            )}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {orchestrationStatus ? (
          <>
            {/* Overall Status */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getStatusIcon(orchestrationStatus.overallStatus)}
                <span className="font-medium">Overall Status</span>
              </div>
              <Badge variant={getStatusColor(orchestrationStatus.overallStatus) as any}>
                {orchestrationStatus.overallStatus}
              </Badge>
            </div>

            {/* Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Data Completeness</span>
                <span>{orchestrationStatus.progress}%</span>
              </div>
              <Progress value={orchestrationStatus.progress} className="h-2" />
            </div>

            {/* Source Engines */}
            {orchestrationStatus.sourceEngines && orchestrationStatus.sourceEngines.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  Data Sources
                </h4>
                <div className="flex flex-wrap gap-1">
                  {orchestrationStatus.sourceEngines.map((engine: string) => (
                    <Badge key={engine} variant="secondary" className="text-xs">
                      {engine.replace(/-/g, ' ').replace(/^\w/, c => c.toUpperCase())}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Last Updated */}
            <div className="text-xs text-muted-foreground">
              Last updated: {new Date(orchestrationStatus.lastUpdated).toLocaleString()}
            </div>
          </>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">No analysis data available</p>
            <p className="text-xs mt-1">Click "Refresh Analysis" to start data integration</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}