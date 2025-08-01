import { useState, useEffect } from 'react';
import { useFund } from '@/contexts/FundContext';
import { unifiedStrategyService } from '@/services/unifiedStrategyService';

export interface StrategyThresholds {
  exciting: number;
  promising: number;
  needs_development: number;
}

const DEFAULT_THRESHOLDS: StrategyThresholds = {
  exciting: 85,
  promising: 70,
  needs_development: 50
};

export function useStrategyThresholds() {
  const { selectedFund } = useFund();
  const [thresholds, setThresholds] = useState<StrategyThresholds>(DEFAULT_THRESHOLDS);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedFund?.id) {
      setThresholds(DEFAULT_THRESHOLDS);
      return;
    }

    const fetchThresholds = async () => {
      setLoading(true);
      try {
        const strategy = await unifiedStrategyService.getFundStrategy(selectedFund.id);
        
        if (strategy) {
          setThresholds({
            exciting: strategy.exciting_threshold || DEFAULT_THRESHOLDS.exciting,
            promising: strategy.promising_threshold || DEFAULT_THRESHOLDS.promising,
            needs_development: strategy.needs_development_threshold || DEFAULT_THRESHOLDS.needs_development
          });
        } else {
          setThresholds(DEFAULT_THRESHOLDS);
        }
      } catch (error) {
        console.error('Error fetching strategy thresholds:', error);
        setThresholds(DEFAULT_THRESHOLDS);
      } finally {
        setLoading(false);
      }
    };

    fetchThresholds();
  }, [selectedFund?.id]);

  const getRAGCategory = (score?: number): { level: string; label: string; color: string } => {
    if (!score) return { level: 'unknown', label: 'Unknown', color: 'bg-gray-100 text-gray-600' };
    
    if (score >= thresholds.exciting) {
      return { level: 'exciting', label: 'Exciting', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
    }
    if (score >= thresholds.promising) {
      return { level: 'promising', label: 'Promising', color: 'bg-amber-100 text-amber-700 border-amber-200' };
    }
    if (score >= thresholds.needs_development) {
      return { level: 'needs_development', label: 'Needs Development', color: 'bg-orange-100 text-orange-700 border-orange-200' };
    }
    
    return { level: 'not_aligned', label: 'Not Aligned', color: 'bg-red-100 text-red-700 border-red-200' };
  };

  return {
    thresholds,
    loading,
    getRAGCategory
  };
}