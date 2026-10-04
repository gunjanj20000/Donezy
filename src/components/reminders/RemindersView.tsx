import React, { useMemo } from 'react';
import { 
  Bell, 
  Clock, 
  AlertTriangle, 
  Repeat, 
  Check, 
  Volume2, 
  VolumeX, 
  Plus, 
  CheckCircle2 
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { TaskCard } from '../tasks/TaskCard';
import { formatTimeDisplay, isTaskOverdue, formatDateLabel } from '../../utils/dateUtils';
import { NotificationService, sounds } from '../../services/NotificationService';
import { format, isToday } from 'date-fns';

export const RemindersView: React.FC = () => {
  const { tasks, updateTask, openQuickAdd, settings, updateSettings } = useApp();

  const reminderTasks = useMemo(() => {
    return tasks.filter(t => !t.completed && (t.reminder?.enabled || t.dueTime));
  }, [tasks]);

  const { overdue, todayReminders, upcomingReminders, recurringReminders } = useMemo(() => {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const od: typeof tasks = [];
    const td: typeof tasks = [];
    const up: typeof tasks = [];
    const rec: typeof tasks = [];

    reminderTasks.forEach(t => {
      if (t.recurrence) {
        rec.push(t);
      }
      if (isTaskOverdue(t.dueDate, t.dueTime)) {
        od.push(t);
      } else if (t.dueDate === todayStr) {
        td.push(t);
      } else {
        up.push(t);
      }
    });

    return {
      overdue: od,
      todayReminders: td,
      upcomingReminders: up,
      recurringReminders: rec,
    };
  }, [reminderTasks]);

  const handleRequestPermission = async () => {
    const granted = await NotificationService.requestPermission();
    if (granted) {
      sounds.playReminderTone(settings.reminderTone || 'chime');
    }
  };

  const handleQuickSnooze = async (task: (typeof tasks)[0], minutes: number) => {
    const snoozeDate = new Date(Date.now() + minutes * 60 * 1000);
    const updated = {
      ...task,
      reminder: {
        ...(task.reminder || { enabled: true }),
        snoozedUntil: snoozeDate.toISOString(),
      },
    };
    await updateTask(updated);
    sounds.playPop();
  };

  const permission = NotificationService.getPermissionStatus();

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-24 sm:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Bell className="w-6 h-6 text-brand-600 dark:text-brand-400" />
            <span>Reminders</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {reminderTasks.length} active scheduled {reminderTasks.length === 1 ? 'reminder' : 'reminders'}
          </p>
        </div>

        <button
          onClick={() => openQuickAdd('Remind me to ')}
          className="min-h-[44px] px-4 py-2.5 rounded-2xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-brand-500/20 active:scale-95 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Add Reminder</span>
        </button>
      </div>

      {/* Browser Notification Permission Banner */}
      {permission !== 'granted' && (
        <div className="p-4 rounded-3xl bg-gradient-to-r from-brand-50 to-accent-50 dark:from-slate-800 dark:to-slate-800 border border-brand-200/70 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-100 dark:bg-brand-950 text-brand-600 dark:text-brand-400 flex items-center justify-center shrink-0">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Enable Browser Notifications
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Receive alerts even when the tab is in the background.
              </p>
            </div>
          </div>
          <button
            onClick={handleRequestPermission}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shrink-0 shadow-sm transition-colors"
          >
            Allow Notifications
          </button>
        </div>
      )}

      {/* Overdue Reminders */}
      {overdue.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
            <AlertTriangle className="w-4 h-4" />
            <span>Overdue Reminders ({overdue.length})</span>
          </div>
          <div className="space-y-3">
            {overdue.map(t => (
              <div key={t.id} className="space-y-1.5">
                <TaskCard task={t} />
                {/* Inline Quick Snooze Buttons */}
                <div className="flex items-center gap-2 pl-4 text-xs">
                  <span className="text-slate-400 text-[11px] font-semibold">Quick Snooze:</span>
                  <button
                    onClick={() => handleQuickSnooze(t, 15)}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium text-[11px]"
                  >
                    +15m
                  </button>
                  <button
                    onClick={() => handleQuickSnooze(t, 60)}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium text-[11px]"
                  >
                    +1h
                  </button>
                  <button
                    onClick={() => handleQuickSnooze(t, 1440)}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium text-[11px]"
                  >
                    Tomorrow
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Today Reminders */}
      {todayReminders.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            <Clock className="w-4 h-4" />
            <span>Today's Reminders ({todayReminders.length})</span>
          </div>
          <div className="space-y-2.5">
            {todayReminders.map(t => (
              <TaskCard key={t.id} task={t} />
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Reminders */}
      {upcomingReminders.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            <Clock className="w-4 h-4" />
            <span>Upcoming Reminders ({upcomingReminders.length})</span>
          </div>
          <div className="space-y-2.5">
            {upcomingReminders.map(t => (
              <TaskCard key={t.id} task={t} />
            ))}
          </div>
        </div>
      )}

      {/* Recurring Reminders */}
      {recurringReminders.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
            <Repeat className="w-4 h-4" />
            <span>Recurring ({recurringReminders.length})</span>
          </div>
          <div className="space-y-2.5">
            {recurringReminders.map(t => (
              <TaskCard key={t.id} task={t} />
            ))}
          </div>
        </div>
      )}

      {reminderTasks.length === 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-10 text-center flex flex-col items-center justify-center">
          <Bell className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-2" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-1">
            No Active Reminders
          </h3>
          <p className="text-xs text-slate-400 mb-4 max-w-xs">
            Add a time or voice reminder to stay on top of your schedule.
          </p>
          <button
            onClick={() => openQuickAdd('Remind me to ')}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-brand-600 text-white text-xs font-bold"
          >
            Create Reminder
          </button>
        </div>
      )}
    </div>
  );
};
