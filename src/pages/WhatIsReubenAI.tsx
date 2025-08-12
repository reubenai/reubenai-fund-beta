import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Layout } from '@/components/Layout';
// Breadcrumbs removed - using Layout breadcrumbs
import { 
  ArrowLeft, 
  Brain, 
  Target, 
  Users, 
  BarChart3, 
  FileText, 
  Zap, 
  CheckCircle, 
  Clock, 
  TrendingUp,
  Building2,
  Shield,
  Lightbulb,
  DollarSign,
  Search,
  MessageSquare,
  GitBranch,
  Cog,
  Calculator,
  Eye,
  AlertTriangle,
  Info,
  Gauge
} from 'lucide-react';
import { Link } from 'react-router-dom';

const WhatIsReubenAI = () => {
  const [selectedFeature, setSelectedFeature] = useState('deal-sourcing');

  const liveFeatures = [
    {
      id: 'investment-strategy',
      title: 'Investment Strategy Configuration',
      icon: Target,
      description: 'Define sophisticated investment criteria and thresholds',
      details: 'Configure your fund\'s investment focus, criteria weights, and decision thresholds with our intelligent strategy builder.',
      status: 'live'
    },
    {
      id: 'deal-pipeline',
      title: 'Deal Pipeline Management',
      icon: TrendingUp,
      description: 'Complete deal flow management with AI-powered insights',
      details: 'Track deals through your investment process with automated stage progression and comprehensive deal analysis.',
      status: 'live'
    },
    {
      id: 'ai-analysis',
      title: 'ReubenAI Analysis Engine',
      icon: Brain,
      description: 'Multi-dimensional AI analysis with web research',
      details: 'Get deep company, market, team, and competitive analysis powered by our proprietary AI orchestrator with real-time web research.',
      status: 'live'
    },
    {
      id: 'fund-memory',
      title: 'Fund Memory System',
      icon: FileText,
      description: 'Contextual AI memory for institutional knowledge',
      details: 'Build and query your fund\'s institutional knowledge base with AI-powered memory that learns from every interaction.',
      status: 'live'
    }
  ];

  const comingSoonFeatures = [
    {
      title: 'Investment Committee Portal',
      icon: Users,
      description: 'Full IC workflow with collaborative decision-making',
      eta: 'Q4 2025'
    },
    {
      title: 'Enhanced Analytics Dashboard',
      icon: BarChart3,
      description: 'Advanced portfolio analytics and performance tracking',
      eta: 'Q1 2026'
    },
    {
      title: 'Fund Administration Suite',
      icon: Building2,
      description: 'Complete fund operations and LP management',
      eta: 'Q2 2026'
    },
    {
      title: 'Help & Documentation',
      icon: MessageSquare,
      description: 'Comprehensive help system and user guides',
      eta: 'Q4 2025'
    }
  ];

  const targetAudience = [
    {
      icon: Building2,
      title: 'Venture Capital Funds',
      description: 'Early-stage to growth equity funds looking to scale deal sourcing and analysis capabilities.'
    },
    {
      icon: DollarSign,
      title: 'Private Equity Firms',
      description: 'PE firms seeking data-driven insights for middle-market and buyout opportunities.'
    },
    {
      icon: Users,
      title: 'Family Offices',
      description: 'Sophisticated family offices managing direct investment programs.'
    },
    {
      icon: TrendingUp,
      title: 'Corporate Venture',
      description: 'Corporate venture arms and strategic investment teams.'
    }
  ];

  const valueProps = [
    {
      icon: Brain,
      title: 'AI-First Investment Intelligence',
      description: 'Proprietary AI orchestrator that combines market research, company analysis, and strategic alignment in real-time.'
    },
    {
      icon: Shield,
      title: 'Institutional-Grade Security',
      description: 'Enterprise security with role-based access, audit trails, and data encryption for sensitive investment data.'
    },
    {
      icon: Zap,
      title: '10x Efficiency Gains',
      description: 'Automate 80% of initial deal screening and research, letting teams focus on high-value relationship building.'
    },
    {
      icon: Target,
      title: 'Strategy-Driven Sourcing',
      description: 'AI that learns your investment thesis and automatically surfaces deals aligned with your fund\'s unique criteria.'
    }
  ];

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-12 px-6">
        
        {/* Hero Section */}
        <div className="text-center space-y-8">
          <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary/80 rounded-3xl flex items-center justify-center mx-auto shadow-lg">
            <span className="text-3xl font-bold text-primary-foreground">R</span>
          </div>
          <div className="space-y-6">
            <h1 className="text-5xl font-bold text-foreground tracking-tight">
              The AI-Native Investment Platform
            </h1>
            <p className="text-xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
              ReubenAI transforms how venture capital and private equity firms source, analyze, and decide on investments. 
              Our proprietary AI orchestrator delivers institutional-grade intelligence that scales with your fund's growth.
            </p>
          </div>
        </div>

        {/* Who It's For */}
        <div className="space-y-8">
          <h2 className="text-3xl font-bold text-center text-foreground">Built for Investment Professionals</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {targetAudience.map((audience, index) => (
              <Card key={index} className="text-center border-border/50 hover:border-primary/20 hover:shadow-lg transition-all duration-300">
                <CardContent className="p-6">
                  <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <audience.icon className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-3">{audience.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{audience.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Value Proposition */}
        <div className="space-y-8">
          <h2 className="text-3xl font-bold text-center text-foreground">Why Choose ReubenAI</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {valueProps.map((value, index) => (
              <Card key={index} className="border-border/50 hover:border-primary/20 hover:shadow-lg transition-all duration-300">
                <CardContent className="p-8">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                      <value.icon className="h-7 w-7 text-primary" />
                    </div>
                    <div className="space-y-3">
                      <h3 className="text-xl font-semibold text-foreground">{value.title}</h3>
                      <p className="text-muted-foreground leading-relaxed">{value.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Features Section */}
        <div className="space-y-10">
          <h2 className="text-3xl font-bold text-center text-foreground">Platform Capabilities</h2>
          
          {/* Live Features */}
          <div className="space-y-8">
            <div className="flex items-center justify-center gap-3">
              <h3 className="text-2xl font-semibold text-foreground">Available Now</h3>
              <Badge variant="default" className="bg-green-500/10 text-green-700 border-green-200 px-3 py-1">
                <CheckCircle className="h-4 w-4 mr-2" />
                Live in Production
              </Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {liveFeatures.map((feature) => (
                <Card key={feature.id} className="border-border/50 hover:border-primary/20 hover:shadow-lg transition-all duration-300">
                  <CardContent className="p-8">
                    <div className="flex items-start gap-6">
                      <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                        <feature.icon className="h-7 w-7 text-primary" />
                      </div>
                      <div className="flex-1 space-y-4">
                        <div className="space-y-2">
                          <h4 className="text-xl font-semibold text-foreground">{feature.title}</h4>
                          <p className="text-muted-foreground">{feature.description}</p>
                        </div>
                        <p className="text-sm text-muted-foreground/80 leading-relaxed">{feature.details}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Coming Soon */}
          <div className="space-y-8">
            <div className="flex items-center justify-center gap-3">
              <h3 className="text-2xl font-semibold text-foreground">Product Roadmap</h3>
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 px-3 py-1">
                <Clock className="h-4 w-4 mr-2" />
                In Development
              </Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {comingSoonFeatures.map((feature, index) => (
                <Card key={index} className="border-border/50 bg-muted/20 hover:bg-muted/30 transition-all duration-300">
                  <CardContent className="p-8">
                    <div className="flex items-start gap-6">
                      <div className="w-14 h-14 bg-muted/50 rounded-xl flex items-center justify-center flex-shrink-0">
                        <feature.icon className="h-7 w-7 text-muted-foreground" />
                      </div>
                      <div className="flex-1 space-y-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <h4 className="text-xl font-semibold text-foreground">{feature.title}</h4>
                            <Badge variant="outline" className="bg-muted/50 text-muted-foreground border-muted">
                              {feature.eta}
                            </Badge>
                          </div>
                          <p className="text-muted-foreground">{feature.description}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Deal Scoring & AI Orchestration Section */}
        <div className="space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold text-foreground">Deal Scoring & AI Orchestration</h2>
            <p className="text-lg text-muted-foreground max-w-4xl mx-auto leading-relaxed">
              Understand how ReubenAI's proprietary scoring engine transforms your investment thesis into 
              intelligent, data-driven deal recommendations with full transparency.
            </p>
          </div>

          {/* AI Orchestration Overview */}
          <Card className="border-border/50">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                  <GitBranch className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-2xl">AI Orchestration Hub</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-muted-foreground leading-relaxed">
                The ReubenAI Orchestrator acts as your fund's central intelligence hub, coordinating between 
                specialized AI engines to deliver comprehensive deal analysis tailored to your investment strategy.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center space-y-3">
                  <div className="w-14 h-14 bg-blue-500/10 rounded-xl flex items-center justify-center mx-auto">
                    <Search className="h-7 w-7 text-blue-600" />
                  </div>
                  <h4 className="font-semibold text-foreground">Research Engines</h4>
                  <p className="text-sm text-muted-foreground">Market, team, financial, and competitive intelligence</p>
                </div>
                <div className="text-center space-y-3">
                  <div className="w-14 h-14 bg-green-500/10 rounded-xl flex items-center justify-center mx-auto">
                    <Calculator className="h-7 w-7 text-green-600" />
                  </div>
                  <h4 className="font-semibold text-foreground">Scoring Engine</h4>
                  <p className="text-sm text-muted-foreground">Strategy-driven weighted analysis and RAG calculation</p>
                </div>
                <div className="text-center space-y-3">
                  <div className="w-14 h-14 bg-purple-500/10 rounded-xl flex items-center justify-center mx-auto">
                    <FileText className="h-7 w-7 text-purple-600" />
                  </div>
                  <h4 className="font-semibold text-foreground">Memory System</h4>
                  <p className="text-sm text-muted-foreground">Contextual learning and institutional knowledge</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Strategy Configuration Flow */}
          <Card className="border-border/50">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Cog className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-2xl">Investment Strategy Configuration</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-8">
              <p className="text-muted-foreground leading-relaxed">
                Configure your fund's unique investment thesis through our intelligent strategy builder, 
                defining criteria weights, thresholds, and preferences that power our scoring algorithms.
              </p>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <h4 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    6-Category Scoring Framework
                  </h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <span className="text-sm font-medium">Team & Leadership</span>
                      <Badge variant="outline">20%</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <span className="text-sm font-medium">Market Opportunity</span>
                      <Badge variant="outline">18%</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <span className="text-sm font-medium">Product & Technology</span>
                      <Badge variant="outline">17%</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <span className="text-sm font-medium">Business Traction</span>
                      <Badge variant="outline">16%</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <span className="text-sm font-medium">Financial Health</span>
                      <Badge variant="outline">15%</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <span className="text-sm font-medium">Strategic Fit</span>
                      <Badge variant="outline">14%</Badge>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <h4 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <Gauge className="h-5 w-5 text-primary" />
                    RAG Thresholds
                  </h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-green-500/10 rounded-lg border border-green-200/20">
                      <span className="text-sm font-medium">Exciting (Green)</span>
                      <Badge className="bg-green-500/20 text-green-700 border-green-200">≥85</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-yellow-500/10 rounded-lg border border-yellow-200/20">
                      <span className="text-sm font-medium">Promising (Amber)</span>
                      <Badge className="bg-yellow-500/20 text-yellow-700 border-yellow-200">70-84</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-red-500/10 rounded-lg border border-red-200/20">
                      <span className="text-sm font-medium">Needs Development (Red)</span>
                      <Badge className="bg-red-500/20 text-red-700 border-red-200">50-69</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Deal Scoring Engine */}
          <Card className="border-border/50">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Brain className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-2xl">Multi-Dimensional Scoring Engine</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="flex items-center gap-2 mb-6">
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                  Beta Feature
                </Badge>
                <p className="text-sm text-muted-foreground">Analysis depth currently limited during beta</p>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                Our scoring engine analyzes deals across six core dimensions, applying your fund's custom weights 
                and criteria to generate objective, comparable scores with confidence indicators.
              </p>

              {/* Scoring Process Flow Diagram */}
              <div className="bg-muted/20 rounded-xl p-6">
                <h4 className="text-lg font-semibold text-foreground mb-6 text-center">Scoring Process Flow</h4>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                  <div className="text-center space-y-2">
                    <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mx-auto">
                      <FileText className="h-6 w-6 text-blue-600" />
                    </div>
                    <p className="text-xs font-medium">Deal Input</p>
                  </div>
                  <div className="hidden md:flex justify-center">
                    <ArrowLeft className="h-4 w-4 text-muted-foreground rotate-180" />
                  </div>
                  <div className="text-center space-y-2">
                    <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center mx-auto">
                      <Search className="h-6 w-6 text-purple-600" />
                    </div>
                    <p className="text-xs font-medium">AI Research</p>
                  </div>
                  <div className="hidden md:flex justify-center">
                    <ArrowLeft className="h-4 w-4 text-muted-foreground rotate-180" />
                  </div>
                  <div className="text-center space-y-2">
                    <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center mx-auto">
                      <Calculator className="h-6 w-6 text-green-600" />
                    </div>
                    <p className="text-xs font-medium">Weighted Score</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Case Study */}
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
                  <Eye className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-2xl">Case Study: CleanTech Solutions</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Company Overview */}
                <div className="space-y-6">
                  <h4 className="text-lg font-semibold text-foreground">Company Overview</h4>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-background/60 rounded-lg">
                      <span className="text-sm font-medium">Company</span>
                      <span className="text-sm">CleanTech Solutions</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-background/60 rounded-lg">
                      <span className="text-sm font-medium">Industry</span>
                      <span className="text-sm">Solar Energy Optimization</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-background/60 rounded-lg">
                      <span className="text-sm font-medium">Location</span>
                      <span className="text-sm">Austin, TX</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-background/60 rounded-lg">
                      <span className="text-sm font-medium">Deal Size</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">$500K</span>
                        <div title="Below fund minimum">
                          <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Scoring Breakdown */}
                <div className="space-y-6">
                  <h4 className="text-lg font-semibold text-foreground">Score Breakdown</h4>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Team & Leadership</span>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">40%</Badge>
                          <div title="Limited founder information">
                            <Info className="h-3 w-3 text-blue-500" />
                          </div>
                          <div className="w-16 h-2 bg-muted rounded-full">
                            <div className="w-[40%] h-2 bg-red-500 rounded-full"></div>
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">Missing key founder background data</p>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Market Opportunity</span>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">72%</Badge>
                          <div className="w-16 h-2 bg-muted rounded-full">
                            <div className="w-[72%] h-2 bg-yellow-500 rounded-full"></div>
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">Strong renewable energy market, growing demand</p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Product & Technology</span>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-green-500/20 text-green-700 border-green-200">88%</Badge>
                          <div className="w-16 h-2 bg-muted rounded-full">
                            <div className="w-[88%] h-2 bg-green-500 rounded-full"></div>
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">Strong IP portfolio, validated technology moat</p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Business Traction</span>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">58%</Badge>
                          <div className="w-16 h-2 bg-muted rounded-full">
                            <div className="w-[58%] h-2 bg-yellow-500 rounded-full"></div>
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">Early revenue traction, needs more validation</p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Financial Health</span>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">45%</Badge>
                          <div className="w-16 h-2 bg-muted rounded-full">
                            <div className="w-[45%] h-2 bg-red-500 rounded-full"></div>
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">Limited financial data and transparency</p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Strategic Fit</span>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">38%</Badge>
                          <div title="Deal size below threshold">
                            <AlertTriangle className="h-3 w-3 text-yellow-600" />
                          </div>
                          <div className="w-16 h-2 bg-muted rounded-full">
                            <div className="w-[38%] h-2 bg-red-500 rounded-full"></div>
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">Sector alignment good, but deal size concerns</p>
                    </div>
                  </div>

                  {/* Final Score */}
                  <div className="border-t border-border/50 pt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold">Overall Score</span>
                      <div className="flex items-center gap-3">
                        <Badge className="bg-red-500/20 text-red-700 border-red-200 px-3 py-1 text-base">
                          56 - Needs Development
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Key Insights */}
              <div className="bg-background/60 rounded-lg p-6 space-y-4">
                <h4 className="text-lg font-semibold text-foreground">AI Insights & Recommendations</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h5 className="font-medium text-green-700">Strengths</h5>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Strong IP portfolio with validated solar optimization technology</li>
                      <li>• Geographic alignment with Austin tech ecosystem</li>
                      <li>• Growing renewable energy market opportunity</li>
                    </ul>
                  </div>
                  <div className="space-y-3">
                    <h5 className="font-medium text-red-700">Areas of Concern</h5>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Deal size below fund's minimum investment criteria</li>
                      <li>• Limited founder and management team information</li>
                      <li>• Insufficient financial validation data</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Transparency Features */}
          <Card className="border-border/50">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-2xl">Transparency & Confidence</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-2 mb-6">
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                  Enhanced in Production
                </Badge>
                <p className="text-sm text-muted-foreground">Full transparency features available with paid access</p>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                Every score comes with full transparency into data sources, confidence levels, and reasoning, 
                building trust in AI recommendations while highlighting areas that need human validation.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center space-y-3">
                  <div className="w-14 h-14 bg-blue-500/10 rounded-xl flex items-center justify-center mx-auto">
                    <Info className="h-7 w-7 text-blue-600" />
                  </div>
                  <h4 className="font-semibold text-foreground">Data Source Tracking</h4>
                  <p className="text-sm text-muted-foreground">Every data point linked to its source with validation status</p>
                </div>
                <div className="text-center space-y-3">
                  <div className="w-14 h-14 bg-green-500/10 rounded-xl flex items-center justify-center mx-auto">
                    <Gauge className="h-7 w-7 text-green-600" />
                  </div>
                  <h4 className="font-semibold text-foreground">Confidence Scores</h4>
                  <p className="text-sm text-muted-foreground">40-95% confidence ranges help assess data reliability</p>
                </div>
                <div className="text-center space-y-3">
                  <div className="w-14 h-14 bg-purple-500/10 rounded-xl flex items-center justify-center mx-auto">
                    <Brain className="h-7 w-7 text-purple-600" />
                  </div>
                  <h4 className="font-semibold text-foreground">AI Reasoning</h4>
                  <p className="text-sm text-muted-foreground">Clear explanations for every score and recommendation</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 shadow-xl">
          <CardContent className="p-12 text-center space-y-8">
            <div className="space-y-4">
              <h3 className="text-3xl font-bold text-foreground">Ready to Transform Your Investment Process?</h3>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Join leading VC and PE firms using ReubenAI to source better deals, make faster decisions, 
                and drive superior returns with AI-powered investment intelligence.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/strategy">
                <Button size="lg" className="w-full sm:w-auto px-8 py-3 text-lg">
                  Configure Your Strategy
                </Button>
              </Link>
              <Link to="/deals">
                <Button variant="outline" size="lg" className="w-full sm:w-auto px-8 py-3 text-lg border-primary/20 hover:bg-primary/5">
                  Explore Deal Pipeline
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default WhatIsReubenAI;