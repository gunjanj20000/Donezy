import React, { useState, useEffect } from 'react';
import { 
  Sun, 
  Moon, 
  Calendar as CalendarIcon, 
  CheckSquare, 
  Bell, 
  Flame, 
  BarChart3, 
  Settings as SettingsIcon, 
  Plus, 
  Search, 
  Sparkles, 
  MoreHorizontal, 
  X,
  Clock,
  Compass
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ViewTab } from '../../types';
import { TodayView } from '../today/TodayView';
import { CalendarView } from '../calendar/CalendarView';
import { TasksView } from '../tasks/TasksView';
import { RemindersView } from '../reminders/RemindersView';
import { HabitsView } from '../habits/HabitsView';
import { StatisticsView } from '../statistics/StatisticsView';
import { SettingsView } from '../settings/SettingsView';
import { QuickAddSheet } from '../quickadd/QuickAddSheet';
import { TaskDetailModal } from '../tasks/TaskDetailModal';
import { ActiveReminderModal } from '../reminders/ActiveReminderModal';
import { FirstRunWelcomeModal } from '../common/FirstRunWelcomeModal';
import { PwaInstallPrompt } from '../common/PwaInstallPrompt';
import { formatTimeDisplay, formatDateLabel } from '../../utils/dateUtils';
import { format } from 'date-fns';

export const AppShell: React.FC = () => {
  const { 
    selectedTab, 
    setSelectedTab, 
    openQuickAdd, 
    tasks, 
    settings, 
    updateSettings,
    searchQuery,
    setSearchQuery
  } = useApp();

  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);

  // Keyboard shortcut: Cmd/Ctrl + K for search, N for new task
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchExpanded(prev => !prev);
      }
      if (e.key === 'n' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        openQuickAdd();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [openQuickAdd]);

  // Upcoming reminders for desktop right-side panel
  const upcomingReminders = tasks
    .filter(t => !t.completed && (t.reminder?.enabled || t.dueTime))
    .slice(0, 4);

  // Today progress calculation for desktop right-side panel
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const todayTasks = tasks.filter(t => t.dueDate === todayStr);
  const completedToday = todayTasks.filter(t => t.completed).length;
  const progressPercent = todayTasks.length > 0 ? Math.round((completedToday / todayTasks.length) * 100) : 0;

  const navItems: { id: ViewTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { 
      id: 'today', 
      label: 'Today', 
      icon: <Sparkles className="w-5 h-5" />,
      badge: tasks.filter(t => !t.completed && t.dueDate === todayStr).length
    },
    { 
      id: 'calendar', 
      label: 'Calendar', 
      icon: <CalendarIcon className="w-5 h-5" /> 
    },
    { 
      id: 'tasks', 
      label: 'Tasks', 
      icon: <CheckSquare className="w-5 h-5" />,
      badge: tasks.filter(t => !t.completed).length
    },
    { 
      id: 'reminders', 
      label: 'Reminders', 
      icon: <Bell className="w-5 h-5" />,
      badge: tasks.filter(t => !t.completed && (t.reminder?.enabled || t.dueTime)).length
    },
    { 
      id: 'habits', 
      label: 'Habits', 
      icon: <Flame className="w-5 h-5" /> 
    },
    { 
      id: 'stats', 
      label: 'Statistics', 
      icon: <BarChart3 className="w-5 h-5" /> 
    },
    { 
      id: 'settings', 
      label: 'Settings', 
      icon: <SettingsIcon className="w-5 h-5" /> 
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col antialiased">
      {/* Top Bar for Mobile & Tablet */}
      <header className="md:hidden sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-brand-600 to-pink-500 flex items-center justify-center text-white shadow-md shadow-brand-500/25">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-extrabold tracking-tight bg-gradient-to-r from-brand-600 to-indigo-600 bg-clip-text text-transparent">
              SmartDay
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Search Toggle */}
          <button
            onClick={() => setIsSearchExpanded(!isSearchExpanded)}
            aria-label="Toggle search"
            className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Dark Mode Toggle */}
          <button
            onClick={() => updateSettings({ darkMode: !settings.darkMode })}
            aria-label="Toggle dark mode"
            className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {settings.darkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Expandable Mobile Search Bar */}
      {isSearchExpanded && (
        <div className="md:hidden px-4 py-2 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 animate-slide-down">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search tasks, tags, notes..."
              autoFocus
              className="w-full bg-slate-100 dark:bg-slate-800 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="flex-1 flex max-w-7xl mx-auto w-full">
        {/* DESKTOP / IPAD SIDEBAR */}
        <aside className="hidden md:flex flex-col w-64 lg:w-72 shrink-0 border-r border-slate-200/80 dark:border-slate-800 p-5 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md sticky top-0 h-screen overflow-y-auto">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-6 px-2">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-brand-500/25">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-brand-600 to-indigo-600 bg-clip-text text-transparent block">
                SmartDay
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Smart Todo & Reminder
              </span>
            </div>
          </div>

          {/* Quick Add Button */}
          <button
            onClick={() => openQuickAdd()}
            className="w-full min-h-[48px] mb-6 px-4 py-3 rounded-2xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-brand-500/25 active:scale-95 transition-all"
          >
            <Plus className="w-5 h-5 stroke-[2.5]" />
            <span>New Task</span>
            <kbd className="hidden lg:inline-block ml-auto text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-white/20 text-white">
              N
            </kbd>
          </button>

          {/* Navigation Links */}
          <nav className="space-y-1.5 flex-1">
            {navItems.map(item => {
              const isActive = selectedTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setSelectedTab(item.id)}
                  className={`w-full min-h-[46px] px-3.5 py-2.5 rounded-2xl flex items-center justify-between text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-brand-600 text-white shadow-md shadow-brand-500/25'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Sidebar Footer */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <button
              onClick={() => updateSettings({ darkMode: !settings.darkMode })}
              className="flex items-center gap-2 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
            >
              {settings.darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
              <span className="font-semibold">{settings.darkMode ? 'Light' : 'Dark'}</span>
            </button>
            <span className="text-[10px] font-bold text-slate-400">
              v1.0 • Offline
            </span>
          </div>
        </aside>

        {/* WORKSPACE CENTER AREA */}
        <main className="flex-1 px-4 sm:px-6 md:px-8 py-6 min-w-0">
          {selectedTab === 'today' && <TodayView />}
          {selectedTab === 'calendar' && <CalendarView />}
          {selectedTab === 'tasks' && <TasksView />}
          {selectedTab === 'reminders' && <RemindersView />}
          {selectedTab === 'habits' && <HabitsView />}
          {selectedTab === 'stats' && <StatisticsView />}
          {selectedTab === 'settings' && <SettingsView />}
        </main>

        {/* DESKTOP RIGHT-SIDE PANEL (Widget area) */}
        <aside className="hidden xl:block w-72 shrink-0 border-l border-slate-200/80 dark:border-slate-800 p-6 space-y-6 sticky top-0 h-screen overflow-y-auto">
          {/* Today's Progress Card */}
          <div className="bg-gradient-to-br from-brand-600 to-indigo-700 text-white rounded-3xl p-5 shadow-lg shadow-brand-500/20">
            <span className="text-[11px] font-bold uppercase tracking-wider text-brand-200 block mb-1">
              Today's Progress
            </span>
            <div className="flex items-baseline justify-between mb-3">
              <span className="text-3xl font-black">
                {progressPercent}%
              </span>
              <span className="text-xs font-semibold text-brand-100">
                {completedToday} of {todayTasks.length} done
              </span>
            </div>
            <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-white h-full rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Upcoming Reminders Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-brand-600" />
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Upcoming Alerts
                </h4>
              </div>
              <button
                onClick={() => setSelectedTab('reminders')}
                className="text-[11px] font-semibold text-brand-600 hover:underline"
              >
                View all
              </button>
            </div>

            {upcomingReminders.length === 0 ? (
              <p className="text-xs text-slate-400 py-2">
                No upcoming alerts for today.
              </p>
            ) : (
              <div className="space-y-2">
                {upcomingReminders.map(t => (
                  <div key={t.id} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60">
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200 line-clamp-1">
                      {t.title}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" />
                      <span>{formatDateLabel(t.dueDate)}</span>
                      {t.dueTime && <span>· {formatTimeDisplay(t.dueTime, settings.timeFormat === '12h')}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Presets Trigger */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-3">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              One-Tap Presets
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: '📞 Call', prefix: 'Call ' },
                { label: '🛒 Buy', prefix: 'Buy ' },
                { label: '💳 Pay', prefix: 'Pay ' },
                { label: '💊 Meds', prefix: 'Take ' },
                { label: '🏃 Run', prefix: 'Workout: ' },
                { label: '📅 Meet', prefix: 'Meeting: ' },
              ].map(p => (
                <button
                  key={p.label}
                  onClick={() => openQuickAdd(p.prefix)}
                  className="p-2 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-left border border-slate-100 dark:border-slate-700 transition-colors"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 px-3 py-2 flex items-center justify-around">
        <button
          onClick={() => setSelectedTab('today')}
          aria-label="Today"
          className={`min-w-[44px] min-h-[44px] flex flex-col items-center justify-center gap-0.5 transition-colors ${
            selectedTab === 'today' ? 'text-brand-600 font-bold' : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <Sparkles className="w-5 h-5" />
          <span className="text-[10px]">Today</span>
        </button>

        <button
          onClick={() => setSelectedTab('calendar')}
          aria-label="Calendar"
          className={`min-w-[44px] min-h-[44px] flex flex-col items-center justify-center gap-0.5 transition-colors ${
            selectedTab === 'calendar' ? 'text-brand-600 font-bold' : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <CalendarIcon className="w-5 h-5" />
          <span className="text-[10px]">Calendar</span>
        </button>

        {/* Floating Action Button in Center */}
        <div className="relative -top-5">
          <button
            onClick={() => openQuickAdd()}
            aria-label="Add task"
            className="w-14 h-14 rounded-full bg-gradient-to-tr from-brand-600 via-indigo-600 to-pink-500 text-white flex items-center justify-center shadow-xl shadow-brand-500/35 active:scale-90 transition-transform ring-4 ring-white dark:ring-slate-900"
          >
            <Plus className="w-7 h-7 stroke-[2.5]" />
          </button>
        </div>

        <button
          onClick={() => setSelectedTab('tasks')}
          aria-label="Tasks"
          className={`min-w-[44px] min-h-[44px] flex flex-col items-center justify-center gap-0.5 transition-colors ${
            selectedTab === 'tasks' ? 'text-brand-600 font-bold' : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <CheckSquare className="w-5 h-5" />
          <span className="text-[10px]">Tasks</span>
        </button>

        <button
          onClick={() => setIsMoreMenuOpen(true)}
          aria-label="More"
          className={`min-w-[44px] min-h-[44px] flex flex-col items-center justify-center gap-0.5 transition-colors ${
            ['reminders', 'habits', 'stats', 'settings'].includes(selectedTab)
              ? 'text-brand-600 font-bold'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <MoreHorizontal className="w-5 h-5" />
          <span className="text-[10px]">More</span>
        </button>
      </nav>

      {/* MOBILE "MORE" SHEET */}
      {isMoreMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end animate-fade-in"
          onClick={() => setIsMoreMenuOpen(false)}
        >
          <div 
            onClick={e => e.stopPropagation()}
            className="w-full bg-white dark:bg-slate-900 rounded-t-3xl p-5 border-t border-slate-200 dark:border-slate-800 space-y-3 animate-slide-up"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                More Features
              </span>
              <button 
                onClick={() => setIsMoreMenuOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <button
                onClick={() => {
                  setSelectedTab('reminders');
                  setIsMoreMenuOpen(false);
                }}
                className={`min-h-[48px] p-3 rounded-2xl flex items-center gap-3 border text-left ${
                  selectedTab === 'reminders'
                    ? 'border-brand-500 bg-brand-50 dark:bg-brand-950 text-brand-600'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <Bell className="w-5 h-5 text-brand-600" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Reminders</span>
              </button>

              <button
                onClick={() => {
                  setSelectedTab('habits');
                  setIsMoreMenuOpen(false);
                }}
                className={`min-h-[48px] p-3 rounded-2xl flex items-center gap-3 border text-left ${
                  selectedTab === 'habits'
                    ? 'border-brand-500 bg-brand-50 dark:bg-brand-950 text-brand-600'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <Flame className="w-5 h-5 text-amber-500" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Habits</span>
              </button>

              <button
                onClick={() => {
                  setSelectedTab('stats');
                  setIsMoreMenuOpen(false);
                }}
                className={`min-h-[48px] p-3 rounded-2xl flex items-center gap-3 border text-left ${
                  selectedTab === 'stats'
                    ? 'border-brand-500 bg-brand-50 dark:bg-brand-950 text-brand-600'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <BarChart3 className="w-5 h-5 text-indigo-500" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Statistics</span>
              </button>

              <button
                onClick={() => {
                  setSelectedTab('settings');
                  setIsMoreMenuOpen(false);
                }}
                className={`min-h-[48px] p-3 rounded-2xl flex items-center gap-3 border text-left ${
                  selectedTab === 'settings'
                    ? 'border-brand-500 bg-brand-50 dark:bg-brand-950 text-brand-600'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <SettingsIcon className="w-5 h-5 text-slate-500" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Settings</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODALS */}
      <QuickAddSheet />
      <TaskDetailModal />
      <ActiveReminderModal />
      <FirstRunWelcomeModal />
      <PwaInstallPrompt />
    </div>
  );
};
