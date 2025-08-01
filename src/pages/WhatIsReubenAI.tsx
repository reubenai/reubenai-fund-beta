import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  MessageSquare
} from 'lucide-react';
import { Link } from 'react-router-dom';

const WhatIsReubenAI = () => {
  const [selectedFeature, setSelectedFeature] = useState('deal-sourcing');

  const liveFeatures = [
    {
      id: 'deal-sourcing',
      title: 'AI Deal Sourcing',
      icon: Search,
      description: 'Intelligent deal discovery powered by AI',
      details: 'Our AI scans thousands of potential deals and matches them to your investment criteria automatically.',
      status: 'live'
    },
    {
      id: 'pipeline-management',
      title: 'Pipeline Management',
      icon: TrendingUp,
      description: 'Streamlined deal tracking and management',
      details: 'Organize your deal flow with our intuitive kanban-style pipeline interface.',
      status: 'live'
    },
    {
      id: 'investment-criteria',
      title: 'Investment Strategy',
      icon: Target,
      description: 'Define and manage investment criteria',
      details: 'Set up sophisticated investment criteria that guide AI-powered deal matching.',
      status: 'live'
    },
    {
      id: 'ai-analysis',
      title: 'AI Analysis Engine',
      icon: Brain,
      description: 'Deep deal analysis and scoring',
      details: 'Get comprehensive AI-powered analysis of potential investments with risk assessment.',
      status: 'live'
    }
  ];

  const comingSoonFeatures = [
    {
      title: 'Investment Committee Portal',
      icon: Users,
      description: 'Collaborative decision-making platform',
      eta: 'Q1 2025'
    },
    {
      title: 'Document Intelligence',
      icon: FileText,
      description: 'AI-powered document analysis and extraction',
      eta: 'Q1 2025'
    },
    {
      title: 'Portfolio Analytics',
      icon: BarChart3,
      description: 'Advanced portfolio performance tracking',
      eta: 'Q2 2025'
    },
    {
      title: 'Fund Administration',
      icon: Building2,
      description: 'Complete fund management suite',
      eta: 'Q2 2025'
    }
  ];

  const valueProps = [
    {
      icon: Lightbulb,
      title: 'Smarter Decisions',
      description: 'AI-powered insights help you identify the best investment opportunities faster.'
    },
    {
      icon: DollarSign,
      title: 'Higher Returns',
      description: 'Data-driven approach to deal sourcing and evaluation improves portfolio performance.'
    },
    {
      icon: Shield,
      title: 'Risk Mitigation',
      description: 'Comprehensive analysis reduces blind spots and investment risks.'
    },
    {
      icon: Zap,
      title: 'Efficiency Gains',
      description: 'Automate routine tasks and focus on high-value strategic decisions.'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <div className="bg-white border-b border-border/50 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/">
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Dashboard
                </Button>
              </Link>
              <div className="h-6 w-px bg-border" />
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center">
                  <span className="text-lg font-bold text-primary-foreground">R</span>
                </div>
                <h1 className="text-xl font-semibold">What is ReubenAI?</h1>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="mb-6">
            <div className="w-20 h-20 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl font-bold text-primary-foreground">R</span>
            </div>
            <h2 className="text-4xl font-bold text-foreground mb-4">
              ReubenAI Investment Platform
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              The AI-powered investment intelligence platform designed specifically for venture capital 
              and private equity firms to streamline deal sourcing, analysis, and decision-making.
            </p>
          </div>
        </div>

        {/* Value Proposition */}
        <div className="mb-12">
          <h3 className="text-2xl font-semibold text-center mb-8">How We Add Value</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {valueProps.map((value, index) => (
              <Card key={index} className="text-center hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <value.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h4 className="font-semibold mb-2">{value.title}</h4>
                  <p className="text-sm text-muted-foreground">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Features Section */}
        <Tabs defaultValue="live" className="mb-12">
          <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
            <TabsTrigger value="live">Live Features</TabsTrigger>
            <TabsTrigger value="coming-soon">Coming Soon</TabsTrigger>
          </TabsList>

          <TabsContent value="live" className="mt-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Feature List */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold mb-4">Available Now</h3>
                {liveFeatures.map((feature) => (
                  <Card 
                    key={feature.id}
                    className={`cursor-pointer transition-all ${
                      selectedFeature === feature.id 
                        ? 'ring-2 ring-primary border-primary' 
                        : 'hover:shadow-md'
                    }`}
                    onClick={() => setSelectedFeature(feature.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                          <feature.icon className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium">{feature.title}</h4>
                            <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Live
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{feature.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Feature Details */}
              <div>
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {(() => {
                        const feature = liveFeatures.find(f => f.id === selectedFeature);
                        const Icon = feature?.icon || Brain;
                        return (
                          <>
                            <Icon className="h-5 w-5" />
                            {feature?.title}
                          </>
                        );
                      })()}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">
                      {liveFeatures.find(f => f.id === selectedFeature)?.details}
                    </p>
                    <Link to="/pipeline">
                      <Button className="w-full">
                        Try This Feature
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="coming-soon" className="mt-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {comingSoonFeatures.map((feature, index) => (
                <Card key={index} className="opacity-75">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                        <feature.icon className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{feature.title}</h4>
                          <Badge variant="outline" className="gap-1">
                            <Clock className="h-3 w-3" />
                            {feature.eta}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{feature.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* CTA Section */}
        <Card className="text-center">
          <CardContent className="p-8">
            <h3 className="text-2xl font-semibold mb-4">Ready to Transform Your Investment Process?</h3>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Join leading VC and PE firms who are already using ReubenAI to make smarter, 
              faster investment decisions.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link to="/strategy">
                <Button size="lg">
                  Set Up Investment Strategy
                </Button>
              </Link>
              <Link to="/help">
                <Button variant="outline" size="lg" className="gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Contact Support
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default WhatIsReubenAI;