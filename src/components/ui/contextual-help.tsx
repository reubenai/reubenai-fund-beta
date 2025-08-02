import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { HelpCircle, X } from 'lucide-react';

interface ContextualHelpProps {
  content: string;
  title?: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

export function ContextualHelp({ 
  content, 
  title = "Help", 
  placement = "top",
  className 
}: ContextualHelpProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`h-6 w-6 p-0 text-muted-foreground hover:text-foreground ${className}`}
        >
          <HelpCircle className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      
      <PopoverContent
        side={placement}
        className="w-80 p-0"
        sideOffset={8}
      >
        <Card className="border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-2">
              <h4 className="font-medium text-sm">{title}</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="h-4 w-4 p-0 text-muted-foreground"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {content}
            </p>
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
}

// Helper component for common help topics
export function HelpTooltip({ topic }: { topic: string }) {
  const helpContent = {
    'investment-strategy': 'Configure your fund\'s investment criteria, sector focus, and decision thresholds. This helps our AI understand your investment thesis and surface relevant deals.',
    'deal-pipeline': 'Track deals through your investment process from initial screening to final decision. Use stages to organize your workflow and monitor deal progression.',
    'ai-analysis': 'Our AI engine analyzes companies across multiple dimensions including market opportunity, team strength, competitive landscape, and financial projections.',
    'fund-memory': 'Build institutional knowledge by storing and querying past investments, learnings, and decision rationales. The AI learns from your fund\'s history.',
    'thesis-alignment': 'Measures how well a deal matches your investment criteria. Higher scores indicate better strategic fit with your fund\'s thesis.',
    'keyboard-shortcuts': 'Use ? to open this help, Ctrl+K for quick search, Ctrl+N for new deal, and Ctrl+Enter to run analysis.'
  };

  const content = helpContent[topic as keyof typeof helpContent] || 'Help information not available for this topic.';
  
  return <ContextualHelp content={content} title="Quick Help" />;
}