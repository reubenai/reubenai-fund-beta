import React, { useState, useEffect } from 'react';
import { File, Download, Trash2, Eye, Edit, MoreHorizontal, Search, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { documentService } from '@/services/DocumentService';
import { useActivityTracking } from '@/hooks/useActivityTracking';
import { Database } from '@/integrations/supabase/types';
import { formatDistanceToNow } from 'date-fns';
import { usePermissions } from '@/hooks/usePermissions';

type DealDocument = Database['public']['Tables']['deal_documents']['Row'];

interface DocumentListProps {
  dealId: string;
  companyName: string;
  onDocumentSelect?: (document: DealDocument) => void;
  refreshTrigger?: number;
  onDocumentsLoad?: (documents: DealDocument[]) => void;
}

export function DocumentList({ dealId, companyName, onDocumentSelect, refreshTrigger, onDocumentsLoad }: DocumentListProps) {
  const [documents, setDocuments] = useState<DealDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteDocument, setDeleteDocument] = useState<DealDocument | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { logActivity } = useActivityTracking();
  const { canDownloadDocuments, canDeleteDocuments } = usePermissions();

  const loadDocuments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let docs: DealDocument[];
      if (searchQuery.trim()) {
        docs = await documentService.searchDocuments(searchQuery, dealId);
      } else {
        docs = await documentService.getDocumentsByDeal(dealId);
      }
      
      setDocuments(docs);
      onDocumentsLoad?.(docs);
    } catch (err) {
      setError('Failed to load documents');
      console.error('Error loading documents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [dealId, searchQuery, refreshTrigger]);

  const handleDownload = async (document: DealDocument) => {
    try {
      // First try the direct download URL approach
      const url = await documentService.getDocumentDownloadUrl(document);
      if (url) {
        try {
          const link = window.document.createElement('a');
          link.href = url;
          link.download = document.name;
          link.setAttribute('target', '_blank');
          link.setAttribute('rel', 'noopener noreferrer');
          window.document.body.appendChild(link);
          link.click();
          window.document.body.removeChild(link);
          
          // Log activity
          await logActivity({
            activity_type: 'deal_updated',
            title: `Downloaded ${document.name}`,
            description: `Downloaded document from ${companyName}`,
            deal_id: dealId,
            resource_type: 'document',
            resource_id: document.id,
            context_data: { 
              company_name: companyName,
              document_name: document.name,
              document_type: document.document_type
            },
            priority: 'low',
            tags: ['document', 'download']
          });
          return;
        } catch (linkError) {
          console.warn('Direct download failed, trying blob method:', linkError);
        }
      }

      // Fallback: Use blob download method
      const blob = await documentService.downloadDocumentBlob(document);
      if (blob) {
        const blobUrl = URL.createObjectURL(blob);
        const link = window.document.createElement('a');
        link.href = blobUrl;
        link.download = document.name;
        window.document.body.appendChild(link);
        link.click();
        window.document.body.removeChild(link);
        
        // Clean up the blob URL
        setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
        
        // Log activity
        await logActivity({
          activity_type: 'deal_updated',
          title: `Downloaded ${document.name}`,
          description: `Downloaded document from ${companyName}`,
          deal_id: dealId,
          resource_type: 'document',
          resource_id: document.id,
          context_data: { 
            company_name: companyName,
            document_name: document.name,
            document_type: document.document_type
          },
          priority: 'low',
          tags: ['document', 'download']
        });
      } else {
        throw new Error('Failed to download document');
      }
    } catch (err) {
      setError('Failed to download document. Please try again or check your browser settings.');
      console.error('Download error:', err);
    }
  };

  const handleDelete = async () => {
    if (!deleteDocument) return;

    try {
      const success = await documentService.deleteDocument(deleteDocument.id);
      if (success) {
        setDocuments(prev => prev.filter(doc => doc.id !== deleteDocument.id));
        
        // Log activity
        await logActivity({
          activity_type: 'deal_updated',
          title: `Deleted ${deleteDocument.name}`,
          description: `Deleted document from ${companyName}`,
          deal_id: dealId,
          resource_type: 'document',
          context_data: { 
            company_name: companyName,
            document_name: deleteDocument.name,
            document_type: deleteDocument.document_type
          },
          priority: 'medium',
          tags: ['document', 'deleted']
        });
      } else {
        setError('Failed to delete document');
      }
    } catch (err) {
      setError('Failed to delete document');
      console.error('Delete error:', err);
    } finally {
      setDeleteDocument(null);
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

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">Loading documents...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Documents ({documents.length})</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-64"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {documents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery ? 'No documents found matching your search.' : 'No documents uploaded yet.'}
            </div>
          ) : (
            <div className="space-y-3">
              {documents.map((document) => (
                <div
                  key={document.id}
                  className="flex items-center gap-3 p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <File className="h-5 w-5 text-muted-foreground" />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium truncate">{document.name}</span>
                      {document.document_type && (
                       <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                          {document.document_type}
                        </Badge>
                      )}
                      {document.document_category && (
                        <Badge 
                          variant="secondary" 
                          className={getCategoryColor(document.document_category)}
                        >
                          {document.document_category.replace('_', ' ')}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{formatFileSize(document.file_size)}</span>
                      <span>
                        Uploaded {formatDistanceToNow(new Date(document.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    
                    {document.tags && document.tags.length > 0 && (
                      <div className="flex gap-1 mt-1">
                        {document.tags.slice(0, 3).map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {document.tags.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{document.tags.length - 3} more
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDocumentSelect?.(document)}
                      className="gap-2"
                    >
                      <FileText className="h-4 w-4" />
                      View Summary
                    </Button>
                    
                    {canDownloadDocuments && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownload(document)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    )}

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {canDownloadDocuments && (
                          <DropdownMenuItem onClick={() => handleDownload(document)}>
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </DropdownMenuItem>
                        )}
                        {canDeleteDocuments && (
                          <DropdownMenuItem 
                            onClick={() => setDeleteDocument(document)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteDocument} onOpenChange={(open) => !open && setDeleteDocument(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteDocument?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}