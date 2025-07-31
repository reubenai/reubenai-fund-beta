import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, File, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
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

interface DocumentUploadProps {
  dealId: string;
  companyName: string;
  onUploadComplete?: (document: any) => void;
  onUploadStart?: () => void;
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
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [documentType, setDocumentType] = useState('');
  const [documentCategory, setDocumentCategory] = useState<Database['public']['Enums']['document_category']>('other');
  const [tags, setTags] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { logDocumentUploaded } = useActivityTracking();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setError(null);
    onUploadStart?.();

    const newUploads: UploadingFile[] = acceptedFiles.map(file => ({
      file,
      progress: { progress: 0, status: 'uploading' as const },
      id: Math.random().toString(36).substring(7)
    }));

    setUploadingFiles(prev => [...prev, ...newUploads]);

    for (const upload of newUploads) {
      try {
        const uploadInput: UploadDocumentInput = {
          dealId,
          file: upload.file,
          documentType: documentType || undefined,
          documentCategory,
          tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : undefined
        };

        const result = await documentService.uploadDocument(
          uploadInput,
          (progress) => {
            setUploadingFiles(prev => prev.map(u => 
              u.id === upload.id ? { ...u, progress } : u
            ));
          }
        );

        if (result) {
          // Log activity
          await logDocumentUploaded(dealId, companyName, upload.file.name, documentType);
          
          // Remove from uploading list
          setUploadingFiles(prev => prev.filter(u => u.id !== upload.id));
          
          onUploadComplete?.(result);
        } else {
          setUploadingFiles(prev => prev.map(u => 
            u.id === upload.id 
              ? { ...u, progress: { progress: 0, status: 'error', message: 'Upload failed' } }
              : u
          ));
        }
      } catch (err) {
        setUploadingFiles(prev => prev.map(u => 
          u.id === upload.id 
            ? { ...u, progress: { progress: 0, status: 'error', message: 'Upload failed' } }
            : u
        ));
      }
    }
  }, [dealId, companyName, documentType, documentCategory, tags, onUploadComplete, onUploadStart, logDocumentUploaded]);

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

  const removeUploadingFile = (id: string) => {
    setUploadingFiles(prev => prev.filter(u => u.id !== id));
  };

  return (
    <div className="space-y-4">
      {/* Upload Configuration */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="document-type">Document Type</Label>
          <Input
            id="document-type"
            placeholder="e.g. Q1 2024 Financials"
            value={documentType}
            onChange={(e) => setDocumentType(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="document-category">Category</Label>
          <Select value={documentCategory} onValueChange={(value) => setDocumentCategory(value as Database['public']['Enums']['document_category'])}>
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
          <Label htmlFor="tags">Tags (comma-separated)</Label>
          <Input
            id="tags"
            placeholder="urgent, confidential, review"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
          />
        </div>
      </div>

      {/* Drop Zone */}
      <Card>
        <CardContent className="p-6">
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

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
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