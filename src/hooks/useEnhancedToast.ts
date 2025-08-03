import { useToast } from '@/hooks/use-toast';
import { useCallback } from 'react';

interface EnhancedToastOptions {
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
  duration?: number;
  actionLabel?: string;
  onAction?: () => void;
  persistent?: boolean;
  onDismiss?: () => void;
}

export function useEnhancedToast() {
  const { toast, dismiss } = useToast();

  const showToast = useCallback((options: EnhancedToastOptions) => {
    let description = options.description;
    
    // Add action hint to description if action provided
    if (options.actionLabel && options.onAction) {
      description = `${options.description || ''}\n\nClick to ${options.actionLabel.toLowerCase()}`;
    }

    const toastResult = toast({
      title: options.title,
      description: description,
      variant: options.variant,
      duration: options.persistent ? Infinity : options.duration,
      onClick: options.onAction,
    });

    return {
      id: toastResult.id,
      dismiss: () => {
        if (toastResult.dismiss) {
          toastResult.dismiss();
        } else {
          dismiss(toastResult.id);
        }
        options.onDismiss?.();
      }
    };
  }, [toast, dismiss]);

  const showMemoGenerationToast = useCallback((dealName: string, onNavigate: () => void) => {
    return showToast({
      title: "Memo Generated Successfully",
      description: `Professional investment memo ready for ${dealName}`,
      variant: "default",
      duration: 8000,
      actionLabel: "View Memo",
      onAction: onNavigate
    });
  }, [showToast]);

  const showAnalysisOutdatedToast = useCallback((dealName: string, onRefresh: () => void) => {
    return showToast({
      title: "Analysis Outdated",
      description: `${dealName} has been updated since the last analysis. Consider refreshing for the latest insights.`,
      variant: "default",
      duration: 10000,
      actionLabel: "Refresh Analysis",
      onAction: onRefresh
    });
  }, [showToast]);

  const showMemoErrorToast = useCallback((error: string, onRetry?: () => void) => {
    return showToast({
      title: "Memo Generation Failed",
      description: error,
      variant: "destructive",
      duration: 8000,
      actionLabel: onRetry ? "Retry" : undefined,
      onAction: onRetry
    });
  }, [showToast]);

  const showLoadingToast = useCallback((title: string, description: string, onCancel?: () => void) => {
    return showToast({
      title,
      description,
      variant: "default",
      persistent: true,
      actionLabel: onCancel ? "Cancel" : undefined,
      onAction: onCancel
    });
  }, [showToast]);

  return {
    showToast,
    showMemoGenerationToast,
    showAnalysisOutdatedToast,
    showMemoErrorToast,
    showLoadingToast,
    dismiss
  };
}