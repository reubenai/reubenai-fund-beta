
import React, { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Upload, Download, CheckCircle, AlertCircle, XCircle, FileSpreadsheet } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { CsvParsingService } from '@/services/CsvParsingService';
import { EnhancedBatchUploadModal } from './EnhancedBatchUploadModal';
import SimpleErrorBoundary from '@/components/common/SimpleErrorBoundary';

interface BatchUploadModalProps {
  open: boolean;
  onClose: () => void;
  fundId: string;
  onUploadComplete: () => void;
}

interface UploadProgress {
  step: 'parsing' | 'saving' | 'analyzing' | 'complete';
  progress: number;
  message: string;
}

interface ParseResult {
  id: string;
  data: any;
  status: 'success' | 'error' | 'warning';
  message: string;
  originalRow: any;
}

export const BatchUploadModal: React.FC<BatchUploadModalProps> = ({
  open,
  onClose,
  fundId,
  onUploadComplete
}) => {
  // Wrap the enhanced modal with an error boundary and fall back to legacy if it fails to render
  return (
    <SimpleErrorBoundary
      fallback={
        <LegacyBatchUploadModal
          open={open}
          onClose={onClose}
          fundId={fundId}
          onUploadComplete={onUploadComplete}
        />
      }
    >
      <EnhancedBatchUploadModal
        open={open}
        onClose={onClose}
        fundId={fundId}
        onUploadComplete={onUploadComplete}
      />
    </SimpleErrorBoundary>
  );
};

// Legacy component for reference
const LegacyBatchUploadModal: React.FC<BatchUploadModalProps> = ({
  open,
  onClose,
  fundId,
  onUploadComplete
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [parseResults, setParseResults] = useState<ParseResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
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
    } else {
      toast({
        title: "Invalid File",
        description: "Please select a CSV or Excel file (.csv, .xlsx, .xls)",
        variant: "destructive"
      });
    }
  };

  const processUpload = async () => {
    if (!file) return;

    setIsProcessing(true);
    setUploadProgress({ step: 'parsing', progress: 0, message: 'Parsing CSV file...' });

    try {
      // Step 1: Parse CSV (0-20%)
      const results = await CsvParsingService.parseFile(file);
      setParseResults(results);
      setUploadProgress({ step: 'parsing', progress: 20, message: 'CSV parsed successfully' });

      // Step 2: Save to database (20-60%)
      setUploadProgress({ step: 'saving', progress: 30, message: 'Saving deals to database...' });
      
      const validResults = results.filter(r => r.status === 'success');
      const dealIds = await CsvParsingService.saveToDatabaseBatch(validResults, fundId);
      
      setUploadProgress({ step: 'saving', progress: 60, message: `${dealIds.length} deals saved` });

      // Step 3: Trigger ReubenAI analysis (60-100%)
      setUploadProgress({ step: 'analyzing', progress: 70, message: 'Triggering ReubenAI analysis...' });
      
      await CsvParsingService.triggerBatchAIAnalysis(dealIds);
      
      setUploadProgress({ step: 'complete', progress: 100, message: 'Upload complete!' });

      toast({
        title: "Upload Successful",
        description: `${validResults.length} deals uploaded and analysis started`,
      });

      onUploadComplete();
      
      // Auto-close after 2 seconds
      setTimeout(() => {
        onClose();
        resetModal();
      }, 2000);

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: "An error occurred during upload",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const resetModal = () => {
    setFile(null);
    setUploadProgress(null);
    setParseResults([]);
    setIsProcessing(false);
  };

  const getResultCounts = () => {
    const success = parseResults.filter(r => r.status === 'success').length;
    const warning = parseResults.filter(r => r.status === 'warning').length;
    const error = parseResults.filter(r => r.status === 'error').length;
    return { success, warning, error };
  };

  const { success, warning, error } = getResultCounts();

  return (
    <Dialog open={open} onOpenChange={(open) => !open && !isProcessing && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Batch Upload Deals (Legacy Fallback)
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Template Download */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <FileSpreadsheet className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-medium text-blue-900">Download Template</h3>
                <p className="text-sm text-blue-700 mb-3">
                  Start with our CSV template to ensure proper formatting. Includes all legacy data fields for complete deal import.
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

          {/* Upload Progress */}
          {uploadProgress && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Upload Progress</span>
                <span>{uploadProgress.progress}%</span>
              </div>
              <Progress value={uploadProgress.progress} className="h-2" />
              <p className="text-sm text-gray-600">{uploadProgress.message}</p>
            </div>
          )}

          {/* Parse Results */}
          {parseResults.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-medium">Upload Results</h3>
              
              {/* Summary */}
              <div className="flex gap-4">
                {success > 0 && (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    {success} Success
                  </Badge>
                )}
                {warning > 0 && (
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    {warning} Warning
                  </Badge>
                )}
                {error > 0 && (
                  <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                    <XCircle className="w-3 h-3 mr-1" />
                    {error} Error
                  </Badge>
                )}
              </div>

              {/* Detailed Results */}
              <div className="max-h-40 overflow-y-auto space-y-2">
                {parseResults.map((result, index) => (
                  <div 
                    key={index}
                    className={`text-sm p-2 rounded ${
                      result.status === 'success' ? 'bg-green-50 text-green-700' :
                      result.status === 'warning' ? 'bg-yellow-50 text-yellow-700' :
                      'bg-red-50 text-red-700'
                    }`}
                  >
                    <span className="font-medium">{result.data?.company || 'Unknown Company'}</span>
                    <span className="ml-2">- {result.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button 
              variant="outline" 
              onClick={() => !isProcessing && onClose()}
              disabled={isProcessing}
            >
              {isProcessing ? 'Processing...' : 'Cancel'}
            </Button>
            <Button 
              onClick={processUpload}
              disabled={!file || isProcessing}
            >
              {isProcessing ? 'Uploading...' : 'Upload Deals'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
