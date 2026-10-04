import React, { useMemo } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Calendar as CalendarIcon, 
  Plus, 
  ChevronDown, 
  Sparkles,
  Zap,
  Check
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { TaskCard } from '../tasks/TaskCard';
import { getGreeting, isTaskOverdue, isTaskDueNow } from '../../utils/dateUtils';
import { format, isToday, parseISO } from 'date-fns';

export const TodayView: React.FC = () => {
  const { tasks, openQuickAdd, searchQuery, selectedCategoryFilter } = useApp();
  const greeting = getGreeting();
  const todayFormatted = format(new Date(), 'EEEE, MMMM d');
  const todayStr = format(new Date(), 'yyyy-MM-dd');

  // Filter tasks for Today view
  const { overdueTasks, nowTasks, todayTasks, completedTasks, totalTodayCount, completedTodayCount } = useMemo(() => {
    let list = tasks;

    // Apply category filter if active
    if (selectedCategoryFilter) {
      list = list.filter(t => t.categoryId === selectedCategoryFilter);
    }

    // Apply search query if active
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(t => 
        t.title.toLowerCase().includes(q) ||
        t.notes?.toLowerCase().includes(q) ||
        t.tags?.some(tag => tag.toLowerCase().includes(q))
      );
    }

    const overdue: typeof tasks = [];
    const nowList: typeof tasks = [];
    const todayList: typeof tasks = [];
    const completedList: typeof tasks = [];

    list.forEach(task => {
      if (task.completed) {
        // Show tasks completed today or tasks with dueDate today
        if (task.dueDate === todayStr || (task.completedAt && isToday(parseISO(task.completedAt)))) {
          completedList.push(task);
        }
        return;
      }

      // Check overdue
      if (isTaskOverdue(task.dueDate, task.dueTime) && task.dueDate <= todayStr) {
        overdue.push(task);
      } else if (task.dueDate === todayStr) {
        if (isTaskDueNow(task.dueDate, task.dueTime)) {
          nowList.push(task);
        } else {
          todayList.push(task);
        }
      }
    });

    const total = overdue.length + nowList.length + todayList.length + completedList.length;
    const completedCount = completedList.length;

    return {
      overdueTasks: overdue,
      nowTasks: nowList,
      todayTasks: todayList,
      completedTasks: completedList,
      totalTodayCount: total,
      completedTodayCount: completedCount,
    };
  }, [tasks, selectedCategoryFilter, searchQuery, todayStr]);

  const completionPercentage = totalTodayCount > 0 
    ? Math.round((completedTodayCount / totalTodayCount) * 100) 
    : 0;

  // Generate productivity progress bar: e.g. "███████░░ 70%"
  const filledBlocks = Math.round((completionPercentage / 100) * 10);
  const blockVisual = '█'.repeat(filledBlocks) + '░'.repeat(10 - filledBlocks);

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-24 sm:pb-8">
      {/* Header & Productivity Summary */}
      <div className="bg-gradient-to-br from-white via-white to-slate-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 p-4 sm:p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl sm:text-2xl">{greeting.icon}</span>
              <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                {greeting.text}
              </h1>
            </div>
            <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">
              {todayFormatted}
            </p>
          </div>

          {/* Quick Action Button on Top for Desktop/Tablet */}
          <button
            onClick={() => openQuickAdd()}
            className="hidden sm:inline-flex items-center gap-2 min-h-[44px] px-5 py-2.5 rounded-2xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-md shadow-brand-500/20 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Add Task</span>
          </button>
        </div>

        {/* Productivity Summary Bar */}
        <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center justify-between sm:justify-start flex-wrap gap-2">
            <span className="text-[11px] sm:text-xs font-bold text-slate-700 dark:text-slate-300">
              {totalTodayCount} {totalTodayCount === 1 ? 'task' : 'tasks'} today
            </span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span className="text-[11px] sm:text-xs font-mono font-bold text-brand-600 dark:text-brand-400 tracking-wider">
              {blockVisual} {completionPercentage}%
            </span>
          </div>

          {/* Compact Mini Progress bar */}
          <div className="w-full sm:w-48 bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
            <div 
              className="bg-gradient-to-r from-brand-500 to-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Task Sections */}
      {totalTodayCount === 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-10 text-center flex flex-col items-center justify-center shadow-sm">
          <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4 text-3xl">
            🎉
          </div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-1">
            You're all caught up!
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mb-5">
            No tasks scheduled for today. Enjoy your day or plan ahead.
          </p>
          <button
            onClick={() => openQuickAdd()}
            className="min-h-[44px] px-5 py-2.5 rounded-2xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-brand-500/20 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Add a task</span>
          </button>
        </div>
      )}

      {/* OVERDUE Section */}
      {overdueTasks.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 px-1">
            <AlertTriangle className="w-4 h-4" />
            <span>Overdue ({overdueTasks.length})</span>
          </div>
          <div className="space-y-2.5">
            {overdueTasks.map(task => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        </div>
      )}

      {/* NOW Section */}
      {nowTasks.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 px-1">
            <Zap className="w-4 h-4" />
            <span>Happening Now ({nowTasks.length})</span>
          </div>
          <div className="space-y-2.5">
            {nowTasks.map(task => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        </div>
      )}

      {/* TODAY Section */}
      {todayTasks.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-1">
            <CalendarIcon className="w-4 h-4" />
            <span>Today ({todayTasks.length})</span>
          </div>
          <div className="space-y-2.5">
            {todayTasks.map(task => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        </div>
      )}

      {/* COMPLETED Section */}
      {completedTasks.length > 0 && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 px-1">
            <CheckCircle2 className="w-4 h-4" />
            <span>Completed ({completedTasks.length})</span>
          </div>
          <div className="space-y-2.5">
            {completedTasks.map(task => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
