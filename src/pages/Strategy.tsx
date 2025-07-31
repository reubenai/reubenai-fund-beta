import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Target, Plus, Settings, AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { InvestmentStrategyManager } from '@/components/strategy/InvestmentStrategyManager';

export default function Strategy() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [funds, setFunds] = useState<any[]>([]);
  const [selectedFund, setSelectedFund] = useState<any>(null);
  const [strategy, setStrategy] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    
    // Get user profile
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user?.id)
      .maybeSingle();
    
    setProfile(profileData);

    if (profileData?.organization_id) {
      // Get funds
      const { data: fundsData } = await supabase
        .from('funds')
        .select('*')
        .eq('organization_id', profileData.organization_id)
        .eq('is_active', true);
      
      setFunds(fundsData || []);
      
      if (fundsData && fundsData.length > 0) {
        console.log('=== SELECTING FIRST FUND ===');
        console.log('Selected fund:', fundsData[0]);
        setSelectedFund(fundsData[0]);
        
        // Get strategy for first fund
        const { data: strategyData } = await supabase
          .from('investment_strategies')
          .select('*')
          .eq('fund_id', fundsData[0].id)
          .maybeSingle();
        
        console.log('=== STRATEGY DATA FROM PAGE ===');
        console.log('Strategy data:', strategyData);
        setStrategy(strategyData);
      }
    }
    
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Investment Strategy</h1>
          <p className="text-muted-foreground">Configure your investment thesis and parameters</p>
        </div>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // No funds setup
  if (!funds.length) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Investment Strategy</h1>
          <p className="text-muted-foreground">Configure your investment thesis and parameters</p>
        </div>
        
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You need to create a fund before setting up your investment strategy.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader className="text-center">
            <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <CardTitle>No Funds Available</CardTitle>
            <CardDescription>
              Create your first fund to start defining your investment strategy and criteria.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Link to="/funds">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Create Your First Fund
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Use the new Investment Strategy Manager
  if (selectedFund) {
    return <InvestmentStrategyManager fundId={selectedFund.id} fundName={selectedFund.name} />;
  }

  return null;
}