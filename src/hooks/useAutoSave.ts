import { useEffect, useRef, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface AutoSaveOptions {
  onSave: () => Promise<void>;
  delay?: number;
  enabled?: boolean;
}

export function useAutoSave(data: any, { onSave, delay = 3000, enabled = true }: AutoSaveOptions) {
  const { toast } = useToast();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedDataRef = useRef<any>(null);
  const isSavingRef = useRef(false);

  const triggerAutoSave = useCallback(async () => {
    if (!enabled || isSavingRef.current) return;

    // Check if data has actually changed
    const currentDataString = JSON.stringify(data);
    const lastSavedDataString = JSON.stringify(lastSavedDataRef.current);
    
    if (currentDataString === lastSavedDataString) return;

    try {
      isSavingRef.current = true;
      await onSave();
      lastSavedDataRef.current = JSON.parse(JSON.stringify(data));
      
      toast({
        title: "Auto-saved",
        description: "Changes saved automatically",
        duration: 2000,
      });
    } catch (error) {
      console.error('Auto-save failed:', error);
      toast({
        title: "Auto-save failed",
        description: "Failed to save changes automatically",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      isSavingRef.current = false;
    }
  }, [data, onSave, enabled, toast]);

  useEffect(() => {
    if (!enabled || !data) return;

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    timeoutRef.current = setTimeout(triggerAutoSave, delay);

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, triggerAutoSave, delay, enabled]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    isAutoSaveEnabled: enabled,
    triggerManualSave: triggerAutoSave
  };
}