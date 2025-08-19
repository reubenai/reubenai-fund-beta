import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const BrightdataTestPanel = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [companyName, setCompanyName] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [coresignalComparison, setCoresignalComparison] = useState<any>(null);
  const { toast } = useToast();

  const testBrightdataEnrichment = async () => {
    if (!companyName || !linkedinUrl) {
      toast({
        title: "Missing Information",
        description: "Please provide both company name and LinkedIn URL",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    setTestResult(null);
    setCoresignalComparison(null);

    try {
      // Test Brightdata
      console.log('Testing Brightdata API...');
      const { data: brightdataData, error: brightdataError } = await supabase.functions.invoke(
        'brightdata-linkedin-enrichment',
        {
          body: {
            dealId: 'test-' + Date.now(),
            companyName,
            linkedinUrl
          }
        }
      );

      if (brightdataError) {
        throw new Error(`Brightdata Error: ${brightdataError.message}`);
      }

      // Test Coresignal for comparison
      console.log('Testing Coresignal API for comparison...');
      const { data: coresignalData, error: coresignalError } = await supabase.functions.invoke(
        'company-enrichment-engine',
        {
          body: {
            dealId: 'test-' + Date.now(),
            companyName,
            linkedinUrl
          }
        }
      );

      setTestResult(brightdataData);
      setCoresignalComparison(coresignalData);

      toast({
        title: "API Test Completed",
        description: "Brightdata and Coresignal APIs tested successfully",
      });

    } catch (error: any) {
      console.error('Test error:', error);
      toast({
        title: "Test Failed",
        description: error.message,
        variant: "destructive"
      });
      setTestResult({ error: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const getSourceBadgeColor = (source: string) => {
    switch (source) {
      case 'brightdata':
      case 'brightdata_linkedin':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'coresignal_api':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'google_custom_search':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🌟 Brightdata API Test Panel
        </CardTitle>
        <CardDescription>
          Test Brightdata LinkedIn enrichment with Coresignal comparison (Option B: Brightdata Primary)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="companyName">Company Name</Label>
            <Input
              id="companyName"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="e.g. Stalkit"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="linkedinUrl">LinkedIn Company URL</Label>
            <Input
              id="linkedinUrl"
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
              placeholder="https://www.linkedin.com/company/stalkit"
            />
          </div>
        </div>
        
        <Button 
          onClick={testBrightdataEnrichment}
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? 'Testing APIs...' : 'Test Brightdata vs Coresignal'}
        </Button>

        {testResult && (
          <div className="space-y-4">
            <Separator />
            
            {testResult.error ? (
              <Alert variant="destructive">
                <AlertDescription>
                  <strong>Error:</strong> {testResult.error}
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-6">
                {/* Brightdata Results */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold">🌟 Brightdata Results</h3>
                    <Badge className={getSourceBadgeColor(testResult.dataSource)}>
                      {testResult.dataSource}
                    </Badge>
                    <Badge variant="outline">
                      Trust: {testResult.trustScore}/100
                    </Badge>
                    <Badge variant="outline">
                      Quality: {testResult.dataQuality || 'N/A'}/100
                    </Badge>
                  </div>

                  {testResult.data && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
                      <div>
                        <strong>Company:</strong> {testResult.data.company_name || 'N/A'}
                      </div>
                      <div>
                        <strong>Employees:</strong> {testResult.data.employee_count || 'N/A'}
                      </div>
                      <div>
                        <strong>Industry:</strong> {testResult.data.industry || 'N/A'}
                      </div>
                      <div>
                        <strong>Location:</strong> {testResult.data.location || 'N/A'}
                      </div>
                      <div>
                        <strong>Revenue Est:</strong> {testResult.data.revenue_estimate ? `$${(testResult.data.revenue_estimate / 1000000).toFixed(1)}M` : 'N/A'}
                      </div>
                      <div>
                        <strong>LinkedIn Followers:</strong> {testResult.data.linkedin_followers || 'N/A'}
                      </div>
                    </div>
                  )}
                </div>

                {/* Coresignal Comparison */}
                {coresignalComparison && !coresignalComparison.error && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold">📊 Coresignal Comparison</h3>
                      <Badge className={getSourceBadgeColor(coresignalComparison.data?.enrichment_data?.source)}>
                        {coresignalComparison.data?.enrichment_data?.source || 'unknown'}
                      </Badge>
                      <Badge variant="outline">
                        Trust: {coresignalComparison.data?.enrichment_data?.trustScore || 'N/A'}/100
                      </Badge>
                      <Badge variant="outline">
                        Quality: {coresignalComparison.data?.enrichment_data?.dataQuality || 'N/A'}/100
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
                      <div>
                        <strong>Employees:</strong> {coresignalComparison.data?.enrichment_data?.employeeCount || 'N/A'}
                      </div>
                      <div>
                        <strong>Revenue Est:</strong> {coresignalComparison.data?.enrichment_data?.revenueEstimate ? `$${(coresignalComparison.data.enrichment_data.revenueEstimate / 1000000).toFixed(1)}M` : 'N/A'}
                      </div>
                      <div>
                        <strong>Key Personnel:</strong> {coresignalComparison.data?.enrichment_data?.keyPersonnel?.length || 0} found
                      </div>
                    </div>
                  </div>
                )}

                {/* Data Quality Comparison */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold">📈 Data Quality Analysis</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium text-blue-600">Brightdata Advantages</h4>
                      <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                        <li>• Direct LinkedIn API access</li>
                        <li>• Higher trust score (95 vs {coresignalComparison?.data?.enrichment_data?.trustScore || 'N/A'})</li>
                        <li>• LinkedIn-specific data (followers, updates)</li>
                        <li>• More comprehensive company profiles</li>
                      </ul>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium text-green-600">Coresignal Advantages</h4>
                      <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                        <li>• Detailed employee data</li>
                        <li>• Individual LinkedIn profiles</li>
                        <li>• Historical tracking</li>
                        <li>• Proven reliability</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Raw Response Data */}
                <details className="space-y-2">
                  <summary className="cursor-pointer font-medium">View Raw API Responses</summary>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium">Brightdata Response:</h4>
                      <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-60">
                        {JSON.stringify(testResult, null, 2)}
                      </pre>
                    </div>
                    {coresignalComparison && (
                      <div>
                        <h4 className="font-medium">Coresignal Response:</h4>
                        <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-60">
                          {JSON.stringify(coresignalComparison, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};