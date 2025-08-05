import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { Building2, Users, TrendingUp, Database, Plus, Edit, Save, X, Shield, Archive, ArchiveRestore, Filter, Target, Upload, Rocket, Kanban } from 'lucide-react';
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
import { EnhancedAdminFundTable } from '@/components/admin/EnhancedAdminFundTable';
import { EnhancedAdminActivityFeed } from '@/components/admin/EnhancedAdminActivityFeed';
import { AdminThesisConfigModal } from '@/components/admin/AdminThesisConfigModal';
import { AdminBulkUploadModal } from '@/components/admin/AdminBulkUploadModal';
import { ComprehensiveProductionReadiness } from '@/components/admin/ComprehensiveProductionReadiness';
import { AdminInviteUserModal } from '@/components/admin/AdminInviteUserModal';
import { AdminDealsTable } from '@/components/admin/AdminDealsTable';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';

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
  fund_type: 'vc' | 'pe';
  target_size: number | null;
  currency: string;
  is_active: boolean;
  created_at: string;
}

interface DbFund {
  id: string;
  name: string;
  organization_id: string;
  fund_type: 'venture_capital' | 'private_equity';
  target_size: number | null;
  currency: string;
  is_active: boolean;
  created_at: string;
}

export default function Admin() {
  const navigate = useNavigate();
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
  const [showArchivedFunds, setShowArchivedFunds] = useState(false);
  const [thesisConfigFund, setThesisConfigFund] = useState<Fund | null>(null);
  const [bulkUploadFund, setBulkUploadFund] = useState<Fund | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);

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

      // Check if user has admin privileges using the same logic as database RLS
      const isReubenAdmin = user?.email?.includes('@goreuben.com') || user?.email?.includes('@reuben.com');
      const hasAccess = isReubenAdmin || profileData?.role === 'super_admin' || profileData?.role === 'admin';

      if (!hasAccess) {
        toast.error(`Access denied. Admin privileges required. Current user: ${user?.email}, Role: ${profileData?.role || 'none'}`);
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
      // Transform fund types from database format to component format
      const transformedFunds = (fundsData || []).map((fund: DbFund): Fund => ({
        ...fund,
        fund_type: fund.fund_type === 'venture_capital' ? 'vc' : 'pe'
      }));
      setFunds(transformedFunds);
      setStats({
        totalOrgs: orgsData?.length || 0,
        totalUsers: profilesData?.length || 0,
        totalFunds: fundsData?.length || 0,
        activeDeals: dealsCount || 0,
        recentActivity: recentActivityCount || 0,
        pendingIssues: 0, // Implement pending issues logic
      });
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const createOrganization = async () => {
    // Check authentication state first
    if (!user) {
      toast.error('Authentication required. Please sign in first.');
      return;
    }

    if (!newOrg.name.trim()) {
      toast.error('Organization name is required');
      return;
    }

    // All authenticated users can create organizations

    try {
      const { data, error } = await supabase
        .from('organizations')
        .insert([{
          name: newOrg.name,
          domain: newOrg.domain || null,
        }])
        .select()
        .single();

      if (error) {
        console.error('Database error:', error);
        
        // Provide more specific error messages
        if (error.code === '42501') {
          toast.error('Permission denied. Please check your authentication status and try again.');
        } else if (error.code === '23505') {
          toast.error('An organization with this name already exists.');
        } else {
          toast.error(`Failed to create organization: ${error.message}`);
        }
        return;
      }

      setOrganizations([data, ...organizations]);
      setNewOrg({ name: '', domain: '' });
      toast.success('Organization created successfully');
      
      // Log the successful creation
      await logAdminActivity('organization_created', `Organization "${data.name}" created`, {
        organizationId: data.id,
        organizationName: data.name
      });
    } catch (error) {
      console.error('Error creating organization:', error);
      toast.error('Failed to create organization. Please try again.');
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

      // Transform the created fund type and add to list
      const transformedFund: Fund = {
        ...data,
        fund_type: data.fund_type === 'venture_capital' ? 'vc' : 'pe'
      };
      setFunds([transformedFund, ...funds]);
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
    // Check if user has permission to change roles
    const isReubenAdmin = user?.email?.includes('@goreuben.com') || user?.email?.includes('@reuben.com');
    const isSuperAdmin = profile?.role === 'super_admin';
    
    if (!isReubenAdmin && !isSuperAdmin) {
      toast.error('Only Super Admins or Reuben team members can modify user roles');
      return;
    }

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
    setShowInviteModal(true);
  };

  const archiveFund = async (fundId: string, fundName: string, reason: string = '') => {
    try {
      const { error } = await supabase
        .from('funds')
        .update({ is_active: false })
        .eq('id', fundId);

      if (error) throw error;

      setFunds(funds.map(f => f.id === fundId ? { ...f, is_active: false } : f));
      
      // Log admin activity
      await logAdminActivity('fund_archived', `Fund "${fundName}" has been archived`, {
        fundId,
        fundName,
        reason,
        organizationId: funds.find(f => f.id === fundId)?.organization_id
      });

      toast.success(`Fund "${fundName}" has been archived`);
    } catch (error) {
      console.error('Error archiving fund:', error);
      toast.error('Failed to archive fund');
    }
  };

  const unarchiveFund = async (fundId: string, fundName: string) => {
    try {
      const { error } = await supabase
        .from('funds')
        .update({ is_active: true })
        .eq('id', fundId);

      if (error) throw error;

      setFunds(funds.map(f => f.id === fundId ? { ...f, is_active: true } : f));
      
      // Log admin activity
      await logAdminActivity('fund_unarchived', `Fund "${fundName}" has been unarchived`, {
        fundId,
        fundName,
        organizationId: funds.find(f => f.id === fundId)?.organization_id
      });

      toast.success(`Fund "${fundName}" has been reactivated`);
    } catch (error) {
      console.error('Error unarchiving fund:', error);
      toast.error('Failed to unarchive fund');
    }
  };

  const bulkDeleteFunds = async (fundIds: string[]) => {
    try {
      // Get fund names for logging
      const fundsToDelete = funds.filter(f => fundIds.includes(f.id));
      const fundNames = fundsToDelete.map(f => f.name);

      // Delete funds from database
      const { error } = await supabase
        .from('funds')
        .delete()
        .in('id', fundIds);

      if (error) throw error;

      // Update local state
      setFunds(funds.filter(f => !fundIds.includes(f.id)));
      
      // Log admin activity
      await logAdminActivity('funds_bulk_deleted', `Bulk deleted ${fundIds.length} funds: ${fundNames.join(', ')}`, {
        fundIds,
        fundNames,
        deletedCount: fundIds.length
      });

      toast.success(`Successfully deleted ${fundIds.length} fund${fundIds.length > 1 ? 's' : ''}`);
    } catch (error) {
      console.error('Error deleting funds:', error);
      toast.error('Failed to delete funds');
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
      <Breadcrumbs />
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
              <TabsTrigger value="deals" className="h-10 px-6 rounded-md text-sm font-medium data-[state=active]:bg-card data-[state=active]:shadow-sm">Deals</TabsTrigger>
              <TabsTrigger value="production" className="h-10 px-6 rounded-md text-sm font-medium data-[state=active]:bg-card data-[state=active]:shadow-sm">
                <Rocket className="h-4 w-4 mr-2" />
                Production Readiness
              </TabsTrigger>
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
                canModifyRoles={user?.email?.includes('@goreuben.com') || user?.email?.includes('@reuben.com') || profile?.role === 'super_admin'}
              />
            </TabsContent>

            <TabsContent value="funds" className="space-y-4">
              <EnhancedAdminFundTable
                funds={funds}
                organizations={organizations}
                onCreateFund={() => {/* Will be handled by the table component itself */}}
                onConfigureThesis={(fund) => setThesisConfigFund(fund as Fund)}
                onBulkUpload={(fund) => setBulkUploadFund(fund as Fund)}
                onArchiveFund={(fundId, fundName) => archiveFund(fundId, fundName)}
                onUnarchiveFund={(fundId, fundName) => unarchiveFund(fundId, fundName)}
                onBulkDelete={bulkDeleteFunds}
                onRefresh={fetchData}
                isSuperAdmin={hasAccess}
              />
            </TabsContent>

            <TabsContent value="deals" className="space-y-6">
              <AdminDealsTable />
            </TabsContent>

            <TabsContent value="production" className="space-y-6">
              <ComprehensiveProductionReadiness />
            </TabsContent>
          </Tabs>
        </div>
        
        {/* Activity Feed Sidebar */}
        <div className="lg:col-span-1">
          <EnhancedAdminActivityFeed />
        </div>
      </div>

      {/* Thesis Configuration Modal */}
      <AdminThesisConfigModal
        fund={thesisConfigFund}
        open={!!thesisConfigFund}
        onOpenChange={(open) => !open && setThesisConfigFund(null)}
      />

      {/* Bulk Upload Modal */}
      <AdminBulkUploadModal
        fund={bulkUploadFund}
        open={!!bulkUploadFund}
        onOpenChange={(open) => !open && setBulkUploadFund(null)}
      />

      {/* User Invitation Modal */}
      <AdminInviteUserModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        organizations={organizations}
        onInviteSuccess={fetchData}
      />
    </div>
  );
}