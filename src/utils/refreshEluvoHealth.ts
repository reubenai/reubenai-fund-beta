// Quick utility to refresh Eluvo Health analysis
import { supabase } from '@/integrations/supabase/client';

export async function refreshEluvoHealthAnalysis() {
  const dealId = '81c22db4-51bb-4c8a-b8e0-ec17918af497';
  
  try {
    console.log('🔄 Triggering force refresh for Eluvo Health...');
    
    const { data, error } = await supabase.functions.invoke('force-analysis-refresh', {
      body: { 
        dealId,
        skipGoogleSearch: true, // Skip to avoid quota issues
        forceRefresh: true
      }
    });

    if (error) {
      throw new Error(error.message);
    }

    console.log('✅ Force refresh completed:', data);
    return data;
    
  } catch (error) {
    console.error('❌ Force refresh failed:', error);
    throw error;
  }
}

// Auto-trigger refresh
refreshEluvoHealthAnalysis();