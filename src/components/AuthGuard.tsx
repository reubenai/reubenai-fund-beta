import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { user, loading, session } = useAuth();

  // Debug logging
  console.log('🔒 [AuthGuard] State:', { 
    user: !!user, 
    loading, 
    session: !!session,
    userEmail: user?.email 
  });

  if (loading) {
    console.log('🔒 [AuthGuard] Still loading authentication...');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    console.log('🔒 [AuthGuard] No user found - redirecting to /auth');
    return <Navigate to="/auth" replace />;
  }

  console.log('🔒 [AuthGuard] User authenticated - allowing access');
  return <>{children}</>;
}