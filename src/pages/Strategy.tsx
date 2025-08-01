import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Target, Plus, AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { InvestmentStrategyManager } from '@/components/strategy/InvestmentStrategyManager';
import { FundSelector } from '@/components/strategy/FundSelector';

interface Fund {
  id: string;
  name: string;
  fund_type: string;
  is_active: boolean;
}

export default function Strategy() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [funds, setFunds] = useState<Fund[]>([]);
  const [selectedFund, setSelectedFund] = useState<Fund | null>(null);
  const [strategiesMap, setStrategiesMap] = useState<Map<string, any>>(new Map());
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
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      
      setFunds(fundsData || []);
      
      if (fundsData && fundsData.length > 0) {
        // Select first fund by default
        setSelectedFund(fundsData[0]);
        
        // Get strategies for all funds
        const { data: strategiesData } = await supabase
          .from('investment_strategies')
          .select('*')
          .in('fund_id', fundsData.map(f => f.id));
        
        // Create a map of fund_id -> strategy
        const strategiesMap = new Map();
        strategiesData?.forEach(strategy => {
          strategiesMap.set(strategy.fund_id, strategy);
        });
        setStrategiesMap(strategiesMap);
      }
    }
    
    setLoading(false);
  };

  const handleFundSelect = (fund: Fund) => {
    setSelectedFund(fund);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="bg-card border-b">
          <div className="max-w-7xl mx-auto px-6 py-6">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Investment Strategy</h1>
              <p className="text-muted-foreground mt-1">Configure your investment criteria and approach</p>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  // No funds setup
  if (!funds.length) {
    return (
      <div className="min-h-screen bg-background">
        <div className="bg-card border-b">
          <div className="max-w-7xl mx-auto px-6 py-6">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Investment Strategy</h1>
              <p className="text-muted-foreground mt-1">Configure your investment criteria and approach</p>
            </div>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-6 py-8">
          <Alert className="mb-6">
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
      </div>
    );
  }

  // Main strategy view with fund selector
  return (
    <div className="min-h-screen bg-background">
      <div className="bg-card border-b">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Investment Strategy</h1>
              <p className="text-muted-foreground mt-1">Configure your investment criteria and approach</p>
            </div>
            
            {funds.length > 1 && (
              <FundSelector
                funds={funds}
                selectedFund={selectedFund}
                onFundSelect={handleFundSelect}
                hasStrategy={selectedFund ? strategiesMap.has(selectedFund.id) : false}
              />
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {selectedFund ? (
          <Card className="shadow-sm border-0">
            <InvestmentStrategyManager 
              fundId={selectedFund.id} 
              fundName={selectedFund.name}
              key={selectedFund.id} // Force re-render when fund changes
            />
          </Card>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Select a fund to configure its strategy</p>
          </div>
        )}
      </div>
    </div>
  );
}