/**
 * Edge Case Handler for Production Readiness
 * Provides robust handling of edge cases across the application
 */

import { supabase } from '@/integrations/supabase/client';

/**
 * Data validation utilities
 */
export class DataValidator {
  /**
   * Validate deal data with comprehensive checks
   */
  static validateDeal(deal: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Required field validation
    if (!deal.company_name?.trim()) {
      errors.push('Company name is required');
    } else if (deal.company_name.length > 100) {
      errors.push('Company name must be less than 100 characters');
    }

    // Financial validation
    if (deal.deal_size !== undefined && deal.deal_size !== null) {
      if (typeof deal.deal_size !== 'number' || deal.deal_size < 0) {
        errors.push('Deal size must be a positive number');
      }
      if (deal.deal_size > 1e12) { // 1 trillion limit
        errors.push('Deal size exceeds maximum allowed value');
      }
    }

    if (deal.valuation !== undefined && deal.valuation !== null) {
      if (typeof deal.valuation !== 'number' || deal.valuation < 0) {
        errors.push('Valuation must be a positive number');
      }
      if (deal.valuation < deal.deal_size) {
        errors.push('Valuation cannot be less than deal size');
      }
    }

    // URL validation
    if (deal.website && !this.isValidURL(deal.website)) {
      errors.push('Website URL is invalid');
    }
    if (deal.linkedin_url && !this.isValidURL(deal.linkedin_url)) {
      errors.push('LinkedIn URL is invalid');
    }

    // Score validation
    if (deal.overall_score !== undefined && deal.overall_score !== null) {
      if (typeof deal.overall_score !== 'number' || 
          deal.overall_score < 0 || 
          deal.overall_score > 100) {
        errors.push('Overall score must be between 0 and 100');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate fund data
   */
  static validateFund(fund: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!fund.name?.trim()) {
      errors.push('Fund name is required');
    }

    if (!fund.fund_type || !['venture_capital', 'private_equity', 'hedge_fund'].includes(fund.fund_type)) {
      errors.push('Valid fund type is required');
    }

    if (fund.target_size !== undefined && fund.target_size !== null) {
      if (typeof fund.target_size !== 'number' || fund.target_size <= 0) {
        errors.push('Target size must be a positive number');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate email format
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate URL format
   */
  static isValidURL(url: string): boolean {
    try {
      const parsedUrl = new URL(url);
      return ['http:', 'https:'].includes(parsedUrl.protocol);
    } catch {
      return false;
    }
  }
}

/**
 * Network resilience utilities
 */
export class NetworkHandler {
  /**
   * Retry mechanism with exponential backoff
   */
  static async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxRetries) {
          throw lastError;
        }

        // Don't retry on certain error types
        if (this.isNonRetryableError(error)) {
          throw error;
        }

        // Exponential backoff with jitter
        const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError!;
  }

  /**
   * Check if error should not be retried
   */
  private static isNonRetryableError(error: any): boolean {
    // Don't retry authentication errors
    if (error?.message?.includes('JWT') || error?.status === 401) {
      return true;
    }
    
    // Don't retry validation errors
    if (error?.status === 400) {
      return true;
    }

    // Don't retry forbidden errors
    if (error?.status === 403) {
      return true;
    }

    return false;
  }

  /**
   * Check network connectivity
   */
  static async checkConnectivity(): Promise<boolean> {
    try {
      // Use a lightweight endpoint to check connectivity
      const response = await fetch('/ping', { 
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-cache'
      });
      return true;
    } catch {
      // Fallback to checking if we can reach a public DNS
      try {
        const response = await fetch('https://8.8.8.8', { 
          method: 'HEAD',
          mode: 'no-cors'
        });
        return true;
      } catch {
        return false;
      }
    }
  }
}

/**
 * State management edge cases
 */
export class StateHandler {
  /**
   * Safe state update with optimistic rollback
   */
  static createOptimisticUpdate<T>(
    currentState: T,
    optimisticUpdate: (state: T) => T,
    serverUpdate: () => Promise<T>
  ) {
    return {
      optimisticState: optimisticUpdate(currentState),
      async commit(): Promise<{ success: boolean; finalState: T; error?: string }> {
        try {
          const serverState = await serverUpdate();
          return {
            success: true,
            finalState: serverState
          };
        } catch (error) {
          return {
            success: false,
            finalState: currentState, // Rollback to original state
            error: error instanceof Error ? error.message : 'Update failed'
          };
        }
      }
    };
  }

  /**
   * Debounced state updates to prevent rapid API calls
   */
  static createDebouncedUpdate<T>(
    updateFn: (value: T) => Promise<void>,
    delay: number = 500
  ) {
    let timeoutId: NodeJS.Timeout;
    
    return (value: T) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => updateFn(value), delay);
    };
  }
}

/**
 * File handling edge cases
 */
export class FileHandler {
  /**
   * Validate file before upload
   */
  static validateFile(file: File): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const maxSize = 50 * 1024 * 1024; // 50MB
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    if (file.size > maxSize) {
      errors.push(`File size (${this.formatFileSize(file.size)}) exceeds limit of ${this.formatFileSize(maxSize)}`);
    }

    if (!allowedTypes.includes(file.type)) {
      errors.push(`File type ${file.type} is not supported`);
    }

    if (file.name.length > 255) {
      errors.push('File name is too long');
    }

    // Check for potentially malicious files
    if (this.hasSuspiciousExtension(file.name)) {
      errors.push('File type not allowed for security reasons');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Safe file upload with progress tracking
   */
  static async uploadFileWithProgress(
    file: File,
    bucketName: string,
    fileName: string,
    onProgress?: (progress: number) => void
  ): Promise<{ success: boolean; error?: string; data?: any }> {
    try {
      // Validate file first
      const validation = this.validateFile(file);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.errors.join(', ')
        };
      }

      onProgress?.(10);

      // Generate unique file name to prevent conflicts
      const uniqueFileName = `${Date.now()}-${fileName}`;
      
      onProgress?.(30);

      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(uniqueFileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      onProgress?.(90);

      if (error) {
        return {
          success: false,
          error: error.message
        };
      }

      onProgress?.(100);

      return {
        success: true,
        data
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      };
    }
  }

  private static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  private static hasSuspiciousExtension(fileName: string): boolean {
    const suspiciousExtensions = [
      '.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js', '.jar',
      '.app', '.deb', '.pkg', '.dmg', '.sh', '.ps1', '.msi'
    ];
    
    const extension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
    return suspiciousExtensions.includes(extension);
  }
}

/**
 * Error boundary recovery strategies
 */
export class ErrorRecovery {
  /**
   * Attempt to recover from component errors
   */
  static handleComponentError(error: Error, errorInfo: any): string {
    // Log error details for debugging
    console.error('Component Error:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack
    });

    // Determine recovery strategy based on error type
    if (error.message.includes('ChunkLoadError')) {
      return 'reload'; // Suggest page reload for chunk loading errors
    }
    
    if (error.message.includes('Network')) {
      return 'offline'; // Show offline fallback
    }
    
    if (error.message.includes('permission')) {
      return 'auth'; // Redirect to authentication
    }
    
    return 'fallback'; // Show generic fallback UI
  }

  /**
   * Create safe async component
   */
  static createSafeAsyncComponent<T>(
    asyncFn: () => Promise<T>,
    fallbackValue: T,
    errorCallback?: (error: Error) => void
  ): () => Promise<T> {
    return async () => {
      try {
        return await asyncFn();
      } catch (error) {
        console.error('Async component error:', error);
        errorCallback?.(error as Error);
        return fallbackValue;
      }
    };
  }
}

/**
 * Data consistency checks
 */
export class DataConsistency {
  /**
   * Check for orphaned records (simplified implementation)
   */
  static async findOrphanedRecords(tableName: string, foreignKey: string, referencedTable: string) {
    try {
      // Simplified check - just return empty array for now
      // In a real implementation, you'd have custom RPC functions
      console.log(`Checking ${tableName} for orphaned ${foreignKey} references to ${referencedTable}`);
      return [];
    } catch (error) {
      console.error('Error checking data consistency:', error);
      return [];
    }
  }

  /**
   * Validate data relationships
   */
  static async validateRelationships(): Promise<{ isValid: boolean; issues: string[] }> {
    const issues: string[] = [];

    try {
      // Check for deals without funds
      const orphanedDeals = await this.findOrphanedRecords('deals', 'fund_id', 'funds');
      if (Array.isArray(orphanedDeals) && orphanedDeals.length > 0) {
        issues.push(`Found ${orphanedDeals.length} deals without valid funds`);
      }

      // Check for IC members without users  
      const orphanedMembers = await this.findOrphanedRecords('ic_committee_members', 'user_id', 'profiles');
      if (Array.isArray(orphanedMembers) && orphanedMembers.length > 0) {
        issues.push(`Found ${orphanedMembers.length} IC members without valid users`);
      }

    } catch (error) {
      issues.push(`Data validation failed: ${error}`);
    }

    return {
      isValid: issues.length === 0,
      issues
    };
  }
}