import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertTriangle, CheckCircle, XCircle, Shield, Database } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface TenantAuditResult {
  table_name: string;
  total_rows: number;
  null_org_id_count: number;
  invalid_org_id_count: number;
  valid_org_id_count: number;
  organization_list: string[];
  issues_found: boolean;
  severity: 'healthy' | 'warning' | 'critical';
}

export function TenantIsolationAudit() {
  const [auditResults, setAuditResults] = useState<TenantAuditResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runAudit = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: auditError } = await supabase
        .rpc('audit_tenant_isolation');

      if (auditError) {
        setError(auditError.message);
        return;
      }

      setAuditResults((data || []) as TenantAuditResult[]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runAudit();
  }, []);

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case 'critical':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Database className="h-4 w-4 text-gray-500" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
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

  const criticalIssues = auditResults.filter(r => r.severity === 'critical').length;
  const warningIssues = auditResults.filter(r => r.severity === 'warning').length;
  const healthyTables = auditResults.filter(r => r.severity === 'healthy').length;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          <CardTitle className="text-lg font-medium">Tenant Isolation Audit</CardTitle>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={runAudit}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Run Audit
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {auditResults.length > 0 && (
          <>
            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-green-50 rounded-md">
                <div className="text-2xl font-bold text-green-700">{healthyTables}</div>
                <div className="text-sm text-green-600">Healthy Tables</div>
              </div>
              <div className="text-center p-3 bg-amber-50 rounded-md">
                <div className="text-2xl font-bold text-amber-700">{warningIssues}</div>
                <div className="text-sm text-amber-600">Warning Issues</div>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-md">
                <div className="text-2xl font-bold text-red-700">{criticalIssues}</div>
                <div className="text-sm text-red-600">Critical Issues</div>
              </div>
            </div>

            {/* Critical Issues Alert */}
            {criticalIssues > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {criticalIssues} table(s) have critical tenant isolation issues that must be fixed before deal ingestion.
                </AlertDescription>
              </Alert>
            )}

            {/* Detailed Results */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-muted-foreground">Table Audit Results</h4>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {auditResults.map((result, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-md">
                    <div className="flex items-center gap-3">
                      {getSeverityIcon(result.severity)}
                      <div>
                        <p className="font-medium text-sm">{result.table_name}</p>
                        <div className="text-xs text-muted-foreground space-x-4">
                          <span>Total: {result.total_rows}</span>
                          <span>Valid: {result.valid_org_id_count}</span>
                          {result.null_org_id_count > 0 && (
                            <span className="text-red-600">NULL: {result.null_org_id_count}</span>
                          )}
                          {result.invalid_org_id_count > 0 && (
                            <span className="text-amber-600">Invalid: {result.invalid_org_id_count}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getSeverityBadge(result.severity)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-xs text-muted-foreground">
              Last audit: {new Date().toLocaleString()}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}