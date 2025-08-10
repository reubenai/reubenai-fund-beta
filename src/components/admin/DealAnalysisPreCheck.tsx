import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  CheckCircle, 
  AlertCircle, 
  XCircle, 
  RefreshCw, 
  FileText, 
  Target,
  TrendingUp,
  Clock
} from 'lucide-react';

interface ValidationResult {
  valid: boolean;
  score: number;
  issues: string[];
  warnings: string[];
  completeness_score: number;
  validation_details: Record<string, any>;
  checked_at: string;
}

interface DealReadiness {
  deal_id: string;
  company_name: string;
  validation_score: number;
  is_ready: boolean;
  issue_count: number;
  warning_count: number;
  completeness_score: number;
}

interface StrategyValidation {
  valid: boolean;
  score: number;
  issues: string[];
  warnings: string[];
  strategy_configured: boolean;
  fund_details: {
    name: string;
    type: string;
    has_strategy: boolean;
  };
  checked_at: string;
}

export function DealAnalysisPreCheck() {
  const [selectedDealId, setSelectedDealId] = useState<string>('');
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [dealsReadiness, setDealsReadiness] = useState<DealReadiness[]>([]);
  const [strategyValidation, setStrategyValidation] = useState<StrategyValidation | null>(null);
  const [funds, setFunds] = useState<any[]>([]);
  const [selectedFundId, setSelectedFundId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadFunds();
  }, []);

  useEffect(() => {
    if (selectedFundId) {
      loadFundAnalysisReadiness();
      validateFundStrategy();
    }
  }, [selectedFundId]);

  const loadFunds = async () => {
    try {
      const { data, error } = await supabase
        .from('funds')
        .select('id, name, fund_type')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setFunds(data || []);
      if (data && data.length > 0) {
        setSelectedFundId(data[0].id);
      }
    } catch (error) {
      console.error('Error loading funds:', error);
      toast({
        title: "Error",
        description: "Failed to load funds",
        variant: "destructive",
      });
    }
  };

  const validateDeal = async (dealId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('validate_deal_for_analysis', {
        deal_id_param: dealId
      });

      if (error) throw error;
      setValidationResult(data as unknown as ValidationResult);
    } catch (error) {
      console.error('Error validating deal:', error);
      toast({
        title: "Error",
        description: "Failed to validate deal",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadFundAnalysisReadiness = async () => {
    if (!selectedFundId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_deals_analysis_readiness', {
        fund_id_param: selectedFundId
      });

      if (error) throw error;
      setDealsReadiness(data || []);
    } catch (error) {
      console.error('Error loading deal readiness:', error);
      toast({
        title: "Error",
        description: "Failed to load deal readiness data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const validateFundStrategy = async () => {
    if (!selectedFundId) return;

    try {
      const { data, error } = await supabase.rpc('validate_fund_strategy_for_analysis', {
        fund_id_param: selectedFundId
      });

      if (error) throw error;
      setStrategyValidation(data as unknown as StrategyValidation);
    } catch (error) {
      console.error('Error validating fund strategy:', error);
      toast({
        title: "Error",
        description: "Failed to validate fund strategy",
        variant: "destructive",
      });
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 80) return 'default';
    if (score >= 60) return 'secondary';
    return 'destructive';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Deal Analysis Pre-Check</h2>
          <p className="text-muted-foreground">
            Validate data quality and readiness before running analysis
          </p>
        </div>
        <Button 
          onClick={() => selectedFundId && loadFundAnalysisReadiness()} 
          disabled={loading}
          variant="outline"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
              Ready for Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dealsReadiness.filter(d => d.is_ready).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Deals with complete data
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <AlertCircle className="h-4 w-4 mr-2 text-yellow-600" />
              Needs Attention
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dealsReadiness.filter(d => !d.is_ready && d.validation_score >= 50).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Deals with warnings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <XCircle className="h-4 w-4 mr-2 text-red-600" />
              Not Ready
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dealsReadiness.filter(d => d.validation_score < 50).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Deals with critical issues
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="fund-overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="fund-overview">Fund Overview</TabsTrigger>
          <TabsTrigger value="deal-validation">Deal Validation</TabsTrigger>
          <TabsTrigger value="strategy-check">Strategy Check</TabsTrigger>
        </TabsList>

        <TabsContent value="fund-overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="h-5 w-5 mr-2" />
                Fund Analysis Readiness
              </CardTitle>
              <CardDescription>
                Overview of all deals in the selected fund and their analysis readiness
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Select Fund</label>
                  <select 
                    value={selectedFundId} 
                    onChange={(e) => setSelectedFundId(e.target.value)}
                    className="w-full mt-1 p-2 border rounded-md"
                  >
                    {funds.map(fund => (
                      <option key={fund.id} value={fund.id}>
                        {fund.name} ({fund.fund_type})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-3">
                  {dealsReadiness.map(deal => (
                    <div key={deal.deal_id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{deal.company_name}</span>
                          <Badge variant={getScoreBadgeVariant(deal.validation_score)}>
                            {deal.validation_score}%
                          </Badge>
                          {deal.is_ready ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-yellow-600" />
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {deal.issue_count > 0 && (
                            <span className="text-red-600">{deal.issue_count} issues</span>
                          )}
                          {deal.issue_count > 0 && deal.warning_count > 0 && ', '}
                          {deal.warning_count > 0 && (
                            <span className="text-yellow-600">{deal.warning_count} warnings</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <div className="text-sm font-medium">Completeness</div>
                          <div className="text-sm text-muted-foreground">{deal.completeness_score}%</div>
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setSelectedDealId(deal.deal_id);
                            validateDeal(deal.deal_id);
                          }}
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deal-validation" className="space-y-4">
          {validationResult && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Deal Validation Results
                </CardTitle>
                <CardDescription>
                  Detailed validation results for the selected deal
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-medium">Overall Score</div>
                    <div className={`text-2xl font-bold ${getScoreColor(validationResult.score)}`}>
                      {validationResult.score}%
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium">Completeness</div>
                    <div className={`text-2xl font-bold ${getScoreColor(validationResult.completeness_score)}`}>
                      {validationResult.completeness_score}%
                    </div>
                  </div>
                </div>

                <Progress value={validationResult.score} className="w-full" />

                {validationResult.issues.length > 0 && (
                  <Alert variant="destructive">
                    <XCircle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="font-medium">Critical Issues:</div>
                      <ul className="mt-1 space-y-1">
                        {validationResult.issues.map((issue, index) => (
                          <li key={index} className="text-sm">• {issue}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                {validationResult.warnings.length > 0 && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="font-medium">Warnings:</div>
                      <ul className="mt-1 space-y-1">
                        {validationResult.warnings.map((warning, index) => (
                          <li key={index} className="text-sm">• {warning}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
                  {Object.entries(validationResult.validation_details).map(([key, value]) => {
                    if (typeof value === 'boolean') {
                      return (
                        <div key={key} className="flex items-center gap-2">
                          {value ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-600" />
                          )}
                          <span className="text-sm capitalize">
                            {key.replace('has_', '').replace('_', ' ')}
                          </span>
                        </div>
                      );
                    }
                    return null;
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="strategy-check" className="space-y-4">
          {strategyValidation && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Investment Strategy Validation
                </CardTitle>
                <CardDescription>
                  Validation of fund strategy configuration for analysis
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm font-medium">Strategy Score</div>
                    <div className={`text-2xl font-bold ${getScoreColor(strategyValidation.score)}`}>
                      {strategyValidation.score}%
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium">Fund Type</div>
                    <div className="text-lg font-semibold capitalize">
                      {strategyValidation.fund_details.type.replace('_', ' ')}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium">Strategy Configured</div>
                    <div className="flex items-center gap-2">
                      {strategyValidation.strategy_configured ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                      <span className="font-medium">
                        {strategyValidation.strategy_configured ? 'Yes' : 'No'}
                      </span>
                    </div>
                  </div>
                </div>

                <Progress value={strategyValidation.score} className="w-full" />

                {strategyValidation.issues.length > 0 && (
                  <Alert variant="destructive">
                    <XCircle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="font-medium">Strategy Issues:</div>
                      <ul className="mt-1 space-y-1">
                        {strategyValidation.issues.map((issue, index) => (
                          <li key={index} className="text-sm">• {issue}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                {strategyValidation.warnings.length > 0 && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="font-medium">Strategy Warnings:</div>
                      <ul className="mt-1 space-y-1">
                        {strategyValidation.warnings.map((warning, index) => (
                          <li key={index} className="text-sm">• {warning}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                <div className="pt-4">
                  <div className="text-sm text-muted-foreground flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Last checked: {new Date(strategyValidation.checked_at).toLocaleString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}