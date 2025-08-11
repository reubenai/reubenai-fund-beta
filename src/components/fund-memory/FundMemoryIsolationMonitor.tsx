import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Shield, AlertTriangle, CheckCircle, Eye } from 'lucide-react';
import { useFundMemoryIsolation } from '@/hooks/useFundMemoryIsolation';

interface FundMemoryIsolationMonitorProps {
  fundId: string;
  fundName: string;
}

export function FundMemoryIsolationMonitor({ fundId, fundName }: FundMemoryIsolationMonitorProps) {
  const { checkFundMemoryIsolation, isolationStatus } = useFundMemoryIsolation();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const runIsolationCheck = async () => {
      setLoading(true);
      await checkFundMemoryIsolation(fundId);
      setLoading(false);
    };

    runIsolationCheck();
  }, [fundId, checkFundMemoryIsolation]);

  const isolation = isolationStatus.get(fundId);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Memory Isolation Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <div className="animate-pulse h-4 w-4 bg-muted rounded" />
            <span className="text-sm text-muted-foreground">Checking isolation...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isolation) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Memory Isolation Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Unable to verify memory isolation status for this fund.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const getIsolationBadge = (score: number) => {
    if (score >= 90) return { variant: 'default' as const, label: 'Excellent', color: 'text-green-600' };
    if (score >= 75) return { variant: 'secondary' as const, label: 'Good', color: 'text-yellow-600' };
    return { variant: 'destructive' as const, label: 'Needs Attention', color: 'text-red-600' };
  };

  const isolationBadge = getIsolationBadge(isolation.isolationScore);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Memory Isolation Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold">{isolation.isolationScore}%</div>
            <p className="text-sm text-muted-foreground">Isolation Score</p>
          </div>
          <Badge variant={isolationBadge.variant} className={isolationBadge.color}>
            {isolationBadge.label}
          </Badge>
        </div>

        <Progress value={isolation.isolationScore} className="h-2" />

        <div className="space-y-2">
          <h4 className="text-sm font-medium">Isolation Details</h4>
          <div className="text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Memory isolation score: {isolation.isolationScore}%</span>
            </div>
            {isolation.contaminationRisk !== 'none' && (
              <div className="flex items-center gap-2 mt-1">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <span className="text-red-600">Contamination risk: {isolation.contaminationRisk}</span>
              </div>
            )}
          </div>
        </div>

        {isolation.contaminationRisk !== 'none' && (
          <Alert>
            <Eye className="h-4 w-4" />
            <AlertDescription>
              <strong>Contamination Risk Detected:</strong> {isolation.contaminationRisk} risk of cross-fund data exposure.
              Regular monitoring and cleanup recommended.
            </AlertDescription>
          </Alert>
        )}

        <div className="text-xs text-muted-foreground">
          Last checked: {isolation.lastChecked.toLocaleString()}
        </div>
      </CardContent>
    </Card>
  );
}