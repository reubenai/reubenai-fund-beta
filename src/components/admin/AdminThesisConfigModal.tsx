import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { InvestmentStrategyManager } from '@/components/strategy/InvestmentStrategyManager';

interface Fund {
  id: string;
  name: string;
  fund_type: 'vc' | 'pe';
  organization_id: string;
  is_active: boolean;
  target_size?: number;
  currency?: string;
}

interface AdminThesisConfigModalProps {
  fund: Fund | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AdminThesisConfigModal({ fund, open, onOpenChange }: AdminThesisConfigModalProps) {
  if (!fund) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Configure Investment Strategy - {fund.name}</DialogTitle>
        </DialogHeader>
        <div className="overflow-y-auto flex-1">
          <InvestmentStrategyManager
            fundId={fund.id}
            fundName={fund.name}
            fundType={fund.fund_type}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}