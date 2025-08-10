import React from 'react';
import { CheckCircle } from 'lucide-react';

export function InvestmentStatusIndicator() {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground px-3 py-2 bg-muted/30 rounded-lg border border-border/40">
      <div className="w-2 h-2 rounded-full bg-emerald-500" />
      <span className="font-medium">Analysis: Ready</span>
      <CheckCircle className="w-4 h-4 text-emerald-600" />
    </div>
  );
}