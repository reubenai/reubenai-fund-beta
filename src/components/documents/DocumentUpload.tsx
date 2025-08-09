import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, File, AlertCircle, Settings, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { documentService, UploadDocumentInput, DocumentUploadProgress } from '@/services/DocumentService';
import { useActivityTracking } from '@/hooks/useActivityTracking';
import { Database } from '@/integrations/supabase/types';
import { useToast } from '@/hooks/use-toast';
import { EnhancedDocumentErrorHandler, DocumentErrors } from './EnhancedDocumentErrorHandler';
import { usePermissions } from '@/hooks/usePermissions';

interface DocumentUploadProps {
  dealId: string;
  companyName: string;
  onUploadComplete?: (document: any) => void;
  onUploadStart?: () => void;
}

interface SelectedFile {
  file: File;
  id: string;
  documentType: string;
  documentCategory: Database['public']['Enums']['document_category'];
  tags: string;
}

interface UploadingFile {
  file: File;
  progress: DocumentUploadProgress;
  id: string;
}

const DOCUMENT_CATEGORIES: { value: Database['public']['Enums']['document_category']; label: string }[] = [
  { value: 'pitch_deck', label: 'Pitch Deck' },
  { value: 'financial_statement', label: 'Financial Statement' },
  { value: 'legal_document', label: 'Legal Document' },
  { value: 'business_plan', label: 'Business Plan' },
  { value: 'technical_documentation', label: 'Technical Documentation' },
  { value: 'market_research', label: 'Market Research' },
  { value: 'due_diligence', label: 'Due Diligence' },
  { value: 'other', label: 'Other' }
];

export function DocumentUpload({ dealId, companyName, onUploadComplete, onUploadStart }: DocumentUploadProps) {
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [error, setError] = useState<any | null>(null);
  const { logDocumentUploaded } = useActivityTracking();
  const permissions = usePermissions();

  // Check permissions first - moved after all hooks
  if (!permissions.canUploadDocuments) {
    return (
      <div className="text-center p-8 bg-muted/20 rounded-lg">
        <p className="text-muted-foreground">
          You don't have permission to upload documents. Contact your administrator for access.
        </p>
      </div>
    );
  }

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setError(null);
    
    const newFiles: SelectedFile[] = acceptedFiles.map(file => ({
      file,
      id: Math.random().toString(36).substring(7),
      documentType: '',
      documentCategory: 'other' as Database['public']['Enums']['document_category'],
      tags: ''
    }));

    setSelectedFiles(prev => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-powerpoint': ['.ppt'],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
      'text/plain': ['.txt'],
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/gif': ['.gif']
    },
    maxSize: 50 * 1024 * 1024, // 50MB
    multiple: true
  });

  const removeSelectedFile = (id: string) => {
    setSelectedFiles(prev => prev.filter(f => f.id !== id));
  };

  const removeUploadingFile = (id: string) => {
    setUploadingFiles(prev => prev.filter(u => u.id !== id));
  };

  const updateFileConfig = (id: string, field: string, value: string) => {
    setSelectedFiles(prev => prev.map(f => 
      f.id === id ? { ...f, [field]: value } : f
    ));
  };

  const uploadSelectedFiles = async () => {
    if (selectedFiles.length === 0) return;
    
    setError(null);
    onUploadStart?.();

    const newUploads: UploadingFile[] = selectedFiles.map(sf => ({
      file: sf.file,
      progress: { progress: 0, status: 'uploading' as const },
      id: sf.id
    }));

    setUploadingFiles(newUploads);
    setSelectedFiles([]); // Clear selected files

    for (const selectedFile of selectedFiles) {
      try {
        const uploadInput: UploadDocumentInput = {
          dealId,
          file: selectedFile.file,
          documentType: selectedFile.documentType || undefined,
          documentCategory: selectedFile.documentCategory,
          tags: selectedFile.tags ? selectedFile.tags.split(',').map(t => t.trim()).filter(Boolean) : undefined
        };

        const result = await documentService.uploadDocument(
          uploadInput,
          (progress) => {
            setUploadingFiles(prev => prev.map(u => 
              u.id === selectedFile.id ? { ...u, progress } : u
            ));
          }
        );

        if (result) {
          // Log activity
          await logDocumentUploaded(dealId, companyName, selectedFile.file.name, selectedFile.documentType);
          
          // Remove from uploading list
          setUploadingFiles(prev => prev.filter(u => u.id !== selectedFile.id));
          
          onUploadComplete?.(result);
        } else {
          setUploadingFiles(prev => prev.map(u => 
            u.id === selectedFile.id 
              ? { ...u, progress: { progress: 0, status: 'error', message: 'Upload failed' } }
              : u
          ));
        }
      } catch (err) {
        console.error('Upload error:', err);
        
        // Create specific error based on error type
        let documentError;
        if (err instanceof Error) {
          if (err.message.includes('Permission denied') || err.message.includes('RLS policy')) {
            documentError = DocumentErrors.permissionDenied(
              `Unable to upload to deal: ${err.message}`,
              'RLS_POLICY_VIOLATION'
            );
          } else if (err.message.includes('Network') || err.message.includes('fetch')) {
            documentError = DocumentErrors.networkError(err.message);
          } else if (err.message.includes('Storage')) {
            documentError = DocumentErrors.storageError(err.message, 'STORAGE_ERROR');
          } else {
            documentError = DocumentErrors.uploadFailed(err.message, 'UPLOAD_FAILED');
          }
        } else {
          documentError = DocumentErrors.uploadFailed('Unknown upload error', 'UNKNOWN_ERROR');
        }
        
        setError(documentError);
        setUploadingFiles(prev => prev.map(u => 
          u.id === selectedFile.id 
            ? { ...u, progress: { progress: 0, status: 'error', message: documentError.message } }
            : u
        ));
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Step 1: File Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Step 1: Select Files
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
              ${isDragActive 
                ? 'border-primary bg-primary/5' 
                : 'border-muted-foreground/25 hover:border-muted-foreground/50'
              }`}
          >
            <input {...getInputProps()} />
            <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            {isDragActive ? (
              <p className="text-lg font-medium">Drop files here...</p>
            ) : (
              <div>
                <p className="text-lg font-medium mb-2">Drag & drop files here</p>
                <p className="text-sm text-muted-foreground mb-4">
                  or click to select files
                </p>
                <Button variant="outline">
                  Choose Files
                </Button>
              </div>
            )}
            <div className="mt-4 text-xs text-muted-foreground">
              Supported: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, PNG, JPG, GIF (max 50MB)
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step 2: Configure Selected Files */}
      {selectedFiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Step 2: Configure Documents ({selectedFiles.length} files)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedFiles.map((selectedFile) => (
              <Card key={selectedFile.id} className="p-4">
                <div className="flex items-start gap-4">
                  <File className="h-5 w-5 text-muted-foreground mt-1" />
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{selectedFile.file.name}</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSelectedFile(selectedFile.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <Label>Document Type</Label>
                        <Input
                          placeholder="e.g. Q1 2024 Financials"
                          value={selectedFile.documentType}
                          onChange={(e) => updateFileConfig(selectedFile.id, 'documentType', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Category</Label>
                        <Select 
                          value={selectedFile.documentCategory} 
                          onValueChange={(value) => updateFileConfig(selectedFile.id, 'documentCategory', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {DOCUMENT_CATEGORIES.map(cat => (
                              <SelectItem key={cat.value} value={cat.value}>
                                {cat.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Tags (comma-separated)</Label>
                        <Input
                          placeholder="urgent, confidential, review"
                          value={selectedFile.tags}
                          onChange={(e) => updateFileConfig(selectedFile.id, 'tags', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
            
            {/* Step 3: Upload Button */}
            <div className="pt-4 border-t">
              <Button 
                onClick={uploadSelectedFiles}
                className="w-full"
                size="lg"
                disabled={selectedFiles.length === 0}
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload {selectedFiles.length} Document{selectedFiles.length !== 1 ? 's' : ''}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <EnhancedDocumentErrorHandler
          error={error}
          onRetry={() => {
            setError(null);
            // Retry last failed upload if any
            const failedFiles = uploadingFiles.filter(f => f.progress.status === 'error');
            if (failedFiles.length > 0) {
              uploadSelectedFiles();
            }
          }}
          onDismiss={() => setError(null)}
        />
      )}

      {/* Uploading Files */}
      {uploadingFiles.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium">Uploading Files</h4>
          {uploadingFiles.map((upload) => (
            <Card key={upload.id}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <File className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">{upload.file.name}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant={
                          upload.progress.status === 'complete' ? 'default' :
                          upload.progress.status === 'error' ? 'destructive' : 'secondary'
                        }>
                          {upload.progress.status}
                        </Badge>
                        {upload.progress.status === 'error' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeUploadingFile(upload.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                    {upload.progress.status !== 'error' && (
                      <Progress value={upload.progress.progress} className="h-2" />
                    )}
                    {upload.progress.message && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {upload.progress.message}
                      </p>
                    )}
                    {upload.progress.status === 'complete' && (
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                          ✓ Ready for AI Analysis
                        </Badge>
                        <span className="text-xs text-green-600">
                          Document will be included in next deal analysis
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}