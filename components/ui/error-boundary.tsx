// components/error-boundary.tsx
'use client';

import { Component, ReactNode } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Error Boundary caught an error:', error, errorInfo);
    
    // You can log to an error reporting service here
    // logErrorToService(error, errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
    // You might want to refresh the page or navigate home
    // window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[400px] flex flex-col items-center justify-center p-8 text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
            <AlertCircle className="w-10 h-10 text-red-600" />
          </div>
          
          <h2 className="text-2xl font-bold text-slate-800 mb-2">
            Something went wrong
          </h2>
          
          <p className="text-slate-600 mb-6 max-w-md">
            {this.state.error?.message || 'An unexpected error occurred. Please try again.'}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={this.resetError}
              variant="default"
              className="gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </Button>
            
            <Button
              onClick={() => window.location.href = '/'}
              variant="outline"
              className="gap-2"
            >
              <Home className="w-4 h-4" />
              Go Home
            </Button>
          </div>
          
          {/* Show stack trace in development */}
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <div className="mt-8 p-4 bg-slate-100 rounded-lg text-left max-w-2xl">
              <p className="text-sm font-mono text-slate-800 whitespace-pre-wrap">
                {this.state.error.stack}
              </p>
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

// Hooks-based error boundary alternative
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) {
  return function WithErrorBoundary(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}