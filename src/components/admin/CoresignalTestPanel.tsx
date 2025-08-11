
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, Search, Users, Building } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function CoresignalTestPanel() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [companyName, setCompanyName] = useState('MUEV');
  const [linkedinUrl, setLinkedinUrl] = useState('https://www.linkedin.com/company/muevbrands/');

  const testCoresignalEnrichment = async () => {
    setIsLoading(true);
    setTestResult(null);

    try {
      console.log('Testing Coresignal enrichment...');
      
      const { data, error } = await supabase.functions.invoke('company-enrichment-engine', {
        body: {
          dealId: 'test-deal-id',
          companyName,
          linkedinUrl: linkedinUrl || undefined,
          website: 'https://muevbrands.com'
        }
      });

      if (error) throw error;

      setTestResult(data);
      
      toast({
        title: "Coresignal Test Complete",
        description: `Successfully tested enrichment for ${companyName}`,
        variant: "default"
      });

    } catch (error) {
      console.error('Coresignal test failed:', error);
      
      setTestResult({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
      
      toast({
        title: "Coresignal Test Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getSourceBadgeColor = (source: string) => {
    if (source?.includes('coresignal_api')) return 'bg-green-100 text-green-800';
    if (source?.includes('google')) return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building className="h-5 w-5" />
          Coresignal API Test
        </CardTitle>
        <CardDescription>
          Test the Coresignal company enrichment integration
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Company Name</label>
            <Input
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Enter company name"
            />
          </div>
          <div>
            <label className="text-sm font-medium">LinkedIn URL (Optional)</label>
            <Input
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
              placeholder="https://www.linkedin.com/company/..."
            />
          </div>
        </div>

        <Button 
          onClick={testCoresignalEnrichment}
          disabled={isLoading || !companyName}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Search className="h-4 w-4 mr-2 animate-spin" />
              Testing Enrichment...
            </>
          ) : (
            <>
              <Search className="h-4 w-4 mr-2" />
              Test Coresignal Enrichment
            </>
          )}
        </Button>

        {testResult && (
          <div className="space-y-4">
            <Alert>
              <div className="flex items-center gap-2">
                {testResult.success ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600" />
                )}
                <AlertDescription>
                  {testResult.success ? 'Enrichment successful!' : `Error: ${testResult.error}`}
                </AlertDescription>
              </div>
            </Alert>

            {testResult.success && testResult.data?.enrichment_data && (
              <div className="bg-muted p-4 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Enrichment Results</h4>
                  <Badge className={getSourceBadgeColor(testResult.data.enrichment_data.source)}>
                    {testResult.data.enrichment_data.source || 'Unknown Source'}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Trust Score</div>
                    <div className="font-semibold">{testResult.data.enrichment_data.trustScore}%</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Data Quality</div>
                    <div className="font-semibold">{testResult.data.enrichment_data.dataQuality}%</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Employee Count</div>
                    <div className="font-semibold flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {testResult.data.enrichment_data.employeeCount || 'N/A'}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Revenue Estimate</div>
                    <div className="font-semibold">
                      {testResult.data.enrichment_data.revenueEstimate 
                        ? `$${(testResult.data.enrichment_data.revenueEstimate / 1000000).toFixed(1)}M` 
                        : 'N/A'}
                    </div>
                  </div>
                </div>

                {testResult.data.enrichment_data.keyPersonnel?.length > 0 && (
                  <div>
                    <div className="text-sm text-muted-foreground mb-2">Key Personnel</div>
                    <div className="space-y-1">
                      {testResult.data.enrichment_data.keyPersonnel.slice(0, 3).map((person: any, index: number) => (
                        <div key={index} className="text-sm">
                          <span className="font-medium">{person.name}</span>
                          {person.title && <span className="text-muted-foreground"> - {person.title}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {testResult.data.enrichment_data.companyId && (
                  <div>
                    <div className="text-sm text-muted-foreground">Coresignal Company ID</div>
                    <div className="font-mono text-xs">{testResult.data.enrichment_data.companyId}</div>
                  </div>
                )}
              </div>
            )}

            <details className="border rounded p-2">
              <summary className="cursor-pointer text-sm font-medium">View Raw Response</summary>
              <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto">
                {JSON.stringify(testResult, null, 2)}
              </pre>
            </details>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
