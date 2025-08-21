import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session } from '@supabase/supabase-js';

interface AuthValidationResult {
  isValid: boolean;
  user: any;
  session: Session | null;
  error?: string;
}

export function useAuthValidation() {
  const [validationCache, setValidationCache] = useState<{
    timestamp: number;
    result: AuthValidationResult | null;
  }>({ timestamp: 0, result: null });

  const validateAuthContext = useCallback(async (forceRefresh = false): Promise<AuthValidationResult> => {
    const now = Date.now();
    
    // Use cache if fresh and not forcing refresh
    if (!forceRefresh && validationCache.result && (now - validationCache.timestamp < 30000)) {
      console.log('🔄 [AuthValidation] Using cached validation result');
      return validationCache.result;
    }

    console.log('🔍 [AuthValidation] Validating authentication context...');
    
    try {
      // Check current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('❌ [AuthValidation] Session error:', sessionError);
        const result = {
          isValid: false,
          user: null,
          session: null,
          error: `Session error: ${sessionError.message}`
        };
        setValidationCache({ timestamp: now, result });
        return result;
      }

      if (!session) {
        console.warn('⚠️ [AuthValidation] No active session found');
        const result = {
          isValid: false,
          user: null,
          session: null,
          error: 'No active session'
        };
        setValidationCache({ timestamp: now, result });
        return result;
      }

      // Check session expiry
      const expiresAt = session.expires_at;
      const currentTime = Math.floor(Date.now() / 1000);
      const timeUntilExpiry = (expiresAt || 0) - currentTime;

      console.log('⏱️ [AuthValidation] Session timing:', {
        expiresAt: new Date((expiresAt || 0) * 1000),
        timeUntilExpiry: `${timeUntilExpiry}s`,
        willExpireSoon: timeUntilExpiry < 300 // 5 minutes
      });

      // Auto-refresh if expiring soon
      if (timeUntilExpiry < 300) {
        console.log('🔄 [AuthValidation] Session expiring soon, refreshing...');
        const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError) {
          console.error('❌ [AuthValidation] Refresh failed:', refreshError);
          const result = {
            isValid: false,
            user: session.user,
            session: session,
            error: `Session refresh failed: ${refreshError.message}`
          };
          setValidationCache({ timestamp: now, result });
          return result;
        }
        
        if (refreshedSession) {
          console.log('✅ [AuthValidation] Session refreshed successfully');
          const result = {
            isValid: true,
            user: refreshedSession.user,
            session: refreshedSession,
          };
          setValidationCache({ timestamp: now, result });
          return result;
        }
      }

      // Verify JWT structure
      if (!session.access_token) {
        console.error('❌ [AuthValidation] Missing access token');
        const result = {
          isValid: false,
          user: session.user,
          session: session,
          error: 'Missing access token'
        };
        setValidationCache({ timestamp: now, result });
        return result;
      }

      // Verify user context
      if (!session.user?.id) {
        console.error('❌ [AuthValidation] Missing user ID');
        const result = {
          isValid: false,
          user: session.user,
          session: session,
          error: 'Missing user ID'
        };
        setValidationCache({ timestamp: now, result });
        return result;
      }

      // Test database connectivity with auth context
      console.log('🧪 [AuthValidation] Testing database auth context...');
      const { data: testData, error: testError } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('user_id', session.user.id)
        .limit(1);

      if (testError) {
        console.error('❌ [AuthValidation] Database auth test failed:', testError);
        const result = {
          isValid: false,
          user: session.user,
          session: session,
          error: `Database auth test failed: ${testError.message}`
        };
        setValidationCache({ timestamp: now, result });
        return result;
      }

      console.log('✅ [AuthValidation] All checks passed');
      const result = {
        isValid: true,
        user: session.user,
        session: session,
      };
      
      setValidationCache({ timestamp: now, result });
      return result;

    } catch (error) {
      console.error('💥 [AuthValidation] Unexpected error:', error);
      const result = {
        isValid: false,
        user: null,
        session: null,
        error: `Validation failed: ${error}`
      };
      setValidationCache({ timestamp: now, result });
      return result;
    }
  }, [validationCache]);

  const ensureAuthContext = useCallback(async (): Promise<AuthValidationResult> => {
    console.log('🛡️ [AuthValidation] Ensuring authentication context...');
    
    let validation = await validateAuthContext();
    
    // If invalid, try one refresh attempt
    if (!validation.isValid && validation.session) {
      console.log('🔄 [AuthValidation] First validation failed, attempting session refresh...');
      validation = await validateAuthContext(true);
    }
    
    // If still invalid and no session, user needs to re-authenticate
    if (!validation.isValid && !validation.session) {
      console.error('🚨 [AuthValidation] No valid session - user needs to re-authenticate');
      // Force navigation to auth page
      setTimeout(() => {
        window.location.href = '/auth';
      }, 1000);
    }
    
    return validation;
  }, [validateAuthContext]);

  // Auto-validate on mount and periodically
  useEffect(() => {
    validateAuthContext();
    
    const interval = setInterval(() => {
      validateAuthContext();
    }, 60000); // Check every minute
    
    return () => clearInterval(interval);
  }, [validateAuthContext]);

  return {
    validateAuthContext,
    ensureAuthContext,
    clearCache: () => setValidationCache({ timestamp: 0, result: null })
  };
}