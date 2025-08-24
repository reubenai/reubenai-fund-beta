import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, FileText, CheckCircle } from 'lucide-react';

interface InitializeMemoSectionsButtonProps {
  onComplete?: () => void;
}

export const InitializeMemoSectionsButton: React.FC<InitializeMemoSectionsButtonProps> = ({ onComplete }) => {
  const [isInitializing, setIsInitializing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const handleInitialize = async () => {
    setIsInitializing(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('initialize-memo-sections');
      
      if (error) {
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to initialize memo sections');
      }

      toast.success(
        `✅ ${data.message}`, 
        {
          description: `${data.dealsInitialized} deals now have default memo sections`
        }
      );
      
      setIsComplete(true);
      onComplete?.();
      
    } catch (error) {
      console.error('Error initializing memo sections:', error);
      toast.error(
        'Failed to initialize memo sections',
        {
          description: error.message || 'Please try again'
        }
      );
    } finally {
      setIsInitializing(false);
    }
  };

  if (isComplete) {
    return (
      <Button variant="outline" disabled className="gap-2">
        <CheckCircle className="h-4 w-4 text-green-600" />
        Memo Sections Initialized
      </Button>
    );
  }

  return (
    <Button 
      onClick={handleInitialize}
      disabled={isInitializing}
      variant="default"
      className="gap-2"
    >
      {isInitializing ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Initializing...
        </>
      ) : (
        <>
          <FileText className="h-4 w-4" />
          Initialize Default Memo Sections
        </>
      )}
    </Button>
  );
};