import React, { useState, useEffect } from 'react';
import { useReubenAIData } from '@/hooks/useReubenAIData';
import { useUserDeals } from '@/hooks/useUserDeals';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Brain, Target, TrendingUp, DollarSign, Users, Building2, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';

interface DataPointCardProps {
  title: string;
  value: any;
  description?: string;
  confidence?: number;
  type?: 'number' | 'currency' | 'percentage' | 'array' | 'text';
}

function DataPointCard({ title, value, description, confidence, type = 'text' }: DataPointCardProps) {
  const formatValue = () => {
    if (value === null || value === undefined) return 'Not available';
    
    switch (type) {
      case 'currency':
        return typeof value === 'number' ? formatCurrency(value) : value;
      case 'percentage':
        return typeof value === 'number' ? `${value}%` : value;
      case 'array':
        return Array.isArray(value) ? value.join(', ') : value;
      default:
        return value?.toString() || 'Not available';
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-2">
        <div className="text-2xl font-semibold">{formatValue()}</div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
        {confidence && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground">Confidence:</span>
            <Progress value={confidence} className="w-16 h-1" />
            <span className="text-muted-foreground">{confidence}%</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface CriteriaScoreCardProps {
  title: string;
  score?: number;
  weight?: number;
  summary?: string;
  confidence?: number;
  isProcessing?: boolean;
}

function CriteriaScoreCard({ title, score, weight, summary, confidence, isProcessing }: CriteriaScoreCardProps) {
  const getScoreColor = (score?: number) => {
    if (!score) return 'text-muted-foreground';
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-lg">
          <span>{title}</span>
          <div className="flex items-center gap-2">
            {weight && (
              <Badge variant="outline" className="text-xs">
                {weight}% weight
              </Badge>
            )}
            {isProcessing ? (
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4 animate-pulse text-blue-500" />
                <span className="text-sm text-blue-500">Processing</span>
              </div>
            ) : score ? (
              <span className={`text-2xl font-bold ${getScoreColor(score)}`}>
                {score}
              </span>
            ) : (
              <span className="text-sm text-muted-foreground">No data</span>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {!isProcessing && score && (
          <Progress value={score} className="w-full" />
        )}
        {isProcessing ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Brain className="h-4 w-4 animate-pulse" />
              <span>ReubenAI is analyzing this criterion...</span>
            </div>
            <p className="text-xs text-muted-foreground">
              We'll notify you once the analysis is complete
            </p>
          </div>
        ) : summary ? (
          <p className="text-sm text-muted-foreground">{summary}</p>
        ) : (
          <p className="text-sm text-muted-foreground italic">
            Analysis pending - add documents or notes to trigger scoring
          </p>
        )}
        {confidence && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground">Confidence:</span>
            <Progress value={confidence} className="w-20 h-1" />
            <span className="text-muted-foreground">{confidence}%</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function ReubenAIAnalysis() {
  const [selectedDealId, setSelectedDealId] = useState<string>('');
  const { deals, loading: dealsLoading } = useUserDeals();
  
  const selectedDeal = deals.find(deal => deal.id === selectedDealId);
  const fundType = selectedDeal?.fund_type || 'venture_capital';
  
  const { data, isLoading, error } = useReubenAIData(
    selectedDeal || { id: '', fund_id: '' } as any,
    fundType
  );

  // Auto-select first deal if available
  useEffect(() => {
    if (deals.length > 0 && !selectedDealId) {
      setSelectedDealId(deals[0].id);
    }
  }, [deals, selectedDealId]);

  const renderVCDataPoints = () => {
    if (!data.dataPoints) return null;
    
    const dataPoints = data.dataPoints as any;
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <DataPointCard 
          title="Total Addressable Market (TAM)" 
          value={dataPoints.tam} 
          type="currency"
          confidence={dataPoints.data_completeness_score}
          description="Total market size opportunity"
        />
        <DataPointCard 
          title="Serviceable Addressable Market (SAM)" 
          value={dataPoints.sam} 
          type="currency"
          description="Serviceable market size"
        />
        <DataPointCard 
          title="Serviceable Obtainable Market (SOM)" 
          value={dataPoints.som} 
          type="currency"
          description="Realistic market capture"
        />
        <DataPointCard 
          title="Market Growth Rate (CAGR)" 
          value={dataPoints.cagr} 
          type="percentage"
          description="Compound annual growth rate"
        />
        <DataPointCard 
          title="Employee Count" 
          value={dataPoints.employee_count} 
          type="number"
          description="Current team size"
        />
        <DataPointCard 
          title="Customer Retention Rate" 
          value={dataPoints.retention_rate} 
          type="percentage"
          description="Customer retention metrics"
        />
        <DataPointCard 
          title="LTV/CAC Ratio" 
          value={dataPoints.ltv_cac_ratio} 
          type="number"
          description="Customer lifetime value to acquisition cost"
        />
        <DataPointCard 
          title="Technology Readiness Level" 
          value={dataPoints.technology_readiness_level} 
          type="number"
          description="Technology maturity scale (1-10)"
        />
        <DataPointCard 
          title="Competitors" 
          value={dataPoints.competitors} 
          type="array"
          description="Key competitive landscape"
        />
        <DataPointCard 
          title="Key Customers" 
          value={dataPoints.key_customers} 
          type="array"
          description="Notable customer base"
        />
        <DataPointCard 
          title="Growth Drivers" 
          value={dataPoints.growth_drivers} 
          type="array"
          description="Key growth catalysts"
        />
        <DataPointCard 
          title="Technology Stack" 
          value={dataPoints.technology_stack} 
          type="array"
          description="Core technology components"
        />
      </div>
    );
  };

  const renderPEDataPoints = () => {
    if (!data.dataPoints) return null;
    
    const dataPoints = data.dataPoints as any;
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <DataPointCard 
          title="Current Revenue" 
          value={dataPoints.revenue_current} 
          type="currency"
          confidence={dataPoints.data_completeness_score}
          description="Annual revenue run rate"
        />
        <DataPointCard 
          title="Revenue Growth Rate" 
          value={dataPoints.revenue_growth_rate} 
          type="percentage"
          description="Year-over-year growth"
        />
        <DataPointCard 
          title="EBITDA Margin" 
          value={dataPoints.ebitda_margin} 
          type="percentage"
          description="Operational efficiency metric"
        />
        <DataPointCard 
          title="Employee Count" 
          value={dataPoints.employee_count} 
          type="number"
          description="Total workforce size"
        />
        <DataPointCard 
          title="Market Share" 
          value={dataPoints.market_share} 
          type="percentage"
          description="Competitive market position"
        />
        <DataPointCard 
          title="Operational Efficiency Score" 
          value={dataPoints.operational_efficiency_score} 
          type="number"
          description="Operational performance rating"
        />
        <DataPointCard 
          title="Management Experience" 
          value={dataPoints.management_experience_years} 
          type="number"
          description="Years of leadership experience"
        />
        <DataPointCard 
          title="Acquisition Opportunities" 
          value={dataPoints.acquisition_opportunities} 
          type="array"
          description="Potential strategic acquisitions"
        />
      </div>
    );
  };

  const renderCriteriaScores = () => {
    if (!data.strategy?.enhanced_criteria) return null;

    const criteria = Object.entries(data.strategy.enhanced_criteria as any).map(([key, config]: [string, any]) => {
      const scoringResults = data.scoringResults;
      
      // Map criteria to scoring result fields
      const getScoreForCriteria = (criteriaKey: string) => {
        const keyMappings: { [key: string]: string } = {
          'team_leadership': 'founder_experience_score',
          'market_opportunity': 'market_size_score',
          'product_technology': 'product_innovation_score',
          'business_traction': 'revenue_growth_score',
          'financial_health': 'financial_performance_score',
          'strategic_fit': 'investment_strategy_score'
        };
        return scoringResults?.[keyMappings[criteriaKey] as keyof typeof scoringResults];
      };

      const getSummaryForCriteria = (criteriaKey: string) => {
        const summaryMappings: { [key: string]: string } = {
          'team_leadership': 'founder_experience_summary',
          'market_opportunity': 'market_opportunity_summary',
          'product_technology': 'product_technology_summary',
          'business_traction': 'business_traction_summary',
          'financial_health': 'financial_planning_summary',
          'strategic_fit': 'investment_strategy_summary'
        };
        return scoringResults?.[summaryMappings[criteriaKey] as keyof typeof scoringResults];
      };

      const score = getScoreForCriteria(key);
      const summary = getSummaryForCriteria(key);
      const isProcessing = data.isProcessing && !score;

      return (
        <CriteriaScoreCard
          key={key}
          title={config.name || key.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
          score={score as number}
          weight={config.weight}
          summary={summary as string}
          confidence={data.scoringResults?.confidence_score}
          isProcessing={isProcessing}
        />
      );
    });

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {criteria}
      </div>
    );
  };

  if (dealsLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-3 text-muted-foreground">Loading deals...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Brain className="h-8 w-8 text-primary" />
            ReubenAI Analysis
          </h1>
          <p className="text-muted-foreground">Comprehensive AI-powered deal analysis and scoring</p>
        </div>
      </div>

      {/* Deal Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Select Deal for Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedDealId} onValueChange={setSelectedDealId}>
            <SelectTrigger className="w-full md:w-[400px]">
              <SelectValue placeholder="Choose a deal to analyze" />
            </SelectTrigger>
            <SelectContent>
              {deals.map((deal) => (
                <SelectItem key={deal.id} value={deal.id}>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    <span>{deal.company_name}</span>
                    <Badge variant="outline" className="text-xs">
                      {deal.fund_type === 'venture_capital' ? 'VC' : 'PE'}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedDeal && (
        <>
          {/* Overall Score Summary */}
          <Card className="border-l-4 border-l-primary">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-3">
                <TrendingUp className="h-6 w-6" />
                {selectedDeal.company_name} - Overall Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Overall Score</h3>
                  <p className="text-muted-foreground">
                    {data.lastUpdated ? `Last updated ${format(new Date(data.lastUpdated), 'PPp')}` : 'Analysis pending'}
                  </p>
                </div>
                <div className="text-right">
                  {data.isProcessing ? (
                    <div className="flex items-center gap-2">
                      <Clock className="h-6 w-6 animate-pulse text-blue-500" />
                      <span className="text-lg text-blue-500">Processing...</span>
                    </div>
                  ) : data.scoringResults?.overall_score ? (
                    <div className="text-4xl font-bold text-primary">
                      {data.scoringResults.overall_score}
                    </div>
                  ) : (
                    <div className="text-lg text-muted-foreground">No score yet</div>
                  )}
                </div>
              </div>
              
              {data.scoringResults?.overall_score && (
                <Progress value={data.scoringResults.overall_score} className="w-full h-3" />
              )}
              
              {data.scoringResults?.analysis_summary ? (
                <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
                  {data.scoringResults.analysis_summary}
                </p>
              ) : data.isProcessing ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-blue-50/50 dark:bg-blue-950/20 p-3 rounded-md">
                  <Brain className="h-4 w-4 animate-pulse" />
                  <span>ReubenAI is processing your deal, we will let you know once it's completed</span>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
                  Analysis not yet started. Add documents or notes to trigger AI analysis.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Data Points Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Data Points ({fundType === 'venture_capital' ? 'Venture Capital' : 'Private Equity'})
              </CardTitle>
              {data.dataPoints && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>
                    Data sources: {(data.dataPoints as any)?.source_engines?.join(', ') || 'Manual input'}
                  </span>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  <span className="ml-2 text-muted-foreground">Loading data points...</span>
                </div>
              ) : data.dataPoints ? (
                fundType === 'venture_capital' ? renderVCDataPoints() : renderPEDataPoints()
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                  <p>No data points available yet</p>
                  <p className="text-sm">Add company information or documents to populate data points</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Investment Criteria Scoring */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Investment Criteria Analysis
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Scoring based on your fund's investment strategy configuration
              </p>
            </CardHeader>
            <CardContent>
              {data.strategy ? (
                renderCriteriaScores()
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Target className="h-8 w-8 mx-auto mb-2" />
                  <p>Investment strategy not configured</p>
                  <p className="text-sm">Configure your investment criteria in Strategy settings</p>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {deals.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Deals Found</h3>
            <p className="text-muted-foreground">
              Create your first deal in the Pipeline to start using ReubenAI analysis
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}