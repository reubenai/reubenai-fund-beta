import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import { toast } from 'sonner';
import { AlertTriangle, Settings, Zap } from 'lucide-react';

const PHASE_COLORS = {
  'Phase A': 'bg-blue-500',
  'Phase B': 'bg-green-500', 
  'Phase C': 'bg-yellow-500',
  'Phase D': 'bg-purple-500'
};

const FLAG_METADATA = {
  'promptcache_v1': {
    phase: 'Phase A',
    title: 'Prompt Caching',
    description: 'Cache prompts and responses for better performance',
    risk: 'low'
  },
  'guardrails_v1': {
    phase: 'Phase A', 
    title: 'Privacy Guardrails',
    description: 'PII detection and tenant isolation enforcement',
    risk: 'low'
  },
  'retrieval_hybrid_v1': {
    phase: 'Phase B',
    title: 'Hybrid Retrieval',
    description: 'Vector + lexical search with re-ranking',
    risk: 'medium'
  },
  'feature_store_v1': {
    phase: 'Phase C',
    title: 'Feature Store',
    description: 'Structured feature extraction and storage',
    risk: 'medium'
  },
  'scoring_v2': {
    phase: 'Phase C',
    title: 'Feature-First Scoring',
    description: 'Score deals based on extracted features',
    risk: 'high'
  },
  'ic_memo_drafter_v1': {
    phase: 'Phase D',
    title: 'IC Memo Generation',
    description: 'Automated memo drafting with citations',
    risk: 'high'
  }
};

export function FeatureFlagsPanel() {
  const { flags, flagConfigs, loading, toggleFlag } = useFeatureFlags();

  const handleToggle = async (flagName: string, value: boolean) => {
    try {
      await toggleFlag(flagName, value);
      toast.success(`${FLAG_METADATA[flagName as keyof typeof FLAG_METADATA]?.title || flagName} ${value ? 'enabled' : 'disabled'}`);
    } catch (error) {
      toast.error('Failed to update feature flag');
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Feature Flags
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-muted/50 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Feature Flags
        </CardTitle>
        <CardDescription>
          Control rollout phases for the ReubenAI platform upgrade
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {Object.entries(FLAG_METADATA).map(([flagName, metadata]) => {
          const isEnabled = flags[flagName] || false;
          const config = flagConfigs[flagName] || {};
          
          return (
            <div 
              key={flagName}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{metadata.title}</span>
                  <Badge 
                    variant="outline" 
                    className={`text-white ${PHASE_COLORS[metadata.phase as keyof typeof PHASE_COLORS]}`}
                  >
                    {metadata.phase}
                  </Badge>
                  {metadata.risk === 'high' && (
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  )}
                  {isEnabled && (
                    <Zap className="h-4 w-4 text-green-500" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {metadata.description}
                </p>
                {config.description && (
                  <p className="text-xs text-muted-foreground italic">
                    {config.description}
                  </p>
                )}
              </div>
              <Switch
                checked={isEnabled}
                onCheckedChange={(value) => handleToggle(flagName, value)}
                disabled={metadata.risk === 'high' && !isEnabled} // Require manual confirmation for high-risk flags
              />
            </div>
          );
        })}
        
        <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-yellow-800 dark:text-yellow-200">
                Rollout Safety
              </p>
              <p className="text-yellow-700 dark:text-yellow-300 mt-1">
                High-risk flags (scoring_v2, ic_memo_drafter_v1) should only be enabled after 
                phase-specific acceptance tests pass. Monitor system performance closely.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}