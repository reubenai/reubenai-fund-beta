import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Shield, Play, Pause, AlertTriangle, CheckCircle, Clock, Activity } from 'lucide-react';

interface SafeModeConfig {
  ANALYSIS_SAFE_MODE: string;
  ANALYSIS_INTAKE: string;
  REANALYSIS_AUTOTRIGGERS: string;
  MAX_CONCURRENCY: string;
}

interface ProcessingDetail {
  deal_id: string;
  queue_id: string;
  trace_id: string;
  start_time: string;
  end_time?: string;
  processing_time_ms?: number;
  success: boolean;
  error?: string;
  analysis_data?: any;
  safe_mode: boolean;
}

export function SafeModeTestPanel() {
  const [config, setConfig] = useState<SafeModeConfig | null>(null);
  const [allowlistedDeals, setAllowlistedDeals] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResults, setLastResults] = useState<any>(null);
  const [queueStats, setQueueStats] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadConfiguration();
    loadAllowlistedDeals();
    loadQueueStats();
  }, []);

  const loadConfiguration = async () => {
    try {
      const { data, error } = await supabase
        .from('analysis_environment_config')
        .select('config_key, config_value')
        .eq('enabled', true);

      if (error) throw error;

      const configMap: SafeModeConfig = {
        ANALYSIS_SAFE_MODE: '',
        ANALYSIS_INTAKE: '',
        REANALYSIS_AUTOTRIGGERS: '',
        MAX_CONCURRENCY: ''
      };
      
      data?.forEach(c => {
        if (c.config_key in configMap) {
          (configMap as any)[c.config_key] = c.config_value;
        }
      });

      setConfig(configMap);
    } catch (error) {
      console.error('Error loading config:', error);
      toast({
        title: "Configuration Error",
        description: "Could not load safe mode configuration",
        variant: "destructive"
      });
    }
  };

  const loadAllowlistedDeals = async () => {
    try {
      const { data, error } = await supabase
        .from('analysis_allowlist')
        .select(`
          deal_id,
          test_phase,
          notes,
          created_at,
          deals:deal_id(
            company_name,
            industry,
            fund_id,
            funds:fund_id(name, fund_type)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAllowlistedDeals(data || []);
    } catch (error) {
      console.error('Error loading allowlisted deals:', error);
    }
  };

  const loadQueueStats = async () => {
    try {
      const { data, error } = await supabase
        .from('analysis_queue')
        .select('status, deal_id, created_at, attempts')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      const stats = {
        total: data?.length || 0,
        queued: data?.filter(item => item.status === 'queued').length || 0,
        processing: data?.filter(item => item.status === 'processing').length || 0,
        completed: data?.filter(item => item.status === 'completed').length || 0,
        failed: data?.filter(item => item.status === 'failed').length || 0,
        paused: data?.filter(item => item.status === 'paused').length || 0,
        allowlisted_in_queue: data?.filter(item => 
          allowlistedDeals.some(al => al.deal_id === item.deal_id)
        ).length || 0
      };

      setQueueStats(stats);
    } catch (error) {
      console.error('Error loading queue stats:', error);
    }
  };

  const addDealsToAllowlist = async (dealA: string, dealB: string) => {
    try {
      // Clear existing allowlist
      await supabase.from('analysis_allowlist').delete().neq('deal_id', '00000000-0000-0000-0000-000000000000');

      // Add the two test deals
      const { error } = await supabase
        .from('analysis_allowlist')
        .insert([
          { deal_id: dealA, test_phase: 'safe_mode_test', notes: 'Test Deal A' },
          { deal_id: dealB, test_phase: 'safe_mode_test', notes: 'Test Deal B' }
        ]);

      if (error) throw error;

      // Queue the deals for analysis
      await supabase.rpc('queue_deal_analysis', {
        deal_id_param: dealA,
        trigger_reason_param: 'safe_mode_test',
        priority_param: 'high',
        delay_minutes: 0
      });

      await supabase.rpc('queue_deal_analysis', {
        deal_id_param: dealB,
        trigger_reason_param: 'safe_mode_test',
        priority_param: 'high',
        delay_minutes: 0
      });

      toast({
        title: "Allowlist Updated",
        description: "Test deals added to allowlist and queued for analysis"
      });

      await loadAllowlistedDeals();
      await loadQueueStats();
    } catch (error) {
      console.error('Error updating allowlist:', error);
      toast({
        title: "Allowlist Error",
        description: "Could not update allowlist",
        variant: "destructive"
      });
    }
  };

  const runSafeModeTest = async () => {
    if (allowlistedDeals.length === 0) {
      toast({
        title: "No Test Deals",
        description: "Please add deals to the allowlist first",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    try {
      console.log('🛡️ Starting safe mode test...');

      const { data, error } = await supabase.functions.invoke('safe-mode-processor');

      if (error) throw error;

      setLastResults(data);
      
      toast({
        title: "Safe Mode Test Completed",
        description: `Processed ${data.processed} deals (${data.successful} successful, ${data.failed} failed)`,
        variant: data.failed === 0 ? "default" : "destructive"
      });

      await loadQueueStats();
    } catch (error) {
      console.error('Error running safe mode test:', error);
      toast({
        title: "Test Failed",
        description: error.message || "Safe mode test failed",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const pauseAllAnalysis = async () => {
    try {
      await supabase
        .from('analysis_queue')
        .update({ status: 'paused' })
        .in('status', ['queued', 'processing']);

      toast({
        title: "Analysis Paused",
        description: "All queue items have been paused"
      });

      await loadQueueStats();
    } catch (error) {
      console.error('Error pausing analysis:', error);
      toast({
        title: "Pause Failed",
        description: "Could not pause analysis queue",
        variant: "destructive"
      });
    }
  };

  const safeModeEnabled = config?.ANALYSIS_SAFE_MODE === 'on';

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Safe Mode Test Controller
          </CardTitle>
          <CardDescription>
            Controlled test environment for SAFE MODE analysis on exactly 2 real deals
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Environment Configuration */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="text-sm font-medium">Safe Mode</div>
              <Badge variant={safeModeEnabled ? "default" : "destructive"}>
                {config?.ANALYSIS_SAFE_MODE || 'Unknown'}
              </Badge>
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium">Intake</div>
              <Badge variant={config?.ANALYSIS_INTAKE === 'off' ? "default" : "destructive"}>
                {config?.ANALYSIS_INTAKE || 'Unknown'}
              </Badge>
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium">Auto-triggers</div>
              <Badge variant={config?.REANALYSIS_AUTOTRIGGERS === 'off' ? "default" : "destructive"}>
                {config?.REANALYSIS_AUTOTRIGGERS || 'Unknown'}
              </Badge>
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium">Max Concurrency</div>
              <Badge variant="outline">
                {config?.MAX_CONCURRENCY || 'Unknown'}
              </Badge>
            </div>
          </div>

          {!safeModeEnabled && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Safe mode is not enabled. The test environment is not properly configured.
              </AlertDescription>
            </Alert>
          )}

          <Separator />

          {/* Queue Statistics */}
          {queueStats && (
            <div className="space-y-2">
              <div className="text-sm font-medium">Queue Status</div>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-2 text-xs">
                <div className="text-center">
                  <div className="font-medium">{queueStats.total}</div>
                  <div className="text-muted-foreground">Total</div>
                </div>
                <div className="text-center">
                  <div className="font-medium text-blue-600">{queueStats.queued}</div>
                  <div className="text-muted-foreground">Queued</div>
                </div>
                <div className="text-center">
                  <div className="font-medium text-yellow-600">{queueStats.processing}</div>
                  <div className="text-muted-foreground">Processing</div>
                </div>
                <div className="text-center">
                  <div className="font-medium text-green-600">{queueStats.completed}</div>
                  <div className="text-muted-foreground">Completed</div>
                </div>
                <div className="text-center">
                  <div className="font-medium text-red-600">{queueStats.failed}</div>
                  <div className="text-muted-foreground">Failed</div>
                </div>
                <div className="text-center">
                  <div className="font-medium text-gray-600">{queueStats.paused}</div>
                  <div className="text-muted-foreground">Paused</div>
                </div>
              </div>
            </div>
          )}

          <Separator />

          {/* Allowlisted Deals */}
          <div className="space-y-2">
            <div className="text-sm font-medium">Allowlisted Test Deals ({allowlistedDeals.length})</div>
            {allowlistedDeals.length === 0 ? (
              <div className="text-sm text-muted-foreground">No deals in allowlist</div>
            ) : (
              <div className="space-y-2">
                {allowlistedDeals.map((item, index) => (
                  <div key={item.deal_id} className="flex items-center justify-between p-2 bg-muted rounded">
                    <div>
                      <div className="font-medium">{item.deals?.company_name || 'Unknown Company'}</div>
                      <div className="text-xs text-muted-foreground">
                        {item.deals?.industry} • {item.deals?.funds?.name} ({item.deals?.funds?.fund_type})
                      </div>
                    </div>
                    <Badge variant="outline">Deal {String.fromCharCode(65 + index)}</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex gap-2">
            <Button
              onClick={runSafeModeTest}
              disabled={!safeModeEnabled || isProcessing || allowlistedDeals.length === 0}
              className="flex items-center gap-2"
            >
              {isProcessing ? (
                <>
                  <Activity className="h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Run Safe Mode Test
                </>
              )}
            </Button>
            
            <Button
              variant="outline"
              onClick={pauseAllAnalysis}
              className="flex items-center gap-2"
            >
              <Pause className="h-4 w-4" />
              Pause All Analysis
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                loadConfiguration();
                loadAllowlistedDeals();
                loadQueueStats();
              }}
              className="flex items-center gap-2"
            >
              <Activity className="h-4 w-4" />
              Refresh
            </Button>
          </div>

          {/* Last Results */}
          {lastResults && (
            <div className="space-y-2">
              <div className="text-sm font-medium">Last Test Results</div>
              <div className="p-3 bg-muted rounded text-xs">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                  <div>
                    <div className="font-medium">Processed: {lastResults.processed}</div>
                  </div>
                  <div>
                    <div className="font-medium text-green-600">Successful: {lastResults.successful}</div>
                  </div>
                  <div>
                    <div className="font-medium text-red-600">Failed: {lastResults.failed}</div>
                  </div>
                  <div>
                    <div className="font-medium">DLQ Rate: {(lastResults.dlq_rate * 100).toFixed(1)}%</div>
                  </div>
                </div>
                
                {lastResults.processing_details?.map((detail: ProcessingDetail) => (
                  <div key={detail.deal_id} className="border-t pt-2 mt-2">
                    <div className="flex items-center justify-between">
                      <div className="font-medium">Deal: {detail.deal_id.substring(0, 8)}...</div>
                      <div className="flex items-center gap-2">
                        {detail.success ? (
                          <CheckCircle className="h-3 w-3 text-green-600" />
                        ) : (
                          <AlertTriangle className="h-3 w-3 text-red-600" />
                        )}
                        {detail.processing_time_ms && (
                          <span>{(detail.processing_time_ms / 1000).toFixed(1)}s</span>
                        )}
                      </div>
                    </div>
                    {detail.analysis_data && (
                      <div className="mt-1 text-xs space-y-1">
                        <div>Score: {detail.analysis_data.overall_score}</div>
                        <div>Thesis: {detail.analysis_data.thesis_status} ({detail.analysis_data.thesis_score})</div>
                        <div>Rationale: {detail.analysis_data.rationale}</div>
                      </div>
                    )}
                    {detail.error && (
                      <div className="mt-1 text-xs text-red-600">Error: {detail.error}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}