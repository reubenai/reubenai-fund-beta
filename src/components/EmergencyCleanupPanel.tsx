import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle, CheckCircle, Trash2, Search, BarChart3, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface CleanupResult {
  success: boolean;
  action?: string;
  table?: string;
  rows_before?: number;
  rows_after?: number;
  duplicates_removed?: number;
  cleanup_timestamp?: string;
  result?: any;
}

interface DuplicateInfo {
  deal_id: string;
  engine_name?: string;
  artifact_type?: string;
  artifact_kind?: string;
  count: number;
  company_name: string;
}

interface SystemStatus {
  total_sources: number;
  total_artifacts: number;
  recent_duplicates: {
    sources_duplicates: DuplicateInfo[];
    artifacts_duplicates: DuplicateInfo[];
  };
  prevention_active: boolean;
  last_check: string;
}

export const EmergencyCleanupPanel: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<CleanupResult[]>([]);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [duplicateCheck, setDuplicateCheck] = useState<any>(null);

  const executeCleanupAction = async (action: string) => {
    setLoading(true);
    try {
      console.log(`🧹 Executing cleanup action: ${action}`);
      
      const { data, error } = await supabase.functions.invoke('emergency-cleanup-service', {
        body: { action }
      });

      if (error) throw error;

      if (data?.success) {
        setResults(prev => [data, ...prev]);
        toast.success(`✅ ${action} completed successfully`);
        
        // Refresh status after cleanup
        if (action.includes('cleanup')) {
          await getSystemStatus();
        }
      } else {
        throw new Error(data?.error || 'Action failed');
      }
    } catch (error) {
      console.error(`❌ Cleanup action ${action} failed:`, error);
      toast.error(`❌ ${action} failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getSystemStatus = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('emergency-cleanup-service', {
        body: { action: 'get_status' }
      });

      if (error) throw error;

      if (data?.success) {
        setSystemStatus(data.result);
      }
    } catch (error) {
      console.error('❌ Failed to get system status:', error);
      toast.error('Failed to load system status');
    }
  };

  const detectDuplicates = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('emergency-cleanup-service', {
        body: { action: 'detect_duplicates' }
      });

      if (error) throw error;

      if (data?.success) {
        setDuplicateCheck(data.result);
        toast.success('✅ Duplicate detection completed');
      }
    } catch (error) {
      console.error('❌ Duplicate detection failed:', error);
      toast.error('Duplicate detection failed');
    }
  };

  React.useEffect(() => {
    getSystemStatus();
  }, []);

  const hasCriticalDuplicates = duplicateCheck && (
    (duplicateCheck.sources_duplicates && duplicateCheck.sources_duplicates.length > 0) ||
    (duplicateCheck.artifacts_duplicates && duplicateCheck.artifacts_duplicates.length > 0)
  );

  return (
    <div className="space-y-6">
      <Card className="border-destructive/20 bg-destructive/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Emergency Data Cleanup & Prevention
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Data Flooding Detected:</strong> Critical duplication in deal_analysis_sources and artifacts tables. 
              This cleanup system removes duplicates and prevents future flooding.
            </AlertDescription>
          </Alert>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button
              variant="destructive"
              size="sm"
              onClick={() => executeCleanupAction('cleanup_sources')}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Clean Sources
            </Button>
            
            <Button
              variant="destructive"
              size="sm"
              onClick={() => executeCleanupAction('cleanup_artifacts')}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Clean Artifacts
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={detectDuplicates}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <Search className="h-4 w-4" />
              Detect Duplicates
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={getSystemStatus}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh Status
            </Button>
          </div>

          {loading && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <RefreshCw className="h-4 w-4 animate-spin" />
              Processing cleanup operation...
            </div>
          )}
        </CardContent>
      </Card>

      {/* System Status */}
      {systemStatus && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-primary">{systemStatus.total_sources.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Analysis Sources</div>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-primary">{systemStatus.total_artifacts.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Artifacts</div>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-center gap-1">
                  {systemStatus.prevention_active ? (
                    <Badge variant="default" className="bg-success text-success-foreground">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Prevention Active
                    </Badge>
                  ) : (
                    <Badge variant="destructive">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Prevention Inactive
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            
            <div className="text-xs text-muted-foreground text-center">
              Last checked: {new Date(systemStatus.last_check).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Duplicate Detection Results */}
      {duplicateCheck && (
        <Card className={hasCriticalDuplicates ? "border-destructive/20" : "border-success/20"}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Recent Duplicate Detection
              {hasCriticalDuplicates ? (
                <Badge variant="destructive">Issues Found</Badge>
              ) : (
                <Badge variant="default" className="bg-success text-success-foreground">Clean</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {duplicateCheck.sources_duplicates && duplicateCheck.sources_duplicates.length > 0 && (
              <div>
                <h4 className="font-medium text-destructive mb-2">Analysis Sources Duplicates:</h4>
                <div className="space-y-2">
                  {duplicateCheck.sources_duplicates.slice(0, 5).map((duplicate: DuplicateInfo, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-destructive/10 rounded">
                      <span className="text-sm">
                        <strong>{duplicate.company_name || 'Unknown'}</strong> - {duplicate.engine_name}
                      </span>
                      <Badge variant="destructive">{duplicate.count} duplicates</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {duplicateCheck.artifacts_duplicates && duplicateCheck.artifacts_duplicates.length > 0 && (
              <div>
                <h4 className="font-medium text-destructive mb-2">Artifacts Duplicates:</h4>
                <div className="space-y-2">
                  {duplicateCheck.artifacts_duplicates.slice(0, 5).map((duplicate: DuplicateInfo, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-destructive/10 rounded">
                      <span className="text-sm">
                        <strong>{duplicate.company_name || 'Unknown'}</strong> - {duplicate.artifact_type}
                      </span>
                      <Badge variant="destructive">{duplicate.count} duplicates</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!hasCriticalDuplicates && (
              <div className="text-center p-4 text-success">
                <CheckCircle className="h-8 w-8 mx-auto mb-2" />
                <p className="font-medium">No Recent Duplicates Detected</p>
                <p className="text-sm text-muted-foreground">System is operating cleanly</p>
              </div>
            )}

            <div className="text-xs text-muted-foreground text-center">
              Check performed: {new Date(duplicateCheck.check_timestamp).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cleanup Results */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Cleanup Operations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {results.slice(0, 10).map((result, idx) => (
                <div key={idx} className="p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium capitalize">
                      {result.action?.replace('_', ' ') || 'Cleanup Operation'}
                    </span>
                    <Badge variant={result.success ? "default" : "destructive"}>
                      {result.success ? "Success" : "Failed"}
                    </Badge>
                  </div>
                  {result.table && (
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div>Before: <strong>{result.rows_before?.toLocaleString()}</strong></div>
                      <div>After: <strong>{result.rows_after?.toLocaleString()}</strong></div>
                      <div>Removed: <strong className="text-destructive">{result.duplicates_removed?.toLocaleString()}</strong></div>
                    </div>
                  )}
                  {result.cleanup_timestamp && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {new Date(result.cleanup_timestamp).toLocaleString()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};