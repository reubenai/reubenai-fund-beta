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
import { Building2, Users, TrendingUp, Database, Plus, Edit, Save, X, Shield } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { AdminStats } from '@/components/admin/AdminStats';
import { AdminUserTable } from '@/components/admin/AdminUserTable';
import { AdminActivityFeed } from '@/components/admin/AdminActivityFeed';

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
    recentActivity: 0,
    pendingIssues: 0,
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

      // Allow access for super_admin role OR specific email addresses
      const hasAccess = profileData?.role === 'super_admin' || 
                       user?.email === 'kat@goreuben.com' || 
                       user?.email === 'hello@goreuben.com';

      if (!hasAccess) {
        toast.error('Access denied. Super Admin privileges required.');
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

      // Fetch recent activity count (last 24 hours)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const { count: recentActivityCount } = await supabase
        .from('activity_events')
        .select('*', { count: 'exact', head: true })
        .gte('occurred_at', yesterday.toISOString());

      setOrganizations(orgsData || []);
      setProfiles(profilesData || []);
      setFunds(fundsData || []);
      setStats({
        totalOrgs: orgsData?.length || 0,
        totalUsers: profilesData?.length || 0,
        totalFunds: fundsData?.length || 0,
        activeDeals: dealsCount || 0,
        recentActivity: recentActivityCount || 0,
        pendingIssues: 0, // TODO: Implement pending issues logic
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
        fundData.target_size = parseInt(newFund.target_size) * 1000000; // Convert millions to actual amount
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
      
      // Log admin activity
      await logAdminActivity('organization_assignment', 'User assigned to organization', {
        userId,
        organizationId: orgId,
        organizationName: organizations.find(o => o.id === orgId)?.name
      });
      
      toast.success('User assigned to organization successfully');
    } catch (error) {
      console.error('Error assigning user to organization:', error);
      toast.error('Failed to assign user to organization');
    }
  };

  const logAdminActivity = async (type: string, description: string, context: any = {}) => {
    try {
      await supabase.from('activity_events').insert([{
        activity_type: 'system_event',
        title: 'Admin Action',
        description,
        user_id: user!.id,
        fund_id: '1fbf40e1-9307-4399-b3c5-8034d7cdbfde', // Default fund for admin actions
        context_data: { type, ...context },
        tags: ['admin', type],
        priority: 'medium'
      }]);
    } catch (error) {
      console.error('Error logging admin activity:', error);
    }
  };

  const handleInviteUser = () => {
    // TODO: Implement user invitation modal
    toast.info('User invitation feature coming soon');
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

  const hasAccess = profile?.role === 'super_admin' || 
                   user?.email === 'kat@goreuben.com' || 
                   user?.email === 'hello@goreuben.com';

  if (!hasAccess) {
    return (
      <div className="space-y-8 p-8">
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You need Super Admin privileges to access this panel.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Shield className="h-8 w-8 text-primary" />
            Super Admin Dashboard
          </h1>
          <p className="text-muted-foreground mt-2">
            Platform administration and organization management
          </p>
        </div>
        <Badge variant="destructive" className="px-3 py-1">
          Super Admin Access
        </Badge>
      </div>

      {/* Enhanced Stats Overview */}
      <AdminStats stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Tabs defaultValue="organizations" className="space-y-6">
            <TabsList className="h-12 w-auto bg-background border rounded-lg p-1">
              <TabsTrigger value="organizations" className="h-10 px-6 rounded-md text-sm font-medium data-[state=active]:bg-card data-[state=active]:shadow-sm">Organizations</TabsTrigger>
              <TabsTrigger value="users" className="h-10 px-6 rounded-md text-sm font-medium data-[state=active]:bg-card data-[state=active]:shadow-sm">Users</TabsTrigger>
              <TabsTrigger value="funds" className="h-10 px-6 rounded-md text-sm font-medium data-[state=active]:bg-card data-[state=active]:shadow-sm">Funds</TabsTrigger>
            </TabsList>

        <TabsContent value="organizations" className="space-y-6">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-medium">Create New Organization</CardTitle>
              <CardDescription>Add a new organization to the platform</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="org-name" className="text-sm font-medium">Organization Name</Label>
                  <Input
                    id="org-name"
                    value={newOrg.name}
                    onChange={(e) => setNewOrg({ ...newOrg, name: e.target.value })}
                    placeholder="Enter organization name"
                    className="border-0 bg-muted/30"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="org-domain" className="text-sm font-medium">Domain (Optional)</Label>
                  <Input
                    id="org-domain"
                    value={newOrg.domain}
                    onChange={(e) => setNewOrg({ ...newOrg, domain: e.target.value })}
                    placeholder="company.com"
                    className="border-0 bg-muted/30"
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={createOrganization} className="w-full h-9 text-sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Organization
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-medium">Organizations</CardTitle>
              <CardDescription>Manage existing organizations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {organizations.map((org) => (
                  <div key={org.id} className="flex items-center justify-between p-4 bg-muted/20 rounded-lg">
                    {editingOrg?.id === org.id ? (
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                          value={editingOrg.name}
                          onChange={(e) => setEditingOrg({ ...editingOrg, name: e.target.value })}
                          placeholder="Organization name"
                          className="border-0 bg-background"
                        />
                        <Input
                          value={editingOrg.domain || ''}
                          onChange={(e) => setEditingOrg({ ...editingOrg, domain: e.target.value })}
                          placeholder="Domain"
                          className="border-0 bg-background"
                        />
                      </div>
                    ) : (
                      <div className="flex-1">
                        <h3 className="font-medium">{org.name}</h3>
                        {org.domain && <p className="text-sm text-muted-foreground">{org.domain}</p>}
                        <p className="text-xs text-muted-foreground">
                          Created: {new Date(org.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                    <div className="flex gap-2">
                      {editingOrg?.id === org.id ? (
                        <>
                          <Button size="sm" onClick={() => updateOrganization(editingOrg)} className="h-8 px-3">
                            <Save className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setEditingOrg(null)} className="h-8 px-3">
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => setEditingOrg(org)} className="h-8 px-3">
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
              <AdminUserTable 
                profiles={profiles}
                organizations={organizations}
                onUpdateUserRole={updateUserRole}
                onAssignUserToOrg={assignUserToOrg}
                onInviteUser={handleInviteUser}
              />
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
        
        {/* Activity Feed Sidebar */}
        <div className="lg:col-span-1">
          <AdminActivityFeed />
        </div>
      </div>
    </div>
  );
}