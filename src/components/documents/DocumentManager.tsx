import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DocumentUpload } from './DocumentUpload';
import { DocumentList } from './DocumentList';
import { DocumentViewer } from './DocumentViewer';
import { DocumentAnalysisIntegration } from './DocumentAnalysisIntegration';
import { Database } from '@/integrations/supabase/types';
import { Brain } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';

type DealDocument = Database['public']['Tables']['deal_documents']['Row'];

interface DocumentManagerProps {
  dealId: string;
  companyName: string;
  className?: string;
}

export function DocumentManager({ dealId, companyName, className }: DocumentManagerProps) {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedDocument, setSelectedDocument] = useState<DealDocument | null>(null);
  const [documents, setDocuments] = useState<DealDocument[]>([]);
  const permissions = usePermissions();

  const handleUploadComplete = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className={className}>
      <Tabs defaultValue="list" className="w-full">
        <TabsList className={`grid w-full ${permissions.canUploadDocuments ? 'grid-cols-3' : 'grid-cols-2'}`}>
          <TabsTrigger value="list">Documents</TabsTrigger>
          {permissions.canUploadDocuments && (
            <TabsTrigger value="upload">Upload</TabsTrigger>
          )}
          <TabsTrigger value="analysis" className="flex items-center gap-2">
            <Brain className="w-4 h-4" />
            AI Analysis
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="list" className="space-y-4">
          <DocumentList
            dealId={dealId}
            companyName={companyName}
            onDocumentSelect={setSelectedDocument}
            refreshTrigger={refreshTrigger}
            onDocumentsLoad={setDocuments}
          />
        </TabsContent>
        
        {permissions.canUploadDocuments && (
          <TabsContent value="upload" className="space-y-4">
            <DocumentUpload
              dealId={dealId}
              companyName={companyName}
              onUploadComplete={handleUploadComplete}
            />
          </TabsContent>
        )}

        <TabsContent value="analysis" className="space-y-4">
          <DocumentAnalysisIntegration
            dealId={dealId}
            documents={documents}
            onAnalysisTrigger={handleUploadComplete}
          />
        </TabsContent>
      </Tabs>

      {/* Document Viewer Modal */}
      {selectedDocument && (
        <DocumentViewer
          document={selectedDocument}
          onClose={() => setSelectedDocument(null)}
        />
      )}
    </div>
  );
}