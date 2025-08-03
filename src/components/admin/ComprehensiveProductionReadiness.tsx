import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoadingSpinner } from '@/components/ui/loading-states';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  FileText,
  BookOpen,
  Download,
  Calendar,
  Target,
  TrendingUp,
  Activity
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

  const generatePDFReport = () => {
    if (!report) return;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>ReubenAI Production Readiness Report - ${new Date().toLocaleDateString()}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
            .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
            .logo { font-size: 24px; font-weight: bold; color: #0066cc; }
            .section { margin-bottom: 30px; page-break-inside: avoid; }
            .component { border: 1px solid #ddd; padding: 15px; margin: 10px 0; border-radius: 8px; }
            .healthy { border-left: 4px solid #22c55e; background: #f0fdf4; }
            .warning { border-left: 4px solid #eab308; background: #fffbeb; }
            .critical { border-left: 4px solid #ef4444; background: #fef2f2; }
            .toc { background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
            .toc a { text-decoration: none; color: #0066cc; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">🤖 ReubenAI</div>
            <h1>Production Readiness Analysis Report</h1>
            <p>Generated on ${new Date().toLocaleString()}</p>
            <p>Overall Score: ${report.overallScore}% | Status: ${report.launchReadiness.toUpperCase()}</p>
          </div>
          
          <div class="toc">
            <h2>📋 Table of Contents</h2>
            <ol>
              <li><a href="#executive-summary">Executive Summary</a></li>
              <li><a href="#overall-metrics">Overall Metrics</a></li>
              <li><a href="#component-analysis">Component Analysis</a></li>
              <li><a href="#critical-issues">Critical Issues</a></li>
              <li><a href="#recommendations">Recommendations</a></li>
              <li><a href="#next-steps">Next Steps</a></li>
            </ol>
          </div>
          
          <div class="section" id="executive-summary">
            <h2>📊 Executive Summary</h2>
            <p><strong>Launch Readiness:</strong> ${report.launchReadiness.toUpperCase()}</p>
            <p><strong>Overall Score:</strong> ${report.overallScore}%</p>
            <p><strong>Critical Issues:</strong> ${report.criticalIssues}</p>
            <p><strong>Estimated Fix Time:</strong> ${report.estimatedFixTime}</p>
          </div>
          
          <div class="section" id="component-analysis">
            <h2>🔧 Component Analysis</h2>
            ${Object.values(report.gapAnalysis).map(component => `
              <div class="component ${component.status}">
                <h3>${component.component} - ${component.score}%</h3>
                <p><strong>Status:</strong> ${component.status.toUpperCase()}</p>
                ${component.issues.length > 0 ? `
                  <p><strong>Issues:</strong></p>
                  <ul>${component.issues.map(issue => `<li>${issue}</li>`).join('')}</ul>
                ` : '<p>✅ No issues found</p>'}
                ${component.recommendations.length > 0 ? `
                  <p><strong>Recommendations:</strong></p>
                  <ul>${component.recommendations.map(rec => `<li>${rec}</li>`).join('')}</ul>
                ` : ''}
              </div>
            `).join('')}
          </div>
          
          <div class="section" id="next-steps">
            <h2>🚀 Next Steps for Launch</h2>
            <ol>
              ${report.nextSteps.map(step => `<li>${step}</li>`).join('')}
            </ol>
          </div>
          
          <div style="text-align: center; margin-top: 50px; padding-top: 20px; border-top: 1px solid #ddd;">
            <p><em>Generated by ReubenAI Production Readiness Orchestrator</em></p>
          </div>
        </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <div className="space-y-6 max-w-none">
      {/* Enhanced Header with Reuben Branding */}
      <Card className="bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="bg-primary text-primary-foreground rounded-lg p-2">
                  <Activity className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    🤖 ReubenAI Production Readiness Analysis
                  </CardTitle>
                  <CardDescription className="text-base">
                    Comprehensive pre-launch validation powered by Reuben Orchestrator
                  </CardDescription>
                </div>
              </div>
              {lastRun && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  Last analysis: {lastRun.toLocaleString()}
                </div>
              )}
            </div>
            <div className="flex gap-2">
              {report && (
                <Button 
                  onClick={generatePDFReport}
                  variant="outline"
                  size="lg"
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  Export Report
                </Button>
              )}
              <Button 
                onClick={runComprehensiveAnalysis} 
                disabled={loading}
                size="lg"
                className="gap-2"
              >
                {loading ? <LoadingSpinner size="sm" /> : <TrendingUp className="h-4 w-4" />}
                {loading ? 'Analyzing...' : 'Run Analysis'}
              </Button>
            </div>
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
          {/* Table of Contents */}
          <Card className="bg-accent/5 border-accent/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                📋 Report Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">📊 Executive Summary</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Overall Score: {report.overallScore}%</li>
                    <li>• Launch Status</li>
                    <li>• Critical Issues Count</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">🔧 Component Analysis</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• System Health Overview</li>
                    <li>• Critical Issues Details</li>
                    <li>• Component Scores</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">⚠️ Issues & Risks</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Critical Blockers</li>
                    <li>• Warning Areas</li>
                    <li>• Risk Assessment</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">🚀 Launch Roadmap</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Immediate Actions</li>
                    <li>• Recommendations</li>
                    <li>• Timeline Estimate</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Executive Summary - Overall Status */}
          <Card className="border-l-4 border-l-primary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                📊 Executive Summary
              </CardTitle>
              <CardDescription>High-level production readiness metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="text-center p-4 bg-primary/5 rounded-lg">
                  <div className="text-4xl font-bold text-primary mb-2">{report.overallScore}%</div>
                  <div className="text-sm font-medium">Overall Score</div>
                  <Progress value={report.overallScore} className="mt-3 h-2" />
                  <div className="text-xs text-muted-foreground mt-1">
                    {report.overallScore >= 90 ? 'Excellent' : 
                     report.overallScore >= 75 ? 'Good' : 
                     report.overallScore >= 60 ? 'Fair' : 'Needs Work'}
                  </div>
                </div>
                <div className="text-center p-4 bg-accent/5 rounded-lg">
                  {getLaunchReadinessBadge(report.launchReadiness)}
                  <div className="text-sm font-medium mt-3">Launch Readiness</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Current production status
                  </div>
                </div>
                <div className="text-center p-4 bg-destructive/5 rounded-lg">
                  <div className="text-3xl font-bold text-destructive mb-2">{report.criticalIssues}</div>
                  <div className="text-sm font-medium">Critical Issues</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {report.criticalIssues === 0 ? 'All clear!' : 'Requires attention'}
                  </div>
                </div>
                <div className="text-center p-4 bg-secondary/5 rounded-lg">
                  <div className="text-2xl font-bold text-secondary-foreground mb-2">{report.estimatedFixTime}</div>
                  <div className="text-sm font-medium">Est. Fix Time</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Until launch ready
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Comprehensive Gap Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5" />
                🔧 Component Gap Analysis
              </CardTitle>
              <CardDescription>
                Detailed health assessment of all ReubenAI system components
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="overview">System Overview</TabsTrigger>
                  <TabsTrigger value="critical">🚨 Critical Issues</TabsTrigger>
                  <TabsTrigger value="detailed">📋 Detailed Analysis</TabsTrigger>
                  <TabsTrigger value="recommendations">💡 Recommendations</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                  {/* Component Health Matrix */}
                  <div className="bg-muted/30 p-4 rounded-lg">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Activity className="h-4 w-4" />
                      System Health Matrix
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
                      {Object.values(report.gapAnalysis).map((component) => (
                        <Card key={component.component} className={`p-3 transition-all hover:shadow-md ${
                          component.status === 'healthy' ? 'border-green-200 bg-green-50' :
                          component.status === 'warning' ? 'border-yellow-200 bg-yellow-50' :
                          component.status === 'critical' ? 'border-red-200 bg-red-50' : 'border-gray-200'
                        }`}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {getComponentIcon(component.component)}
                              <span className="font-medium text-sm">{component.component}</span>
                            </div>
                            {getStatusIcon(component.status)}
                          </div>
                          <div className="space-y-2">
                            <Progress value={component.score} className="h-2" />
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-muted-foreground">Score</span>
                              <span className="text-sm font-semibold">{component.score}%</span>
                            </div>
                            {component.issues.length > 0 && (
                              <div className="text-xs text-red-600 flex items-center gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                {component.issues.length} issue(s)
                              </div>
                            )}
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>

                  {/* Performance Metrics Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="p-4 border-green-200 bg-green-50">
                      <div className="text-center">
                        <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-green-700">
                          {Object.values(report.gapAnalysis).filter(c => c.status === 'healthy').length}
                        </div>
                        <div className="text-sm text-green-600">Healthy Components</div>
                      </div>
                    </Card>
                    <Card className="p-4 border-yellow-200 bg-yellow-50">
                      <div className="text-center">
                        <AlertTriangle className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-yellow-700">
                          {Object.values(report.gapAnalysis).filter(c => c.status === 'warning').length}
                        </div>
                        <div className="text-sm text-yellow-600">Warning Components</div>
                      </div>
                    </Card>
                    <Card className="p-4 border-red-200 bg-red-50">
                      <div className="text-center">
                        <XCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-red-700">
                          {Object.values(report.gapAnalysis).filter(c => c.status === 'critical').length}
                        </div>
                        <div className="text-sm text-red-600">Critical Components</div>
                      </div>
                    </Card>
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
                  <ScrollArea className="h-[600px] w-full">
                    <div className="space-y-4 pr-4">
                      {Object.values(report.gapAnalysis).map((component) => (
                        <Card key={component.component} className="overflow-hidden">
                          <CardHeader className={`${
                            component.status === 'healthy' ? 'bg-green-50 border-b-green-200' :
                            component.status === 'warning' ? 'bg-yellow-50 border-b-yellow-200' :
                            component.status === 'critical' ? 'bg-red-50 border-b-red-200' : 'bg-gray-50'
                          } border-b`}>
                            <CardTitle className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${
                                  component.status === 'healthy' ? 'bg-green-100' :
                                  component.status === 'warning' ? 'bg-yellow-100' :
                                  component.status === 'critical' ? 'bg-red-100' : 'bg-gray-100'
                                }`}>
                                  {getComponentIcon(component.component)}
                                </div>
                                <div>
                                  <h3 className="font-semibold">{component.component}</h3>
                                  <p className="text-sm text-muted-foreground font-normal">
                                    Last tested: {new Date(component.lastTested).toLocaleString()}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="text-right">
                                  <div className="text-2xl font-bold">{component.score}%</div>
                                  <Progress value={component.score} className="w-20 h-2" />
                                </div>
                                {getStatusIcon(component.status)}
                              </div>
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="pt-4">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                              <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                  <XCircle className="h-4 w-4 text-red-500" />
                                  <h4 className="font-semibold text-sm">Issues Identified</h4>
                                </div>
                                {component.issues.length > 0 ? (
                                  <div className="space-y-2">
                                    {component.issues.map((issue, i) => (
                                      <div key={i} className="flex items-start gap-2 p-2 bg-red-50 rounded-md border-l-2 border-red-200">
                                        <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                                        <span className="text-sm text-red-700">{issue}</span>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2 p-3 bg-green-50 rounded-md border-l-2 border-green-200">
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                    <span className="text-sm text-green-700">No issues detected</span>
                                  </div>
                                )}
                              </div>
                              <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                  <Target className="h-4 w-4 text-blue-500" />
                                  <h4 className="font-semibold text-sm">Recommendations</h4>
                                </div>
                                {component.recommendations.length > 0 ? (
                                  <div className="space-y-2">
                                    {component.recommendations.map((rec, i) => (
                                      <div key={i} className="flex items-start gap-2 p-2 bg-blue-50 rounded-md border-l-2 border-blue-200">
                                        <TrendingUp className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                                        <span className="text-sm text-blue-700">{rec}</span>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-md border-l-2 border-gray-200">
                                    <CheckCircle className="h-4 w-4 text-gray-500" />
                                    <span className="text-sm text-gray-600">No specific recommendations</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="recommendations" className="space-y-4">
                  <div className="grid gap-4">
                    {Object.values(report.gapAnalysis)
                      .filter(component => component.recommendations.length > 0)
                      .map((component) => (
                        <Card key={component.component} className="border-blue-200 bg-blue-50/30">
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-blue-700">
                              {getComponentIcon(component.component)}
                              {component.component} Optimization
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              {component.recommendations.map((rec, i) => (
                                <div key={i} className="flex items-start gap-3 p-3 bg-white rounded-md border border-blue-100">
                                  <div className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold mt-0.5">
                                    {i + 1}
                                  </div>
                                  <span className="text-sm text-blue-800">{rec}</span>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Launch Roadmap */}
          <Card className="border-l-4 border-l-green-500 bg-gradient-to-r from-green-50 to-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700">
                <Target className="h-5 w-5" />
                🚀 Launch Roadmap & Next Steps
              </CardTitle>
              <CardDescription>
                Prioritized action items for successful private beta launch
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-white/70 p-4 rounded-lg border border-green-200">
                  <h4 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Immediate Actions (Next 1-2 Days)
                  </h4>
                  <div className="space-y-3">
                    {report.nextSteps.slice(0, 3).map((step, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 bg-white rounded-md border border-green-100 shadow-sm">
                        <div className="bg-green-500 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold mt-0.5">
                          {i + 1}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-green-800">{step}</p>
                          <div className="text-xs text-green-600 mt-1">
                            Priority: {i === 0 ? 'Critical' : i === 1 ? 'High' : 'Medium'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {report.nextSteps.length > 3 && (
                  <div className="bg-white/70 p-4 rounded-lg border border-blue-200">
                    <h4 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Post-Launch Optimizations
                    </h4>
                    <div className="space-y-3">
                      {report.nextSteps.slice(3).map((step, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 bg-white rounded-md border border-blue-100 shadow-sm">
                          <div className="bg-blue-500 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold mt-0.5">
                            {i + 4}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-blue-800">{step}</p>
                            <div className="text-xs text-blue-600 mt-1">
                              Timeline: Post-launch enhancement
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Separator />
                
                <div className="bg-gradient-to-r from-primary/10 to-accent/10 p-4 rounded-lg border">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="bg-primary text-primary-foreground p-2 rounded-lg">
                      <Activity className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold">🤖 ReubenAI Launch Status</h4>
                      <p className="text-sm text-muted-foreground">
                        Estimated time to private beta: <strong>{report.estimatedFixTime}</strong>
                      </p>
                    </div>
                  </div>
                </div>
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
        <Card className="bg-gradient-to-br from-primary/5 via-accent/5 to-secondary/5 border-dashed border-2 border-primary/20">
          <CardContent className="py-16 text-center">
            <div className="space-y-6">
              <div className="relative">
                <div className="bg-primary/10 p-4 rounded-full w-20 h-20 mx-auto flex items-center justify-center">
                  <Activity className="h-10 w-10 text-primary" />
                </div>
                <div className="absolute -top-1 -right-1 bg-accent text-accent-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                  🤖
                </div>
              </div>
              <div className="space-y-3">
                <h3 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Ready for ReubenAI Production Analysis
                </h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Launch our comprehensive pre-production validation system powered by the Reuben Orchestrator 
                  for maximum accuracy and detailed insights.
                </p>
              </div>
              <div className="space-y-3">
                <Button onClick={runComprehensiveAnalysis} size="lg" className="gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Launch Full Analysis
                </Button>
                <p className="text-xs text-muted-foreground">
                  ⚡ Analysis typically completes in 30-60 seconds
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}