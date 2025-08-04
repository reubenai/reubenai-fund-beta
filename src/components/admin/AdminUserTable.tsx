import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, UserPlus, Mail, Shield, Building } from 'lucide-react';
import { toast } from 'sonner';

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

interface Organization {
  id: string;
  name: string;
  domain: string | null;
}

interface AdminUserTableProps {
  profiles: Profile[];
  organizations: Organization[];
  onUpdateUserRole: (userId: string, newRole: string) => Promise<void>;
  onAssignUserToOrg: (userId: string, orgId: string) => Promise<void>;
  onInviteUser: () => void;
  canModifyRoles: boolean;
}

export function AdminUserTable({ 
  profiles, 
  organizations, 
  onUpdateUserRole, 
  onAssignUserToOrg,
  onInviteUser,
  canModifyRoles
}: AdminUserTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [orgFilter, setOrgFilter] = useState('all');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  const filteredProfiles = profiles.filter(profile => {
    const matchesSearch = 
      profile.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${profile.first_name} ${profile.last_name}`.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || profile.role === roleFilter;
    
    const matchesOrg = orgFilter === 'all' || profile.organization_id === orgFilter;

    return matchesSearch && matchesRole && matchesOrg;
  });

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'super_admin': return 'destructive';
      case 'admin': return 'default';
      case 'fund_manager': return 'secondary';
      case 'analyst': return 'outline';
      default: return 'outline';
    }
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleBulkRoleUpdate = async (newRole: string) => {
    if (!canModifyRoles) {
      toast.error('You do not have permission to modify user roles');
      return;
    }

    if (selectedUsers.length === 0) {
      toast.error('Please select users first');
      return;
    }

    try {
      await Promise.all(
        selectedUsers.map(userId => onUpdateUserRole(userId, newRole))
      );
      setSelectedUsers([]);
      toast.success(`Updated ${selectedUsers.length} users to ${newRole}`);
    } catch (error) {
      toast.error('Failed to update users');
    }
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle className="text-lg font-medium">User Management</CardTitle>
            <p className="text-sm text-muted-foreground">
              Manage user roles and organization assignments
            </p>
          </div>
          <Button onClick={onInviteUser} className="h-9">
            <UserPlus className="h-4 w-4 mr-2" />
            Invite User
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 border-0 bg-muted/30"
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-full sm:w-[150px] border-0 bg-muted/30">
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="super_admin">Super Admin</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="fund_manager">Fund Manager</SelectItem>
              <SelectItem value="analyst">Analyst</SelectItem>
              <SelectItem value="viewer">Viewer</SelectItem>
            </SelectContent>
          </Select>
          <Select value={orgFilter} onValueChange={setOrgFilter}>
            <SelectTrigger className="w-full sm:w-[200px] border-0 bg-muted/30">
              <SelectValue placeholder="Filter by org" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Organizations</SelectItem>
              {organizations.map(org => (
                <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Bulk Actions */}
        {selectedUsers.length > 0 && canModifyRoles && (
          <div className="flex flex-wrap gap-2 p-3 bg-muted/20 rounded-lg">
            <span className="text-sm font-medium text-muted-foreground">
              {selectedUsers.length} users selected:
            </span>
            <Button size="sm" variant="outline" onClick={() => handleBulkRoleUpdate('admin')}>
              Make Admin
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleBulkRoleUpdate('analyst')}>
              Make Analyst
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleBulkRoleUpdate('viewer')}>
              Make Viewer
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setSelectedUsers([])}>
              Clear Selection
            </Button>
          </div>
        )}
      </CardHeader>

      <CardContent>
        <div className="rounded-md border border-border/50">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/20">
                <TableHead className="w-12">
                  <input
                    type="checkbox"
                    checked={selectedUsers.length === filteredProfiles.length && filteredProfiles.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedUsers(filteredProfiles.map(p => p.user_id));
                      } else {
                        setSelectedUsers([]);
                      }
                    }}
                    className="rounded"
                  />
                </TableHead>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Organization</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProfiles.map((profile) => (
                <TableRow key={profile.id} className="hover:bg-muted/20">
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(profile.user_id)}
                      onChange={() => toggleUserSelection(profile.user_id)}
                      className="rounded"
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={''} />
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                          {profile.first_name?.[0]}{profile.last_name?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {profile.first_name} {profile.last_name}
                        </p>
                        <p className="text-sm text-muted-foreground">{profile.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getRoleBadgeVariant(profile.role)}>
                      {profile.role.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {profile.organization_id ? (
                      <div className="flex items-center space-x-2">
                        <Building className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {organizations.find(o => o.id === profile.organization_id)?.name || 'Unknown'}
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">No organization</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {new Date(profile.created_at).toLocaleDateString()}
                    </span>
                  </TableCell>
                   <TableCell>
                     <div className="flex space-x-2">
                       <Select 
                         value={profile.role} 
                         onValueChange={(newRole) => onUpdateUserRole(profile.user_id, newRole)}
                         disabled={!canModifyRoles}
                       >
                         <SelectTrigger className={`w-32 h-8 border-0 ${canModifyRoles ? 'bg-muted/30' : 'bg-muted/10 opacity-50'}`}>
                           <Shield className="h-3 w-3 mr-1" />
                           <SelectValue />
                         </SelectTrigger>
                         <SelectContent>
                           <SelectItem value="super_admin">Super Admin</SelectItem>
                           <SelectItem value="admin">Admin</SelectItem>
                           <SelectItem value="fund_manager">Fund Manager</SelectItem>
                           <SelectItem value="analyst">Analyst</SelectItem>
                           <SelectItem value="viewer">Viewer</SelectItem>
                         </SelectContent>
                       </Select>
                      <Select 
                        value={profile.organization_id || 'none'} 
                        onValueChange={(orgId) => {
                          if (orgId !== 'none') {
                            onAssignUserToOrg(profile.user_id, orgId);
                          }
                        }}
                      >
                        <SelectTrigger className="w-36 h-8 border-0 bg-muted/30">
                          <Building className="h-3 w-3 mr-1" />
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No Organization</SelectItem>
                          {organizations.map(org => (
                            <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
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
        
        {filteredProfiles.length === 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No users found matching your filters.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}