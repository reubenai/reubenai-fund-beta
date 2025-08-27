import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useLinkedInProfileEnrichment } from '@/hooks/useLinkedInProfileEnrichment';

export const BrightdataTestPanel = () => {
  const [companyName, setCompanyName] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [crunchbaseUrl, setCrunchbaseUrl] = useState('');
  const [founderFirstName, setFounderFirstName] = useState('');
  const [founderLastName, setFounderLastName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [isCrunchbaseLoading, setIsCrunchbaseLoading] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [profileTestResult, setProfileTestResult] = useState<any>(null);
  const [crunchbaseTestResult, setCrunchbaseTestResult] = useState<any>(null);
  const [coresignalComparison, setCoresignalComparison] = useState<any>(null);
  const [processingStatus, setProcessingStatus] = useState<any>(null);
  const [showStatusMonitor, setShowStatusMonitor] = useState(false);
  const { toast } = useToast();
  const { triggerProfileEnrichment } = useLinkedInProfileEnrichment();

  const triggerCompletionService = async () => {
    try {
      console.log('🔧 Triggering LinkedIn completion service...');
      const { data, error } = await supabase.functions.invoke('linkedin-completion-service');
      
      if (error) {
        toast({
          title: "Completion Service Failed",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Completion Service Success",
          description: `Updated ${data.statistics?.updatedExports || 0} exports, vectorized ${data.statistics?.vectorizedExports || 0}`,
        });
      }
    } catch (error: any) {
      toast({
        title: "Service Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const checkProcessingStatus = async (dealId: string) => {
    try {
      const { data, error } = await supabase.rpc('get_linkedin_processing_status', {
        target_deal_id: dealId
      });
      
      if (error) {
        console.error('Status check error:', error);
      } else {
        setProcessingStatus(data);
      }
    } catch (error) {
      console.error('Status check exception:', error);
    }
  };

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
    setShowStatusMonitor(false);

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

  const testProfileEnrichment = async () => {
    if (!founderFirstName || !founderLastName) {
      toast({
        title: "Missing Information",
        description: "Please provide both first and last name",
        variant: "destructive"
      });
      return;
    }

    setIsProfileLoading(true);
    setProfileTestResult(null);

    try {
      console.log('Testing LinkedIn Profile Enrichment...');
      const { data: profileData, error: profileError } = await supabase.functions.invoke(
        'brightdata-linkedin-profile-enrichment',
        {
          body: {
            dealId: 'test-profile-' + Date.now(),
            firstName: founderFirstName,
            lastName: founderLastName
          }
        }
      );

      if (profileError) {
        throw new Error(`Profile Enrichment Error: ${profileError.message}`);
      }

      setProfileTestResult(profileData);

      toast({
        title: "Profile Test Completed",
        description: "LinkedIn Profile enrichment API tested successfully",
      });

    } catch (error: any) {
      console.error('Profile test error:', error);
      toast({
        title: "Profile Test Failed", 
        description: error.message,
        variant: "destructive"
      });
      setProfileTestResult({ error: error.message });
    } finally {
      setIsProfileLoading(false);
    }
  };

  const testCrunchbaseEnrichment = async () => {
    if (!companyName || !crunchbaseUrl) {
      toast({
        title: "Missing Information",
        description: "Please provide both company name and Crunchbase URL",
        variant: "destructive"
      });
      return;
    }

    setIsCrunchbaseLoading(true);
    setCrunchbaseTestResult(null);

    try {
      console.log('Testing Crunchbase Enrichment...');
      const { data: crunchbaseData, error: crunchbaseError } = await supabase.functions.invoke(
        'company-enrichment-engine',
        {
          body: {
            dealId: 'test-crunchbase-' + Date.now(),
            companyName,
            crunchbaseUrl
          }
        }
      );

      if (crunchbaseError) {
        throw new Error(`Crunchbase Enrichment Error: ${crunchbaseError.message}`);
      }

      setCrunchbaseTestResult(crunchbaseData);

      toast({
        title: "Crunchbase Test Completed",
        description: "Crunchbase enrichment API tested successfully",
      });

    } catch (error: any) {
      console.error('Crunchbase test error:', error);
      toast({
        title: "Crunchbase Test Failed", 
        description: error.message,
        variant: "destructive"
      });
      setCrunchbaseTestResult({ error: error.message });
    } finally {
      setIsCrunchbaseLoading(false);
    }
  };

  const resetTestPanel = () => {
    setTestResult(null);
    setProfileTestResult(null);
    setCrunchbaseTestResult(null);
    setCoresignalComparison(null);
    setProcessingStatus(null);
    setShowStatusMonitor(false);
    setCompanyName('');
    setLinkedinUrl('');
    setCrunchbaseUrl('');
    setFounderFirstName('');
    setFounderLastName('');
    
    toast({
      title: "Panel Reset",
      description: "Test panel has been reset to initial state",
    });
  };

  const getSourceBadgeColor = (source: string) => {
    switch (source) {
      case 'brightdata':
      case 'brightdata_linkedin':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'brightdata_crunchbase':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
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
          Test Brightdata LinkedIn, Crunchbase, and profile enrichment APIs
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Company Enrichment Section */}
        <div className="space-y-4 border rounded-lg p-4">
          <h3 className="text-lg font-semibold">🏢 Company Enrichment Test</h3>
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
            {isLoading ? 'Testing Company APIs...' : 'Test Company Enrichment'}
          </Button>
        </div>

        {/* Crunchbase Enrichment Section */}
        <div className="space-y-4 border rounded-lg p-4">
          <h3 className="text-lg font-semibold">🏢 Crunchbase Enrichment Test</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="crunchbaseCompanyName">Company Name</Label>
              <Input
                id="crunchbaseCompanyName"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. OpenAI"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="crunchbaseUrl">Crunchbase URL</Label>
              <Input
                id="crunchbaseUrl"
                value={crunchbaseUrl}
                onChange={(e) => setCrunchbaseUrl(e.target.value)}
                placeholder="https://www.crunchbase.com/organization/openai"
              />
            </div>
          </div>
          <Button 
            onClick={testCrunchbaseEnrichment}
            disabled={isCrunchbaseLoading}
            className="w-full"
          >
            {isCrunchbaseLoading ? 'Testing Crunchbase API...' : 'Test Crunchbase Enrichment'}
          </Button>
        </div>

        {/* Profile Enrichment Section */}
        <div className="space-y-4 border rounded-lg p-4">
          <h3 className="text-lg font-semibold">👤 Profile Enrichment Test</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="founderFirstName">Founder First Name</Label>
              <Input
                id="founderFirstName"
                value={founderFirstName}
                onChange={(e) => setFounderFirstName(e.target.value)}
                placeholder="e.g. John"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="founderLastName">Founder Last Name</Label>
              <Input
                id="founderLastName"
                value={founderLastName}
                onChange={(e) => setFounderLastName(e.target.value)}
                placeholder="e.g. Smith"
              />
            </div>
          </div>
          <Button 
            onClick={testProfileEnrichment}
            disabled={isProfileLoading}
            className="w-full"
          >
            {isProfileLoading ? 'Testing Profile API...' : 'Test Profile Enrichment'}
          </Button>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button 
            onClick={triggerCompletionService}
            variant="outline"
            disabled={isLoading || isProfileLoading || isCrunchbaseLoading}
          >
            🔧 Complete Stuck Processes
          </Button>
          
          <Button 
            onClick={resetTestPanel}
            variant="secondary"
            disabled={isLoading || isProfileLoading || isCrunchbaseLoading}
          >
            🔄 Reset Panel
          </Button>
          
          <Button 
            onClick={() => {
              setShowStatusMonitor(!showStatusMonitor);
              if (!showStatusMonitor) {
                checkProcessingStatus('12c156e3-2029-48c7-8b2f-144b8030ceee'); // Ecosystem Test deal ID
              }
            }}
            variant="outline"
            size="sm"
          >
            {showStatusMonitor ? '📊 Hide Status' : '📊 Show Status'}
          </Button>
        </div>

        {/* Status Monitor */}
        {showStatusMonitor && processingStatus && (
          <div className="space-y-3 p-4 bg-muted rounded-lg">
            <h3 className="font-semibold">🔍 Processing Status Monitor</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium">LinkedIn Export Status</h4>
                {processingStatus.linkedin_export ? (
                  <div className="text-sm space-y-1">
                    <div>Status: <Badge variant="outline">{processingStatus.linkedin_export.status}</Badge></div>
                    <div>Company: {processingStatus.linkedin_export.company_name}</div>
                    <div>Has Data: {processingStatus.linkedin_export.has_data ? '✅ Yes' : '❌ No'}</div>
                    <div>Created: {new Date(processingStatus.linkedin_export.created_at).toLocaleString()}</div>
                    {processingStatus.linkedin_export.processed_at && (
                      <div>Processed: {new Date(processingStatus.linkedin_export.processed_at).toLocaleString()}</div>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">No LinkedIn export found</div>
                )}
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">Queue Status</h4>
                {processingStatus.queue_item ? (
                  <div className="text-sm space-y-1">
                    <div>Status: <Badge variant="outline">{processingStatus.queue_item.status}</Badge></div>
                    <div>Trigger: {processingStatus.queue_item.trigger_reason}</div>
                    <div>Age: {Math.round(processingStatus.queue_item.minutes_old)} minutes</div>
                    <div>Created: {new Date(processingStatus.queue_item.created_at).toLocaleString()}</div>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">No queue item found</div>
                )}
              </div>
            </div>
            
            <div className="pt-2">
              <div className="flex items-center gap-2">
                <span className="font-medium">Overall Status:</span>
                <Badge className={
                  processingStatus.overall_status === 'completed' ? 'bg-green-100 text-green-800' :
                  processingStatus.overall_status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-blue-100 text-blue-800'
                }>
                  {processingStatus.overall_status}
                </Badge>
              </div>
            </div>
          </div>
        )}

        {/* Company Enrichment Results */}
        {testResult && (
          <div className="space-y-4">
            <Separator />
            
            {testResult.error ? (
              <Alert variant="destructive">
                <AlertDescription>
                  <strong>Company Enrichment Error:</strong> {testResult.error}
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-6">
                {/* Brightdata Results */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold">🏢 Company: Brightdata Results</h3>
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
                      <div><strong>Company:</strong> {testResult.data.company_name || 'N/A'}</div>
                      <div><strong>Employees:</strong> {testResult.data.employee_count || 'N/A'}</div>
                      <div><strong>Industry:</strong> {testResult.data.industry || 'N/A'}</div>
                      <div><strong>Location:</strong> {testResult.data.location || 'N/A'}</div>
                      <div><strong>Revenue Est:</strong> {testResult.data.revenue_estimate ? `$${(testResult.data.revenue_estimate / 1000000).toFixed(1)}M` : 'N/A'}</div>
                      <div><strong>LinkedIn Followers:</strong> {testResult.data.linkedin_followers || 'N/A'}</div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Crunchbase Enrichment Results */}
        {crunchbaseTestResult && (
          <div className="space-y-4">
            <Separator />
            
            {crunchbaseTestResult.error ? (
              <Alert variant="destructive">
                <AlertDescription>
                  <strong>Crunchbase Enrichment Error:</strong> {crunchbaseTestResult.error}
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold">🏢 Crunchbase: Brightdata Results</h3>
                    <Badge className={getSourceBadgeColor(crunchbaseTestResult.dataSource)}>
                      {crunchbaseTestResult.dataSource}
                    </Badge>
                    <Badge variant="outline">
                      Trust: {crunchbaseTestResult.trustScore}/100
                    </Badge>
                    <Badge variant="outline">
                      Quality: {crunchbaseTestResult.dataQuality || 'N/A'}/100
                    </Badge>
                  </div>

                  {crunchbaseTestResult.data && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
                      <div><strong>Company:</strong> {crunchbaseTestResult.data.company_name || 'N/A'}</div>
                      <div><strong>Employees:</strong> {crunchbaseTestResult.data.employee_count || 'N/A'}</div>
                      <div><strong>Industry:</strong> {crunchbaseTestResult.data.industry || 'N/A'}</div>
                      <div><strong>Location:</strong> {crunchbaseTestResult.data.location || 'N/A'}</div>
                      <div><strong>Revenue Est:</strong> {crunchbaseTestResult.data.revenue_estimate ? `$${(crunchbaseTestResult.data.revenue_estimate / 1000000).toFixed(1)}M` : 'N/A'}</div>
                      <div><strong>Funding Rounds:</strong> {crunchbaseTestResult.data.funding_rounds || 'N/A'}</div>
                      <div><strong>Investors:</strong> {crunchbaseTestResult.data.num_investors || 'N/A'}</div>
                      <div><strong>Monthly Visits:</strong> {crunchbaseTestResult.data.monthly_visits || 'N/A'}</div>
                      <div><strong>CB Rank:</strong> {crunchbaseTestResult.data.cb_rank || 'N/A'}</div>
                    </div>
                  )}
                </div>

                {/* Raw Response Data */}
                <details className="space-y-2">
                  <summary className="cursor-pointer font-medium">View Raw Crunchbase API Response</summary>
                  <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-60">
                    {JSON.stringify(crunchbaseTestResult, null, 2)}
                  </pre>
                </details>
              </div>
            )}
          </div>
        )}

        {/* Profile Enrichment Results */}
        {profileTestResult && (
          <div className="space-y-4">
            <Separator />
            
            {profileTestResult.error ? (
              <Alert variant="destructive">
                <AlertDescription>
                  <strong>Profile Enrichment Error:</strong> {profileTestResult.error}
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold">👤 Profile: Brightdata Results</h3>
                    <Badge className={getSourceBadgeColor(profileTestResult.dataSource)}>
                      {profileTestResult.dataSource}
                    </Badge>
                    <Badge variant="outline">
                      Trust: {profileTestResult.trustScore}/100
                    </Badge>
                    <Badge variant="outline">
                      Quality: {profileTestResult.dataQuality || 'N/A'}/100
                    </Badge>
                  </div>

                  {profileTestResult.data && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
                      <div><strong>Name:</strong> {profileTestResult.data.name || 'N/A'}</div>
                      <div><strong>Position:</strong> {profileTestResult.data.position || 'N/A'}</div>
                      <div><strong>Company:</strong> {profileTestResult.data.current_company || 'N/A'}</div>
                      <div><strong>Followers:</strong> {profileTestResult.data.followers || 'N/A'}</div>
                      <div><strong>Connections:</strong> {profileTestResult.data.connections || 'N/A'}</div>
                      <div><strong>Activity Level:</strong> {profileTestResult.data.activity_level || 'N/A'}</div>
                    </div>
                  )}
                </div>

                {/* Raw Response Data */}
                <details className="space-y-2">
                  <summary className="cursor-pointer font-medium">View Raw Profile API Response</summary>
                  <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-60">
                    {JSON.stringify(profileTestResult, null, 2)}
                  </pre>
                </details>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};