import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Play, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Info, 
  Rocket,
  Clock,
  Shield,
  Database,
  Smartphone,
  Zap
} from 'lucide-react';
import { productionReadinessTest } from '@/utils/productionReadinessTest';
import type { ProductionReadinessReport } from '@/utils/productionReadinessTest';

interface TestResult {
  testName: string;
  passed: boolean;
  details: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  recommendation?: string;
}

export function ProductionReadinessPanel() {
  const [isRunning, setIsRunning] = useState(false);
  const [report, setReport] = useState<ProductionReadinessReport | null>(null);
  const [lastRunTime, setLastRunTime] = useState<Date | null>(null);

  const runTests = async () => {
    setIsRunning(true);
    try {
      const result = await productionReadinessTest.runFullTestSuite();
      setReport(result);
      setLastRunTime(new Date());
    } catch (error) {
      console.error('Failed to run production readiness tests:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <XCircle className="h-4 w-4 text-destructive" />;
      case 'high': return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'medium': return <Info className="h-4 w-4 text-yellow-500" />;
      case 'low': return <CheckCircle className="h-4 w-4 text-green-500" />;
      default: return <Info className="h-4 w-4" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    const variants = {
      critical: 'destructive',
      high: 'destructive',
      medium: 'secondary',
      low: 'outline'
    } as const;
    
    return (
      <Badge variant={variants[severity as keyof typeof variants] || 'outline'}>
        {severity.toUpperCase()}
      </Badge>
    );
  };

  const groupResultsByCategory = (results: TestResult[]) => {
    const categories = {
      security: results.filter(r => 
        r.testName.includes('Authentication') || 
        r.testName.includes('RLS') || 
        r.testName.includes('Security')
      ),
      database: results.filter(r => 
        r.testName.includes('Database') || 
        r.testName.includes('IC Table') || 
        r.testName.includes('Data')
      ),
      performance: results.filter(r => 
        r.testName.includes('Performance') || 
        r.testName.includes('Query')
      ),
      frontend: results.filter(r => 
        r.testName.includes('UI') || 
        r.testName.includes('Frontend') || 
        r.testName.includes('Mobile')
      ),
      infrastructure: results.filter(r => 
        r.testName.includes('Edge Function') || 
        r.testName.includes('Connectivity')
      ),
    };
    
    return categories;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Production Readiness</h2>
          <p className="text-sm text-muted-foreground">
            Comprehensive pre-launch testing and validation
          </p>
        </div>
        <Button 
          onClick={runTests} 
          disabled={isRunning}
          className="gap-2"
        >
          {isRunning ? (
            <>
              <Clock className="h-4 w-4 animate-spin" />
              Running Tests...
            </>
          ) : (
            <>
              <Play className="h-4 w-4" />
              Run Full Test Suite
            </>
          )}
        </Button>
      </div>

      {lastRunTime && (
        <p className="text-xs text-muted-foreground">
          Last run: {lastRunTime.toLocaleString()}
        </p>
      )}

      {report && (
        <div className="space-y-6">
          {/* Overall Status */}
          <Card className={`border-2 ${report.readyForProduction ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {report.readyForProduction ? (
                    <Rocket className="h-8 w-8 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-8 w-8 text-red-600" />
                  )}
                  <div>
                    <CardTitle className={report.readyForProduction ? 'text-green-800' : 'text-red-800'}>
                      {report.readyForProduction ? 'Ready for Production Launch! 🚀' : 'Not Ready for Production'}
                    </CardTitle>
                    <CardDescription>
                      Overall score: {report.overallScore}/100 • {report.passed}/{report.totalTests} tests passed
                    </CardDescription>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-3xl font-bold ${report.readyForProduction ? 'text-green-600' : 'text-red-600'}`}>
                    {report.overallScore}%
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Progress 
                value={report.overallScore} 
                className="h-3 mb-4"
              />
              
              {report.criticalIssues > 0 && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    <strong>{report.criticalIssues} critical issue(s)</strong> must be resolved before production launch.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Detailed Results */}
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="security">
                <Shield className="h-4 w-4 mr-2" />
                Security
              </TabsTrigger>
              <TabsTrigger value="database">
                <Database className="h-4 w-4 mr-2" />
                Database
              </TabsTrigger>
              <TabsTrigger value="performance">
                <Zap className="h-4 w-4 mr-2" />
                Performance
              </TabsTrigger>
              <TabsTrigger value="frontend">
                <Smartphone className="h-4 w-4 mr-2" />
                Frontend
              </TabsTrigger>
              <TabsTrigger value="all">All Tests</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-green-600">Passed Tests</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">{report.passed}</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-red-600">Failed Tests</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">{report.failed}</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-orange-600">Critical Issues</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-600">{report.criticalIssues}</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-blue-600">Total Tests</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">{report.totalTests}</div>
                  </CardContent>
                </Card>
              </div>

              {/* Critical Issues Summary */}
              {report.criticalIssues > 0 && (
                <Card className="border-red-200">
                  <CardHeader>
                    <CardTitle className="text-red-800 flex items-center gap-2">
                      <XCircle className="h-5 w-5" />
                      Critical Issues Requiring Immediate Attention
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {report.results
                      .filter(r => !r.passed && r.severity === 'critical')
                      .map((result, index) => (
                        <Alert key={index} className="border-red-200 bg-red-50">
                          <AlertTriangle className="h-4 w-4 text-red-600" />
                          <AlertDescription>
                            <div className="font-medium text-red-800">{result.testName}</div>
                            <div className="text-sm text-red-700 mt-1">{result.details}</div>
                            {result.recommendation && (
                              <div className="text-sm text-red-600 mt-2 font-medium">
                                💡 {result.recommendation}
                              </div>
                            )}
                          </AlertDescription>
                        </Alert>
                      ))}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Category Tabs */}
            {Object.entries(groupResultsByCategory(report.results)).map(([category, results]) => (
              <TabsContent key={category} value={category} className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="capitalize">{category} Tests ({results.length})</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {results.map((result, index) => (
                      <div key={index} className={`p-3 rounded-lg border ${result.passed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 flex-1">
                            {result.passed ? (
                              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                            ) : (
                              getSeverityIcon(result.severity)
                            )}
                            <div className="flex-1">
                              <div className="font-medium flex items-center gap-2">
                                {result.testName}
                                {getSeverityBadge(result.severity)}
                              </div>
                              <div className="text-sm text-muted-foreground mt-1">
                                {result.details}
                              </div>
                              {result.recommendation && (
                                <div className="text-sm font-medium mt-2 text-blue-700">
                                  💡 {result.recommendation}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>
            ))}

            <TabsContent value="all" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>All Test Results ({report.totalTests})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {report.results.map((result, index) => (
                    <div key={index} className={`p-3 rounded-lg border ${result.passed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1">
                          {result.passed ? (
                            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                          ) : (
                            getSeverityIcon(result.severity)
                          )}
                          <div className="flex-1">
                            <div className="font-medium flex items-center gap-2">
                              {result.testName}
                              {getSeverityBadge(result.severity)}
                            </div>
                            <div className="text-sm text-muted-foreground mt-1">
                              {result.details}
                            </div>
                            {result.recommendation && (
                              <div className="text-sm font-medium mt-2 text-blue-700">
                                💡 {result.recommendation}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}

      {!report && !isRunning && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Rocket className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              Ready to Test Production Readiness?
            </h3>
            <p className="text-sm text-muted-foreground text-center max-w-md mb-6">
              Run a comprehensive test suite to validate authentication, database connectivity, 
              performance, security, and user experience before launching to production.
            </p>
            <Button onClick={runTests} size="lg" className="gap-2">
              <Play className="h-4 w-4" />
              Start Production Validation
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}