import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Shield, Eye, UserCheck, Crown, Settings } from 'lucide-react';
import { UserRole } from '@/hooks/useUserRole';

interface RoleIndicatorProps {
  role: UserRole;
  isSuperAdmin?: boolean;
  showIcon?: boolean;
  variant?: 'default' | 'outline' | 'secondary' | 'destructive';
}

const getRoleConfig = (role: UserRole, isSuperAdmin: boolean) => {
  if (isSuperAdmin) {
    return {
      label: 'Super Admin',
      icon: Crown,
      variant: 'destructive' as const,
      description: 'Full system access'
    };
  }

  switch (role) {
    case 'admin':
      return {
        label: 'Admin',
        icon: Settings,
        variant: 'default' as const,
        description: 'Administrative access'
      };
    case 'fund_manager':
      return {
        label: 'Fund Manager',
        icon: UserCheck,
        variant: 'secondary' as const,
        description: 'Fund management access'
      };
    case 'analyst':
      return {
        label: 'Analyst',
        icon: Shield,
        variant: 'outline' as const,
        description: 'Analysis and research access'
      };
    case 'viewer':
    default:
      return {
        label: 'Viewer',
        icon: Eye,
        variant: 'outline' as const,
        description: 'View-only access'
      };
  }
};

export const RoleIndicator: React.FC<RoleIndicatorProps> = ({ 
  role, 
  isSuperAdmin = false, 
  showIcon = true, 
  variant 
}) => {
  const config = getRoleConfig(role, isSuperAdmin);
  const Icon = config.icon;

  return (
    <Badge variant={variant || config.variant} className="inline-flex items-center gap-1">
      {showIcon && <Icon className="h-3 w-3" />}
      {config.label}
    </Badge>
  );
};