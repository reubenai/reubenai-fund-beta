// Clean strategy service using V2 backend
import { supabase } from '@/integrations/supabase/client';
import { strategyServiceV2, StrategyV2 } from './strategyServiceV2';
import { EnhancedCriteriaTemplate, getTemplateByFundType, validateCriteriaWeights } from '@/types/vc-pe-criteria';

export interface CategoryCustomization {
  weight: number;
  subcategories: {
    [name: string]: {
      weight: number;
      enabled: boolean;
      requirements?: string;
      aiPrompt?: string;
    };
  };
  positiveSignals: string[];
  negativeSignals: string[];
}

export interface EnhancedWizardData {
  fundName: string;
  strategyDescription: string;
  fundType: 'vc' | 'pe';
  sectors: string[];
  stages: string[];
  geographies: string[];
  checkSizeRange: { min: number; max: number };
  keySignals: string[];
  investmentPhilosophy?: string;
  philosophyConfig?: any;
  researchApproach?: any;
  dealSourcingStrategy?: any;
  decisionMakingProcess?: any;
  teamLeadershipConfig: CategoryCustomization;
  marketOpportunityConfig: CategoryCustomization;
  productTechnologyConfig: CategoryCustomization;
  businessTractionConfig: CategoryCustomization;
  financialHealthConfig: CategoryCustomization;
  strategicFitConfig: CategoryCustomization;
  dealThresholds: {
    exciting: number;
    promising: number;
    needs_development: number;
  };
  enhancedCriteria?: any[];
}

export interface EnhancedStrategy {
  id?: string;
  fund_id: string;
  fund_type?: 'vc' | 'pe';
  industries?: string[];
  geography?: string[];
  min_investment_amount?: number;
  max_investment_amount?: number;
  key_signals?: string[];
  exciting_threshold?: number;
  promising_threshold?: number;
  needs_development_threshold?: number;
  strategy_notes?: string;
  enhanced_criteria?: any;
  created_at?: string;
  updated_at?: string;
}

export const DEFAULT_CATEGORIES: Record<string, CategoryCustomization> = {
  'Team & Leadership': { 
    weight: 20, 
    subcategories: {},
    positiveSignals: [],
    negativeSignals: []
  },
  'Market Opportunity': { 
    weight: 18, 
    subcategories: {},
    positiveSignals: [],
    negativeSignals: []
  },
  'Product & Technology': { 
    weight: 17, 
    subcategories: {},
    positiveSignals: [],
    negativeSignals: []
  },
  'Business Traction': { 
    weight: 16, 
    subcategories: {},
    positiveSignals: [],
    negativeSignals: []
  },
  'Financial Health': { 
    weight: 15, 
    subcategories: {},
    positiveSignals: [],
    negativeSignals: []
  },
  'Strategic Fit': { 
    weight: 14, 
    subcategories: {},
    positiveSignals: [],
    negativeSignals: []
  }
};

class UnifiedStrategyService {
  async getFundStrategy(fundId: string): Promise<EnhancedStrategy | null> {
    try {
      console.log('🎯 FETCHING STRATEGY FOR FUND (V2 Backend):', fundId);
      
      const strategyV2 = await strategyServiceV2.getFundStrategy(fundId);
      
      if (!strategyV2) {
        console.log('ℹ️ No strategy found for fund');
        return null;
      }

      const legacyStrategy = strategyServiceV2.convertToLegacyFormat(strategyV2);
      console.log('✅ Strategy converted to legacy format:', legacyStrategy.id);
      
      return legacyStrategy as EnhancedStrategy;
    } catch (error: any) {
      console.error('❌ Error fetching strategy:', error);
      throw error;
    }
  }

  async saveStrategy(fundId: string, updates: any): Promise<EnhancedStrategy | null> {
    console.log('💾 === SAVE STRATEGY SERVICE (V2 Backend) ===');
    
    try {
      const strategyV2 = await strategyServiceV2.saveStrategy(fundId, updates);
      const legacyStrategy = strategyServiceV2.convertToLegacyFormat(strategyV2);
      console.log('✅ Strategy saved via V2 service:', legacyStrategy.id);
      
      return legacyStrategy as EnhancedStrategy;
    } catch (error: any) {
      console.error('❌ Error saving strategy:', error);
      throw error;
    }
  }

  async updateFundStrategy(strategyId: string, updates: any): Promise<EnhancedStrategy | null> {
    try {
      // Convert legacy updates to V2 format
      const v2Updates = strategyServiceV2.convertLegacyUpdates(updates);
      const strategyV2 = await strategyServiceV2.updateStrategy(strategyId, v2Updates);
      const legacyStrategy = strategyServiceV2.convertToLegacyFormat(strategyV2);
      
      return legacyStrategy as EnhancedStrategy;
    } catch (error: any) {
      console.error('❌ Error updating strategy:', error);
      throw error;
    }
  }

  validateStrategy(wizardData: EnhancedWizardData | any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    console.log('🔍 VALIDATION DEBUG - Input data keys:', Object.keys(wizardData));
    console.log('🔍 VALIDATION DEBUG - Data type check:', {
      hasId: !!wizardData.id,
      isWizardFormat: !!wizardData.fundName,
      isLegacyFormat: !!wizardData.fund_id || !!wizardData.industries
    });

    // Handle both wizard format and Investment Strategy page format
    const fundName = wizardData.fundName || wizardData.fund_name;
    const fundType = wizardData.fundType || wizardData.fund_type;
    const sectors = wizardData.sectors || wizardData.industries;
    const geographies = wizardData.geographies || wizardData.geography;
    const stages = wizardData.stages;
    const enhancedCriteria = wizardData.enhancedCriteria || wizardData.enhanced_criteria?.categories || wizardData.enhanced_criteria;

    // Required fields (more lenient for Investment Strategy page updates with existing ID)
    const isUpdate = !!wizardData.id;

    if (!fundName?.trim() && !isUpdate) {
      errors.push('Fund name is required');
    }

    if (!fundType && !isUpdate) {
      errors.push('Fund type is required');
    }

    if (!sectors?.length && !isUpdate) {
      errors.push('At least one sector must be selected');
    }

    if (!geographies?.length && !isUpdate) {
      errors.push('At least one geography must be selected');
    }

    // For wizard format, stages are required
    if (!stages?.length && !isUpdate && wizardData.fundName) {
      errors.push('At least one stage must be selected');
    }

    // Validate enhanced criteria if present
    if (enhancedCriteria && Array.isArray(enhancedCriteria) && enhancedCriteria.length > 0) {
      console.log('🔍 VALIDATION DEBUG - Enhanced criteria structure:', enhancedCriteria.map(c => ({
        name: c.name, 
        enabled: c.enabled, 
        weight: c.weight
      })));

      const enabledCriteria = enhancedCriteria.filter(criteria => criteria.enabled !== false);
      const totalWeight = enabledCriteria.reduce((sum, criteria) => sum + (criteria.weight || 0), 0);
      
      console.log('🔍 VALIDATION DEBUG - Enhanced criteria total weight:', totalWeight);
      
      if (Math.abs(totalWeight - 100) > 1.0) {
        errors.push(`Category weights must sum to 100% (currently ${totalWeight.toFixed(1)}%)`);
      }

      // Validate subcategories
      enabledCriteria.forEach((category) => {
        if (category.subcategories) {
          let subcategoryWeights = 0;
          
          // Handle both object and array formats for subcategories
          if (Array.isArray(category.subcategories)) {
            subcategoryWeights = category.subcategories
              .filter((sub: any) => sub.enabled !== false)
              .reduce((sum, sub) => sum + (sub.weight || 0), 0);
          } else if (typeof category.subcategories === 'object' && category.subcategories !== null) {
            const subcategoryValues = Object.values(category.subcategories) as any[];
            subcategoryWeights = subcategoryValues
              .filter((sub: any) => sub.enabled !== false)
              .reduce((sum: number, sub: any) => {
                return sum + (sub.weight || 0);
              }, 0);
          }

          if (subcategoryWeights > 0 && Math.abs(subcategoryWeights - 100) > 1.0) {
            errors.push(`Subcategory weights in "${category.name}" must sum to 100% (currently ${subcategoryWeights.toFixed(1)}%)`);
          }
        }
      });
    } else if (!isUpdate) {
      // Fallback to old category structure for backward compatibility (wizard format only)
      console.log('🔍 VALIDATION DEBUG - Falling back to old category structure');
      const categories = [
        wizardData.teamLeadershipConfig,
        wizardData.marketOpportunityConfig,
        wizardData.productTechnologyConfig,
        wizardData.businessTractionConfig,
        wizardData.financialHealthConfig,
        wizardData.strategicFitConfig
      ].filter(Boolean); // Remove undefined categories

      if (categories.length > 0) {
        const totalWeight = categories.reduce((sum, cat) => sum + (cat?.weight || 0), 0);
        
        console.log('🔍 VALIDATION DEBUG - Legacy categories total weight:', totalWeight);
        
        if (Math.abs(totalWeight - 100) > 1.0) {
          errors.push(`Category weights must sum to 100% (currently ${totalWeight.toFixed(1)}%)`);
        }
      }
    }

    console.log('🔍 VALIDATION DEBUG - Final errors:', errors);
    return { isValid: errors.length === 0, errors };
  }

  getDefaultTemplate(fundType: 'vc' | 'pe'): Partial<EnhancedWizardData> {
    return {
      fundType,
      sectors: fundType === 'vc' ? ['SaaS/Software', 'Healthcare/Biotech'] : ['Manufacturing', 'Services'],
      stages: fundType === 'vc' ? ['Seed', 'Series A'] : ['Growth Equity', 'Buyout'],
      geographies: ['North America', 'Europe'],
      checkSizeRange: { 
        min: fundType === 'vc' ? 500000 : 5000000, 
        max: fundType === 'vc' ? 5000000 : 50000000 
      },
      dealThresholds: { exciting: 85, promising: 70, needs_development: 50 },
      teamLeadershipConfig: DEFAULT_CATEGORIES['Team & Leadership'],
      marketOpportunityConfig: DEFAULT_CATEGORIES['Market Opportunity'],
      productTechnologyConfig: DEFAULT_CATEGORIES['Product & Technology'],
      businessTractionConfig: DEFAULT_CATEGORIES['Business Traction'],
      financialHealthConfig: DEFAULT_CATEGORIES['Financial Health'],
      strategicFitConfig: DEFAULT_CATEGORIES['Strategic Fit']
    };
  }

  getSpecializedTemplate(fundType: 'vc' | 'pe', stage?: string, industries?: string[], geographies?: string[], investmentSize?: number): any {
    return this.getDefaultTemplate(fundType);
  }

  getSpecializationOptions() {
    return { industries: [], geographies: [], sizeRanges: [] };
  }
}

export const unifiedStrategyService = new UnifiedStrategyService();