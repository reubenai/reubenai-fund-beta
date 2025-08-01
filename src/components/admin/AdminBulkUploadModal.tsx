import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { EnhancedBatchUploadModal } from '@/components/pipeline/EnhancedBatchUploadModal';

interface Fund {
  id: string;
  name: string;
  fund_type: 'vc' | 'pe';
  organization_id: string;
  is_active: boolean;
  target_size?: number;
  currency?: string;
}

interface AdminBulkUploadModalProps {
  fund: Fund | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AdminBulkUploadModal({ fund, open, onOpenChange }: AdminBulkUploadModalProps) {
  if (!fund) return null;

  const handleUploadComplete = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle>Bulk Upload - {fund.name}</DialogTitle>
        </DialogHeader>
        <div className="overflow-y-auto flex-1">
          <EnhancedBatchUploadModal
            open={true}
            onClose={handleUploadComplete}
            fundId={fund.id}
            onUploadComplete={handleUploadComplete}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}