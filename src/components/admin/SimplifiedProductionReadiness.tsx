import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Activity, TrendingUp } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-states';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
                    🤖 ReubenAI Production Readiness
                  </CardTitle>
                  <CardDescription className="text-base">
                    Launch comprehensive production validation analysis
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
              {loading ? 'Launching Analysis...' : 'Launch Full Analysis'}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Analysis Description */}
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
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">📊 Analysis Output</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Overall readiness score</li>
                <li>• Critical issues identification</li>
                <li>• Component-by-component analysis</li>
                <li>• Actionable recommendations</li>
              </ul>
            </div>
          </div>
          
          <div className="p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">
              The analysis will test authentication flows, database connectivity, API performance, 
              security measures, and UI/UX components to ensure your ReubenAI platform is ready for production deployment.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}