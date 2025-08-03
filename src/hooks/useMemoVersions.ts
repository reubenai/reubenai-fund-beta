import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface MemoVersion {
  id: string;
  version: number;
  content: any;
  created_at: string;
  created_by: string;
  description?: string;
}

interface MemoVersionState {
  versions: MemoVersion[];
  currentVersion: number;
  isLoading: boolean;
}

export function useMemoVersions(dealId: string, fundId: string) {
  const [versionState, setVersionState] = useState<MemoVersionState>({
    versions: [],
    currentVersion: 1,
    isLoading: false
  });

  const loadVersions = useCallback(async () => {
    setVersionState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const { data, error } = await supabase
        .from('ic_memo_versions')
        .select('*')
        .eq('deal_id', dealId)
        .eq('fund_id', fundId)
        .order('version', { ascending: false });

      if (error) throw error;

      setVersionState(prev => ({
        ...prev,
        versions: data || [],
        isLoading: false
      }));
    } catch (error) {
      console.error('Error loading memo versions:', error);
      setVersionState(prev => ({ ...prev, isLoading: false }));
    }
  }, [dealId, fundId]);

  const saveVersion = useCallback(async (content: any, description?: string) => {
    try {
      // Get current max version
      const maxVersion = Math.max(0, ...versionState.versions.map(v => v.version));
      const newVersion = maxVersion + 1;

      const { data, error } = await supabase
        .from('ic_memo_versions')
        .insert({
          deal_id: dealId,
          fund_id: fundId,
          version: newVersion,
          content,
          description: description || `Version ${newVersion}`,
          created_by: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();

      if (error) throw error;

      setVersionState(prev => ({
        ...prev,
        versions: [data, ...prev.versions],
        currentVersion: newVersion
      }));

      return data;
    } catch (error) {
      console.error('Error saving memo version:', error);
      throw error;
    }
  }, [dealId, fundId, versionState.versions]);

  const restoreVersion = useCallback(async (versionId: string) => {
    try {
      const version = versionState.versions.find(v => v.id === versionId);
      if (!version) throw new Error('Version not found');

      // Update current memo with version content
      const { error } = await supabase
        .from('ic_memos')
        .upsert({
          deal_id: dealId,
          fund_id: fundId,
          memo_content: version.content,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      setVersionState(prev => ({
        ...prev,
        currentVersion: version.version
      }));

      return version.content;
    } catch (error) {
      console.error('Error restoring memo version:', error);
      throw error;
    }
  }, [dealId, fundId, versionState.versions]);

  return {
    versionState,
    loadVersions,
    saveVersion,
    restoreVersion
  };
}