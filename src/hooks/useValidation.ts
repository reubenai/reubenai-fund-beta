import { useState, useCallback } from 'react';
import { z } from 'zod';

interface ValidationError {
  field: string;
  message: string;
}

interface UseValidationOptions<T> {
  schema: z.ZodSchema<T>;
  onSubmit?: (data: T) => void | Promise<void>;
}

export function useValidation<T>({ schema, onSubmit }: UseValidationOptions<T>) {
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = useCallback((data: unknown): data is T => {
    try {
      schema.parse(data);
      setErrors([]);
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationErrors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }));
        setErrors(validationErrors);
      }
      return false;
    }
  }, [schema]);

  const handleSubmit = useCallback(async (data: unknown) => {
    if (!onSubmit) return;

    setIsSubmitting(true);
    try {
      if (validate(data)) {
        await onSubmit(data);
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [validate, onSubmit]);

  const getFieldError = useCallback((field: string) => {
    return errors.find(error => error.field === field)?.message;
  }, [errors]);

  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);

  return {
    errors,
    isSubmitting,
    validate,
    handleSubmit,
    getFieldError,
    clearErrors
  };
}

// Common validation schemas
export const commonSchemas = {
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  required: z.string().min(1, 'This field is required'),
  url: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  positiveNumber: z.number().positive('Must be a positive number'),
  dealSize: z.number().min(0, 'Deal size must be positive').optional(),
  companyName: z.string().min(1, 'Company name is required').max(100, 'Company name too long'),
  industry: z.string().min(1, 'Industry is required'),
  location: z.string().min(1, 'Location is required'),
  description: z.string().max(1000, 'Description too long').optional()
};

// Deal validation schema
export const dealSchema = z.object({
  company_name: commonSchemas.companyName,
  industry: commonSchemas.industry,
  location: commonSchemas.location,
  description: commonSchemas.description,
  website: commonSchemas.url,
  linkedin_url: commonSchemas.url,
  deal_size: commonSchemas.dealSize,
  valuation: commonSchemas.dealSize,
  founder: z.string().optional()
});

// User profile validation schema
export const profileSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: commonSchemas.email
});

// Input sanitization helpers
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove basic HTML tags
    .slice(0, 1000); // Limit length
}

export function sanitizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      let cleanUrl = parsed.toString();
      
      // Normalize LinkedIn company URLs
      if (parsed.hostname === 'www.linkedin.com' && parsed.pathname.startsWith('/company/')) {
        // Extract company identifier and normalize to base format
        const pathParts = parsed.pathname.split('/');
        if (pathParts.length >= 3 && pathParts[1] === 'company') {
          const companyId = pathParts[2];
          cleanUrl = `https://www.linkedin.com/company/${companyId}`;
        }
      }
      
      return cleanUrl;
    }
    return '';
  } catch {
    return '';
  }
}

export function validateAndSanitizeDeal(data: any) {
  const sanitized = {
    ...data,
    company_name: sanitizeInput(data.company_name || ''),
    industry: sanitizeInput(data.industry || ''),
    location: sanitizeInput(data.location || ''),
    description: sanitizeInput(data.description || ''),
    website: data.website ? sanitizeUrl(data.website) : '',
    linkedin_url: data.linkedin_url ? sanitizeUrl(data.linkedin_url) : '',
    founder: sanitizeInput(data.founder || '')
  };

  return dealSchema.safeParse(sanitized);
}