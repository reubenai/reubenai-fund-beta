import { useCallback, useState } from 'react';
import { SafeFormHandler } from '@/lib/validation/SafeFormHandler';
import { useToast } from '@/hooks/use-toast';

interface FormSubmissionOptions {
  entityType: string;
  orgId: string;
  userId?: string;
  onSuccess?: (data: any) => void;
  onError?: (errors: any) => void;
}

/**
 * Hook for safe form handling with validation and schema enforcement
 * Prevents bad data from reaching the database
 */
export function useSafeFormHandler() {
  const [isValidating, setIsValidating] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{
    general?: string[];
    fields?: Record<string, string[]>;
  }>({});
  const { toast } = useToast();

  /**
   * Validate form data without submission
   */
  const validateForm = useCallback(async (
    formData: any,
    entityType: string,
    orgId: string,
    options?: { allowPartial?: boolean }
  ) => {
    try {
      setIsValidating(true);
      setValidationErrors({});

      const result = await SafeFormHandler.validateFormData(formData, {
        entityType,
        requiredOrgId: orgId,
        allowPartial: options?.allowPartial || false
      });

      if (!result.success) {
        setValidationErrors({
          general: result.errors,
          fields: result.fieldErrors
        });
      }

      return result;
    } catch (error) {
      console.error('Form validation error:', error);
      setValidationErrors({
        general: ['Validation failed due to an internal error']
      });
      return { success: false, errors: ['Validation failed'] };
    } finally {
      setIsValidating(false);
    }
  }, []);

  /**
   * Submit form with validation
   */
  const submitForm = useCallback(async (
    formData: any,
    options: FormSubmissionOptions
  ) => {
    const { entityType, orgId, userId, onSuccess, onError } = options;

    try {
      setIsValidating(true);
      setValidationErrors({});

      // Validate the form
      const validation = await SafeFormHandler.processFormSubmission(
        entityType,
        formData,
        orgId,
        userId
      );

      if (!validation.success) {
        const errors = {
          general: validation.errors,
          fields: validation.fieldErrors
        };
        
        setValidationErrors(errors);
        
        // Show user-friendly error message
        toast({
          title: "Validation Error",
          description: validation.errors?.[0] || "Please check the form for errors",
          variant: "destructive"
        });

        onError?.(errors);
        return { success: false, errors };
      }

      // Form is valid - return validated data for submission
      onSuccess?.(validation.data);
      return { success: true, data: validation.data };

    } catch (error) {
      console.error('Form submission error:', error);
      
      const errorMessage = 'Form submission failed due to an internal error';
      setValidationErrors({
        general: [errorMessage]
      });
      
      toast({
        title: "Submission Error",
        description: errorMessage,
        variant: "destructive"
      });

      onError?.({ general: [errorMessage] });
      return { success: false, errors: { general: [errorMessage] } };
    } finally {
      setIsValidating(false);
    }
  }, [toast]);

  /**
   * Register a new field in the catalog
   */
  const registerField = useCallback(async (
    fieldKey: string,
    fieldType: string,
    entities: string[],
    options?: {
      required?: boolean;
      nullable?: boolean;
      defaultValue?: any;
      validationRules?: any;
    }
  ) => {
    try {
      const success = await SafeFormHandler.registerField(
        fieldKey,
        fieldType,
        entities,
        options
      );

      if (success) {
        toast({
          title: "Field Registered",
          description: `Field ${fieldKey} has been registered for ${entities.join(', ')}`,
          variant: "default"
        });
      } else {
        toast({
          title: "Registration Failed",
          description: `Failed to register field ${fieldKey}`,
          variant: "destructive"
        });
      }

      return success;
    } catch (error) {
      console.error('Field registration error:', error);
      toast({
        title: "Registration Error", 
        description: "Failed to register field due to an internal error",
        variant: "destructive"
      });
      return false;
    }
  }, [toast]);

  /**
   * Clear validation errors
   */
  const clearErrors = useCallback(() => {
    setValidationErrors({});
  }, []);

  /**
   * Get error message for a specific field
   */
  const getFieldError = useCallback((fieldName: string) => {
    return validationErrors.fields?.[fieldName]?.[0];
  }, [validationErrors]);

  /**
   * Check if a field has errors
   */
  const hasFieldError = useCallback((fieldName: string) => {
    return Boolean(validationErrors.fields?.[fieldName]?.length);
  }, [validationErrors]);

  /**
   * Check if form has any errors
   */
  const hasErrors = useCallback(() => {
    return Boolean(
      validationErrors.general?.length || 
      Object.keys(validationErrors.fields || {}).length
    );
  }, [validationErrors]);

  return {
    isValidating,
    validationErrors,
    validateForm,
    submitForm,
    registerField,
    clearErrors,
    getFieldError,
    hasFieldError,
    hasErrors
  };
}