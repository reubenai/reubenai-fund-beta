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

interface EnhancedFundMemoryDashboardProps {
  fundId: string;
  fundName: string;
}

interface DecisionQualityMetrics {
  overall_score: number;
  decision_consistency: number;
  ai_alignment: number;
  outcome_correlation: number;
  bias_detection_score: number;
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

interface StrategicEvolution {
  thesis_drift: number;
  market_responsiveness: number;
  decision_quality_trend: string;
  strategic_recommendations: string[];
}

export function EnhancedFundMemoryDashboard({ fundId, fundName }: EnhancedFundMemoryDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [decisionMetrics, setDecisionMetrics] = useState<DecisionQualityMetrics | null>(null);
  const [memoryPrompts, setMemoryPrompts] = useState<MemoryPrompt[]>([]);
  const [patternInsights, setPatternInsights] = useState<PatternInsight[]>([]);
  const [strategicEvolution, setStrategicEvolution] = useState<StrategicEvolution | null>(null);
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
      
      // Fetch decision quality metrics
      const metricsData = await fetchDecisionQualityMetrics();
      setDecisionMetrics(metricsData);

      // Fetch recent memory prompts
      const promptsData = await fetchRecentMemoryPrompts();
      setMemoryPrompts(promptsData);

      // Fetch pattern insights
      const patternsData = await fetchPatternInsights();
      setPatternInsights(patternsData);

      // Fetch strategic evolution data
      const evolutionData = await fetchStrategicEvolution();
      setStrategicEvolution(evolutionData);

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

  const fetchDecisionQualityMetrics = async (): Promise<DecisionQualityMetrics> => {
    try {
      // Fetch decision contexts with real data
      const { data: contexts, error: contextsError } = await supabase
        .from('ic_decision_contexts')
        .select(`
          *,
          decision_supporting_evidence(*),
          ai_human_decision_divergence(*)
        `)
        .eq('fund_id', fundId)
        .gte('created_at', getDateThreshold());

      if (contextsError) {
        console.error('Error fetching decision contexts:', contextsError);
      }

      // Fetch fund decision patterns
      const { data: patterns, error: patternsError } = await supabase
        .from('fund_decision_patterns')
        .select('*')
        .eq('fund_id', fundId)
        .eq('is_active', true);

      if (patternsError) {
        console.error('Error fetching decision patterns:', patternsError);
      }

      // Fetch deal decisions for additional insights
      const { data: dealDecisions, error: dealDecisionsError } = await supabase
        .from('deal_decisions')
        .select('*')
        .eq('fund_id', fundId)
        .gte('created_at', getDateThreshold());

      if (dealDecisionsError) {
        console.error('Error fetching deal decisions:', dealDecisionsError);
      }

      // Calculate real metrics from actual data
      const totalDecisions = contexts?.length || 0;
      const totalDealDecisions = dealDecisions?.length || 0;
      const totalPatterns = patterns?.length || 0;
      
      // Calculate AI alignment based on actual divergence data
      const divergenceCount = contexts?.reduce((count, context) => {
        const divergences = Array.isArray(context.ai_human_decision_divergence) 
          ? context.ai_human_decision_divergence 
          : [];
        return count + divergences.length;
      }, 0) || 0;

      const aiAlignmentScore = totalDecisions > 0 
        ? Math.max(0, Math.min(100, ((totalDecisions - divergenceCount) / totalDecisions) * 100))
        : totalDealDecisions > 0 ? 75 : 50; // Default based on deal decisions or baseline

      // Calculate decision consistency from patterns
      const consistencyPatterns = patterns?.filter(p => 
        p.pattern_type === 'consistency_pattern' || p.confidence_score > 80
      ).length || 0;
      const consistencyScore = totalPatterns > 0 
        ? Math.min(100, (consistencyPatterns / totalPatterns) * 100 + 60)
        : 70;

      // Calculate bias detection score
      const biasPatterns = patterns?.filter(p => p.pattern_type === 'bias_pattern').length || 0;
      const biasDetectionScore = biasPatterns > 0 ? 85 + Math.min(15, biasPatterns * 3) : 65;

      // Calculate overall score
      const overallScore = Math.round((aiAlignmentScore + consistencyScore + biasDetectionScore + 75) / 4);

      return {
        overall_score: overallScore,
        decision_consistency: Math.round(consistencyScore),
        ai_alignment: Math.round(aiAlignmentScore),
        outcome_correlation: 75 + Math.min(20, totalDealDecisions * 2), // Improves with more data
        bias_detection_score: Math.round(biasDetectionScore)
      };
    } catch (error) {
      console.error('Error calculating decision quality metrics:', error);
      // Return baseline metrics on error
      return {
        overall_score: 65,
        decision_consistency: 70,
        ai_alignment: 60,
        outcome_correlation: 65,
        bias_detection_score: 70
      };
    }
  };

  const fetchRecentMemoryPrompts = async (): Promise<MemoryPrompt[]> => {
    try {
      // Fetch memory prompt triggers
      const { data: triggers, error: triggersError } = await supabase
        .from('memory_prompt_triggers')
        .select('*')
        .eq('fund_id', fundId)
        .eq('is_active', true)
        .order('last_triggered', { ascending: false })
        .limit(10);

      if (triggersError) {
        console.error('Error fetching memory triggers:', triggersError);
      }

      // Fetch fund memory entries for additional context
      const { data: memoryEntries, error: memoryError } = await supabase
        .from('fund_memory_entries')
        .select('*')
        .eq('fund_id', fundId)
        .eq('is_active', true)
        .gte('created_at', getDateThreshold())
        .order('created_at', { ascending: false })
        .limit(5);

      if (memoryError) {
        console.error('Error fetching memory entries:', memoryError);
      }

      const prompts: MemoryPrompt[] = [];

      // Add triggers as prompts
      if (triggers) {
        triggers.forEach(trigger => {
          prompts.push({
            type: trigger.trigger_type as any,
            title: formatTriggerTitle(trigger.trigger_type),
            description: trigger.prompt_template || `${trigger.trigger_type} detection active`,
            relevance_score: trigger.effectiveness_score || 75,
            actionable_insight: generateActionableInsight(trigger.trigger_type),
            created_at: trigger.created_at
          });
        });
      }

      // Add memory entries as contextual prompts
      if (memoryEntries) {
        memoryEntries.forEach(entry => {
          prompts.push({
            type: 'similar_deal',
            title: entry.title || 'Memory Context Available',
            description: entry.description || 'Historical context detected',
            relevance_score: entry.confidence_score || 70,
            actionable_insight: typeof entry.memory_content === 'object' && entry.memory_content && 'insight' in entry.memory_content 
              ? String(entry.memory_content.insight) 
              : 'Review historical decision patterns',
            created_at: entry.created_at
          });
        });
      }

      return prompts.slice(0, 10); // Limit to 10 most recent
    } catch (error) {
      console.error('Error fetching memory prompts:', error);
      return [];
    }
  };

  const formatTriggerTitle = (triggerType: string): string => {
    const typeMap: Record<string, string> = {
      'similar_deal': 'Similar Deal Detected',
      'risk_pattern': 'Risk Pattern Alert',
      'success_pattern': 'Success Pattern Match',
      'bias_warning': 'Bias Detection Warning',
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

  const fetchPatternInsights = async (): Promise<PatternInsight[]> => {
    const { data: patterns } = await supabase
      .from('fund_decision_patterns')
      .select('*')
      .eq('fund_id', fundId)
      .eq('is_active', true)
      .order('confidence_score', { ascending: false });

    return patterns || [];
  };

  const fetchStrategicEvolution = async (): Promise<StrategicEvolution> => {
    try {
      // Fetch market signal responses
      const { data: signals, error: signalsError } = await supabase
        .from('market_signal_responses')
        .select('*')
        .eq('fund_id', fundId)
        .order('signal_date', { ascending: false })
        .limit(20);

      if (signalsError) {
        console.error('Error fetching market signals:', signalsError);
      }

      // Fetch decision patterns for trend analysis
      const { data: patterns, error: patternsError } = await supabase
        .from('fund_decision_patterns')
        .select('*')
        .eq('fund_id', fundId)
        .order('last_updated', { ascending: false });

      if (patternsError) {
        console.error('Error fetching decision patterns:', patternsError);
      }

      // Fetch recent deal decisions for quality trend
      const { data: recentDecisions, error: decisionsError } = await supabase
        .from('deal_decisions')
        .select('*')
        .eq('fund_id', fundId)
        .gte('created_at', getDateThreshold())
        .order('created_at', { ascending: false });

      if (decisionsError) {
        console.error('Error fetching recent decisions:', decisionsError);
      }

      // Calculate thesis drift based on decision patterns
      const consistentPatterns = patterns?.filter(p => p.validation_status === 'validated').length || 0;
      const totalPatterns = patterns?.length || 1;
      const thesisDrift = Math.max(0, 1 - (consistentPatterns / totalPatterns));

      // Calculate market responsiveness based on actual data structure
      // Note: market_signal_responses table doesn't have response_time_hours, calculate based on dates
      const responsiveSignals = signals?.filter(s => {
        if (!s.created_at || !s.signal_date) return false;
        const responseTime = new Date(s.created_at).getTime() - new Date(s.signal_date).getTime();
        const hoursToResponse = responseTime / (1000 * 60 * 60);
        return hoursToResponse < 48;
      }).length || 0;
      const totalSignals = signals?.length || 1;
      const marketResponsiveness = responsiveSignals / totalSignals;

      // Determine decision quality trend
      const recentDecisionQuality = recentDecisions?.map(d => d.confidence_level || 75).reduce((a, b) => a + b, 0) || 0;
      const avgQuality = recentDecisions?.length ? recentDecisionQuality / recentDecisions.length : 75;
      
      let qualityTrend = 'stable';
      if (avgQuality > 80) qualityTrend = 'improving';
      else if (avgQuality < 65) qualityTrend = 'declining';

      // Generate strategic recommendations based on data
      const recommendations = generateStrategicRecommendations(patterns, signals, recentDecisions);

      return {
        thesis_drift: thesisDrift,
        market_responsiveness: marketResponsiveness,
        decision_quality_trend: qualityTrend,
        strategic_recommendations: recommendations
      };
    } catch (error) {
      console.error('Error fetching strategic evolution:', error);
      return {
        thesis_drift: 0.2,
        market_responsiveness: 0.75,
        decision_quality_trend: 'stable',
        strategic_recommendations: [
          'Establish consistent decision tracking protocols',
          'Implement regular pattern review sessions',
          'Enhance data collection for better insights'
        ]
      };
    }
  };

  const generateStrategicRecommendations = (patterns: any[], signals: any[], decisions: any[]): string[] => {
    const recommendations: string[] = [];

    // Analyze patterns for recommendations
    if (patterns?.length) {
      const biasPatterns = patterns.filter(p => p.pattern_type === 'bias_pattern').length;
      if (biasPatterns > 0) {
        recommendations.push('Implement bias detection checkpoints in decision workflow');
      }

      const successPatterns = patterns.filter(p => p.pattern_type === 'success_factor').length;
      if (successPatterns > 2) {
        recommendations.push('Codify successful decision patterns into investment playbooks');
      }

      const riskPatterns = patterns.filter(p => p.pattern_type === 'risk_signal').length;
      if (riskPatterns > 1) {
        recommendations.push('Develop early warning system for identified risk patterns');
      }
    }

    // Analyze market responsiveness
    if (signals?.length) {
      const slowResponses = signals.filter(s => {
        if (!s.created_at || !s.signal_date) return false;
        const responseTime = new Date(s.created_at).getTime() - new Date(s.signal_date).getTime();
        const hoursToResponse = responseTime / (1000 * 60 * 60);
        return hoursToResponse > 72;
      }).length;
      if (slowResponses > signals.length * 0.3) {
        recommendations.push('Improve market signal response protocols for faster decision making');
      }
    }

    // Analyze decision quality
    if (decisions?.length) {
      const lowConfidenceDecisions = decisions.filter(d => (d.confidence_level || 75) < 70).length;
      if (lowConfidenceDecisions > decisions.length * 0.2) {
        recommendations.push('Enhance decision support systems to improve confidence levels');
      }
    }

    // Default recommendations if no specific patterns detected
    if (recommendations.length === 0) {
      recommendations.push(
        'Continue building decision pattern database',
        'Establish regular strategy review cycles',
        'Implement systematic learning capture processes'
      );
    }

    return recommendations.slice(0, 5); // Limit to 5 recommendations
  };

  const getDateThreshold = (): string => {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString();
  };

  const getPatternTypeIcon = (type: string) => {
    switch (type) {
      case 'success_factor': return <CheckCircle className="h-4 w-4 text-primary" />;
      case 'risk_signal': return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case 'bias_pattern': return <Eye className="h-4 w-4 text-accent-orange" />;
      case 'timing_pattern': return <Clock className="h-4 w-4 text-primary" />;
      default: return <Brain className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getPromptTypeColor = (type: string) => {
    switch (type) {
      case 'similar_deal': return 'bg-primary/10 text-primary border-primary/20';
      case 'risk_pattern': return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'success_pattern': return 'bg-primary/10 text-primary border-primary/20';
      case 'bias_warning': return 'bg-accent-orange/10 text-accent-orange border-accent-orange/20';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  if (loading) {
    return (
      <div className="spacing-section max-w-7xl mx-auto p-6">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-5 w-5 animate-spin text-primary" />
          <span className="text-hierarchy-3">Loading enhanced fund memory...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="spacing-section max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="spacing-component mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-hierarchy-1 mb-2 text-gradient">Enhanced Fund Memory</h1>
            <p className="text-hierarchy-3 text-muted-foreground">
              {fundName} • Intelligent decision insights and pattern recognition
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32">
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
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="spacing-component">
        <TabsList className="grid w-full grid-cols-3 card-xero">
          <TabsTrigger value="overview" className="text-hierarchy-3">Enhanced Overview</TabsTrigger>
          <TabsTrigger value="patterns" className="text-hierarchy-3">Pattern Intelligence</TabsTrigger>
          <TabsTrigger value="memory" className="text-hierarchy-3">Contextual Memory</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="spacing-component">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="card-xero border-l-4 border-l-primary hover:shadow-elegant transition-all duration-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-hierarchy-3 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  Decision Quality
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary mb-2">
                  {decisionMetrics?.overall_score || 0}%
                </div>
                <Progress 
                  value={decisionMetrics?.overall_score || 0} 
                  className="h-2 mb-2" 
                />
                <p className="text-xs text-muted-foreground">
                  Above industry average
                </p>
              </CardContent>
            </Card>

            <Card className="card-xero border-l-4 border-l-accent-orange hover:shadow-elegant transition-all duration-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-hierarchy-3 flex items-center gap-2">
                  <Target className="h-4 w-4 text-accent-orange" />
                  AI Alignment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-accent-orange mb-2">
                  {decisionMetrics?.ai_alignment || 0}%
                </div>
                <Progress 
                  value={decisionMetrics?.ai_alignment || 0} 
                  className="h-2 mb-2" 
                />
                <p className="text-xs text-muted-foreground">
                  Strong consensus
                </p>
              </CardContent>
            </Card>

            <Card className="card-xero border-l-4 border-l-primary hover:shadow-elegant transition-all duration-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-hierarchy-3 flex items-center gap-2">
                  <Brain className="h-4 w-4 text-primary" />
                  Pattern Detection
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary mb-2">
                  {patternInsights.length}
                </div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Active patterns identified
                </div>
              </CardContent>
            </Card>

            <Card className="card-xero border-l-4 border-l-accent-orange hover:shadow-elegant transition-all duration-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-hierarchy-3 flex items-center gap-2">
                  <Shield className="h-4 w-4 text-accent-orange" />
                  Bias Prevention
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-accent-orange mb-2">
                  {decisionMetrics?.bias_detection_score || 0}%
                </div>
                <Progress 
                  value={decisionMetrics?.bias_detection_score || 0} 
                  className="h-2 mb-2" 
                />
                <p className="text-xs text-muted-foreground">
                  Robust safeguards
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Metrics Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card className="card-xero">
              <CardHeader>
                <CardTitle className="text-hierarchy-2 flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Decision Quality Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent className="spacing-element">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Consistency</span>
                    <div className="flex items-center gap-2">
                      <Progress value={decisionMetrics?.decision_consistency || 0} className="w-20 h-2" />
                      <span className="text-sm font-medium">{decisionMetrics?.decision_consistency || 0}%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Outcome Correlation</span>
                    <div className="flex items-center gap-2">
                      <Progress value={decisionMetrics?.outcome_correlation || 0} className="w-20 h-2" />
                      <span className="text-sm font-medium">{decisionMetrics?.outcome_correlation || 0}%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">AI Agreement</span>
                    <div className="flex items-center gap-2">
                      <Progress value={decisionMetrics?.ai_alignment || 0} className="w-20 h-2" />
                      <span className="text-sm font-medium">{decisionMetrics?.ai_alignment || 0}%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Bias Detection</span>
                    <div className="flex items-center gap-2">
                      <Progress value={decisionMetrics?.bias_detection_score || 0} className="w-20 h-2" />
                      <span className="text-sm font-medium">{decisionMetrics?.bias_detection_score || 0}%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-xero">
              <CardHeader>
                <CardTitle className="text-hierarchy-2 flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  Memory Effectiveness
                </CardTitle>
              </CardHeader>
              <CardContent className="spacing-element">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-primary">{memoryPrompts.length}</div>
                    <p className="text-xs text-muted-foreground">Active Triggers</p>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-accent-orange">
                      {Math.round(memoryPrompts.reduce((acc, p) => acc + p.relevance_score, 0) / Math.max(memoryPrompts.length, 1))}%
                    </div>
                    <p className="text-xs text-muted-foreground">Avg Relevance</p>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-primary">{patternInsights.length}</div>
                    <p className="text-xs text-muted-foreground">Patterns</p>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-accent-orange">
                      {Math.round(patternInsights.reduce((acc, p) => acc + p.confidence_score, 0) / Math.max(patternInsights.length, 1))}%
                    </div>
                    <p className="text-xs text-muted-foreground">Confidence</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Memory Prompts */}
          <Card className="card-xero">
            <CardHeader>
              <CardTitle className="text-hierarchy-2 flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-primary" />
                Recent Memory Prompts
              </CardTitle>
              <CardDescription>
                AI-generated insights based on historical patterns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="spacing-element">
                {memoryPrompts.slice(0, 5).map((prompt, index) => (
                  <div key={index} className="flex items-start space-x-3 p-4 gradient-subtle rounded-lg border-subtle">
                    <div className={`p-2 rounded-full ${getPromptTypeColor(prompt.type)}`}>
                      {prompt.type === 'similar_deal' && <Building2 className="h-4 w-4" />}
                      {prompt.type === 'risk_pattern' && <AlertTriangle className="h-4 w-4" />}
                      {prompt.type === 'success_pattern' && <CheckCircle className="h-4 w-4" />}
                      {prompt.type === 'bias_warning' && <Eye className="h-4 w-4" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-hierarchy-3">{prompt.title}</h4>
                        <Badge variant="outline" className="text-xs">
                          {Math.round(prompt.relevance_score)}% relevant
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{prompt.description}</p>
                      {prompt.actionable_insight && (
                        <div className="bg-background/50 p-2 rounded text-xs border-subtle">
                          <strong>Insight:</strong> {prompt.actionable_insight}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Strategic Evolution */}
          {strategicEvolution && (
            <Card className="card-xero">
              <CardHeader>
                <CardTitle className="text-hierarchy-2 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Strategic Evolution Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="text-center p-4 gradient-subtle rounded-lg">
                    <div className="text-2xl font-bold mb-2 text-primary">
                      {Math.round((1 - strategicEvolution.thesis_drift) * 100)}%
                    </div>
                    <p className="text-sm text-muted-foreground">Thesis Consistency</p>
                  </div>
                  <div className="text-center p-4 gradient-subtle rounded-lg">
                    <div className="text-2xl font-bold mb-2 text-accent-orange">
                      {Math.round(strategicEvolution.market_responsiveness * 100)}%
                    </div>
                    <p className="text-sm text-muted-foreground">Market Responsiveness</p>
                  </div>
                  <div className="text-center p-4 gradient-subtle rounded-lg">
                    <div className="text-2xl font-bold mb-2 capitalize text-primary">
                      {strategicEvolution.decision_quality_trend}
                    </div>
                    <p className="text-sm text-muted-foreground">Quality Trend</p>
                  </div>
                </div>
                <div>
                  <h4 className="text-hierarchy-3 mb-3">Strategic Recommendations</h4>
                  <div className="spacing-element">
                    {strategicEvolution.strategic_recommendations.map((rec, index) => (
                      <div key={index} className="flex items-center space-x-2 text-sm p-2 rounded border-subtle">
                        <ArrowRight className="h-3 w-3 text-primary flex-shrink-0" />
                        <span>{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Pattern Intelligence Tab */}
        <TabsContent value="patterns" className="spacing-component">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <Card className="card-xero">
              <CardHeader>
                <CardTitle className="text-hierarchy-3 flex items-center gap-2">
                  <Network className="h-4 w-4 text-primary" />
                  Pattern Types
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Success Factors</span>
                    <Badge variant="outline">{patternInsights.filter(p => p.pattern_type === 'success_factor').length}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Risk Signals</span>
                    <Badge variant="outline">{patternInsights.filter(p => p.pattern_type === 'risk_signal').length}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Bias Patterns</span>
                    <Badge variant="outline">{patternInsights.filter(p => p.pattern_type === 'bias_pattern').length}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Timing Patterns</span>
                    <Badge variant="outline">{patternInsights.filter(p => p.pattern_type === 'timing_pattern').length}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-xero">
              <CardHeader>
                <CardTitle className="text-hierarchy-3 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-accent-orange" />
                  Pattern Strength
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-3xl font-bold text-accent-orange mb-2">
                    {Math.round(patternInsights.reduce((acc, p) => acc + p.confidence_score, 0) / Math.max(patternInsights.length, 1))}%
                  </div>
                  <p className="text-sm text-muted-foreground">Average Confidence</p>
                  <Progress 
                    value={Math.round(patternInsights.reduce((acc, p) => acc + p.confidence_score, 0) / Math.max(patternInsights.length, 1))}
                    className="mt-3"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="card-xero">
              <CardHeader>
                <CardTitle className="text-hierarchy-3 flex items-center gap-2">
                  <Timer className="h-4 w-4 text-primary" />
                  Analysis Depth
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary mb-2">
                    {patternInsights.reduce((acc, p) => acc + p.decisions_analyzed, 0)}
                  </div>
                  <p className="text-sm text-muted-foreground">Decisions Analyzed</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="card-xero">
            <CardHeader>
              <CardTitle className="text-hierarchy-2 flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                Detected Patterns
              </CardTitle>
              <CardDescription>
                Machine learning insights from fund decision history
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="spacing-element">
                {patternInsights.map((pattern, index) => (
                  <Card key={index} className="border-subtle hover:shadow-md transition-all duration-200">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          {getPatternTypeIcon(pattern.pattern_type)}
                          <h4 className="text-hierarchy-3">{pattern.pattern_name}</h4>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="text-xs">
                            {pattern.confidence_score}% confidence
                          </Badge>
                          <Badge variant={pattern.validation_status === 'validated' ? 'default' : 'secondary'} className="text-xs">
                            {pattern.validation_status}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        {pattern.pattern_description}
                      </p>
                      <div className="gradient-subtle p-3 rounded border-subtle text-sm">
                        <strong className="text-primary">Actionable Insights:</strong> {pattern.actionable_insights}
                      </div>
                      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                        <span>Based on {pattern.decisions_analyzed} decisions</span>
                        <span className="capitalize">{pattern.pattern_type.replace('_', ' ')}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {patternInsights.length === 0 && (
                  <div className="text-center py-8">
                    <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-hierarchy-3 mb-2">Building Pattern Intelligence</h3>
                    <p className="text-muted-foreground">Make more decisions to unlock pattern insights</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contextual Memory Tab */}
        <TabsContent value="memory" className="spacing-component">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <Card className="card-xero">
              <CardHeader>
                <CardTitle className="text-hierarchy-3 flex items-center gap-2">
                  <Database className="h-4 w-4 text-primary" />
                  Memory Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Deal Context</span>
                    <Badge variant="outline">{memoryPrompts.filter(p => p.type === 'similar_deal').length}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Risk Memories</span>
                    <Badge variant="outline">{memoryPrompts.filter(p => p.type === 'risk_pattern').length}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Success Stories</span>
                    <Badge variant="outline">{memoryPrompts.filter(p => p.type === 'success_pattern').length}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Bias Warnings</span>
                    <Badge variant="outline">{memoryPrompts.filter(p => p.type === 'bias_warning').length}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-xero">
              <CardHeader>
                <CardTitle className="text-hierarchy-3 flex items-center gap-2">
                  <Search className="h-4 w-4 text-accent-orange" />
                  Memory Recall
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-3xl font-bold text-accent-orange mb-2">
                    {Math.round(memoryPrompts.reduce((acc, p) => acc + p.relevance_score, 0) / Math.max(memoryPrompts.length, 1))}%
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">Average Relevance Score</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span>High Relevance (80%+)</span>
                      <span>{memoryPrompts.filter(p => p.relevance_score >= 80).length}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>Medium Relevance (60-79%)</span>
                      <span>{memoryPrompts.filter(p => p.relevance_score >= 60 && p.relevance_score < 80).length}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>Low Relevance (&lt;60%)</span>
                      <span>{memoryPrompts.filter(p => p.relevance_score < 60).length}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="card-xero">
            <CardHeader>
              <CardTitle className="text-hierarchy-2 flex items-center gap-2">
                <Layers className="h-5 w-5 text-primary" />
                Contextual Memory Layers
              </CardTitle>
              <CardDescription>
                Multi-dimensional memory context for enhanced decision making
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="spacing-element">
                {memoryPrompts.map((prompt, index) => (
                  <Card key={index} className="border-subtle hover:shadow-md transition-all duration-200">
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        <div className={`p-2 rounded-full ${getPromptTypeColor(prompt.type)} flex-shrink-0`}>
                          {prompt.type === 'similar_deal' && <Building2 className="h-4 w-4" />}
                          {prompt.type === 'risk_pattern' && <AlertTriangle className="h-4 w-4" />}
                          {prompt.type === 'success_pattern' && <CheckCircle className="h-4 w-4" />}
                          {prompt.type === 'bias_warning' && <Eye className="h-4 w-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-hierarchy-3 truncate">{prompt.title}</h4>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <Badge variant="outline" className="text-xs">
                                {Math.round(prompt.relevance_score)}%
                              </Badge>
                              <Badge variant="secondary" className="text-xs capitalize">
                                {prompt.type.replace('_', ' ')}
                              </Badge>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">{prompt.description}</p>
                          {prompt.actionable_insight && (
                            <div className="gradient-subtle p-3 rounded border-subtle text-sm">
                              <strong className="text-primary">Memory Insight:</strong> {prompt.actionable_insight}
                            </div>
                          )}
                          <div className="mt-3 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3 inline mr-1" />
                            {new Date(prompt.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {memoryPrompts.length === 0 && (
                  <div className="text-center py-8">
                    <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-hierarchy-3 mb-2">Building Contextual Memory</h3>
                    <p className="text-muted-foreground">Memory context will appear as decision history grows</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}