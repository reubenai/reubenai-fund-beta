import { z } from 'zod';

// Shared validation schemas for all entities
export const BaseEntitySchema = z.object({
  id: z.string().uuid().optional(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
  organization_id: z.string().uuid()
});

// Deal Schema
export const DealSchema = BaseEntitySchema.extend({
  company_name: z.string().min(1, 'Company name is required'),
  industry: z.string().optional(),
  deal_size: z.number().positive().optional(),
  valuation: z.number().positive().optional(),
  founder: z.string().optional(),
  founder_email: z.string().email().optional(),
  linkedin_url: z.string().url().optional(),
  target_market: z.string().optional(),
  company_stage: z.string().optional(),
  revenue_model: z.string().optional(),
  key_customers: z.array(z.string()).optional(),
  competitors: z.array(z.string()).optional(),
  technology_stack: z.array(z.string()).optional(),
  employee_count: z.number().int().positive().optional(),
  crunchbase_url: z.string().url().optional(),
  priority: z.enum(['high', 'medium', 'low']).default('medium'),
  overall_score: z.number().min(0).max(100).optional(),
  rag_status: z.string().optional(),
  rag_confidence: z.number().min(0).max(100).optional(),
  analysis_queue_status: z.enum(['pending', 'queued', 'processing', 'completed', 'failed']).default('pending'),
  auto_analysis_enabled: z.boolean().default(false),
  fund_id: z.string().uuid(),
  created_by: z.string().uuid()
});

// Strategy Schema
export const InvestmentStrategySchema = BaseEntitySchema.extend({
  fund_type: z.enum(['vc', 'pe']),
  industries: z.array(z.string()).min(1, 'At least one industry required'),
  geography: z.array(z.string()).min(1, 'At least one geography required'),
  key_signals: z.array(z.string()).optional(),
  exciting_threshold: z.number().min(0).max(100).default(85),
  promising_threshold: z.number().min(0).max(100).default(70),
  needs_development_threshold: z.number().min(0).max(100).default(50),
  strategy_notes: z.string().optional(),
  enhanced_criteria: z.record(z.any()).optional(),
  recency_thresholds: z.record(z.any()).optional(),
  fund_id: z.string().uuid()
});

// Document Schema
export const DocumentSchema = BaseEntitySchema.extend({
  name: z.string().min(1, 'Document name is required'),
  file_path: z.string().min(1, 'File path is required'),
  content_type: z.string().optional(),
  file_size: z.number().positive().optional(),
  document_type: z.string().optional(),
  document_category: z.enum(['pitch_deck', 'financial_statements', 'legal_documents', 'due_diligence', 'other']).default('other'),
  tags: z.array(z.string()).default([]),
  parsing_status: z.enum(['pending', 'processing', 'completed', 'failed']).default('pending'),
  document_analysis_status: z.enum(['pending', 'processing', 'completed', 'failed']).default('pending'),
  extracted_text: z.string().optional(),
  parsed_data: z.record(z.any()).optional(),
  metadata: z.record(z.any()).optional(),
  is_public: z.boolean().default(false),
  triggers_reanalysis: z.boolean().default(true),
  deal_id: z.string().uuid(),
  fund_id: z.string().uuid().optional(),
  uploaded_by: z.string().uuid()
});

// Note Schema
export const NoteSchema = BaseEntitySchema.extend({
  content: z.string().min(1, 'Note content is required'),
  category: z.enum(['meeting', 'research', 'analysis', 'decision', 'other']).default('other'),
  sentiment: z.enum(['positive', 'neutral', 'negative']).default('neutral'),
  tags: z.array(z.string()).default([]),
  deal_id: z.string().uuid(),
  created_by: z.string().uuid()
});

// Job Queue Schema
export const JobQueueSchema = z.object({
  job_id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  engine: z.enum(['deal_analysis', 'strategy_change', 'document_analysis', 'note_analysis', 'fund_memory', 'ic_memo', 'edge_functions']),
  source: z.enum(['user', 'scheduler', 'event']),
  trigger_reason: z.string().min(1, 'Trigger reason is required'),
  related_ids: z.object({
    deal_id: z.string().uuid().optional(),
    strategy_id: z.string().uuid().optional(),
    document_id: z.string().uuid().optional(),
    note_id: z.string().uuid().optional()
  }),
  retry_count: z.number().int().min(0).default(0),
  idempotency_key: z.string().min(1, 'Idempotency key is required'),
  job_payload: z.record(z.any()),
  created_at: z.string().datetime()
});

// Form validation helpers
export const validateDeal = (data: unknown) => DealSchema.safeParse(data);
export const validateStrategy = (data: unknown) => InvestmentStrategySchema.safeParse(data);
export const validateDocument = (data: unknown) => DocumentSchema.safeParse(data);
export const validateNote = (data: unknown) => NoteSchema.safeParse(data);
export const validateJobQueue = (data: unknown) => JobQueueSchema.safeParse(data);

// Type exports
export type Deal = z.infer<typeof DealSchema>;
export type InvestmentStrategy = z.infer<typeof InvestmentStrategySchema>;
export type Document = z.infer<typeof DocumentSchema>;
export type Note = z.infer<typeof NoteSchema>;
export type JobQueue = z.infer<typeof JobQueueSchema>;

// Field validation for dynamic forms
export interface FieldDefinition {
  key: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'uuid' | 'date';
  required: boolean;
  nullable: boolean;
  defaultValue?: any;
  validationRules?: {
    min?: number;
    max?: number;
    pattern?: string;
    enum?: string[];
  };
}

// Entity field mappings
export const ENTITY_FIELDS: Record<string, FieldDefinition[]> = {
  deal: [
    { key: 'company_name', type: 'string', required: true, nullable: false },
    { key: 'industry', type: 'string', required: false, nullable: true },
    { key: 'deal_size', type: 'number', required: false, nullable: true, validationRules: { min: 0 } },
    { key: 'valuation', type: 'number', required: false, nullable: true, validationRules: { min: 0 } },
    { key: 'founder', type: 'string', required: false, nullable: true },
    { key: 'founder_email', type: 'string', required: false, nullable: true },
    { key: 'organization_id', type: 'uuid', required: true, nullable: false },
    { key: 'fund_id', type: 'uuid', required: true, nullable: false },
    { key: 'created_by', type: 'uuid', required: true, nullable: false }
  ],
  strategy: [
    { key: 'fund_type', type: 'string', required: true, nullable: false, validationRules: { enum: ['vc', 'pe'] } },
    { key: 'industries', type: 'array', required: true, nullable: false },
    { key: 'geography', type: 'array', required: true, nullable: false },
    { key: 'exciting_threshold', type: 'number', required: false, nullable: true, validationRules: { min: 0, max: 100 } },
    { key: 'organization_id', type: 'uuid', required: true, nullable: false },
    { key: 'fund_id', type: 'uuid', required: true, nullable: false }
  ],
  document: [
    { key: 'name', type: 'string', required: true, nullable: false },
    { key: 'file_path', type: 'string', required: true, nullable: false },
    { key: 'deal_id', type: 'uuid', required: true, nullable: false },
    { key: 'uploaded_by', type: 'uuid', required: true, nullable: false },
    { key: 'organization_id', type: 'uuid', required: true, nullable: false }
  ],
  note: [
    { key: 'content', type: 'string', required: true, nullable: false },
    { key: 'deal_id', type: 'uuid', required: true, nullable: false },
    { key: 'created_by', type: 'uuid', required: true, nullable: false },
    { key: 'organization_id', type: 'uuid', required: true, nullable: false }
  ]
};