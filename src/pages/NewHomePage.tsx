import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, TrendingUp, Users, Brain, FileText, BookOpen, Video, MessageCircle, HelpCircle, Target, BarChart3, Lightbulb, Plus, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';

const NewHomePage = () => {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [funds, setFunds] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  const getRoleBasedWelcomeMessage = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'Manage the entire platform and all organizations.';
      case 'admin':
        return 'Oversee your organization and manage fund operations.';
      case 'fund_manager':
        return 'Lead your investment strategies and portfolio management.';
      case 'analyst':
        return 'Analyze deals and contribute to investment decisions.';
      case 'viewer':
        return 'Stay updated with your investment portfolio insights.';
      default:
        return 'Ready to supercharge your investment workflow?';
    }
  };

  const fetchUserData = async () => {
    // Fetch user profile
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user?.id)
      .single();
    
    setProfile(profileData);

    // Fetch user's funds
    if (profileData?.organization_id) {
      const { data: fundsData } = await supabase
        .from('funds')
        .select('*')
        .eq('organization_id', profileData.organization_id)
        .eq('is_active', true);
      
      setFunds(fundsData || []);
    }
  };

  const quickExploreCards = [
    {
      title: 'Investment Strategy',
      description: 'Define your investment criteria and focus areas',
      icon: Target,
      href: '/strategy',
      color: 'bg-primary'
    },
    {
      title: 'Deal Pipeline',
      description: 'Manage deals from sourcing to investment',
      icon: TrendingUp,
      href: '/deals',
      color: 'bg-accent-orange'
    },
    {
      title: 'Investment Committee',
      description: 'Run IC sessions and track decisions',
      icon: Users,
      href: '/investment-committee',
      color: 'bg-primary'
    },
    {
      title: 'AI Analysis',
      description: 'Get AI-powered insights and recommendations',
      icon: Brain,
      href: '/founder-scoring',
      color: 'bg-accent-orange'
    },
  ];

  const helpSupportSections = [
    {
      title: 'Guides & Documentation',
      icon: BookOpen,
      items: [
        'Getting Started Guide',
        'Deal Management Best Practices',
        'AI Features Overview',
        'Investment Committee Setup'
      ]
    },
    {
      title: 'Video Tutorials',
      icon: Video,
      items: [
        'Platform Walkthrough',
        'Setting Up Your First Fund',
        'Managing Deal Pipeline',
        'Using AI Scoring'
      ]
    },
    {
      title: 'Contact & Support',
      icon: MessageCircle,
      items: [
        'Live Chat Support',
        'Email Support',
        'Schedule Demo',
        'Feature Requests'
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                <span className="text-lg font-bold text-primary-foreground">R</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">ReubenAI</h1>
                <p className="text-sm text-muted-foreground">AI-Powered Investment Platform</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button variant="outline" className="gap-2">
                <HelpCircle className="h-4 w-4" />
                What is ReubenAI?
              </Button>
              
              {(profile?.role === 'admin' || profile?.role === 'super_admin') && (
                <Link to="/admin">
                  <Button variant="secondary">Admin Panel</Button>
                </Link>
              )}
              
              <Button variant="ghost" onClick={signOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-12">
        {/* Welcome Section */}
        <section className="text-center space-y-4">
          <h2 className="text-4xl font-bold text-foreground">
            {profile?.role === 'super_admin' ? 'ReubenAI Admin Dashboard' : `Welcome back, ${profile?.first_name || 'User'}`}
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {profile ? getRoleBasedWelcomeMessage(profile.role) : 'Your intelligent investment platform for smarter deal sourcing and analysis.'}
          </p>
          
          {/* Fund Creation Button for Authorized Users */}
          {(profile?.role === 'admin' || profile?.role === 'fund_manager' || profile?.role === 'super_admin') && (
            <div className="pt-4">
              <Link to="/funds/new">
                <Button size="lg" className="bg-primary hover:bg-primary/90">
                  <Plus className="h-5 w-5 mr-2" />
                  Create New Fund
                </Button>
              </Link>
            </div>
          )}
        </section>

        {/* Quick Explore */}
        <section className="space-y-6">
          <div className="text-center space-y-2">
            <h3 className="text-2xl font-bold text-foreground">Quick Explore</h3>
            <p className="text-muted-foreground">Jump into the core features of ReubenAI</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickExploreCards.map((card) => (
              <Link key={card.title} to={card.href}>
                <Card className="h-full hover:shadow-lg transition-all duration-200 hover:-translate-y-1 cursor-pointer group">
                  <CardHeader className="text-center pb-4">
                    <div className={`w-16 h-16 ${card.color} rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-200`}>
                      <card.icon className="h-8 w-8 text-white" />
                    </div>
                    <CardTitle className="text-lg">{card.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <CardDescription>{card.description}</CardDescription>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        {/* Your Funds */}
        {funds.length > 0 && (
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-foreground">Your Funds</h3>
                <p className="text-muted-foreground">Active investment funds</p>
              </div>
              <Link to="/funds">
                <Button variant="outline">View All Funds</Button>
              </Link>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {funds.slice(0, 6).map((fund) => (
                <Card key={fund.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                          <Building2 className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{fund.name}</CardTitle>
                          <CardDescription className="text-sm">
                            {fund.fund_type?.replace('_', ' ').toUpperCase()}
                          </CardDescription>
                        </div>
                      </div>
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                        Active
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Target Size:</span>
                        <span className="font-medium">
                          {fund.target_size ? `$${(fund.target_size / 1000000).toFixed(0)}M` : 'TBD'}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Focus:</span>
                        <span className="font-medium">{fund.investment_focus || 'General'}</span>
                      </div>
                    </div>
                    <div className="mt-4">
                      <Link to={`/funds/${fund.id}`}>
                        <Button variant="outline" size="sm" className="w-full">
                          View Details
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Help & Support */}
        <section className="space-y-6">
          <div className="text-center space-y-2">
            <h3 className="text-2xl font-bold text-foreground">Help & Support</h3>
            <p className="text-muted-foreground">Get the most out of ReubenAI with our resources</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {helpSupportSections.map((section) => (
              <Card key={section.title} className="h-full">
                <CardHeader className="text-center pb-4">
                  <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center mx-auto mb-3">
                    <section.icon className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <CardTitle className="text-lg">{section.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {section.items.map((item, index) => (
                    <div key={index} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      <span className="text-sm text-foreground hover:text-primary transition-colors">{item}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Call to Action */}
        <section className="bg-gradient-to-r from-primary/10 to-accent-orange/10 rounded-2xl p-8 text-center space-y-4">
          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-foreground">Need Help Getting Started?</h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Our help center has everything you need to make the most of ReubenAI's powerful features.
            </p>
          </div>
          <div className="flex items-center justify-center space-x-4">
            <Button className="gap-2">
              <Lightbulb className="h-4 w-4" />
              Visit Help Center
            </Button>
            <Button variant="outline" className="gap-2">
              <MessageCircle className="h-4 w-4" />
              Contact Support
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
};

export default NewHomePage;