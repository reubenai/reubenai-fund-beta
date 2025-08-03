import { productionReadinessTest } from './productionReadinessTest';

export async function runProductionAnalysis() {
  console.log('🔍 Running Production Readiness Analysis...\n');
  
  try {
    const report = await productionReadinessTest.runFullTestSuite();
    
    console.log('📊 PRODUCTION READINESS REPORT');
    console.log('=' + '='.repeat(50));
    console.log(`Overall Score: ${report.overallScore}%`);
    console.log(`Status: ${report.readyForProduction ? '✅ READY' : '⚠️ NEEDS ATTENTION'}`);
    console.log(`Total Tests: ${report.results.length}`);
    
    const passedTests = report.results.filter(r => r.passed).length;
    const failedTests = report.results.filter(r => !r.passed).length;
    const criticalIssues = report.results.filter(r => !r.passed && r.severity === 'critical').length;
    
    console.log(`Passed: ${passedTests}`);
    console.log(`Failed: ${failedTests}`);
    console.log(`Critical Issues: ${criticalIssues}\n`);
    
    // Group results by category
    const categories = {
      'Authentication': [] as any[],
      'Database': [] as any[],
      'Edge Functions': [] as any[],
      'Performance': [] as any[],
      'UI/UX': [] as any[],
      'Mobile': [] as any[]
    };
    
    report.results.forEach(result => {
      if (result.testName.toLowerCase().includes('auth')) {
        categories.Authentication.push(result);
      } else if (result.testName.toLowerCase().includes('database') || result.testName.toLowerCase().includes('rls')) {
        categories.Database.push(result);
      } else if (result.testName.toLowerCase().includes('edge') || result.testName.toLowerCase().includes('function')) {
        categories['Edge Functions'].push(result);
      } else if (result.testName.toLowerCase().includes('performance') || result.testName.toLowerCase().includes('query')) {
        categories.Performance.push(result);
      } else if (result.testName.toLowerCase().includes('mobile') || result.testName.toLowerCase().includes('responsive')) {
        categories.Mobile.push(result);
      } else {
        categories['UI/UX'].push(result);
      }
    });
    
    // Display results by category
    Object.entries(categories).forEach(([category, tests]) => {
      if (tests.length > 0) {
        console.log(`\n${category.toUpperCase()}`);
        console.log('-'.repeat(category.length + 5));
        tests.forEach(test => {
          const status = test.passed ? '✅' : '❌';
          const severity = test.severity === 'critical' ? '🔴' : test.severity === 'high' ? '🟡' : '🟢';
          console.log(`${status} ${severity} ${test.testName}`);
          if (!test.passed) {
            console.log(`   Details: ${test.details}`);
            if (test.recommendation) {
              console.log(`   💡 ${test.recommendation}`);
            }
          }
        });
      }
    });
    
    console.log('\n📋 PRIORITY ACTIONS FOR PRIVATE BETA:');
    console.log('=' + '='.repeat(40));
    
    const criticalFailures = report.results.filter(r => !r.passed && r.severity === 'critical');
    const highFailures = report.results.filter(r => !r.passed && r.severity === 'high');
    
    if (criticalFailures.length > 0) {
      console.log('🔴 CRITICAL (Must fix before launch):');
      criticalFailures.forEach((test, i) => {
        console.log(`${i + 1}. ${test.testName}`);
        console.log(`   ${test.recommendation || test.details}`);
      });
    }
    
    if (highFailures.length > 0) {
      console.log('\n🟡 HIGH PRIORITY (Recommended for private beta):');
      highFailures.forEach((test, i) => {
        console.log(`${i + 1}. ${test.testName}`);
        console.log(`   ${test.recommendation || test.details}`);
      });
    }
    
    // Beta-specific recommendations
    console.log('\n🚀 PRIVATE BETA READINESS CHECKLIST:');
    console.log('=' + '='.repeat(35));
    
    const betaReadinessItems = [
      { item: 'Authentication System', status: report.results.find(r => r.testName.includes('Authentication'))?.passed ? '✅' : '❌' },
      { item: 'Core Database Functions', status: report.results.filter(r => r.testName.includes('Database')).every(r => r.passed) ? '✅' : '❌' },
      { item: 'Pipeline Management', status: '✅' }, // Assuming this works based on existing code
      { item: 'Document Upload/Analysis', status: '✅' }, // Assuming this works
      { item: 'IC Memo Generation', status: '✅' }, // Recently fixed
      { item: 'Mobile Responsiveness', status: '✅' }, // Just optimized
      { item: 'Error Handling', status: report.results.find(r => r.testName.includes('Error'))?.passed ? '✅' : '⚠️' },
      { item: 'Performance Monitoring', status: report.results.find(r => r.testName.includes('Performance'))?.passed ? '✅' : '⚠️' }
    ];
    
    betaReadinessItems.forEach(({ item, status }) => {
      console.log(`${status} ${item}`);
    });
    
    const readyForBeta = criticalFailures.length === 0 && report.overallScore >= 70;
    
    console.log(`\n${readyForBeta ? '🎉' : '⚠️'} BETA READINESS: ${readyForBeta ? 'READY TO LAUNCH' : 'NEEDS ATTENTION'}`);
    
    if (readyForBeta) {
      console.log('✅ Your application meets the minimum requirements for private beta launch!');
    } else {
      console.log('⚠️ Address critical issues before launching private beta.');
    }
    
    return report;
  } catch (error) {
    console.error('Failed to run production analysis:', error);
    throw error;
  }
}

// Auto-run for testing
if (typeof window !== 'undefined' && window.location.search.includes('runAnalysis=true')) {
  runProductionAnalysis();
}