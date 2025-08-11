import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus, Target, TrendingUp } from 'lucide-react';

interface ProfessionalEmptyStateProps {
  fundName?: string;
  onAddDeal?: () => void;
  onBatchUpload?: () => void;
}

export function ProfessionalEmptyState({ 
  fundName, 
  onAddDeal, 
  onBatchUpload 
}: ProfessionalEmptyStateProps) {
  return (
    <div className="h-full flex items-center justify-center px-4">
      <Card className="w-full max-w-2xl p-8 text-center bg-gradient-to-br from-background to-muted/20 border-border/40">
        <div className="space-y-6">
          {/* Header */}
          <div className="space-y-3">
            <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
              <Target className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl font-semibold text-foreground">
              Welcome to Your Deal Pipeline
            </h2>
            {fundName && (
              <p className="text-lg text-muted-foreground">
                <span className="font-medium text-primary">{fundName}</span> is ready for deal flow
              </p>
            )}
          </div>

          {/* Value Proposition */}
          <div className="space-y-4 text-left max-w-md mx-auto">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-primary/5">
              <TrendingUp className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <div className="font-medium text-sm">Track Investment Opportunities</div>
                <div className="text-xs text-muted-foreground">Monitor deals from sourcing to close</div>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-primary/5">
              <Target className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <div className="font-medium text-sm">AI-Powered Analysis</div>
                <div className="text-xs text-muted-foreground">Get detailed investment insights automatically</div>
              </div>
            </div>
          </div>

          {/* Call to Actions */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {onAddDeal && (
                <Button 
                  onClick={onAddDeal}
                  className="px-6 py-2.5 font-medium"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Deal
                </Button>
              )}
              {onBatchUpload && (
                <Button 
                  variant="outline" 
                  onClick={onBatchUpload}
                  className="px-6 py-2.5"
                >
                  Batch Upload Deals
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Start building your investment pipeline today
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}