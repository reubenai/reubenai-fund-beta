import { useState, useEffect, useCallback } from 'react';
import { useSimplePermissions } from './useSimplePermissions';

export type SimpleDealPermissionRole = 'viewer' | 'commenter' | 'note_creator' | 'admin' | 'none';

export const useSimpleDealPermissions = (dealId: string) => {
  const [userRole, setUserRole] = useState<SimpleDealPermissionRole>('none');
  const [loading, setLoading] = useState(true);
  const { checkDealAccess, getUserInfo } = useSimplePermissions();

  const fetchDealPermissions = useCallback(async () => {
    if (!dealId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Check deal access using organization matching
      const accessCheck = await checkDealAccess(dealId);
      
      if (!accessCheck.canAccess) {
        setUserRole('none');
        return;
      }

      // Get user info to determine role
      const userInfo = await getUserInfo();
      
      // If user is a Reuben admin, give admin access
      if (userInfo.isReubenAdmin) {
        setUserRole('admin');
        return;
      }

      // If user has access and is in a fund management role, give admin access
      if (userInfo.role && ['super_admin', 'admin', 'fund_manager'].includes(userInfo.role)) {
        setUserRole('admin');
      } else if (userInfo.role === 'analyst') {
        setUserRole('note_creator');
      } else {
        // Default to viewer if they have access but limited role
        setUserRole('viewer');
      }
    } catch (error) {
      console.error('Error checking deal permissions:', error);
      setUserRole('none');
    } finally {
      setLoading(false);
    }
  }, [dealId, checkDealAccess, getUserInfo]);

  const canPerformAction = useCallback((action: 'view' | 'comment' | 'create_note' | 'manage'): boolean => {
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
    userRole,
    loading,
    canPerformAction,
    fetchDealPermissions,
    // Stub implementations for compatibility - not needed for basic access control
    permissions: [],
    grantAccess: async () => {},
    revokeAccess: async () => {},
    updateRole: async () => {}
  };
};