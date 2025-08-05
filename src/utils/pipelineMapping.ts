import { Database } from '@/integrations/supabase/types';

export type DealStatus = Database['public']['Enums']['deal_status'];

// Map pipeline stage names to database enum values
const STAGE_NAME_TO_STATUS: Record<string, DealStatus> = {
  'sourced': 'sourced',
  'initial_review': 'screening',
  'screening': 'screening', 
  'due_diligence': 'due_diligence',
  'investment_committee': 'investment_committee',
  'offer_negotiation': 'approved',
  'approved': 'approved',
  'closed': 'invested',
  'invested': 'invested',
  'passed': 'rejected',
  'rejected': 'rejected',
};

// Map database enum values back to display names
const STATUS_TO_DISPLAY_NAME: Record<DealStatus, string> = {
  'sourced': 'Sourced',
  'screening': 'Initial Review',
  'due_diligence': 'Due Diligence',
  'investment_committee': 'Investment Committee',
  'approved': 'Offer Negotiation',
  'rejected': 'Passed',
  'invested': 'Closed',
};

/**
 * Convert pipeline stage name to database enum value
 */
export function stageNameToStatus(stageName: string): DealStatus {
  const normalizedName = stageName.toLowerCase().replace(/\s+/g, '_');
  return STAGE_NAME_TO_STATUS[normalizedName] || 'sourced';
}

/**
 * Convert database enum value to display stage name
 */
export function statusToDisplayName(status: DealStatus): string {
  return STATUS_TO_DISPLAY_NAME[status] || status;
}

/**
 * Create a stage key for grouping deals (normalized stage name)
 */
export function createStageKey(stageName: string): string {
  return stageName.toLowerCase().replace(/\s+/g, '_');
}

/**
 * Get the database status from a stage key
 */
export function stageKeyToStatus(stageKey: string): DealStatus {
  return STAGE_NAME_TO_STATUS[stageKey] || 'sourced';
}

/**
 * Check if a status value is valid
 */
export function isValidDealStatus(status: string): status is DealStatus {
  const validStatuses: DealStatus[] = [
    'sourced', 'screening', 'due_diligence', 
    'investment_committee', 'approved', 'rejected', 'invested'
  ];
  return validStatuses.includes(status as DealStatus);
}