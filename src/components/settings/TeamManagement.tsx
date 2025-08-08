import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  UserPlus, 
  Users, 
  Mail, 
  Shield, 
  Building, 
  MoreHorizontal,
  Edit,
  Trash2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { usePermissions } from '@/hooks/usePermissions';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';

interface TeamMember {
  id: string;
  user_id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: 'super_admin' | 'admin' | 'fund_manager' | 'analyst' | 'viewer';
  organization_id: string | null;
  created_at: string;
  is_active?: boolean;
}

interface Organization {
  id: string;
  name: string;
  domain: string | null;
}

const ROLE_OPTIONS: { value: 'viewer' | 'analyst' | 'fund_manager' | 'admin'; label: string; description: string }[] = [
  { value: 'viewer', label: 'Viewer', description: 'View-only access to deals and data' },
  { value: 'analyst', label: 'Analyst', description: 'Can analyze deals and create reports' },
  { value: 'fund_manager', label: 'Fund Manager', description: 'Can manage funds, deals, and team members' },
  { value: 'admin', label: 'Admin', description: 'Full administrative access' },
];

export default function TeamManagement() {
  const { user } = useAuth();
  const { profile, role } = useUserRole();
  const { canInviteUsers, canManageUserRoles } = usePermissions();
  const { toast } = useToast();
  
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  
  // Invite form state
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'viewer' | 'analyst' | 'fund_manager' | 'admin'>('viewer');
  const [selectedOrgId, setSelectedOrgId] = useState('');

  const canManageTeam = canInviteUsers || canManageUserRoles;

  // Debug permissions
  console.log('Team Management Permissions:', {
    role,
    canInviteUsers,
    canManageUserRoles,
    canManageTeam
  });

  useEffect(() => {
    if (user && canManageTeam) {
      fetchTeamData();
    }
  }, [user, canManageTeam]);

  const fetchTeamData = async () => {
    try {
      setLoading(true);
      
      // Fetch organizations user has access to
      const { data: orgsData, error: orgsError } = await supabase
        .from('organizations')
        .select('*')
        .order('name');

      if (orgsError) throw orgsError;
      setOrganizations(orgsData || []);

      // Fetch team members based on user's organization
      let query = supabase
        .from('profiles')
        .select('*')
        .neq('user_id', user?.id) // Exclude current user
        .order('created_at', { ascending: false });

      // If not super admin, filter by organization
      if (role !== 'super_admin' && profile?.organization_id) {
        query = query.eq('organization_id', profile.organization_id);
      }

      const { data: membersData, error: membersError } = await query;

      if (membersError) throw membersError;
      setTeamMembers(membersData || []);

      // Set default organization for invites
      if (profile?.organization_id && !selectedOrgId) {
        setSelectedOrgId(profile.organization_id);
      }

    } catch (error) {
      console.error('Error fetching team data:', error);
      toast({
        title: "Error",
        description: "Failed to load team data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInviteUser = async () => {
    if (!inviteEmail.trim()) {
      toast({
        title: "Error",
        description: "Email is required",
        variant: "destructive"
      });
      return;
    }

    if (!selectedOrgId) {
      toast({
        title: "Error",
        description: "Organization is required",
        variant: "destructive"
      });
      return;
    }

    setIsInviting(true);

    try {
      // Call the send-user-invitation edge function
      const { data, error } = await supabase.functions.invoke('send-user-invitation', {
        body: {
          email: inviteEmail.trim().toLowerCase(),
          role: inviteRole,
          organization_id: selectedOrgId,
          invitedBy: user?.email,
          message: `You've been invited to join our team as a ${ROLE_OPTIONS.find(r => r.value === inviteRole)?.label}.`
        }
      });

      if (error) throw error;

      toast({
        title: "Invitation Sent",
        description: `Invitation sent to ${inviteEmail}`,
      });

      // Reset form and close modal
      setInviteEmail('');
      setInviteRole('viewer');
      setShowInviteModal(false);
      
      // Refresh team data
      fetchTeamData();

    } catch (error: any) {
      console.error('Error sending invitation:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to send invitation",
        variant: "destructive"
      });
    } finally {
      setIsInviting(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: 'super_admin' | 'admin' | 'fund_manager' | 'analyst' | 'viewer') => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('user_id', userId);

      if (error) throw error;

      setTeamMembers(members => 
        members.map(member => 
          member.user_id === userId ? { ...member, role: newRole } : member
        )
      );

      toast({
        title: "Success",
        description: "User role updated successfully",
      });
    } catch (error) {
      console.error('Error updating user role:', error);
      toast({
        title: "Error",
        description: "Failed to update user role",
        variant: "destructive"
      });
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'super_admin': return 'destructive';
      case 'admin': return 'default';
      case 'fund_manager': return 'secondary';
      case 'analyst': return 'outline';
      default: return 'outline';
    }
  };

  if (!canManageTeam) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="flex items-center justify-center py-16">
          <div className="text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">Team Management</h3>
            <p className="text-muted-foreground">
              You need Admin or Fund Manager permissions to manage team members.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Team Management
              </CardTitle>
              <CardDescription>
                Manage your team members and their access levels
              </CardDescription>
            </div>
            <Dialog open={showInviteModal} onOpenChange={setShowInviteModal}>
              <DialogTrigger asChild>
                <Button className="h-9">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Invite Team Member
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Invite Team Member</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="invite-email">Email Address</Label>
                    <Input
                      id="invite-email"
                      type="email"
                      placeholder="Enter email address"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="invite-role">Role</Label>
                    <Select value={inviteRole} onValueChange={(value) => setInviteRole(value as 'viewer' | 'analyst' | 'fund_manager' | 'admin')}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        {ROLE_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            <div>
                              <div className="font-medium">{option.label}</div>
                              <div className="text-xs text-muted-foreground">{option.description}</div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {role === 'super_admin' && (
                    <div className="space-y-2">
                      <Label htmlFor="invite-org">Organization</Label>
                      <Select value={selectedOrgId} onValueChange={setSelectedOrgId}>
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
                  )}

                  <div className="flex gap-2 pt-4">
                    <Button 
                      variant="outline" 
                      onClick={() => setShowInviteModal(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleInviteUser} 
                      disabled={isInviting}
                      className="flex-1"
                    >
                      {isInviting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Mail className="h-4 w-4 mr-2" />
                          Send Invitation
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {teamMembers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No team members yet</h3>
              <p className="text-muted-foreground mb-4">
                Start building your team by inviting colleagues to join your organization.
              </p>
              <Button onClick={() => setShowInviteModal(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                Invite Your First Team Member
              </Button>
            </div>
          ) : (
            <div className="rounded-md border border-border/50">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/20">
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Organization</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teamMembers.map((member) => (
                    <TableRow key={member.user_id} className="hover:bg-muted/20">
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={''} />
                            <AvatarFallback className="bg-primary/10 text-primary text-xs">
                              {member.first_name?.[0]}{member.last_name?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">
                              {member.first_name} {member.last_name}
                            </p>
                            <p className="text-sm text-muted-foreground">{member.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getRoleBadgeVariant(member.role)}>
                          {member.role.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {member.organization_id ? (
                          <div className="flex items-center space-x-2">
                            <Building className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">
                              {organizations.find(o => o.id === member.organization_id)?.name || 'Unknown'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">No organization</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {new Date(member.created_at).toLocaleDateString()}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Select 
                            value={member.role} 
                            onValueChange={(newRole) => updateUserRole(member.user_id, newRole as 'super_admin' | 'admin' | 'fund_manager' | 'analyst' | 'viewer')}
                            disabled={role !== 'super_admin' && role !== 'admin'}
                          >
                            <SelectTrigger className="w-32 h-8 border-0 bg-muted/30">
                              <Shield className="h-3 w-3 mr-1" />
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {ROLE_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}