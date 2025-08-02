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
    if (!fundId) return;
    
    console.log('=== LOADING STRATEGY ===');
    console.log('Fund ID:', fundId);
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await unifiedStrategyService.getFundStrategy(fundId);
      console.log('Strategy data:', data);
      setStrategy(data);
    } catch (err) {
      console.error('Strategy loading error:', err);
      const errorMessage = 'Failed to load strategy';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const createStrategy = async (fundType: 'vc' | 'pe', wizardData: EnhancedWizardData) => {
    if (!fundId) return null;
    
    console.log('=== CREATING STRATEGY ===');
    console.log('Fund ID:', fundId);
    console.log('Fund Type:', fundType);
    console.log('Wizard Data:', wizardData);
    
    setLoading(true);
    setError(null);
    
    try {
      // Validate wizard data
      const validation = unifiedStrategyService.validateStrategy(wizardData);
      if (!validation.isValid) {
        console.log('Validation failed:', validation.errors);
        setError(validation.errors.join(', '));
        toast({
          title: 'Validation Error',
          description: validation.errors.join(', '),
          variant: 'destructive'
        });
        return null;
      }

      const newStrategy = await unifiedStrategyService.createFundStrategy(fundId, fundType, wizardData);
      console.log('Created strategy:', newStrategy);
      
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
    if (!strategy?.id) return null;
    
    setLoading(true);
    setError(null);
    
    try {
      const updatedStrategy = await unifiedStrategyService.updateFundStrategy(strategy.id, updates);
      if (updatedStrategy) {
        setStrategy(updatedStrategy);
        toast({
          title: 'Success',
          description: 'Strategy updated successfully'
        });
      }
      return updatedStrategy;
    } catch (err) {
      const errorMessage = 'Failed to update strategy';
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