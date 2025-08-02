import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Layout } from '@/components/Layout';
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
    <Layout>
      <div className="space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-6">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
            <span className="text-2xl font-bold text-primary-foreground">R</span>
          </div>
          <div className="space-y-4">
            <h1 className="text-4xl font-bold text-foreground tracking-tight">
              AI-Powered Investment Intelligence
            </h1>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              ReubenAI streamlines venture capital and private equity deal flow with intelligent 
              automation, comprehensive analysis, and data-driven decision making.
            </p>
          </div>
        </div>

        {/* Value Proposition */}
        <div className="space-y-8">
          <h2 className="text-2xl font-semibold text-center text-foreground">Key Benefits</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {valueProps.map((value, index) => (
              <Card key={index} className="text-center border-border/50 hover:border-border hover:shadow-sm transition-all">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <value.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{value.title}</h3>
                  <p className="text-sm text-muted-foreground">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Features Section */}
        <div className="space-y-8">
          <h2 className="text-2xl font-semibold text-center text-foreground">Platform Features</h2>
          
          {/* Live Features */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <h3 className="text-xl font-semibold text-foreground">Available Now</h3>
              <Badge variant="default" className="bg-green-500/10 text-green-700 border-green-200">
                Live
              </Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {liveFeatures.map((feature) => (
                <Card key={feature.id} className="border-border/50 hover:border-border hover:shadow-sm transition-all">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <feature.icon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-foreground">{feature.title}</h4>
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Live
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{feature.description}</p>
                        <p className="text-xs text-muted-foreground/80">{feature.details}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Coming Soon */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <h3 className="text-xl font-semibold text-foreground">Coming Soon</h3>
              <Badge variant="outline" className="bg-muted text-muted-foreground">
                In Development
              </Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {comingSoonFeatures.map((feature, index) => (
                <Card key={index} className="border-border/50 opacity-75">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-muted/50 rounded-lg flex items-center justify-center flex-shrink-0">
                        <feature.icon className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-foreground">{feature.title}</h4>
                          <Badge variant="outline" className="bg-muted/50 text-muted-foreground">
                            <Clock className="h-3 w-3 mr-1" />
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
          </div>
        </div>

        {/* CTA Section */}
        <Card className="border-border/50 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardContent className="p-8 text-center space-y-6">
            <div className="space-y-3">
              <h3 className="text-2xl font-semibold text-foreground">Get Started with ReubenAI</h3>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Transform your investment process with AI-powered deal sourcing and analysis.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link to="/strategy">
                <Button size="lg" className="w-full sm:w-auto">
                  Configure Investment Strategy
                </Button>
              </Link>
              <Link to="/deals">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  View Deal Pipeline
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