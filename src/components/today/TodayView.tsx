import React, { useMemo, useState } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Calendar as CalendarIcon, 
  CalendarDays,
  CalendarClock,
  Plus, 
  ChevronDown, 
  ChevronUp,
  Sparkles,
  Zap,
  Check,
  ArrowRight,
  Layers,
  Filter
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { TaskCard } from '../tasks/TaskCard';
import { getGreeting, isTaskOverdue, isTaskDueNow, parseLocalDate, formatDateLabel } from '../../utils/dateUtils';
import { format, isToday, isTomorrow, isAfter, parseISO, differenceInCalendarDays } from 'date-fns';

export const TodayView: React.FC = () => {
  const { tasks, openQuickAdd, searchQuery, selectedCategoryFilter, categories, settings } = useApp();
  const greeting = getGreeting();
  const todayFormatted = format(new Date(), 'EEEE, MMMM d');
  const todayStr = format(new Date(), 'yyyy-MM-dd');

  const mainPageView = settings.mainPageView || 'both';
  const [isCompletedOpen, setIsCompletedOpen] = useState(false);

  // Filter tasks for Today view & Upcoming block
  const { 
    overdueTasks, 
    nowTasks, 
    todayTasks, 
    completedTasks, 
    upcomingTasks,
    totalTodayCount, 
    completedTodayCount 
  } = useMemo(() => {
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
    const upcomingList: typeof tasks = [];

    list.forEach(task => {
      // Completed tasks
      if (task.completed) {
        // Show tasks completed today or tasks with dueDate today
        if (task.dueDate === todayStr || (task.completedAt && isToday(parseISO(task.completedAt)))) {
          completedList.push(task);
        }
        return;
      }

      // Incomplete tasks: check overdue, now, today, or upcoming
      if (isTaskOverdue(task.dueDate, task.dueTime) && task.dueDate <= todayStr) {
        overdue.push(task);
      } else if (task.dueDate === todayStr) {
        if (isTaskDueNow(task.dueDate, task.dueTime)) {
          nowList.push(task);
        } else {
          todayList.push(task);
        }
      } else if (isAfter(parseISO(task.dueDate), parseISO(todayStr))) {
        upcomingList.push(task);
      }
    });

    // Sort upcoming chronologically: ascending by dueDate, then dueTime
    upcomingList.sort((a, b) => {
      if (a.dueDate !== b.dueDate) {
        return a.dueDate.localeCompare(b.dueDate);
      }
      if (a.dueTime && b.dueTime) {
        return a.dueTime.localeCompare(b.dueTime);
      }
      if (a.dueTime) return -1;
      if (b.dueTime) return 1;
      return 0;
    });

    const totalToday = overdue.length + nowList.length + todayList.length + completedList.length;
    const completedCount = completedList.length;

    return {
      overdueTasks: overdue,
      nowTasks: nowList,
      todayTasks: todayList,
      completedTasks: completedList,
      upcomingTasks: upcomingList,
      totalTodayCount: totalToday,
      completedTodayCount: completedCount,
    };
  }, [tasks, selectedCategoryFilter, searchQuery, todayStr]);

  // Group upcoming tasks by date for structured block display
  const upcomingGroups = useMemo(() => {
    const map = new Map<string, typeof tasks>();
    upcomingTasks.forEach(task => {
      const existing = map.get(task.dueDate) || [];
      existing.push(task);
      map.set(task.dueDate, existing);
    });

    return Array.from(map.entries()).map(([dateStr, items]) => {
      const d = parseLocalDate(dateStr);
      const isTm = isTomorrow(d);
      const diffDays = differenceInCalendarDays(d, new Date());
      let badgeText = '';
      if (isTm) {
        badgeText = 'Tomorrow';
      } else if (diffDays === 2) {
        badgeText = 'In 2 days';
      } else if (diffDays > 2 && diffDays <= 7) {
        badgeText = `In ${diffDays} days`;
      } else {
        badgeText = format(d, 'MMM d');
      }

      return {
        dateStr,
        dateObj: d,
        isTomorrow: isTm,
        badgeText,
        heading: isTm ? `Tomorrow — ${format(d, 'EEEE, MMM d')}` : format(d, 'EEEE, MMMM d'),
        tasks: items,
      };
    });
  }, [upcomingTasks]);

  const todayPendingCount = overdueTasks.length + nowTasks.length + todayTasks.length;
  const completionPercentage = totalTodayCount > 0 
    ? Math.round((completedTodayCount / totalTodayCount) * 100) 
    : 0;

  // Generate productivity progress bar: e.g. "███████░░ 70%"
  const filledBlocks = Math.round((completionPercentage / 100) * 10);
  const blockVisual = '█'.repeat(filledBlocks) + '░'.repeat(10 - filledBlocks);

  const selectedCategory = categories.find(c => c.id === selectedCategoryFilter);

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-24 sm:pb-8">
      {/* 1. Header & Daily Productivity Overview */}
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
              {selectedCategory && (
                <span 
                  className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold"
                  style={{ backgroundColor: `${selectedCategory.color}20`, color: selectedCategory.color }}
                >
                  {selectedCategory.name}
                </span>
              )}
            </p>
          </div>

          {/* Quick Action Button on Top for Desktop/Tablet */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => openQuickAdd()}
              className="inline-flex items-center gap-2 min-h-[44px] px-4 sm:px-5 py-2.5 rounded-2xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-semibold text-xs sm:text-sm shadow-md shadow-brand-500/20 active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Add Task</span>
            </button>
          </div>
        </div>

        {/* Productivity Summary Bar */}
        <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center justify-between sm:justify-start flex-wrap gap-2 text-[11px] sm:text-xs">
            <span className="font-bold text-slate-700 dark:text-slate-300">
              {todayPendingCount} pending today
            </span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span className="font-semibold text-slate-500 dark:text-slate-400">
              {completedTodayCount} of {totalTodayCount} done
            </span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span className="font-mono font-bold text-brand-600 dark:text-brand-400 tracking-wider">
              {blockVisual} {completionPercentage}%
            </span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span className="font-semibold text-indigo-600 dark:text-indigo-400">
              {upcomingTasks.length} upcoming
            </span>
          </div>

          {/* Compact Mini Progress bar */}
          <div className="w-full sm:w-44 bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden shrink-0">
            <div 
              className="bg-gradient-to-r from-brand-500 to-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* 2. BLOCK 1: TODAY'S TASKS */}
      {(mainPageView === 'both' || mainPageView === 'today') && (
        <section aria-labelledby="today-block-heading" className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-6 shadow-sm space-y-4 transition-all">
          {/* Today Block Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center shadow-sm">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 id="today-block-heading" className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                    Today's Tasks
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300">
                    {todayPendingCount}
                  </span>
                  {overdueTasks.length > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 animate-pulse">
                      {overdueTasks.length} Overdue
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {todayTasks.length + nowTasks.length} scheduled for today · {completedTodayCount} completed
                </p>
              </div>
            </div>

            <button
              onClick={() => openQuickAdd()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-50 hover:bg-brand-100 dark:bg-brand-950/60 dark:hover:bg-brand-900/60 text-brand-600 dark:text-brand-300 text-xs font-bold transition-colors min-h-[38px] active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add to Today</span>
              <span className="sm:hidden">Add</span>
            </button>
          </div>

          {/* Today Block Contents */}
          <div className="space-y-4 pt-1">
            {/* OVERDUE Section within Today */}
            {overdueTasks.length > 0 && (
              <div className="space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 px-1">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Action Needed: Overdue ({overdueTasks.length})</span>
                </div>
                <div className="space-y-2.5">
                  {overdueTasks.map(task => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                </div>
              </div>
            )}

            {/* HAPPENING NOW Section within Today */}
            {nowTasks.length > 0 && (
              <div className="space-y-2.5">
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

            {/* SCHEDULED TODAY Section */}
            {todayTasks.length > 0 && (
              <div className="space-y-2.5">
                {(overdueTasks.length > 0 || nowTasks.length > 0) && (
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-1">
                    <CalendarIcon className="w-4 h-4" />
                    <span>Scheduled Today ({todayTasks.length})</span>
                  </div>
                )}
                <div className="space-y-2.5">
                  {todayTasks.map(task => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                </div>
              </div>
            )}

            {/* All Caught Up banner if 0 pending today */}
            {todayPendingCount === 0 && (
              <div className="py-6 px-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 text-center flex flex-col items-center justify-center">
                <span className="text-2xl mb-1.5">🎉</span>
                <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300">
                  {searchQuery ? 'No matching tasks for today' : "You're all caught up for today!"}
                </p>
                <p className="text-xs text-emerald-600/80 dark:text-emerald-400/80 max-w-sm mt-0.5 mb-3">
                  {searchQuery ? 'Try clearing your search query' : 'No pending tasks left on your list today. Enjoy the rest of your day!'}
                </p>
                <button
                  onClick={() => openQuickAdd()}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Add another task for today</span>
                </button>
              </div>
            )}

            {/* COMPLETED TODAY Section (Accordion) */}
            {completedTasks.length > 0 && (
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => setIsCompletedOpen(!isCompletedOpen)}
                  className="w-full flex items-center justify-between py-2 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>Completed Today ({completedTasks.length})</span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-400">
                    <span>{isCompletedOpen ? 'Hide' : 'Show'}</span>
                    {isCompletedOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </button>

                {isCompletedOpen && (
                  <div className="space-y-2.5 pt-2 animate-fade-in">
                    {completedTasks.map(task => (
                      <TaskCard key={task.id} task={task} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      {/* 3. BLOCK 2: UPCOMING TASKS */}
      {(mainPageView === 'both' || mainPageView === 'upcoming') && (
        <section aria-labelledby="upcoming-block-heading" className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-6 shadow-sm space-y-4 transition-all">
          {/* Upcoming Block Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-sm">
                <CalendarClock className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 id="upcoming-block-heading" className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                    Upcoming Tasks
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300">
                    {upcomingTasks.length}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Scheduled for tomorrow and beyond
                </p>
              </div>
            </div>

            <button
              onClick={() => openQuickAdd('Tomorrow ')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-300 text-xs font-bold transition-colors min-h-[38px] active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Upcoming</span>
              <span className="sm:hidden">Add</span>
            </button>
          </div>

          {/* Upcoming Block Contents */}
          <div className="space-y-4 pt-1">
            {upcomingGroups.length > 0 ? (
              <div className="space-y-4">
                {upcomingGroups.map(group => (
                  <div key={group.dateStr} className="space-y-2">
                    {/* Date Subheader / Separator */}
                    <div className="flex items-center justify-between px-1">
                      <div className="flex items-center gap-2">
                        <CalendarDays className="w-4 h-4 text-indigo-500" />
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {group.heading}
                        </span>
                      </div>
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                        group.isTomorrow
                          ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/60'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                      }`}>
                        {group.badgeText} ({group.tasks.length})
                      </span>
                    </div>

                    {/* Task Cards for this Date */}
                    <div className="space-y-2.5">
                      {group.tasks.map(task => (
                        <TaskCard key={task.id} task={task} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 px-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-center flex flex-col items-center justify-center">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-500 flex items-center justify-center mb-2.5 text-xl">
                  🗓️
                </div>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  {searchQuery ? 'No matching upcoming tasks' : 'No upcoming tasks scheduled'}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-0.5 mb-3.5">
                  {searchQuery ? 'Try clearing your search query' : 'Stay organized and ahead of schedule by adding deadlines and tasks for the coming days.'}
                </p>
                <button
                  onClick={() => openQuickAdd('Tomorrow ')}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Plan upcoming task</span>
                </button>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
};
