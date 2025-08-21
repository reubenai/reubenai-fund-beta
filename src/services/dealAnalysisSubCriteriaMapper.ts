// Deal Analysis Sub-Criteria Mapper Service
// Maps VC/PE criteria templates to actual engine data and generates sub-criteria scores

import { getTemplateByFundType, EnhancedCriteriaTemplate } from '@/types/vc-pe-criteria';
import { RubricBreakdown, EnhancedDealAnalysis } from '@/types/enhanced-deal-analysis';

interface SubCriteriaItem {
  name: string;
  score: number;
  weight: number;
  confidence?: number;
  reasoning?: string;
  engine_source?: string;
  data_availability?: 'complete' | 'partial' | 'pending';
}

interface EngineDataSources {
  market_intelligence_engine?: any;
  team_research_engine?: any;
  financial_engine?: any;
  product_ip_engine?: any;
  thesis_alignment_engine?: any;
  competitive_intelligence?: any;
}

export class DealAnalysisSubCriteriaMapper {
  
  /**
   * Maps category scores to detailed sub-criteria breakdown using fund type criteria
   */
  static mapCategoryToSubCriteria(
    categoryName: string,
    fundType: 'vc' | 'pe',
    categoryScore: number,
    engineData?: EngineDataSources,
    analysisEngines?: Record<string, any>
  ): SubCriteriaItem[] {
    
    const template = getTemplateByFundType(fundType);
    const category = template.categories.find(c => 
      c.name.toLowerCase().replace(/\s+/g, '_').includes(categoryName.toLowerCase().replace(/\s+/g, '_').substring(0, 6))
    );
    
    if (!category) {
      console.warn(`No template found for category: ${categoryName}`);
      return [];
    }
    
    return category.subcategories
      .filter(sub => sub.enabled)
      .map(subcategory => {
        const mappedData = this.mapSubCriteriaToEngineData(
          categoryName,
          subcategory.name,
          fundType,
          engineData,
          analysisEngines
        );
        
        // Calculate sub-criteria score based on available data
        const baseScore = categoryScore * (subcategory.weight / 100);
        const dataAvailabilityMultiplier = mappedData.data_availability === 'complete' ? 1.0 : 
                                          mappedData.data_availability === 'partial' ? 0.8 : 0.6;
        
        return {
          name: subcategory.name,
          score: Math.round(baseScore * dataAvailabilityMultiplier),
          weight: subcategory.weight,
          confidence: mappedData.confidence,
          reasoning: mappedData.reasoning,
          engine_source: mappedData.engine_source,
          data_availability: mappedData.data_availability
        };
      });
  }
  
  /**
   * Maps specific sub-criteria to engine data and generates insights
   */
  private static mapSubCriteriaToEngineData(
    categoryName: string,
    subCriteriaName: string,
    fundType: 'vc' | 'pe',
    engineData?: EngineDataSources,
    analysisEngines?: Record<string, any>
  ): {
    confidence: number;
    reasoning: string;
    engine_source: string;
    data_availability: 'complete' | 'partial' | 'pending';
  } {
    
    const lowerCategory = categoryName.toLowerCase();
    const lowerSubCriteria = subCriteriaName.toLowerCase();
    
    // Market Opportunity Sub-Criteria Mapping
    if (lowerCategory.includes('market')) {
      if (lowerSubCriteria.includes('size') || lowerSubCriteria.includes('tam')) {
        const hasMarketData = engineData?.market_intelligence_engine && 
                             Object.keys(engineData.market_intelligence_engine).length > 0;
        return {
          confidence: hasMarketData ? 90 : 65,
          reasoning: hasMarketData 
            ? 'Market sizing analysis completed using industry intelligence and competitive benchmarking'
            : 'Market sizing estimate based on industry standards and available data',
          engine_source: 'market-intelligence-engine',
          data_availability: hasMarketData ? 'complete' : 'partial'
        };
      }
      
      if (lowerSubCriteria.includes('growth')) {
        const hasGrowthData = engineData?.market_intelligence_engine?.growth_indicators;
        return {
          confidence: hasGrowthData ? 85 : 60,
          reasoning: hasGrowthData
            ? 'Growth rate analysis based on industry trends and market dynamics'
            : 'Growth estimates using industry benchmarks and market analysis',
          engine_source: 'market-intelligence-engine',
          data_availability: hasGrowthData ? 'complete' : 'partial'
        };
      }
      
      if (lowerSubCriteria.includes('timing')) {
        const hasTimingData = engineData?.thesis_alignment_engine;
        return {
          confidence: hasTimingData ? 80 : 55,
          reasoning: hasTimingData
            ? 'Market timing analysis using strategic alignment and market cycle data'
            : 'Timing assessment based on available market indicators',
          engine_source: 'thesis-alignment-engine',
          data_availability: hasTimingData ? 'complete' : 'partial'
        };
      }
      
      if (lowerSubCriteria.includes('competitive')) {
        const hasCompetitiveData = engineData?.competitive_intelligence;
        return {
          confidence: hasCompetitiveData ? 85 : 60,
          reasoning: hasCompetitiveData
            ? 'Competitive landscape analysis using real-time competitive intelligence'
            : 'Competitive assessment based on available market data',
          engine_source: 'enhanced-competitive-intelligence',
          data_availability: hasCompetitiveData ? 'complete' : 'partial'
        };
      }
    }
    
    // Team & Leadership Sub-Criteria Mapping
    if (lowerCategory.includes('team') || lowerCategory.includes('leadership')) {
      if (lowerSubCriteria.includes('founder') || lowerSubCriteria.includes('experience')) {
        const hasTeamData = engineData?.team_research_engine;
        return {
          confidence: hasTeamData ? 85 : 60,
          reasoning: hasTeamData
            ? 'Founder experience analysis using professional background research and track record validation'
            : 'Founder assessment based on available profile data',
          engine_source: 'team-research-engine',
          data_availability: hasTeamData ? 'complete' : 'partial'
        };
      }
      
      if (lowerSubCriteria.includes('domain') || lowerSubCriteria.includes('expertise')) {
        const hasDomainData = engineData?.team_research_engine?.domain_expertise;
        return {
          confidence: hasDomainData ? 80 : 55,
          reasoning: hasDomainData
            ? 'Domain expertise validated through industry experience and technical background analysis'
            : 'Domain expertise estimated based on team profiles and industry alignment',
          engine_source: 'team-research-engine',
          data_availability: hasDomainData ? 'complete' : 'partial'
        };
      }
      
      if (lowerSubCriteria.includes('execution') || lowerSubCriteria.includes('track record')) {
        const hasExecutionData = engineData?.team_research_engine?.execution_metrics;
        return {
          confidence: hasExecutionData ? 75 : 50,
          reasoning: hasExecutionData
            ? 'Execution track record analysis using milestone achievement and delivery history'
            : 'Execution assessment based on available team performance indicators',
          engine_source: 'team-research-engine',
          data_availability: hasExecutionData ? 'complete' : 'partial'
        };
      }
    }
    
    // Financial Sub-Criteria Mapping
    if (lowerCategory.includes('financial') || lowerCategory.includes('performance')) {
      if (lowerSubCriteria.includes('revenue') || lowerSubCriteria.includes('growth')) {
        const hasRevenueData = engineData?.financial_engine;
        return {
          confidence: hasRevenueData ? 90 : 65,
          reasoning: hasRevenueData
            ? 'Revenue analysis using financial data extraction and growth trend modeling'
            : 'Revenue assessment based on available financial indicators',
          engine_source: 'financial-engine',
          data_availability: hasRevenueData ? 'complete' : 'partial'
        };
      }
      
      if (lowerSubCriteria.includes('unit economics') || lowerSubCriteria.includes('ebitda')) {
        const hasUnitEconomicsData = engineData?.financial_engine?.unit_economics;
        return {
          confidence: hasUnitEconomicsData ? 85 : 60,
          reasoning: hasUnitEconomicsData
            ? 'Unit economics validated through financial modeling and customer metrics analysis'
            : 'Unit economics estimated using industry benchmarks and available data',
          engine_source: 'financial-engine',
          data_availability: hasUnitEconomicsData ? 'complete' : 'partial'
        };
      }
      
      if (lowerSubCriteria.includes('cash flow') || lowerSubCriteria.includes('burn')) {
        const hasCashFlowData = engineData?.financial_engine?.cash_flow_analysis;
        return {
          confidence: hasCashFlowData ? 80 : 55,
          reasoning: hasCashFlowData
            ? 'Cash flow analysis using financial projections and burn rate modeling'
            : 'Cash flow assessment based on available financial metrics',
          engine_source: 'financial-engine',
          data_availability: hasCashFlowData ? 'complete' : 'partial'
        };
      }
    }
    
    // Product & Technology Sub-Criteria Mapping
    if (lowerCategory.includes('product') || lowerCategory.includes('technology')) {
      if (lowerSubCriteria.includes('product-market fit') || lowerSubCriteria.includes('market fit')) {
        const hasProductFitData = engineData?.product_ip_engine?.product_market_fit;
        return {
          confidence: hasProductFitData ? 80 : 60,
          reasoning: hasProductFitData
            ? 'Product-market fit analysis using customer validation and market response data'
            : 'Product-market fit assessment based on available customer and market indicators',
          engine_source: 'product-ip-engine',
          data_availability: hasProductFitData ? 'complete' : 'partial'
        };
      }
      
      if (lowerSubCriteria.includes('technology') || lowerSubCriteria.includes('differentiation')) {
        const hasTechData = engineData?.product_ip_engine;
        return {
          confidence: hasTechData ? 85 : 55,
          reasoning: hasTechData
            ? 'Technology differentiation analysis using IP research and competitive technology assessment'
            : 'Technology assessment based on available product and technical information',
          engine_source: 'product-ip-engine',
          data_availability: hasTechData ? 'complete' : 'partial'
        };
      }
    }
    
    // Business Traction Sub-Criteria Mapping
    if (lowerCategory.includes('traction') || lowerCategory.includes('business')) {
      if (lowerSubCriteria.includes('customer') || lowerSubCriteria.includes('metrics')) {
        const hasTractionData = engineData?.market_intelligence_engine?.customer_metrics;
        return {
          confidence: hasTractionData ? 85 : 65,
          reasoning: hasTractionData
            ? 'Customer metrics analysis using engagement data and retention modeling'
            : 'Customer metrics estimated using available traction indicators',
          engine_source: 'market-intelligence-engine',
          data_availability: hasTractionData ? 'complete' : 'partial'
        };
      }
    }
    
    // Default fallback for unmapped sub-criteria
    return {
      confidence: 50,
      reasoning: `${subCriteriaName} analysis pending specialized engine data integration`,
      engine_source: 'pending',
      data_availability: 'pending'
    };
  }
  
  /**
   * Generates comprehensive sub-criteria breakdown for all categories in a deal analysis
   */
  static generateComprehensiveSubCriteria(
    dealAnalysis: EnhancedDealAnalysis,
    fundType: 'vc' | 'pe',
    engineData?: EngineDataSources
  ): Record<string, SubCriteriaItem[]> {
    
    if (!dealAnalysis.rubric_breakdown) {
      return {};
    }
    
    const subCriteriaMap: Record<string, SubCriteriaItem[]> = {};
    
    dealAnalysis.rubric_breakdown.forEach(rubricItem => {
      const subCriteria = this.mapCategoryToSubCriteria(
        rubricItem.category,
        fundType,
        rubricItem.score,
        engineData,
        dealAnalysis.analysis_engines
      );
      
      if (subCriteria.length > 0) {
        subCriteriaMap[rubricItem.category] = subCriteria;
      }
    });
    
    return subCriteriaMap;
  }
  
  /**
   * Calculates analysis completeness based on engine data availability
   */
  static calculateAnalysisCompleteness(
    dealAnalysis: EnhancedDealAnalysis,
    engineData?: EngineDataSources
  ): {
    overall_completeness: number;
    engine_completeness: Record<string, number>;
    missing_data_points: string[];
  } {
    
    const engines = [
      'market_intelligence_engine',
      'team_research_engine', 
      'financial_engine',
      'product_ip_engine',
      'thesis_alignment_engine'
    ];
    
    let completedEngines = 0;
    const engineCompleteness: Record<string, number> = {};
    const missingDataPoints: string[] = [];
    
    engines.forEach(engineName => {
      const hasData = engineData?.[engineName as keyof EngineDataSources] && 
                     Object.keys(engineData[engineName as keyof EngineDataSources] || {}).length > 0;
      
      const completeness = hasData ? 100 : 
        (dealAnalysis.analysis_engines?.[engineName]?.status === 'complete' ? 80 : 
         dealAnalysis.analysis_engines?.[engineName]?.status === 'partial' ? 40 : 0);
      
      engineCompleteness[engineName] = completeness;
      
      if (completeness >= 80) {
        completedEngines++;
      } else {
        missingDataPoints.push(`${engineName.replace(/_/g, ' ')} data`);
      }
    });
    
    const overallCompleteness = Math.round((completedEngines / engines.length) * 100);
    
    return {
      overall_completeness: overallCompleteness,
      engine_completeness: engineCompleteness,
      missing_data_points: missingDataPoints
    };
  }
  
  /**
   * Gets engine data availability status for a specific category
   */
  static getEngineDataStatus(
    categoryName: string,
    fundType: 'vc' | 'pe',
    engineData?: EngineDataSources,
    analysisEngines?: Record<string, any>
  ): {
    primary_engine: string;
    data_available: boolean;
    confidence_score: number;
    last_updated?: string;
  } {
    
    const lowerCategory = categoryName.toLowerCase();
    let primaryEngine = '';
    let dataAvailable = false;
    let confidenceScore = 50;
    let lastUpdated: string | undefined;
    
    // Map categories to their primary engines
    if (lowerCategory.includes('market')) {
      primaryEngine = 'market-intelligence-engine';
      dataAvailable = !!(engineData?.market_intelligence_engine);
      confidenceScore = analysisEngines?.market_intelligence?.confidence || 50;
      lastUpdated = analysisEngines?.market_intelligence?.last_run;
    } else if (lowerCategory.includes('team') || lowerCategory.includes('leadership')) {
      primaryEngine = 'team-research-engine';
      dataAvailable = !!(engineData?.team_research_engine);
      confidenceScore = analysisEngines?.team_research?.confidence || 50;
      lastUpdated = analysisEngines?.team_research?.last_run;
    } else if (lowerCategory.includes('financial') || lowerCategory.includes('performance')) {
      primaryEngine = 'financial-engine';
      dataAvailable = !!(engineData?.financial_engine);
      confidenceScore = analysisEngines?.financial_engine?.confidence || 50;
      lastUpdated = analysisEngines?.financial_engine?.last_run;
    } else if (lowerCategory.includes('product') || lowerCategory.includes('technology')) {
      primaryEngine = 'product-ip-engine';
      dataAvailable = !!(engineData?.product_ip_engine);
      confidenceScore = analysisEngines?.product_ip?.confidence || 50;
      lastUpdated = analysisEngines?.product_ip?.last_run;
    } else if (lowerCategory.includes('traction') || lowerCategory.includes('growth')) {
      primaryEngine = 'market-intelligence-engine';
      dataAvailable = !!(engineData?.market_intelligence_engine?.traction_data);
      confidenceScore = analysisEngines?.market_intelligence?.confidence || 50;
      lastUpdated = analysisEngines?.market_intelligence?.last_run;
    } else if (lowerCategory.includes('strategic') || lowerCategory.includes('timing')) {
      primaryEngine = 'thesis-alignment-engine';
      dataAvailable = !!(engineData?.thesis_alignment_engine);
      confidenceScore = analysisEngines?.thesis_alignment?.confidence || 50;
      lastUpdated = analysisEngines?.thesis_alignment?.last_run;
    }
    
    return {
      primary_engine: primaryEngine,
      data_available: dataAvailable,
      confidence_score: confidenceScore,
      last_updated: lastUpdated
    };
  }
}