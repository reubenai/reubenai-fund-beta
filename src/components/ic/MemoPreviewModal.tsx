// Legacy component - redirects to enhanced version
import React from 'react';
import { EnhancedMemoPreviewModal } from './EnhancedMemoPreviewModal';

interface Deal {
  id: string;
  company_name: string;
  founder?: string;
  deal_size?: number;
  valuation?: number;
  status?: string;
  industry?: string;
  location?: string;
  description?: string;
  overall_score?: number;
  rag_status?: string;
}

interface MemoPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  deal: Deal;
  fundId: string;
}

export const MemoPreviewModal: React.FC<MemoPreviewModalProps> = (props) => {
  // Redirect to the enhanced version with all the same props
  return <EnhancedMemoPreviewModal {...props} />;
};