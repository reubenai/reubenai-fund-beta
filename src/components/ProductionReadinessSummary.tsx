import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-states';
import { CheckCircle, AlertTriangle, XCircle, Play } from 'lucide-react';
import { productionReadinessTest } from '@/utils/productionReadinessTest';
import type { ProductionReadinessReport } from '@/utils/productionReadinessTest';

export function ProductionReadinessSummary() {
  const [report, setReport] = useState<ProductionReadinessReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastRun, setLastRun] = useState<Date | null>(null);

  const runAnalysis = async () => {
    setLoading(true);
    try {
      const result = await productionReadinessTest.runFullTestSuite();
      setReport(result);
      setLastRun(new Date());
    } catch (error) {
      console.error('Production readiness analysis failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (score: number) => {
    if (score >= 85) return <CheckCircle className="h-5 w-5 text-green-500" />;
    if (score >= 70) return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    return <XCircle className="h-5 w-5 text-red-500" />;
  };

  const getStatusBadge = (score: number) => {
    if (score >= 85) return <Badge variant="default" className="bg-green-100 text-green-800">Production Ready</Badge>;
    if (score >= 70) return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Beta Ready</Badge>;
    return <Badge variant="destructive">Needs Work</Badge>;
  };

  const betaReadinessChecks = [
    { name: 'Authentication System', key: 'auth' },
    { name: 'Database Connectivity', key: 'database' },
    { name: 'Core User Flows', key: 'ui' },
    { name: 'Error Handling', key: 'error' },
    { name: 'Mobile Optimization', key: 'mobile' },
    { name: 'Performance', key: 'performance' }
  ];

  const getCheckStatus = (key: string) => {
    if (!report) return 'unknown';
    const relatedTests = report.results.filter(r => 
      r.testName.toLowerCase().includes(key.toLowerCase())
    );
    if (relatedTests.length === 0) return 'unknown';
    return relatedTests.every(test => test.passed) ? 'pass' : 'fail';
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Production Readiness Analysis
              {report && getStatusIcon(report.overallScore)}
            </CardTitle>
            <CardDescription>
              Comprehensive analysis for private beta launch readiness
            </CardDescription>
          </div>
          <Button 
            onClick={runAnalysis} 
            disabled={loading}
            size="sm"
            className="gap-2"
          >
            {loading ? <LoadingSpinner size="sm" /> : <Play className="h-4 w-4" />}
            {loading ? 'Analyzing...' : 'Run Analysis'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!report && !loading && (
          <div className="text-center py-8 text-muted-foreground">
            <p>Click "Run Analysis" to check production readiness</p>
          </div>
        )}

        {loading && (
          <div className="text-center py-8">
            <LoadingSpinner />
            <p className="mt-2 text-muted-foreground">Running comprehensive tests...</p>
          </div>
        )}

        {report && (
          <div className="space-y-6">
            {/* Overall Score */}
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div>
                <h3 className="font-semibold">Overall Score</h3>
                <p className="text-2xl font-bold">{report.overallScore}%</p>
              </div>
              <div className="text-right">
                {getStatusBadge(report.overallScore)}
                <p className="text-sm text-muted-foreground mt-1">
                  {report.passed} of {report.totalTests} tests passed
                </p>
              </div>
            </div>

            {/* Beta Readiness Checklist */}
            <div>
              <h4 className="font-semibold mb-3">Private Beta Readiness</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {betaReadinessChecks.map((check) => {
                  const status = getCheckStatus(check.key);
                  return (
                    <div key={check.key} className="flex items-center gap-2 p-2 rounded border">
                      {status === 'pass' && <CheckCircle className="h-4 w-4 text-green-500" />}
                      {status === 'fail' && <XCircle className="h-4 w-4 text-red-500" />}
                      {status === 'unknown' && <AlertTriangle className="h-4 w-4 text-yellow-500" />}
                      <span className="text-sm">{check.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Critical Issues */}
            {report.criticalIssues > 0 && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <h4 className="font-semibold text-red-800 dark:text-red-200 mb-2">
                  Critical Issues ({report.criticalIssues})
                </h4>
                <div className="space-y-2">
                  {report.results
                    .filter(r => !r.passed && r.severity === 'critical')
                    .map((issue, i) => (
                      <div key={i} className="text-sm">
                        <p className="font-medium text-red-700 dark:text-red-300">{issue.testName}</p>
                        <p className="text-red-600 dark:text-red-400">{issue.details}</p>
                        {issue.recommendation && (
                          <p className="text-red-600 dark:text-red-400 italic">💡 {issue.recommendation}</p>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Summary */}
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                {report.overallScore >= 70 ? '🎉 Ready for Private Beta!' : '⚠️ Action Required'}
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                {report.overallScore >= 70 
                  ? 'Your application meets the minimum requirements for private beta launch. Consider addressing any remaining high-priority items for optimal user experience.'
                  : 'Please address the critical issues above before launching your private beta to ensure a smooth user experience.'
                }
              </p>
            </div>

            {lastRun && (
              <p className="text-xs text-muted-foreground text-center">
                Last analysis: {lastRun.toLocaleString()}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}