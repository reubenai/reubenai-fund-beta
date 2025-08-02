import React from 'react';
import { Loader2, TrendingUp, FileText, Users, Target } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

export function LoadingSpinner({ size = 'md', text, className = '' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  return (
    <div className={`flex items-center justify-center gap-2 ${className}`}>
      <Loader2 className={`animate-spin ${sizeClasses[size]}`} />
      {text && <span className="text-sm text-muted-foreground">{text}</span>}
    </div>
  );
}

export function FullPageLoader({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <LoadingSpinner size="lg" />
        <p className="text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}

export function DealCardSkeleton() {
  return (
    <Card className="p-4 space-y-3">
      <div className="flex justify-between items-start">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-6 w-16" />
      </div>
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-3/4" />
      <div className="flex justify-between">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-16" />
      </div>
    </Card>
  );
}

export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          {Array.from({ length: columns }).map((_, j) => (
            <Skeleton key={j} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

interface AIAnalysisLoadingProps {
  stage: 'starting' | 'analyzing' | 'finalizing';
  progress?: number;
}

export function AIAnalysisLoading({ stage, progress }: AIAnalysisLoadingProps) {
  const stageMessages = {
    starting: 'Initializing AI analysis...',
    analyzing: 'Analyzing deal data...',
    finalizing: 'Generating insights...'
  };

  const stageIcons = {
    starting: TrendingUp,
    analyzing: FileText,
    finalizing: Target
  };

  const Icon = stageIcons[stage];

  return (
    <Card className="p-6">
      <CardContent className="text-center space-y-4">
        <Icon className="h-8 w-8 mx-auto text-primary animate-pulse" />
        <div className="space-y-2">
          <p className="font-medium">{stageMessages[stage]}</p>
          {progress !== undefined && (
            <div className="w-full bg-secondary rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300" 
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
          <p className="text-sm text-muted-foreground">
            This usually takes 30-60 seconds
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export function EmptyState({ 
  icon: Icon = FileText, 
  title = 'No data found', 
  description = 'Get started by adding your first item',
  action
}: {
  icon?: React.ComponentType<{ className?: string }>;
  title?: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="text-center py-12 space-y-4">
      <Icon className="h-12 w-12 mx-auto text-muted-foreground" />
      <div className="space-y-2">
        <h3 className="font-medium">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {action}
    </div>
  );
}