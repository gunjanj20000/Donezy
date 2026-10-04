import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { AppShell } from './components/layout/AppShell';
import { Sparkles } from 'lucide-react';

import { ErrorBoundary } from './components/common/ErrorBoundary';

const MainContent: React.FC = () => {
  const { loading } = useApp();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100">
        <img
          src="/donezy-icon.svg"
          alt="Donezy"
          className="w-16 h-16 rounded-3xl shadow-xl shadow-brand-500/30 animate-pulse mb-3"
        />
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
          Donezy Loading...
        </p>
      </div>
    );
  }

  return <AppShell />;
};

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <MainContent />
      </AppProvider>
    </ErrorBoundary>
  );
}
