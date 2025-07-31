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
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-foreground tracking-tight">
            Welcome back, {profile?.first_name || 'User'}
          </h1>
          <p className="text-lg text-muted-foreground font-medium">
            Here's what's happening with your investments today.
          </p>
        </div>
        <div className="text-right space-y-1">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
            <p className="text-sm font-semibold text-primary">
              {profile?.role?.replace('_', ' ').toUpperCase() || 'USER'}
            </p>
          </div>
          <p className="text-sm text-muted-foreground font-medium">
            {profile?.organization_id ? 'Active Organization' : 'No Organization'}
          </p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="relative overflow-hidden border-border/50 bg-gradient-to-br from-background to-muted/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-foreground">Active Funds</CardTitle>
            <div className="p-2 rounded-lg bg-primary/10">
              <Building2 className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground mb-1">{stats.totalFunds}</div>
            <p className="text-sm text-muted-foreground font-medium">
              {stats.totalFunds > 0 ? '↗ Active funds' : 'No funds yet'}
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-border/50 bg-gradient-to-br from-background to-muted/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-foreground">Active Deals</CardTitle>
            <div className="p-2 rounded-lg bg-success/10">
              <TrendingUp className="h-4 w-4 text-success" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground mb-1">{stats.activeDeals}</div>
            <p className="text-sm text-muted-foreground font-medium">
              Pipeline opportunities
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-border/50 bg-gradient-to-br from-background to-muted/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-foreground">AI Analysis</CardTitle>
            <div className="p-2 rounded-lg bg-warning/10">
              <FileText className="h-4 w-4 text-warning" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground mb-1">{stats.pendingAnalysis}</div>
            <p className="text-sm text-muted-foreground font-medium">
              Queued for processing
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-border/50 bg-gradient-to-br from-background to-muted/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-foreground">Investment Committee</CardTitle>
            <div className="p-2 rounded-lg bg-accent-orange/10">
              <Users className="h-4 w-4 text-accent-orange" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground mb-1">{stats.upcomingICs}</div>
            <p className="text-sm text-muted-foreground font-medium">
              Sessions this week
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="border-border/50 bg-gradient-to-br from-background to-muted/10">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-semibold text-foreground">Quick Actions</CardTitle>
          <CardDescription className="text-muted-foreground font-medium">
            Common tasks to get you started efficiently
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action) => (
              <Link key={action.title} to={action.href}>
                <div className="group relative rounded-xl border border-border/60 bg-background/80 p-6 transition-all duration-200 hover:border-primary/30 hover:bg-background hover:shadow-lg">
                  <div className="flex flex-col items-center space-y-3">
                    <div className={`w-12 h-12 rounded-xl ${action.color} flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform`}>
                      <action.icon className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-sm font-semibold text-foreground text-center group-hover:text-primary transition-colors">
                      {action.title}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Funds */}
      {funds.length > 0 && (
        <Card className="border-border/50 bg-gradient-to-br from-background to-muted/10">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-semibold text-foreground">Your Funds</CardTitle>
            <CardDescription className="text-muted-foreground font-medium">
              Active investment funds under management
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {funds.map((fund) => (
                <div key={fund.id} className="group relative flex items-center justify-between p-5 border border-border/60 rounded-xl bg-background/80 transition-all duration-200 hover:border-primary/30 hover:bg-background hover:shadow-sm">
                  <div className="space-y-1">
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                      {fund.name}
                    </h3>
                    <div className="flex items-center space-x-3 text-sm text-muted-foreground">
                      <span className="inline-flex items-center px-2 py-1 rounded-md bg-primary/10 text-primary font-medium">
                        {fund.fund_type.replace('_', ' ').toUpperCase()}
                      </span>
                      <span className="font-medium">
                        Target: {fund.target_size ? `$${(fund.target_size / 1000000).toFixed(0)}M` : 'TBD'}
                      </span>
                    </div>
                  </div>
                  <Link to={`/funds/${fund.id}`}>
                    <Button variant="outline" size="sm" className="hover:bg-primary hover:text-primary-foreground transition-colors">
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
