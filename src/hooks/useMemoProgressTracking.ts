import { useState, useCallback } from 'react';

export interface ProgressStage {
  id: string;
  name: string;
  status: 'pending' | 'active' | 'completed' | 'failed';
  progress: number;
  details?: string;
}

export interface MemoGenerationProgress {
  overall: number;
  currentStage: string;
  stages: ProgressStage[];
  isActive: boolean;
  error?: string;
}

const DEFAULT_STAGES: ProgressStage[] = [
  { id: 'data_gathering', name: 'Gathering Deal Data', status: 'pending', progress: 0 },
  { id: 'orchestrator', name: 'Invoking AI Orchestrator', status: 'pending', progress: 0 },
  { id: 'market_research', name: 'Market Intelligence', status: 'pending', progress: 0 },
  { id: 'thesis_alignment', name: 'Thesis Alignment Analysis', status: 'pending', progress: 0 },
  { id: 'specialist_engines', name: 'Specialist Analysis Engines', status: 'pending', progress: 0 },
  { id: 'ai_generation', name: 'AI Content Generation', status: 'pending', progress: 0 },
  { id: 'quality_validation', name: 'Quality Validation', status: 'pending', progress: 0 },
  { id: 'storage', name: 'Storing Memo', status: 'pending', progress: 0 }
];

export function useMemoProgressTracking() {
  const [progress, setProgress] = useState<MemoGenerationProgress>({
    overall: 0,
    currentStage: '',
    stages: DEFAULT_STAGES,
    isActive: false
  });

  const startProgress = useCallback(() => {
    setProgress({
      overall: 0,
      currentStage: 'data_gathering',
      stages: DEFAULT_STAGES.map(stage => ({ ...stage, status: 'pending', progress: 0 })),
      isActive: true
    });
  }, []);

  const updateStage = useCallback((stageId: string, status: ProgressStage['status'], progress: number = 0, details?: string) => {
    setProgress(prev => {
      const newStages = prev.stages.map(stage => {
        if (stage.id === stageId) {
          return { ...stage, status, progress, details };
        }
        return stage;
      });

      const completedStages = newStages.filter(s => s.status === 'completed').length;
      const overall = Math.round((completedStages / newStages.length) * 100);

      return {
        ...prev,
        stages: newStages,
        overall,
        currentStage: status === 'active' ? stageId : prev.currentStage
      };
    });
  }, []);

  const completeProgress = useCallback((success: boolean = true, error?: string) => {
    setProgress(prev => ({
      ...prev,
      overall: 100,
      isActive: false,
      error: success ? undefined : error,
      stages: prev.stages.map(stage => ({
        ...stage,
        status: success ? 'completed' : stage.status === 'active' ? 'failed' : stage.status,
        progress: success ? 100 : stage.progress
      }))
    }));
  }, []);

  const resetProgress = useCallback(() => {
    setProgress({
      overall: 0,
      currentStage: '',
      stages: DEFAULT_STAGES,
      isActive: false
    });
  }, []);

  return {
    progress,
    startProgress,
    updateStage,
    completeProgress,
    resetProgress
  };
}