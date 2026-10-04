import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Task, Category, Habit, AppSettings, TaskHistoryItem } from '../types';

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'personal', name: 'Personal', icon: 'User', color: '#6366f1', isDefault: true },
  { id: 'work', name: 'Work', icon: 'Briefcase', color: '#3b82f6', isDefault: true },
  { id: 'family', name: 'Family', icon: 'Users', color: '#ec4899', isDefault: true },
  { id: 'shopping', name: 'Shopping', icon: 'ShoppingCart', color: '#f59e0b', isDefault: true },
  { id: 'health', name: 'Health', icon: 'HeartPulse', color: '#10b981', isDefault: true },
  { id: 'finance', name: 'Finance', icon: 'CreditCard', color: '#14b8a6', isDefault: true },
  { id: 'home', name: 'Home', icon: 'Home', color: '#f97316', isDefault: true },
  { id: 'car', name: 'Car', icon: 'Car', color: '#8b5cf6', isDefault: true },
  { id: 'study', name: 'Study', icon: 'BookOpen', color: '#06b6d4', isDefault: true },
  { id: 'other', name: 'Other', icon: 'Tag', color: '#64748b', isDefault: true },
];

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'vibrant',
  darkMode: false,
  soundEnabled: true,
  reminderTone: 'chime',
  mainPageView: 'both',
  vibrationEnabled: true,
  celebrationConfetti: true,
  defaultReminderOffset: 0,
  weekStartsOn: 1, // Monday
  timeFormat: '12h',
  dateFormat: 'system',
  reducedMotion: false,
  firstRunCompleted: false,
  autoSmartSuggestions: true,
};

interface SmartDayDB extends DBSchema {
  tasks: {
    key: string;
    value: Task;
    indexes: {
      'by-dueDate': string;
      'by-completed': number; // 0 or 1
      'by-category': string;
      'by-createdAt': string;
    };
  };
  categories: {
    key: string;
    value: Category;
  };
  habits: {
    key: string;
    value: Habit;
  };
  settings: {
    key: string;
    value: { key: string; value: unknown };
  };
  history: {
    key: string;
    value: TaskHistoryItem;
    indexes: {
      'by-frequency': number;
      'by-title': string;
    };
  };
}

const DB_NAME = 'smartday_pwa_db';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<SmartDayDB>> | null = null;

export async function getDB(): Promise<IDBPDatabase<SmartDayDB>> {
  if (!dbPromise) {
    dbPromise = openDB<SmartDayDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Tasks store
        if (!db.objectStoreNames.contains('tasks')) {
          const taskStore = db.createObjectStore('tasks', { keyPath: 'id' });
          taskStore.createIndex('by-dueDate', 'dueDate');
          taskStore.createIndex('by-completed', 'completed');
          taskStore.createIndex('by-category', 'categoryId');
          taskStore.createIndex('by-createdAt', 'createdAt');
        }

        // Categories store
        if (!db.objectStoreNames.contains('categories')) {
          db.createObjectStore('categories', { keyPath: 'id' });
        }

        // Habits store
        if (!db.objectStoreNames.contains('habits')) {
          db.createObjectStore('habits', { keyPath: 'id' });
        }

        // Settings store
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }

        // History store
        if (!db.objectStoreNames.contains('history')) {
          const historyStore = db.createObjectStore('history', { keyPath: 'id' });
          historyStore.createIndex('by-frequency', 'frequencyCount');
          historyStore.createIndex('by-title', 'title');
        }
      },
    });
  }
  return dbPromise;
}
