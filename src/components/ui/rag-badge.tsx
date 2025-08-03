import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const ragBadgeVariants = cva(
  "inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-all duration-200 border backdrop-blur-sm shadow-elegant rounded-lg",
  {
    variants: {
      level: {
        exciting: "bg-gradient-to-r from-primary/8 to-primary/4 text-primary border-primary/15 hover:border-primary/25 hover:shadow-md",
        promising: "bg-gradient-to-r from-blue-500/8 to-blue-400/4 text-blue-700 border-blue-500/15 hover:border-blue-500/25 hover:shadow-md dark:text-blue-300 dark:border-blue-400/15",
        needs_development: "bg-gradient-to-r from-amber-500/8 to-amber-400/4 text-amber-700 border-amber-500/15 hover:border-amber-500/25 hover:shadow-md dark:text-amber-300 dark:border-amber-400/15",
        not_aligned: "bg-gradient-to-r from-muted/12 to-muted/6 text-muted-foreground border-border hover:border-border/80 hover:shadow-sm"
      },
      size: {
        sm: "text-[11px] px-2 py-1 gap-1 rounded-md",
        default: "text-xs px-3 py-1.5 gap-1.5 rounded-lg",
        lg: "text-sm px-4 py-2 gap-2 rounded-lg"
      }
    },
    defaultVariants: {
      level: "not_aligned",
      size: "default"
    }
  }
);

interface RAGBadgeProps extends VariantProps<typeof ragBadgeVariants> {
  score?: number;
  label?: string;
  showScore?: boolean;
  className?: string;
}

export function RAGBadge({ 
  level, 
  size, 
  score, 
  label, 
  showScore = true, 
  className 
}: RAGBadgeProps) {
  return (
    <div className={cn(ragBadgeVariants({ level, size }), className)}>
      {showScore && score !== undefined && (
        <span className="font-semibold tabular-nums text-hierarchy-3">
          {Math.round(score)}
        </span>
      )}
      {showScore && score !== undefined && label && (
        <span className="opacity-50 font-normal text-[10px]">/100</span>
      )}
      {label && (
        <span className="font-medium tracking-tight opacity-90">
          {showScore && score !== undefined ? `· ${label}` : label}
        </span>
      )}
    </div>
  );
}