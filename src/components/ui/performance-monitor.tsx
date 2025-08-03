/**
 * Performance Monitor Component
 * Displays real-time performance metrics in development mode
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Activity, ChevronDown, ChevronUp, AlertTriangle, CheckCircle } from 'lucide-react';
import { performanceMonitor } from '@/utils/performanceMonitor';

interface PerformanceMonitorProps {
  showInProduction?: boolean;
}

export function PerformanceMonitor({ showInProduction = false }: PerformanceMonitorProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [summary, setSummary] = useState<any>(null);
  const [thresholds, setThresholds] = useState<any>(null);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  const isProduction = process.env.NODE_ENV === 'production';

  useEffect(() => {
    if (isProduction && !showInProduction) {
      return;
    }

    const updateMetrics = () => {
      const performanceSummary = performanceMonitor.getPerformanceSummary();
      const thresholdCheck = performanceMonitor.checkPerformanceThresholds();
      
      setSummary(performanceSummary);
      setThresholds(thresholdCheck);
    };

    // Initial load
    updateMetrics();

    // Set up refresh interval
    const interval = setInterval(updateMetrics, 5000); // Every 5 seconds
    setRefreshInterval(interval);

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isProduction, showInProduction]);

  if (isProduction && !showInProduction) {
    return null;
  }

  if (!summary) {
    return null;
  }

  const getPerformanceStatus = () => {
    if (!thresholds) return 'unknown';
    return thresholds.passed ? 'good' : 'warning';
  };

  const status = getPerformanceStatus();

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild>
          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Performance Monitor
                  {status === 'good' ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  )}
                </div>
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-xs text-muted-foreground">
                API: {summary.apiPerformance.averageResponseTime.toFixed(0)}ms avg
              </div>
            </CardContent>
          </Card>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <Card className="mt-2 border-t-0">
            <CardContent className="p-4 space-y-4">
              {/* Web Vitals */}
              <div>
                <h4 className="text-sm font-medium mb-2">Web Vitals</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {summary.webVitals.fcp && (
                    <div className="flex justify-between">
                      <span>FCP:</span>
                      <Badge variant={summary.webVitals.fcp > 1800 ? 'destructive' : 'secondary'}>
                        {summary.webVitals.fcp.toFixed(0)}ms
                      </Badge>
                    </div>
                  )}
                  {summary.webVitals.lcp && (
                    <div className="flex justify-between">
                      <span>LCP:</span>
                      <Badge variant={summary.webVitals.lcp > 2500 ? 'destructive' : 'secondary'}>
                        {summary.webVitals.lcp.toFixed(0)}ms
                      </Badge>
                    </div>
                  )}
                  {summary.webVitals.ttfb && (
                    <div className="flex justify-between">
                      <span>TTFB:</span>
                      <Badge variant={summary.webVitals.ttfb > 800 ? 'destructive' : 'secondary'}>
                        {summary.webVitals.ttfb.toFixed(0)}ms
                      </Badge>
                    </div>
                  )}
                </div>
              </div>

              {/* API Performance */}
              <div>
                <h4 className="text-sm font-medium mb-2">API Performance</h4>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span>Total Calls:</span>
                    <span>{summary.apiPerformance.totalCalls}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Slow Calls:</span>
                    <Badge variant={summary.apiPerformance.slowCalls > 0 ? 'destructive' : 'secondary'}>
                      {summary.apiPerformance.slowCalls}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Avg Response:</span>
                    <Badge variant={summary.apiPerformance.averageResponseTime > 2000 ? 'destructive' : 'secondary'}>
                      {summary.apiPerformance.averageResponseTime.toFixed(0)}ms
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Render Performance */}
              <div>
                <h4 className="text-sm font-medium mb-2">Render Performance</h4>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span>Total Renders:</span>
                    <span>{summary.renderPerformance.totalRenders}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Slow Renders:</span>
                    <Badge variant={summary.renderPerformance.slowRenders > 0 ? 'destructive' : 'secondary'}>
                      {summary.renderPerformance.slowRenders}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Avg Render:</span>
                    <Badge variant={summary.renderPerformance.averageRenderTime > 16 ? 'destructive' : 'secondary'}>
                      {summary.renderPerformance.averageRenderTime.toFixed(1)}ms
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Memory Usage */}
              {summary.memoryUsage && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Memory Usage</h4>
                  <div className="flex justify-between text-xs">
                    <span>Heap Usage:</span>
                    <Badge variant={summary.memoryUsage.usage_percentage > 80 ? 'destructive' : 'secondary'}>
                      {summary.memoryUsage.usage_percentage.toFixed(1)}%
                    </Badge>
                  </div>
                </div>
              )}

              {/* Issues */}
              {thresholds && thresholds.issues.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2 text-destructive">Performance Issues</h4>
                  <div className="space-y-1">
                    {thresholds.issues.slice(0, 3).map((issue: string, index: number) => (
                      <div key={index} className="text-xs text-destructive">
                        • {issue}
                      </div>
                    ))}
                    {thresholds.issues.length > 3 && (
                      <div className="text-xs text-muted-foreground">
                        +{thresholds.issues.length - 3} more issues
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Export Button */}
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs"
                onClick={() => {
                  const metrics = performanceMonitor.exportMetrics('hour');
                  const blob = new Blob([JSON.stringify(metrics, null, 2)], {
                    type: 'application/json'
                  });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `performance-metrics-${Date.now()}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
              >
                Export Metrics
              </Button>
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}