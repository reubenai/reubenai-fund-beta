import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoadingSpinner } from '@/components/ui/loading-states';
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  PlayCircle,
  Database,
  Shield,
  Zap,
  Monitor,
  Users,
  Globe,
  Settings,
  Smartphone,
  FileText
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ComponentHealthCheck {
  component: string;
  status: 'healthy' | 'warning' | 'critical' | 'unknown';
  score: number;
  issues: string[];
  recommendations: string[];
  lastTested: string;
}

interface ProductionReadinessReport {
  overallScore: number;
  launchReadiness: 'ready' | 'needs_attention' | 'not_ready';
  criticalIssues: number;
  components: ComponentHealthCheck[];
  nextSteps: string[];
  estimatedFixTime: string;
  gapAnalysis: {
    authentication: ComponentHealthCheck;
    database: ComponentHealthCheck;
    api_endpoints: ComponentHealthCheck;
    ui_ux: ComponentHealthCheck;
    performance: ComponentHealthCheck;
    security: ComponentHealthCheck;
    error_handling: ComponentHealthCheck;
    data_validation: ComponentHealthCheck;
    mobile_optimization: ComponentHealthCheck;
    edge_functions: ComponentHealthCheck;
  };
  timestamp: string;
}

export function ComprehensiveProductionReadiness() {
  const [report, setReport] = useState<ProductionReadinessReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastRun, setLastRun] = useState<Date | null>(null);

  const runComprehensiveAnalysis = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('production-readiness-orchestrator', {
        body: { 
          analysisType: 'production_readiness',
          scope: 'comprehensive'
        }
      });

      if (error) throw error;

      setReport(data.report);
      setLastRun(new Date());
    } catch (error) {
      console.error('Production readiness analysis failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'critical': return <XCircle className="h-5 w-5 text-red-500" />;
      default: return <AlertTriangle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getComponentIcon = (component: string) => {
    switch (component.toLowerCase()) {
      case 'authentication': return <Users className="h-4 w-4" />;
      case 'database': return <Database className="h-4 w-4" />;
      case 'api endpoints': return <Globe className="h-4 w-4" />;
      case 'ui/ux': return <Monitor className="h-4 w-4" />;
      case 'performance': return <Zap className="h-4 w-4" />;
      case 'security': return <Shield className="h-4 w-4" />;
      case 'error handling': return <AlertTriangle className="h-4 w-4" />;
      case 'data validation': return <FileText className="h-4 w-4" />;
      case 'mobile optimization': return <Smartphone className="h-4 w-4" />;
      case 'edge functions': return <Settings className="h-4 w-4" />;
      default: return <Settings className="h-4 w-4" />;
    }
  };

  const getLaunchReadinessBadge = (readiness: string) => {
    switch (readiness) {
      case 'ready':
        return <Badge className="bg-green-100 text-green-800">🚀 Launch Ready</Badge>;
      case 'needs_attention':
        return <Badge className="bg-yellow-100 text-yellow-800">⚠️ Needs Attention</Badge>;
      case 'not_ready':
        return <Badge variant="destructive">❌ Not Ready</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <PlayCircle className="h-6 w-6" />
                ReubenAI Production Readiness Analysis
              </CardTitle>
              <CardDescription>
                Comprehensive analysis integrated with Reuben Orchestrator for maximum accuracy
              </CardDescription>
            </div>
            <Button 
              onClick={runComprehensiveAnalysis} 
              disabled={loading}
              size="lg"
              className="gap-2"
            >
              {loading ? <LoadingSpinner size="sm" /> : <PlayCircle className="h-4 w-4" />}
              {loading ? 'Analyzing...' : 'Run Full Analysis'}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {loading && (
        <Card>
          <CardContent className="py-8">
            <div className="text-center space-y-4">
              <LoadingSpinner size="lg" />
              <div>
                <h3 className="font-semibold">Running Comprehensive Analysis</h3>
                <p className="text-muted-foreground">
                  Testing authentication, database, APIs, performance, security, and more...
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {report && (
        <div className="space-y-6">
          {/* Overall Status */}
          <Card>
            <CardHeader>
              <CardTitle>Overall Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold">{report.overallScore}%</div>
                  <div className="text-sm text-muted-foreground">Overall Score</div>
                  <Progress value={report.overallScore} className="mt-2" />
                </div>
                <div className="text-center">
                  {getLaunchReadinessBadge(report.launchReadiness)}
                  <div className="text-sm text-muted-foreground mt-1">Launch Status</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-500">{report.criticalIssues}</div>
                  <div className="text-sm text-muted-foreground">Critical Issues</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold">{report.estimatedFixTime}</div>
                  <div className="text-sm text-muted-foreground">Est. Fix Time</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Gap Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Component Gap Analysis</CardTitle>
              <CardDescription>Detailed health check of all system components</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="critical">Critical Issues</TabsTrigger>
                  <TabsTrigger value="detailed">Detailed</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.values(report.gapAnalysis).map((component) => (
                      <Card key={component.component} className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {getComponentIcon(component.component)}
                            <span className="font-medium">{component.component}</span>
                          </div>
                          {getStatusIcon(component.status)}
                        </div>
                        <div className="space-y-2">
                          <Progress value={component.score} className="h-2" />
                          <div className="text-sm text-muted-foreground">
                            Score: {component.score}%
                          </div>
                          {component.issues.length > 0 && (
                            <div className="text-xs text-red-600">
                              {component.issues.length} issue(s) found
                            </div>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="critical" className="space-y-4">
                  {report.criticalIssues > 0 ? (
                    <div className="space-y-4">
                      {Object.values(report.gapAnalysis)
                        .filter(comp => comp.status === 'critical')
                        .map((component) => (
                          <Card key={component.component} className="border-red-200">
                            <CardHeader>
                              <CardTitle className="text-red-700 flex items-center gap-2">
                                <XCircle className="h-5 w-5" />
                                {component.component} - Critical Issues
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-3">
                                <div>
                                  <h4 className="font-semibold text-sm">Issues:</h4>
                                  <ul className="list-disc list-inside text-sm text-red-600 space-y-1">
                                    {component.issues.map((issue, i) => (
                                      <li key={i}>{issue}</li>
                                    ))}
                                  </ul>
                                </div>
                                <div>
                                  <h4 className="font-semibold text-sm">Recommendations:</h4>
                                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                                    {component.recommendations.map((rec, i) => (
                                      <li key={i}>{rec}</li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                    </div>
                  ) : (
                    <Card>
                      <CardContent className="py-8 text-center">
                        <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                        <h3 className="font-semibold text-green-700">No Critical Issues!</h3>
                        <p className="text-muted-foreground">All critical systems are functioning properly.</p>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="detailed" className="space-y-4">
                  {Object.values(report.gapAnalysis).map((component) => (
                    <Card key={component.component}>
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {getComponentIcon(component.component)}
                            {component.component}
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(component.status)}
                            <span className="font-normal text-sm">{component.score}%</span>
                          </div>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-semibold text-sm mb-2">Issues:</h4>
                            {component.issues.length > 0 ? (
                              <ul className="list-disc list-inside text-sm space-y-1">
                                {component.issues.map((issue, i) => (
                                  <li key={i} className="text-red-600">{issue}</li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-sm text-green-600">No issues found</p>
                            )}
                          </div>
                          <div>
                            <h4 className="font-semibold text-sm mb-2">Recommendations:</h4>
                            {component.recommendations.length > 0 ? (
                              <ul className="list-disc list-inside text-sm space-y-1">
                                {component.recommendations.map((rec, i) => (
                                  <li key={i} className="text-muted-foreground">{rec}</li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-sm text-muted-foreground">No recommendations at this time</p>
                            )}
                          </div>
                        </div>
                        <div className="mt-4 pt-4 border-t">
                          <p className="text-xs text-muted-foreground">
                            Last tested: {new Date(component.lastTested).toLocaleString()}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Next Steps */}
          <Card>
            <CardHeader>
              <CardTitle>Next Steps for Private Beta Launch</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {report.nextSteps.map((step, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                    <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold mt-0.5">
                      {i + 1}
                    </div>
                    <p className="text-sm">{step}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {lastRun && (
            <p className="text-center text-xs text-muted-foreground">
              Last comprehensive analysis: {lastRun.toLocaleString()}
            </p>
          )}
        </div>
      )}

      {!report && !loading && (
        <Card>
          <CardContent className="py-12 text-center">
            <PlayCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold mb-2">Ready for Comprehensive Analysis</h3>
            <p className="text-muted-foreground mb-4">
              Run a full production readiness check integrated with the Reuben Orchestrator for maximum accuracy.
            </p>
            <Button onClick={runComprehensiveAnalysis} size="lg">
              Start Analysis
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}