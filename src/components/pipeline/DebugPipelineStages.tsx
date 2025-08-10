import React from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';

interface DebugPipelineStagesProps {
  fundId: string;
}

export const DebugPipelineStages: React.FC<DebugPipelineStagesProps> = ({ fundId }) => {
  const [directStages, setDirectStages] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);

  const fetchDirectly = async () => {
    setLoading(true);
    console.log('🔧 [DebugPipelineStages] Direct database fetch for fundId:', fundId);
    
    try {
      // First, check user authentication
      const { data: { user } } = await supabase.auth.getUser();
      console.log('🔧 [DebugPipelineStages] Current user:', user?.email);
      
      // Then fetch stages with detailed error logging
      const { data, error, count } = await supabase
        .from('pipeline_stages')
        .select('*', { count: 'exact' })
        .eq('fund_id', fundId)
        .order('position', { ascending: true });

      console.log('🔧 [DebugPipelineStages] Direct fetch result:', { 
        data, 
        error: error?.message || 'none',
        count,
        user: user?.email 
      });
      
      if (error) {
        console.error('🔧 [DebugPipelineStages] Database error:', error);
      }
      
      setDirectStages(data || []);
    } catch (err) {
      console.error('🔧 [DebugPipelineStages] Direct fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchDirectly();
  }, [fundId]);

  return (
    <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-6">
      <h3 className="font-semibold text-red-800 mb-2">🚨 CRITICAL DEBUG: Pipeline Stages</h3>
      <div className="space-y-2 text-sm">
        <p><strong>Fund ID:</strong> {fundId}</p>
        <Button onClick={fetchDirectly} disabled={loading} size="sm" className="mr-2">
          {loading ? 'Fetching...' : 'Test Direct DB Fetch'}
        </Button>
        <div className="bg-white p-2 rounded border">
          <p><strong>Direct stages count:</strong> {directStages.length}</p>
          {directStages.length > 0 && (
            <div className="mt-1">
              <p><strong>Stage names:</strong></p>
              <ul className="text-xs mt-1 list-disc list-inside">
                {directStages.map(stage => (
                  <li key={stage.id}>{stage.position}: {stage.name}</li>
                ))}
              </ul>
            </div>
          )}
          {directStages.length === 0 && (
            <p className="text-red-600 text-xs">❌ No stages returned - RLS or permission issue</p>
          )}
        </div>
      </div>
    </div>
  );
};