import { useState, useCallback } from 'react';

interface MemoVersion {
  id: string;
  version: number;
  content: any;
  created_at: string;
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
    // For now, return empty versions until database types are updated
    setVersionState(prev => ({ ...prev, isLoading: false }));
  }, []);

  const saveVersion = useCallback(async (content: any, description?: string) => {
    try {
      // Create a simple in-memory version for now
      const newVersion: MemoVersion = {
        id: `version-${Date.now()}`,
        version: versionState.currentVersion + 1,
        content,
        created_at: new Date().toISOString(),
        description: description || `Version ${versionState.currentVersion + 1}`
      };

      setVersionState(prev => ({
        ...prev,
        versions: [newVersion, ...prev.versions],
        currentVersion: newVersion.version
      }));

      return newVersion;
    } catch (error) {
      console.error('Error saving memo version:', error);
      throw error;
    }
  }, [versionState.currentVersion]);

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