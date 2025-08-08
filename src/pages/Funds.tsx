import { useEffect, useState } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Building2, Plus, Target, DollarSign } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { usePermissions } from '@/hooks/usePermissions';

const FundsList = () => {
  const { user } = useAuth();
  const [funds, setFunds] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const { canCreateFunds } = usePermissions();

  useEffect(() => {
    if (user) {
      fetchFunds();
    }
  }, [user]);

  const fetchFunds = async () => {
    // Get user profile first
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user?.id)
      .single();
    
    setProfile(profileData);

    if (profileData?.organization_id) {
      const { data: fundsData } = await supabase
        .from('funds')
        .select('*')
        .eq('organization_id', profileData.organization_id)
        .order('created_at', { ascending: false });
      
      setFunds(fundsData || []);
    }
  };

  if (!profile?.organization_id) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Organization</CardTitle>
          <CardDescription>You need to be assigned to an organization to manage funds.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Funds</h1>
          <p className="text-muted-foreground">Manage your investment funds</p>
        </div>
        {canCreateFunds && (
          <Link to="/funds/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Fund
            </Button>
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {funds.map((fund) => (
          <Card key={fund.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <Building2 className="h-8 w-8 text-primary" />
                <Badge variant={fund.is_active ? "default" : "secondary"}>
                  {fund.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>
              <CardTitle className="mt-4">{fund.name}</CardTitle>
              <CardDescription>{fund.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center text-sm">
                  <Target className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="font-medium">
                    {fund.fund_type.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                {fund.target_size && (
                  <div className="flex items-center text-sm">
                    <DollarSign className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>Target: ${(fund.target_size / 1000000).toFixed(0)}M {fund.currency}</span>
                  </div>
                )}
              </div>
              <Link to={`/funds/${fund.id}`} className="block mt-4">
                <Button variant="outline" className="w-full">
                  View Details
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      {funds.length === 0 && canCreateFunds && (
        <Card>
          <CardHeader>
            <CardTitle>No Funds Yet</CardTitle>
            <CardDescription>Create your first investment fund to get started.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/funds/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Fund
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
      
      {funds.length === 0 && !canCreateFunds && (
        <Card>
          <CardHeader>
            <CardTitle>No Funds Available</CardTitle>
            <CardDescription>Contact your administrator to get access to funds or create new ones.</CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  );
};

const CreateFund = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const { canCreateFunds } = usePermissions();
  const [formData, setFormData] = useState({
    name: '',
    fund_type: 'venture_capital' as 'venture_capital' | 'private_equity',
    description: '',
    target_size: '',
    currency: 'USD',
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user?.id)
      .single();
    
    setProfile(profileData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('funds')
        .insert({
          organization_id: profile?.organization_id,
          name: formData.name,
          fund_type: formData.fund_type,
          description: formData.description,
          target_size: formData.target_size ? parseInt(formData.target_size) * 1000000 : null,
          currency: formData.currency,
          created_by: user?.id,
          is_active: true,
        });

      if (error) throw error;

      toast({
        title: "Fund created successfully",
        description: `${formData.name} has been created.`,
      });

      navigate('/funds');
    } catch (error: any) {
      toast({
        title: "Error creating fund",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Check if user has permission to create funds
  if (!canCreateFunds) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Access Denied</CardTitle>
          <CardDescription>You don't have permission to create funds.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Create New Fund</CardTitle>
          <CardDescription>Set up a new investment fund for your organization</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Fund Name</Label>
              <Input
                id="name"
                placeholder="e.g., Growth Capital Fund I"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fund_type">Fund Type</Label>
              <Select 
                value={formData.fund_type} 
                onValueChange={(value: 'venture_capital' | 'private_equity') => 
                  setFormData({ ...formData, fund_type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="venture_capital">Venture Capital</SelectItem>
                  <SelectItem value="private_equity">Private Equity</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Fund strategy and focus areas..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="target_size">Target Size (Millions)</Label>
                <Input
                  id="target_size"
                  type="number"
                  placeholder="100"
                  value={formData.target_size}
                  onChange={(e) => setFormData({ ...formData, target_size: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select 
                  value={formData.currency} 
                  onValueChange={(value) => setFormData({ ...formData, currency: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                    <SelectItem value="AUD">AUD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create Fund"}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate('/funds')}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default function Funds() {
  return (
    <Routes>
      <Route index element={<FundsList />} />
      <Route path="new" element={<CreateFund />} />
    </Routes>
  );
}