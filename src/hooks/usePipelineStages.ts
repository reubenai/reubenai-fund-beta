import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';

export type PipelineStage = Database['public']['Tables']['pipeline_stages']['Row'];

export const usePipelineStages = (fundId?: string) => {
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchStages = useCallback(async () => {
    if (!fundId) {
      console.log('📊 [usePipelineStages] No fundId provided');
      return;
    }

    try {
      setLoading(true);
      console.log('📊 [usePipelineStages] Fetching stages for fundId:', fundId);
      
      const { data, error } = await supabase
        .from('pipeline_stages')
        .select('*')
        .eq('fund_id', fundId)
        .order('position', { ascending: true });

      if (error) throw error;
      
      console.log('📊 [usePipelineStages] Fetched stages:', data?.length || 0, 'stages');
      console.log('📊 [usePipelineStages] Stage names:', data?.map(s => s.name) || []);
      
      setStages(data || []);
    } catch (error) {
      console.error('Error fetching pipeline stages:', error);
      toast({
        title: "Error",
        description: "Failed to load pipeline stages",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [fundId, toast]);

  const addStage = useCallback(async (name: string, color: string = '#6B7280') => {
    if (!fundId) return;

    try {
      const maxPosition = Math.max(...stages.map(s => s.position), -1);
      const { data, error } = await supabase
        .from('pipeline_stages')
        .insert({
          fund_id: fundId,
          name,
          color,
          position: maxPosition + 1,
          is_default: false
        })
        .select()
        .single();

      if (error) throw error;

      setStages(prev => [...prev, data]);
      toast({
        title: "Stage added",
        description: `"${name}" stage has been added to your pipeline`,
      });

      return data;
    } catch (error) {
      console.error('Error adding stage:', error);
      toast({
        title: "Error",
        description: "Failed to add stage",
        variant: "destructive"
      });
    }
  }, [fundId, stages, toast]);

  const updateStage = useCallback(async (stageId: string, updates: Partial<PipelineStage>) => {
    try {
      const { data, error } = await supabase
        .from('pipeline_stages')
        .update(updates)
        .eq('id', stageId)
        .select()
        .single();

      if (error) throw error;

      setStages(prev => prev.map(stage => 
        stage.id === stageId ? { ...stage, ...data } : stage
      ));

      toast({
        title: "Stage updated",
        description: "Pipeline stage has been updated",
      });

      return data;
    } catch (error) {
      console.error('Error updating stage:', error);
      toast({
        title: "Error",
        description: "Failed to update stage",
        variant: "destructive"
      });
    }
  }, [toast]);

  const reorderStages = useCallback(async (reorderedStages: PipelineStage[]) => {
    try {
      // Update positions
      const updates = reorderedStages.map((stage, index) => ({
        id: stage.id,
        position: index
      }));

      // Update all positions in batch
      for (const update of updates) {
        await supabase
          .from('pipeline_stages')
          .update({ position: update.position })
          .eq('id', update.id);
      }

      setStages(reorderedStages);
      toast({
        title: "Stages reordered",
        description: "Pipeline stage order has been updated",
      });
    } catch (error) {
      console.error('Error reordering stages:', error);
      toast({
        title: "Error",
        description: "Failed to reorder stages",
        variant: "destructive"
      });
      // Revert to original order
      fetchStages();
    }
  }, [toast, fetchStages]);

  const deleteStage = useCallback(async (stageId: string) => {
    try {
      // Check if stage has deals - convert stage name to deal status format
      const stageStatusKey = stages.find(s => s.id === stageId)?.name.toLowerCase().replace(/\s+/g, '_');
      const { data: deals, error: dealsError } = await supabase
        .from('deals')
        .select('id')
        .eq('status', stageStatusKey as any);

      if (dealsError) throw dealsError;

      if (deals && deals.length > 0) {
        toast({
          title: "Cannot delete stage",
          description: "This stage contains deals. Move or delete the deals first.",
          variant: "destructive"
        });
        return;
      }

      const { error } = await supabase
        .from('pipeline_stages')
        .delete()
        .eq('id', stageId);

      if (error) throw error;

      setStages(prev => prev.filter(stage => stage.id !== stageId));
      toast({
        title: "Stage deleted",
        description: "Pipeline stage has been removed",
      });
    } catch (error) {
      console.error('Error deleting stage:', error);
      toast({
        title: "Error",
        description: "Failed to delete stage",
        variant: "destructive"
      });
    }
  }, [stages, toast]);

  useEffect(() => {
    fetchStages();
  }, [fetchStages]);

  return {
    stages,
    loading,
    addStage,
    updateStage,
    reorderStages,
    deleteStage,
    refreshStages: fetchStages
  };
};