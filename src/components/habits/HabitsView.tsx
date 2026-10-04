import React, { useState } from 'react';
import { 
  Sparkles, 
  Plus, 
  Trash2, 
  Check, 
  Flame, 
  Droplets, 
  Footprints, 
  BookOpen, 
  Sun,
  X
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Habit } from '../../types';
import { format, subDays, isToday } from 'date-fns';
import { IconRenderer } from '../common/IconRenderer';

const PRESET_ICONS = ['Droplets', 'Footprints', 'BookOpen', 'Sun', 'HeartPulse', 'Check', 'Smile', 'Zap'];
const PRESET_COLORS = ['#06b6d4', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899', '#3b82f6'];

export const HabitsView: React.FC = () => {
  const { habits, toggleHabit, saveHabit, deleteHabit } = useApp();
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newIcon, setNewIcon] = useState('Droplets');
  const [newColor, setNewColor] = useState('#10b981');

  // Last 7 days
  const last7Days = Array.from({ length: 7 }).map((_, i) => {
    const d = subDays(new Date(), 6 - i);
    return {
      date: format(d, 'yyyy-MM-dd'),
      dayName: format(d, 'EEE'),
      dayNumber: format(d, 'd'),
      isToday: isToday(d),
    };
  });

  const handleCreateHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newHabit: Habit = {
      id: `habit-${Date.now()}`,
      title: newTitle.trim(),
      icon: newIcon,
      color: newColor,
      frequency: 'daily',
      completedDates: [],
      createdAt: new Date().toISOString(),
    };

    await saveHabit(newHabit);
    setNewTitle('');
    setIsAdding(false);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-24 sm:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Flame className="w-6 h-6 text-amber-500" />
            <span>Daily Habits</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Lightweight daily routines. Tap any day to log progress.
          </p>
        </div>

        <button
          onClick={() => setIsAdding(true)}
          className="min-h-[44px] px-4 py-2.5 rounded-2xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-brand-500/20 active:scale-95 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>New Habit</span>
        </button>
      </div>

      {/* Add Habit Inline Card */}
      {isAdding && (
        <form onSubmit={handleCreateHabit} className="bg-white dark:bg-slate-900 rounded-3xl p-5 border-2 border-brand-500/40 shadow-lg space-y-4 animate-scale-in">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Add New Habit
            </h3>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Habit Name
            </label>
            <input
              type="text"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              placeholder="e.g. Read 20 pages, 10 min stretch..."
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                Icon
              </label>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_ICONS.map(ic => (
                  <button
                    key={ic}
                    type="button"
                    onClick={() => setNewIcon(ic)}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all ${
                      newIcon === ic
                        ? 'border-brand-500 bg-brand-50 dark:bg-brand-950 text-brand-600'
                        : 'border-slate-200 dark:border-slate-700 text-slate-500'
                    }`}
                  >
                    <IconRenderer name={ic} className="w-4 h-4" />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                Color
              </label>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_COLORS.map(col => (
                  <button
                    key={col}
                    type="button"
                    onClick={() => setNewColor(col)}
                    className={`w-7 h-7 rounded-full transition-transform ${
                      newColor === col ? 'scale-110 ring-2 ring-offset-2 ring-slate-400' : ''
                    }`}
                    style={{ backgroundColor: col }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!newTitle.trim()}
              className="px-4 py-1.5 rounded-xl bg-brand-600 text-white text-xs font-semibold shadow-sm disabled:opacity-40"
            >
              Create Habit
            </button>
          </div>
        </form>
      )}

      {/* Habits List */}
      <div className="space-y-3">
        {habits.map(habit => {
          // Calculate streak
          let streak = 0;
          let check = new Date();
          while (habit.completedDates.includes(format(check, 'yyyy-MM-dd'))) {
            streak++;
            check = subDays(check, 1);
          }

          return (
            <div 
              key={habit.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              {/* Habit Title & Streak */}
              <div className="flex items-center gap-3">
                <div 
                  className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm"
                  style={{ backgroundColor: `${habit.color}20`, color: habit.color }}
                >
                  <IconRenderer name={habit.icon} className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                    {habit.title}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1 font-semibold text-amber-500">
                      <Flame className="w-3.5 h-3.5 fill-amber-500" />
                      {streak} day streak
                    </span>
                    <span>•</span>
                    <span>{habit.completedDates.length} total check-ins</span>
                  </div>
                </div>
              </div>

              {/* 7-Day Completion Dots */}
              <div className="flex items-center gap-1.5 sm:gap-2 self-center sm:self-auto">
                {last7Days.map(day => {
                  const isDone = habit.completedDates.includes(day.date);
                  return (
                    <button
                      key={day.date}
                      type="button"
                      onClick={() => toggleHabit(habit.id, day.date)}
                      className={`min-w-[44px] min-h-[50px] px-1 py-1.5 rounded-2xl flex flex-col items-center justify-between border transition-all active:scale-95 ${
                        isDone
                          ? 'border-transparent text-white shadow-sm'
                          : 'border-slate-200 dark:border-slate-800 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                      } ${day.isToday ? 'ring-2 ring-brand-500/30' : ''}`}
                      style={{
                        backgroundColor: isDone ? habit.color : undefined
                      }}
                      title={`${day.dayName} (${day.date}): ${isDone ? 'Completed' : 'Not completed'}`}
                    >
                      <span className={`text-[10px] font-bold uppercase ${isDone ? 'text-white/80' : 'text-slate-400'}`}>
                        {day.dayName}
                      </span>
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center ${isDone ? 'bg-white/20' : ''}`}>
                        {isDone ? (
                          <Check className="w-3.5 h-3.5 stroke-[3] text-white" />
                        ) : (
                          <span className="text-[11px] font-semibold text-slate-500">{day.dayNumber}</span>
                        )}
                      </div>
                    </button>
                  );
                })}

                {/* Delete Habit */}
                <button
                  type="button"
                  onClick={() => deleteHabit(habit.id)}
                  aria-label="Delete habit"
                  className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 ml-1 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
