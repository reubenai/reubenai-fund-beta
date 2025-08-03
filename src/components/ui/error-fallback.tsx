/**
 * Enhanced Error Fallback Component
 * Provides better error handling and recovery options for production
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  AlertTriangle, 
  RefreshCw, 
  Home, 
  Copy, 
  ChevronDown, 
  Wifi, 
  Shield,
  Code
} from 'lucide-react';
import { ErrorRecovery } from '@/utils/edgeCaseHandler';

interface ErrorFallbackProps {
  error: Error;
  errorInfo?: any;
  onRetry?: () => void;
  onGoHome?: () => void;
  componentName?: string;
}

export function ErrorFallback({ 
  error, 
  errorInfo, 
  onRetry, 
  onGoHome,
  componentName = 'Component'
}: ErrorFallbackProps) {
  const [showDetails, setShowDetails] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  const recoveryStrategy = ErrorRecovery.handleComponentError(error, errorInfo);

  const getErrorType = () => {
    if (error.message.includes('ChunkLoadError')) {
      return {
        type: 'chunk',
        title: 'Loading Error',
        description: 'Failed to load application resources. This usually happens after updates.',
        icon: RefreshCw,
        variant: 'secondary' as const
      };
    }
    
    if (error.message.includes('Network') || error.message.includes('fetch')) {
      return {
        type: 'network',
        title: 'Connection Error',
        description: 'Unable to connect to our servers. Please check your internet connection.',
        icon: Wifi,
        variant: 'destructive' as const
      };
    }
    
    if (error.message.includes('permission') || error.message.includes('auth')) {
      return {
        type: 'auth',
        title: 'Authentication Error',
        description: 'Your session may have expired. Please sign in again.',
        icon: Shield,
        variant: 'destructive' as const
      };
    }
    
    return {
      type: 'general',
      title: 'Application Error',
      description: 'An unexpected error occurred in the application.',
      icon: AlertTriangle,
      variant: 'destructive' as const
    };
  };

  const errorDetails = getErrorType();
  const Icon = errorDetails.icon;

  const handleCopyError = async () => {
    const errorReport = {
      timestamp: new Date().toISOString(),
      component: componentName,
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name
      },
      errorInfo: errorInfo?.componentStack,
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    try {
      await navigator.clipboard.writeText(JSON.stringify(errorReport, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy error details:', err);
    }
  };

  const getRecoveryActions = () => {
    switch (recoveryStrategy) {
      case 'reload':
        return (
          <Button 
            onClick={() => window.location.reload()} 
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Reload Page
          </Button>
        );
      
      case 'offline':
        return (
          <div className="space-y-2">
            <Button 
              onClick={onRetry} 
              variant="outline"
              className="gap-2 w-full"
              disabled={!navigator.onLine}
            >
              <Wifi className="h-4 w-4" />
              {navigator.onLine ? 'Retry Connection' : 'Offline - Check Connection'}
            </Button>
            {onGoHome && (
              <Button 
                onClick={onGoHome} 
                variant="secondary"
                className="gap-2 w-full"
              >
                <Home className="h-4 w-4" />
                Go to Home
              </Button>
            )}
          </div>
        );
      
      case 'auth':
        return (
          <Button 
            onClick={() => window.location.href = '/auth'} 
            className="gap-2"
          >
            <Shield className="h-4 w-4" />
            Sign In Again
          </Button>
        );
      
      default:
        return (
          <div className="space-y-2">
            {onRetry && (
              <Button 
                onClick={onRetry} 
                variant="outline"
                className="gap-2 w-full"
              >
                <RefreshCw className="h-4 w-4" />
                Try Again
              </Button>
            )}
            {onGoHome && (
              <Button 
                onClick={onGoHome} 
                variant="secondary"
                className="gap-2 w-full"
              >
                <Home className="h-4 w-4" />
                Go to Home
              </Button>
            )}
          </div>
        );
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[400px] p-4">
      <Card className="w-full max-w-md border-0 shadow-elegant">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-background border-2 border-border flex items-center justify-center">
            <Icon className="h-6 w-6 text-foreground" />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-xl text-foreground">{errorDetails.title}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {errorDetails.description}
            </p>
          </div>
          <Badge variant={errorDetails.variant} className="text-xs">
            {componentName} Error
          </Badge>
        </CardHeader>

        <CardContent className="space-y-4">
          {getRecoveryActions()}

          <Collapsible open={showDetails} onOpenChange={setShowDetails}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full gap-2">
                <Code className="h-4 w-4" />
                {showDetails ? 'Hide' : 'Show'} Technical Details
                <ChevronDown className={`h-4 w-4 transition-transform ${showDetails ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
            
            <CollapsibleContent className="space-y-3 pt-3">
              <div className="bg-muted rounded-lg p-3 space-y-2">
                <div className="text-xs font-medium text-foreground">Error Message:</div>
                <div className="text-xs text-muted-foreground font-mono bg-background rounded p-2 border">
                  {error.message}
                </div>
                
                {error.stack && (
                  <>
                    <div className="text-xs font-medium text-foreground">Stack Trace:</div>
                    <div className="text-xs text-muted-foreground font-mono bg-background rounded p-2 border max-h-32 overflow-y-auto">
                      {error.stack}
                    </div>
                  </>
                )}
              </div>

              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleCopyError}
                className="w-full gap-2"
              >
                <Copy className="h-4 w-4" />
                {copied ? 'Copied!' : 'Copy Error Details'}
              </Button>
              
              <p className="text-xs text-muted-foreground text-center">
                You can share these details with support for faster assistance.
              </p>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>
    </div>
  );
}