import { useState, useEffect, useCallback } from 'react';
import { unifiedStrategyService, EnhancedStrategy, EnhancedWizardData } from '@/services/unifiedStrategyService';
import { useToast } from '@/hooks/use-toast';
import { useSecureDbOperation } from '@/hooks/useSecureDbOperation';

export function useUnifiedStrategy(fundId?: string) {
  const [strategy, setStrategy] = useState<EnhancedStrategy | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { executeSecureOperation } = useSecureDbOperation();

  // Load strategy when fundId changes
  useEffect(() => {
    if (fundId) {
      loadStrategy();
    }
  }, [fundId]);

  const loadStrategy = async () => {
    if (!fundId) {
      console.log('⚠️ No fund ID provided to loadStrategy');
      return;
    }
    
    console.log('🔄 Loading strategy for fund:', fundId);
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await unifiedStrategyService.getFundStrategy(fundId);
      console.log('✅ Strategy loaded in hook:', data);
      setStrategy(data);
      
      if (data) {
        console.log('🎯 Investment thesis should now be visible!');
      } else {
        console.log('ℹ️ No strategy found - user needs to configure it');
      }
    } catch (err) {
      console.error('❌ Strategy loading error in hook:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load strategy';
      setError(errorMessage);
      
      // Show user-friendly toast
      toast({
        title: 'Error Loading Strategy',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const saveStrategy = useCallback(async (
    fundType: 'vc' | 'pe',
    wizardData: EnhancedWizardData
  ): Promise<EnhancedStrategy | null> => {
    console.log('💾 [Hook] ENHANCED Save strategy with data validation');
    console.log('Fund Type:', fundType);
    console.log('Wizard Data Keys:', Object.keys(wizardData));

    if (!fundId) {
      const error = new Error('Fund ID is required for saving strategy');
      console.error('❌ [Hook]', error.message);
      setError(error.message);
      return null;
    }

    let attempt = 0;
    const maxAttempts = 3;

    while (attempt < maxAttempts) {
      try {
        attempt++;
        setLoading(true);
        setError(null);

        console.log(`🔄 [Hook] Save attempt ${attempt}/${maxAttempts}`);

        // Pre-flight data integrity validation
        console.log('🔍 [Hook] Phase 1: Data integrity validation...');
        if (!wizardData.fundName?.trim()) {
          wizardData.fundName = `Fund ${fundId}`; // Provide default
        }
        if (!wizardData.fundType) {
          wizardData.fundType = fundType;
        }
        if (!wizardData.sectors?.length) {
          console.warn('⚠️ [Hook] No sectors provided, using defaults');
          wizardData.sectors = fundType === 'vc' ? ['Technology'] : ['Manufacturing'];
        }
        if (!wizardData.stages?.length) {
          console.warn('⚠️ [Hook] No stages provided, using defaults');
          wizardData.stages = fundType === 'vc' ? ['Series A'] : ['Growth Equity'];
        }
        if (!wizardData.geographies?.length) {
          console.warn('⚠️ [Hook] No geographies provided, using defaults');
          wizardData.geographies = ['North America'];
        }

        console.log('✅ [Hook] Phase 1: Data validation completed');

        const savedStrategy = await executeSecureOperation(
          async () => {
            console.log('🔒 [Hook] Phase 2: Executing secure save operation...');
            return unifiedStrategyService.saveStrategy(fundId, wizardData);
          },
          {
            operation: 'Save Investment Strategy',
            requireAuth: true,
            maxRetries: 1 // We handle retries ourselves
          }
        );

        console.log('✅ [Hook] Strategy saved successfully:', savedStrategy?.id);

        if (savedStrategy) {
          setStrategy(savedStrategy);
          return savedStrategy;
        } else {
          throw new Error('No strategy data returned from save operation');
        }
      } catch (error: any) {
        const errorMessage = error?.message || 'Failed to save strategy';
        console.error(`❌ [Hook] Save attempt ${attempt} failed:`, errorMessage);
        
        // Check for retryable errors
        const isRetryable = (
          errorMessage.includes('Failed to fetch') ||
          errorMessage.includes('NetworkError') ||
          errorMessage.includes('timeout') ||
          errorMessage.includes('Database connectivity issue') ||
          error?.status === 0 ||
          error?.status >= 500
        );

        if (attempt < maxAttempts && isRetryable) {
          const delay = 1000 * attempt; // Increasing delay
          console.log(`🔄 [Hook] Retryable error, waiting ${delay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }

        // Final error handling
        setError(errorMessage);
        return null;
      } finally {
        setLoading(false);
      }
    }

    return null;
  }, [fundId, executeSecureOperation]);

  const updateStrategy = async (strategyIdOrUpdates: string | Partial<EnhancedStrategy>, updatesArg?: Partial<EnhancedStrategy>) => {
    console.log('🔧 === UPDATE STRATEGY WITH ENHANCED ERROR HANDLING ===');
    console.log('Arguments received:', { strategyIdOrUpdates, updatesArg });
    
    // Handle flexible call signatures for backward compatibility
    let strategyId: string | undefined;
    let updates: Partial<EnhancedStrategy>;
    
    if (typeof strategyIdOrUpdates === 'string' && updatesArg) {
      // New signature: updateStrategy(strategyId, updates)
      strategyId = strategyIdOrUpdates;
      updates = updatesArg;
      console.log('📝 New signature detected - Strategy ID:', strategyId, 'Updates:', updates);
    } else if (typeof strategyIdOrUpdates === 'object') {
      // Old signature: updateStrategy(updates)
      updates = strategyIdOrUpdates;
      strategyId = updates.id || strategy?.id;
      console.log('📝 Legacy signature detected - Updates:', updates, 'Strategy ID from state:', strategyId);
    } else {
      throw new Error('Invalid arguments provided to updateStrategy');
    }
    
    console.log('Fund ID:', fundId);
    console.log('Final strategy ID:', strategyId);
    console.log('Final updates:', updates);
    
    if (!fundId) {
      console.error('❌ No fund ID provided to updateStrategy');
      toast({
        title: 'Error',
        description: 'Fund ID is required for strategy updates. Please refresh the page.',
        variant: 'destructive'
      });
      throw new Error('Fund ID is required for strategy updates');
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Define the actual update operation with enhanced error handling
      const performUpdate = async () => {
        let finalStrategyId = strategyId;
        
        // If we don't have a strategy ID, fetch it from the database
        if (!finalStrategyId) {
          console.log('⚠️ No strategy ID found, fetching from database...');
          const existingStrategy = await unifiedStrategyService.getFundStrategy(fundId);
          finalStrategyId = existingStrategy?.id;
          console.log('💾 Fetched strategy ID from database:', finalStrategyId);
        }
        
        console.log('🎯 Final strategy ID for update:', finalStrategyId);
        
        if (!finalStrategyId) {
          console.error('❌ No strategy found for fund. Creating new strategy...');
          // Try to create a new strategy if none exists
          const newStrategy = await unifiedStrategyService.saveStrategy(fundId, {
            fund_type: updates.fund_type || 'vc',
            industries: updates.industries || [],
            geography: updates.geography || [],
            ...updates
          });
          
          if (newStrategy) {
            setStrategy(newStrategy);
            toast({
              title: 'Success',
              description: 'New investment strategy created and saved successfully.',
            });
            return newStrategy;
          } else {
            throw new Error('Failed to create new strategy for fund. Please contact support.');
          }
        }

        // Always use UPDATE path since all funds should have strategies
        console.log('✅ Updating existing strategy with ID:', finalStrategyId);
        
        const updatePayload = {
          ...updates,
          fund_id: fundId, // Always include fund_id
          fund_type: updates.fund_type || strategy?.fund_type || 'vc'
        };
        
        console.log('📝 Update payload:', updatePayload);
        const updatedStrategy = await unifiedStrategyService.updateFundStrategy(finalStrategyId, updatePayload);
        console.log('✅ Update successful:', updatedStrategy);
        
        if (updatedStrategy) {
          console.log('🔄 Setting new strategy state:', updatedStrategy);
          setStrategy(updatedStrategy);
          return updatedStrategy;
        } else {
          console.error('❌ No strategy returned from service');
          throw new Error('Update operation failed - no data returned');
        }
      };

      // Execute with enhanced retry logic for conflict prevention
      let lastError: Error | null = null;
      const maxRetries = 5; // Increased retries
      const baseDelay = 1000; // Base delay
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(`Strategy save attempt ${attempt}/${maxRetries}`);
          
          // Add a small delay for first retry to avoid immediate conflicts
          if (attempt > 1) {
            const delay = baseDelay * Math.pow(2, attempt - 1); // Exponential backoff
            console.log(`Waiting ${delay}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
          
          const result = await performUpdate();
          
          if (attempt > 1) {
            toast({
              title: 'Save Successful',
              description: `Strategy saved successfully after ${attempt} attempts.`,
            });
          } else {
            toast({
              title: 'Success',
              description: 'Investment strategy saved successfully.',
            });
          }
          
          return result;
        } catch (error) {
          lastError = error as Error;
          console.error(`Attempt ${attempt} failed:`, error);
          
          // Check for specific conflict errors
          const isConflictError = error instanceof Error && (
            error.message.includes('conflict') ||
            error.message.includes('concurrent') ||
            error.message.includes('blocked') ||
            error.message.includes('invalidate_deal_analyses_on_strategy_change') ||
            error.message.includes('duplicate key') ||
            error.message.includes('violates foreign key')
          );
          
          const isTemporaryError = error instanceof Error && (
            error.message.includes('network') ||
            error.message.includes('timeout') ||
            error.message.includes('connection')
          );
          
          if ((isConflictError || isTemporaryError) && attempt < maxRetries) {
            const delay = baseDelay * Math.pow(2, attempt); // Exponential backoff
            console.log(`Retrying in ${delay}ms due to ${isConflictError ? 'conflict' : 'temporary error'}...`);
            
            toast({
              title: isConflictError ? 'Conflict Detected' : 'Temporary Error',
              description: `${isConflictError ? 'Analysis is running.' : 'Network issue detected.'} Retrying save in ${delay/1000}s... (${attempt}/${maxRetries})`,
              duration: 2000,
            });
            
            continue;
          }
          
          // If it's not a retryable error or we've exhausted retries, throw
          if (attempt === maxRetries) {
            throw lastError;
          }
        }
      }
      
      throw lastError || new Error('Unknown error during retry operation');
    } catch (err) {
      console.error('❌ Update strategy error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      let fullMessage = `Failed to update strategy: ${errorMessage}`;
      
      // Provide specific guidance for common scenarios
      if (errorMessage.includes('conflict') || errorMessage.includes('concurrent')) {
        fullMessage = `Strategy update conflict: Deal analysis is currently running. Please wait a moment and try again.`;
      } else if (errorMessage.includes('not found')) {
        fullMessage = `Strategy not found. Please refresh the page and try again.`;
      } else if (errorMessage.includes('permission')) {
        fullMessage = `Permission denied. Please check your access rights.`;
      }
      
      setError(fullMessage);
      toast({
        title: 'Save Failed',
        description: fullMessage,
        variant: 'destructive'
      });
      throw new Error(fullMessage);
    } finally {
      setLoading(false);
    }
  };

  const getDefaultTemplate = (fundType: 'vc' | 'pe') => {
    return unifiedStrategyService.getDefaultTemplate(fundType);
  };

  const getSpecializedTemplate = (
    fundType: 'vc' | 'pe', 
    stage?: string, 
    industries?: string[], 
    geographies?: string[], 
    investmentSize?: number
  ) => {
    return unifiedStrategyService.getSpecializedTemplate(fundType, stage, industries, geographies, investmentSize);
  };

  const getSpecializationOptions = () => {
    return unifiedStrategyService.getSpecializationOptions();
  };

  const validateWizardData = (wizardData: EnhancedWizardData) => {
    return unifiedStrategyService.validateStrategy(wizardData);
  };

  const refreshStrategy = async () => {
    await loadStrategy();
  };

  return {
    strategy,
    loading,
    error,
    loadStrategy,
    refreshStrategy,
    saveStrategy,
    updateStrategy,
    getDefaultTemplate,
    getSpecializedTemplate,
    getSpecializationOptions,
    validateWizardData
  };
}