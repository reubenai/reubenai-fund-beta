import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Share2, UserPlus, Trash2, Edit3, Mail } from 'lucide-react';
import { useDealPermissions, DealPermissionRole } from '@/hooks/useDealPermissions';
import { format } from 'date-fns';

interface ShareDealModalProps {
  dealId: string;
  dealName: string;
  children?: React.ReactNode;
}

export function ShareDealModal({ dealId, dealName, children }: ShareDealModalProps) {
  const [open, setOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<DealPermissionRole>('viewer');
  const [isInviting, setIsInviting] = useState(false);

  const {
    permissions,
    userRole,
    loading,
    grantAccess,
    revokeAccess,
    updateRole,
    canPerformAction
  } = useDealPermissions(dealId);

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;

    setIsInviting(true);
    const success = await grantAccess(inviteEmail, inviteRole, 'external');
    
    if (success) {
      setInviteEmail('');
      setInviteRole('viewer');
    }
    
    setIsInviting(false);
  };

  const getRoleBadgeVariant = (role: DealPermissionRole | 'admin') => {
    switch (role) {
      case 'admin': return 'default';
      case 'note_creator': return 'secondary';
      case 'commenter': return 'outline';
      case 'viewer': return 'outline';
      default: return 'outline';
    }
  };

  const getRoleDescription = (role: DealPermissionRole | 'admin') => {
    switch (role) {
      case 'admin': return 'Full access to deal and settings';
      case 'note_creator': return 'Can view, comment, and create notes';
      case 'commenter': return 'Can view and comment on the deal';
      case 'viewer': return 'Can only view the deal';
      default: return '';
    }
  };

  if (!canPerformAction('manage')) {
    return null; // Don't show share button for non-admin users
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm">
            <Share2 className="h-4 w-4 mr-2" />
            Share Deal
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share "{dealName}"
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Invite New User */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Invite User
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <Label htmlFor="invite-email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="invite-email"
                      type="email"
                      placeholder="user@example.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="invite-role">Role</Label>
                  <Select value={inviteRole} onValueChange={(value) => setInviteRole(value as DealPermissionRole)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="viewer">Viewer</SelectItem>
                      <SelectItem value="commenter">Commenter</SelectItem>
                      <SelectItem value="note_creator">Note Creator</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="text-sm text-muted-foreground">
                {getRoleDescription(inviteRole)}
              </div>

              <Button 
                onClick={handleInvite}
                disabled={!inviteEmail.trim() || isInviting}
                className="w-full"
              >
                {isInviting ? 'Sending Invite...' : 'Send Invite'}
              </Button>
            </CardContent>
          </Card>

          <Separator />

          {/* Current Access */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Current Access ({permissions.length} users)</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-4">
                  <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
                  <p className="text-sm text-muted-foreground mt-2">Loading permissions...</p>
                </div>
              ) : permissions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Share2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No external users have access to this deal yet.</p>
                  <p className="text-sm">Fund members have access by default.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {permissions.map((permission) => (
                    <div
                      key={permission.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div className="flex-1">
                            <p className="font-medium">{permission.email}</p>
                            <p className="text-sm text-muted-foreground">
                              Granted {format(new Date(permission.granted_at), 'MMM d, yyyy')}
                            </p>
                          </div>
                          <Badge variant={getRoleBadgeVariant(permission.role)}>
                            {permission.role.replace('_', ' ')}
                          </Badge>
                          {permission.access_type === 'external' && (
                            <Badge variant="outline" className="text-xs">
                              External
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        <Select
                          value={permission.role}
                          onValueChange={(newRole) => updateRole(permission.id, newRole as DealPermissionRole)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="viewer">Viewer</SelectItem>
                            <SelectItem value="commenter">Commenter</SelectItem>
                            <SelectItem value="note_creator">Note Creator</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => revokeAccess(permission.id)}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Role Descriptions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Permission Levels</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <div>
                  <Badge variant="outline">Viewer</Badge>
                  <p className="text-sm text-muted-foreground mt-1">View deal summary, documents, and analysis</p>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <Badge variant="outline">Commenter</Badge>
                  <p className="text-sm text-muted-foreground mt-1">All viewer permissions + can comment</p>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <Badge variant="secondary">Note Creator</Badge>
                  <p className="text-sm text-muted-foreground mt-1">All commenter permissions + can create/edit notes</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}