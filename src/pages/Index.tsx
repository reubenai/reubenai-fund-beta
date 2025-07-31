import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, TrendingUp, FileText, Users, Plus } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';

const Index = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [funds, setFunds] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalFunds: 0,
    activeDeals: 0,
    pendingAnalysis: 0,
    upcomingICs: 0,
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
        totalFunds: fundsData?.length || 0,
        activeDeals: 0, // Will implement in Pipeline page
        pendingAnalysis: 0,
        upcomingICs: 0,
      });
    }
  };

  const quickActions = [
    { title: 'Create New Fund', icon: Building2, href: '/funds/new', color: 'bg-primary' },
    { title: 'Add Deal', icon: Plus, href: '/pipeline/new', color: 'bg-success' },
    { title: 'Review Strategy', icon: FileText, href: '/strategy', color: 'bg-warning' },
    { title: 'Schedule IC', icon: Users, href: '/ic/new', color: 'bg-destructive' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Welcome back, {profile?.first_name || 'User'}
          </h1>
          <p className="text-muted-foreground mt-1">
            Here's what's happening with your investments today.
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">
            {profile?.organization_id ? 'Organization' : 'No organization'}
          </p>
          <p className="font-medium">{profile?.role || 'viewer'}</p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Funds</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalFunds}</div>
            <p className="text-xs text-muted-foreground">
              +{stats.totalFunds > 0 ? '1' : '0'} from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Deals</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeDeals}</div>
            <p className="text-xs text-muted-foreground">
              +{stats.activeDeals} from last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Analysis</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingAnalysis}</div>
            <p className="text-xs text-muted-foreground">
              AI analysis queue
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming ICs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.upcomingICs}</div>
            <p className="text-xs text-muted-foreground">
              This week
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks to get you started</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action) => (
              <Link key={action.title} to={action.href}>
                <Button
                  variant="outline"
                  className="h-24 flex flex-col items-center justify-center space-y-2 hover:shadow-md transition-shadow"
                >
                  <div className={`w-8 h-8 rounded-lg ${action.color} flex items-center justify-center`}>
                    <action.icon className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-sm font-medium">{action.title}</span>
                </Button>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Funds */}
      {funds.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Your Funds</CardTitle>
            <CardDescription>Active investment funds</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {funds.map((fund) => (
                <div key={fund.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div>
                    <h3 className="font-medium">{fund.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {fund.fund_type.replace('_', ' ').toUpperCase()} • 
                      Target: {fund.target_size ? `$${(fund.target_size / 1000000).toFixed(0)}M` : 'TBD'}
                    </p>
                  </div>
                  <Link to={`/funds/${fund.id}`}>
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Index;
