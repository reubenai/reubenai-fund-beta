import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  element?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  skippable?: boolean;
}

const onboardingSteps: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to ReubenAI',
    description: 'Let\'s take a quick tour to get you started with our AI-powered investment platform.',
    skippable: true
  },
  {
    id: 'strategy',
    title: 'Configure Your Investment Strategy',
    description: 'Start by setting up your fund\'s investment criteria and thresholds.',
    element: '[data-tour="strategy"]',
    position: 'bottom'
  },
  {
    id: 'pipeline',
    title: 'Manage Your Deal Pipeline',
    description: 'Track and analyze deals through your investment process.',
    element: '[data-tour="pipeline"]',
    position: 'bottom'
  },
  {
    id: 'ai-analysis',
    title: 'AI-Powered Analysis',
    description: 'Get comprehensive company analysis with our AI engine.',
    element: '[data-tour="ai-analysis"]',
    position: 'right'
  },
  {
    id: 'help',
    title: 'Need Help?',
    description: 'Use keyboard shortcuts (?) or visit our help section for guidance.',
    element: '[data-tour="help"]',
    position: 'left'
  }
];

export function useOnboarding() {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState<number>(-1);
  const [isActive, setIsActive] = useState(false);
  const [hasCompleted, setHasCompleted] = useState(false);

  useEffect(() => {
    const completed = localStorage.getItem('onboarding-completed');
    if (!completed) {
      setHasCompleted(false);
    } else {
      setHasCompleted(true);
    }
  }, []);

  const startTour = () => {
    setCurrentStep(0);
    setIsActive(true);
  };

  const nextStep = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeTour();
    }
  };

  const previousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const skipTour = () => {
    completeTour();
  };

  const completeTour = () => {
    setIsActive(false);
    setCurrentStep(-1);
    setHasCompleted(true);
    localStorage.setItem('onboarding-completed', 'true');
    
    toast({
      title: "Welcome aboard!",
      description: "You can always restart the tour from the help menu.",
    });
  };

  const resetTour = () => {
    localStorage.removeItem('onboarding-completed');
    setHasCompleted(false);
    setCurrentStep(-1);
    setIsActive(false);
  };

  const getCurrentStep = () => {
    if (currentStep >= 0 && currentStep < onboardingSteps.length) {
      return onboardingSteps[currentStep];
    }
    return null;
  };

  return {
    isActive,
    currentStep,
    hasCompleted,
    totalSteps: onboardingSteps.length,
    currentStepData: getCurrentStep(),
    startTour,
    nextStep,
    previousStep,
    skipTour,
    completeTour,
    resetTour
  };
}