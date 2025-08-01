import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type DealDocument = Database['public']['Tables']['deal_documents']['Row'];
type DealDocumentInsert = Database['public']['Tables']['deal_documents']['Insert'];
type DealDocumentUpdate = Database['public']['Tables']['deal_documents']['Update'];

export interface UploadDocumentInput {
  dealId: string;
  file: File;
  documentType?: string;
  documentCategory?: Database['public']['Enums']['document_category'];
  tags?: string[];
}

export interface DocumentUploadProgress {
  progress: number;
  status: 'uploading' | 'processing' | 'complete' | 'error';
  message?: string;
}

class DocumentService {
  async uploadDocument(
    input: UploadDocumentInput,
    onProgress?: (progress: DocumentUploadProgress) => void
  ): Promise<DealDocument | null> {
    try {
      onProgress?.({ progress: 0, status: 'uploading', message: 'Starting upload...' });

      // Validate file
      const maxSize = 50 * 1024 * 1024; // 50MB
      if (input.file.size > maxSize) {
        throw new Error('File size exceeds 50MB limit');
      }

      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain',
        'image/png',
        'image/jpeg',
        'image/gif'
      ];

      if (!allowedTypes.includes(input.file.type)) {
        throw new Error('File type not supported');
      }

      // Generate unique filename
      const timestamp = Date.now();
      const sanitizedName = input.file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const fileName = `${timestamp}_${sanitizedName}`;
      const filePath = `${input.dealId}/${fileName}`;

      onProgress?.({ progress: 20, status: 'uploading', message: 'Uploading file...' });

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('deal-documents')
        .upload(filePath, input.file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      onProgress?.({ progress: 60, status: 'processing', message: 'Creating document record...' });

      // Create document record
      const documentData: DealDocumentInsert = {
        deal_id: input.dealId,
        name: input.file.name,
        file_path: uploadData.path,
        storage_path: fileName,
        bucket_name: 'deal-documents',
        content_type: input.file.type,
        file_size: input.file.size,
        document_type: input.documentType,
        document_category: input.documentCategory || 'other',
        tags: input.tags || [],
        uploaded_by: (await supabase.auth.getUser()).data.user?.id!,
        metadata: {
          originalName: input.file.name,
          uploadedAt: new Date().toISOString()
        }
      };

      const { data: documentRecord, error: dbError } = await supabase
        .from('deal_documents')
        .insert(documentData)
        .select()
        .single();

      if (dbError) {
        // Clean up uploaded file if DB insert fails
        await supabase.storage.from('deal-documents').remove([uploadData.path]);
        throw new Error(`Database error: ${dbError.message}`);
      }

      onProgress?.({ progress: 100, status: 'complete', message: 'Upload complete!' });

      // Trigger document processing
      try {
        await supabase.functions.invoke('document-processor', {
          body: {
            documentId: documentRecord.id,
            analysisType: 'quick'
          }
        });
        console.log(`Document processing triggered for ${documentRecord.id}`);
      } catch (processingError) {
        console.warn('Failed to trigger document processing:', processingError);
        // Don't fail the upload if processing trigger fails
      }

      return documentRecord;
    } catch (error) {
      onProgress?.({ 
        progress: 0, 
        status: 'error', 
        message: error instanceof Error ? error.message : 'Upload failed' 
      });
      console.error('Document upload error:', error);
      return null;
    }
  }

  async getDocumentsByDeal(dealId: string): Promise<DealDocument[]> {
    const { data, error } = await supabase
      .from('deal_documents')
      .select('*')
      .eq('deal_id', dealId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching documents:', error);
      return [];
    }

    return data || [];
  }

  async deleteDocument(documentId: string): Promise<boolean> {
    try {
      // Get document record to find file path
      const { data: document, error: fetchError } = await supabase
        .from('deal_documents')
        .select('file_path, bucket_name')
        .eq('id', documentId)
        .single();

      if (fetchError || !document) {
        throw new Error('Document not found');
      }

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from(document.bucket_name)
        .remove([document.file_path]);

      if (storageError) {
        console.warn('Storage deletion warning:', storageError);
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('deal_documents')
        .delete()
        .eq('id', documentId);

      if (dbError) {
        throw new Error(`Database error: ${dbError.message}`);
      }

      return true;
    } catch (error) {
      console.error('Document deletion error:', error);
      return false;
    }
  }

  async updateDocument(documentId: string, updates: DealDocumentUpdate): Promise<DealDocument | null> {
    const { data, error } = await supabase
      .from('deal_documents')
      .update(updates)
      .eq('id', documentId)
      .select()
      .single();

    if (error) {
      console.error('Error updating document:', error);
      return null;
    }

    return data;
  }

  async getDocumentDownloadUrl(document: DealDocument): Promise<string | null> {
    try {
      const { data, error } = await supabase.storage
        .from(document.bucket_name)
        .createSignedUrl(document.file_path, 3600); // 1 hour expiry

      if (error) {
        console.error('Error creating signed URL:', error);
        return null;
      }

      return data.signedUrl;
    } catch (error) {
      console.error('Error getting download URL:', error);
      return null;
    }
  }

  async searchDocuments(query: string, dealId?: string): Promise<DealDocument[]> {
    let queryBuilder = supabase
      .from('deal_documents')
      .select('*')
      .or(`name.ilike.%${query}%,document_type.ilike.%${query}%,tags.cs.{${query}}`);

    if (dealId) {
      queryBuilder = queryBuilder.eq('deal_id', dealId);
    }

    const { data, error } = await queryBuilder
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error searching documents:', error);
      return [];
    }

    return data || [];
  }
}

export const documentService = new DocumentService();