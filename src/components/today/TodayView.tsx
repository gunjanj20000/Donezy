import React, { useMemo, useState } from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  Calendar as CalendarIcon, 
  CalendarDays,
  ChevronDown, 
  ChevronUp,
  Zap
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { TaskCard } from '../tasks/TaskCard';
import { getGreeting, isTaskOverdue, isTaskDueNow, parseLocalDate } from '../../utils/dateUtils';
import { format, isTomorrow } from 'date-fns';

export const TodayView: React.FC = () => {
  const { tasks, searchQuery, selectedCategoryFilter, categories, settings } = useApp();
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
  } = useMemo(() => {
    let list = [...tasks];

    // Filter by category if selected
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
      if (task.completed) {
        // Show tasks completed today or tasks with dueDate today
        if (task.dueDate === todayStr || (task.completedAt && task.completedAt.startsWith(todayStr))) {
          completedList.push(task);
        }
        return;
      }

      // Check overdue
      if (isTaskOverdue(task.dueDate, task.dueTime)) {
        overdue.push(task);
      } else if (task.dueDate === todayStr) {
        if (isTaskDueNow(task.dueDate, task.dueTime)) {
          nowList.push(task);
        } else {
          todayList.push(task);
        }
      } else if (task.dueDate > todayStr) {
        upcomingList.push(task);
      }
    });

    // Sort upcoming tasks by dueDate ascending, then dueTime
    upcomingList.sort((a, b) => {
      if (a.dueDate !== b.dueDate) {
        return a.dueDate.localeCompare(b.dueDate);
      }
      if (a.dueTime && b.dueTime) {
        return a.dueTime.localeCompare(b.dueTime);
      }
      return 0;
    });

    return {
      overdueTasks: overdue,
      nowTasks: nowList,
      todayTasks: todayList,
      completedTasks: completedList,
      upcomingTasks: upcomingList,
    };
  }, [tasks, selectedCategoryFilter, searchQuery, todayStr]);

  // Group upcoming tasks by date for structured display
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

      return {
        dateStr,
        dateObj: d,
        isTomorrow: isTm,
        heading: isTm ? `Tomorrow — ${format(d, 'EEEE, MMM d')}` : format(d, 'EEEE, MMMM d'),
        tasks: items,
      };
    });
  }, [upcomingTasks]);

  const todayPendingCount = overdueTasks.length + nowTasks.length + todayTasks.length;
  const selectedCategory = categories.find(c => c.id === selectedCategoryFilter);

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-24 sm:pb-8">
      {/* 1. Greetings Header */}
      <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="text-2xl sm:text-3xl">{greeting.icon}</span>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {greeting.text}
            </h1>
            <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 mt-0.5">
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
        </div>
      </div>

      {/* 2. Today's Tasks */}
      {(mainPageView === 'both' || mainPageView === 'today') && (
        <section aria-labelledby="today-heading" className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 id="today-heading" className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Today's Tasks</span>
              {todayPendingCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300">
                  {todayPendingCount}
                </span>
              )}
            </h2>
          </div>

          <div className="space-y-3">
            {/* OVERDUE Section */}
            {overdueTasks.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 px-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Overdue ({overdueTasks.length})</span>
                </div>
                <div className="space-y-2.5">
                  {overdueTasks.map(task => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                </div>
              </div>
            )}

            {/* HAPPENING NOW Section */}
            {nowTasks.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 px-1">
                  <Zap className="w-3.5 h-3.5" />
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
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-1">
                    <CalendarIcon className="w-3.5 h-3.5" />
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

            {/* If 0 pending today */}
            {todayPendingCount === 0 && (
              <div className="py-6 px-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-center flex flex-col items-center justify-center shadow-sm">
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                  {searchQuery ? 'No matching tasks for today' : 'No tasks for today'}
                </p>
              </div>
            )}

            {/* COMPLETED TODAY Section (Accordion) */}
            {completedTasks.length > 0 && (
              <div className="pt-1">
                <button
                  onClick={() => setIsCompletedOpen(!isCompletedOpen)}
                  className="w-full flex items-center justify-between py-2 px-1 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
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
                  <div className="space-y-2.5 pt-1 animate-fade-in">
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

      {/* 3. Upcoming Tasks shown with dates */}
      {(mainPageView === 'both' || mainPageView === 'upcoming') && (
        <section aria-labelledby="upcoming-heading" className="space-y-3 pt-2">
          <div className="flex items-center justify-between px-1">
            <h2 id="upcoming-heading" className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Upcoming Tasks</span>
              {upcomingTasks.length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-accent-100 dark:bg-accent-900/40 text-accent-700 dark:text-accent-300">
                  {upcomingTasks.length}
                </span>
              )}
            </h2>
          </div>

          <div className="space-y-4">
            {upcomingGroups.length > 0 ? (
              upcomingGroups.map(group => (
                <div key={group.dateStr} className="space-y-2">
                  {/* Date Heading */}
                  <div className="flex items-center gap-2 px-1 pt-1">
                    <CalendarDays className="w-4 h-4 text-accent-500" />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {group.heading}
                    </span>
                  </div>

                  {/* Task Cards for this Date */}
                  <div className="space-y-2.5">
                    {group.tasks.map(task => (
                      <TaskCard key={task.id} task={task} />
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="py-6 px-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-center flex flex-col items-center justify-center shadow-sm">
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                  {searchQuery ? 'No matching upcoming tasks' : 'No upcoming tasks'}
                </p>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
};
