import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, TrendingUp, Building2, Target, Activity } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface CrossOrgAnalytics {
  organization_id: string;
  organization_name: string;
  fund_count: number;
  total_deals: number;
  active_deals: number;
  completed_analyses: number;
  failed_analyses: number;
  queue_success_rate: number | null;
  last_activity: string | null;
  health_status: 'healthy' | 'no_funds' | 'no_deals' | 'high_failures';
}

export function CrossOrgAnalytics() {
  const [analytics, setAnalytics] = useState<CrossOrgAnalytics[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: analyticsError } = await supabase
        .rpc('get_cross_org_analytics');

      if (analyticsError) {
        setError(analyticsError.message);
        return;
      }

      setAnalytics((data || []) as CrossOrgAnalytics[]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  const getHealthStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy':
        return <Badge className="bg-green-100 text-green-800">Healthy</Badge>;
      case 'no_funds':
        return <Badge className="bg-amber-100 text-amber-800">No Funds</Badge>;
      case 'no_deals':
        return <Badge className="bg-blue-100 text-blue-800">No Deals</Badge>;
      case 'high_failures':
        return <Badge variant="destructive">High Failures</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getHealthIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <Activity className="h-4 w-4 text-green-500" />;
      case 'no_funds':
        return <Building2 className="h-4 w-4 text-amber-500" />;
      case 'no_deals':
        return <Target className="h-4 w-4 text-blue-500" />;
      case 'high_failures':
        return <TrendingUp className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const totalOrgs = analytics.length;
  const healthyOrgs = analytics.filter(a => a.health_status === 'healthy').length;
  const totalFunds = analytics.reduce((sum, a) => sum + a.fund_count, 0);
  const totalDeals = analytics.reduce((sum, a) => sum + a.total_deals, 0);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          <CardTitle className="text-lg font-medium">Cross-Organization Analytics</CardTitle>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={loadAnalytics}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {analytics.length > 0 && (
          <>
            {/* Platform Overview */}
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-md">
                <div className="text-2xl font-bold text-blue-700">{totalOrgs}</div>
                <div className="text-sm text-blue-600">Organizations</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-md">
                <div className="text-2xl font-bold text-green-700">{healthyOrgs}</div>
                <div className="text-sm text-green-600">Healthy Orgs</div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-md">
                <div className="text-2xl font-bold text-purple-700">{totalFunds}</div>
                <div className="text-sm text-purple-600">Total Funds</div>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-md">
                <div className="text-2xl font-bold text-orange-700">{totalDeals}</div>
                <div className="text-sm text-orange-600">Total Deals</div>
              </div>
            </div>

            {/* Organization Details */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-muted-foreground">Organization Breakdown</h4>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {analytics.map((org, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-md">
                    <div className="flex items-center gap-3">
                      {getHealthIcon(org.health_status)}
                      <div>
                        <p className="font-medium text-sm">{org.organization_name}</p>
                        <div className="text-xs text-muted-foreground space-x-4">
                          <span>Funds: {org.fund_count}</span>
                          <span>Deals: {org.total_deals}</span>
                          <span>Active: {org.active_deals}</span>
                          {org.queue_success_rate !== null && (
                            <span>Success: {org.queue_success_rate}%</span>
                          )}
                        </div>
                        {org.last_activity && (
                          <div className="text-xs text-muted-foreground">
                            Last activity: {new Date(org.last_activity).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getHealthStatusBadge(org.health_status)}
                      <div className="text-right text-xs text-muted-foreground">
                        <div>Analysis: {org.completed_analyses + org.failed_analyses}</div>
                        {org.failed_analyses > 0 && (
                          <div className="text-red-600">Failed: {org.failed_analyses}</div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-xs text-muted-foreground">
              Last updated: {new Date().toLocaleString()}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}