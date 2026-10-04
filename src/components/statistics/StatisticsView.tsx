import React, { useMemo } from 'react';
import { 
  BarChart3, 
  CheckCircle2, 
  Flame, 
  TrendingUp, 
  Clock, 
  AlertCircle, 
  Award, 
  Calendar 
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { isToday, isThisWeek, parseISO, format, subDays } from 'date-fns';
import { isTaskOverdue } from '../../utils/dateUtils';

export const StatisticsView: React.FC = () => {
  const { tasks, categories } = useApp();

  const stats = useMemo(() => {
    let completedToday = 0;
    let completedThisWeek = 0;
    let totalCompleted = 0;
    let totalTasks = tasks.length;
    let overdueCount = 0;

    const dayFrequency: Record<string, number> = {};
    const categoryFrequency: Record<string, number> = {};

    tasks.forEach(t => {
      if (t.completed) {
        totalCompleted++;
        if (t.completedAt) {
          const compDate = parseISO(t.completedAt);
          if (isToday(compDate)) completedToday++;
          if (isThisWeek(compDate)) completedThisWeek++;

          const dayName = format(compDate, 'EEEE');
          dayFrequency[dayName] = (dayFrequency[dayName] || 0) + 1;
        }

        if (t.categoryId) {
          categoryFrequency[t.categoryId] = (categoryFrequency[t.categoryId] || 0) + 1;
        }
      } else {
        if (isTaskOverdue(t.dueDate, t.dueTime)) {
          overdueCount++;
        }
      }
    });

    const completionRate = totalTasks > 0 ? Math.round((totalCompleted / totalTasks) * 100) : 0;

    // Find most productive day
    let mostProductiveDay = 'None yet';
    let maxDayCount = 0;
    Object.entries(dayFrequency).forEach(([day, count]) => {
      if (count > maxDayCount) {
        maxDayCount = count;
        mostProductiveDay = day;
      }
    });

    // Find top category
    let topCategory = 'General';
    let maxCatCount = 0;
    Object.entries(categoryFrequency).forEach(([catId, count]) => {
      if (count > maxCatCount) {
        maxCatCount = count;
        const c = categories.find(item => item.id === catId);
        if (c) topCategory = c.name;
      }
    });

    // 7-day completion chart numbers
    const last7DaysData = Array.from({ length: 7 }).map((_, i) => {
      const dt = subDays(new Date(), 6 - i);
      const dtStr = format(dt, 'yyyy-MM-dd');
      const count = tasks.filter(t => t.completed && t.completedAt && format(parseISO(t.completedAt), 'yyyy-MM-dd') === dtStr).length;
      return {
        day: format(dt, 'EEE'),
        count,
      };
    });

    return {
      completedToday,
      completedThisWeek,
      totalCompleted,
      completionRate,
      overdueCount,
      mostProductiveDay,
      topCategory,
      last7DaysData,
    };
  }, [tasks, categories]);

  const maxDailyCount = Math.max(1, ...stats.last7DaysData.map(d => d.count));

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-24 sm:pb-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-brand-600 dark:text-brand-400" />
          <span>Productivity Dashboard</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Your personal task completion analytics and trends.
        </p>
      </div>

      {/* Grid of Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {/* Completed Today */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-sm">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mb-0.5">
            {stats.completedToday}
          </div>
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Completed Today
          </div>
        </div>

        {/* This Week */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-sm">
          <div className="w-10 h-10 rounded-2xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center mb-3">
            <Calendar className="w-5 h-5" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mb-0.5">
            {stats.completedThisWeek}
          </div>
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            This Week
          </div>
        </div>

        {/* Completion Rate */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-sm">
          <div className="w-10 h-10 rounded-2xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center mb-3">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mb-0.5">
            {stats.completionRate}%
          </div>
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Completion Rate
          </div>
        </div>

        {/* Overdue Tasks */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-sm">
          <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-3">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400 mb-0.5">
            {stats.overdueCount}
          </div>
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Overdue Tasks
          </div>
        </div>
      </div>

      {/* 7-Day Velocity Visualizer */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
          Last 7 Days Activity
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
          Daily completed tasks velocity.
        </p>

        <div className="flex items-end justify-between gap-2 h-36 pt-4 px-2">
          {stats.last7DaysData.map(d => {
            const heightPercent = Math.max(8, Math.round((d.count / maxDailyCount) * 100));
            return (
              <div key={d.day} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  {d.count > 0 ? d.count : ''}
                </span>
                <div className="w-full max-w-[36px] bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden flex items-end h-full">
                  <div
                    className="w-full bg-gradient-to-t from-brand-600 to-accent-400 rounded-xl transition-all duration-500"
                    style={{ height: `${heightPercent}%` }}
                  />
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {d.day}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Highlights Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-200/60 dark:border-amber-900/40 rounded-3xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <Award className="w-6 h-6 text-amber-500" />
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Most Productive Day
            </h4>
          </div>
          <div className="text-xl font-black text-amber-600 dark:text-amber-400">
            {stats.mostProductiveDay}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            You complete the highest volume of items on this day.
          </p>
        </div>

        <div className="bg-gradient-to-br from-brand-500/10 via-brand-500/5 to-transparent border border-brand-200/60 dark:border-brand-900/40 rounded-3xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <Flame className="w-6 h-6 text-brand-600 dark:text-brand-400" />
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Top Category
            </h4>
          </div>
          <div className="text-xl font-black text-brand-600 dark:text-brand-400">
            {stats.topCategory}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Category with your most completed achievements.
          </p>
        </div>
      </div>
    </div>
  );
};
