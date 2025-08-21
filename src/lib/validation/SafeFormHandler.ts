import { supabase } from '@/integrations/supabase/client';
import { ENTITY_FIELDS, type FieldDefinition } from '@/lib/schemas';
import { z } from 'zod';

interface ValidationResult {
  success: boolean;
  data?: any;
  errors?: string[];
  fieldErrors?: Record<string, string[]>;
}

interface FormValidationOptions {
  entityType: string;
  requiredOrgId: string;
  userId?: string;
  allowPartial?: boolean;
  customFields?: FieldDefinition[];
}

/**
 * SafeFormHandler Middleware - Validates all form data before persistence
 * Enforces organization_id, validates field types, rejects unknown fields
 */
export class SafeFormHandler {
  private static fieldCatalog: Map<string, FieldDefinition[]> = new Map();
  private static catalogLoaded = false;

  /**
   * Load field catalog from database
   */
  private static async loadFieldCatalog(): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('field_catalog' as any)
        .select('*');

      if (error) {
        console.error('Failed to load field catalog:', error);
        // Fall back to static definitions
        this.loadStaticFieldDefinitions();
        return;
      }

      this.fieldCatalog.clear();

      // Group fields by entity
      data?.forEach((field: any) => {
        field.used_in_entities.forEach((entity: string) => {
          if (!this.fieldCatalog.has(entity)) {
            this.fieldCatalog.set(entity, []);
          }
          
          this.fieldCatalog.get(entity)!.push({
            key: field.field_key,
            type: field.field_type,
            required: field.is_required,
            nullable: field.is_nullable,
            defaultValue: field.default_value,
            validationRules: field.validation_rules || {}
          });
        });
      });

      this.catalogLoaded = true;
      console.log(`✅ Loaded field catalog for ${this.fieldCatalog.size} entities`);
    } catch (error) {
      console.error('Error loading field catalog:', error);
      this.loadStaticFieldDefinitions();
    }
  }

  /**
   * Load static field definitions as fallback
   */
  private static loadStaticFieldDefinitions(): void {
    Object.entries(ENTITY_FIELDS).forEach(([entity, fields]) => {
      this.fieldCatalog.set(entity, fields);
    });
    this.catalogLoaded = true;
  }

  /**
   * Get field definitions for entity type
   */
  private static async getEntityFields(entityType: string): Promise<FieldDefinition[]> {
    if (!this.catalogLoaded) {
      await this.loadFieldCatalog();
    }

    return this.fieldCatalog.get(entityType) || [];
  }

  /**
   * Validate form data against field catalog
   */
  static async validateFormData(
    formData: any,
    options: FormValidationOptions
  ): Promise<ValidationResult> {
    const { entityType, requiredOrgId, userId, allowPartial = false, customFields = [] } = options;

    try {
      // Get field definitions
      const catalogFields = await this.getEntityFields(entityType);
      const allFields = [...catalogFields, ...customFields];

      if (allFields.length === 0) {
        return {
          success: false,
          errors: [`No field definitions found for entity type: ${entityType}`]
        };
      }

      const errors: string[] = [];
      const fieldErrors: Record<string, string[]> = {};
      const validatedData: any = {};

      // Validate organization_id is present and matches
      if (!formData.organization_id) {
        errors.push('organization_id is required');
      } else if (formData.organization_id !== requiredOrgId) {
        errors.push('organization_id mismatch - access denied');
      } else {
        validatedData.organization_id = formData.organization_id;
      }

      // Validate each field
      for (const field of allFields) {
        const value = formData[field.key];
        const fieldValidation = this.validateField(field, value, allowPartial);

        if (fieldValidation.success) {
          if (fieldValidation.hasValue) {
            validatedData[field.key] = fieldValidation.value;
          }
        } else {
          fieldErrors[field.key] = fieldValidation.errors || [];
        }
      }

      // Check for unknown fields
      const allowedFields = new Set(allFields.map(f => f.key));
      allowedFields.add('organization_id');
      allowedFields.add('id'); // Allow ID for updates
      allowedFields.add('created_at');
      allowedFields.add('updated_at');

      Object.keys(formData).forEach(key => {
        if (!allowedFields.has(key)) {
          errors.push(`Unknown field: ${key}`);
        }
      });

      // Add user context if provided
      if (userId) {
        if (entityType === 'deal' || entityType === 'document' || entityType === 'note') {
          const createdByField = entityType === 'deal' ? 'created_by' : 
                                entityType === 'document' ? 'uploaded_by' : 'created_by';
          validatedData[createdByField] = userId;
        }
      }

      const hasErrors = errors.length > 0 || Object.keys(fieldErrors).length > 0;

      return {
        success: !hasErrors,
        data: hasErrors ? undefined : validatedData,
        errors: errors.length > 0 ? errors : undefined,
        fieldErrors: Object.keys(fieldErrors).length > 0 ? fieldErrors : undefined
      };

    } catch (error) {
      console.error('Form validation error:', error);
      return {
        success: false,
        errors: ['Internal validation error']
      };
    }
  }

  /**
   * Validate individual field
   */
  private static validateField(
    field: FieldDefinition,
    value: any,
    allowPartial: boolean
  ): { success: boolean; value?: any; hasValue: boolean; errors?: string[] } {
    const errors: string[] = [];

    // Handle undefined/null values
    if (value === undefined || value === null) {
      if (field.required && !allowPartial) {
        errors.push(`${field.key} is required`);
        return { success: false, hasValue: false, errors };
      }
      
      if (!field.nullable && value === null) {
        errors.push(`${field.key} cannot be null`);
        return { success: false, hasValue: false, errors };
      }

      // Use default value if available
      if (field.defaultValue !== undefined) {
        return { success: true, value: field.defaultValue, hasValue: true };
      }

      return { success: true, hasValue: false };
    }

    // Type validation
    const typeValidation = this.validateFieldType(field.type, value);
    if (!typeValidation.success) {
      errors.push(`${field.key}: ${typeValidation.error}`);
      return { success: false, hasValue: true, errors };
    }

    // Rule validation
    const ruleValidation = this.validateFieldRules(field, typeValidation.value);
    if (!ruleValidation.success) {
      errors.push(`${field.key}: ${ruleValidation.error}`);
      return { success: false, hasValue: true, errors };
    }

    return { success: true, value: ruleValidation.value, hasValue: true };
  }

  /**
   * Validate field type
   */
  private static validateFieldType(
    type: string,
    value: any
  ): { success: boolean; value?: any; error?: string } {
    try {
      switch (type) {
        case 'string':
          if (typeof value !== 'string') {
            return { success: false, error: 'must be a string' };
          }
          return { success: true, value };

        case 'number':
          const num = Number(value);
          if (isNaN(num)) {
            return { success: false, error: 'must be a number' };
          }
          return { success: true, value: num };

        case 'boolean':
          if (typeof value !== 'boolean') {
            return { success: false, error: 'must be a boolean' };
          }
          return { success: true, value };

        case 'array':
          if (!Array.isArray(value)) {
            return { success: false, error: 'must be an array' };
          }
          return { success: true, value };

        case 'object':
          if (typeof value !== 'object' || Array.isArray(value)) {
            return { success: false, error: 'must be an object' };
          }
          return { success: true, value };

        case 'uuid':
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
          if (typeof value !== 'string' || !uuidRegex.test(value)) {
            return { success: false, error: 'must be a valid UUID' };
          }
          return { success: true, value };

        case 'date':
          const date = new Date(value);
          if (isNaN(date.getTime())) {
            return { success: false, error: 'must be a valid date' };
          }
          return { success: true, value: date.toISOString() };

        default:
          return { success: false, error: `unknown field type: ${type}` };
      }
    } catch (error) {
      return { success: false, error: 'type validation failed' };
    }
  }

  /**
   * Validate field rules
   */
  private static validateFieldRules(
    field: FieldDefinition,
    value: any
  ): { success: boolean; value?: any; error?: string } {
    const rules = field.validationRules || {};

    try {
      // Min/max validation
      if (rules.min !== undefined) {
        if (field.type === 'string' || field.type === 'array') {
          if (value.length < rules.min) {
            return { success: false, error: `minimum length is ${rules.min}` };
          }
        } else if (field.type === 'number') {
          if (value < rules.min) {
            return { success: false, error: `minimum value is ${rules.min}` };
          }
        }
      }

      if (rules.max !== undefined) {
        if (field.type === 'string' || field.type === 'array') {
          if (value.length > rules.max) {
            return { success: false, error: `maximum length is ${rules.max}` };
          }
        } else if (field.type === 'number') {
          if (value > rules.max) {
            return { success: false, error: `maximum value is ${rules.max}` };
          }
        }
      }

      // Pattern validation
      if (rules.pattern && field.type === 'string') {
        const regex = new RegExp(rules.pattern);
        if (!regex.test(value)) {
          return { success: false, error: 'does not match required pattern' };
        }
      }

      // Enum validation
      if (rules.enum && Array.isArray(rules.enum)) {
        if (!rules.enum.includes(value)) {
          return { success: false, error: `must be one of: ${rules.enum.join(', ')}` };
        }
      }

      return { success: true, value };
    } catch (error) {
      return { success: false, error: 'rule validation failed' };
    }
  }

  /**
   * Register a new field in the catalog
   */
  static async registerField(
    fieldKey: string,
    fieldType: string,
    entities: string[],
    options: {
      required?: boolean;
      nullable?: boolean;
      defaultValue?: any;
      validationRules?: any;
    } = {}
  ): Promise<boolean> {
    const {
      required = false,
      nullable = true,
      defaultValue,
      validationRules = {}
    } = options;

    try {
      const { error } = await supabase
        .from('field_catalog' as any)
        .insert({
          field_key: fieldKey,
          field_type: fieldType,
          is_required: required,
          is_nullable: nullable,
          used_in_entities: entities,
          default_value: defaultValue,
          validation_rules: validationRules
        });

      if (error) {
        console.error('Failed to register field:', error);
        return false;
      }

      // Refresh catalog
      this.catalogLoaded = false;
      await this.loadFieldCatalog();

      console.log(`✅ Registered field: ${fieldKey} for entities: ${entities.join(', ')}`);
      return true;
    } catch (error) {
      console.error('Error registering field:', error);
      return false;
    }
  }

  /**
   * Bulk validate and process form submission
   */
  static async processFormSubmission(
    entityType: string,
    formData: any,
    orgId: string,
    userId?: string
  ): Promise<ValidationResult> {
    // Validate the form data
    const validation = await this.validateFormData(formData, {
      entityType,
      requiredOrgId: orgId,
      userId
    });

    if (!validation.success) {
      return validation;
    }

    // Additional business logic validation can go here
    // For now, just return the validated data
    return validation;
  }
}