import React, { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface ErrorOptions {
  title?: string;
  description?: string;
  retry?: () => void;
  silent?: boolean;
}

export function useErrorHandler() {
  const { toast } = useToast();

  const handleError = useCallback((error: unknown, options: ErrorOptions = {}) => {
    console.error('Error handled:', error);

    // Skip showing toast if silent mode
    if (options.silent) return;

    // Determine error message
    let errorMessage = 'An unexpected error occurred';
    
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    } else if (error && typeof error === 'object' && 'message' in error) {
      errorMessage = String(error.message);
    }

    // Common error patterns and user-friendly messages
    const errorMappings: Record<string, string> = {
      'network error': 'Unable to connect to our servers. Please check your internet connection.',
      'timeout': 'The request took too long. Please try again.',
      'unauthorized': 'You need to sign in to access this feature.',
      'forbidden': 'You don\'t have permission to perform this action.',
      'not found': 'The requested resource was not found.',
      'conflict': 'This action conflicts with existing data. Please refresh and try again.',
      'validation': 'Please check your input and try again.',
      'chunk load error': 'Failed to load application resources. Please refresh the page.'
    };

    // Find matching error pattern
    const friendlyMessage = Object.entries(errorMappings).find(([pattern]) => 
      errorMessage.toLowerCase().includes(pattern)
    )?.[1] || errorMessage;

    toast({
      title: options.title || 'Error',
      description: options.description || friendlyMessage,
      variant: 'destructive'
    });
  }, [toast]);

  const handleAsyncError = useCallback(async <T>(
    asyncFn: () => Promise<T>,
    options: ErrorOptions = {}
  ): Promise<T | null> => {
    try {
      return await asyncFn();
    } catch (error) {
      handleError(error, options);
      return null;
    }
  }, [handleError]);

  const withRetry = useCallback(async <T>(
    asyncFn: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000,
    options: ErrorOptions = {}
  ): Promise<T | null> => {
    let lastError: unknown;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await asyncFn();
      } catch (error) {
        lastError = error;
        
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt)));
          continue;
        }
      }
    }

    handleError(lastError, {
      ...options,
      description: options.description || `Failed after ${maxRetries + 1} attempts`
    });
    return null;
  }, [handleError]);

  return {
    handleError,
    handleAsyncError,
    withRetry
  };
}

// Global error handler for unhandled promises
export function setupGlobalErrorHandlers() {
  window.addEventListener('unhandledrejection', (event) => {
    const errorId = generateErrorId();
    console.error(`[ERROR ID: ${errorId}] Unhandled promise rejection:`, event.reason);
    
    // Create more detailed error logging
    const errorDetails = {
      id: errorId,
      type: 'unhandled_promise_rejection',
      reason: event.reason,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };
    
    console.error('Detailed error info:', errorDetails);
    
    // Prevent the default browser error message
    event.preventDefault();
    
    // Show user-friendly error with ID
    showErrorWithId(errorId, 'An unexpected error occurred', String(event.reason));
  });

  window.addEventListener('error', (event) => {
    const errorId = generateErrorId();
    console.error(`[ERROR ID: ${errorId}] Global error:`, event.error);
    
    const errorDetails = {
      id: errorId,
      type: 'global_error',
      message: event.error?.message || 'Unknown error',
      stack: event.error?.stack,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };
    
    console.error('Detailed error info:', errorDetails);
    
    // Show user-friendly error with ID
    showErrorWithId(errorId, 'An internal error occurred', event.error?.message || 'Unknown error');
  });
}

// Generate unique error ID
function generateErrorId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// Show error dialog with ID (mock implementation - you'd integrate with your toast/dialog system)
function showErrorWithId(errorId: string, title: string, message: string) {
  // This is a simple implementation - in a real app you'd use your toast system
  console.error(`User should see: ${title} (ID: ${errorId})`);
  
  // You could also trigger a toast notification here
  const event = new CustomEvent('global-error', {
    detail: { id: errorId, title, message }
  });
  window.dispatchEvent(event);
}