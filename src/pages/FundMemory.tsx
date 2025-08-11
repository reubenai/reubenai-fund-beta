import React from 'react';
import { useFund } from '@/contexts/FundContext';
import { useUserRole } from '@/hooks/useUserRole';
import { EnhancedFundMemoryDashboard } from '@/components/fund-memory/EnhancedFundMemoryDashboard';
import { ActivityInsightsDashboard } from '@/components/activity/ActivityInsightsDashboard';
import { ActivityDigest } from '@/components/activity/ActivityDigest';
import { FundMemoryIsolationMonitor } from '@/components/fund-memory/FundMemoryIsolationMonitor';
import { useVerificationRunner } from '@/hooks/useVerificationRunner';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function FundMemory() {
  const { selectedFund } = useFund();
  const { isSuperAdmin } = useUserRole();
  const { runVerification, isRunning, results } = useVerificationRunner();

  if (!selectedFund) {
    return (
      <div className="space-y-8 p-8">
        <div>
          <h1 className="text-4xl font-bold text-foreground">Enhanced Fund Memory</h1>
          <p className="text-lg text-muted-foreground mt-2">Please select a fund to view institutional memory insights</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <EnhancedFundMemoryDashboard 
            fundId={selectedFund.id} 
            fundName={selectedFund.name} 
          />
        </div>
        <div className="space-y-6">
          <FundMemoryIsolationMonitor 
            fundId={selectedFund.id} 
            fundName={selectedFund.name} 
          />
          
          {isSuperAdmin && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">System Verification</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  onClick={() => runVerification(['stage7'])}
                  disabled={isRunning}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  {isRunning ? 'Running...' : 'Run Memory Protection Check'}
                </Button>
                
                {results.length > 0 && (
                  <div className="space-y-2">
                    {results.map((result, index) => (
                      <div key={index} className="text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{result.stage}</span>
                          <Badge variant={result.status === 'passed' ? 'default' : 'destructive'}>
                            {result.status}
                          </Badge>
                        </div>
                        {result.details && (
                          <p className="text-muted-foreground">{result.details}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          
          <ActivityInsightsDashboard timeRange="7d" />
          <ActivityDigest timeRange="24h" showSignificantOnly={true} maxItems={8} />
        </div>
      </div>
    </div>
  );
}