import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { X, ArrowLeft, ArrowRight, SkipForward } from 'lucide-react';
import { useOnboarding } from '@/hooks/useOnboarding';

export function GuidedTour() {
  const {
    isActive,
    currentStep,
    totalSteps,
    currentStepData,
    nextStep,
    previousStep,
    skipTour,
    completeTour
  } = useOnboarding();

  const overlayRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isActive && currentStepData?.element) {
      const element = document.querySelector(currentStepData.element);
      if (element && tooltipRef.current) {
        const rect = element.getBoundingClientRect();
        const tooltip = tooltipRef.current;
        
        // Position tooltip based on step configuration
        let top = rect.bottom + 10;
        let left = rect.left;
        
        switch (currentStepData.position) {
          case 'top':
            top = rect.top - tooltip.offsetHeight - 10;
            break;
          case 'bottom':
            top = rect.bottom + 10;
            break;
          case 'left':
            top = rect.top;
            left = rect.left - tooltip.offsetWidth - 10;
            break;
          case 'right':
            top = rect.top;
            left = rect.right + 10;
            break;
        }
        
        tooltip.style.top = `${top}px`;
        tooltip.style.left = `${left}px`;
        
        // Highlight the target element
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [isActive, currentStep, currentStepData]);

  if (!isActive || !currentStepData) return null;

  const progress = ((currentStep + 1) / totalSteps) * 100;

  return (
    <>
      {/* Overlay */}
      <div
        ref={overlayRef}
        className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
        onClick={skipTour}
      />
      
      {/* Tooltip */}
      <Card
        ref={tooltipRef}
        className="fixed z-50 w-80 shadow-xl border-primary/20"
        style={{ position: 'fixed' }}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{currentStepData.title}</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={completeTour}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <Progress value={progress} className="h-1" />
        </CardHeader>
        
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {currentStepData.description}
          </p>
          
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              Step {currentStep + 1} of {totalSteps}
            </span>
            
            <div className="flex gap-2">
              {currentStepData.skippable && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={skipTour}
                  className="gap-1"
                >
                  <SkipForward className="h-3 w-3" />
                  Skip
                </Button>
              )}
              
              {currentStep > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={previousStep}
                  className="gap-1"
                >
                  <ArrowLeft className="h-3 w-3" />
                  Back
                </Button>
              )}
              
              <Button
                size="sm"
                onClick={nextStep}
                className="gap-1"
              >
                {currentStep === totalSteps - 1 ? 'Finish' : 'Next'}
                <ArrowRight className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}