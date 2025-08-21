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
        .select('user_id, email')
        .eq('email', email)
        .single();

      let targetUserId = existingProfile?.user_id;

      // If user doesn't exist, create external user profile
      if (!existingProfile && accessType === 'external') {
        // For external users, we'll create a placeholder profile
        // In a real implementation, you'd send an invitation email
        toast({
          title: "Feature Coming Soon",
          description: "External user invitations will be available soon. For now, users must sign up first.",
          variant: "default"
        });
        return false;
      }

      if (!targetUserId) {
        toast({
          title: "User Not Found",
          description: "The user must have an account before being granted access.",
          variant: "destructive"
        });
        return false;
      }

      // Grant permission
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

      toast({
        title: "Access Granted",
        description: `${email} has been granted ${role} access to this deal.`,
      });

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