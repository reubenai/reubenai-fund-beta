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
  ArrowDownRight,
  Search,
  Filter,
  Download,
  Network,
  Cpu,
  LineChart,
  Users,
  MapPin,
  Calendar,
  Star,
  TrendingDown
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
  institutionalIntelligence: {
    successPatterns: {
      pattern: string;
      confidence: number;
      dealCount: number;
      avgReturn: number;
    }[];
    riskSignals: {
      signal: string;
      severity: string;
      frequency: number;
      preventedLosses: number;
    }[];
    sourcingIntelligence: {
      channel: string;
      successRate: number;
      avgDealSize: number;
      recommendedAction: string;
    }[];
    decisionQuality: {
      biasDetected: string;
      correctionSuggestion: string;
      impactLevel: string;
      frequency: number;
    }[];
  };
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
        patternInsights: patterns,
        institutionalIntelligence: generateInstitutionalIntelligence(memories, patterns, interactions)
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

  const generateInstitutionalIntelligence = (memories: any[], patterns: any[], interactions: any[]) => {
    // Mock institutional intelligence data - in production, would be generated by AI analysis
    return {
      successPatterns: [
        { pattern: "B2B SaaS with >$1M ARR in FinTech", confidence: 89, dealCount: 12, avgReturn: 3.4 },
        { pattern: "Second-time founders in AI/ML space", confidence: 84, dealCount: 8, avgReturn: 4.1 },
        { pattern: "Series A companies with enterprise customers", confidence: 78, dealCount: 15, avgReturn: 2.8 },
        { pattern: "Healthcare tech with regulatory approval", confidence: 76, dealCount: 6, avgReturn: 5.2 }
      ],
      riskSignals: [
        { signal: "Single founder without technical co-founder", severity: "high", frequency: 23, preventedLosses: 2400000 },
        { signal: "Market size claims without validation", severity: "medium", frequency: 45, preventedLosses: 1200000 },
        { signal: "No enterprise pilot customers", severity: "medium", frequency: 34, preventedLosses: 800000 },
        { signal: "Unclear path to profitability", severity: "low", frequency: 67, preventedLosses: 400000 }
      ],
      sourcingIntelligence: [
        { channel: "Warm introductions from portfolio CEOs", successRate: 78, avgDealSize: 2500000, recommendedAction: "Increase allocation" },
        { channel: "University tech transfer offices", successRate: 45, avgDealSize: 1200000, recommendedAction: "Maintain current" },
        { channel: "Industry conferences", successRate: 34, avgDealSize: 1800000, recommendedAction: "Reduce allocation" },
        { channel: "Cold outreach", successRate: 12, avgDealSize: 900000, recommendedAction: "Discontinue" }
      ],
      decisionQuality: [
        { biasDetected: "Anchoring bias on initial valuation", correctionSuggestion: "Use multiple valuation methods", impactLevel: "medium", frequency: 28 },
        { biasDetected: "Overconfidence in technical assessment", correctionSuggestion: "Require external technical review", impactLevel: "high", frequency: 15 },
        { biasDetected: "Confirmation bias in market research", correctionSuggestion: "Seek contradictory evidence", impactLevel: "medium", frequency: 22 },
        { biasDetected: "Herding behavior in competitive rounds", correctionSuggestion: "Independent evaluation framework", impactLevel: "low", frequency: 19 }
      ]
    };
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
      case 'medium': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'low': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 85) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (confidence >= 70) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800 border-red-300';
      case 'medium': return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'low': return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="ml-8 space-y-8 p-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-foreground">Institutional Intelligence Dashboard</h1>
            <p className="text-lg text-muted-foreground mt-2">Loading fund memory insights...</p>
          </div>
        </div>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="border-border/60 shadow-sm">
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
      <div className="ml-8 space-y-8 p-8">
        <div>
          <h1 className="text-4xl font-bold text-foreground">Institutional Intelligence Dashboard</h1>
          <p className="text-lg text-muted-foreground mt-2">Please select a fund to view institutional memory insights</p>
        </div>
      </div>
    );
  }

  if (!memoryData) {
    return (
      <div className="ml-8 space-y-8 p-8">
        <div>
          <h1 className="text-4xl font-bold text-foreground">Institutional Intelligence Dashboard</h1>
          <p className="text-lg text-muted-foreground mt-2">No institutional memory data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="ml-8 space-y-8 p-8 bg-gradient-to-br from-background to-primary/5 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-4xl font-bold text-foreground">Institutional Intelligence Dashboard</h1>
            <Badge variant="secondary" className="bg-accent-orange/10 text-accent-orange border-accent-orange/20 font-medium">
              beta
            </Badge>
          </div>
          <p className="text-lg text-muted-foreground">
            AI-powered institutional memory for {selectedFund.name}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            Export Intelligence
          </Button>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40 border-border/60">
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

      {/* Key Intelligence Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/60 shadow-elegant bg-gradient-to-br from-primary/10 to-primary/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-primary">Active Memories</CardTitle>
            <Database className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{memoryData.memoryStats.totalEntries}</div>
            <div className="flex items-center space-x-1 text-sm text-emerald-600 mt-1">
              <ArrowUpRight className="h-4 w-4" />
              <span>{memoryData.memoryStats.activeMemories} high-value insights</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-elegant">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold">Decision Quality</CardTitle>
            <Brain className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{memoryData.performanceImpact.consistencyScore}%</div>
            <div className="flex items-center space-x-1 text-sm text-emerald-600 mt-1">
              <Target className="h-4 w-4" />
              <span>Consistency score</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-elegant">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold">Intelligence Boost</CardTitle>
            <Zap className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">+{memoryData.performanceImpact.accuracyImprovement}%</div>
            <div className="flex items-center space-x-1 text-sm text-emerald-600 mt-1">
              <Sparkles className="h-4 w-4" />
              <span>Analysis accuracy</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-elegant">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold">Processing Speed</CardTitle>
            <Cpu className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">+{memoryData.performanceImpact.speedImprovement}%</div>
            <div className="flex items-center space-x-1 text-sm text-emerald-600 mt-1">
              <Clock className="h-4 w-4" />
              <span>Faster insights</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for detailed intelligence views */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-muted/50">
          <TabsTrigger value="overview" className="font-medium">Intelligence Overview</TabsTrigger>
          <TabsTrigger value="patterns" className="font-medium">Success Patterns</TabsTrigger>
          <TabsTrigger value="risks" className="font-medium">Risk Intelligence</TabsTrigger>
          <TabsTrigger value="decisions" className="font-medium">Decision Quality</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-border/60 shadow-elegant">
              <CardHeader>
                <CardTitle className="text-xl font-semibold">Memory Intelligence Categories</CardTitle>
                <CardDescription>Knowledge distribution and impact assessment</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {memoryData.memoryCategories.slice(0, 6).map((category) => (
                    <div key={category.category} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-full bg-gradient-primary" />
                        <span className="font-medium">{category.category}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground">{category.count} entries</span>
                        <Badge className={getConfidenceColor(category.avgConfidence)}>
                          {category.avgConfidence.toFixed(0)}%
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/60 shadow-elegant">
              <CardHeader>
                <CardTitle className="text-xl font-semibold">AI Service Intelligence</CardTitle>
                <CardDescription>Memory-enhanced service performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {memoryData.aiServicePerformance.slice(0, 5).map((service, index) => (
                    <div key={service.service} className="flex items-center justify-between p-3 rounded-lg border border-border/50">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="w-8 h-8 rounded-full p-0 flex items-center justify-center font-bold">
                          {index + 1}
                        </Badge>
                        <div>
                          <p className="font-medium">{service.service}</p>
                          <p className="text-sm text-muted-foreground">{service.memoriesUsed} memory contexts used</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={getConfidenceColor(service.avgAccuracy)}>
                          {service.avgAccuracy.toFixed(0)}%
                        </Badge>
                        <p className="text-xs text-emerald-600 mt-1">+{service.improvementRate.toFixed(0)}% improvement</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="patterns" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-border/60 shadow-elegant">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl font-semibold">
                  <Star className="h-5 w-5 text-amber-500" />
                  Success Investment Patterns
                </CardTitle>
                <CardDescription>AI-identified patterns correlating with high returns</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {memoryData.institutionalIntelligence.successPatterns.map((pattern, index) => (
                    <div key={index} className="p-4 rounded-lg border border-emerald-200 bg-emerald-50/50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-emerald-800">{pattern.pattern}</span>
                        <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300">
                          {pattern.confidence}% confidence
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-emerald-700">
                        <span>{pattern.dealCount} deals</span>
                        <span>•</span>
                        <span>{pattern.avgReturn}x avg return</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/60 shadow-elegant">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl font-semibold">
                  <Network className="h-5 w-5 text-primary" />
                  Sourcing Intelligence
                </CardTitle>
                <CardDescription>Channel effectiveness and recommendations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {memoryData.institutionalIntelligence.sourcingIntelligence.map((channel, index) => (
                    <div key={index} className="p-4 rounded-lg border border-border/50 bg-background/50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{channel.channel}</span>
                        <Badge variant={channel.recommendedAction === 'Increase allocation' ? 'default' : 
                                      channel.recommendedAction === 'Maintain current' ? 'secondary' : 'destructive'}>
                          {channel.recommendedAction}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{channel.successRate}% success rate</span>
                        <span>•</span>
                        <span>${(channel.avgDealSize / 1000000).toFixed(1)}M avg size</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="risks" className="space-y-6">
          <Card className="border-border/60 shadow-elegant">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl font-semibold">
                <AlertCircle className="h-5 w-5 text-red-500" />
                Risk Signal Intelligence
              </CardTitle>
              <CardDescription>AI-identified patterns that correlate with poor outcomes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {memoryData.institutionalIntelligence.riskSignals.map((signal, index) => (
                  <div key={index} className="p-4 rounded-lg border border-red-200 bg-red-50/30">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-semibold text-red-800">{signal.signal}</span>
                      <Badge className={getSeverityColor(signal.severity)}>
                        {signal.severity} risk
                      </Badge>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Frequency:</span>
                        <span className="font-medium">{signal.frequency} occurrences</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Prevented losses:</span>
                        <span className="font-medium text-emerald-600">${(signal.preventedLosses / 1000000).toFixed(1)}M</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="decisions" className="space-y-6">
          <Card className="border-border/60 shadow-elegant">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl font-semibold">
                <Brain className="h-5 w-5 text-purple-500" />
                Decision Quality Intelligence
              </CardTitle>
              <CardDescription>Bias detection and decision improvement recommendations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {memoryData.institutionalIntelligence.decisionQuality.map((bias, index) => (
                  <div key={index} className="p-4 rounded-lg border border-purple-200 bg-purple-50/30">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-semibold text-purple-800">{bias.biasDetected}</span>
                      <Badge className={getImpactColor(bias.impactLevel)}>
                        {bias.impactLevel} impact
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm text-purple-700 font-medium">
                        Recommendation: {bias.correctionSuggestion}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Detected {bias.frequency} times this period
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