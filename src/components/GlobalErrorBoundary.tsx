'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, Button } from '@/components/ui';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class GlobalErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    // You could send this to an error reporting service like Sentry here
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-bg-base font-inter">
          <Card className="max-w-md w-full p-8 text-center space-y-6 border-status-rejected-border bg-status-rejected-bg/5 shadow-2xl">
            <div className="w-20 h-20 mx-auto bg-status-rejected-bg/20 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-10 h-10 text-status-rejected-text" />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl font-jotia-bold text-text-primary tracking-tight uppercase">System Interruption</h1>
              <p className="text-text-secondary text-sm">Something went wrong while loading this page. Our team has been notified.</p>
            </div>

            {process.env.NODE_ENV === 'development' && (
              <div className="p-4 bg-bg-raised rounded-card text-left overflow-auto max-h-40">
                <code className="text-[10px] text-status-rejected-text font-mono break-all">
                  {this.state.error?.toString()}
                </code>
              </div>
            )}

            <div className="flex flex-col gap-3 pt-4">
              <Button 
                onClick={() => window.location.reload()}
                className="w-full font-bold shadow-lg"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry Loading
              </Button>
              <Button 
                variant="outline" 
                onClick={() => window.location.href = '/'}
                className="w-full"
              >
                <Home className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
