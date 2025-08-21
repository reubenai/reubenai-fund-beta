import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';

interface AuthStatus {
  isAuthenticated: boolean;
  user: User | null;
  session: Session | null;
  sessionHealth: 'healthy' | 'expiring' | 'expired' | 'invalid';
  timeUntilExpiry?: number;
  lastCheck: Date;
}

export function useAuthMonitoring() {
  const [authStatus, setAuthStatus] = useState<AuthStatus>({
    isAuthenticated: false,
    user: null,
    session: null,
    sessionHealth: 'invalid',
    lastCheck: new Date()
  });

  const checkAuthStatus = async (): Promise<AuthStatus> => {
    console.log('📊 [AuthMonitor] Checking authentication status...');
    
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (userError || sessionError) {
        console.error('❌ [AuthMonitor] Auth check failed:', userError || sessionError);
        return {
          isAuthenticated: false,
          user: null,
          session: null,
          sessionHealth: 'invalid',
          lastCheck: new Date()
        };
      }

      if (!user || !session) {
        console.log('⚠️ [AuthMonitor] No user or session found');
        return {
          isAuthenticated: false,
          user: null,
          session: null,
          sessionHealth: 'expired',
          lastCheck: new Date()
        };
      }

      // Check session expiry
      const currentTime = Math.floor(Date.now() / 1000);
      const expiresAt = session.expires_at || 0;
      const timeUntilExpiry = expiresAt - currentTime;

      let sessionHealth: AuthStatus['sessionHealth'] = 'healthy';
      if (timeUntilExpiry <= 0) {
        sessionHealth = 'expired';
      } else if (timeUntilExpiry < 300) { // 5 minutes
        sessionHealth = 'expiring';
      }

      console.log('✅ [AuthMonitor] Auth status:', {
        user: user.email,
        sessionHealth,
        timeUntilExpiry: `${timeUntilExpiry}s`
      });

      return {
        isAuthenticated: true,
        user,
        session,
        sessionHealth,
        timeUntilExpiry,
        lastCheck: new Date()
      };

    } catch (error) {
      console.error('💥 [AuthMonitor] Unexpected error:', error);
      return {
        isAuthenticated: false,
        user: null,
        session: null,
        sessionHealth: 'invalid',
        lastCheck: new Date()
      };
    }
  };

  const refreshAuth = async () => {
    console.log('🔄 [AuthMonitor] Refreshing authentication...');
    try {
      const { error } = await supabase.auth.refreshSession();
      if (error) {
        console.error('❌ [AuthMonitor] Session refresh failed:', error);
        return false;
      }
      
      console.log('✅ [AuthMonitor] Session refreshed successfully');
      const newStatus = await checkAuthStatus();
      setAuthStatus(newStatus);
      return true;
    } catch (error) {
      console.error('💥 [AuthMonitor] Refresh error:', error);
      return false;
    }
  };

  // Monitor auth state changes
  useEffect(() => {
    let mounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        console.log('🔔 [AuthMonitor] Auth state changed:', event);
        
        const newStatus = await checkAuthStatus();
        setAuthStatus(newStatus);

        // Auto-refresh if expiring
        if (newStatus.sessionHealth === 'expiring') {
          console.log('⏰ [AuthMonitor] Session expiring, auto-refreshing...');
          await refreshAuth();
        }
      }
    );

    // Initial check
    checkAuthStatus().then(status => {
      if (mounted) {
        setAuthStatus(status);
      }
    });

    // Periodic health checks
    const interval = setInterval(async () => {
      if (mounted) {
        const status = await checkAuthStatus();
        setAuthStatus(status);
        
        // Auto-refresh expiring sessions
        if (status.sessionHealth === 'expiring') {
          await refreshAuth();
        }
      }
    }, 30000); // Check every 30 seconds

    return () => {
      mounted = false;
      subscription.unsubscribe();
      clearInterval(interval);
    };
  }, []);

  return {
    authStatus,
    refreshAuth,
    checkAuthStatus
  };
}