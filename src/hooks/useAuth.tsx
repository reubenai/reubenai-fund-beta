import React, { useState, useEffect, createContext, useContext } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useErrorHandler } from '@/hooks/useErrorHandler';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, options?: any) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  updatePassword: (password: string) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { handleError } = useErrorHandler();

  useEffect(() => {
    let mounted = true;

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;

        console.log('🔑 [Auth] State change:', event, 'User:', session?.user?.email, 'Session exists:', !!session);
        console.log('🔑 [Auth] Session details:', { 
          sessionId: session?.access_token ? 'present' : 'missing',
          expiresAt: session?.expires_at ? new Date(session.expires_at * 1000) : null,
          refreshToken: session?.refresh_token ? 'present' : 'missing',
          timeUntilExpiry: session?.expires_at ? Math.floor((session.expires_at * 1000 - Date.now()) / 1000) : null
        });

        // Enhanced JWT validation logging
        if (session?.access_token) {
          try {
            const payload = JSON.parse(atob(session.access_token.split('.')[1]));
            console.log('🔑 [Auth] JWT Payload:', {
              sub: payload.sub,
              email: payload.email,
              exp: new Date(payload.exp * 1000),
              iat: new Date(payload.iat * 1000),
              role: payload.role
            });
          } catch (e) {
            console.error('🔑 [Auth] Failed to parse JWT:', e);
          }
        }
        
        if (event === 'SIGNED_OUT') {
          console.log('🔑 [Auth] User signed out');
          setSession(null);
          setUser(null);
          setError(null);
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          console.log('🔑 [Auth] User signed in or token refreshed');
          setSession(session);
          setUser(session?.user ?? null);
          setError(null);
          
          // Test database connection immediately after auth
          if (session?.user?.id) {
            setTimeout(() => {
              testDatabaseConnection(session.user.id);
            }, 100);
          }
        } else if (event === 'USER_UPDATED') {
          console.log('🔑 [Auth] User updated');
          setUser(session?.user ?? null);
        }
        
        setLoading(false);
      }
    );

    // Test database connection with auth context
    const testDatabaseConnection = async (userId: string) => {
      try {
        console.log('🧪 [Auth] Testing database connection with auth context...');
        const { data, error } = await supabase
          .from('profiles')
          .select('user_id')
          .eq('user_id', userId)
          .limit(1);
          
        if (error) {
          console.error('❌ [Auth] Database auth context test FAILED:', error);
        } else {
          console.log('✅ [Auth] Database auth context test PASSED');
        }
      } catch (err) {
        console.error('💥 [Auth] Database connection test error:', err);
      }
    };

    // Get initial session
    const initializeAuth = async () => {
      try {
        console.log('🔑 [Auth] Initializing authentication...');
        const { data: { session }, error } = await supabase.auth.getSession();
        if (!mounted) return;

        console.log('🔑 [Auth] Initial session check:', 'User:', session?.user?.email, 'Session exists:', !!session);

        if (error) {
          console.error('❌ [Auth] Initialization error:', error);
          setError(error.message);
        } else {
          setSession(session);
          setUser(session?.user ?? null);
          
          // Test database connection if we have a session
          if (session?.user?.id) {
            await testDatabaseConnection(session.user.id);
          }
        }
      } catch (err) {
        console.error('💥 [Auth] Failed to initialize auth:', err);
        handleError(err, { silent: true });
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [handleError]);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      
      if (error) {
        setError(error.message);
      }
      
      return { error };
    } catch (err) {
      const errorMsg = 'Failed to sign in. Please try again.';
      setError(errorMsg);
      return { error: { message: errorMsg } };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, options?: any) => {
    setLoading(true);
    setError(null);
    
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          emailRedirectTo: redirectUrl,
          ...options
        }
      });
      
      if (error) {
        setError(error.message);
      }
      
      return { error };
    } catch (err) {
      const errorMsg = 'Failed to sign up. Please try again.';
      setError(errorMsg);
      return { error: { message: errorMsg } };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        handleError(error, { title: 'Sign Out Error' });
      }
    } catch (err) {
      handleError(err, { title: 'Sign Out Error' });
    } finally {
      setLoading(false);
    }
  };

  const refreshSession = async () => {
    try {
      const { error } = await supabase.auth.refreshSession();
      if (error) {
        console.error('Session refresh error:', error);
        setError(error.message);
      }
    } catch (err) {
      console.error('Failed to refresh session:', err);
    }
  };

  const resetPassword = async (email: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const redirectUrl = `${window.location.origin}/auth`;
      
      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        {
          redirectTo: redirectUrl
        }
      );
      
      if (error) {
        setError(error.message);
      }
      
      return { error };
    } catch (err) {
      const errorMsg = 'Failed to send reset email. Please try again.';
      setError(errorMsg);
      return { error: { message: errorMsg } };
    } finally {
      setLoading(false);
    }
  };

  const updatePassword = async (password: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const { error } = await supabase.auth.updateUser({
        password
      });
      
      if (error) {
        setError(error.message);
      }
      
      return { error };
    } catch (err) {
      const errorMsg = 'Failed to update password. Please try again.';
      setError(errorMsg);
      return { error: { message: errorMsg } };
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    session,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    refreshSession,
    resetPassword,
    updatePassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}