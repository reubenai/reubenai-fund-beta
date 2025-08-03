import React from 'react';
import { Loader2, Brain, FileText, TrendingUp, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <Loader2 
      className={`animate-spin ${sizeClasses[size]} ${className}`} 
    />
  );
};

interface AnalysisLoadingProps {
  message?: string;
  progress?: number;
}

export const AnalysisLoading: React.FC<AnalysisLoadingProps> = ({ 
  message = 'Analyzing with ReubenAI...', 
  progress 
}) => {
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardContent className="p-6">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <Brain className="w-12 h-12 text-primary animate-pulse" />
            <div className="absolute -top-1 -right-1">
              <LoadingSpinner size="sm" className="text-blue-500" />
            </div>
          </div>
          
          <div className="text-center space-y-2">
            <p className="font-medium text-foreground">{message}</p>
            {progress !== undefined && (
              <div className="w-full space-y-2">
                <Progress value={progress} className="h-2" />
                <p className="text-sm text-muted-foreground">{progress}% complete</p>
              </div>
            )}
          </div>
          
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

interface DocumentProcessingProps {
  fileName: string;
  stage: 'uploading' | 'processing' | 'analyzing' | 'complete';
  progress?: number;
}

export const DocumentProcessingIndicator: React.FC<DocumentProcessingProps> = ({
  fileName,
  stage,
  progress = 0
}) => {
  const getStageInfo = (currentStage: string) => {
    const stages = {
      uploading: { icon: FileText, text: 'Uploading', color: 'text-blue-500' },
      processing: { icon: Loader2, text: 'Processing', color: 'text-yellow-500' },
      analyzing: { icon: Brain, text: 'AI Analysis', color: 'text-purple-500' },
      complete: { icon: TrendingUp, text: 'Complete', color: 'text-green-500' }
    };
    return stages[currentStage as keyof typeof stages];
  };

  const stageInfo = getStageInfo(stage);
  const Icon = stageInfo.icon;

  return (
    <Card className="transition-all duration-200 hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex items-center space-x-3">
          <Icon className={`w-5 h-5 ${stageInfo.color} ${stage !== 'complete' ? 'animate-spin' : ''}`} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{fileName}</p>
            <p className={`text-xs ${stageInfo.color}`}>{stageInfo.text}</p>
          </div>
          {progress > 0 && progress < 100 && (
            <div className="w-16">
              <Progress value={progress} className="h-1" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

interface SkeletonLoaderProps {
  type: 'card' | 'list' | 'table' | 'memo';
  count?: number;
  className?: string;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ 
  type, 
  count = 1, 
  className = '' 
}) => {
  const renderSkeleton = () => {
    switch (type) {
      case 'card':
        return (
          <Card className={`animate-pulse ${className}`}>
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
                <div className="h-3 bg-muted rounded w-2/3"></div>
              </div>
            </CardContent>
          </Card>
        );

      case 'list':
        return (
          <div className={`space-y-3 ${className}`}>
            {[...Array(count)].map((_, i) => (
              <div key={i} className="flex items-center space-x-3 animate-pulse">
                <div className="w-10 h-10 bg-muted rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        );

      case 'table':
        return (
          <div className={`space-y-3 ${className}`}>
            {[...Array(count)].map((_, i) => (
              <div key={i} className="grid grid-cols-4 gap-4 animate-pulse">
                <div className="h-4 bg-muted rounded"></div>
                <div className="h-4 bg-muted rounded"></div>
                <div className="h-4 bg-muted rounded"></div>
                <div className="h-4 bg-muted rounded"></div>
              </div>
            ))}
          </div>
        );

      case 'memo':
        return (
          <div className={`space-y-6 ${className}`}>
            <div className="animate-pulse">
              <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
              <div className="space-y-3">
                <div className="h-4 bg-muted rounded"></div>
                <div className="h-4 bg-muted rounded w-5/6"></div>
                <div className="h-4 bg-muted rounded w-4/6"></div>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className={`animate-pulse ${className}`}>
            <div className="h-4 bg-muted rounded"></div>
          </div>
        );
    }
  };

  return <>{renderSkeleton()}</>;
};

interface PulseIconProps {
  icon: React.ElementType;
  className?: string;
}

export const PulseIcon: React.FC<PulseIconProps> = ({ icon: Icon, className = '' }) => {
  return (
    <div className="relative">
      <Icon className={className} />
      <div className="absolute inset-0 rounded-full animate-ping bg-current opacity-25"></div>
    </div>
  );
};

interface ProgressiveLoadingProps {
  steps: string[];
  currentStep: number;
  className?: string;
}

export const ProgressiveLoading: React.FC<ProgressiveLoadingProps> = ({
  steps,
  currentStep,
  className = ''
}) => {
  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex justify-between text-sm text-muted-foreground mb-2">
        <span>Step {currentStep + 1} of {steps.length}</span>
        <span>{Math.round(((currentStep + 1) / steps.length) * 100)}%</span>
      </div>
      
      <Progress value={((currentStep + 1) / steps.length) * 100} className="h-2" />
      
      <div className="space-y-2">
        {steps.map((step, index) => (
          <div key={index} className="flex items-center space-x-2">
            {index < currentStep ? (
              <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
            ) : index === currentStep ? (
              <LoadingSpinner size="sm" className="text-primary" />
            ) : (
              <div className="w-4 h-4 rounded-full bg-muted"></div>
            )}
            <span className={`text-sm ${
              index <= currentStep ? 'text-foreground font-medium' : 'text-muted-foreground'
            }`}>
              {step}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};