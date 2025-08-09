import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Brain, MessageSquare, Lightbulb, X, RefreshCw } from 'lucide-react';
import { useEnhancedFundMemory } from '@/hooks/useEnhancedFundMemory';

interface ContextualPromptsProps {
  fundId: string;
  dealContext?: {
    company_name?: string;
    industry?: string;
    stage?: string;
    deal_size?: number;
  };
  onPromptUsed?: (prompt: string) => void;
  className?: string;
}

export const ContextualPrompts: React.FC<ContextualPromptsProps> = ({
  fundId,
  dealContext,
  onPromptUsed,
  className = ""
}) => {
  const { contextualPrompts, getContextualPrompts } = useEnhancedFundMemory(fundId);
  const [isLoading, setIsLoading] = useState(false);
  const [dismissedPrompts, setDismissedPrompts] = useState<Set<string>>(new Set());

  const loadPrompts = async () => {
    if (!fundId) return;
    
    setIsLoading(true);
    try {
      await getContextualPrompts(dealContext);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePromptUse = (prompt: string) => {
    onPromptUsed?.(prompt);
    setDismissedPrompts(prev => new Set(prev).add(prompt));
  };

  const handlePromptDismiss = (prompt: string) => {
    setDismissedPrompts(prev => new Set(prev).add(prompt));
  };

  useEffect(() => {
    loadPrompts();
  }, [fundId, dealContext?.company_name, dealContext?.industry]);

  const visiblePrompts = contextualPrompts.filter(prompt => !dismissedPrompts.has(prompt));

  if (!fundId) return null;

  if (visiblePrompts.length === 0 && !isLoading) {
    return (
      <Card className={`border-dashed ${className}`}>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            <Brain className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No contextual insights available for this deal yet.</p>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={loadPrompts}
              className="mt-2"
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh Insights
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            Fund Memory Insights
            {dealContext?.company_name && (
              <Badge variant="outline" className="ml-2">
                {dealContext.company_name}
              </Badge>
            )}
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={loadPrompts}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          AI-powered insights based on your fund's historical patterns and decisions
        </p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-12 bg-muted animate-pulse rounded" />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {visiblePrompts.map((prompt, index) => (
              <Alert key={index} className="relative">
                <Lightbulb className="h-4 w-4" />
                <AlertDescription className="pr-8">
                  {prompt}
                </AlertDescription>
                <div className="absolute top-2 right-2 flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => handlePromptUse(prompt)}
                    title="Use this insight"
                  >
                    <MessageSquare className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => handlePromptDismiss(prompt)}
                    title="Dismiss this insight"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </Alert>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};