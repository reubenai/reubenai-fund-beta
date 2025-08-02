import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Settings, Save, RefreshCw, Target } from 'lucide-react';
import { useStrategyThresholds } from '@/hooks/useStrategyThresholds';
import { useFund } from '@/contexts/FundContext';
import { unifiedStrategyService } from '@/services/unifiedStrategyService';

export const RAGThresholdManager: React.FC = () => {
  const { selectedFund } = useFund();
  const { thresholds, loading, getRAGCategory } = useStrategyThresholds();
  const { toast } = useToast();
  const [localThresholds, setLocalThresholds] = useState(thresholds);
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    setLocalThresholds(thresholds);
  }, [thresholds]);

  const handleSave = async () => {
    if (!selectedFund?.id) return;

    setSaving(true);
    try {
      await unifiedStrategyService.updateFundStrategy(selectedFund.id, {
        exciting_threshold: localThresholds.exciting,
        promising_threshold: localThresholds.promising,
        needs_development_threshold: localThresholds.needs_development
      });

      toast({
        title: "Thresholds Updated",
        description: "RAG thresholds have been saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Failed to update RAG thresholds. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setLocalThresholds(thresholds);
  };

  const getPreviewCategory = (score: number) => {
    if (score >= localThresholds.exciting) {
      return { level: 'exciting', label: 'Exciting', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
    }
    if (score >= localThresholds.promising) {
      return { level: 'promising', label: 'Promising', color: 'bg-amber-100 text-amber-700 border-amber-200' };
    }
    if (score >= localThresholds.needs_development) {
      return { level: 'needs_development', label: 'Needs Development', color: 'bg-orange-100 text-orange-700 border-orange-200' };
    }
    return { level: 'not_aligned', label: 'Not Aligned', color: 'bg-red-100 text-red-700 border-red-200' };
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="w-5 h-5" />
          RAG Threshold Configuration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4">
          {/* Exciting Threshold */}
          <div className="space-y-2">
            <Label htmlFor="exciting">Exciting Threshold</Label>
            <div className="flex items-center gap-3">
              <Input
                id="exciting"
                type="number"
                min="1"
                max="100"
                value={localThresholds.exciting}
                onChange={(e) => setLocalThresholds({
                  ...localThresholds,
                  exciting: parseInt(e.target.value) || 0
                })}
                className="w-20"
              />
              <span className="text-sm text-muted-foreground">
                and above
              </span>
              <Badge variant="outline" className={getPreviewCategory(localThresholds.exciting).color}>
                {getPreviewCategory(localThresholds.exciting).label}
              </Badge>
            </div>
          </div>

          {/* Promising Threshold */}
          <div className="space-y-2">
            <Label htmlFor="promising">Promising Threshold</Label>
            <div className="flex items-center gap-3">
              <Input
                id="promising"
                type="number"
                min="1"
                max="100"
                value={localThresholds.promising}
                onChange={(e) => setLocalThresholds({
                  ...localThresholds,
                  promising: parseInt(e.target.value) || 0
                })}
                className="w-20"
              />
              <span className="text-sm text-muted-foreground">
                to {localThresholds.exciting - 1}
              </span>
              <Badge variant="outline" className={getPreviewCategory(localThresholds.promising).color}>
                {getPreviewCategory(localThresholds.promising).label}
              </Badge>
            </div>
          </div>

          {/* Needs Development Threshold */}
          <div className="space-y-2">
            <Label htmlFor="needs_development">Needs Development Threshold</Label>
            <div className="flex items-center gap-3">
              <Input
                id="needs_development"
                type="number"
                min="1"
                max="100"
                value={localThresholds.needs_development}
                onChange={(e) => setLocalThresholds({
                  ...localThresholds,
                  needs_development: parseInt(e.target.value) || 0
                })}
                className="w-20"
              />
              <span className="text-sm text-muted-foreground">
                to {localThresholds.promising - 1}
              </span>
              <Badge variant="outline" className={getPreviewCategory(localThresholds.needs_development).color}>
                {getPreviewCategory(localThresholds.needs_development).label}
              </Badge>
            </div>
          </div>

          {/* Not Aligned */}
          <div className="space-y-2">
            <Label>Not Aligned</Label>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">
                Below {localThresholds.needs_development}
              </span>
              <Badge variant="outline" className={getPreviewCategory(localThresholds.needs_development - 1).color}>
                {getPreviewCategory(localThresholds.needs_development - 1).label}
              </Badge>
            </div>
          </div>
        </div>

        <Separator />

        {/* Preview Examples */}
        <div className="space-y-3">
          <h4 className="font-medium">Preview Examples</h4>
          <div className="grid grid-cols-1 gap-3">
            {[95, 82, 65, 45, 25].map((score) => {
              const category = getPreviewCategory(score);
              return (
                <div key={score} className="flex items-center justify-between p-3 bg-muted rounded">
                  <span className="font-mono font-medium">{score}/100</span>
                  <Badge variant="outline" className={category.color}>
                    {category.label}
                  </Badge>
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button 
            onClick={handleSave} 
            disabled={saving || loading}
            className="flex items-center gap-2"
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
          </Button>
          <Button variant="outline" onClick={handleReset}>
            Reset
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};