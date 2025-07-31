import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DocumentUpload } from './DocumentUpload';
import { DocumentList } from './DocumentList';
import { DocumentViewer } from './DocumentViewer';
import { Database } from '@/integrations/supabase/types';

type DealDocument = Database['public']['Tables']['deal_documents']['Row'];

interface DocumentManagerProps {
  dealId: string;
  companyName: string;
  className?: string;
}

export function DocumentManager({ dealId, companyName, className }: DocumentManagerProps) {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedDocument, setSelectedDocument] = useState<DealDocument | null>(null);

  const handleUploadComplete = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className={className}>
      <Tabs defaultValue="list" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="list">Documents</TabsTrigger>
          <TabsTrigger value="upload">Upload</TabsTrigger>
        </TabsList>
        
        <TabsContent value="list" className="space-y-4">
          <DocumentList
            dealId={dealId}
            companyName={companyName}
            onDocumentSelect={setSelectedDocument}
            refreshTrigger={refreshTrigger}
          />
        </TabsContent>
        
        <TabsContent value="upload" className="space-y-4">
          <DocumentUpload
            dealId={dealId}
            companyName={companyName}
            onUploadComplete={handleUploadComplete}
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