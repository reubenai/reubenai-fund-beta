import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  RefreshCw,
  DollarSign,
  Calendar,
  Zap,
  Shield
} from 'lucide-react';
import { useControlledAnalysis } from '@/hooks/useControlledAnalysis';

interface EnhancedAnalysisIndicatorsProps {
  deal: {
    id: string;
    company_name: string;
    analysis_queue_status?: string;
    last_analysis_trigger?: string;
    first_analysis_completed?: boolean;
    analysis_blocked_until?: string;
    analysis_failure_count?: number;
  };
  onTriggerAnalysis?: () => void;
}

export function EnhancedAnalysisIndicators({ deal, onTriggerAnalysis }: EnhancedAnalysisIndicatorsProps) {
  const { triggerAnalysis, checkAnalysisEligibility } = useControlledAnalysis();
  const [eligibility, setEligibility] = React.useState<any>(null);
  const [checking, setChecking] = React.useState(false);

  React.useEffect(() => {
    checkEligibility();
  }, [deal.id]);

  const checkEligibility = async () => {
    setChecking(true);
    const result = await checkAnalysisEligibility(deal.id, 'manual_trigger');
    setEligibility(result);
    setChecking(false);
  };

  const handleTriggerAnalysis = async () => {
    const result = await triggerAnalysis({
      type: 'manual_trigger',
      dealId: deal.id,
      metadata: { triggered_from: 'ic_enhanced_indicators' }
    });
    
    if (result.success && onTriggerAnalysis) {
      onTriggerAnalysis();
    }
  };

  const getQueueStatusInfo = () => {
    switch (deal.analysis_queue_status) {
      case 'queued':
        return {
          icon: Clock,
          label: 'Queued',
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-100',
          description: 'Analysis queued for processing'
        };
      case 'processing':
        return {
          icon: RefreshCw,
          label: 'Processing',
          color: 'text-blue-600',
          bgColor: 'bg-blue-100',
          description: 'Analysis currently running'
        };
      case 'completed':
        return {
          icon: CheckCircle,
          label: 'Completed',
          color: 'text-green-600',
          bgColor: 'bg-green-100',
          description: 'Analysis completed successfully'
        };
      case 'failed':
        return {
          icon: AlertTriangle,
          label: 'Failed',
          color: 'text-red-600',
          bgColor: 'bg-red-100',
          description: 'Analysis failed - manual retry available'
        };
      default:
        return {
          icon: Clock,
          label: 'Pending',
          color: 'text-gray-600',
          bgColor: 'bg-gray-100',
          description: 'No analysis scheduled'
        };
    }
  };

  const statusInfo = getQueueStatusInfo();
  const StatusIcon = statusInfo.icon;
  const isBlocked = deal.analysis_blocked_until && new Date(deal.analysis_blocked_until) > new Date();
  const failureCount = deal.analysis_failure_count || 0;

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm font-medium">Analysis Status</CardTitle>
            <CardDescription className="text-xs">
              Controlled analysis execution for {deal.company_name}
            </CardDescription>
          </div>
          <div className={`p-2 rounded-full ${statusInfo.bgColor}`}>
            <StatusIcon className={`h-4 w-4 ${statusInfo.color} ${
              deal.analysis_queue_status === 'processing' ? 'animate-spin' : ''
            }`} />
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Current Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {statusInfo.label}
            </Badge>
            {!deal.first_analysis_completed && (
              <Badge variant="secondary" className="text-xs">
                <Zap className="h-3 w-3 mr-1" />
                First Analysis
              </Badge>
            )}
          </div>
          <span className="text-xs text-muted-foreground">
            {statusInfo.description}
          </span>
        </div>

        {/* Blocking Status */}
        {isBlocked && (
          <div className="flex items-center gap-2 p-2 bg-red-50 rounded border border-red-200">
            <Shield className="h-4 w-4 text-red-600" />
            <div className="flex-1">
              <p className="text-xs font-medium text-red-800">Analysis Blocked</p>
              <p className="text-xs text-red-600">
                Until: {new Date(deal.analysis_blocked_until!).toLocaleDateString()}
              </p>
            </div>
          </div>
        )}

        {/* Failure Information */}
        {failureCount > 0 && (
          <div className="flex items-center gap-2 p-2 bg-orange-50 rounded border border-orange-200">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <div className="flex-1">
              <p className="text-xs font-medium text-orange-800">
                {failureCount} Previous Failure{failureCount > 1 ? 's' : ''}
              </p>
              <p className="text-xs text-orange-600">
                Next failure may result in temporary blocking
              </p>
            </div>
          </div>
        )}

        {/* Analysis Trigger Information */}
        {deal.last_analysis_trigger && (
          <div className="text-xs text-muted-foreground">
            <p>Last trigger: {deal.last_analysis_trigger}</p>
          </div>
        )}

        {/* Eligibility Status */}
        {eligibility && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium">Manual Trigger Eligibility</span>
              {checking ? (
                <RefreshCw className="h-3 w-3 animate-spin text-muted-foreground" />
              ) : (
                <Badge 
                  variant={eligibility.allowed ? "default" : "destructive"}
                  className="text-xs"
                >
                  {eligibility.allowed ? 'Allowed' : 'Blocked'}
                </Badge>
              )}
            </div>
            
            {!eligibility.allowed && (
              <p className="text-xs text-red-600 bg-red-50 p-2 rounded">
                {eligibility.reason}
              </p>
            )}
            
            {eligibility.allowed && (
              <div className="text-xs text-muted-foreground space-y-1">
                <p>Priority: {eligibility.priority}</p>
                <p>Delay: {eligibility.delay_minutes} minutes</p>
              </div>
            )}
          </div>
        )}

        {/* Action Controls */}
        <div className="flex gap-2 pt-2 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={handleTriggerAnalysis}
            disabled={
              checking || 
              isBlocked || 
              deal.analysis_queue_status === 'processing' ||
              deal.analysis_queue_status === 'queued' ||
              (eligibility && !eligibility.allowed)
            }
            className="text-xs flex-1"
          >
            {deal.analysis_queue_status === 'processing' || deal.analysis_queue_status === 'queued' ? (
              <>
                <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                In Progress
              </>
            ) : (
              <>
                <Zap className="h-3 w-3 mr-1" />
                Trigger Analysis
              </>
            )}
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={checkEligibility}
            disabled={checking}
            className="text-xs"
          >
            {checking ? (
              <RefreshCw className="h-3 w-3 animate-spin" />
            ) : (
              <RefreshCw className="h-3 w-3" />
            )}
          </Button>
        </div>

        {/* Cost Estimation */}
        {eligibility?.allowed && (
          <div className="text-xs text-muted-foreground bg-blue-50 p-2 rounded">
            <div className="flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              <span>Estimated cost: $15-25 per analysis</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}