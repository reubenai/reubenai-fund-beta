import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function useEmergencyFix() {
  const { toast } = useToast();

  const triggerEmergencyFix = async () => {
    try {
      console.log('🚨 Triggering emergency data fix...');
      
      const { data, error } = await supabase.functions.invoke('emergency-data-fix', {
        body: {}
      });

      if (error) {
        console.error('❌ Emergency fix failed:', error);
        toast({
          title: "Emergency Fix Failed",
          description: "Could not fix analysis data. Please try again.",
          variant: "destructive"
        });
        return false;
      }

      console.log('✅ Emergency fix completed:', data);
      toast({
        title: "Emergency Fix Applied",
        description: "Analysis data has been restored and queue cleared.",
      });
      
      return true;
    } catch (error) {
      console.error('❌ Emergency fix error:', error);
      toast({
        title: "Emergency Fix Error",
        description: "An unexpected error occurred during the fix.",
        variant: "destructive"
      });
      return false;
    }
  };

  return { triggerEmergencyFix };
}