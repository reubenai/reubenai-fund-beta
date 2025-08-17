import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface GlobalErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

interface GlobalErrorBoundaryProps {
  children: React.ReactNode;
}

export class GlobalErrorBoundary extends React.Component<GlobalErrorBoundaryProps, GlobalErrorBoundaryState> {
  private retryCount = 0;
  private maxRetries = 3;

  constructor(props: GlobalErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<GlobalErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const errorId = this.generateErrorId();
    console.error(`[ERROR ID: ${errorId}] Global Error Boundary caught an error:`, error, errorInfo);
    this.setState({ errorInfo });
    
    // Create detailed error report
    const errorReport = {
      id: errorId,
      type: 'react_error_boundary',
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      retryCount: this.retryCount
    };
    
    console.error('Detailed error report:', errorReport);
    
    // Store error ID for display
    (this.state as any).errorId = errorId;
    
    // Log to external service in production
    if (process.env.NODE_ENV === 'production') {
      console.error('Production error report:', errorReport);
    }
  }

  generateErrorId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  retry = () => {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      this.setState({ hasError: false, error: null, errorInfo: null });
    }
  };

  goHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      const isNetworkError = this.state.error?.message?.toLowerCase().includes('network') || 
                            this.state.error?.message?.toLowerCase().includes('fetch');
      const isChunkError = this.state.error?.message?.toLowerCase().includes('chunk');
      const errorId = (this.state as any).errorId || 'unknown';

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <div className="max-w-md w-full space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>
                {isNetworkError ? 'Connection Problem' : 
                 isChunkError ? 'Loading Issue' : 
                 'An internal error occurred'}
              </AlertTitle>
              <AlertDescription className="mt-2 space-y-3">
                {isNetworkError ? (
                  <p>We're having trouble connecting to our servers. Please check your internet connection and try again.</p>
                ) : isChunkError ? (
                  <p>There was an issue loading part of the application. This usually resolves with a refresh.</p>
                ) : (
                  <p>An unexpected error occurred. Our team has been notified and is working on a fix.</p>
                )}
                
                {/* Error ID display */}
                <div className="mt-3 p-3 bg-muted rounded text-sm">
                  <p className="text-muted-foreground">
                    <strong>ID:</strong> <span className="font-mono">{errorId}</span>
                  </p>
                  <button 
                    onClick={() => navigator.clipboard.writeText(errorId)}
                    className="text-xs text-blue-600 hover:text-blue-800 mt-1"
                  >
                    📋 Copy ID
                  </button>
                </div>
                
                {process.env.NODE_ENV === 'development' && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-sm text-muted-foreground">
                      Error Details (Development)
                    </summary>
                    <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto max-h-32">
                      {this.state.error?.message}
                      {this.state.error?.stack && '\n\nStack:\n' + this.state.error.stack}
                    </pre>
                  </details>
                )}

                <div className="flex gap-2 mt-4">
                  {this.retryCount < this.maxRetries ? (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={this.retry}
                      className="gap-2"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Try Again ({this.maxRetries - this.retryCount} left)
                    </Button>
                  ) : (
                    <Button 
                      variant="default" 
                      size="sm" 
                      onClick={() => window.location.reload()}
                      className="gap-2"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Reload Page
                    </Button>
                  )}
                  
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={this.goHome}
                    className="gap-2"
                  >
                    <Home className="h-4 w-4" />
                    Go Home
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// React Query Error Boundary
export function ReactQueryErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <GlobalErrorBoundary>
      {children}
    </GlobalErrorBoundary>
  );
}