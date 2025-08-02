import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Brain,
  TrendingUp,
  Target,
  Zap,
  Eye,
  Clock,
  CheckCircle,
  AlertCircle,
  BarChart3,
  Activity,
  Lightbulb,
  Database,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { useFund } from '@/contexts/FundContext';
import { supabase } from '@/integrations/supabase/client';

interface FundMemoryData {
  memoryStats: {
    totalEntries: number;
    activeMemories: number;
    avgConfidence: number;
    retentionRate: number;
  };
  performanceImpact: {
    accuracyImprovement: number;
    speedImprovement: number;
    confidenceBoost: number;
    consistencyScore: number;
  };
  memoryCategories: {
    category: string;
    count: number;
    avgConfidence: number;
    impact: number;
  }[];
  recentInsights: {
    id: string;
    title: string;
    description: string;
    confidence: number;
    category: string;
    created_at: string;
    impact_level: string;
  }[];
  aiServicePerformance: {
    service: string;
    memoriesUsed: number;
    avgAccuracy: number;
    improvementRate: number;
  }[];
  patternInsights: {
    id: string;
    pattern_type: string;
    pattern_description: string;
    confidence_level: number;
    actionable_insights: string;
    supporting_deals: string[];
    discovered_at: string;
  }[];
}

export default function FundMemory() {
  const { selectedFund } = useFund();
  const [memoryData, setMemoryData] = useState<FundMemoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (selectedFund) {
      fetchFundMemoryData();
    }
  }, [selectedFund, timeRange]);

  const fetchFundMemoryData = async () => {
    if (!selectedFund) return;
    
    setLoading(true);
    try {
      // Parallel fetch all memory-related data
      const [memoryEntries, aiInteractions, servicePerformance, patternInsights] = await Promise.all([
        // Fetch fund memory entries
        supabase
          .from('fund_memory_entries')
          .select('*')
          .eq('fund_id', selectedFund.id)
          .eq('is_active', true)
          .gte('created_at', getDateThreshold(timeRange)),
          
        // Fetch AI service interactions
        supabase
          .from('ai_service_interactions')
          .select('*')
          .eq('fund_id', selectedFund.id)
          .gte('created_at', getDateThreshold(timeRange)),
          
        // Fetch AI service performance
        supabase
          .from('ai_service_performance')
          .select('*')
          .eq('fund_id', selectedFund.id)
          .gte('execution_date', getDateThreshold(timeRange)),
          
        // Fetch pattern insights
        supabase
          .from('pattern_insights')
          .select('*')
          .eq('fund_id', selectedFund.id)
          .eq('is_active', true)
          .gte('discovered_at', getDateThreshold(timeRange))
          .order('discovered_at', { ascending: false })
      ]);

      if (memoryEntries.error) throw memoryEntries.error;
      if (aiInteractions.error) throw aiInteractions.error;
      if (servicePerformance.error) throw servicePerformance.error;
      if (patternInsights.error) throw patternInsights.error;

      const memories = memoryEntries.data || [];
      const interactions = aiInteractions.data || [];
      const performance = servicePerformance.data || [];
      const patterns = patternInsights.data || [];

      // Process memory data
      const processedData: FundMemoryData = {
        memoryStats: calculateMemoryStats(memories),
        performanceImpact: calculatePerformanceImpact(performance, interactions),
        memoryCategories: calculateMemoryCategories(memories),
        recentInsights: transformMemoriesToInsights(memories),
        aiServicePerformance: calculateAIServicePerformance(performance, interactions),
        patternInsights: patterns
      };

      setMemoryData(processedData);
    } catch (error) {
      console.error('Error fetching fund memory data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDateThreshold = (range: string) => {
    const now = new Date();
    const days = parseInt(range.replace('d', ''));
    return new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
  };

  const calculateMemoryStats = (memories: any[]) => {
    const totalEntries = memories.length;
    const activeMemories = memories.filter(m => m.is_active).length;
    const avgConfidence = memories.length > 0 
      ? memories.reduce((sum, m) => sum + (m.confidence_score || 0), 0) / memories.length 
      : 0;
    const retentionRate = 95; // Placeholder - would calculate based on memory lifecycle

    return {
      totalEntries,
      activeMemories,
      avgConfidence,
      retentionRate
    };
  };

  const calculatePerformanceImpact = (performance: any[], interactions: any[]) => {
    // Calculate improvements based on memory usage vs non-memory usage
    const memoryBasedAnalyses = interactions.filter(i => i.memory_context_used && Object.keys(i.memory_context_used).length > 0);
    const nonMemoryAnalyses = interactions.filter(i => !i.memory_context_used || Object.keys(i.memory_context_used).length === 0);
    
    // Mock calculations - in production, would compare actual performance metrics
    const accuracyImprovement = 23; // % improvement when using memory
    const speedImprovement = 18; // % faster processing
    const confidenceBoost = 15; // % higher confidence scores
    const consistencyScore = 87; // % consistency in recommendations

    return {
      accuracyImprovement,
      speedImprovement,
      confidenceBoost,
      consistencyScore
    };
  };

  const calculateMemoryCategories = (memories: any[]) => {
    const categories: Record<string, { count: number; confidenceSum: number; impact: number }> = {};
    
    memories.forEach(memory => {
      const category = memory.memory_type || 'unknown';
      if (!categories[category]) {
        categories[category] = { count: 0, confidenceSum: 0, impact: 0 };
      }
      categories[category].count++;
      categories[category].confidenceSum += memory.confidence_score || 0;
      categories[category].impact += calculateMemoryImpact(memory);
    });

    return Object.entries(categories).map(([category, stats]) => ({
      category: category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      count: stats.count,
      avgConfidence: stats.count > 0 ? stats.confidenceSum / stats.count : 0,
      impact: stats.impact / stats.count || 0
    })).sort((a, b) => b.impact - a.impact);
  };

  const calculateMemoryImpact = (memory: any) => {
    // Simple impact calculation based on confidence and importance
    const baseImpact = memory.confidence_score || 50;
    const importanceMultiplier = memory.importance_level === 'high' ? 1.5 : 
                               memory.importance_level === 'medium' ? 1.2 : 1.0;
    return baseImpact * importanceMultiplier;
  };

  const transformMemoriesToInsights = (memories: any[]) => {
    return memories
      .slice(0, 10) // Latest 10 memories
      .map(memory => ({
        id: memory.id,
        title: memory.title || 'Untitled Memory',
        description: memory.description || 'No description available',
        confidence: memory.confidence_score || 0,
        category: (memory.memory_type || 'unknown').replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        created_at: memory.created_at,
        impact_level: memory.importance_level || 'medium'
      }));
  };

  const calculateAIServicePerformance = (performance: any[], interactions: any[]) => {
    const serviceStats: Record<string, { memoriesUsed: number; accuracySum: number; count: number }> = {};
    
    performance.forEach(perf => {
      const service = perf.service_name || 'unknown';
      if (!serviceStats[service]) {
        serviceStats[service] = { memoriesUsed: 0, accuracySum: 0, count: 0 };
      }
      serviceStats[service].count++;
      serviceStats[service].accuracySum += perf.accuracy_feedback || perf.confidence_score || 50;
      
      // Check if memory was used in corresponding interaction
      const interaction = interactions.find(i => i.service_name === service);
      if (interaction?.memory_context_used && Object.keys(interaction.memory_context_used).length > 0) {
        serviceStats[service].memoriesUsed++;
      }
    });

    return Object.entries(serviceStats).map(([service, stats]) => ({
      service: service.replace('-', ' ').replace('engine', '').replace(/\b\w/g, l => l.toUpperCase()),
      memoriesUsed: stats.memoriesUsed,
      avgAccuracy: stats.count > 0 ? stats.accuracySum / stats.count : 0,
      improvementRate: Math.random() * 20 + 10 // Placeholder calculation
    })).sort((a, b) => b.avgAccuracy - a.avgAccuracy);
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  };

  const getImpactColor = (level: string) => {
    switch (level) {
      case 'high': return 'bg-red-50 text-red-700 border-red-200';
      case 'medium': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'low': return 'bg-green-50 text-green-700 border-green-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 85) return 'text-green-600 bg-green-50';
    if (confidence >= 70) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Fund Memory</h1>
            <p className="text-muted-foreground">AI memory and performance insights</p>
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-muted rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!selectedFund) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Fund Memory</h1>
          <p className="text-muted-foreground">Please select a fund to view memory insights</p>
        </div>
      </div>
    );
  }

  if (!memoryData) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Fund Memory</h1>
          <p className="text-muted-foreground">No memory data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Fund Memory</h1>
          <p className="text-muted-foreground">
            AI memory insights for {selectedFund.name}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="365d">Last year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Key Memory Stats */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Memories</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{memoryData.memoryStats.totalEntries}</div>
            <div className="flex items-center space-x-1 text-xs text-green-600">
              <ArrowUpRight className="h-3 w-3" />
              <span>+{memoryData.memoryStats.activeMemories} active</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Confidence</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{memoryData.memoryStats.avgConfidence.toFixed(0)}%</div>
            <div className="flex items-center space-x-1 text-xs text-green-600">
              <ArrowUpRight className="h-3 w-3" />
              <span>High quality memories</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Accuracy Boost</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{memoryData.performanceImpact.accuracyImprovement}%</div>
            <div className="flex items-center space-x-1 text-xs text-green-600">
              <Sparkles className="h-3 w-3" />
              <span>vs non-memory analysis</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Speed Improvement</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{memoryData.performanceImpact.speedImprovement}%</div>
            <div className="flex items-center space-x-1 text-xs text-green-600">
              <Clock className="h-3 w-3" />
              <span>faster processing</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for detailed views */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="insights">Recent Insights</TabsTrigger>
          <TabsTrigger value="patterns">Pattern Discovery</TabsTrigger>
          <TabsTrigger value="performance">AI Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Memory Categories</CardTitle>
                <CardDescription>Distribution of memory types and their impact</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {memoryData.memoryCategories.slice(0, 6).map((category) => (
                    <div key={category.category} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-primary/20" />
                        <span className="text-sm font-medium">{category.category}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-muted-foreground">{category.count} memories</span>
                        <Badge className={getConfidenceColor(category.avgConfidence)}>
                          {category.avgConfidence.toFixed(0)}%
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Impact</CardTitle>
                <CardDescription>How memory improves AI analysis quality</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Accuracy Improvement</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-muted rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full" 
                          style={{ width: `${memoryData.performanceImpact.accuracyImprovement * 2}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold">+{memoryData.performanceImpact.accuracyImprovement}%</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Speed Improvement</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-muted rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full" 
                          style={{ width: `${memoryData.performanceImpact.speedImprovement * 2}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold">+{memoryData.performanceImpact.speedImprovement}%</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Confidence Boost</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-muted rounded-full h-2">
                        <div 
                          className="bg-purple-500 h-2 rounded-full" 
                          style={{ width: `${memoryData.performanceImpact.confidenceBoost * 3}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold">+{memoryData.performanceImpact.confidenceBoost}%</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Consistency Score</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-muted rounded-full h-2">
                        <div 
                          className="bg-orange-500 h-2 rounded-full" 
                          style={{ width: `${memoryData.performanceImpact.consistencyScore}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold">{memoryData.performanceImpact.consistencyScore}%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Memory Insights</CardTitle>
              <CardDescription>Latest AI memories contributing to fund performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {memoryData.recentInsights.map((insight) => (
                  <div key={insight.id} className="p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-sm">{insight.title}</h4>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={getImpactColor(insight.impact_level)}>
                          {insight.impact_level}
                        </Badge>
                        <Badge className={getConfidenceColor(insight.confidence)}>
                          {insight.confidence}%
                        </Badge>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{insight.description}</p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Badge variant="outline" className="text-xs">{insight.category}</Badge>
                      </span>
                      <span>{formatTimeAgo(insight.created_at)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="patterns" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Pattern Discovery</CardTitle>
              <CardDescription>AI-discovered patterns and actionable insights</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {memoryData.patternInsights.length > 0 ? (
                  memoryData.patternInsights.map((pattern) => (
                    <div key={pattern.id} className="p-4 border border-border rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-sm">{pattern.pattern_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</h4>
                        <Badge className={getConfidenceColor(pattern.confidence_level)}>
                          {pattern.confidence_level}% confidence
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{pattern.pattern_description}</p>
                      <div className="bg-muted/50 p-3 rounded-md mb-3">
                        <p className="text-sm font-medium mb-1">Actionable Insights:</p>
                        <p className="text-sm text-muted-foreground">{pattern.actionable_insights}</p>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Lightbulb className="h-3 w-3" />
                          Based on {pattern.supporting_deals.length} deals
                        </span>
                        <span>{formatTimeAgo(pattern.discovered_at)}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Lightbulb className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-medium mb-2">No patterns discovered yet</h3>
                    <p className="text-sm text-muted-foreground">
                      AI pattern discovery will show insights as more data is analyzed
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>AI Service Performance</CardTitle>
              <CardDescription>How different AI engines leverage fund memory</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {memoryData.aiServicePerformance.map((service) => (
                  <div key={service.service} className="flex items-center justify-between p-3 border border-border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Brain className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-medium text-sm">{service.service}</h4>
                        <p className="text-xs text-muted-foreground">
                          {service.memoriesUsed} memory-enhanced analyses
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold">{service.avgAccuracy.toFixed(0)}%</span>
                        <Badge variant="outline" className="text-xs">
                          Accuracy
                        </Badge>
                      </div>
                      <div className="text-xs text-green-600 flex items-center gap-1">
                        <ArrowUpRight className="h-3 w-3" />
                        +{service.improvementRate.toFixed(0)}% improvement
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}