import { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
    message: '',
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error?.message || 'An unexpected error occurred.',
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Application boundary caught error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#06080c] p-6 text-[#f5f4f0]">
          <div className="liquid-glass max-w-md w-full rounded-3xl p-6 text-center">
            <h1 className="font-display text-2xl font-semibold text-[#f5f4f0]">
              Something went wrong
            </h1>
            <p className="mt-2 text-sm text-slate-300">
              PrismLink encountered an unexpected error. Reload the page to continue.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="liquid-btn-primary mt-5 inline-flex min-h-[44px] items-center justify-center rounded-2xl px-5 py-2.5 text-sm font-semibold cursor-pointer"
            >
              Reload PrismLink
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
