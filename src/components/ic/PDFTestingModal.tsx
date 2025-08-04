import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  FileText, 
  Download, 
  Send, 
  AlertTriangle, 
  CheckCircle, 
  Settings, 
  TestTube 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export function PDFTestingModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);
  const [dealId, setDealId] = useState('');
  const [fundId, setFundId] = useState('');
  const { toast } = useToast();

  const handleTestPDFExport = async () => {
    if (!dealId || !fundId) {
      toast({
        title: "Missing Information",
        description: "Please provide both Deal ID and Fund ID",
        variant: "destructive"
      });
      return;
    }

    setIsTesting(true);
    setTestResults(null);

    const startTime = performance.now();

    try {
      // Test the enhanced-pdf-generator function
      const { data, error } = await supabase.functions.invoke('enhanced-pdf-generator', {
        body: { 
          dealId: dealId,
          fundId: fundId,
          memoContent: {
            executive_summary: "Test executive summary for PDF generation validation",
            investment_recommendation: "This is a test memo to validate PDF export functionality"
          },
          dealData: {
            company_name: "Test Company",
            industry: "Technology",
            deal_size: 1000000,
            valuation: 5000000
          }
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
          title: "PDF Export Test Failed",
          description: `Error: ${error.message || 'Unknown error'}`,
          variant: "destructive"
        });
      } else {
        setTestResults({
          success: true,
          data: data,
          duration: duration,
          timestamp: new Date().toISOString(),
          pdfGenerated: !!data?.pdfUrl,
          fileSize: data?.metadata?.pages || 'Unknown'
        });
        
        toast({
          title: "PDF Export Test Successful",
          description: `Generated in ${duration}ms${data?.pdfUrl ? ' - PDF ready for download' : ''}`,
        });

        // If PDF was generated, offer download
        if (data?.success && data?.pdfUrl) {
          const link = document.createElement('a');
          link.href = data.pdfUrl;
          link.download = data.fileName || `Test_PDF_${new Date().toISOString().split('T')[0]}.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
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
        title: "PDF Export Test Failed",
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
      return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />Failed</Badge>;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <TestTube className="h-4 w-4" />
          Test PDF Export
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            PDF Export Testing & Validation
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Test Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Test Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="dealId">Deal ID</Label>
                <Input
                  id="dealId"
                  placeholder="Enter deal ID to test with..."
                  value={dealId}
                  onChange={(e) => setDealId(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="fundId">Fund ID</Label>
                <Input
                  id="fundId"
                  placeholder="Enter fund ID to test with..."
                  value={fundId}
                  onChange={(e) => setFundId(e.target.value)}
                />
              </div>
              
              <Button
                onClick={handleTestPDFExport}
                disabled={isTesting || !dealId || !fundId}
                className="w-full gap-2"
              >
                {isTesting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Testing PDF Export...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Run PDF Export Test
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
                    <CheckCircle className="h-4 w-4" />
                    Test Results
                  </span>
                  {getResultBadge()}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
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
                  {testResults.pdfGenerated && (
                    <div>
                      <span className="font-medium">PDF Generated:</span>
                      <span className="ml-2 text-green-600">Yes</span>
                    </div>
                  )}
                  {testResults.fileSize && (
                    <div>
                      <span className="font-medium">Pages:</span>
                      <span className="ml-2">{testResults.fileSize}</span>
                    </div>
                  )}
                </div>
                
                {testResults.error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-700 font-medium">Error Details:</p>
                    <p className="text-sm text-red-600 mt-1">{testResults.error}</p>
                  </div>
                )}
                
                {testResults.success && testResults.data && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-sm text-green-700 font-medium">Success Details:</p>
                    <pre className="text-xs text-green-600 mt-1 overflow-auto max-h-32">
                      {JSON.stringify(testResults.data, null, 2)}
                    </pre>
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
            {testResults?.success && testResults?.data?.pdfUrl && (
              <Button 
                variant="outline" 
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = testResults.data.pdfUrl;
                  link.download = testResults.data.fileName || 'test-export.pdf';
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Download PDF
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}