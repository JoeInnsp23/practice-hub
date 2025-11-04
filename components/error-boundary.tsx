"use client";

import { AlertCircle, Home, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; reset: () => void }>;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

interface ErrorInfo {
  componentStack: string;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Send error to Sentry
    if (typeof window !== "undefined") {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const Sentry = require("@sentry/nextjs");
      Sentry.captureException(error, {
        tags: { component: "ErrorBoundary" },
        extra: {
          componentStack: errorInfo.componentStack,
        },
        contexts: {
          react: {
            componentStack: errorInfo.componentStack,
          },
        },
      });
    }

    this.setState({
      error,
      errorInfo,
    });
  }

  reportError(_error: Error, _errorInfo: ErrorInfo) {
    // Error reporting is now handled by Sentry in componentDidCatch
    // This method is kept for backwards compatibility but no longer used
  }

  reset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return (
          <FallbackComponent error={this.state.error} reset={this.reset} />
        );
      }

      return (
        <DefaultErrorFallback error={this.state.error} reset={this.reset} />
      );
    }

    return this.props.children;
  }
}

function DefaultErrorFallback({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-200 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-6 w-6" />
            Something went wrong
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error Details</AlertTitle>
            <AlertDescription className="mt-2 font-mono text-sm">
              {error.message}
            </AlertDescription>
          </Alert>

          <div className="text-sm text-muted-foreground">
            <p>
              We apologize for the inconvenience. The error has been logged and
              our team will investigate the issue.
            </p>
            {process.env.NODE_ENV === "development" && (
              <details className="mt-4">
                <summary className="cursor-pointer font-medium">
                  Stack Trace (Development Only)
                </summary>
                <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto max-h-48">
                  {error.stack}
                </pre>
              </details>
            )}
          </div>

          <div className="flex gap-2">
            <Button onClick={reset} className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push("/")}
              className="flex items-center gap-2"
            >
              <Home className="h-4 w-4" />
              Go Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
