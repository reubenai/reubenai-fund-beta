import { useState, useEffect } from 'react';
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
        setProfile(null);
        setLoading(false);
        return;
      }

      try {
        // Check if user is Reuben admin by email
        const isReubenAdmin = user.email?.includes('@goreuben.com') || user.email?.includes('@reuben.com');
        
        // Fetch user profile
        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('role, organization_id')
          .eq('user_id', user.id)
          .single();

        if (error) throw error;

        // Determine if user is super admin
        const is_super_admin = profileData?.role === 'super_admin' || isReubenAdmin;

        setProfile({
          role: profileData?.role || 'viewer',
          organization_id: profileData?.organization_id || null,
          is_super_admin
        });
      } catch (error) {
        console.error('Error fetching user profile:', error);
        setProfile(null);
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