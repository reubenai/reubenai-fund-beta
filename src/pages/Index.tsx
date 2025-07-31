import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Building2, TrendingUp, FileText, Users, Zap, Target, BarChart3 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';

const Index = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [funds, setFunds] = useState<any[]>([]);
  const [stats, setStats] = useState({
    activeFunds: 0,
    activeDeals: 0,
    aiAnalysis: 0,
    investmentCommittee: 0,
  });

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

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
      
      // Calculate stats
      setStats({
        activeFunds: fundsData?.length || 0,
        activeDeals: 12,
        aiAnalysis: 4,
        investmentCommittee: 2,
      });
    }
  };

  const quickActions = [
    { title: 'Investment Strategy', icon: Target, href: '/strategy', description: 'Define and manage your investment criteria' },
    { title: 'Deal Pipeline', icon: TrendingUp, href: '/pipeline', description: 'Manage deal flow and opportunities' },
    { title: 'Investment Committee', icon: Users, href: '/ic', description: 'IC investment decisions and evaluations' },
    { title: 'AI Analysis', icon: Zap, href: '/pipeline', description: 'AI-powered deal scoring and intelligence' },
  ];

  return (
    <div className="min-h-screen bg-slate-50/30">
      {/* Welcome Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-6 h-6 bg-emerald-500 rounded flex items-center justify-center">
            <span className="text-white text-xs font-bold">R</span>
          </div>
        <h1 className="text-2xl font-semibold text-slate-900">
          Welcome back, {profile?.first_name || user?.email?.split('@')[0] || 'demo'}
        </h1>
        </div>
        <p className="text-slate-600">
          Your AI-powered investment platform for smarter decisions
        </p>
      </div>

      {/* Quick Explore */}
      <div className="mb-8">
        <h2 className="text-lg font-medium text-slate-900 mb-4">Quick Explore</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => (
            <Link 
              key={index}
              to={action.href}
              className="group bg-white p-6 border border-slate-200 rounded-lg hover:shadow-sm hover:border-slate-300 transition-all duration-200"
            >
              <div className="w-12 h-12 bg-slate-800 rounded-lg flex items-center justify-center mb-4">
                <action.icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">{action.title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{action.description}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Your Funds */}
      {funds.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-slate-900">Your Funds</h2>
            <Link to="/funds">
              <Button variant="outline" size="sm" className="text-sm">
                + Create New Fund
              </Button>
            </Link>
          </div>
          <div className="bg-white p-6 border border-slate-200 rounded-lg">
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <h3 className="font-semibold text-slate-900">{funds[0]?.name}</h3>
                  <span className="inline-flex items-center px-2 py-1 bg-emerald-50 border border-emerald-200 rounded text-xs font-medium text-emerald-700">
                    Active
                  </span>
                </div>
                <p className="text-sm text-slate-600 max-w-2xl leading-relaxed">
                  {funds[0]?.description || 'We invest in exceptional founding teams pursuing massive opportunities enabled by AI, advanced technology, and unique insights.'}
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-8 mb-6 pb-6 border-b border-slate-100">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Fund Size</p>
                <p className="text-lg font-semibold text-slate-900">
                  ${funds[0]?.target_size ? (funds[0].target_size / 1000000).toFixed(0) + 'M' : '25M'}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Vintage</p>
                <p className="text-lg font-semibold text-slate-900">2024</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Invested</p>
                <p className="text-lg font-semibold text-slate-900">6 deals</p>
              </div>
            </div>
            
            <div className="flex justify-end">
              <Link to="/funds">
                <Button variant="ghost" size="sm" className="text-sm text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50">
                  ✓ View Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Help & Support */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-blue-600 text-xs">?</span>
          </div>
          <h2 className="text-lg font-medium text-slate-900">Help & Support</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-6 border border-slate-200 rounded-lg text-center">
            <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <div className="w-6 h-6 border-2 border-slate-400 rounded"></div>
            </div>
            <h3 className="font-semibold text-slate-900 mb-2">Guides & Tutorials</h3>
            <p className="text-sm text-slate-600">Learn how to configure investment criteria and use our AI engine</p>
          </div>
          <div className="bg-white p-6 border border-slate-200 rounded-lg text-center">
            <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <div className="w-6 h-6 bg-slate-400 rounded-sm"></div>
            </div>
            <h3 className="font-semibold text-slate-900 mb-2">Video Tutorials</h3>
            <p className="text-sm text-slate-600">Watch step-by-step videos on deal sourcing and pipeline management</p>
          </div>
          <div className="bg-white p-6 border border-slate-200 rounded-lg text-center">
            <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <div className="w-6 h-6 border border-slate-400 rounded"></div>
            </div>
            <h3 className="font-semibold text-slate-900 mb-2">Contact Support</h3>
            <p className="text-sm text-slate-600">Get instant help from our team via chat or submit a support request</p>
          </div>
        </div>
      </div>

      {/* Need Help Getting Started */}
      <div className="bg-white p-8 border border-slate-200 rounded-lg text-center">
        <h3 className="text-lg font-semibold text-slate-900 mb-2">Need Help Getting Started?</h3>
        <p className="text-slate-600 mb-6">Explore our resources to take the most of Reuben AI's powerful features</p>
        <div className="flex items-center justify-center gap-3">
          <Button variant="outline" size="sm">
            View Reuben Works
          </Button>
          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">
            View Help Center
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
