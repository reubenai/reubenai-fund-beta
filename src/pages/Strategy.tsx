import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Target, Plus, Settings, AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';

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
        setSelectedFund(fundsData[0]);
        
        // Get strategy for first fund
        const { data: strategyData } = await supabase
          .from('investment_strategies')
          .select('*')
          .eq('fund_id', fundsData[0].id)
          .maybeSingle();
        
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

  // Fund exists but no strategy
  if (!strategy) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Investment Strategy</h1>
            <p className="text-muted-foreground">Configure your investment thesis and parameters</p>
          </div>
          <Badge variant="outline">{selectedFund?.name}</Badge>
        </div>
        
        <Card>
          <CardHeader className="text-center">
            <Target className="h-12 w-12 mx-auto text-primary mb-4" />
            <CardTitle>Define Your Investment Strategy</CardTitle>
            <CardDescription>
              Set up your investment criteria, focus areas, and parameters for {selectedFund?.name}.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 border rounded-lg">
                <h3 className="font-medium mb-2">Investment Focus</h3>
                <p className="text-sm text-muted-foreground">Define target industries and sectors</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <h3 className="font-medium mb-2">Criteria & Scoring</h3>
                <p className="text-sm text-muted-foreground">Set evaluation parameters</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <h3 className="font-medium mb-2">AI Integration</h3>
                <p className="text-sm text-muted-foreground">Configure automated analysis</p>
              </div>
            </div>
            
            <div className="text-center">
              <Button className="gap-2" size="lg">
                <Settings className="h-4 w-4" />
                Configure Investment Strategy
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Strategy exists - show configuration
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Investment Strategy</h1>
          <p className="text-muted-foreground">Current strategy for {selectedFund?.name}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">Active Strategy</Badge>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Edit Strategy
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Investment Focus</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <span className="text-sm text-muted-foreground">Industries:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {strategy.industries?.map((industry: string, i: number) => (
                  <Badge key={i} variant="outline" className="text-xs">{industry}</Badge>
                )) || <span className="text-muted-foreground">Not specified</span>}
              </div>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Geography:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {strategy.geography?.map((geo: string, i: number) => (
                  <Badge key={i} variant="outline" className="text-xs">{geo}</Badge>
                )) || <span className="text-muted-foreground">Not specified</span>}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Investment Size</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <span className="text-sm text-muted-foreground">Range:</span>
              <p className="font-medium">
                ${strategy.min_investment_amount ? (strategy.min_investment_amount / 1000000).toFixed(1) : '0'}M - 
                ${strategy.max_investment_amount ? (strategy.max_investment_amount / 1000000).toFixed(1) : '∞'}M
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">AI Scoring Thresholds</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-sm">Exciting:</span>
                <Badge className="bg-green-100 text-green-800">{strategy.exciting_threshold || 85}+</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Promising:</span>
                <Badge className="bg-yellow-100 text-yellow-800">{strategy.promising_threshold || 70}+</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Needs Development:</span>
                <Badge className="bg-red-100 text-red-800">{'<'}{strategy.needs_development_threshold || 50}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Strategy Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            {strategy.strategy_notes || 'No additional notes provided for this investment strategy.'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}