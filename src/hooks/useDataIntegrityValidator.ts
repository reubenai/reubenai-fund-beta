import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface DataValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  context?: any;
}

export function useDataIntegrityValidator() {
  const validateStrategyData = useCallback(async (
    fundId: string, 
    strategyData: any
  ): Promise<DataValidationResult> => {
    const errors: string[] = [];
    const warnings: string[] = [];
    let context: any = {};

    console.log('🔍 [DataIntegrity] Validating strategy data for fund:', fundId);

    try {
      // Validate fund exists and get required data
      const { data: fundData, error: fundError } = await supabase
        .from('funds')
        .select('id, name, organization_id, fund_type')
        .eq('id', fundId)
        .single();

      if (fundError || !fundData) {
        errors.push(`Fund ${fundId} not found or inaccessible`);
        return { isValid: false, errors, warnings };
      }

      context.fundData = fundData;
      console.log('✅ [DataIntegrity] Fund data retrieved:', fundData);

      // Validate required NOT NULL fields
      const requiredFields = [
        { field: 'fund_id', value: fundId, message: 'Fund ID is required' },
        { field: 'fund_name', value: strategyData.fundName || fundData.name, message: 'Fund name is required' },
        { field: 'fund_type', value: strategyData.fundType || fundData.fund_type, message: 'Fund type is required' },
        { field: 'organization_id', value: fundData.organization_id, message: 'Organization ID is required' }
      ];

      requiredFields.forEach(({ field, value, message }) => {
        if (!value || (typeof value === 'string' && !value.trim())) {
          errors.push(`${message} (${field})`);
        }
      });

      // Validate data types
      if (strategyData.checkSizeRange) {
        const { min, max } = strategyData.checkSizeRange;
        if (min && typeof min !== 'number') {
          warnings.push('Check size minimum should be a number');
        }
        if (max && typeof max !== 'number') {
          warnings.push('Check size maximum should be a number');
        }
        if (min && max && min >= max) {
          warnings.push('Minimum investment should be less than maximum');
        }
      }

      // Validate arrays
      const arrayFields = ['sectors', 'stages', 'geographies', 'keySignals'];
      arrayFields.forEach(field => {
        const value = strategyData[field];
        if (value && !Array.isArray(value)) {
          warnings.push(`${field} should be an array`);
        }
      });

      // Validate thresholds
      if (strategyData.dealThresholds) {
        const { exciting, promising, needs_development } = strategyData.dealThresholds;
        if (exciting <= promising) {
          warnings.push('Exciting threshold should be higher than promising threshold');
        }
        if (promising <= needs_development) {
          warnings.push('Promising threshold should be higher than needs development threshold');
        }
      }

      // Check for organizational access
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!profileError && profileData) {
        if (profileData.organization_id !== fundData.organization_id) {
          errors.push('Access denied: Fund belongs to different organization');
        }
      } else {
        warnings.push('Could not verify organizational access');
      }

      console.log('🔍 [DataIntegrity] Validation result:', {
        errors: errors.length,
        warnings: warnings.length,
        isValid: errors.length === 0
      });

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        context
      };

    } catch (error) {
      console.error('❌ [DataIntegrity] Validation error:', error);
      errors.push(`Validation failed: ${error}`);
      return { isValid: false, errors, warnings };
    }
  }, []);

  const ensureConnectivity = useCallback(async (): Promise<boolean> => {
    console.log('🧪 [DataIntegrity] Testing database connectivity...');
    
    let retries = 0;
    const maxRetries = 3;
    
    while (retries < maxRetries) {
      try {
        const { error } = await supabase
          .from('profiles')
          .select('user_id')
          .limit(1);
          
        if (!error || error.message.includes('Results contain 0 rows')) {
          console.log('✅ [DataIntegrity] Connectivity confirmed');
          return true;
        }
        
        console.warn(`⚠️ [DataIntegrity] Connectivity test failed (${retries + 1}/${maxRetries}):`, error);
        retries++;
        
        if (retries < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * retries));
        }
      } catch (networkError) {
        console.warn(`⚠️ [DataIntegrity] Network error (${retries + 1}/${maxRetries}):`, networkError);
        retries++;
        
        if (retries < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * retries));
        }
      }
    }
    
    console.error('❌ [DataIntegrity] Connectivity test failed after all retries');
    return false;
  }, []);

  return {
    validateStrategyData,
    ensureConnectivity
  };
}