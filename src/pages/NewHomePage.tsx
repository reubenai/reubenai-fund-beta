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

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);


  const fetchUserData = async () => {
    try {
      console.log('=== FETCHING USER DATA ===');
      console.log('User ID:', user?.id);
      console.log('User object:', user);
      
      if (!user?.id) {
        console.log('No user ID available, skipping fetch');
        return;
      }
      
      // Fetch user profile with better error handling
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      console.log('=== PROFILE FETCH RESULT ===');
      console.log('Profile data:', profileData);
      console.log('Profile error:', profileError);
      
      if (profileError) {
        console.error('Profile fetch error:', profileError);
        return;
      }
      
      if (!profileData) {
        console.log('No profile found for user');
        return;
      }
      
      setProfile(profileData);
      console.log('Profile set in state:', profileData);

      // Fetch user's funds if they have an organization
      if (profileData.organization_id) {
        console.log('=== FETCHING FUNDS ===');
        console.log('Organization ID:', profileData.organization_id);
        
        const { data: fundsData, error: fundsError } = await supabase
          .from('funds')
          .select('*')
          .eq('organization_id', profileData.organization_id)
          .eq('is_active', true);
        
        console.log('=== FUNDS FETCH RESULT ===');
        console.log('Funds data:', fundsData);
        console.log('Funds error:', fundsError);
        
        if (fundsError) {
          console.error('Funds fetch error:', fundsError);
        } else {
          setFunds(fundsData || []);
          console.log('Funds set in state:', fundsData);
        }
      } else {
        console.log('No organization ID, skipping funds fetch');
      }
    } catch (error) {
      console.error('=== FATAL ERROR in fetchUserData ===', error);
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
    <div className="space-y-8 bg-slate-50/30 min-h-screen p-6">
      {/* Welcome Section */}
      <section className="bg-white rounded-lg p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
            <span className="text-lg font-bold text-white">R</span>
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Welcome back, {profile?.first_name || 'User'}
          </h1>
        </div>
      </section>

      {/* Quick Explore */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">Quick Explore</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickExploreCards.map((card) => (
            <Link key={card.title} to={card.href}>
              <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 ${card.color === 'bg-primary' ? 'bg-emerald-600' : 'bg-orange-500'} rounded-lg flex items-center justify-center`}>
                      <card.icon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{card.title}</h3>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">{card.description}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Your Funds */}
      {funds.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Your Funds</h2>
          
          <div className="flex gap-4">
            <div className="w-64">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-sm">{funds[0]?.name || 'Fund Name'}</h3>
                      <p className="text-xs text-gray-600">{funds[0]?.description || 'Fund Description'}</p>
                    </div>
                  </div>
                  <div className="text-center mb-3">
                    <div className="text-xl font-bold text-gray-900">
                      ${funds[0]?.target_size ? (funds[0].target_size / 1000000).toFixed(0) : '25'}M
                    </div>
                    <p className="text-xs text-gray-600">Target Size</p>
                  </div>
                  <Link to="/strategy" className="block">
                    <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-sm py-2">
                      Fund Thesis
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
            
            <div className="flex-1">
              <Link to="/funds/new">
                <Button variant="outline" className="h-full min-h-[140px] w-full border-dashed border-2 flex flex-col items-center justify-center gap-2 hover:bg-gray-50">
                  <Plus className="h-6 w-6 text-gray-400" />
                  <span className="text-sm font-medium text-gray-600">Create New Fund</span>
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Help & Support */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">Help & Support</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {helpSupportSections.map((section) => (
            <Card key={section.title}>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <section.icon className="h-5 w-5 text-gray-600" />
                  </div>
                  <h3 className="font-medium text-gray-900">{section.title}</h3>
                </div>
                <div className="space-y-2">
                  {section.items.slice(0, 3).map((item, index) => (
                    <p key={index} className="text-sm text-gray-600">• {item}</p>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Call to Action */}
      <section className="bg-emerald-50 rounded-lg p-6">
        <div className="text-center space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Need Help Getting Started?</h2>
          <p className="text-gray-600">
            Our help center has everything you need to make the most of ReubenAI's powerful features.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Button className="bg-emerald-600 hover:bg-emerald-700 gap-2">
              <Lightbulb className="h-4 w-4" />
              Reuben Works
            </Button>
            <Button variant="outline" className="gap-2">
              <MessageCircle className="h-4 w-4" />
              Help Center
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default NewHomePage;