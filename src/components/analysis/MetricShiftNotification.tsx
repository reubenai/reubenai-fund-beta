import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Info, 
  CheckCircle,
  RefreshCw,
  X
} from 'lucide-react';
import { useEnrichmentEngine } from '@/hooks/useEnrichmentEngine';

interface MetricShift {
  category: string;
  metric: string;
  old_value: any;
  new_value: any;
  significance: 'minor' | 'moderate' | 'major';
  confidence: number;
  source: string;
}

interface MetricShiftNotificationProps {
  shifts: MetricShift[];
  onDismiss?: () => void;
  onRefreshAnalysis?: () => void;
}

export function MetricShiftNotification({ 
  shifts, 
  onDismiss, 
  onRefreshAnalysis 
}: MetricShiftNotificationProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || shifts.length === 0) return null;

  const majorShifts = shifts.filter(s => s.significance === 'major');
  const moderateShifts = shifts.filter(s => s.significance === 'moderate');

  const getShiftIcon = (shift: MetricShift) => {
    if (shift.significance === 'major') return <AlertTriangle className="h-4 w-4 text-red-600" />;
    if (shift.significance === 'moderate') return <TrendingUp className="h-4 w-4 text-amber-600" />;
    return <Info className="h-4 w-4 text-blue-600" />;
  };

  const getShiftBadgeVariant = (significance: string) => {
    switch (significance) {
      case 'major': return 'destructive';
      case 'moderate': return 'default';
      default: return 'secondary';
    }
  };

  const formatValue = (value: any) => {
    if (typeof value === 'number') {
      return value.toLocaleString();
    }
    if (typeof value === 'string' && value.length > 50) {
      return value.substring(0, 50) + '...';
    }
    return String(value);
  };

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  return (
    <Card className="border-l-4 border-l-amber-500 bg-amber-50/50 dark:bg-amber-950/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            Significant Metric Changes Detected
            <Badge variant="outline">
              {shifts.length} change{shifts.length > 1 ? 's' : ''}
            </Badge>
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={handleDismiss}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            The enrichment system has detected significant changes in key metrics. 
            {majorShifts.length > 0 && ` ${majorShifts.length} major shifts require immediate attention.`}
            Review the updated analysis for new insights and implications.
          </AlertDescription>
        </Alert>

        {/* Major Shifts */}
        {majorShifts.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-red-700 dark:text-red-400">
              Major Changes ({majorShifts.length})
            </h4>
            {majorShifts.map((shift, index) => (
              <div key={index} className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
                <div className="flex items-start gap-3">
                  {getShiftIcon(shift)}
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{shift.category}</span>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-sm">{shift.metric}</span>
                      <Badge variant={getShiftBadgeVariant(shift.significance)} className="text-xs">
                        {shift.significance}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      <span className="line-through">{formatValue(shift.old_value)}</span>
                      <span className="mx-2">→</span>
                      <span className="font-medium">{formatValue(shift.new_value)}</span>
                      <span className="ml-2 text-xs">({shift.confidence}% confidence)</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Source: {shift.source}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Moderate Shifts */}
        {moderateShifts.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-amber-700 dark:text-amber-400">
              Moderate Changes ({moderateShifts.length})
            </h4>
            {moderateShifts.slice(0, 3).map((shift, index) => (
              <div key={index} className="p-2 bg-amber-50 dark:bg-amber-950/20 rounded border border-amber-200 dark:border-amber-800">
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-medium">{shift.category}</span>
                  <span>•</span>
                  <span>{shift.metric}</span>
                  <Badge variant={getShiftBadgeVariant(shift.significance)} className="text-xs">
                    {shift.significance}
                  </Badge>
                </div>
              </div>
            ))}
            {moderateShifts.length > 3 && (
              <div className="text-xs text-muted-foreground">
                +{moderateShifts.length - 3} more moderate changes
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2 border-t">
          <Button onClick={onRefreshAnalysis} size="sm" className="flex-1">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Analysis
          </Button>
          <Button variant="outline" onClick={handleDismiss} size="sm">
            Dismiss
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}