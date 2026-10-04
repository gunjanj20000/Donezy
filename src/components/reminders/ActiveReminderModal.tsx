import React from 'react';
import { Bell, Check, Clock, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatTimeDisplay } from '../../utils/dateUtils';

export const ActiveReminderModal: React.FC = () => {
  const { activeReminderTask, dismissReminder, snoozeReminder, toggleTaskComplete, settings } = useApp();

  if (!activeReminderTask) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-fade-in">
      <div 
        className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border-2 border-brand-500/30 p-6 flex flex-col items-center text-center relative animate-scale-in"
        role="dialog"
        aria-modal="true"
        aria-label="Task Reminder Alert"
      >
        <button
          onClick={dismissReminder}
          className="absolute right-4 top-4 w-9 h-9 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Ringing Bell Icon Animation */}
        <div className="w-16 h-16 rounded-full bg-brand-50 dark:bg-brand-950/80 text-brand-600 dark:text-brand-400 flex items-center justify-center mb-4 ring-8 ring-brand-100 dark:ring-brand-900/40 animate-bounce">
          <Bell className="w-8 h-8" />
        </div>

        <span className="text-[11px] font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 mb-1">
          Reminder Alert
        </span>

        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
          {activeReminderTask.title}
        </h3>

        {activeReminderTask.dueTime && (
          <div className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400 mb-3">
            <Clock className="w-3.5 h-3.5" />
            <span>Scheduled for {formatTimeDisplay(activeReminderTask.dueTime, settings.timeFormat === '12h')}</span>
          </div>
        )}

        {activeReminderTask.notes && (
          <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 p-3 rounded-xl mb-4 max-h-24 overflow-y-auto text-left w-full">
            {activeReminderTask.notes}
          </p>
        )}

        {/* Complete Action */}
        <button
          type="button"
          onClick={() => {
            toggleTaskComplete(activeReminderTask.id);
            dismissReminder();
          }}
          className="w-full min-h-[48px] py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all active:scale-95 mb-4"
        >
          <Check className="w-5 h-5 stroke-[2.5]" />
          Mark as Completed
        </button>

        {/* Snooze Options */}
        <div className="w-full">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
            Snooze For
          </span>
          <div className="grid grid-cols-4 gap-1.5 mb-3">
            <button
              onClick={() => snoozeReminder(10)}
              className="py-2 px-1 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-brand-50 hover:text-brand-600 transition-colors"
            >
              10 min
            </button>
            <button
              onClick={() => snoozeReminder(30)}
              className="py-2 px-1 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-brand-50 hover:text-brand-600 transition-colors"
            >
              30 min
            </button>
            <button
              onClick={() => snoozeReminder(60)}
              className="py-2 px-1 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-brand-50 hover:text-brand-600 transition-colors"
            >
              1 hour
            </button>
            <button
              onClick={() => snoozeReminder(1440)}
              className="py-2 px-1 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-brand-50 hover:text-brand-600 transition-colors"
            >
              Tomorrow
            </button>
          </div>
        </div>

        <button
          onClick={dismissReminder}
          className="text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 pt-1"
        >
          Dismiss Alert
        </button>
      </div>
    </div>
  );
};
