import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  AlertTriangle, 
  Loader2, 
  Search, 
  TestTube, 
  CheckCircle,
  XCircle,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export function DealSourcingTestModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('AI startups Series A');
  const [fundId, setFundId] = useState('');
  const [maxResults, setMaxResults] = useState(5);
  const { toast } = useToast();

  const handleTestDealSourcing = async () => {
    if (!fundId || !searchQuery.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide both Fund ID and search query",
        variant: "destructive"
      });
      return;
    }

    setIsTesting(true);
    setTestResults(null);

    const startTime = performance.now();

    try {
      // Test the enhanced-deal-sourcing function
      const { data, error } = await supabase.functions.invoke('enhanced-deal-sourcing', {
        body: { 
          fundId: fundId,
          searchCriteria: {
            query: searchQuery,
            maxResults: maxResults,
            industries: ['Technology', 'AI', 'Software'],
            stages: ['Series A', 'Series B', 'Seed'],
            regions: ['North America', 'Europe']
          },
          testMode: true // Add test flag
        }
      });

      const endTime = performance.now();
      const duration = Math.round(endTime - startTime);

      if (error) {
        setTestResults({
          success: false,
          error: error.message || 'Unknown error occurred',
          duration: duration,
          timestamp: new Date().toISOString()
        });
        toast({
          title: "Deal Sourcing Test Failed",
          description: `Error: ${error.message || 'Unknown error'}`,
          variant: "destructive"
        });
      } else {
        setTestResults({
          success: true,
          data: data,
          duration: duration,
          timestamp: new Date().toISOString(),
          dealsFound: data?.deals?.length || 0,
          sourcesUsed: data?.sources || []
        });
        
        toast({
          title: "Deal Sourcing Test Successful",
          description: `Found ${data?.deals?.length || 0} deals in ${duration}ms`,
        });
      }
    } catch (error) {
      const endTime = performance.now();
      const duration = Math.round(endTime - startTime);
      
      setTestResults({
        success: false,
        error: error instanceof Error ? error.message : 'Network or execution error',
        duration: duration,
        timestamp: new Date().toISOString()
      });
      
      toast({
        title: "Deal Sourcing Test Failed",
        description: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    } finally {
      setIsTesting(false);
    }
  };

  const getResultBadge = () => {
    if (!testResults) return null;
    
    if (testResults.success) {
      return <Badge className="bg-green-100 text-green-700"><CheckCircle className="h-3 w-3 mr-1" />Success</Badge>;
    } else {
      return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <TestTube className="h-4 w-4" />
          Test Deal Sourcing
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Deal Sourcing Pipeline Testing
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Test Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <TestTube className="h-4 w-4" />
                Test Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="fundId">Fund ID</Label>
                <Input
                  id="fundId"
                  placeholder="Enter fund ID to test with..."
                  value={fundId}
                  onChange={(e) => setFundId(e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="searchQuery">Search Query</Label>
                <Textarea
                  id="searchQuery"
                  placeholder="Enter search criteria (e.g., 'AI startups Series A funding')"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  rows={2}
                />
              </div>
              
              <div>
                <Label htmlFor="maxResults">Max Results</Label>
                <Select value={maxResults.toString()} onValueChange={(value) => setMaxResults(parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 results</SelectItem>
                    <SelectItem value="5">5 results</SelectItem>
                    <SelectItem value="10">10 results</SelectItem>
                    <SelectItem value="20">20 results</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button
                onClick={handleTestDealSourcing}
                disabled={isTesting || !fundId || !searchQuery.trim()}
                className="w-full gap-2"
              >
                {isTesting ? (
                  <>
                    <Loader2 className="animate-spin rounded-full h-4 w-4" />
                    Testing Deal Sourcing...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4" />
                    Run Deal Sourcing Test
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Test Results */}
          {testResults && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Sourcing Results
                  </span>
                  {getResultBadge()}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Status:</span>
                    <span className={`ml-2 ${testResults.success ? 'text-green-600' : 'text-red-600'}`}>
                      {testResults.success ? 'Success' : 'Failed'}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Duration:</span>
                    <span className="ml-2">{testResults.duration}ms</span>
                  </div>
                  {testResults.dealsFound !== undefined && (
                    <div>
                      <span className="font-medium">Deals Found:</span>
                      <span className="ml-2 text-blue-600">{testResults.dealsFound}</span>
                    </div>
                  )}
                  {testResults.sourcesUsed && (
                    <div>
                      <span className="font-medium">Sources Used:</span>
                      <span className="ml-2">{testResults.sourcesUsed.length}</span>
                    </div>
                  )}
                </div>
                
                {testResults.error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-red-500 mt-0.5" />
                      <div>
                        <p className="text-sm text-red-700 font-medium">Error Details:</p>
                        <p className="text-sm text-red-600 mt-1">{testResults.error}</p>
                      </div>
                    </div>
                  </div>
                )}
                
                {testResults.success && testResults.data && (
                  <div className="space-y-3">
                    {testResults.data.deals && testResults.data.deals.length > 0 && (
                      <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                        <p className="text-sm text-green-700 font-medium mb-2">Deals Found:</p>
                        <div className="space-y-2">
                          {testResults.data.deals.slice(0, 3).map((deal: any, index: number) => (
                            <div key={index} className="text-xs p-2 bg-white rounded border">
                              <div className="font-medium">{deal.company_name || deal.name}</div>
                              <div className="text-muted-foreground">{deal.description || deal.industry}</div>
                            </div>
                          ))}
                          {testResults.data.deals.length > 3 && (
                            <div className="text-xs text-green-600">
                              ...and {testResults.data.deals.length - 3} more deals
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {testResults.sourcesUsed && testResults.sourcesUsed.length > 0 && (
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                        <p className="text-sm text-blue-700 font-medium mb-1">Sources Used:</p>
                        <div className="text-xs text-blue-600">
                          {testResults.sourcesUsed.join(', ')}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                <div className="text-xs text-muted-foreground">
                  Test completed at: {new Date(testResults.timestamp).toLocaleString()}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}