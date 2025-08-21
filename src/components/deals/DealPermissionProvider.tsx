import React, { createContext, useContext } from 'react';
import { useDealPermissions, DealPermissionRole } from '@/hooks/useDealPermissions';

interface DealPermissionContextType {
  userRole: DealPermissionRole | 'admin' | 'none';
  canPerformAction: (action: 'view' | 'comment' | 'create_note' | 'manage') => boolean;
  loading: boolean;
}

const DealPermissionContext = createContext<DealPermissionContextType | undefined>(undefined);

interface DealPermissionProviderProps {
  dealId: string;
  children: React.ReactNode;
}

export function DealPermissionProvider({ dealId, children }: DealPermissionProviderProps) {
  const { userRole, canPerformAction, loading } = useDealPermissions(dealId);

  const contextValue: DealPermissionContextType = {
    userRole,
    canPerformAction,
    loading
  };

  return (
    <DealPermissionContext.Provider value={contextValue}>
      {children}
    </DealPermissionContext.Provider>
  );
}

export function useDealPermissionContext() {
  const context = useContext(DealPermissionContext);
  if (context === undefined) {
    throw new Error('useDealPermissionContext must be used within a DealPermissionProvider');
  }
  return context;
}