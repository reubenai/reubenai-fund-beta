import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { MemoVersion } from '@/types/memo';

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
    try {
      setVersionState(prev => ({ ...prev, isLoading: true }));
      
      const { data: versions, error } = await supabase
        .from('ic_memo_versions')
        .select('*')
        .eq('deal_id', dealId)
        .eq('fund_id', fundId)
        .order('version', { ascending: false });

      if (error) throw error;

      const mappedVersions = versions?.map(v => ({
        id: v.id,
        version: v.version,
        content: v.content,
        created_at: v.created_at,
        created_by: v.created_by || 'system',
        description: v.description || `Version ${v.version}`
      })) || [];

      const currentVersion = Math.max(...(versions?.map(v => v.version) || [0]), 1);

      setVersionState({
        versions: mappedVersions,
        currentVersion,
        isLoading: false
      });
    } catch (error) {
      console.error('Error loading memo versions:', error);
      setVersionState(prev => ({ ...prev, isLoading: false }));
    }
  }, [dealId, fundId]);

  const saveVersion = useCallback(async (content: any, description?: string) => {
    try {
      const nextVersion = versionState.currentVersion + 1;
      
      const { data: newVersion, error } = await supabase
        .from('ic_memo_versions')
        .insert({
          deal_id: dealId,
          fund_id: fundId,
          version: nextVersion,
          content,
          description: description || `Version ${nextVersion}`,
          created_by: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();

      if (error) throw error;

      const mappedVersion: MemoVersion = {
        id: newVersion.id,
        version: newVersion.version,
        content: newVersion.content,
        created_at: newVersion.created_at,
        created_by: newVersion.created_by || 'system',
        description: newVersion.description || `Version ${newVersion.version}`
      };

      setVersionState(prev => ({
        ...prev,
        versions: [mappedVersion, ...prev.versions],
        currentVersion: nextVersion
      }));

      return mappedVersion;
    } catch (error) {
      console.error('Error saving memo version:', error);
      throw error;
    }
  }, [dealId, fundId, versionState.currentVersion]);

  const restoreVersion = useCallback(async (versionId: string) => {
    try {
      const version = versionState.versions.find(v => v.id === versionId);
      if (!version) throw new Error('Version not found');

      setVersionState(prev => ({
        ...prev,
        currentVersion: version.version
      }));

      return version.content;
    } catch (error) {
      console.error('Error restoring memo version:', error);
      throw error;
    }
  }, [versionState.versions]);

  return {
    versionState,
    loadVersions,
    saveVersion,
    restoreVersion
  };
}