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
      const { data, error } = await supabase
        .from('pipeline_stages')
        .select('*')
        .eq('fund_id', fundId)
        .order('position', { ascending: true });

      console.log('🔧 [DebugPipelineStages] Direct fetch result:', { data, error });
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
    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
      <h3 className="font-semibold text-red-800 mb-2">DEBUG: Pipeline Stages Direct Fetch</h3>
      <p className="text-sm text-red-600 mb-2">Fund ID: {fundId}</p>
      <Button onClick={fetchDirectly} disabled={loading} size="sm">
        {loading ? 'Fetching...' : 'Fetch Directly'}
      </Button>
      <div className="mt-2">
        <p className="text-sm">Direct stages count: {directStages.length}</p>
        {directStages.length > 0 && (
          <ul className="text-xs mt-1">
            {directStages.map(stage => (
              <li key={stage.id}>{stage.position}: {stage.name}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};