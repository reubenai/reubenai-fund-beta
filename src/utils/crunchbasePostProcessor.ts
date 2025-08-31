// Utility to manually trigger Crunchbase post-processor
import { supabase } from '@/integrations/supabase/client';

export async function triggerCrunchbasePostProcessor() {
  console.log('🔄 Triggering Crunchbase post-processor...');
  
  try {
    const { data, error } = await supabase.functions.invoke('deal2-crunchbase-export-post-processor', {
      body: {}
    });

    if (error) {
      throw new Error(error.message);
    }

    console.log('✅ Post-processor completed:', data);
    return data;
    
  } catch (error) {
    console.error('❌ Post-processor failed:', error);
    throw error;
  }
}

// Auto-trigger post-processor on import
triggerCrunchbasePostProcessor();