import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Activity, TrendingUp, Shield, DollarSign, Package } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-states';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { EnhancedOpsControlPanel } from './EnhancedOpsControlPanel';
import { ICPacketExportPanel } from './ICPacketExportPanel';
import { CostMonitoringDashboard } from './CostMonitoringDashboard';

export function SimplifiedProductionReadiness() {
  const [loading, setLoading] = useState(false);

  const runFullAnalysis = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('production-readiness-orchestrator', {
        body: { 
          analysisType: 'production_readiness',
          scope: 'comprehensive'
        }
      });

      if (error) throw error;

      toast.success('Full production analysis launched successfully');
    } catch (error) {
      console.error('Production readiness analysis failed:', error);
      toast.error('Failed to launch production analysis');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
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
                    🤖 ReubenAI Production Control Center
                  </CardTitle>
                  <CardDescription className="text-base">
                    Enhanced operations monitoring with cost control and audit compliance
                  </CardDescription>
                </div>
              </div>
            </div>
            <Button 
              onClick={runFullAnalysis} 
              disabled={loading}
              size="lg"
              className="gap-2"
            >
              {loading ? <LoadingSpinner size="sm" /> : <TrendingUp className="h-4 w-4" />}
              {loading ? 'Running Analysis...' : 'Run System Check'}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Enhanced Production Control Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="ops-control" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Ops Control
          </TabsTrigger>
          <TabsTrigger value="cost-monitoring" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Cost Monitor
          </TabsTrigger>
          <TabsTrigger value="ic-packets" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            IC Packets
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>🚀 Production Analysis Suite</CardTitle>
              <CardDescription>
                Comprehensive validation of all system components for production readiness
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">🔧 System Components</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Authentication & Authorization</li>
                    <li>• Database Health & Performance</li>
                    <li>• API Endpoints & Edge Functions</li>
                    <li>• Security & Data Validation</li>
                    <li>• Cost Controls & Circuit Breakers</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">📊 Enhanced Features</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Real-time cost monitoring</li>
                    <li>• AI agent circuit breakers</li>
                    <li>• Audit-ready IC packet exports</li>
                    <li>• Mandate-based recency checks</li>
                    <li>• Degradation mode controls</li>
                  </ul>
                </div>
              </div>
              
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  The enhanced production system includes institutional-grade cost controls, 
                  complete audit trails, emergency kill switches, and one-click IC packet generation 
                  for investment committee documentation.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ops-control">
          <EnhancedOpsControlPanel />
        </TabsContent>

        <TabsContent value="cost-monitoring">
          <CostMonitoringDashboard />
        </TabsContent>

        <TabsContent value="ic-packets">
          <ICPacketExportPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}