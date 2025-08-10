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
import { Building2, Users, TrendingUp, Database, Plus, Edit, Save, X, Shield, Archive, ArchiveRestore, Filter, Target, Upload, Rocket, Kanban, MessageSquare, CheckCircle, XCircle, Settings } from 'lucide-react';
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
import { JWTClaimsDebugger } from '@/components/admin/JWTClaimsDebugger';
import { SystemHealthStatus } from '@/components/admin/SystemHealthStatus';
import { EnhancedAdminActivityFeed } from '@/components/admin/EnhancedAdminActivityFeed';
import { AdminThesisConfigModal } from '@/components/admin/AdminThesisConfigModal';
import { AdminBulkUploadModal } from '@/components/admin/AdminBulkUploadModal';
import { SimplifiedProductionReadiness } from '@/components/admin/SimplifiedProductionReadiness';
import { AdminInviteUserModal } from '@/components/admin/AdminInviteUserModal';
import { AdminDealsTable } from '@/components/admin/AdminDealsTable';
import AdminFundCreationModal from '@/components/admin/AdminFundCreationModal';
import { EnhancedOrganizationsTable } from '@/components/admin/EnhancedOrganizationsTable';
import { AdminSupportTickets } from '@/components/admin/AdminSupportTickets';
import { ForceAnalysisProcessor } from '@/components/admin/ForceAnalysisProcessor';
import { ComprehensiveFixVerifier } from '@/components/admin/ComprehensiveFixVerifier';
import { APIConfigurationPanel } from '@/components/admin/APIConfigurationPanel';
import { DealDataRepairTool } from '@/components/admin/DealDataRepairTool';
import { ComprehensiveArchitectureDiagram } from '@/components/admin/ComprehensiveArchitectureDiagram';
import { useFund } from '@/contexts/FundContext';
import { useUserRole } from '@/hooks/useUserRole';

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
  const { selectedFund, funds: contextFunds } = useFund();
  const { isSuperAdmin } = useUserRole();
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
  const [showCreateFundModal, setShowCreateFundModal] = useState(false);

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

      // Fetch all organizations using admin function
      const { data: orgsData, error: orgsError } = await supabase
        .rpc('admin_get_all_organizations');
        
      if (orgsError) {
        console.error('Error fetching organizations:', orgsError);
        toast.error('Failed to fetch organizations');
      }

      // Fetch all profiles using admin function
      const { data: profilesData, error: profilesError } = await supabase
        .rpc('admin_get_all_profiles');
      
      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        toast.error('Failed to fetch user profiles');
      }

      // Fetch all funds using admin function  
      const { data: fundsData, error: fundsError } = await supabase
        .rpc('admin_get_all_funds');
        
      if (fundsError) {
        console.error('Error fetching funds:', fundsError);
        toast.error('Failed to fetch funds');
      }

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

  const updateUserProfile = async (userId: string, firstName: string, lastName: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          first_name: firstName,
          last_name: lastName 
        })
        .eq('user_id', userId);

      if (error) throw error;

      setProfiles(profiles.map(p => 
        p.user_id === userId ? { ...p, first_name: firstName, last_name: lastName } : p
      ));
      toast.success('User profile updated successfully');
    } catch (error) {
      console.error('Error updating user profile:', error);
      toast.error('Failed to update user profile');
    }
  };

  const deleteUser = async (userId: string) => {
    // Prevent self-deletion
    if (user?.id === userId) {
      toast.error('You cannot delete your own account');
      return;
    }

    // Prevent deletion of other super admins unless user is Reuben admin
    const targetUser = profiles.find(p => p.user_id === userId);
    const isReubenAdmin = user?.email?.includes('@goreuben.com') || user?.email?.includes('@reuben.com');
    
    if (targetUser?.role === 'super_admin' && !isReubenAdmin) {
      toast.error('You cannot delete other super admin accounts');
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          is_deleted: true, 
          deleted_at: new Date().toISOString() 
        })
        .eq('user_id', userId);

      if (error) throw error;

      // Remove from local state
      setProfiles(profiles.filter(p => p.user_id !== userId));
      
      // Log admin activity
      await logAdminActivity('user_deletion', 'User deleted', {
        deletedUserId: userId,
        deletedUserEmail: targetUser?.email,
        deletedUserName: `${targetUser?.first_name} ${targetUser?.last_name}`
      });
      
      toast.success('User deleted successfully');
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    }
  };

  const deleteOrganization = async (orgId: string) => {
    // Check if organization has associated funds or users
    const hasUsers = profiles.some(p => p.organization_id === orgId);
    const hasFunds = funds.some(f => f.organization_id === orgId);
    
    if (hasUsers || hasFunds) {
      toast.error('Cannot delete organization with associated users or funds. Please reassign them first.');
      return;
    }

    try {
      const { error } = await supabase
        .from('organizations')
        .delete()
        .eq('id', orgId);

      if (error) throw error;

      setOrganizations(organizations.filter(o => o.id !== orgId));
      toast.success('Organization deleted successfully');
    } catch (error) {
      console.error('Error deleting organization:', error);
      toast.error('Failed to delete organization');
    }
  };

  const reassignFundToOrganization = async (fundId: string, newOrgId: string) => {
    try {
      const { error } = await supabase
        .from('funds')
        .update({ organization_id: newOrgId })
        .eq('id', fundId);

      if (error) throw error;

      setFunds(funds.map(f => 
        f.id === fundId ? { ...f, organization_id: newOrgId } : f
      ));
      
      const fundName = funds.find(f => f.id === fundId)?.name;
      const orgName = organizations.find(o => o.id === newOrgId)?.name;
      
      await logAdminActivity('fund_reassignment', `Fund "${fundName}" reassigned to "${orgName}"`, {
        fundId,
        fundName,
        newOrgId,
        orgName
      });
      
      toast.success('Fund reassigned successfully');
    } catch (error) {
      console.error('Error reassigning fund:', error);
      toast.error('Failed to reassign fund');
    }
  };

  const bulkDeleteUsers = async (userIds: string[]) => {
    // Prevent self-deletion
    if (userIds.includes(user?.id || '')) {
      toast.error('You cannot delete your own account');
      return;
    }

    // Check for super admin deletions
    const targetUsers = profiles.filter(p => userIds.includes(p.user_id));
    const superAdmins = targetUsers.filter(p => p.role === 'super_admin');
    const isReubenAdmin = user?.email?.includes('@goreuben.com') || user?.email?.includes('@reuben.com');
    
    if (superAdmins.length > 0 && !isReubenAdmin) {
      toast.error('You cannot delete super admin accounts');
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          is_deleted: true, 
          deleted_at: new Date().toISOString() 
        })
        .in('user_id', userIds);

      if (error) throw error;

      // Remove from local state
      setProfiles(profiles.filter(p => !userIds.includes(p.user_id)));
      
      // Log admin activity
      await logAdminActivity('bulk_user_deletion', `Bulk deleted ${userIds.length} users`, {
        deletedUserIds: userIds,
        deletedUsers: targetUsers.map(u => ({ id: u.user_id, email: u.email, name: `${u.first_name} ${u.last_name}` }))
      });
      
      toast.success(`${userIds.length} users deleted successfully`);
    } catch (error) {
      console.error('Error bulk deleting users:', error);
      toast.error('Failed to delete users');
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

  const handleCreateFund = () => {
    setShowCreateFundModal(true);
  };

  const handleFundCreated = (newFund: Fund) => {
    setFunds([newFund, ...funds]);
    setStats(prev => ({ ...prev, totalFunds: prev.totalFunds + 1 }));
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

  const bulkDeleteDeals = async (dealIds: string[]) => {
    try {
      // Get deal names for logging
      const { data: dealsToDelete, error: fetchError } = await supabase
        .from('deals')
        .select('id, company_name')
        .in('id', dealIds);

      if (fetchError) throw fetchError;

      const dealNames = dealsToDelete?.map(d => d.company_name) || [];

      // Delete deals from database (cascading deletes will handle related data)
      const { error } = await supabase
        .from('deals')
        .delete()
        .in('id', dealIds);

      if (error) throw error;
      
      // Log admin activity
      await logAdminActivity('deals_bulk_deleted', `Bulk deleted ${dealIds.length} deals: ${dealNames.join(', ')}`, {
        dealIds,
        dealNames,
        deletedCount: dealIds.length
      });

      toast.success(`Successfully deleted ${dealIds.length} deal${dealIds.length > 1 ? 's' : ''}`);
    } catch (error) {
      console.error('Error deleting deals:', error);
      toast.error('Failed to delete deals');
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
              <TabsTrigger value="support" className="h-10 px-6 rounded-md text-sm font-medium data-[state=active]:bg-card data-[state=active]:shadow-sm">
                <MessageSquare className="h-4 w-4 mr-2" />
                Support Tickets
              </TabsTrigger>
              <TabsTrigger value="production-readiness" className="h-10 px-6 rounded-md text-sm font-medium data-[state=active]:bg-card data-[state=active]:shadow-sm">
                <Rocket className="h-4 w-4 mr-2" />
                Production Readiness
              </TabsTrigger>
              <TabsTrigger value="architecture" className="h-10 px-6 rounded-md text-sm font-medium data-[state=active]:bg-card data-[state=active]:shadow-sm">
                <Database className="h-4 w-4 mr-2" />
                Architecture
              </TabsTrigger>
              <TabsTrigger value="phase7" className="h-10 px-6 rounded-md text-sm font-medium data-[state=active]:bg-card data-[state=active]:shadow-sm">
                <Settings className="h-4 w-4 mr-2" />
                Phase 7
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

          <EnhancedOrganizationsTable
            organizations={organizations}
            onUpdateOrganization={updateOrganization}
            onDeleteOrganization={deleteOrganization}
            loading={loading}
          />
        </TabsContent>

            <TabsContent value="users" className="space-y-4">
              <AdminUserTable 
                profiles={profiles}
                organizations={organizations}
                onUpdateUserRole={updateUserRole}
                onAssignUserToOrg={assignUserToOrg}
                onDeleteUser={deleteUser}
                onBulkDeleteUsers={bulkDeleteUsers}
                onInviteUser={handleInviteUser}
                onUpdateUserProfile={updateUserProfile}
                canModifyRoles={user?.email?.includes('@goreuben.com') || user?.email?.includes('@reuben.com') || profile?.role === 'super_admin'}
              />
            </TabsContent>

            <TabsContent value="funds" className="space-y-4">
              <EnhancedAdminFundTable
                funds={funds}
                organizations={organizations}
                onCreateFund={handleCreateFund}
                onConfigureThesis={(fund) => setThesisConfigFund(fund as Fund)}
                onBulkUpload={(fund) => setBulkUploadFund(fund as Fund)}
                onArchiveFund={(fundId, fundName) => archiveFund(fundId, fundName)}
                onUnarchiveFund={(fundId, fundName) => unarchiveFund(fundId, fundName)}
                onBulkDelete={bulkDeleteFunds}
                onRefresh={fetchData}
                onReassignFund={reassignFundToOrganization}
                isSuperAdmin={hasAccess}
              />
            </TabsContent>

            <TabsContent value="deals" className="space-y-6">
              <AdminDealsTable 
                onBulkDelete={bulkDeleteDeals}
                isSuperAdmin={hasAccess}
              />
            </TabsContent>

            <TabsContent value="support" className="space-y-6">
              <AdminSupportTickets />
            </TabsContent>

            <TabsContent value="production-readiness" className="space-y-6">
              <SimplifiedProductionReadiness />
            </TabsContent>

            <TabsContent value="architecture" className="space-y-6">
              <ComprehensiveArchitectureDiagram />
            </TabsContent>

            <TabsContent value="phase7" className="space-y-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold tracking-tight">Phase 7: Critical Admin Access & Context</h2>
                  <p className="text-muted-foreground">
                    Fund context integrity, JWT claims validation, and system health monitoring.
                  </p>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <SystemHealthStatus />
                <JWTClaimsDebugger />
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Fund Context Integrity Status</h3>
                <div className="grid gap-4 md:grid-cols-3">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Available Funds</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{contextFunds.length}</div>
                      <p className="text-xs text-muted-foreground">
                        {isSuperAdmin ? 'All funds visible' : 'Organization funds only'}
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Selected Fund</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm font-bold">
                        {selectedFund?.name || 'None Selected'}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {selectedFund?.organization?.name || 'No organization'}
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Context Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2">
                        {selectedFund ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                        <span className="text-sm">
                          {selectedFund ? 'Ready for Analysis' : 'No Fund Context'}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
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

      {/* Fund Creation Modal */}
      <AdminFundCreationModal
        isOpen={showCreateFundModal}
        onClose={() => setShowCreateFundModal(false)}
        organizations={organizations}
        onFundCreated={handleFundCreated}
      />
    </div>
  );
}