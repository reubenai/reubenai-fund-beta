import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, CheckCircle, XCircle, Info } from 'lucide-react';

interface DataQualityIndicatorProps {
  validationResult: {
    isValid: boolean;
    score: number;
    issues: string[];
    warnings: string[];
    dataCompleteness: number;
    fabricationRisk: 'low' | 'medium' | 'high';
  };
  title?: string;
  showDetails?: boolean;
}

export function DataQualityIndicator({ 
  validationResult, 
  title = "Data Quality Assessment",
  showDetails = true 
}: DataQualityIndicatorProps) {
  const { isValid, score, issues, warnings, dataCompleteness, fabricationRisk } = validationResult;

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'hsl(var(--success))';
    if (score >= 60) return 'hsl(var(--warning))';
    return 'hsl(var(--destructive))';
  };

  const getFabricationRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'default';
      case 'medium': return 'outline';
      case 'high': return 'destructive';
      default: return 'secondary';
    }
  };

  const getStatusIcon = () => {
    if (issues.length > 0) return <XCircle className="h-4 w-4 text-destructive" />;
    if (warnings.length > 0) return <AlertTriangle className="h-4 w-4 text-warning" />;
    return <CheckCircle className="h-4 w-4 text-success" />;
  };

  return (
    <Card className="border-l-4" style={{
      borderLeftColor: getScoreColor(score)
    }}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          {getStatusIcon()}
          {title}
          <Badge variant={isValid ? 'default' : 'destructive'} className="ml-auto">
            {isValid ? 'Valid' : 'Issues Detected'}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Quality Score */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Quality Score</span>
            <span className="font-medium">{score}/100</span>
          </div>
          <Progress 
            value={score} 
            className="h-2"
            style={{
              '--progress-background': getScoreColor(score)
            } as React.CSSProperties}
          />
        </div>

        {/* Data Completeness */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Data Completeness</span>
            <span className="font-medium">{dataCompleteness}%</span>
          </div>
          <Progress value={dataCompleteness} className="h-2" />
        </div>

        {/* Fabrication Risk */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Fabrication Risk</span>
          <Badge variant={getFabricationRiskColor(fabricationRisk) as 'default' | 'destructive' | 'outline' | 'secondary'}>
            {fabricationRisk.toUpperCase()}
          </Badge>
        </div>

        {/* Issues and Warnings */}
        {showDetails && (issues.length > 0 || warnings.length > 0) && (
          <div className="space-y-3 pt-2 border-t">
            {issues.length > 0 && (
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-sm font-medium text-destructive">
                  <XCircle className="h-3 w-3" />
                  Issues ({issues.length})
                </div>
                <ul className="space-y-1">
                  {issues.map((issue, index) => (
                    <li key={index} className="text-xs text-muted-foreground pl-4">
                      • {issue}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {warnings.length > 0 && (
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-sm font-medium text-warning">
                  <AlertTriangle className="h-3 w-3" />
                  Warnings ({warnings.length})
                </div>
                <ul className="space-y-1">
                  {warnings.map((warning, index) => (
                    <li key={index} className="text-xs text-muted-foreground pl-4">
                      • {warning}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Zero Fabrication Notice */}
        <div className="flex items-start gap-2 p-2 bg-muted/50 rounded text-xs">
          <Info className="h-3 w-3 text-muted-foreground mt-0.5 flex-shrink-0" />
          <span className="text-muted-foreground">
            This analysis follows strict zero-fabrication protocols. All data is validated and uncertainty is explicitly indicated.
          </span>
        </div>
      </CardContent>
    </Card>
  );
}