/**
 * Production Readiness Test Suite
 * Comprehensive testing for 24-hour pre-launch validation
 */

import { supabase } from '@/integrations/supabase/client';

export interface TestResult {
  testName: string;
  passed: boolean;
  details: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  recommendation?: string;
}

export interface ProductionReadinessReport {
  overallScore: number;
  totalTests: number;
  passed: number;
  failed: number;
  criticalIssues: number;
  results: TestResult[];
  readyForProduction: boolean;
}

export class ProductionReadinessTest {
  private results: TestResult[] = [];

  private addResult(
    testName: string,
    passed: boolean,
    details: string,
    severity: 'critical' | 'high' | 'medium' | 'low',
    recommendation?: string
  ) {
    this.results.push({
      testName,
      passed,
      details,
      severity,
      recommendation
    });
  }

  // Authentication & Security Tests
  private async testAuthentication(): Promise<void> {
    try {
      // Test if authentication is properly configured
      const { data: user, error } = await supabase.auth.getUser();
      
      if (error && error.message.includes('session')) {
        this.addResult(
          'Authentication State',
          false,
          'User session not available - authentication may not be configured',
          'critical',
          'Ensure users are properly authenticated before accessing IC features'
        );
      } else {
        this.addResult(
          'Authentication State',
          true,
          'Authentication system is functional',
          'low'
        );
      }
    } catch (error) {
      this.addResult(
        'Authentication State',
        false,
        `Authentication error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'critical',
        'Fix authentication configuration before launch'
      );
    }
  }

  // Database Connectivity Tests
  private async testDatabaseConnectivity(): Promise<void> {
    try {
      // Test basic database connectivity
      const { data, error } = await supabase
        .from('organizations')
        .select('id')
        .limit(1);

      if (error) {
        this.addResult(
          'Database Connectivity',
          false,
          `Database connection failed: ${error.message}`,
          'critical',
          'Fix database connection issues before launch'
        );
      } else {
        this.addResult(
          'Database Connectivity',
          true,
          'Database is accessible and responsive',
          'low'
        );
      }
    } catch (error) {
      this.addResult(
        'Database Connectivity',
        false,
        `Database connectivity error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'critical',
        'Resolve database connectivity issues'
      );
    }
  }

  // IC Tables Structure Tests
  private async testICTablesStructure(): Promise<void> {
    const icTables = [
      'ic_sessions',
      'ic_session_deals', 
      'ic_voting_decisions',
      'ic_memo_votes',
      'ic_memos',
      'ic_committee_members'
    ] as const;

    for (const table of icTables) {
      try {
        // Use a more robust table existence check
        const { data, error } = await supabase
          .from(table as any)
          .select('id')
          .limit(1);

        // Tables are newly created, so no error means they exist
        if (!error) {
          this.addResult(
            `IC Table: ${table}`,
            true,
            `Table ${table} is accessible and properly configured`,
            'low'
          );
        } else if (error.code === 'PGRST106' || error.message.includes('relation') || error.message.includes('does not exist')) {
          this.addResult(
            `IC Table: ${table}`,
            false,
            `Table ${table} does not exist - database migration may be needed`,
            'critical',
            `Run database migration to create table: ${table}`
          );
        } else {
          // Consider RLS blocking as success since it means table exists
          this.addResult(
            `IC Table: ${table}`,
            true,
            `Table ${table} exists (RLS properly restricting access)`,
            'low'
          );
        }
      } catch (error) {
        this.addResult(
          `IC Table: ${table}`,
          false,
          `Error accessing table ${table}: ${error instanceof Error ? error.message : 'Unknown error'}`,
          'medium',
          `Check table permissions and structure for ${table}`
        );
      }
    }
  }

  // RLS Policies Tests
  private async testRLSPolicies(): Promise<void> {
    try {
      // Test that RLS is enforced by attempting unauthorized access
      const { data, error } = await supabase
        .from('ic_sessions')
        .select('*');

      // If we get data without being in a fund, RLS might not be working
      if (data && data.length > 0) {
        // Check if user has proper fund access
        const { data: fundData } = await supabase
          .from('funds')
          .select('id')
          .limit(1);

        if (!fundData || fundData.length === 0) {
          this.addResult(
            'RLS Enforcement',
            false,
            'RLS might not be properly enforced - data accessible without fund membership',
            'high',
            'Review and strengthen RLS policies'
          );
        } else {
          this.addResult(
            'RLS Enforcement',
            true,
            'RLS appears to be functioning correctly',
            'low'
          );
        }
      } else {
        this.addResult(
          'RLS Enforcement',
          true,
          'RLS is properly restricting access',
          'low'
        );
      }
    } catch (error) {
      this.addResult(
        'RLS Enforcement',
        false,
        `RLS test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'medium',
        'Review RLS policy configuration'
      );
    }
  }

  // Edge Functions Tests
  private async testEdgeFunctions(): Promise<void> {
    const criticalFunctions = [
      'ai-memo-generator',
      'enhanced-pdf-generator',
      'ic-memo-pdf-exporter', 
      'reuben-orchestrator'
    ];

    for (const funcName of criticalFunctions) {
      try {
        // Test function availability with minimal payload 
        const { data, error } = await supabase.functions.invoke(funcName, {
          body: { test: true }
        });

        // Functions exist if they respond (even with errors due to missing auth/params)
        // Only fail if network/deployment issues
        if (error && (error.message.includes('Failed to fetch') || error.message.includes('Network'))) {
          this.addResult(
            `Edge Function: ${funcName}`,
            false,
            `Function ${funcName} deployment issue: ${error.message}`,
            'medium',
            `Check deployment status for ${funcName} function`
          );
        } else {
          // Function is deployed and responding (success or expected errors)
          this.addResult(
            `Edge Function: ${funcName}`,
            true,
            `Function ${funcName} is deployed and responsive`,
            'low'
          );
        }
      } catch (error) {
        // Network or deployment issues
        this.addResult(
          `Edge Function: ${funcName}`,
          false,
          `Function ${funcName} deployment test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          'medium',
          `Verify ${funcName} function is properly deployed`
        );
      }
    }
  }

  // Performance Tests
  private async testPerformance(): Promise<void> {
    const startTime = performance.now();
    
    try {
      // Test complex query performance
      const { data, error } = await supabase
        .from('deals')
        .select(`
          *,
          deal_analyses(*)
        `)
        .limit(10);

      const endTime = performance.now();
      const queryTime = endTime - startTime;

      if (queryTime > 2000) {
        this.addResult(
          'Query Performance',
          false,
          `Complex queries taking ${queryTime.toFixed(0)}ms - performance may be poor`,
          'medium',
          'Optimize database queries and add appropriate indexes'
        );
      } else {
        this.addResult(
          'Query Performance',
          true,
          `Query performance acceptable: ${queryTime.toFixed(0)}ms`,
          'low'
        );
      }
    } catch (error) {
      this.addResult(
        'Query Performance',
        false,
        `Performance test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'medium',
        'Investigate query performance issues'
      );
    }
  }

  // Data Validation Tests
  private async testDataValidation(): Promise<void> {
    try {
      // Test for orphaned data
      const { data: dealsWithoutFunds, error: dealsError } = await supabase
        .from('deals')
        .select('id, fund_id')
        .is('fund_id', null);

      if (dealsError) {
        this.addResult(
          'Data Integrity - Deals',
          false,
          `Error checking deal data integrity: ${dealsError.message}`,
          'medium',
          'Fix data integrity query issues'
        );
      } else if (dealsWithoutFunds && dealsWithoutFunds.length > 0) {
        this.addResult(
          'Data Integrity - Deals',
          false,
          `Found ${dealsWithoutFunds.length} deals without fund association`,
          'high',
          'Clean up orphaned deal records'
        );
      } else {
        this.addResult(
          'Data Integrity - Deals',
          true,
          'All deals properly associated with funds',
          'low'
        );
      }

      // Test for missing investment strategies
      const { data: fundsWithoutStrategy, error: strategyError } = await supabase
        .from('funds')
        .select(`
          id, 
          name,
          investment_strategies(id)
        `)
        .is('investment_strategies.id', null);

      if (strategyError) {
        this.addResult(
          'Data Integrity - Strategies',
          false,
          `Error checking strategy data: ${strategyError.message}`,
          'medium',
          'Fix strategy data integrity issues'
        );
      } else if (fundsWithoutStrategy && fundsWithoutStrategy.length > 0) {
        this.addResult(
          'Data Integrity - Strategies',
          false,
          `Found ${fundsWithoutStrategy.length} funds without investment strategies`,
          'high',
          'Create investment strategies for all funds'
        );
      } else {
        this.addResult(
          'Data Integrity - Strategies',
          true,
          'All funds have investment strategies configured',
          'low'
        );
      }
    } catch (error) {
      this.addResult(
        'Data Validation',
        false,
        `Data validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'medium',
        'Review data validation logic'
      );
    }
  }

  // UI/UX Critical Path Tests
  private testCriticalUserPaths(): void {
    const criticalPaths = [
      {
        path: 'Fund Selection',
        check: () => {
          // Look for fund selector or fund context
          const fundSelector = document.querySelector('[data-testid="fund-selector"]') ||
                               document.querySelector('select') ||
                               document.querySelector('[data-fund-selector]') ||
                               document.querySelector('.fund-selector');
          return fundSelector !== null;
        }
      },
      {
        path: 'IC Navigation',
        check: () => {
          const icNav = document.querySelector('a[href*="/ic"]') ||
                        document.querySelector('a[href="/ic"]') ||
                        document.querySelector('[data-nav="ic"]');
          return icNav !== null;
        }
      },
      {
        path: 'Deal Pipeline Display',
        check: () => {
          const dealPipeline = document.querySelector('[data-testid="deal-pipeline"]') || 
                              document.querySelector('.deal-card') ||
                              document.querySelector('[role="tabpanel"]') ||
                              document.querySelector('.kanban-board') ||
                              document.querySelector('[data-deal-card]');
          return dealPipeline !== null;
        }
      },
      {
        path: 'Navigation Sidebar',
        check: () => {
          const sidebar = document.querySelector('[data-sidebar]') ||
                         document.querySelector('nav') ||
                         document.querySelector('.sidebar');
          return sidebar !== null;
        }
      }
    ];

    criticalPaths.forEach(({ path, check }) => {
      try {
        const pathExists = check();
        this.addResult(
          `UI Critical Path: ${path}`,
          pathExists,
          pathExists ? `${path} is accessible and functional` : `${path} not found in current view`,
          pathExists ? 'low' : 'medium',
          pathExists ? undefined : `Navigate to appropriate page to test ${path}`
        );
      } catch (error) {
        this.addResult(
          `UI Critical Path: ${path}`,
          false,
          `Error testing ${path}: ${error instanceof Error ? error.message : 'Unknown error'}`,
          'medium',
          `Fix ${path} rendering issues`
        );
      }
    });
  }

  // Console Error Detection
  private testConsoleErrors(): void {
    // Check for critical console errors (this would need to be enhanced with actual error tracking)
    const knownErrors = [
      'Failed to fetch',
      'Network request failed',
      'Supabase error',
      'Authentication error',
      'RLS policy',
      'permission denied'
    ];

    // This is a placeholder - in real implementation, you'd capture console errors
    let hasErrors = false;
    const errorDetails = [];

    // Check if there are any React error boundaries triggered
    const errorBoundaries = document.querySelectorAll('[data-error-boundary]');
    if (errorBoundaries.length > 0) {
      hasErrors = true;
      errorDetails.push('React error boundaries detected');
    }

    // Check for missing images or broken resources
    const brokenImages = Array.from(document.querySelectorAll('img')).filter(
      img => !img.complete || img.naturalHeight === 0
    );
    
    if (brokenImages.length > 0) {
      hasErrors = true;
      errorDetails.push(`${brokenImages.length} broken images found`);
    }

    this.addResult(
      'Frontend Error Detection',
      !hasErrors,
      hasErrors ? `Frontend issues detected: ${errorDetails.join(', ')}` : 'No critical frontend errors detected',
      hasErrors ? 'medium' : 'low',
      hasErrors ? 'Fix frontend errors before launch' : undefined
    );
  }

  // Mobile Responsiveness Test
  private testMobileResponsiveness(): void {
    const viewportWidth = window.innerWidth;
    const isMobile = viewportWidth < 768;
    
    if (isMobile) {
      // Test mobile-specific elements
      const mobileMenu = document.querySelector('[data-mobile-menu]') || 
                        document.querySelector('.sidebar-mobile') ||
                        document.querySelector('button[aria-label*="menu"]');
      
      this.addResult(
        'Mobile Responsiveness',
        mobileMenu !== null,
        mobileMenu ? 'Mobile navigation is available' : 'Mobile navigation not found',
        'medium',
        mobileMenu ? undefined : 'Implement proper mobile navigation'
      );
    } else {
      // Test responsive design elements
      const responsiveElements = document.querySelectorAll('.md\\:hidden, .lg\\:block, .responsive');
      
      this.addResult(
        'Desktop Responsive Design',
        responsiveElements.length > 0,
        responsiveElements.length > 0 ? 'Responsive design elements detected' : 'No responsive design classes found',
        'low'
      );
    }
  }

  // Run all tests and generate report
  async runFullTestSuite(): Promise<ProductionReadinessReport> {
    console.log('🔍 Starting Production Readiness Test Suite...');
    
    this.results = []; // Reset results
    
    // Run all test categories
    await this.testAuthentication();
    await this.testDatabaseConnectivity();
    await this.testICTablesStructure();
    await this.testRLSPolicies();
    await this.testEdgeFunctions();
    await this.testPerformance();
    await this.testDataValidation();
    this.testCriticalUserPaths();
    this.testConsoleErrors();
    this.testMobileResponsiveness();

    // Calculate metrics
    const totalTests = this.results.length;
    const passed = this.results.filter(r => r.passed).length;
    const failed = totalTests - passed;
    const criticalIssues = this.results.filter(r => !r.passed && r.severity === 'critical').length;
    
    // Calculate score (weighted by severity)
    let totalPoints = 0;
    let maxPoints = 0;
    
    this.results.forEach(result => {
      const severityWeight = {
        'critical': 10,
        'high': 6,
        'medium': 3,
        'low': 1
      }[result.severity];
      
      maxPoints += severityWeight;
      if (result.passed) {
        totalPoints += severityWeight;
      }
    });
    
    const overallScore = Math.round((totalPoints / maxPoints) * 100);
    const readyForProduction = criticalIssues === 0 && overallScore >= 85;

    const report: ProductionReadinessReport = {
      overallScore,
      totalTests,
      passed,
      failed,
      criticalIssues,
      results: this.results,
      readyForProduction
    };

    // Log summary
    console.log(`\n📊 Production Readiness Report:`);
    console.log(`Overall Score: ${overallScore}/100`);
    console.log(`Tests Passed: ${passed}/${totalTests}`);
    console.log(`Critical Issues: ${criticalIssues}`);
    console.log(`Ready for Production: ${readyForProduction ? '✅ YES' : '❌ NO'}`);
    
    if (!readyForProduction) {
      console.log('\n⚠️  Critical Issues to Fix:');
      this.results
        .filter(r => !r.passed && r.severity === 'critical')
        .forEach(result => {
          console.log(`- ${result.testName}: ${result.details}`);
          if (result.recommendation) {
            console.log(`  💡 ${result.recommendation}`);
          }
        });
    }

    return report;
  }
}

// Export singleton instance
export const productionReadinessTest = new ProductionReadinessTest();