/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      let errorMessage = "An unexpected error occurred.";
      try {
        const parsed = JSON.parse(this.state.error?.message || "");
        if (parsed.error) errorMessage = parsed.error;
      } catch (e) {
        errorMessage = this.state.error?.message || errorMessage;
      }

      return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
          <div className="w-20 h-20 bg-red-50 rounded-[2rem] flex items-center justify-center mb-6">
            <AlertCircle className="w-10 h-10 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight mb-2">Something went wrong</h2>
          <p className="text-zinc-500 max-w-xs mb-8">{errorMessage}</p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 bg-black text-white px-6 py-3 rounded-full font-medium hover:bg-zinc-800 transition-all"
          >
            <RotateCcw className="w-4 h-4" /> Reload Application
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
