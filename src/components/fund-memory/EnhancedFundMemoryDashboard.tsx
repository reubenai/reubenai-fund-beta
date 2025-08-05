import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Brain, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Target, 
  Users, 
  Lightbulb,
  BarChart3,
  ArrowRight,
  Eye,
  RefreshCw,
  Activity,
  Zap,
  TrendingDown,
  Calendar,
  FileText,
  Network,
  Database,
  Layers,
  Search,
  Sparkles,
  Shield,
  Timer,
  Building2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { enhancedFundMemoryService, FundMemoryInsight, DecisionAnalytics } from '@/services/EnhancedFundMemoryService';

interface EnhancedFundMemoryDashboardProps {
  fundId: string;
  fundName: string;
}

interface MemoryPrompt {
  type: 'similar_deal' | 'risk_pattern' | 'success_pattern' | 'bias_warning';
  title: string;
  description: string;
  relevance_score: number;
  actionable_insight?: string;
  created_at: string;
}

interface PatternInsight {
  pattern_type: string;
  pattern_name: string;
  pattern_description: string;
  confidence_score: number;
  decisions_analyzed: number;
  actionable_insights: string;
  validation_status: string;
}

export function EnhancedFundMemoryDashboard({ fundId, fundName }: EnhancedFundMemoryDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('insights');
  const [insights, setInsights] = useState<FundMemoryInsight[]>([]);
  const [analytics, setAnalytics] = useState<DecisionAnalytics | null>(null);
  const [memoryPrompts, setMemoryPrompts] = useState<MemoryPrompt[]>([]);
  const [patternInsights, setPatternInsights] = useState<PatternInsight[]>([]);
  const [contextualPrompts, setContextualPrompts] = useState<string[]>([]);
  const [timeRange, setTimeRange] = useState('30d');
  const { toast } = useToast();

  useEffect(() => {
    if (fundId) {
      fetchEnhancedMemoryData();
    }
  }, [fundId, timeRange]);

  const fetchEnhancedMemoryData = async () => {
    try {
      setLoading(true);
      
      const timeframeHours = timeRange === '7d' ? 168 : timeRange === '30d' ? 720 : 2160; // 7d, 30d, 90d
      const timeframeDays = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;

      // Fetch immediate insights
      const insightsData = await enhancedFundMemoryService.generateImmediateInsights(fundId, timeframeHours);
      setInsights(insightsData);

      // Fetch decision analytics
      const analyticsData = await enhancedFundMemoryService.getDecisionAnalytics(fundId, timeframeDays);
      setAnalytics(analyticsData);

      // Fetch contextual prompts
      const promptsData = await enhancedFundMemoryService.getContextualPrompts(fundId);
      setContextualPrompts(promptsData);

      // Fetch memory prompts and pattern insights from database
      await Promise.all([
        fetchMemoryPrompts(),
        fetchPatternInsights()
      ]);

    } catch (error) {
      console.error('Error fetching enhanced memory data:', error);
      toast({
        title: "Error loading memory data",
        description: "Failed to load fund memory insights",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMemoryPrompts = async () => {
    try {
      const { data: triggers, error } = await supabase
        .from('memory_prompt_triggers')
        .select('*')
        .eq('fund_id', fundId)
        .eq('is_active', true)
        .order('effectiveness_score', { ascending: false })
        .limit(5);

      if (error) throw error;

      const prompts: MemoryPrompt[] = (triggers || []).map(trigger => ({
        type: trigger.trigger_type as any,
        title: formatTriggerTitle(trigger.trigger_type),
        description: trigger.prompt_template || `${trigger.trigger_type} detection active`,
        relevance_score: trigger.effectiveness_score || 75,
        actionable_insight: generateActionableInsight(trigger.trigger_type),
        created_at: trigger.created_at
      }));

      setMemoryPrompts(prompts);
    } catch (error) {
      console.error('Error fetching memory prompts:', error);
    }
  };

  const fetchPatternInsights = async () => {
    try {
      const { data: patterns, error } = await supabase
        .from('fund_decision_patterns')
        .select('*')
        .eq('fund_id', fundId)
        .eq('is_active', true)
        .order('confidence_score', { ascending: false })
        .limit(10);

      if (error) throw error;
      setPatternInsights(patterns || []);
    } catch (error) {
      console.error('Error fetching pattern insights:', error);
    }
  };

  const formatTriggerTitle = (triggerType: string): string => {
    const typeMap: Record<string, string> = {
      'similar_deal': 'Similar Deal Detection',
      'risk_pattern': 'Risk Pattern Alert',
      'success_pattern': 'Success Pattern Match',
      'bias_warning': 'Bias Detection',
      'market_signal': 'Market Signal Alert'
    };
    return typeMap[triggerType] || triggerType.replace('_', ' ').toUpperCase();
  };

  const generateActionableInsight = (triggerType: string): string => {
    const insightMap: Record<string, string> = {
      'similar_deal': 'Review previous similar deals for decision patterns',
      'risk_pattern': 'Consider historical risk mitigation strategies',
      'success_pattern': 'Apply successful decision frameworks from past deals',
      'bias_warning': 'Implement bias check protocols before proceeding',
      'market_signal': 'Analyze market timing implications'
    };
    return insightMap[triggerType] || 'Review historical context before making decisions';
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'decision_pattern': return <BarChart3 className="h-4 w-4 text-primary" />;
      case 'bias_detection': return <Eye className="h-4 w-4 text-accent-orange" />;
      case 'success_factor': return <CheckCircle className="h-4 w-4 text-primary" />;
      case 'risk_signal': return <AlertTriangle className="h-4 w-4 text-destructive" />;
      default: return <Brain className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getInsightBadgeColor = (confidence: number) => {
    if (confidence >= 85) return 'bg-primary/10 text-primary border-primary/20';
    if (confidence >= 70) return 'bg-accent-blue/10 text-accent-blue border-accent-blue/20';
    return 'bg-muted/50 text-muted-foreground border-muted/30';
  };

  const renderDecisionAnalytics = () => {
    if (!analytics) return null;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Timer className="h-4 w-4" />
              Decision Speed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {analytics.decision_speed_avg.toFixed(1)} days
            </div>
            <p className="text-xs text-muted-foreground">Average time to decide</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4" />
              Consistency
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {analytics.decision_consistency}%
            </div>
            <Progress value={analytics.decision_consistency} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Brain className="h-4 w-4" />
              AI Alignment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {analytics.ai_alignment_rate}%
            </div>
            <Progress value={analytics.ai_alignment_rate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Bias Detection
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {analytics.bias_frequency}%
            </div>
            <p className="text-xs text-muted-foreground">Bias frequency</p>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderImmediateInsights = () => {
    if (insights.length === 0) {
      return (
        <Alert>
          <Lightbulb className="h-4 w-4" />
          <AlertDescription>
            Start making decisions to generate insights. The Fund Memory will learn from each investment decision and provide actionable intelligence.
          </AlertDescription>
        </Alert>
      );
    }

    return (
      <div className="space-y-4">
        {insights.map((insight, index) => (
          <Card key={index} className="border-l-4 border-l-primary">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  {getInsightIcon(insight.type)}
                  <CardTitle className="text-base">{insight.title}</CardTitle>
                </div>
                <Badge variant="outline" className={getInsightBadgeColor(insight.confidence_score)}>
                  {insight.confidence_score}% confidence
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">{insight.description}</p>
              <div className="p-3 bg-accent-blue/5 rounded-md border border-accent-blue/20">
                <p className="text-sm font-medium text-accent-blue mb-1">Actionable Recommendation:</p>
                <p className="text-sm text-accent-blue/80">{insight.actionable_recommendation}</p>
              </div>
              {insight.supporting_data && Object.keys(insight.supporting_data).length > 0 && (
                <details className="text-xs">
                  <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                    View supporting data
                  </summary>
                  <pre className="mt-2 p-2 bg-muted/30 rounded text-xs overflow-auto">
                    {JSON.stringify(insight.supporting_data, null, 2)}
                  </pre>
                </details>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  const renderContextualPrompts = () => {
    if (contextualPrompts.length === 0) {
      return (
        <Alert>
          <Search className="h-4 w-4" />
          <AlertDescription>
            Contextual prompts will appear here when evaluating deals, providing real-time insights from your fund's decision history.
          </AlertDescription>
        </Alert>
      );
    }

    return (
      <div className="space-y-3">
        {contextualPrompts.map((prompt, index) => (
          <Card key={index} className="bg-gradient-to-r from-primary/5 to-transparent border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Sparkles className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                <p className="text-sm text-foreground">{prompt}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  const renderPatternInsights = () => {
    if (patternInsights.length === 0) {
      return (
        <Alert>
          <Network className="h-4 w-4" />
          <AlertDescription>
            Pattern insights will develop as you make more investment decisions. These patterns help identify decision biases and success factors.
          </AlertDescription>
        </Alert>
      );
    }

    return (
      <div className="space-y-4">
        {patternInsights.map((pattern, index) => (
          <Card key={index}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <CardTitle className="text-base">{pattern.pattern_name}</CardTitle>
                <div className="flex gap-2">
                  <Badge variant="outline" className="text-xs">
                    {pattern.decisions_analyzed} decisions
                  </Badge>
                  <Badge variant="outline" className={getInsightBadgeColor(pattern.confidence_score)}>
                    {pattern.confidence_score}% confidence
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">{pattern.pattern_description}</p>
              {pattern.actionable_insights && (
                <div className="p-3 bg-primary/5 rounded-md border border-primary/20">
                  <p className="text-sm font-medium text-primary mb-1">Pattern Insights:</p>
                  <p className="text-sm text-primary/80">{pattern.actionable_insights}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-8 p-8">
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 animate-spin" />
            <span>Loading fund memory insights...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Fund Memory: {fundName}</h1>
          <p className="text-muted-foreground mt-1">
            Your investment decision autopilot - learning from every choice to improve future decisions
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={fetchEnhancedMemoryData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {renderDecisionAnalytics()}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="insights">Immediate Insights</TabsTrigger>
          <TabsTrigger value="patterns">Decision Patterns</TabsTrigger>
          <TabsTrigger value="prompts">Contextual Memory</TabsTrigger>
          <TabsTrigger value="triggers">Memory Triggers</TabsTrigger>
        </TabsList>

        <TabsContent value="insights" className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-3">Real-Time Decision Intelligence</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Immediate insights from your recent investment decisions, updated in real-time.
            </p>
            {renderImmediateInsights()}
          </div>
        </TabsContent>

        <TabsContent value="patterns" className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-3">Decision Pattern Analysis</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Identified patterns in your investment decision-making process.
            </p>
            {renderPatternInsights()}
          </div>
        </TabsContent>

        <TabsContent value="prompts" className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-3">Contextual Memory Prompts</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Real-time prompts based on your fund's decision history and similar situations.
            </p>
            {renderContextualPrompts()}
          </div>
        </TabsContent>

        <TabsContent value="triggers" className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-3">Active Memory Triggers</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Intelligent triggers that activate based on deal characteristics and decision contexts.
            </p>
            <div className="space-y-3">
              {memoryPrompts.map((prompt, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium">{prompt.title}</h4>
                      <Badge variant="outline" className="text-xs">
                        {prompt.relevance_score}% effective
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{prompt.description}</p>
                    {prompt.actionable_insight && (
                      <p className="text-xs text-primary font-medium">{prompt.actionable_insight}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
              {memoryPrompts.length === 0 && (
                <Alert>
                  <Activity className="h-4 w-4" />
                  <AlertDescription>
                    Memory triggers are being configured for your fund. They will become active as you make investment decisions.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}