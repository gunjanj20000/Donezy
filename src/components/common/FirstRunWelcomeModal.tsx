import React from 'react';
import { Sparkles, Mic, Plus, CheckCircle2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const FirstRunWelcomeModal: React.FC = () => {
  const { settings, updateSettings, openQuickAdd } = useApp();

  if (settings.firstRunCompleted) return null;

  const handleDismiss = () => {
    updateSettings({ firstRunCompleted: true });
  };

  const handleTryVoice = () => {
    handleDismiss();
    openQuickAdd('', undefined);
    // User can tap mic right away
  };

  const handleCreateTask = () => {
    handleDismiss();
    openQuickAdd();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-fade-in">
      <div 
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 text-center flex flex-col items-center animate-scale-in"
        role="dialog"
        aria-modal="true"
        aria-label="Welcome to SmartDay"
      >
        {/* App Logo */}
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-brand-600 to-pink-500 flex items-center justify-center text-white mb-4 shadow-xl shadow-brand-500/30">
          <Sparkles className="w-8 h-8" />
        </div>

        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-2">
          Welcome to SmartDay 👋
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-xs">
          Organize your day with less typing. Capture tasks in seconds using voice, natural language, or one-tap presets.
        </p>

        {/* Feature Highlights */}
        <div className="w-full bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 mb-6 text-left space-y-2.5 text-xs text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60">
          <div className="flex items-center gap-2">
            <span className="text-brand-600 font-bold">✓</span>
            <span>Type naturally: <em>"Call plumber tomorrow at 2 PM"</em></span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-brand-600 font-bold">✓</span>
            <span>100% offline & local-first. No login required.</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-brand-600 font-bold">✓</span>
            <span>Intelligent alarms, smart time presets & recurring tasks.</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full space-y-2.5">
          <button
            type="button"
            onClick={handleCreateTask}
            className="w-full min-h-[48px] py-3 px-5 rounded-2xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-brand-500/25 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Create your first task</span>
          </button>

          <button
            type="button"
            onClick={handleTryVoice}
            className="w-full min-h-[44px] py-2.5 px-4 rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
          >
            <Mic className="w-4 h-4 text-brand-600" />
            <span>Try voice task</span>
          </button>
        </div>
      </div>
    </div>
  );
};
