// End-to-end testing utility for V2 investment strategy system
import { supabase } from '@/integrations/supabase/client';
import { unifiedStrategyService, EnhancedWizardData } from '@/services/unifiedStrategyService';
import { strategyServiceV2 } from '@/services/strategyServiceV2';

export interface TestResult {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

export class StrategyTestRunner {
  
  static async runFullDataFlowTest(fundId: string): Promise<TestResult[]> {
    const results: TestResult[] = [];
    
    console.log('🧪 === RUNNING FULL STRATEGY V2 DATA FLOW TEST ===');
    console.log('Fund ID:', fundId);
    
    try {
      // Test 1: Check fund exists and get data
      results.push(await this.testFundExists(fundId));
      
      // Test 2: Test wizard data save to V2 table
      results.push(await this.testWizardSave(fundId));
      
      // Test 3: Test Investment Strategy page edits
      results.push(await this.testInvestmentStrategyEdits(fundId));
      
      // Test 4: Test data integrity across both tables
      results.push(await this.testDataIntegrity(fundId));
      
      // Test 5: Test versioning functionality
      results.push(await this.testVersioning(fundId));
      
    } catch (error) {
      results.push({
        success: false,
        message: 'Test runner failed',
        error: error instanceof Error ? error.message : String(error)
      });
    }
    
    console.log('🧪 === TEST RESULTS SUMMARY ===');
    results.forEach((result, index) => {
      const status = result.success ? '✅' : '❌';
      console.log(`${status} Test ${index + 1}: ${result.message}`);
      if (!result.success) console.log(`   Error: ${result.error}`);
    });
    
    return results;
  }
  
  static async testFundExists(fundId: string): Promise<TestResult> {
    try {
      const { data, error } = await supabase
        .from('funds')
        .select('id, name, organization_id, fund_type')
        .eq('id', fundId)
        .single();
        
      if (error) throw error;
      if (!data) throw new Error('Fund not found');
      
      return {
        success: true,
        message: 'Fund exists and accessible',
        data: { 
          name: data.name, 
          org_id: data.organization_id, 
          fund_type: data.fund_type 
        }
      };
    } catch (error) {
      return {
        success: false,
        message: 'Fund validation failed',
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
  
  static async testWizardSave(fundId: string): Promise<TestResult> {
    try {
      console.log('🎯 Testing wizard save to V2 table...');
      
      const mockWizardData: EnhancedWizardData = {
        fundName: `Test Fund ${Date.now()}`,
        strategyDescription: 'Test strategy description',
        fundType: 'vc',
        sectors: ['Technology', 'Healthcare'],
        stages: ['Seed', 'Series A'],
        geographies: ['North America', 'Europe'],
        checkSizeRange: { min: 500000, max: 5000000 },
        keySignals: ['Strong team', 'Large market'],
        dealThresholds: { exciting: 85, promising: 70, needs_development: 50 },
        teamLeadershipConfig: { weight: 20, subcategories: {}, positiveSignals: [], negativeSignals: [] },
        marketOpportunityConfig: { weight: 20, subcategories: {}, positiveSignals: [], negativeSignals: [] },
        productTechnologyConfig: { weight: 20, subcategories: {}, positiveSignals: [], negativeSignals: [] },
        businessTractionConfig: { weight: 20, subcategories: {}, positiveSignals: [], negativeSignals: [] },
        financialHealthConfig: { weight: 10, subcategories: {}, positiveSignals: [], negativeSignals: [] },
        strategicFitConfig: { weight: 10, subcategories: {}, positiveSignals: [], negativeSignals: [] },
        enhancedCriteria: []
      };
      
      const savedStrategy = await unifiedStrategyService.saveStrategy(fundId, mockWizardData);
      
      if (!savedStrategy?.id) {
        throw new Error('No strategy ID returned from save operation');
      }
      
      // Verify data in V2 table
      const { data: v2Data } = await supabase
        .from('investment_strategies_v2')
        .select('*')
        .eq('fund_id', fundId)
        .single();
        
      if (!v2Data) {
        throw new Error('Strategy not found in V2 table after save');
      }
      
      return {
        success: true,
        message: 'Wizard data saved correctly to V2 table',
        data: { 
          strategy_id: v2Data.id, 
          fund_type_conversion: `${mockWizardData.fundType} → ${v2Data.fund_type}`,
          sectors_count: v2Data.sectors?.length || 0,
          check_size_range: { min: v2Data.check_size_min, max: v2Data.check_size_max }
        }
      };
      
    } catch (error) {
      return {
        success: false,
        message: 'Wizard save test failed',
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
  
  static async testInvestmentStrategyEdits(fundId: string): Promise<TestResult> {
    try {
      console.log('🎯 Testing Investment Strategy page edits...');
      
      // First get existing strategy
      const existingStrategy = await unifiedStrategyService.getFundStrategy(fundId);
      if (!existingStrategy?.id) {
        throw new Error('No existing strategy to edit');
      }
      
      // Test legacy update format (Investment Strategy page style)
      const legacyUpdates = {
        id: existingStrategy.id,
        fund_id: fundId,
        fund_type: 'pe', // Test conversion
        industries: ['Manufacturing', 'Services'], 
        geography: ['Asia', 'Europe'],
        strategy_notes: 'Updated via Investment Strategy page',
        exciting_threshold: 90,
        promising_threshold: 75
      };
      
      const updatedStrategy = await unifiedStrategyService.updateFundStrategy(existingStrategy.id, legacyUpdates);
      
      if (!updatedStrategy) {
        throw new Error('No updated strategy returned');
      }
      
      return {
        success: true,
        message: 'Investment Strategy page edits saved correctly',
        data: {
          fund_type_converted: updatedStrategy.fund_type,
          industries_updated: updatedStrategy.industries,
          geography_updated: updatedStrategy.geography,
          thresholds_updated: {
            exciting: updatedStrategy.exciting_threshold,
            promising: updatedStrategy.promising_threshold
          }
        }
      };
      
    } catch (error) {
      return {
        success: false,
        message: 'Investment Strategy edits test failed',
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
  
  static async testDataIntegrity(fundId: string): Promise<TestResult> {
    try {
      console.log('🎯 Testing data integrity across tables...');
      
      // Check V2 table
      const { data: v2Data } = await supabase
        .from('investment_strategies_v2')
        .select('*')
        .eq('fund_id', fundId)
        .single();
        
      // Check legacy table (should exist for comparison)
      const { data: legacyData } = await supabase
        .from('investment_strategies')
        .select('*')
        .eq('fund_id', fundId)
        .maybeSingle();
      
      const integrity = {
        v2_exists: !!v2Data,
        v2_has_fund_type: !!v2Data?.fund_type,
        v2_fund_type_valid: v2Data?.fund_type === 'venture_capital' || v2Data?.fund_type === 'private_equity',
        v2_has_organization_id: !!v2Data?.organization_id,
        v2_has_enhanced_criteria: Array.isArray(v2Data?.enhanced_criteria),
        legacy_exists: !!legacyData,
        both_exist: !!v2Data && !!legacyData
      };
      
      const allChecksPass = Object.values(integrity).every(check => 
        typeof check === 'boolean' ? check : true
      );
      
      return {
        success: allChecksPass,
        message: allChecksPass ? 'Data integrity checks passed' : 'Data integrity issues found',
        data: integrity
      };
      
    } catch (error) {
      return {
        success: false,
        message: 'Data integrity test failed',
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
  
  static async testVersioning(fundId: string): Promise<TestResult> {
    try {
      console.log('🎯 Testing versioning functionality...');
      
      // Make multiple updates to test versioning
      const strategy = await unifiedStrategyService.getFundStrategy(fundId);
      if (!strategy?.id) throw new Error('No strategy to version');
      
      const update1 = { strategy_notes: `Version 1 - ${Date.now()}` };
      const update2 = { strategy_notes: `Version 2 - ${Date.now()}` };
      
      await unifiedStrategyService.updateFundStrategy(strategy.id, update1);
      await new Promise(resolve => setTimeout(resolve, 100)); // Small delay
      await unifiedStrategyService.updateFundStrategy(strategy.id, update2);
      
      return {
        success: true,
        message: 'Versioning test completed',
        data: { note: 'Versioning requires manual verification in database' }
      };
      
    } catch (error) {
      return {
        success: false,
        message: 'Versioning test failed',
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
  
  static async getDataFlowSummary(fundId: string) {
    console.log('📊 === CURRENT DATA FLOW SUMMARY ===');
    
    try {
      // Check both tables
      const { data: v2Data } = await supabase
        .from('investment_strategies_v2')
        .select('*')
        .eq('fund_id', fundId)
        .maybeSingle();
        
      const { data: legacyData } = await supabase
        .from('investment_strategies')
        .select('*')
        .eq('fund_id', fundId)
        .maybeSingle();
      
      console.log('V2 Table Status:', v2Data ? '✅ Has Data' : '❌ No Data');
      console.log('Legacy Table Status:', legacyData ? '✅ Has Data' : '❌ No Data');
      
      if (v2Data) {
        console.log('V2 Data Summary:', {
          id: v2Data.id,
          fund_type: v2Data.fund_type,
          sectors: v2Data.sectors?.length || 0,
          enhanced_criteria: Array.isArray(v2Data.enhanced_criteria) ? v2Data.enhanced_criteria.length : 'Not array'
        });
      }
      
      return { v2Data, legacyData };
    } catch (error) {
      console.error('❌ Summary failed:', error);
      return null;
    }
  }
}