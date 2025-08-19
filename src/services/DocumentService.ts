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
      console.log('📁 DocumentService: Starting upload for deal:', input.dealId);
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

      // Enhanced authentication validation
      const { data: userData, error: authError } = await supabase.auth.getUser();
      if (authError) {
        console.error('🔐 Authentication error:', authError);
        throw new Error(`Authentication failed: ${authError.message}`);
      }
      
      if (!userData?.user?.id) {
        console.error('🔐 No user data available');
        throw new Error('You must be signed in to upload documents');
      }

      console.log('🔐 User authenticated:', { 
        userId: userData.user.id, 
        email: userData.user.email,
        dealId: input.dealId 
      });

      // First get basic deal info
      const { data: dealData, error: dealError } = await supabase
        .from('deals')
        .select('id, fund_id, company_name')
        .eq('id', input.dealId)
        .single();

      if (dealError || !dealData) {
        console.error('💼 Deal lookup failed:', dealError);
        throw new Error(`Deal not found: ${dealError?.message || 'Unknown error'}`);
      }

      // Then get fund and organization info
      const { data: fundData, error: fundError } = await supabase
        .from('funds')
        .select('id, name, organization_id')
        .eq('id', dealData.fund_id)
        .single();

      if (fundError || !fundData) {
        console.error('💼 Fund lookup failed:', fundError);
        throw new Error(`Fund not found: ${fundError?.message || 'Unknown error'}`);
      }

      console.log('💼 Deal and fund found:', { 
        dealId: dealData.id, 
        fundId: dealData.fund_id, 
        companyName: dealData.company_name,
        organizationId: fundData.organization_id
      });

      // Verify user has access to this deal's organization
      const { data: accessData, error: accessError } = await supabase
        .from('profiles')
        .select('user_id, organization_id, role, is_deleted')
        .eq('user_id', userData.user.id)
        .eq('organization_id', fundData.organization_id)
        .maybeSingle();

      if (accessError) {
        console.error('🔒 Organization access check failed:', accessError);
        throw new Error(`Access validation failed: ${accessError.message}`);
      }

      if (!accessData || accessData.is_deleted) {
        console.error('🔒 User lacks access to organization:', {
          userId: userData.user.id,
          organizationId: fundData.organization_id,
          accessData
        });
        throw new Error('Access denied: You do not have permission to upload documents for this deal');
      }

      console.log('✅ Organization access verified:', { 
        userId: accessData.user_id,
        organizationId: accessData.organization_id,
        userRole: accessData.role
      });

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
        console.error('💾 Storage upload failed:', {
          error: uploadError,
          fileName: input.file.name,
          filePath,
          bucket: 'deal-documents'
        });
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      onProgress?.({ progress: 60, status: 'processing', message: 'Creating document record...' });

      // Create document record with enhanced logging
      const documentData: DealDocumentInsert = {
        deal_id: input.dealId,
        fund_id: dealData.fund_id,
        organization_id: fundData.organization_id,
        name: input.file.name,
        file_path: uploadData.path,          // e.g. "<dealId>/<timestamp>_file.ext"
        storage_path: uploadData.path,       // Use same path for consistency
        bucket_name: 'deal-documents',
        content_type: input.file.type,
        file_size: input.file.size,
        document_type: input.documentType,
        document_category: input.documentCategory || 'other',
        tags: input.tags || [],
        uploaded_by: userData.user.id,
        metadata: {
          originalName: input.file.name,
          uploadedAt: new Date().toISOString()
        }
      };

      console.log('💾 Creating document record:', {
        dealId: documentData.deal_id,
        fileName: documentData.name,
        filePath: documentData.file_path,
        uploadedBy: documentData.uploaded_by,
        category: documentData.document_category
      });

      const { data: documentRecord, error: dbError } = await supabase
        .from('deal_documents')
        .insert(documentData)
        .select()
        .maybeSingle();

      if (dbError) {
        console.error('💾 Database insert failed:', {
          error: dbError,
          code: dbError.code,
          message: dbError.message,
          details: dbError.details,
          hint: dbError.hint,
          documentData
        });
        
        // Clean up uploaded file if DB insert fails
        console.log('🧹 Cleaning up uploaded file due to DB error');
        await supabase.storage.from('deal-documents').remove([uploadData.path]);
        
        // Enhanced error message for common RLS issues
        if (dbError.code === '42501' || dbError.message.includes('row-level security')) {
          throw new Error(`Access denied: You don't have permission to upload documents for this deal. Contact your administrator.`);
        }
        
        throw new Error(`Database error: ${dbError.message}`);
      }

      if (!documentRecord) {
        console.error('💾 Document record creation returned null');
        // Clean up and signal failure
        await supabase.storage.from('deal-documents').remove([uploadData.path]);
        throw new Error('Document record was not created');
      }

      console.log('✅ Document upload successful:', {
        documentId: documentRecord.id,
        dealId: documentRecord.deal_id,
        fileName: documentRecord.name,
        filePath: documentRecord.file_path
      });

      onProgress?.({ progress: 100, status: 'complete', message: 'Upload complete!' });

      // Trigger document processing (non-blocking)
      try {
        await supabase.functions.invoke('document-processor', {
          body: {
            documentId: documentRecord.id,
            analysisType: 'quick'
          }
        });
        console.log(`📋 Document processing triggered for ${documentRecord.id}`);
      } catch (processingError) {
        console.warn('⚠️ Failed to trigger document processing:', processingError);
        // Don't fail the upload if processing trigger fails
      }

      return documentRecord;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      console.error('❌ Document upload failed:', {
        error: error,
        dealId: input.dealId,
        fileName: input.file.name,
        message: errorMessage
      });
      
      onProgress?.({ 
        progress: 0, 
        status: 'error', 
        message: errorMessage
      });
      
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
        .createSignedUrl(document.file_path, 3600, {
          download: true,
          transform: {
            format: 'origin'
          }
        });

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

  async downloadDocumentBlob(document: DealDocument): Promise<Blob | null> {
    try {
      const { data, error } = await supabase.storage
        .from(document.bucket_name)
        .download(document.file_path);

      if (error) {
        console.error('Error downloading file:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error downloading file:', error);
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
