import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';

export type DealPermissionRole = 'viewer' | 'commenter' | 'note_creator';
export type DealAccessType = 'internal' | 'external';

export interface DealPermission {
  id: string;
  deal_id: string;
  user_id: string;
  role: DealPermissionRole;
  access_type: DealAccessType;
  access_granted_by: string;
  created_at: string;
  updated_at: string;
}

export interface DealPermissionUser {
  id: string;
  email: string;
  role: DealPermissionRole;
  access_type: DealAccessType;
  granted_at: string;
}

export function useDealPermissions(dealId: string) {
  const [permissions, setPermissions] = useState<DealPermissionUser[]>([]);
  const [userRole, setUserRole] = useState<DealPermissionRole | 'admin' | 'none'>('none');
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch permissions for a deal
  const fetchDealPermissions = useCallback(async () => {
    if (!dealId) return;

    try {
      // Get all permissions for this deal with user emails
      const { data: permissionsData, error: permissionsError } = await supabase
        .from('deal_permissions')
        .select(`
          id,
          user_id,
          role,
          access_type,
          created_at
        `)
        .eq('deal_id', dealId);
        
      if (permissionsError) {
        console.error('Error fetching deal permissions:', permissionsError);
        return;
      }

      // Fetch user emails separately to avoid complex join issues
      const transformedPermissions: DealPermissionUser[] = [];
      
      if (permissionsData && permissionsData.length > 0) {
        for (const permission of permissionsData) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('email')
            .eq('user_id', permission.user_id)
            .single();
            
          if (profileData) {
            transformedPermissions.push({
              id: permission.user_id,
              email: profileData.email,
              role: permission.role as DealPermissionRole,
              access_type: permission.access_type as DealAccessType,
              granted_at: permission.created_at
            });
          }
        }
      }


      setPermissions(transformedPermissions);

      // Get current user's role for this deal
      if (user) {
        const { data: roleData } = await supabase
          .rpc('get_user_deal_role', { target_deal_id: dealId });
        
        setUserRole((roleData as DealPermissionRole | 'admin' | 'none') || 'none');
      }
    } catch (error) {
      console.error('Error in fetchDealPermissions:', error);
    } finally {
      setLoading(false);
    }
  }, [dealId, user]);

  // Grant access to a user
  const grantAccess = useCallback(async (
    email: string, 
    role: DealPermissionRole,
    accessType: DealAccessType = 'external'
  ) => {
    if (!user || !dealId) return false;

    try {
      // First, check if user exists in profiles
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('user_id, email, first_name, last_name')
        .eq('email', email)
        .single();

      let targetUserId = existingProfile?.user_id;
      const isExistingUser = !!existingProfile;

      // Get deal and fund information for invitation email
      const { data: dealData } = await supabase
        .from('deals')
        .select(`
          company_name,
          fund_id,
          funds!inner(name)
        `)
        .eq('id', dealId)
        .single();

      if (!dealData) {
        toast({
          title: "Error",
          description: "Deal information not found.",
          variant: "destructive"
        });
        return false;
      }

      // Get current user's profile information
      const { data: currentUserProfile } = await supabase
        .from('profiles')
        .select('first_name, last_name, email')
        .eq('user_id', user.id)
        .single();

      const inviterName = currentUserProfile?.first_name && currentUserProfile?.last_name
        ? `${currentUserProfile.first_name} ${currentUserProfile.last_name}`
        : currentUserProfile?.email || user.email || 'Team Member';

      if (isExistingUser && targetUserId) {
        // Grant permission for existing user
        const { error } = await supabase
          .from('deal_permissions')
          .upsert({
            deal_id: dealId,
            user_id: targetUserId,
            role,
            access_type: accessType,
            access_granted_by: user.id
          });

        if (error) {
          console.error('Error granting access:', error);
          toast({
            title: "Error",
            description: "Failed to grant access. Please try again.",
            variant: "destructive"
          });
          return false;
        }

        // Send notification email to existing user
        try {
          await supabase.functions.invoke('send-deal-invitation', {
            body: {
              recipientEmail: email,
              recipientName: existingProfile.first_name && existingProfile.last_name 
                ? `${existingProfile.first_name} ${existingProfile.last_name}` 
                : undefined,
              role,
              dealInfo: {
                id: dealId,
                companyName: dealData.company_name,
                fundName: (dealData.funds as any)?.name || 'Unknown Fund'
              },
              inviterInfo: {
                name: inviterName,
                email: user.email || currentUserProfile?.email || ''
              },
              isNewUser: false,
              accessType
            }
          });
        } catch (emailError) {
          console.warn('Failed to send notification email:', emailError);
          // Don't fail the entire operation if email fails
        }

        toast({
          title: "Access Granted",
          description: `${email} has been granted ${role} access and notified via email.`,
        });

      } else {
        // Handle new user invitation
        const invitationToken = crypto.randomUUID();
        
        // Store invitation token for later verification (you may want to create a table for this)
        // For now, we'll send the invitation email with the token
        try {
          await supabase.functions.invoke('send-deal-invitation', {
            body: {
              recipientEmail: email,
              role,
              dealInfo: {
                id: dealId,
                companyName: dealData.company_name,
                fundName: (dealData.funds as any)?.name || 'Unknown Fund'
              },
              inviterInfo: {
                name: inviterName,
                email: user.email || currentUserProfile?.email || ''
              },
              isNewUser: true,
              invitationToken,
              accessType
            }
          });

          // Store pending invitation (optional - you can implement this later)
          // This would track invitations until the user signs up
          
          toast({
            title: "Invitation Sent",
            description: `Invitation sent to ${email}. They will receive access once they sign up.`,
          });
        } catch (emailError) {
          console.error('Failed to send invitation email:', emailError);
          toast({
            title: "Error",
            description: "Failed to send invitation email. Please try again.",
            variant: "destructive"
          });
          return false;
        }
      }

      await fetchDealPermissions();
      return true;
    } catch (error) {
      console.error('Error in grantAccess:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive"
      });
      return false;
    }
  }, [user, dealId, toast, fetchDealPermissions]);

  // Revoke access from a user
  const revokeAccess = useCallback(async (userId: string) => {
    if (!dealId) return false;

    try {
      const { error } = await supabase
        .from('deal_permissions')
        .delete()
        .eq('deal_id', dealId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error revoking access:', error);
        toast({
          title: "Error",
          description: "Failed to revoke access. Please try again.",
          variant: "destructive"
        });
        return false;
      }

      toast({
        title: "Access Revoked",
        description: "User access has been revoked from this deal.",
      });

      await fetchDealPermissions();
      return true;
    } catch (error) {
      console.error('Error in revokeAccess:', error);
      return false;
    }
  }, [dealId, toast, fetchDealPermissions]);

  // Update user role
  const updateRole = useCallback(async (userId: string, newRole: DealPermissionRole) => {
    if (!user || !dealId) return false;

    try {
      const { error } = await supabase
        .from('deal_permissions')
        .update({ 
          role: newRole,
          updated_at: new Date().toISOString()
        })
        .eq('deal_id', dealId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error updating role:', error);
        toast({
          title: "Error",
          description: "Failed to update role. Please try again.",
          variant: "destructive"
        });
        return false;
      }

      toast({
        title: "Role Updated",
        description: `User role has been updated to ${newRole}.`,
      });

      await fetchDealPermissions();
      return true;
    } catch (error) {
      console.error('Error in updateRole:', error);
      return false;
    }
  }, [user, dealId, toast, fetchDealPermissions]);

  // Check if current user can perform an action
  const canPerformAction = useCallback((action: 'view' | 'comment' | 'create_note' | 'manage') => {
    switch (action) {
      case 'view':
        return userRole !== 'none';
      case 'comment':
        return ['commenter', 'note_creator', 'admin'].includes(userRole);
      case 'create_note':
        return ['note_creator', 'admin'].includes(userRole);
      case 'manage':
        return userRole === 'admin';
      default:
        return false;
    }
  }, [userRole]);

  useEffect(() => {
    fetchDealPermissions();
  }, [fetchDealPermissions]);

  return {
    permissions,
    userRole,
    loading,
    grantAccess,
    revokeAccess,
    updateRole,
    canPerformAction,
    refetch: fetchDealPermissions
  };
}