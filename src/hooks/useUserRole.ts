import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type UserRole = 'super_admin' | 'admin' | 'fund_manager' | 'analyst' | 'viewer';

interface UserProfile {
  role: UserRole;
  organization_id: string | null;
  is_super_admin: boolean;
}

export const useUserRole = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) {
        console.log('👤 [UserRole] No user - clearing profile');
        setProfile(null);
        setLoading(false);
        return;
      }

      console.log('👤 [UserRole] Fetching profile for:', user.email);

      try {
        // Check if user is Reuben admin by email
        const isReubenAdmin = user.email?.includes('@goreuben.com') || user.email?.includes('@reuben.com');
        
        if (isReubenAdmin) {
          console.log('👤 [UserRole] Reuben admin detected:', user.email);
          // For Reuben admins, set super_admin directly
          setProfile({
            role: 'super_admin',
            organization_id: '550e8400-e29b-41d4-a716-446655440000',
            is_super_admin: true
          });
        } else {
          // Try to fetch user profile for non-Reuben users
          console.log('👤 [UserRole] Fetching profile from database for user:', user.id);
          
          const { data: profileData, error } = await supabase
            .from('profiles')
            .select('role, organization_id, email, is_deleted')
            .eq('user_id', user.id)
            .maybeSingle();

          if (error) {
            console.error('👤 [UserRole] Error fetching user profile:', error);
          }

          console.log('👤 [UserRole] Profile data retrieved:', profileData);

          // Check if profile exists and is not deleted
          if (profileData && !profileData.is_deleted) {
            setProfile({
              role: profileData.role,
              organization_id: profileData.organization_id,
              is_super_admin: false
            });
            console.log('👤 [UserRole] Profile set successfully:', {
              role: profileData.role,
              organization_id: profileData.organization_id
            });
          } else {
            // Profile missing or deleted - create a default viewer profile
            console.warn('👤 [UserRole] Profile missing or deleted for user:', user.email);
            console.warn('👤 [UserRole] This user needs their profile to be recreated by an admin');
            
            setProfile({
              role: 'viewer',
              organization_id: null,
              is_super_admin: false
            });
          }
        }
      } catch (error) {
        console.error('👤 [UserRole] Error in fetchUserProfile:', error);
        // Fallback: still check if email suggests super admin
        const isReubenAdmin = user.email?.includes('@goreuben.com') || user.email?.includes('@reuben.com');
        if (isReubenAdmin) {
          setProfile({
            role: 'super_admin',
            organization_id: '550e8400-e29b-41d4-a716-446655440000',
            is_super_admin: true
          });
        } else {
          setProfile({
            role: 'viewer',
            organization_id: null,
            is_super_admin: false
          });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [user]);

  return {
    profile,
    loading,
    isSuperAdmin: profile?.is_super_admin || false,
    role: profile?.role || 'viewer',
    organizationId: profile?.organization_id
  };
};