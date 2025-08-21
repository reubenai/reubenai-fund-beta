import React from 'react';
import { useDealPermissions } from '@/hooks/useDealPermissions';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Lock } from 'lucide-react';

interface DealPermissionGuardProps {
  dealId: string;
  requiredAction: 'view' | 'comment' | 'create_note' | 'manage';
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showError?: boolean;
}

export function DealPermissionGuard({
  dealId,
  requiredAction,
  children,
  fallback,
  showError = true
}: DealPermissionGuardProps) {
  const { canPerformAction, loading, userRole } = useDealPermissions(dealId);

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // Check if user has required permission
  const hasPermission = canPerformAction(requiredAction);

  if (!hasPermission) {
    if (fallback) {
      return <>{fallback}</>;
    }

    if (showError) {
      const getErrorMessage = () => {
        if (userRole === 'none') {
          return "You don't have access to this deal. Contact a fund member to request access.";
        }

        switch (requiredAction) {
          case 'view':
            return "You don't have permission to view this deal.";
          case 'comment':
            return "You need commenter or note creator permissions to comment on this deal.";
          case 'create_note':
            return "You need note creator permissions to add notes to this deal.";
          case 'manage':
            return "You need administrative access to manage this deal's permissions.";
          default:
            return "You don't have sufficient permissions for this action.";
        }
      };

      return (
        <Alert className="border-destructive/50">
          <Lock className="h-4 w-4" />
          <AlertDescription>
            {getErrorMessage()}
          </AlertDescription>
        </Alert>
      );
    }

    return null;
  }

  return <>{children}</>;
}

interface DealActionGuardProps {
  dealId: string;
  action: 'view' | 'comment' | 'create_note' | 'manage';
  children: (canPerform: boolean, userRole: string) => React.ReactNode;
}

export function DealActionGuard({ dealId, action, children }: DealActionGuardProps) {
  const { canPerformAction, userRole, loading } = useDealPermissions(dealId);

  if (loading) {
    return children(false, 'loading');
  }

  return children(canPerformAction(action), userRole);
}