import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Building2, Users, TrendingUp, Database, Plus, Edit, Save, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface Organization {
  id: string;
  name: string;
  domain: string | null;
  created_at: string;
  updated_at: string;
}

interface Profile {
  id: string;
  user_id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: string;
  organization_id: string | null;
  created_at: string;
  updated_at: string;
}

interface Fund {
  id: string;
  name: string;
  organization_id: string;
  fund_type: string;
  target_size: number | null;
  currency: string;
  is_active: boolean;
  created_at: string;
}

export default function Admin() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [funds, setFunds] = useState<Fund[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [newOrg, setNewOrg] = useState({ name: '', domain: '' });
  const [newFund, setNewFund] = useState({
    name: '',
    organization_id: '',
    fund_type: 'venture_capital' as 'venture_capital' | 'private_equity',
    target_size: '',
    currency: 'USD',
  });
  const [stats, setStats] = useState({
    totalOrgs: 0,
    totalUsers: 0,
    totalFunds: 0,
    activeDeals: 0,
  });

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch user profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user!.id)
        .single();

      if (profileData?.role !== 'super_admin') {
        toast.error('Access denied. Super Admin role required.');
        return;
      }

      setProfile(profileData);

      // Fetch all organizations
      const { data: orgsData } = await supabase
        .from('organizations')
        .select('*')
        .order('created_at', { ascending: false });

      // Fetch all profiles
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      // Fetch all funds
      const { data: fundsData } = await supabase
        .from('funds')
        .select('*')
        .order('created_at', { ascending: false });

      // Fetch deals count
      const { count: dealsCount } = await supabase
        .from('deals')
        .select('*', { count: 'exact', head: true });

      setOrganizations(orgsData || []);
      setProfiles(profilesData || []);
      setFunds(fundsData || []);
      setStats({
        totalOrgs: orgsData?.length || 0,
        totalUsers: profilesData?.length || 0,
        totalFunds: fundsData?.length || 0,
        activeDeals: dealsCount || 0,
      });
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const createOrganization = async () => {
    if (!newOrg.name.trim()) {
      toast.error('Organization name is required');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('organizations')
        .insert([{
          name: newOrg.name,
          domain: newOrg.domain || null,
        }])
        .select()
        .single();

      if (error) throw error;

      setOrganizations([data, ...organizations]);
      setNewOrg({ name: '', domain: '' });
      toast.success('Organization created successfully');
    } catch (error) {
      console.error('Error creating organization:', error);
      toast.error('Failed to create organization');
    }
  };

  const updateOrganization = async (org: Organization) => {
    try {
      const { error } = await supabase
        .from('organizations')
        .update({
          name: org.name,
          domain: org.domain,
        })
        .eq('id', org.id);

      if (error) throw error;

      setOrganizations(organizations.map(o => o.id === org.id ? org : o));
      setEditingOrg(null);
      toast.success('Organization updated successfully');
    } catch (error) {
      console.error('Error updating organization:', error);
      toast.error('Failed to update organization');
    }
  };

  const createFund = async () => {
    if (!newFund.name.trim() || !newFund.organization_id) {
      toast.error('Fund name and organization are required');
      return;
    }

    try {
      const fundData: any = {
        name: newFund.name,
        organization_id: newFund.organization_id,
        fund_type: newFund.fund_type,
        currency: newFund.currency,
        created_by: user!.id,
        is_active: true,
      };

      if (newFund.target_size) {
        fundData.target_size = parseInt(newFund.target_size);
      }

      const { data, error } = await supabase
        .from('funds')
        .insert([fundData])
        .select()
        .single();

      if (error) throw error;

      setFunds([data, ...funds]);
      setNewFund({
        name: '',
        organization_id: '',
        fund_type: 'venture_capital',
        target_size: '',
        currency: 'USD',
      });
      toast.success('Fund created successfully');
    } catch (error) {
      console.error('Error creating fund:', error);
      toast.error('Failed to create fund');
    }
  };

  const updateUserRole = async (userId: string, newRole: 'super_admin' | 'admin' | 'fund_manager' | 'analyst' | 'viewer') => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('user_id', userId);

      if (error) throw error;

      setProfiles(profiles.map(p => 
        p.user_id === userId ? { ...p, role: newRole } : p
      ));
      toast.success('User role updated successfully');
    } catch (error) {
      console.error('Error updating user role:', error);
      toast.error('Failed to update user role');
    }
  };

  const assignUserToOrg = async (userId: string, orgId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ organization_id: orgId })
        .eq('user_id', userId);

      if (error) throw error;

      setProfiles(profiles.map(p => 
        p.user_id === userId ? { ...p, organization_id: orgId } : p
      ));
      toast.success('User assigned to organization successfully');
    } catch (error) {
      console.error('Error assigning user to organization:', error);
      toast.error('Failed to assign user to organization');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  if (profile?.role !== 'super_admin') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Access Denied</CardTitle>
          <CardDescription>
            You need Super Admin privileges to access this panel.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Panel</h1>
        <p className="text-muted-foreground">System administration and configuration</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Organizations</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrgs}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Funds</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalFunds}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Deals</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeDeals}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="organizations" className="space-y-4">
        <TabsList>
          <TabsTrigger value="organizations">Organizations</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="funds">Funds</TabsTrigger>
        </TabsList>

        <TabsContent value="organizations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Create New Organization</CardTitle>
              <CardDescription>Add a new organization to the platform</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="org-name">Organization Name</Label>
                  <Input
                    id="org-name"
                    value={newOrg.name}
                    onChange={(e) => setNewOrg({ ...newOrg, name: e.target.value })}
                    placeholder="Enter organization name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="org-domain">Domain (Optional)</Label>
                  <Input
                    id="org-domain"
                    value={newOrg.domain}
                    onChange={(e) => setNewOrg({ ...newOrg, domain: e.target.value })}
                    placeholder="company.com"
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={createOrganization} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Organization
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Organizations</CardTitle>
              <CardDescription>Manage existing organizations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {organizations.map((org) => (
                  <div key={org.id} className="flex items-center justify-between p-4 border rounded-lg">
                    {editingOrg?.id === org.id ? (
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                          value={editingOrg.name}
                          onChange={(e) => setEditingOrg({ ...editingOrg, name: e.target.value })}
                          placeholder="Organization name"
                        />
                        <Input
                          value={editingOrg.domain || ''}
                          onChange={(e) => setEditingOrg({ ...editingOrg, domain: e.target.value })}
                          placeholder="Domain"
                        />
                      </div>
                    ) : (
                      <div className="flex-1">
                        <h3 className="font-semibold">{org.name}</h3>
                        {org.domain && <p className="text-sm text-muted-foreground">{org.domain}</p>}
                        <p className="text-xs text-muted-foreground">
                          Created: {new Date(org.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                    <div className="flex gap-2">
                      {editingOrg?.id === org.id ? (
                        <>
                          <Button size="sm" onClick={() => updateOrganization(editingOrg)}>
                            <Save className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setEditingOrg(null)}>
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => setEditingOrg(org)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>Manage user roles and organization assignments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {profiles.map((profile) => (
                  <div key={profile.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-semibold">
                        {profile.first_name} {profile.last_name}
                      </h3>
                      <p className="text-sm text-muted-foreground">{profile.email}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="secondary">{profile.role}</Badge>
                        {profile.organization_id && (
                          <Badge variant="outline">
                            {organizations.find(o => o.id === profile.organization_id)?.name || 'Unknown Org'}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Select
                        value={profile.role}
                        onValueChange={(value: 'super_admin' | 'admin' | 'fund_manager' | 'analyst' | 'viewer') => updateUserRole(profile.user_id, value)}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="viewer">Viewer</SelectItem>
                          <SelectItem value="analyst">Team Member</SelectItem>
                          <SelectItem value="fund_manager">GP/Owner</SelectItem>
                          <SelectItem value="admin">Fund Administrator</SelectItem>
                          <SelectItem value="super_admin">Super Admin</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select
                        value={profile.organization_id || ''}
                        onValueChange={(value) => assignUserToOrg(profile.user_id, value)}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue placeholder="Assign org" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">No Organization</SelectItem>
                          {organizations.map((org) => (
                            <SelectItem key={org.id} value={org.id}>
                              {org.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="funds" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Create New Fund</CardTitle>
              <CardDescription>Create a fund for any organization</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fund-name">Fund Name</Label>
                  <Input
                    id="fund-name"
                    value={newFund.name}
                    onChange={(e) => setNewFund({ ...newFund, name: e.target.value })}
                    placeholder="Fund name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fund-org">Organization</Label>
                  <Select
                    value={newFund.organization_id}
                    onValueChange={(value) => setNewFund({ ...newFund, organization_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select organization" />
                    </SelectTrigger>
                    <SelectContent>
                      {organizations.map((org) => (
                        <SelectItem key={org.id} value={org.id}>
                          {org.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fund-type">Fund Type</Label>
                  <Select
                    value={newFund.fund_type}
                    onValueChange={(value: 'venture_capital' | 'private_equity') => 
                      setNewFund({ ...newFund, fund_type: value })
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
                  <Label htmlFor="fund-size">Target Size (Optional)</Label>
                  <Input
                    id="fund-size"
                    type="number"
                    value={newFund.target_size}
                    onChange={(e) => setNewFund({ ...newFund, target_size: e.target.value })}
                    placeholder="10000000"
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={createFund} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Fund
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Existing Funds</CardTitle>
              <CardDescription>All funds across organizations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {funds.map((fund) => (
                  <div key={fund.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-semibold">{fund.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {organizations.find(o => o.id === fund.organization_id)?.name || 'Unknown Organization'}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant={fund.is_active ? 'default' : 'secondary'}>
                          {fund.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                        <Badge variant="outline">{fund.fund_type.replace('_', ' ')}</Badge>
                        {fund.target_size && (
                          <Badge variant="outline">
                            {fund.currency} {fund.target_size.toLocaleString()}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}