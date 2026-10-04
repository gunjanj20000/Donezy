export type Priority = 'none' | 'low' | 'medium' | 'high';

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface TaskReminder {
  enabled: boolean;
  time?: string; // HH:mm or ISO
  offsetMinutes?: number; // 0 for at due time, 15 for 15 mins before, etc.
  snoozedUntil?: string; // ISO datetime
  lastNotified?: string; // ISO datetime
}

export interface TaskRecurrence {
  frequency: 'daily' | 'weekly' | 'weekdays' | 'weekends' | 'monthly' | 'yearly' | 'custom';
  interval?: number; // e.g. every 2 weeks
  daysOfWeek?: number[]; // 0 = Sun, 1 = Mon, ..., 6 = Sat
  dayOfMonth?: number; // 1-31
  endDate?: string; // YYYY-MM-DD
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  createdAt: string; // ISO
  updatedAt: string; // ISO
  dueDate: string; // YYYY-MM-DD
  dueTime?: string; // HH:mm
  completed: boolean;
  completedAt?: string; // ISO
  priority: Priority;
  categoryId: string;
  tags: string[];
  reminder?: TaskReminder;
  recurrence?: TaskRecurrence;
  notes?: string;
  location?: string;
  subtasks: Subtask[];
  attachments?: string[];
  color?: string;
  source?: 'manual' | 'voice' | 'preset' | 'nl';
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  isDefault?: boolean;
}

export interface Habit {
  id: string;
  title: string;
  icon: string;
  color: string;
  frequency: 'daily' | 'weekdays' | 'custom';
  targetDaysPerWeek?: number;
  completedDates: string[]; // ['YYYY-MM-DD']
  createdAt: string;
}

export type ThemeType = 'vibrant' | 'ocean' | 'sunset' | 'forest' | 'lavender' | 'minimal' | 'dark';

export type ReminderTone = 'chime' | 'bell' | 'marimba' | 'cosmic' | 'digital' | 'zen';

export type MainPageViewMode = 'both' | 'today' | 'upcoming';

export interface AppSettings {
  theme: ThemeType;
  darkMode: boolean;
  soundEnabled: boolean;
  reminderTone?: ReminderTone;
  mainPageView?: MainPageViewMode;
  vibrationEnabled: boolean;
  celebrationConfetti: boolean;
  defaultReminderOffset: number; // minutes before due
  weekStartsOn: 0 | 1; // 0 = Sunday, 1 = Monday
  timeFormat: '12h' | '24h';
  dateFormat: string;
  reducedMotion: boolean;
  firstRunCompleted: boolean;
  autoSmartSuggestions: boolean;
}

export interface TaskHistoryItem {
  id: string;
  title: string;
  categoryId: string;
  typicalTime?: string; // HH:mm
  frequencyCount: number;
  lastUsed: string;
}

export type ViewTab = 'today' | 'calendar' | 'tasks' | 'reminders' | 'habits' | 'stats' | 'settings';

export type TaskFilterType = 
  | 'all' 
  | 'today' 
  | 'important' 
  | 'overdue' 
  | 'upcoming' 
  | 'recurring' 
  | 'completed';
