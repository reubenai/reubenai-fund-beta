import { useState, useEffect } from 'react';
import { unifiedStrategyService, EnhancedStrategy, EnhancedWizardData } from '@/services/unifiedStrategyService';
import { useToast } from '@/hooks/use-toast';

export function useUnifiedStrategy(fundId?: string) {
  const [strategy, setStrategy] = useState<EnhancedStrategy | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

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

  const createStrategy = async (fundType: 'vc' | 'pe', wizardData: EnhancedWizardData) => {
    if (!fundId) return null;
    
    // Creating strategy
    
    setLoading(true);
    setError(null);
    
    try {
      // Validate wizard data
      const validation = unifiedStrategyService.validateStrategy(wizardData);
      if (!validation.isValid) {
        // Validation failed
        setError(validation.errors.join(', '));
        toast({
          title: 'Validation Error',
          description: validation.errors.join(', '),
          variant: 'destructive'
        });
        return null;
      }

      const newStrategy = await unifiedStrategyService.createFundStrategy(fundId, fundType, wizardData);
      // Strategy created successfully
      
      if (newStrategy) {
        setStrategy(newStrategy);
        toast({
          title: 'Success',
          description: 'Investment strategy created successfully'
        });
      }
      return newStrategy;
    } catch (err) {
      console.error('Strategy creation error:', err);
      const errorMessage = 'Failed to create strategy';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateStrategy = async (updates: Partial<EnhancedStrategy>) => {
    console.log('🔧 === UPDATE STRATEGY WITH CONFLICT PREVENTION ===');
    console.log('Fund ID:', fundId);
    console.log('Current strategy state:', strategy);
    console.log('Strategy ID from state:', strategy?.id);
    console.log('Updates received:', updates);
    
    if (!fundId) {
      console.error('❌ No fund ID provided to updateStrategy');
      throw new Error('Fund ID is required for strategy updates');
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Define the actual update operation
      const performUpdate = async () => {
        let strategyId = updates.id || strategy?.id;
        
        // If we don't have a strategy ID, fetch it from the database
        if (!strategyId) {
          console.log('⚠️ No strategy ID found, fetching from database...');
          const existingStrategy = await unifiedStrategyService.getFundStrategy(fundId);
          strategyId = existingStrategy?.id;
          console.log('💾 Fetched strategy ID from database:', strategyId);
        }
        
        console.log('🎯 Final strategy ID for update:', strategyId);
        
        if (!strategyId) {
          console.error('❌ No strategy found for fund. This should not happen as all funds have default strategies.');
          throw new Error('Strategy not found for fund. Please contact support.');
        }

        // Always use UPDATE path since all funds should have strategies
        console.log('✅ Updating existing strategy with ID:', strategyId);
        
        const updatePayload = {
          ...updates,
          fund_id: fundId, // Always include fund_id
          fund_type: updates.fund_type || strategy?.fund_type || 'vc'
        };
        
        console.log('📝 Update payload:', updatePayload);
        const updatedStrategy = await unifiedStrategyService.updateFundStrategy(strategyId, updatePayload);
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

      // Execute with retry logic for conflict prevention
      let lastError: Error | null = null;
      const maxRetries = 3;
      const retryDelay = 1500;
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(`Strategy save attempt ${attempt}/${maxRetries}`);
          const result = await performUpdate();
          
          if (attempt > 1) {
            toast({
              title: 'Save Successful',
              description: `Strategy saved after ${attempt} attempts.`,
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
            error.message.includes('invalidate_deal_analyses_on_strategy_change')
          );
          
          if (isConflictError && attempt < maxRetries) {
            const delay = retryDelay * attempt; // Exponential backoff
            console.log(`Retrying in ${delay}ms due to conflict...`);
            
            // Import toast dynamically
            const { toast } = await import('@/hooks/use-toast');
            toast({
              title: 'Conflict Detected',
              description: `Analysis is running. Retrying save in ${delay/1000}s... (${attempt}/${maxRetries})`,
              duration: 2000,
            });
            
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
          
          // If it's not a conflict error or we've exhausted retries, throw
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
      
      // Provide specific guidance for common conflict scenarios
      if (errorMessage.includes('conflict') || errorMessage.includes('concurrent')) {
        fullMessage = `Strategy update conflict detected. This happens when deal analysis is running. The system automatically retried but still failed. Please wait a moment and try again.`;
      }
      
      setError(fullMessage);
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
    createStrategy,
    updateStrategy,
    getDefaultTemplate,
    getSpecializedTemplate,
    getSpecializationOptions,
    validateWizardData
  };
}