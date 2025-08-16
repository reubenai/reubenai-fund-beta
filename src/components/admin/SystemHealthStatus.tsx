import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, CheckCircle, XCircle, AlertTriangle, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface HealthCheck {
  component: string;
  status: 'healthy' | 'warning' | 'critical';
  message: string;
  last_checked: string;
  response_time_ms?: number;
}

interface SystemHealth {
  overall_status: 'healthy' | 'warning' | 'critical';
  checks: HealthCheck[];
  last_updated: string;
}

export function SystemHealthStatus() {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runHealthCheck = async () => {
    try {
      setLoading(true);
      setError(null);

      // Run multiple health checks
      const checks: HealthCheck[] = [];
      let overallStatus: 'healthy' | 'warning' | 'critical' = 'healthy';

      // 1. Database Connection Health
      const dbStart = Date.now();
      try {
        const { error: dbError } = await supabase
          .from('funds')
          .select('id')
          .limit(1);
        
        const dbResponseTime = Date.now() - dbStart;
        
        if (dbError) {
          checks.push({
            component: 'Database',
            status: 'critical',
            message: `Connection failed: ${dbError.message}`,
            last_checked: new Date().toISOString(),
            response_time_ms: dbResponseTime
          });
          overallStatus = 'critical';
        } else {
          const dbStatus = dbResponseTime > 1000 ? 'warning' : 'healthy';
          checks.push({
            component: 'Database',
            status: dbStatus,
            message: dbStatus === 'warning' ? 'Slow response time' : 'Connection healthy',
            last_checked: new Date().toISOString(),
            response_time_ms: dbResponseTime
          });
          
          if (dbStatus === 'warning' && overallStatus === 'healthy') {
            overallStatus = 'warning';
          }
        }
      } catch (err: any) {
        checks.push({
          component: 'Database',
          status: 'critical',
          message: `Connection error: ${err.message}`,
          last_checked: new Date().toISOString()
        });
        overallStatus = 'critical';
      }

      // 2. Authentication Health (Simple check)
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError) {
          checks.push({
            component: 'Authentication',
            status: 'warning',
            message: `Auth check failed: ${authError.message}`,
            last_checked: new Date().toISOString()
          });
          if (overallStatus === 'healthy') {
            overallStatus = 'warning';
          }
        } else if (user) {
          checks.push({
            component: 'Authentication',
            status: 'healthy',
            message: 'User authentication working',
            last_checked: new Date().toISOString()
          });
        } else {
          checks.push({
            component: 'Authentication',
            status: 'warning',
            message: 'No user authenticated',
            last_checked: new Date().toISOString()
          });
          if (overallStatus === 'healthy') {
            overallStatus = 'warning';
          }
        }
      } catch (err: any) {
        checks.push({
          component: 'Authentication',
          status: 'warning',
          message: `Auth system check failed: ${err.message}`,
          last_checked: new Date().toISOString()
        });
        if (overallStatus === 'healthy') {
          overallStatus = 'warning';
        }
      }

      // 3. Analysis Queue Health
      try {
        const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
        const oneHourAgo = new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString();
        
        const { data: queueData, error: queueError } = await supabase
          .from('analysis_queue')
          .select('status, created_at')
          .limit(100);

        if (queueError) {
          checks.push({
            component: 'Analysis Queue',
            status: 'warning',
            message: `Queue check failed: ${queueError.message}`,
            last_checked: new Date().toISOString()
          });
          if (overallStatus === 'healthy') {
            overallStatus = 'warning';
          }
        } else {
          const processingCount = queueData?.filter(q => q.status === 'processing').length || 0;
          const failedCount = queueData?.filter(q => q.status === 'failed').length || 0;
          const queuedCount = queueData?.filter(q => q.status === 'queued').length || 0;
          
          // Check for stuck items
          const stuckProcessing = queueData?.filter(q => 
            q.status === 'processing' && 
            new Date(q.created_at) < new Date(oneHourAgo)
          ).length || 0;
          
          const stuckQueued = queueData?.filter(q => 
            q.status === 'queued' && 
            new Date(q.created_at) < new Date(twoHoursAgo)
          ).length || 0;
          
          let queueStatus: 'healthy' | 'warning' | 'critical' = 'healthy';
          let message = 'Queue operational';
          
          if (stuckProcessing > 0 || stuckQueued > 0) {
            queueStatus = 'critical';
            message = `${stuckProcessing + stuckQueued} stuck items detected`;
            overallStatus = 'critical';
          } else if (failedCount > 5) {
            queueStatus = 'critical';
            message = `${failedCount} failed jobs detected`;
            overallStatus = 'critical';
          } else if (processingCount > 25 || queuedCount > 50) {
            queueStatus = 'warning';
            message = `High queue load: ${processingCount} processing, ${queuedCount} queued`;
            if (overallStatus === 'healthy') {
              overallStatus = 'warning';
            }
          } else if (queuedCount > 0 || processingCount > 0) {
            message = `${queuedCount} queued, ${processingCount} processing`;
          }
          
          checks.push({
            component: 'Analysis Queue',
            status: queueStatus,
            message,
            last_checked: new Date().toISOString()
          });
        }
      } catch (err: any) {
        checks.push({
          component: 'Analysis Queue',
          status: 'warning',
          message: `Queue monitoring unavailable: ${err.message}`,
          last_checked: new Date().toISOString()
        });
        if (overallStatus === 'healthy') {
          overallStatus = 'warning';
        }
      }

      setHealth({
        overall_status: overallStatus,
        checks,
        last_updated: new Date().toISOString()
      });

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runHealthCheck();
    // Run health check every 30 seconds
    const interval = setInterval(runHealthCheck, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case 'critical':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy':
        return <Badge className="bg-green-100 text-green-800">Healthy</Badge>;
      case 'warning':
        return <Badge className="bg-amber-100 text-amber-800">Warning</Badge>;
      case 'critical':
        return <Badge variant="destructive">Critical</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-medium">System Health</CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={runHealthCheck}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Check
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
            <XCircle className="h-4 w-4 text-red-500" />
            <span className="text-sm text-red-700">{error}</span>
          </div>
        )}

        {health && (
          <>
            {/* Overall Status */}
            <div className="flex items-center justify-between p-3 bg-muted rounded-md">
              <div className="flex items-center gap-2">
                {getStatusIcon(health.overall_status)}
                <span className="font-medium">Overall System Status</span>
              </div>
              {getStatusBadge(health.overall_status)}
            </div>

            {/* Individual Component Checks */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-muted-foreground">Component Status</h4>
              {health.checks.map((check, index) => (
                <div key={index} className="flex items-center justify-between p-2 border rounded-md">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(check.status)}
                    <div>
                      <p className="font-medium text-sm">{check.component}</p>
                      <p className="text-xs text-muted-foreground">{check.message}</p>
                      {check.response_time_ms && (
                        <p className="text-xs text-muted-foreground">
                          Response: {check.response_time_ms}ms
                        </p>
                      )}
                    </div>
                  </div>
                  {getStatusBadge(check.status)}
                </div>
              ))}
            </div>

            <div className="text-xs text-muted-foreground">
              Last updated: {new Date(health.last_updated).toLocaleString()}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}