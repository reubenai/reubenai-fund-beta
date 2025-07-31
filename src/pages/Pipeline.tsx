import React from 'react';
import { KanbanBoard } from '@/components/pipeline/KanbanBoard';

// Mock fund ID - in a real app, this would come from context or props
const MOCK_FUND_ID = '1fbf40e1-9307-4399-b3c5-8034d7cdbfde';

export default function Pipeline() {
  return <KanbanBoard fundId={MOCK_FUND_ID} />;
}