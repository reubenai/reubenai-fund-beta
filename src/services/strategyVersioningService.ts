import { supabase } from '@/integrations/supabase/client';

export interface StrategyVersion {
  id: string;
  strategy_id: string;
  version_number: number;
  strategy_snapshot: any;
  changed_by: string;
  change_reason?: string;
  created_at: string;
}

export class StrategyVersioningService {
  
  // Get all versions for a strategy
  async getStrategyVersions(strategyId: string): Promise<StrategyVersion[]> {
    const { data, error } = await supabase
      .from('investment_strategy_versions')
      .select('*')
      .eq('strategy_id', strategyId)
      .order('version_number', { ascending: false });
      
    if (error) {
      console.error('Error fetching strategy versions:', error);
      throw new Error(`Failed to fetch strategy versions: ${error.message}`);
    }
    
    return data as StrategyVersion[];
  }
  
  // Get specific version of a strategy
  async getStrategyVersion(strategyId: string, versionNumber: number): Promise<StrategyVersion | null> {
    const { data, error } = await supabase
      .from('investment_strategy_versions')
      .select('*')
      .eq('strategy_id', strategyId)
      .eq('version_number', versionNumber)
      .maybeSingle();
      
    if (error) {
      console.error('Error fetching strategy version:', error);
      throw new Error(`Failed to fetch strategy version: ${error.message}`);
    }
    
    return data as StrategyVersion | null;
  }
  
  // Restore strategy to a previous version (super admin only)
  async restoreStrategyVersion(strategyId: string, versionNumber: number, reason: string): Promise<boolean> {
    try {
      // Get the version to restore
      const version = await this.getStrategyVersion(strategyId, versionNumber);
      if (!version) {
        throw new Error(`Version ${versionNumber} not found for strategy ${strategyId}`);
      }
      
      // Extract the strategy data from snapshot (exclude audit fields)
      const { id, created_at, updated_at, ...restoreData } = version.strategy_snapshot;
      
      // Update the current strategy with the snapshot data
      const { data, error } = await supabase
        .from('investment_strategies')
        .update({
          ...restoreData,
          updated_at: new Date().toISOString()
        })
        .eq('id', strategyId)
        .select()
        .single();
        
      if (error) {
        console.error('Error restoring strategy version:', error);
        throw new Error(`Failed to restore strategy version: ${error.message}`);
      }
      
      // Log the restoration
      console.log(`✅ Strategy ${strategyId} restored to version ${versionNumber}`, { reason });
      
      return true;
    } catch (error) {
      console.error('Error in restoreStrategyVersion:', error);
      throw error;
    }
  }
  
  // Create manual version snapshot (useful for major changes)
  async createManualVersion(strategyId: string, reason: string): Promise<StrategyVersion> {
    try {
      // Get current strategy data
      const { data: currentStrategy, error: fetchError } = await supabase
        .from('investment_strategies')
        .select('*')
        .eq('id', strategyId)
        .single();
        
      if (fetchError) {
        throw new Error(`Failed to fetch current strategy: ${fetchError.message}`);
      }
      
      // Get next version number
      const { data: lastVersion } = await supabase
        .from('investment_strategy_versions')
        .select('version_number')
        .eq('strategy_id', strategyId)
        .order('version_number', { ascending: false })
        .limit(1)
        .maybeSingle();
        
      const nextVersion = (lastVersion?.version_number || 0) + 1;
      
      // Create version record
      const { data, error } = await supabase
        .from('investment_strategy_versions')
        .insert({
          strategy_id: strategyId,
          version_number: nextVersion,
          strategy_snapshot: currentStrategy,
          changed_by: (await supabase.auth.getUser()).data.user?.id || '00000000-0000-0000-0000-000000000000',
          change_reason: reason
        })
        .select()
        .single();
        
      if (error) {
        throw new Error(`Failed to create manual version: ${error.message}`);
      }
      
      console.log(`✅ Manual version ${nextVersion} created for strategy ${strategyId}`);
      return data as StrategyVersion;
    } catch (error) {
      console.error('Error creating manual version:', error);
      throw error;
    }
  }
}

export const strategyVersioningService = new StrategyVersioningService();