import React, { useState, useEffect } from 'react';
import { X, Download, ExternalLink, FileText, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { documentService } from '@/services/DocumentService';
import { Database } from '@/integrations/supabase/types';
import { formatDistanceToNow } from 'date-fns';

type DealDocument = Database['public']['Tables']['deal_documents']['Row'];

interface DocumentViewerProps {
  document: DealDocument;
  onClose: () => void;
}

export function DocumentViewer({ document, onClose }: DocumentViewerProps) {
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const getDownloadUrl = async () => {
      try {
        setLoading(true);
        setError(null);
        const url = await documentService.getDocumentDownloadUrl(document);
        setDownloadUrl(url);
      } catch (err) {
        setError('Failed to load document');
        console.error('Error getting download URL:', err);
      } finally {
        setLoading(false);
      }
    };

    getDownloadUrl();
  }, [document]);

  const handleDownload = () => {
    if (downloadUrl) {
      const link = window.document.createElement('a');
      link.href = downloadUrl;
      link.download = document.name;
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
    }
  };

  const handleOpenInNewTab = () => {
    if (downloadUrl) {
      window.open(downloadUrl, '_blank');
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'Unknown size';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      pitch_deck: 'bg-blue-100 text-blue-800',
      financial_statement: 'bg-green-100 text-green-800',
      legal_document: 'bg-red-100 text-red-800',
      business_plan: 'bg-purple-100 text-purple-800',
      technical_documentation: 'bg-purple-100 text-purple-800',
      market_research: 'bg-yellow-100 text-yellow-800',
      due_diligence: 'bg-yellow-100 text-yellow-800',
      other: 'bg-gray-100 text-gray-800'
    };
    return colors[category] || colors.other;
  };

  const canPreview = document.content_type?.includes('pdf') || 
                   document.content_type?.includes('image');

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {document.name}
            </DialogTitle>
            <div className="flex items-center gap-2">
              {downloadUrl && (
                <>
                  <Button variant="outline" size="sm" onClick={handleDownload}>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleOpenInNewTab}>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open
                  </Button>
                </>
              )}
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Document Info */}
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span>{formatFileSize(document.file_size)}</span>
            <span>
              Uploaded {formatDistanceToNow(new Date(document.created_at), { addSuffix: true })}
            </span>
            {document.document_type && <span>{document.document_type}</span>}
            {document.document_category && (
              <Badge 
                variant="secondary" 
                className={getCategoryColor(document.document_category)}
              >
                {document.document_category.replace('_', ' ')}
              </Badge>
            )}
          </div>

          {/* Tags */}
          {document.tags && document.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {document.tags.map((tag, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Document Preview */}
          {loading ? (
            <div className="flex items-center justify-center h-96 border rounded-lg">
              <div className="text-muted-foreground">Loading document...</div>
            </div>
          ) : downloadUrl && canPreview ? (
            <div className="border rounded-lg overflow-hidden">
              {document.content_type?.includes('pdf') ? (
                <iframe
                  src={downloadUrl}
                  className="w-full h-96"
                  title={document.name}
                />
              ) : document.content_type?.includes('image') ? (
                <img
                  src={downloadUrl}
                  alt={document.name}
                  className="w-full h-auto max-h-96 object-contain"
                />
              ) : null}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-96 border rounded-lg text-muted-foreground">
              <FileText className="h-16 w-16 mb-4" />
              <p className="text-lg font-medium">Preview not available</p>
              <p className="text-sm">Download the file to view its contents</p>
              {downloadUrl && (
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={handleDownload}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download File
                </Button>
              )}
            </div>
          )}

          {/* Document Analysis & Insights */}
          {document.document_analysis_status && (
            <div className="space-y-4">
              <div className="p-3 bg-accent rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Analysis Status</span>
                  <Badge variant={
                    document.document_analysis_status === 'completed' ? 'default' :
                    document.document_analysis_status === 'failed' ? 'destructive' : 'secondary'
                  }>
                    {document.document_analysis_status}
                  </Badge>
                </div>
              </div>

              {/* Show extracted insights when analysis is completed */}
              {document.document_analysis_status === 'completed' && document.parsed_data && (() => {
                const parsedData = document.parsed_data as any;
                return (
                  <div className="space-y-4">
                    {/* Document Summary */}
                    {parsedData.summary && (
                      <div className="p-4 border rounded-lg">
                        <h4 className="font-medium mb-2 flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Document Summary
                        </h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {parsedData.summary}
                        </p>
                      </div>
                    )}

                    {/* Key Insights */}
                    {parsedData.insights && Array.isArray(parsedData.insights) && parsedData.insights.length > 0 && (
                      <div className="p-4 border rounded-lg">
                        <h4 className="font-medium mb-2">Key Insights</h4>
                        <div className="space-y-2">
                          {parsedData.insights.map((insight: string, index: number) => (
                            <div key={index} className="flex items-start gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                              <span className="text-sm text-muted-foreground">{insight}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Financial Data (for financial documents) */}
                    {document.document_category === 'financial_statement' && parsedData.financial_data && (
                      <div className="p-4 border rounded-lg">
                        <h4 className="font-medium mb-2">Financial Highlights</h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          {Object.entries(parsedData.financial_data).map(([key, value]) => (
                            <div key={key}>
                              <span className="text-muted-foreground capitalize">{key.replace('_', ' ')}: </span>
                              <span className="font-medium">{String(value)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Flags & Concerns */}
                    {parsedData.flags && Array.isArray(parsedData.flags) && parsedData.flags.length > 0 && (
                      <div className="p-4 border rounded-lg border-yellow-200 bg-yellow-50">
                        <h4 className="font-medium mb-2 text-yellow-800 flex items-center gap-2">
                          <AlertCircle className="h-4 w-4" />
                          Flags & Concerns
                        </h4>
                        <div className="space-y-1">
                          {parsedData.flags.map((flag: string, index: number) => (
                            <div key={index} className="text-sm text-yellow-700">• {flag}</div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Confidence Score */}
                    {parsedData.confidence && (
                      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <span className="text-sm font-medium">Analysis Confidence</span>
                        <Badge variant="outline" className="bg-background">
                          {parsedData.confidence}%
                        </Badge>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Show extracted text if no structured analysis available */}
              {document.document_analysis_status === 'completed' && document.extracted_text && !document.parsed_data && (
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Extracted Text</h4>
                  <div className="max-h-32 overflow-y-auto">
                    <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                      {document.extracted_text.substring(0, 500)}
                      {document.extracted_text.length > 500 && '...'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}