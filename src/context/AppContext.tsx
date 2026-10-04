import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { 
  Task, 
  Category, 
  Habit, 
  AppSettings, 
  ViewTab, 
  TaskFilterType 
} from '../types';
import { TaskRepository } from '../repositories/TaskRepository';
import { CategoryRepository } from '../repositories/CategoryRepository';
import { HabitRepository } from '../repositories/HabitRepository';
import { SettingsRepository } from '../repositories/SettingsRepository';
import { HistoryRepository } from '../repositories/HistoryRepository';
import { sounds, NotificationService } from '../services/NotificationService';
import { getNextOccurrenceDate } from '../utils/recurrence';
import { format, isToday, parseISO } from 'date-fns';

interface AppContextType {
  tasks: Task[];
  categories: Category[];
  habits: Habit[];
  settings: AppSettings;
  loading: boolean;
  selectedTab: ViewTab;
  setSelectedTab: (tab: ViewTab) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  filter: TaskFilterType;
  setFilter: (f: TaskFilterType) => void;
  selectedCategoryFilter: string | null;
  setSelectedCategoryFilter: (catId: string | null) => void;
  
  // Quick Add & Edit Modals
  isQuickAddOpen: boolean;
  quickAddInitialText: string;
  quickAddPreset?: string;
  openQuickAdd: (initialText?: string, preset?: string) => void;
  closeQuickAdd: () => void;
  
  selectedTaskForEdit: Task | null;
  setSelectedTaskForEdit: (task: Task | null) => void;
  
  // Active Reminder Modal
  activeReminderTask: Task | null;
  dismissReminder: () => void;
  snoozeReminder: (minutes: number) => void;

  // Task Actions
  createTask: (data: Partial<Task>, source?: Task['source']) => Promise<Task>;
  updateTask: (task: Task) => Promise<void>;
  toggleTaskComplete: (id: string) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;

  // Category Actions
  saveCategory: (category: Category) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;

  // Habit Actions
  toggleHabit: (habitId: string, dateStr?: string) => Promise<void>;
  saveHabit: (habit: Habit) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;

  // Settings & Theme
  updateSettings: (partial: Partial<AppSettings>) => Promise<void>;
  refreshAllData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [settings, setSettings] = useState<AppSettings>(SettingsRepository.getSettings as unknown as AppSettings);
  const [loading, setLoading] = useState(true);

  const [selectedTab, setSelectedTab] = useState<ViewTab>('today');
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<TaskFilterType>('all');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string | null>(null);

  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [quickAddInitialText, setQuickAddInitialText] = useState('');
  const [quickAddPreset, setQuickAddPreset] = useState<string | undefined>(undefined);

  const [selectedTaskForEdit, setSelectedTaskForEdit] = useState<Task | null>(null);
  const [activeReminderTask, setActiveReminderTask] = useState<Task | null>(null);

  // Load initial data from repositories
  const refreshAllData = useCallback(async () => {
    try {
      const [tList, cList, hList, sObj] = await Promise.all([
        TaskRepository.getAll(),
        CategoryRepository.getAll(),
        HabitRepository.getAll(),
        SettingsRepository.getSettings(),
      ]);

      // Seed starter tasks if brand new database
      if (tList.length === 0 && !sObj.firstRunCompleted) {
        const todayStr = format(new Date(), 'yyyy-MM-dd');
        const sampleTasks: Task[] = [
          {
            id: 'sample-1',
            title: 'Welcome to SmartDay 👋 Tap to complete me!',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            dueDate: todayStr,
            dueTime: '10:00',
            completed: false,
            priority: 'high',
            categoryId: 'personal',
            tags: ['welcome'],
            reminder: { enabled: true, time: '10:00' },
            subtasks: [
              { id: 'sub-1', title: 'Try adding a task with ＋', completed: false },
              { id: 'sub-2', title: 'Tap the mic 🎙️ to use voice', completed: false },
            ],
            notes: 'SmartDay lets you capture reminders in seconds without filling painful forms.',
            source: 'manual',
          },
          {
            id: 'sample-2',
            title: 'Call electrician tomorrow at 10 AM',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            dueDate: todayStr,
            dueTime: '14:00',
            completed: false,
            priority: 'medium',
            categoryId: 'home',
            tags: ['maintenance'],
            reminder: { enabled: true, time: '14:00' },
            subtasks: [],
            source: 'nl',
          },
          {
            id: 'sample-3',
            title: 'Buy fresh groceries',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            dueDate: todayStr,
            dueTime: '18:30',
            completed: false,
            priority: 'low',
            categoryId: 'shopping',
            tags: ['groceries'],
            subtasks: [
              { id: 'sub-3', title: 'Avocados & fruits', completed: false },
              { id: 'sub-4', title: 'Almond milk', completed: false },
            ],
            source: 'preset',
          }
        ];
        await TaskRepository.bulkSave(sampleTasks);
        setTasks(sampleTasks);
      } else {
        setTasks(tList);
      }

      setCategories(cList);
      setHabits(hList);
      setSettings(sObj);
    } catch (err) {
      console.error('Failed to load initial SmartDay data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshAllData();
  }, [refreshAllData]);

  // Apply Theme & Dark mode to DOM
  useEffect(() => {
    if (!settings) return;
    const root = document.documentElement;

    // Dark mode
    if (settings.darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Theme attribute
    root.setAttribute('data-theme', settings.theme || 'vibrant');
  }, [settings?.darkMode, settings?.theme]);

  // Handle URL parameters for PWA shortcuts (e.g. ?action=add, ?action=voice, ?tab=calendar)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const action = params.get('action');
    const tab = params.get('tab') as ViewTab | null;

    if (tab && ['today', 'calendar', 'tasks', 'reminders', 'habits', 'stats', 'settings'].includes(tab)) {
      setSelectedTab(tab);
    }

    if (action === 'add') {
      setIsQuickAddOpen(true);
    } else if (action === 'voice') {
      setIsQuickAddOpen(true);
      // Auto voice trigger handled inside quick add component
    }

    // Clean URL
    if (action || tab) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const openQuickAdd = useCallback((initialText = '', preset?: string) => {
    setQuickAddInitialText(initialText);
    setQuickAddPreset(preset);
    setIsQuickAddOpen(true);
  }, []);

  const closeQuickAdd = useCallback(() => {
    setIsQuickAddOpen(false);
    setQuickAddInitialText('');
    setQuickAddPreset(undefined);
  }, []);

  // Create Task
  const createTask = useCallback(async (data: Partial<Task>, source: Task['source'] = 'manual'): Promise<Task> => {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const newTask: Task = {
      id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title: data.title?.trim() || 'Untitled Task',
      description: data.description,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      dueDate: data.dueDate || todayStr,
      dueTime: data.dueTime,
      completed: false,
      priority: data.priority || 'none',
      categoryId: data.categoryId || 'personal',
      tags: data.tags || [],
      reminder: data.reminder,
      recurrence: data.recurrence,
      notes: data.notes || '',
      location: data.location || '',
      subtasks: data.subtasks || [],
      attachments: data.attachments || [],
      color: data.color,
      source,
    };

    await TaskRepository.save(newTask);
    setTasks(prev => [newTask, ...prev]);

    // Record for smart history suggestions
    HistoryRepository.recordTaskCreation(newTask.title, newTask.categoryId, newTask.dueTime);

    if (settings.soundEnabled) {
      sounds.playPop();
    }

    return newTask;
  }, [settings.soundEnabled]);

  // Update Task
  const updateTask = useCallback(async (updated: Task) => {
    const payload: Task = {
      ...updated,
      updatedAt: new Date().toISOString(),
    };
    await TaskRepository.save(payload);
    setTasks(prev => prev.map(t => (t.id === payload.id ? payload : t)));
  }, []);

  // Toggle Task Complete with celebration & recurring generation
  const toggleTaskComplete = useCallback(async (id: string) => {
    const target = tasks.find(t => t.id === id);
    if (!target) return;

    const willComplete = !target.completed;
    const nowIso = new Date().toISOString();

    const updated: Task = {
      ...target,
      completed: willComplete,
      completedAt: willComplete ? nowIso : undefined,
      updatedAt: nowIso,
    };

    await TaskRepository.save(updated);

    // Audio & Confetti celebration
    if (willComplete) {
      if (settings.soundEnabled) {
        sounds.playCompletionChime();
      }
      if (settings.vibrationEnabled) {
        NotificationService.vibrate([40, 60, 40]);
      }
      if (settings.celebrationConfetti && !settings.reducedMotion) {
        try {
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.8 },
            colors: ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'],
            ticks: 180,
            disableForReducedMotion: true,
          });
        } catch {
          // Ignore
        }
      }

      // If recurring task, generate the next occurrence
      if (target.recurrence) {
        const nextDueDate = getNextOccurrenceDate(target.dueDate, target.recurrence);
        const recurringInstance: Task = {
          id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          title: target.title,
          description: target.description,
          createdAt: nowIso,
          updatedAt: nowIso,
          dueDate: nextDueDate,
          dueTime: target.dueTime,
          completed: false,
          priority: target.priority,
          categoryId: target.categoryId,
          tags: [...target.tags],
          reminder: target.reminder ? { ...target.reminder, snoozedUntil: undefined, lastNotified: undefined } : undefined,
          recurrence: target.recurrence,
          notes: target.notes,
          location: target.location,
          subtasks: target.subtasks.map(s => ({ ...s, completed: false })),
          color: target.color,
          source: target.source,
        };

        await TaskRepository.save(recurringInstance);
        setTasks(prev => [recurringInstance, ...prev.map(t => (t.id === id ? updated : t))]);
        return;
      }
    }

    setTasks(prev => prev.map(t => (t.id === id ? updated : t)));
  }, [tasks, settings]);

  // Delete Task
  const deleteTask = useCallback(async (id: string) => {
    await TaskRepository.delete(id);
    setTasks(prev => prev.filter(t => t.id !== id));
    if (settings.soundEnabled) {
      sounds.playPop();
    }
  }, [settings.soundEnabled]);

  // Snooze Reminder
  const snoozeReminder = useCallback(async (minutes: number) => {
    if (!activeReminderTask) return;
    const snoozeDate = new Date(Date.now() + minutes * 60 * 1000);
    const updated: Task = {
      ...activeReminderTask,
      reminder: {
        ...(activeReminderTask.reminder || { enabled: true }),
        snoozedUntil: snoozeDate.toISOString(),
      },
      updatedAt: new Date().toISOString(),
    };
    await updateTask(updated);
    setActiveReminderTask(null);
  }, [activeReminderTask, updateTask]);

  const dismissReminder = useCallback(() => {
    setActiveReminderTask(null);
  }, []);

  // Categories
  const saveCategory = useCallback(async (cat: Category) => {
    await CategoryRepository.save(cat);
    setCategories(prev => {
      const idx = prev.findIndex(c => c.id === cat.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = cat;
        return copy;
      }
      return [...prev, cat];
    });
  }, []);

  const deleteCategory = useCallback(async (id: string) => {
    await CategoryRepository.delete(id);
    setCategories(prev => prev.filter(c => c.id !== id));
  }, []);

  // Habits
  const toggleHabit = useCallback(async (habitId: string, dateStr?: string) => {
    const targetDate = dateStr || format(new Date(), 'yyyy-MM-dd');
    const updated = await HabitRepository.toggleHabitDay(habitId, targetDate);
    if (updated) {
      if (settings.soundEnabled) {
        sounds.playCompletionChime();
      }
      if (settings.celebrationConfetti && !settings.reducedMotion) {
        try {
          confetti({
            particleCount: 30,
            spread: 45,
            origin: { y: 0.8 },
            colors: ['#10b981', '#06b6d4', '#8b5cf6'],
          });
        } catch {
          // Ignore
        }
      }
      setHabits(prev => prev.map(h => (h.id === habitId ? updated : h)));
    }
  }, [settings]);

  const saveHabit = useCallback(async (habit: Habit) => {
    await HabitRepository.save(habit);
    setHabits(prev => {
      const idx = prev.findIndex(h => h.id === habit.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = habit;
        return copy;
      }
      return [...prev, habit];
    });
  }, []);

  const deleteHabit = useCallback(async (id: string) => {
    await HabitRepository.delete(id);
    setHabits(prev => prev.filter(h => h.id !== id));
  }, []);

  // Settings
  const updateSettings = useCallback(async (partial: Partial<AppSettings>) => {
    const updated = await SettingsRepository.updatePartial(partial);
    setSettings(updated);
  }, []);

  // Background Reminder Ticker (checks every 15s)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const todayStr = format(now, 'yyyy-MM-dd');
      const currentHhMm = format(now, 'HH:mm');

      tasks.forEach(task => {
        if (task.completed || !task.reminder?.enabled) return;

        // Check 1: If snoozed and snooze time arrived
        if (task.reminder.snoozedUntil) {
          const snoozeTime = new Date(task.reminder.snoozedUntil);
          if (now >= snoozeTime && (!task.reminder.lastNotified || new Date(task.reminder.lastNotified) < snoozeTime)) {
            triggerAlarm(task, true);
            return;
          }
        }

        // Check 2: If due today and scheduled time has arrived/passed and not yet alerted today
        if (task.dueDate === todayStr && task.dueTime) {
          if (task.dueTime <= currentHhMm) {
            const lastNotifiedToday = task.reminder.lastNotified && 
              task.reminder.lastNotified.startsWith(todayStr);

            if (!lastNotifiedToday) {
              triggerAlarm(task, false);
            }
          }
        }
      });
    }, 15000);

    const triggerAlarm = (task: Task, wasSnoozed: boolean) => {
      if (settings.soundEnabled) {
        sounds.playReminderChime();
      }
      if (settings.vibrationEnabled) {
        NotificationService.vibrate([200, 100, 200, 100, 400]);
      }
      NotificationService.sendNotification(task);
      setActiveReminderTask(task);

      // Record last notified and clear snoozedUntil if snoozed alarm fired
      const updated: Task = {
        ...task,
        reminder: {
          ...task.reminder!,
          lastNotified: new Date().toISOString(),
          snoozedUntil: wasSnoozed ? undefined : task.reminder?.snoozedUntil,
        }
      };
      TaskRepository.save(updated);
      setTasks(prev => prev.map(t => (t.id === task.id ? updated : t)));
    };

    return () => clearInterval(interval);
  }, [tasks, settings]);

  const value = useMemo(() => ({
    tasks,
    categories,
    habits,
    settings,
    loading,
    selectedTab,
    setSelectedTab,
    searchQuery,
    setSearchQuery,
    filter,
    setFilter,
    selectedCategoryFilter,
    setSelectedCategoryFilter,
    isQuickAddOpen,
    quickAddInitialText,
    quickAddPreset,
    openQuickAdd,
    closeQuickAdd,
    selectedTaskForEdit,
    setSelectedTaskForEdit,
    activeReminderTask,
    dismissReminder,
    snoozeReminder,
    createTask,
    updateTask,
    toggleTaskComplete,
    deleteTask,
    saveCategory,
    deleteCategory,
    toggleHabit,
    saveHabit,
    deleteHabit,
    updateSettings,
    refreshAllData,
  }), [
    tasks,
    categories,
    habits,
    settings,
    loading,
    selectedTab,
    searchQuery,
    filter,
    selectedCategoryFilter,
    isQuickAddOpen,
    quickAddInitialText,
    quickAddPreset,
    openQuickAdd,
    closeQuickAdd,
    selectedTaskForEdit,
    activeReminderTask,
    dismissReminder,
    snoozeReminder,
    createTask,
    updateTask,
    toggleTaskComplete,
    deleteTask,
    saveCategory,
    deleteCategory,
    toggleHabit,
    saveHabit,
    deleteHabit,
    updateSettings,
    refreshAllData,
  ]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
