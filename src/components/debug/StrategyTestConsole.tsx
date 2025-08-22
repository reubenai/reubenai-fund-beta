import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StrategyTestRunner, TestResult } from '@/utils/strategyTestRunner';

export const StrategyTestConsole: React.FC = () => {
  const [results, setResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  
  // Use Reuben Fund 1 for testing (belongs to Reuben organization) 
  const testFundId = '1fbf40e1-9307-4399-b3c5-8034d7cdbfde';
  
  const runTests = async () => {
    setIsRunning(true);
    setResults([]);
    
    try {
      console.log('🧪 Starting V2 Strategy Tests...');
      const testResults = await StrategyTestRunner.runFullDataFlowTest(testFundId);
      setResults(testResults);
      
      // Also log data flow summary
      await StrategyTestRunner.getDataFlowSummary(testFundId);
    } catch (error) {
      console.error('❌ Test execution failed:', error);
      setResults([{
        success: false,
        message: 'Test execution failed',
        error: error instanceof Error ? error.message : String(error)
      }]);
    } finally {
      setIsRunning(false);
    }
  };
  
  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Strategy V2 Migration Test Console</CardTitle>
        <p className="text-sm text-muted-foreground">
          Tests end-to-end data flow from wizard to V2 table
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-4">
          <Button 
            onClick={runTests} 
            disabled={isRunning}
            className="bg-primary text-primary-foreground"
          >
            {isRunning ? 'Running Tests...' : 'Run Full Test Suite'}
          </Button>
          <div className="text-sm text-muted-foreground flex items-center">
            Test Fund: {testFundId}
          </div>
        </div>
        
        {results.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-medium">Test Results:</h3>
            {results.map((result, index) => (
              <div 
                key={index}
                className={`p-3 rounded-lg border ${
                  result.success 
                    ? 'bg-success/10 border-success text-success-foreground'
                    : 'bg-destructive/10 border-destructive text-destructive-foreground'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">
                    {result.success ? '✅' : '❌'}
                  </span>
                  <span className="font-medium">{result.message}</span>
                </div>
                {result.error && (
                  <div className="mt-2 text-sm opacity-90">
                    Error: {result.error}
                  </div>
                )}
                {result.data && (
                  <div className="mt-2 text-sm">
                    <pre className="overflow-auto">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        
        <div className="text-xs text-muted-foreground">
          Check browser console for detailed test logs and data flow summary.
        </div>
      </CardContent>
    </Card>
  );
};