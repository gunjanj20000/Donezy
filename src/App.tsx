import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { AppShell } from './components/layout/AppShell';
import { Sparkles } from 'lucide-react';

const MainContent: React.FC = () => {
  const { loading } = useApp();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100">
        <div className="w-14 h-14 rounded-3xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-pink-500 flex items-center justify-center text-white shadow-xl shadow-brand-500/30 animate-pulse mb-3">
          <Sparkles className="w-7 h-7" />
        </div>
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
          SmartDay Loading...
        </p>
      </div>
    );
  }

  return <AppShell />;
};

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}
