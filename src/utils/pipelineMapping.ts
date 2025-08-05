import { Database } from '@/integrations/supabase/types';

export type DealStatus = Database['public']['Enums']['deal_status'];

// Map pipeline stage names to database enum values - comprehensive mapping
const STAGE_NAME_TO_STATUS: Record<string, DealStatus> = {
  // Core statuses
  'sourced': 'sourced',
  'screening': 'screening',
  'due_diligence': 'due_diligence',
  'investment_committee': 'investment_committee',
  'approved': 'approved',
  'rejected': 'rejected',
  'invested': 'invested',
  
  // Alternative naming variations
  'initial_review': 'screening',
  'offer_negotiation': 'approved',
  'closed': 'invested',
  'passed': 'rejected',
  
  // Handle spaces and casing variations
  'initial review': 'screening',
  'due diligence': 'due_diligence',
  'investment committee': 'investment_committee',
  'offer negotiation': 'approved',
};

// Map database enum values back to display names
const STATUS_TO_DISPLAY_NAME: Record<DealStatus, string> = {
  'sourced': 'Sourced',
  'screening': 'Screening',
  'due_diligence': 'Due Diligence',
  'investment_committee': 'Investment Committee',
  'approved': 'Approved',
  'rejected': 'Rejected',
  'invested': 'Invested',
};

/**
 * Convert pipeline stage name to database enum value
 */
export function stageNameToStatus(stageName: string): DealStatus {
  console.log('=== STAGE MAPPING DEBUG ===');
  console.log('Input stage name:', `"${stageName}"`);
  console.log('Input length:', stageName.length);
  console.log('Input trimmed:', `"${stageName.trim()}"`);
  
  // Clean the input
  const cleanStage = stageName.trim();
  const lowerStage = cleanStage.toLowerCase();
  
  console.log('Available mappings:', Object.keys(STAGE_NAME_TO_STATUS));
  
  // Try exact match first (case insensitive)
  const exactMatch = STAGE_NAME_TO_STATUS[lowerStage];
  if (exactMatch) {
    console.log('✅ Exact match found:', lowerStage, '->', exactMatch);
    return exactMatch;
  }
  
  // Try normalized match (spaces to underscores)
  const normalizedName = lowerStage.replace(/\s+/g, '_');
  const normalizedMatch = STAGE_NAME_TO_STATUS[normalizedName];
  if (normalizedMatch) {
    console.log('✅ Normalized match found:', normalizedName, '->', normalizedMatch);
    return normalizedMatch;
  }
  
  // Log detailed failure information
  console.error('❌ No mapping found for stage:', `"${cleanStage}"`);
  console.error('Tried exact:', `"${lowerStage}"`);
  console.error('Tried normalized:', `"${normalizedName}"`);
  console.error('Available keys:', Object.keys(STAGE_NAME_TO_STATUS));
  
  // Don't use fallback - throw error instead
  throw new Error(`No valid mapping found for stage: "${cleanStage}"`);
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