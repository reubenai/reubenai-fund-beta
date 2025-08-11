import React, { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Upload, Download, FileSpreadsheet, CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { EnhancedCsvParsingService as CsvParsingService } from '@/services/EnhancedCsvParsingService';
import { DealPreviewTable } from './DealPreviewTable';
import { BatchAnalysisProgress } from './BatchAnalysisProgress';
import { ProcessingTimeEstimate } from './ProcessingTimeEstimate';
import { supabase } from '@/integrations/supabase/client';

interface EnhancedBatchUploadModalProps {
  open: boolean;
  onClose: () => void;
  fundId: string;
  onUploadComplete: () => void;
}

interface UploadProgress {
  step: 'parsing' | 'creating' | 'preview' | 'processing' | 'analyzing' | 'complete';
  progress: number;
  message: string;
}

interface ParseResult {
  id: string;
  dealId?: string; // Added to store created deal ID
  data: any;
  status: 'success' | 'error' | 'warning';
  message: string;
  originalRow: any;
  pitchDeckFile?: File;
  removed?: boolean;
}

interface BatchAnalysisResult {
  dealId: string;
  status: 'processing' | 'complete' | 'error';
  overallScore?: number;
  engines: {
    financial: boolean;
    productIp: boolean;
    market: boolean;
    team: boolean;
    thesis: boolean;
  };
}

export const EnhancedBatchUploadModal: React.FC<EnhancedBatchUploadModalProps> = ({
  open,
  onClose,
  fundId,
  onUploadComplete
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [parseResults, setParseResults] = useState<ParseResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState<'upload' | 'creating' | 'preview' | 'processing' | 'analysis' | 'complete'>('upload');
  const [analysisResults, setAnalysisResults] = useState<BatchAnalysisResult[]>([]);
  const { toast } = useToast();

  const downloadTemplate = () => {
    const csvContent = `Company,Founder,Founder Email,Sector,Stage,Amount,Valuation,Location,Description,Website,LinkedIn URL,Crunchbase URL,Employee Count
TechFlow AI,John Smith,john@techflow.ai,AI/ML,Series A,$5M,$25M,San Francisco,AI platform for data analysis,https://techflow.ai,https://linkedin.com/company/techflow,https://crunchbase.com/organization/techflow-ai,25
DataCorp,Sarah Johnson,sarah@datacorp.com,Analytics,Seed,$2M,$8M,New York,Business intelligence platform,https://datacorp.com,https://linkedin.com/company/datacorp,https://crunchbase.com/organization/datacorp,15
CleanTech Solutions,Michael Brown,michael@cleantech.io,CleanTech,Pre-Seed,$500K,$2M,Austin,Solar energy optimization platform,https://cleantech.io,https://linkedin.com/company/cleantech-solutions,https://crunchbase.com/organization/cleantech-solutions,8`;
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'deal-upload-template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    toast({
      title: "Template Downloaded",
      description: "CSV template has been downloaded to your computer",
    });
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    const fileName = selectedFile?.name.toLowerCase();
    const isValidFile = selectedFile && (
      selectedFile.type === 'text/csv' ||
      fileName?.endsWith('.csv') ||
      fileName?.endsWith('.xlsx') ||
      fileName?.endsWith('.xls')
    );
    
    if (isValidFile) {
      setFile(selectedFile);
      setParseResults([]);
      setCurrentStep('upload');
    } else {
      toast({
        title: "Invalid File",
        description: "Please select a CSV or Excel file (.csv, .xlsx, .xls)",
        variant: "destructive"
      });
    }
  };

  const parseFile = async () => {
    if (!file) return;

    setIsProcessing(true);
    setUploadProgress({ step: 'parsing', progress: 0, message: 'Parsing CSV file...' });

    try {
      // Step 1: Parse the file
      const results = await CsvParsingService.parseFile(file);
      setUploadProgress({ step: 'creating', progress: 30, message: 'Creating deals in database...' });
      setCurrentStep('creating');
      
      // Step 2: Create deals in database immediately (include warnings as they're processable)
      const validResults = results.filter(r => r.status === 'success' || r.status === 'warning');
      const dealIds = await CsvParsingService.saveToDatabaseBatch(validResults, fundId);
      
      // Associate deal IDs with parse results
      let dealIdIndex = 0;
      const resultsWithDealIds = results.map((result) => {
        if ((result.status === 'success' || result.status === 'warning') && dealIdIndex < dealIds.length) {
          const updatedResult = { ...result, dealId: dealIds[dealIdIndex] };
          dealIdIndex++;
          return updatedResult;
        }
        return result;
      });
      
      setParseResults(resultsWithDealIds);
      setUploadProgress({ step: 'preview', progress: 100, message: 'Deals created successfully' });
      setCurrentStep('preview');
      
      toast({
        title: "Deals Created",
        description: `Created ${dealIds.length} deals. Now you can add pitch decks.`,
      });
    } catch (error) {
      console.error('Parse error:', error);
      toast({
        title: "Process Failed",
        description: "Failed to parse file or create deals. Please check the format.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDealRemove = (dealId: string) => {
    setParseResults(prev => prev.map(result => 
      result.id === dealId ? { ...result, removed: true } : result
    ));
  };

  const handlePitchDeckUpload = (dealId: string, file: File) => {
    setParseResults(prev => prev.map(result => 
      result.id === dealId ? { ...result, pitchDeckFile: file } : result
    ));
  };

  const processDeals = async () => {
    const validDeals = parseResults.filter(r => (r.status === 'success' || r.status === 'warning') && !r.removed && r.dealId);
    
    if (validDeals.length === 0) {
      toast({
        title: "No Valid Deals",
        description: "Please ensure at least one deal is valid and not removed.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    setCurrentStep('processing');
    setUploadProgress({ step: 'processing', progress: 0, message: 'Processing pitch decks...' });

    try {
      // Step 1: Upload pitch decks (0-60%)
      const dealsWithPitchDecks = validDeals.filter(d => d.pitchDeckFile);
      
      for (let i = 0; i < dealsWithPitchDecks.length; i++) {
        const deal = dealsWithPitchDecks[i];
        setUploadProgress({ 
          step: 'processing', 
          progress: Math.round((i / dealsWithPitchDecks.length) * 60), 
          message: `Uploading pitch deck for ${deal.data.company}...` 
        });
        
        await uploadPitchDeck(deal.dealId!, deal.pitchDeckFile!, deal.data.company);
      }

      const estimatedMinutes = Math.ceil(validDeals.length * 3.5); // 3.5 minutes average per deal
      setUploadProgress({ 
        step: 'analyzing', 
        progress: 60, 
        message: `Starting comprehensive analysis (estimated ${estimatedMinutes} minutes total - ${validDeals.length} deals)...` 
      });
      setCurrentStep('analysis');

      // Step 2: Trigger comprehensive analysis (60-100%)
      const dealIds = validDeals.map(d => d.dealId!);
      const analysisPromises = dealIds.map(async (dealId, index) => {
        const result: BatchAnalysisResult = {
          dealId,
          status: 'processing',
          engines: {
            financial: false,
            productIp: false,
            market: false,
            team: false,
            thesis: false
          }
        };
        
        setAnalysisResults(prev => [...prev.filter(r => r.dealId !== dealId), result]);
        
        try {
          // Call reuben-orchestrator for comprehensive analysis
          const { data, error } = await supabase.functions.invoke('reuben-orchestrator', {
            body: { dealId }
          });

          if (!error && data?.success) {
            const updatedResult: BatchAnalysisResult = {
              ...result,
              status: 'complete',
              overallScore: data.analysis?.overallScore,
              engines: {
                financial: true,
                productIp: true,
                market: true,
                team: true,
                thesis: true
              }
            };
            
            setAnalysisResults(prev => [...prev.filter(r => r.dealId !== dealId), updatedResult]);
          } else {
            setAnalysisResults(prev => prev.map(r => 
              r.dealId === dealId ? { ...r, status: 'error' } : r
            ));
          }
        } catch (error) {
          console.error(`Analysis failed for deal ${dealId}:`, error);
          setAnalysisResults(prev => prev.map(r => 
            r.dealId === dealId ? { ...r, status: 'error' } : r
          ));
        }

        // Update progress
        const completedAnalyses = index + 1;
              const progressPercent = Math.round(60 + (completedAnalyses / dealIds.length) * 40);
        setUploadProgress({ 
          step: 'analyzing', 
          progress: progressPercent, 
          message: `Analyzing deal ${completedAnalyses}/${dealIds.length}...` 
        });
      });

      await Promise.all(analysisPromises);

      setUploadProgress({ step: 'complete', progress: 100, message: 'Batch upload complete!' });
      setCurrentStep('complete');

      toast({
        title: "Upload Complete",
        description: `${validDeals.length} deals uploaded and analyzed successfully`,
        duration: 3000,
      });

      onUploadComplete();

      // Auto-redirect to pipeline after 2 seconds
      setTimeout(() => {
        onClose();
        window.location.href = '/deals';
      }, 2000);
      
    } catch (error) {
      console.error('Process error:', error);
      toast({
        title: "Process Failed",
        description: "An error occurred during processing",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const uploadPitchDeck = async (dealId: string, file: File, companyName: string) => {
    try {
      // Clean company name for file naming
      const cleanCompanyName = companyName.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_');
      const fileExt = file.name.split('.').pop();
      const newFileName = `${cleanCompanyName}_Pitch_Deck.${fileExt}`;
      
      // Create a new file with the renamed filename
      const renamedFile = new File([file], newFileName, { type: file.type });
      
      // Upload using DocumentService
      const { documentService } = await import('@/services/DocumentService');
      
      const result = await documentService.uploadDocument({
        dealId,
        file: renamedFile,
        documentType: 'Pitch Deck',
        documentCategory: 'pitch_deck',
        tags: ['batch_upload', 'pitch_deck']
      });
      
      if (!result) {
        throw new Error('Failed to upload pitch deck');
      }
      
      // Successfully uploaded pitch deck
    } catch (error) {
      console.error(`Failed to upload pitch deck for ${companyName}:`, error);
      throw error;
    }
  };

  const resetModal = () => {
    setFile(null);
    setUploadProgress(null);
    setParseResults([]);
    setAnalysisResults([]);
    setIsProcessing(false);
    setCurrentStep('upload');
  };

  const getResultCounts = () => {
    const activeResults = parseResults.filter(r => !r.removed);
    const success = activeResults.filter(r => r.status === 'success').length;
    const processable = activeResults.filter(r => r.status === 'warning').length; // Warnings are processable
    const error = activeResults.filter(r => r.status === 'error').length;
    return { success, processable, error };
  };

  const { success, processable, error } = getResultCounts();

  return (
    <Dialog open={open} onOpenChange={(open) => !open && !isProcessing && onClose()}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Enhanced Batch Upload with ReubenAI Analysis
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Steps */}
          <div className="flex items-center gap-2 text-sm">
            <div className={`flex items-center gap-2 ${currentStep === 'upload' ? 'text-primary font-medium' : (currentStep === 'creating' || currentStep === 'preview' || currentStep === 'processing' || currentStep === 'analysis' || currentStep === 'complete') ? 'text-green-600' : 'text-muted-foreground'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${currentStep === 'upload' ? 'bg-primary text-white' : (currentStep === 'creating' || currentStep === 'preview' || currentStep === 'processing' || currentStep === 'analysis' || currentStep === 'complete') ? 'bg-green-600 text-white' : 'bg-muted text-muted-foreground'}`}>
                1
              </div>
              Parse CSV
            </div>
            <div className={`flex items-center gap-2 ${currentStep === 'creating' ? 'text-primary font-medium' : (currentStep === 'preview' || currentStep === 'processing' || currentStep === 'analysis' || currentStep === 'complete') ? 'text-green-600' : 'text-muted-foreground'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${currentStep === 'creating' ? 'bg-primary text-white' : (currentStep === 'preview' || currentStep === 'processing' || currentStep === 'analysis' || currentStep === 'complete') ? 'bg-green-600 text-white' : 'bg-muted text-muted-foreground'}`}>
                2
              </div>
              Create Deals
            </div>
            <div className={`flex items-center gap-2 ${currentStep === 'preview' ? 'text-primary font-medium' : (currentStep === 'processing' || currentStep === 'analysis' || currentStep === 'complete') ? 'text-green-600' : 'text-muted-foreground'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${currentStep === 'preview' ? 'bg-primary text-white' : (currentStep === 'processing' || currentStep === 'analysis' || currentStep === 'complete') ? 'bg-green-600 text-white' : 'bg-muted text-muted-foreground'}`}>
                3
              </div>
              Upload Pitch Decks
            </div>
            <div className={`flex items-center gap-2 ${currentStep === 'processing' ? 'text-primary font-medium' : (currentStep === 'analysis' || currentStep === 'complete') ? 'text-green-600' : 'text-muted-foreground'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${currentStep === 'processing' ? 'bg-primary text-white' : (currentStep === 'analysis' || currentStep === 'complete') ? 'bg-green-600 text-white' : 'bg-muted text-muted-foreground'}`}>
                4
              </div>
              Process Documents
            </div>
            <div className={`flex items-center gap-2 ${currentStep === 'analysis' ? 'text-primary font-medium' : currentStep === 'complete' ? 'text-green-600' : 'text-muted-foreground'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${currentStep === 'analysis' ? 'bg-primary text-white' : currentStep === 'complete' ? 'bg-green-600 text-white' : 'bg-muted text-muted-foreground'}`}>
                5
              </div>
              ReubenAI Analysis
            </div>
          </div>

          {/* Step 1: Upload */}
          {currentStep === 'upload' && (
            <>
              {/* Template Download */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-start gap-3">
                  <FileSpreadsheet className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-medium text-blue-900">Download Template</h3>
                    <p className="text-sm text-blue-700 mb-3">
                      Start with our CSV template to ensure proper formatting. You'll be able to add pitch decks for each deal in the next step.
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={downloadTemplate}
                      className="border-blue-200 text-blue-700 hover:bg-blue-100"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download Template
                    </Button>
                  </div>
                </div>
              </div>

              {/* File Upload */}
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileChange}
                    className="hidden"
                    id="csv-upload"
                    disabled={isProcessing}
                  />
                  <label 
                    htmlFor="csv-upload" 
                    className={`cursor-pointer ${isProcessing ? 'cursor-not-allowed opacity-50' : ''}`}
                  >
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">
                      {file ? file.name : 'Click to upload CSV or Excel file (.csv, .xlsx, .xls)'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Supports CSV and Excel formats with automatic field mapping
                    </p>
                  </label>
                </div>
              </div>

              {/* Parse Results Preview */}
              {parseResults.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-medium">Parse Results</h3>
                  <div className="flex gap-4">
                    {success > 0 && (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        {success} Success
                      </Badge>
                    )}
                    {processable > 0 && (
                      <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        {processable} Processable
                      </Badge>
                    )}
                    {error > 0 && (
                      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                        <XCircle className="w-3 h-3 mr-1" />
                        {error} Error
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Step 2: Creating Deals */}
          {currentStep === 'creating' && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-sm text-muted-foreground">Creating deals in database...</p>
              {uploadProgress && (
                <div className="mt-4">
                  <Progress value={uploadProgress.progress} className="w-full" />
                  <p className="text-xs text-muted-foreground mt-2">{uploadProgress.message}</p>
                </div>
              )}
            </div>
          )}

           {/* Step 3: Deal Preview */}
           {currentStep === 'preview' && (
             <>
               <ProcessingTimeEstimate 
                 dealCount={success + processable}
                 currentStep="preview"
               />
               <DealPreviewTable
                 deals={parseResults}
                 onDealRemove={handleDealRemove}
                 onPitchDeckUpload={handlePitchDeckUpload}
               />
             </>
           )}

          {/* Step 3 & 4: Processing and Analysis */}
          {(currentStep === 'processing' || currentStep === 'analysis') && (
            <>
              {/* Upload Progress */}
              {uploadProgress && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">Processing Progress</span>
                    <span>{uploadProgress.progress}%</span>
                  </div>
                  <Progress value={uploadProgress.progress} className="h-2" />
                  <p className="text-sm text-gray-600">{uploadProgress.message}</p>
                </div>
              )}

              {/* Analysis Progress */}
              {currentStep === 'analysis' && (
                <BatchAnalysisProgress results={analysisResults} />
              )}
            </>
          )}

          {/* Step 6: Complete */}
          {currentStep === 'complete' && (
            <div className="text-center py-8">
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Upload Complete!</h3>
              <p className="text-muted-foreground mb-4">
                All deals have been uploaded and analyzed successfully.
              </p>
              <div className="flex gap-4 justify-center">
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  {success} Deals Created
                </Badge>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  {parseResults.filter(r => r.pitchDeckFile && !r.removed).length} Pitch Decks
                </Badge>
                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                  {analysisResults.filter(r => r.status === 'complete').length} Analyzed
                </Badge>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button 
              variant="outline" 
              onClick={() => {
                if (currentStep === 'complete') {
                  onClose();
                  resetModal();
                } else if (!isProcessing) {
                  onClose();
                }
              }}
              disabled={isProcessing && currentStep !== 'complete'}
            >
              {currentStep === 'complete' ? 'Close' : isProcessing ? 'Processing...' : 'Cancel'}
            </Button>
            
            {currentStep === 'upload' && (
              <Button 
                onClick={parseFile}
                disabled={!file || isProcessing}
              >
                {isProcessing ? 'Parsing...' : 'Parse File'}
              </Button>
            )}
            
            {currentStep === 'preview' && (
              <Button 
                onClick={processDeals}
                disabled={(success + processable) === 0 || isProcessing}
              >
                Process {success + processable} Deals
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};