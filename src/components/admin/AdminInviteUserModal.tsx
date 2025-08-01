import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Mail, Users, UserCheck } from 'lucide-react';

interface Organization {
  id: string;
  name: string;
}

interface AdminInviteUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  organizations: Organization[];
  onInviteSuccess: () => void;
}

const ROLE_OPTIONS = [
  { value: 'viewer', label: 'Viewer', description: 'View-only access' },
  { value: 'analyst', label: 'Analyst', description: 'Can analyze deals and create reports' },
  { value: 'fund_manager', label: 'Fund Manager', description: 'Can manage funds and deals' },
  { value: 'admin', label: 'Admin', description: 'Full administrative access' },
];

export function AdminInviteUserModal({ isOpen, onClose, organizations, onInviteSuccess }: AdminInviteUserModalProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('viewer');
  const [organizationId, setOrganizationId] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [isInviting, setIsInviting] = useState(false);

  const handleInvite = async () => {
    if (!email.trim()) {
      toast.error('Email is required');
      return;
    }

    if (!organizationId) {
      toast.error('Organization is required');
      return;
    }

    setIsInviting(true);

    try {
      const { data, error } = await supabase.functions.invoke('send-user-invitation', {
        body: {
          email: email.trim(),
          role,
          organizationId,
          customMessage: customMessage.trim() || undefined
        }
      });

      if (error) {
        console.error('Invitation error:', error);
        toast.error(`Failed to send invitation: ${error.message}`);
        return;
      }

      if (data?.error) {
        console.error('Invitation service error:', data.error);
        toast.error(`Failed to send invitation: ${data.error}`);
        return;
      }

      toast.success(`Invitation sent successfully to ${email}`);
      
      // Reset form
      setEmail('');
      setRole('viewer');
      setOrganizationId('');
      setCustomMessage('');
      
      onInviteSuccess();
      onClose();
    } catch (error) {
      console.error('Error sending invitation:', error);
      toast.error('Failed to send invitation');
    } finally {
      setIsInviting(false);
    }
  };

  const selectedOrg = organizations.find(org => org.id === organizationId);
  const selectedRoleInfo = ROLE_OPTIONS.find(r => r.value === role);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Invite New User
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {ROLE_OPTIONS.map((roleOption) => (
                  <SelectItem key={roleOption.value} value={roleOption.value}>
                    <div>
                      <div className="font-medium">{roleOption.label}</div>
                      <div className="text-sm text-muted-foreground">{roleOption.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="organization">Organization</Label>
            <Select value={organizationId} onValueChange={setOrganizationId}>
              <SelectTrigger>
                <SelectValue placeholder="Select an organization" />
              </SelectTrigger>
              <SelectContent>
                {organizations.map((org) => (
                  <SelectItem key={org.id} value={org.id}>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      {org.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Custom Message (Optional)</Label>
            <Textarea
              id="message"
              placeholder="Add a personal message to the invitation..."
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              rows={3}
            />
          </div>

          {/* Preview Section */}
          {email && selectedOrg && (
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <UserCheck className="h-4 w-4" />
                Invitation Preview
              </h4>
              <div className="text-sm space-y-1">
                <div><strong>Email:</strong> {email}</div>
                <div><strong>Role:</strong> {selectedRoleInfo?.label}</div>
                <div><strong>Organization:</strong> {selectedOrg.name}</div>
                {customMessage && (
                  <div><strong>Message:</strong> {customMessage}</div>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose} disabled={isInviting}>
              Cancel
            </Button>
            <Button onClick={handleInvite} disabled={isInviting || !email || !organizationId}>
              {isInviting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Send Invitation
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}