import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, RefreshCw, Upload, FileX, Network, Database, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DocumentError {
  type: 'upload' | 'processing' | 'analysis' | 'network' | 'permission' | 'storage' | 'integration' | 'unknown';
  message: string;
  details?: string;
  code?: string;
  retryable?: boolean;
}

interface EnhancedDocumentErrorHandlerProps {
  error: DocumentError | any; // Allow any error format for defensive handling
  onRetry?: () => void;
  onDismiss?: () => void;
}

const errorConfig = {
  upload: {
    icon: Upload,
    title: 'Document Upload Failed',
    color: 'text-orange-600',
    suggestions: [
      'Check if the file format is supported (PDF, DOC, DOCX, TXT)',
      'Ensure file size is under the 50MB limit',
      'Verify you have upload permissions for this deal',
      'Try refreshing the page and uploading again'
    ]
  },
  processing: {
    icon: FileX,
    title: 'Document Processing Failed',
    color: 'text-red-600',
    suggestions: [
      'The document may be corrupted or password-protected',
      'Try re-uploading the document',
      'If using a scanned PDF, ensure text is readable',
      'Contact support if the issue persists'
    ]
  },
  analysis: {
    icon: AlertCircle,
    title: 'AI Analysis Failed',
    color: 'text-yellow-600',
    suggestions: [
      'The document was uploaded but AI analysis failed',
      'You can still view and download the document',
      'Analysis may be retried automatically',
      'Contact support for manual analysis'
    ]
  },
  network: {
    icon: Network,
    title: 'Network Connection Issue',
    color: 'text-blue-600',
    suggestions: [
      'Check your internet connection',
      'The upload may have been interrupted',
      'Try uploading again with a stable connection',
      'Consider uploading smaller files if connection is slow'
    ]
  },
  permission: {
    icon: Shield,
    title: 'Permission Denied',
    color: 'text-red-600',
    suggestions: [
      'You may not have document upload permissions for this deal',
      'Verify you have the correct role (Fund Manager, Analyst, or Admin)',
      'Contact your fund administrator for access',
      'Ensure you are logged in with the correct account'
    ]
  },
  storage: {
    icon: Database,
    title: 'Storage Error',
    color: 'text-purple-600',
    suggestions: [
      'Document storage service is temporarily unavailable',
      'Your fund may have reached storage limits',
      'Try again in a few minutes',
      'Contact support if the issue persists'
    ]
  },
  integration: {
    icon: AlertCircle,
    title: 'System Integration Issue',
    color: 'text-gray-600',
    suggestions: [
      'Document uploaded but not appearing in AI Analysis tab',
      'Integration between document storage and analysis engines failed',
      'Try refreshing the page',
      'Contact support with error details for faster resolution'
    ]
  },
  unknown: {
    icon: AlertCircle,
    title: 'Unexpected Error',
    color: 'text-red-600',
    suggestions: [
      'An unexpected error occurred during the operation',
      'Try refreshing the page and attempting again',
      'Check your internet connection',
      'Contact support if the issue persists'
    ]
  }
};

export function EnhancedDocumentErrorHandler({ error, onRetry, onDismiss }: EnhancedDocumentErrorHandlerProps) {
  // Defensive programming: normalize error object
  const normalizedError = normalizeError(error);
  const config = errorConfig[normalizedError.type] || errorConfig.unknown;
  const Icon = config.icon;

  return (
    <Alert variant="destructive" className="my-4">
      <Icon className={`h-4 w-4 ${config.color}`} />
      <AlertTitle className="flex items-center justify-between">
        {config.title}
        {onDismiss && (
          <Button variant="ghost" size="sm" onClick={onDismiss}>
            ×
          </Button>
        )}
      </AlertTitle>
      <AlertDescription className="space-y-3">
        <div className="font-medium">{normalizedError.message}</div>
        
        {normalizedError.details && (
          <div className="text-sm text-muted-foreground">
            <strong>Technical details:</strong> {normalizedError.details}
          </div>
        )}
        
        {normalizedError.code && (
          <div className="text-xs font-mono bg-muted p-2 rounded">
            Error Code: {normalizedError.code}
          </div>
        )}
        
        <div className="space-y-1">
          <div className="font-medium text-sm">What you can do:</div>
          <ul className="text-sm text-muted-foreground space-y-1">
            {config.suggestions.map((suggestion, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-xs mt-1">•</span>
                <span>{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>
        
        {normalizedError.retryable && onRetry && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onRetry}
            className="gap-2 mt-3"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}

// Normalize any error object to DocumentError format
function normalizeError(error: any): DocumentError {
  // If already a proper DocumentError, return as-is
  if (error && typeof error === 'object' && error.type && typeof error.message === 'string') {
    return error as DocumentError;
  }

  // Handle Error instances
  if (error instanceof Error) {
    return {
      type: 'unknown',
      message: error.message,
      details: error.stack,
      retryable: true
    };
  }

  // Handle string errors
  if (typeof error === 'string') {
    return {
      type: 'unknown',
      message: error,
      retryable: true
    };
  }

  // Handle any other object with message property
  if (error && typeof error === 'object' && error.message) {
    return {
      type: 'unknown',
      message: String(error.message),
      details: error.details || error.stack,
      code: error.code,
      retryable: true
    };
  }

  // Fallback for completely unknown error formats
  return {
    type: 'unknown',
    message: 'An unexpected error occurred',
    details: `Error object: ${JSON.stringify(error)}`,
    retryable: true
  };
}

// Helper function to create structured errors
export function createDocumentError(
  type: DocumentError['type'], 
  message: string, 
  details?: string, 
  code?: string,
  retryable: boolean = true
): DocumentError {
  return {
    type,
    message,
    details,
    code,
    retryable
  };
}

// Common error creators
export const DocumentErrors = {
  uploadFailed: (details: string, code?: string) => 
    createDocumentError('upload', 'Failed to upload document to storage', details, code),
    
  processingFailed: (details: string, code?: string) => 
    createDocumentError('processing', 'Unable to extract text from document', details, code),
    
  analysisFailed: (details: string, code?: string) => 
    createDocumentError('analysis', 'AI analysis could not be completed', details, code, false),
    
  networkError: (details: string) => 
    createDocumentError('network', 'Upload interrupted by connection issue', details),
    
  permissionDenied: (details: string, code?: string) => 
    createDocumentError('permission', 'You do not have permission to upload documents', details, code, false),
    
  storageError: (details: string, code?: string) => 
    createDocumentError('storage', 'Document storage service unavailable', details, code),
    
  integrationError: (details: string) => 
    createDocumentError('integration', 'Document uploaded but not integrated with analysis engines', details, undefined, false)
};