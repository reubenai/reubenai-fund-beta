import { supabase } from '@/integrations/supabase/client';

interface KillSwitchState {
  switchName: string;
  isActive: boolean;
  reason?: string;
  activatedBy?: string;
  activatedAt?: string;
  expiresAt?: string;
}

/**
 * Global and Per-Engine Kill Switch System
 * Provides immediate shutdown capability for analysis functions
 */
export class KillSwitchManager {
  private static readonly CACHE_TTL_MS = 30 * 1000; // 30 seconds cache
  private static cache = new Map<string, { state: KillSwitchState; cacheTime: number }>();

  /**
   * Check if a kill switch is active (with caching for performance)
   */
  static async isActive(switchName: string): Promise<boolean> {
    const cached = this.cache.get(switchName);
    const now = Date.now();

    // Use cached value if fresh
    if (cached && (now - cached.cacheTime) < this.CACHE_TTL_MS) {
      if (cached.state.expiresAt && new Date(cached.state.expiresAt) < new Date()) {
        return false; // Expired kill switch
      }
      return cached.state.isActive;
    }

    // Fetch from database
    try {
      const { data, error } = await supabase
        .from('kill_switches' as any)
        .select('*')
        .eq('switch_name', switchName)
        .eq('is_active', true)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error(`Kill switch check failed for ${switchName}:`, error);
        return false; // Fail open for safety
      }

      const state: KillSwitchState = data ? {
        switchName: (data as any).switch_name,
        isActive: (data as any).is_active,
        reason: (data as any).reason,
        activatedBy: (data as any).activated_by,
        activatedAt: (data as any).activated_at,
        expiresAt: (data as any).expires_at
      } : {
        switchName,
        isActive: false
      };

      // Cache the result
      this.cache.set(switchName, { state, cacheTime: now });

      // Check expiration
      if (state.expiresAt && new Date(state.expiresAt) < new Date()) {
        return false;
      }

      return state.isActive;
    } catch (error) {
      console.error(`Kill switch check error for ${switchName}:`, error);
      return false; // Fail open
    }
  }

  /**
   * Activate a kill switch
   */
  static async activate(
    switchName: string, 
    reason: string, 
    activatedBy: string,
    expirationHours?: number
  ): Promise<boolean> {
    try {
      const expiresAt = expirationHours 
        ? new Date(Date.now() + expirationHours * 60 * 60 * 1000).toISOString()
        : undefined;

      const { error } = await supabase
        .from('kill_switches' as any)
        .upsert({
          switch_name: switchName,
          is_active: true,
          reason,
          activated_by: activatedBy,
          activated_at: new Date().toISOString(),
          expires_at: expiresAt
        }, {
          onConflict: 'switch_name'
        });

      if (error) {
        console.error(`Failed to activate kill switch ${switchName}:`, error);
        return false;
      }

      // Clear cache to force refresh
      this.cache.delete(switchName);

      console.log(`🚨 Kill switch ACTIVATED: ${switchName} - ${reason}`);
      return true;
    } catch (error) {
      console.error(`Error activating kill switch ${switchName}:`, error);
      return false;
    }
  }

  /**
   * Deactivate a kill switch
   */
  static async deactivate(switchName: string, deactivatedBy: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('kill_switches' as any)
        .update({
          is_active: false,
          deactivated_by: deactivatedBy,
          deactivated_at: new Date().toISOString()
        })
        .eq('switch_name', switchName);

      if (error) {
        console.error(`Failed to deactivate kill switch ${switchName}:`, error);
        return false;
      }

      // Clear cache to force refresh
      this.cache.delete(switchName);

      console.log(`✅ Kill switch DEACTIVATED: ${switchName}`);
      return true;
    } catch (error) {
      console.error(`Error deactivating kill switch ${switchName}:`, error);
      return false;
    }
  }

  /**
   * Check global analysis kill switch
   */
  static async isAnalysisDisabled(): Promise<boolean> {
    return this.isActive('global_analysis');
  }

  /**
   * Check engine-specific kill switch
   */
  static async isEngineDisabled(engineName: string): Promise<boolean> {
    return this.isActive(`engine_${engineName}`);
  }

  /**
   * Emergency shutdown of all analysis
   */
  static async emergencyShutdown(reason: string, activatedBy: string): Promise<boolean> {
    const switches = [
      'global_analysis',
      'engine_enhanced_deal_analysis',
      'engine_document_processor', 
      'engine_notes_intelligence',
      'engine_strategy_manager',
      'queue_processor'
    ];

    let allSucceeded = true;
    for (const switchName of switches) {
      const success = await this.activate(switchName, reason, activatedBy, 24); // 24 hour expiry
      if (!success) {
        allSucceeded = false;
      }
    }

    if (allSucceeded) {
      console.log('🚨 EMERGENCY SHUTDOWN ACTIVATED - All analysis functions disabled');
    } else {
      console.error('⚠️ PARTIAL EMERGENCY SHUTDOWN - Some kill switches failed to activate');
    }

    return allSucceeded;
  }

  /**
   * Get all active kill switches
   */
  static async getActiveKillSwitches(): Promise<KillSwitchState[]> {
    try {
      const { data, error } = await supabase
        .from('kill_switches' as any)
        .select('*')
        .eq('is_active', true);

      if (error) {
        console.error('Failed to get active kill switches:', error);
        return [];
      }

      return data?.map((row: any) => ({
        switchName: row.switch_name,
        isActive: row.is_active,
        reason: row.reason,
        activatedBy: row.activated_by,
        activatedAt: row.activated_at,
        expiresAt: row.expires_at
      })) || [];
    } catch (error) {
      console.error('Error getting active kill switches:', error);
      return [];
    }
  }

  /**
   * Clear expired kill switches
   */
  static async cleanupExpired(): Promise<void> {
    try {
      const { error } = await supabase
        .from('kill_switches' as any)
        .update({ is_active: false })
        .eq('is_active', true)
        .lt('expires_at', new Date().toISOString());

      if (error) {
        console.error('Failed to cleanup expired kill switches:', error);
      } else {
        console.log('✅ Expired kill switches cleaned up');
      }

      // Clear cache after cleanup
      this.cache.clear();
    } catch (error) {
      console.error('Error during kill switch cleanup:', error);
    }
  }

  /**
   * Clear all cached states (force refresh)
   */
  static clearCache(): void {
    this.cache.clear();
  }
}