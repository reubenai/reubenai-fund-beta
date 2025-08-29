import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { usePermissions } from '@/hooks/usePermissions';

interface PermissionDebuggerProps {
  dealId?: string;
  fundId?: string;
}

export function PermissionDebugger({ dealId, fundId }: PermissionDebuggerProps) {
  const { user, session, loading: authLoading } = useAuth();
  const { profile, role: userRole, isSuperAdmin, loading: roleLoading } = useUserRole();
  const permissionsData = usePermissions();

  // Only show in development
  if (process.env.NODE_ENV === 'production') return null;

  return (
    <div className="fixed bottom-4 right-4 bg-background border rounded-lg p-4 shadow-lg max-w-sm z-50">
      <h3 className="font-semibold text-sm mb-2">Permission Debug</h3>
      
      <div className="space-y-1 text-xs">
        <div><strong>Auth Loading:</strong> {authLoading.toString()}</div>
        <div><strong>User ID:</strong> {user?.id || 'null'}</div>
        <div><strong>Email:</strong> {user?.email || 'null'}</div>
        <div><strong>Session:</strong> {session ? 'exists' : 'null'}</div>
        
        <hr className="my-2" />
        
        <div><strong>Role Loading:</strong> {roleLoading.toString()}</div>
        <div><strong>Role:</strong> {userRole || 'null'}</div>
        <div><strong>Is Super Admin:</strong> {isSuperAdmin.toString()}</div>
        <div><strong>Org ID:</strong> {profile?.organization_id || 'null'}</div>
        
        <hr className="my-2" />
        
        <div><strong>Perms Loading:</strong> {permissionsData.loading.toString()}</div>
        <div><strong>Can Upload Docs:</strong> {permissionsData.canUploadDocuments.toString()}</div>
        <div><strong>Can View Docs:</strong> {permissionsData.canViewDocuments.toString()}</div>
        
        {dealId && <div><strong>Deal ID:</strong> {dealId}</div>}
        {fundId && <div><strong>Fund ID:</strong> {fundId}</div>}
        
        <hr className="my-2" />
        
        <div className="text-xs text-muted-foreground">
          JWT Claims (check console for details)
        </div>
      </div>
    </div>
  );
}