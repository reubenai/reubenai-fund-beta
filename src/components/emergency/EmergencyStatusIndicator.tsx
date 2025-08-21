import React from 'react';
import { useEmergencyDealChecker } from '@/hooks/useEmergencyDealChecker';
import { AlertTriangle, Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface EmergencyStatusIndicatorProps {
  dealId: string;
  className?: string;
}

export function EmergencyStatusIndicator({ dealId, className }: EmergencyStatusIndicatorProps) {
  const { isBlacklisted } = useEmergencyDealChecker();
  
  const isBlocked = isBlacklisted(dealId);

  if (!isBlocked) {
    return null;
  }

  return (
    <Badge 
      variant="destructive" 
      className={`flex items-center gap-1 ${className}`}
    >
      <AlertTriangle className="h-3 w-3" />
      Analysis Blocked
    </Badge>
  );
}

interface EmergencySystemStatusProps {
  className?: string;
}

export function EmergencySystemStatus({ className }: EmergencySystemStatusProps) {
  return (
    <div className={`p-4 border border-destructive/20 rounded-lg bg-destructive/5 ${className}`}>
      <div className="flex items-center gap-2 mb-2">
        <Shield className="h-4 w-4 text-destructive" />
        <h3 className="font-semibold text-destructive">Emergency Shutdown Active</h3>
      </div>
      <p className="text-sm text-muted-foreground">
        Deal <code>7ac26a5f...df81d</code> has been emergency blocked due to excessive system activity. 
        All analysis operations for this deal are disabled to protect system stability.
      </p>
      <div className="mt-3 space-y-1 text-xs text-muted-foreground">
        <div>• Analysis blocked until 2030-01-01</div>
        <div>• Auto-analysis disabled</div>
        <div>• Queue status: blocked</div>
        <div>• Added to emergency blacklist</div>
      </div>
    </div>
  );
}