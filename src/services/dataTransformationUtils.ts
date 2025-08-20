import { EnhancedWizardData } from '@/types/enhanced-strategy';

/**
 * Utility functions for transforming data between UI and database formats
 */
export class DataTransformationUtils {
  
  /**
   * Transform wizard data to database format
   */
  static transformWizardToDatabase(wizardData: EnhancedWizardData): any {
    return {
      // Basic strategy fields
      strategy_notes: wizardData.strategyDescription || '',
      investment_philosophy: wizardData.strategyDescription || '', // Use strategy description as philosophy for now
      
      // Investment parameters - Use correct field names from interface
      min_investment_amount: wizardData.checkSizeMin || null,
      max_investment_amount: wizardData.checkSizeMax || null,
      
      // Geography and industry mappings - Use correct field names
      geography: wizardData.geographies || [],
      industries: wizardData.sectors || [],
      
      // For now, use empty objects for new enhanced fields since they're not in the wizard data yet
      philosophy_config: {},
      research_approach: {},
      deal_sourcing_strategy: {},
      decision_making_process: {},
      
      investment_stages: wizardData.stages || [],
      specialized_sectors: wizardData.sectors || [], // Use sectors as specialized sectors for now
      
      // Key signals - not in wizard interface yet, use empty array
      key_signals: [],
      exciting_threshold: wizardData.dealThresholds?.exciting || 85,
      promising_threshold: wizardData.dealThresholds?.promising || 70,
      needs_development_threshold: wizardData.dealThresholds?.needs_development || 50,
      
      // Enhanced criteria structure - from the wizard's category configurations
      enhanced_criteria: {
        teamLeadership: wizardData.teamLeadershipConfig || {},
        marketOpportunity: wizardData.marketOpportunityConfig || {},
        productTechnology: wizardData.productTechnologyConfig || {},
        businessTraction: wizardData.businessTractionConfig || {},
        financialHealth: wizardData.financialHealthConfig || {},
        strategicFit: wizardData.strategicFitConfig || {}
      }
    };
  }

  /**
   * Transform UI field updates to database format with enhanced error handling
   */
  static transformUIToDatabase(updates: any): any {
    console.log('🔄 === DATA TRANSFORMATION (ENHANCED) ===');
    console.log('Input updates:', JSON.stringify(updates, null, 2));
    
    const transformed = { ...updates };
    
    // Handle field name mappings for direct UI updates
    if (updates.checkSizeRange) {
      transformed.min_investment_amount = updates.checkSizeRange.min;
      transformed.max_investment_amount = updates.checkSizeRange.max;
      delete transformed.checkSizeRange;
    }
    
    if (updates.geographies) {
      transformed.geography = updates.geographies;
      delete transformed.geographies;
    }
    
    if (updates.sectors) {
      transformed.industries = updates.sectors;
      delete transformed.sectors;
    }

    // Handle specialized sectors
    if (updates.specializedSectors) {
      transformed.specialized_sectors = updates.specializedSectors;
      delete transformed.specializedSectors;
    }

    // Handle stages
    if (updates.stages) {
      transformed.investment_stages = updates.stages;
      delete transformed.stages;
    }

    // Handle nested configuration objects
    if (updates.philosophyConfig) {
      transformed.philosophy_config = updates.philosophyConfig;
      delete transformed.philosophyConfig;
    }

    if (updates.researchApproach) {
      transformed.research_approach = updates.researchApproach;
      delete transformed.researchApproach;
    }

    if (updates.dealSourcingStrategy) {
      transformed.deal_sourcing_strategy = updates.dealSourcingStrategy;
      delete transformed.dealSourcingStrategy;
    }

    if (updates.decisionMakingProcess) {
      transformed.decision_making_process = updates.decisionMakingProcess;
      delete transformed.decisionMakingProcess;
    }

    // Phase 2: Enhanced ID handling - preserve fund_id but remove id
    if (updates.fund_id) {
      transformed.fund_id = updates.fund_id;
    }
    
    // Always remove id to avoid conflicts (strategy ID should be handled by the service layer)
    delete transformed.id;
    
    console.log('🎯 Transformed output:', JSON.stringify(transformed, null, 2));
    return transformed;
  }

  /**
   * Transform database data to UI format for editing
   */
  static transformDatabaseToUI(strategy: any): any {
    return {
      ...strategy,
      // Map database fields back to UI field names
      checkSizeMin: strategy.min_investment_amount || 0,
      checkSizeMax: strategy.max_investment_amount || 0,
      checkSizeRange: {
        min: strategy.min_investment_amount,
        max: strategy.max_investment_amount
      },
      geographies: strategy.geography || [],
      sectors: strategy.industries || [],
      stages: strategy.investment_stages || [],
      specializedSectors: strategy.specialized_sectors || [],
      
      // Extract from JSON fields into nested structure matching wizard
      philosophyConfig: {
        investmentDrivers: strategy.philosophy_config?.investmentDrivers || [],
        riskTolerance: strategy.philosophy_config?.riskTolerance || '',
        investmentHorizon: strategy.philosophy_config?.investmentHorizon || '',
        valueCreationApproach: strategy.philosophy_config?.valueCreationApproach || [],
        diversityPreference: strategy.philosophy_config?.diversityPreference || []
      },
      
      researchApproach: {
        dueDiligenceDepth: strategy.research_approach?.dueDiligenceDepth || 'standard',
        researchPriorities: strategy.research_approach?.researchPriorities || [],
        informationSources: strategy.research_approach?.informationSources || [],
        competitiveAnalysisFocus: strategy.research_approach?.competitiveAnalysisFocus || []
      },
      
      dealSourcingStrategy: {
        sourcingChannels: strategy.deal_sourcing_strategy?.sourcingChannels || [],
        networkLeveraging: strategy.deal_sourcing_strategy?.networkLeveraging || '',
        targetCompanyProfiles: strategy.deal_sourcing_strategy?.targetCompanyProfiles || [],
        outreachStrategy: strategy.deal_sourcing_strategy?.outreachStrategy || ''
      },
      
      decisionMakingProcess: {
        timelinePreferences: strategy.decision_making_process?.timelinePreferences || '',
        stakeholderInvolvement: strategy.decision_making_process?.stakeholderInvolvement || '',
        riskTolerance: strategy.decision_making_process?.riskTolerance || ''
      },
      
      dealThresholds: {
        exciting: strategy.exciting_threshold,
        promising: strategy.promising_threshold,
        needs_development: strategy.needs_development_threshold
      },
      
      keySignals: strategy.key_signals || [],
      
      // Include base wizard fields
      fundName: strategy.fund_name || '',
      strategyDescription: strategy.strategy_notes || '',
      fundType: strategy.fund_type || 'vc',
      
      // Map enhanced criteria back to individual category configs
      teamLeadershipConfig: strategy.enhanced_criteria?.teamLeadership || {},
      marketOpportunityConfig: strategy.enhanced_criteria?.marketOpportunity || {},
      productTechnologyConfig: strategy.enhanced_criteria?.productTechnology || {},
      businessTractionConfig: strategy.enhanced_criteria?.businessTraction || {},
      financialHealthConfig: strategy.enhanced_criteria?.financialHealth || {},
      strategicFitConfig: strategy.enhanced_criteria?.strategicFit || {}
    };
  }

  /**
   * Validate strategy data before save
   */
  static validateStrategyData(data: any, isPartialUpdate: boolean = false): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check required fields (skip for partial updates like RAG thresholds)
    if (!isPartialUpdate) {
      if (!data.fund_id) {
        errors.push('Fund ID is required');
      }

      if (!data.fund_type) {
        errors.push('Fund type is required');
      }
    }

    // Validate arrays
    if (data.industries && !Array.isArray(data.industries)) {
      errors.push('Industries must be an array');
    }

    if (data.geography && !Array.isArray(data.geography)) {
      errors.push('Geography must be an array');
    }

    if (data.key_signals && !Array.isArray(data.key_signals)) {
      errors.push('Key signals must be an array');
    }

    // Validate thresholds
    if (data.exciting_threshold && (data.exciting_threshold < 0 || data.exciting_threshold > 100)) {
      errors.push('Exciting threshold must be between 0 and 100');
    }

    if (data.promising_threshold && (data.promising_threshold < 0 || data.promising_threshold > 100)) {
      errors.push('Promising threshold must be between 0 and 100');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}