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
    <div className="min-h-screen bg-slate-50/30">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="sm" className="gap-2 text-slate-600 hover:text-slate-900">
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
            <div className="h-6 w-px bg-slate-200" />
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 bg-emerald-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-bold">R</span>
              </div>
              <h1 className="text-lg font-medium text-slate-900">How Reuben Works</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <span className="text-2xl font-bold text-white">R</span>
          </div>
          <h2 className="text-3xl font-bold text-slate-900 mb-4">
            AI-Powered Investment Intelligence
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            ReubenAI streamlines venture capital and private equity deal flow with intelligent 
            automation, comprehensive analysis, and data-driven decision making.
          </p>
        </div>

        {/* Value Proposition */}
        <div className="mb-16">
          <h3 className="text-xl font-semibold text-center text-slate-900 mb-8">Key Benefits</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {valueProps.map((value, index) => (
              <div key={index} className="bg-white p-6 border border-slate-200 rounded-lg text-center hover:shadow-sm transition-all">
                <div className="w-12 h-12 bg-emerald-50 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <value.icon className="h-6 w-6 text-emerald-600" />
                </div>
                <h4 className="font-medium text-slate-900 mb-2">{value.title}</h4>
                <p className="text-sm text-slate-600">{value.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Features Section */}
        <div className="mb-16">
          <h3 className="text-xl font-semibold text-center text-slate-900 mb-8">Platform Features</h3>
          
          {/* Live Features */}
          <div className="mb-12">
            <h4 className="text-lg font-medium text-slate-900 mb-6">Available Now</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {liveFeatures.map((feature) => (
                <div key={feature.id} className="bg-white p-6 border border-slate-200 rounded-lg hover:shadow-sm transition-all">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <feature.icon className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium text-slate-900">{feature.title}</h4>
                        <span className="inline-flex items-center px-2 py-1 bg-emerald-50 border border-emerald-200 rounded text-xs font-medium text-emerald-700">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Live
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 mb-3">{feature.description}</p>
                      <p className="text-xs text-slate-500">{feature.details}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Coming Soon */}
          <div>
            <h4 className="text-lg font-medium text-slate-900 mb-6">Coming Soon</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {comingSoonFeatures.map((feature, index) => (
                <div key={index} className="bg-white p-6 border border-slate-200 rounded-lg opacity-75">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <feature.icon className="h-5 w-5 text-slate-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium text-slate-900">{feature.title}</h4>
                        <span className="inline-flex items-center px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs font-medium text-slate-600">
                          <Clock className="h-3 w-3 mr-1" />
                          {feature.eta}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600">{feature.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-white p-8 border border-slate-200 rounded-lg text-center">
          <h3 className="text-xl font-semibold text-slate-900 mb-3">Get Started with ReubenAI</h3>
          <p className="text-slate-600 mb-6 max-w-xl mx-auto">
            Transform your investment process with AI-powered deal sourcing and analysis.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link to="/strategy">
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                Configure Investment Strategy
              </Button>
            </Link>
            <Link to="/pipeline">
              <Button variant="outline" className="border-slate-300 text-slate-700 hover:bg-slate-50">
                View Deal Pipeline
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhatIsReubenAI;