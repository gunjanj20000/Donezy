import React, { useState, useMemo } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Calendar as CalendarIcon, 
  Clock, 
  CheckCircle2, 
  ListFilter 
} from 'lucide-react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  isToday, 
  addDays, 
  subDays,
  parseISO 
} from 'date-fns';
import { useApp } from '../../context/AppContext';
import { TaskCard } from '../tasks/TaskCard';
import { formatTimeDisplay } from '../../utils/dateUtils';

type CalendarMode = 'month' | 'week' | 'day' | 'agenda';

export const CalendarView: React.FC = () => {
  const { tasks, openQuickAdd } = useApp();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [mode, setMode] = useState<CalendarMode>('month');

  // Month navigation
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };

  // Month days calculation
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const daysInMonthGrid = eachDayOfInterval({ start: startDate, end: endDate });

  // Week days calculation
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
  const daysInWeek = eachDayOfInterval({ start: weekStart, end: weekEnd });

  // Map tasks by date
  const tasksByDate = useMemo(() => {
    const map = new Map<string, typeof tasks>();
    tasks.forEach(t => {
      const arr = map.get(t.dueDate) || [];
      arr.push(t);
      map.set(t.dueDate, arr);
    });
    return map;
  }, [tasks]);

  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
  const selectedDateTasks = tasksByDate.get(selectedDateStr) || [];

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-24 sm:pb-8">
      {/* Calendar Header with Mode Toggles */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-3.5 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <h1 className="text-lg sm:text-2xl font-extrabold text-slate-900 dark:text-white">
              {format(currentDate, 'MMMM yyyy')}
            </h1>
            <button
              onClick={goToToday}
              className="text-[11px] sm:text-xs font-bold px-2.5 sm:px-3 py-1 rounded-xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 border border-brand-200 dark:border-brand-800 min-h-[36px] flex items-center"
            >
              Today
            </button>
          </div>

          {/* Mode Switchers */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl self-start sm:self-auto overflow-x-auto no-scrollbar max-w-full">
            {(['month', 'week', 'day', 'agenda'] as CalendarMode[]).map(m => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`min-h-[38px] px-2.5 sm:px-3.5 py-1 rounded-xl text-[11px] sm:text-xs font-semibold capitalize transition-all ${
                  mode === m
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          {/* Navigation Arrows */}
          <div className="flex items-center gap-2">
            <button
              onClick={prevMonth}
              aria-label="Previous month"
              className="w-10 h-10 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={nextMonth}
              aria-label="Next month"
              className="w-10 h-10 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* MONTH VIEW */}
        {mode === 'month' && (
          <div>
            {/* Days of week header */}
            <div className="grid grid-cols-7 gap-0.5 sm:gap-1 text-center mb-1 sm:mb-2">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                <div key={day} className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider py-1 truncate">
                  {day}
                </div>
              ))}
            </div>

            {/* Grid */}
            <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
              {daysInMonthGrid.map(day => {
                const dayStr = format(day, 'yyyy-MM-dd');
                const dayTasks = tasksByDate.get(dayStr) || [];
                const isSelected = isSameDay(day, selectedDate);
                const isCurrentMonth = isSameMonth(day, currentDate);
                const isTodayDate = isToday(day);

                return (
                  <button
                    key={dayStr}
                    type="button"
                    onClick={() => setSelectedDate(day)}
                    className={`min-h-[48px] sm:min-h-[68px] p-0.5 sm:p-1.5 rounded-xl sm:rounded-2xl flex flex-col items-center justify-between border transition-all text-left relative ${
                      isSelected
                        ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/40 shadow-sm'
                        : 'border-slate-100 dark:border-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    } ${!isCurrentMonth ? 'opacity-35' : ''}`}
                  >
                    <span
                      className={`w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-full text-[11px] sm:text-xs font-bold ${
                        isTodayDate
                          ? 'bg-brand-600 text-white shadow-sm'
                          : isSelected
                            ? 'text-brand-600 dark:text-brand-400'
                            : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {format(day, 'd')}
                    </span>

                    {/* Task count dots */}
                    {dayTasks.length > 0 && (
                      <div className="flex items-center gap-0.5 mt-0.5 mb-0.5">
                        {dayTasks.slice(0, 3).map((t, idx) => (
                          <span
                            key={idx}
                            className={`w-1 sm:w-1.5 h-1 sm:h-1.5 rounded-full ${
                              t.completed ? 'bg-emerald-400' : 'bg-brand-500'
                            }`}
                          />
                        ))}
                        {dayTasks.length > 3 && (
                          <span className="text-[8px] sm:text-[9px] font-bold text-slate-400 leading-none">
                            +{dayTasks.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* WEEK VIEW */}
        {mode === 'week' && (
          <div className="grid grid-cols-7 gap-2">
            {daysInWeek.map(day => {
              const dayStr = format(day, 'yyyy-MM-dd');
              const dayTasks = tasksByDate.get(dayStr) || [];
              const isSelected = isSameDay(day, selectedDate);
              const isTodayDate = isToday(day);

              return (
                <button
                  key={dayStr}
                  onClick={() => setSelectedDate(day)}
                  className={`min-h-[80px] p-2 rounded-2xl flex flex-col items-center justify-between border transition-all ${
                    isSelected
                      ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/40'
                      : 'border-slate-100 dark:border-slate-800'
                  }`}
                >
                  <span className="text-[11px] font-bold uppercase text-slate-400">
                    {format(day, 'EEE')}
                  </span>
                  <span
                    className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold ${
                      isTodayDate
                        ? 'bg-brand-600 text-white'
                        : isSelected
                          ? 'text-brand-600 dark:text-brand-400'
                          : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {format(day, 'd')}
                  </span>
                  <span className="text-[11px] font-bold text-slate-500">
                    {dayTasks.length} {dayTasks.length === 1 ? 'task' : 'tasks'}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* DAY VIEW QUICK NAV */}
        {mode === 'day' && (
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800">
            <button
              onClick={() => setSelectedDate(subDays(selectedDate, 1))}
              className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="text-center">
              <span className="text-sm font-bold text-slate-900 dark:text-white block">
                {format(selectedDate, 'EEEE, MMMM d, yyyy')}
              </span>
              <span className="text-xs text-slate-400">
                {selectedDateTasks.length} tasks scheduled
              </span>
            </div>
            <button
              onClick={() => setSelectedDate(addDays(selectedDate, 1))}
              className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {/* Selected Date Tasks List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {format(selectedDate, 'EEEE, MMM d')}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {selectedDateTasks.length} {selectedDateTasks.length === 1 ? 'task' : 'tasks'}
            </p>
          </div>

          <button
            onClick={() => openQuickAdd(`Task for ${format(selectedDate, 'MMMM d')} `)}
            className="min-h-[44px] px-4 py-2 rounded-2xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-brand-500/20 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add on this day</span>
          </button>
        </div>

        {selectedDateTasks.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center flex flex-col items-center justify-center">
            <CalendarIcon className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-2" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
              No tasks for this day
            </p>
            <p className="text-xs text-slate-400 mb-4">
              Tap below to schedule a new task.
            </p>
            <button
              onClick={() => openQuickAdd(`Task on ${format(selectedDate, 'MMM d')} `)}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
            >
              + Add Task
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {selectedDateTasks.map(task => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        )}
      </div>

      {/* AGENDA VIEW */}
      {mode === 'agenda' && (
        <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
          <h2 className="text-base font-bold text-slate-800 dark:text-slate-200">
            Upcoming Agenda (Next 14 Days)
          </h2>
          <div className="space-y-3">
            {Array.from({ length: 14 }).map((_, i) => {
              const dt = addDays(new Date(), i);
              const dStr = format(dt, 'yyyy-MM-dd');
              const dTasks = tasksByDate.get(dStr) || [];
              if (dTasks.length === 0) return null;

              return (
                <div key={dStr} className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="text-xs font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wider">
                    {format(dt, 'EEE, MMMM d')} {isToday(dt) && '· Today'}
                  </div>
                  <div className="space-y-2">
                    {dTasks.map(t => (
                      <TaskCard key={t.id} task={t} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
