import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, Trash2 } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetData = async () => {
    if (confirm('This will reset local storage and cached data to repair the application. Proceed?')) {
      try {
        localStorage.clear();
        sessionStorage.clear();
        if ('databases' in indexedDB) {
          const dbs = await indexedDB.databases();
          for (const db of dbs) {
            if (db.name) indexedDB.deleteDatabase(db.name);
          }
        }
        if ('serviceWorker' in navigator) {
          const registrations = await navigator.serviceWorker.getRegistrations();
          for (const reg of registrations) {
            await reg.unregister();
          }
        }
      } catch (e) {
        console.error('Failed to clear storage:', e);
      }
      window.location.href = '/';
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-6 selection:bg-rose-500">
          <div className="w-full max-w-md bg-slate-800/90 backdrop-blur-xl border border-rose-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl text-center">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/20 text-rose-400 mx-auto flex items-center justify-center mb-5">
              <AlertCircle className="w-8 h-8" />
            </div>
            
            <h1 className="text-xl font-bold tracking-tight text-white mb-2">
              Something went wrong
            </h1>
            <p className="text-sm text-slate-400 mb-6 leading-relaxed">
              SmartDay encountered an unexpected issue while loading. Don't worry, your tasks are safe in local storage.
            </p>

            {this.state.error && (
              <div className="p-3 mb-6 bg-slate-950/60 rounded-xl text-left border border-slate-700/50 overflow-x-auto text-xs font-mono text-rose-300">
                {this.state.error.toString()}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={this.handleReload}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-500 to-brand-500 text-white font-semibold flex items-center justify-center gap-2 hover:opacity-95 active:scale-95 transition-all shadow-lg shadow-indigo-500/25 min-h-[44px]"
              >
                <RefreshCw className="w-4 h-4" />
                Reload App
              </button>
              
              <button
                onClick={this.handleResetData}
                className="py-3 px-4 rounded-xl bg-slate-700/60 hover:bg-slate-700 text-slate-300 font-medium flex items-center justify-center gap-2 active:scale-95 transition-all min-h-[44px]"
                title="Reset cache and storage if app cannot recover"
              >
                <Trash2 className="w-4 h-4 text-slate-400" />
                Reset Data
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
