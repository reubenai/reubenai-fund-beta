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

   const saveStrategy = async (fundType: 'vc' | 'pe', wizardData: EnhancedWizardData) => {
    if (!fundId) return null;
    
    console.log('💾 === DETAILED SAVE STRATEGY DEBUG ===');
    console.log('Fund ID:', fundId);
    console.log('Fund Type:', fundType);
    console.log('Wizard Data Keys:', Object.keys(wizardData));
    console.log('Enhanced Criteria in wizardData:', wizardData.enhancedCriteria);
    
    setLoading(true);
    setError(null);
    
    try {
      // Validate wizard data
      console.log('🔍 Validating wizard data...');
      const validation = unifiedStrategyService.validateStrategy(wizardData);
      console.log('Validation result:', validation);
      
      if (!validation.isValid) {
        console.error('❌ Validation failed:', validation.errors);
        setError(validation.errors.join(', '));
        toast({
          title: 'Validation Error',
          description: validation.errors.join(', '),
          variant: 'destructive'
        });
        return null;
      }

      console.log('✅ Validation passed, building updates...');

      // Convert wizard data to update format
      const updates = {
        fund_type: fundType,
        industries: wizardData.sectors,
        geography: wizardData.geographies,
        min_investment_amount: wizardData.checkSizeRange?.min,
        max_investment_amount: wizardData.checkSizeRange?.max,
        key_signals: wizardData.keySignals,
        exciting_threshold: wizardData.dealThresholds?.exciting,
        promising_threshold: wizardData.dealThresholds?.promising,
        needs_development_threshold: wizardData.dealThresholds?.needs_development,
        strategy_notes: wizardData.strategyDescription,
        enhanced_criteria: wizardData.enhancedCriteria
      };

      console.log('📝 Updates to send:', JSON.stringify(updates, null, 2));
      console.log('🚀 Calling saveStrategy service...');

      const savedStrategy = await unifiedStrategyService.saveStrategy(fundId, updates);
      
      console.log('📊 Save result:', savedStrategy);
      
      if (savedStrategy) {
        console.log('✅ Strategy saved successfully');
        setStrategy(savedStrategy);
        toast({
          title: 'Success',
          description: 'Investment strategy saved successfully'
        });
        return savedStrategy;
      } else {
        console.error('❌ Save returned null/undefined');
        const errorMessage = 'Save operation returned no data';
        setError(errorMessage);
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive'
        });
        return null;
      }
    } catch (err) {
      console.error('💥 Strategy save error:', err);
      console.error('Error type:', typeof err);
      console.error('Error message:', err instanceof Error ? err.message : String(err));
      console.error('Error stack:', err instanceof Error ? err.stack : 'No stack trace');
      
      const errorMessage = err instanceof Error ? err.message : 'Failed to save strategy';
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