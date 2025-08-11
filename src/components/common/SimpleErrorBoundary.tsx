
import React from 'react';

interface SimpleErrorBoundaryProps {
  fallback: React.ReactNode | ((error: Error) => React.ReactNode);
  children: React.ReactNode;
}

interface SimpleErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class SimpleErrorBoundary extends React.Component<
  SimpleErrorBoundaryProps,
  SimpleErrorBoundaryState
> {
  constructor(props: SimpleErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): SimpleErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Batch Upload ErrorBoundary caught an error:', {
      error,
      errorInfo,
    });
  }

  render() {
    if (this.state.hasError) {
      const { fallback } = this.props;
      if (typeof fallback === 'function') {
        return (fallback as (e: Error) => React.ReactNode)(this.state.error || new Error('Unknown error'));
      }
      return fallback;
    }
    return this.props.children;
  }
}

export default SimpleErrorBoundary;
