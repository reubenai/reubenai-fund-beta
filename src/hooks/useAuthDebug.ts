import { useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

export function useAuthDebug(enabled = false) {
  const { user, session } = useAuth();

  useEffect(() => {
    if (!enabled) return;

    const debugAuth = async () => {
      console.group('🔍 Authentication Debug');
      
      // Basic auth state
      console.log('User:', user);
      console.log('Session:', session);
      
      // JWT Claims analysis
      if (session?.access_token) {
        try {
          const base64Url = session.access_token.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const jsonPayload = decodeURIComponent(
            atob(base64)
              .split('')
              .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
              .join('')
          );
          const claims = JSON.parse(jsonPayload);
          console.log('JWT Claims:', claims);
          
          // Check specific claims
          console.log('Claims Analysis:', {
            hasEmail: !!claims.email,
            hasUserId: !!claims.sub,
            hasOrgId: !!claims.org_id,
            hasRole: !!claims.user_role,
            email: claims.email,
            userId: claims.sub,
            orgId: claims.org_id,
            role: claims.user_role
          });
        } catch (e) {
          console.error('Failed to decode JWT:', e);
        }
      }

      // Test database connection with user context
      if (user) {
        try {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle();
            
          console.log('Profile Query Result:', { profileData, profileError });

          // Test auth functions
          const { data: uidTest, error: uidError } = await supabase
            .rpc('auth_uid');
          console.log('auth_uid() test:', { uidTest, uidError });

          const { data: orgTest, error: orgError } = await supabase
            .rpc('auth_org_id');
          console.log('auth_org_id() test:', { orgTest, orgError });
          
        } catch (error) {
          console.error('Database test failed:', error);
        }
      }
      
      console.groupEnd();
    };

    debugAuth();
  }, [user, session, enabled]);

  return {
    debugAuth: () => {
      // Manual trigger for debugging
      console.log('Manual auth debug triggered');
    }
  };
}