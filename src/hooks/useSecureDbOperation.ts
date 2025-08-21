import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthValidation } from './useAuthValidation';

interface DbOperationOptions {
  operation: string;
  requireAuth?: boolean;
  maxRetries?: number;
  retryDelay?: number;
}

export function useSecureDbOperation() {
  const { ensureAuthContext } = useAuthValidation();

  const executeSecureOperation = useCallback(async <T>(
    operation: () => Promise<T>,
    options: DbOperationOptions
  ): Promise<T> => {
    const { operation: operationName, requireAuth = true, maxRetries = 2, retryDelay = 1000 } = options;
    
    console.log(`🔒 [SecureDb] Starting secure operation: ${operationName}`);
    
    if (requireAuth) {
      console.log('🔍 [SecureDb] Validating auth context...');
      const authValidation = await ensureAuthContext();
      
      if (!authValidation.isValid) {
        console.error('❌ [SecureDb] Auth validation failed:', authValidation.error);
        throw new Error(`Authentication required for ${operationName}: ${authValidation.error}`);
      }
      
      console.log('✅ [SecureDb] Auth context validated');
    }

    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🚀 [SecureDb] Attempt ${attempt + 1}/${maxRetries + 1} for ${operationName}`);
        
        const result = await operation();
        console.log(`✅ [SecureDb] Operation ${operationName} completed successfully`);
        return result;
        
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.error(`❌ [SecureDb] Attempt ${attempt + 1} failed for ${operationName}:`, lastError.message);
        
        // Check if this is an auth-related error
        const isAuthError = lastError.message.includes('JWT') || 
                           lastError.message.includes('permission') ||
                           lastError.message.includes('access denied') ||
                           lastError.message.includes('unauthorized');
        
        if (isAuthError && attempt < maxRetries) {
          console.log('🔄 [SecureDb] Auth error detected, refreshing session and retrying...');
          
          // Force refresh auth context
          await ensureAuthContext();
          
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          continue;
        }
        
        // For non-auth errors or final attempt, break
        if (attempt === maxRetries) {
          console.error(`💥 [SecureDb] All retry attempts failed for ${operationName}`);
          break;
        }
        
        // Wait before retry for other errors
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
    
    // If we get here, all attempts failed
    throw lastError || new Error(`Operation ${operationName} failed after ${maxRetries + 1} attempts`);
  }, [ensureAuthContext]);

  return {
    executeSecureOperation
  };
}