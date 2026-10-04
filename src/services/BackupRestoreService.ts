import { TaskRepository } from '../repositories/TaskRepository';
import { CategoryRepository } from '../repositories/CategoryRepository';
import { HabitRepository } from '../repositories/HabitRepository';
import { SettingsRepository } from '../repositories/SettingsRepository';
import { HistoryRepository } from '../repositories/HistoryRepository';
import { Task, Category, Habit, AppSettings, TaskHistoryItem } from '../types';

export interface SmartDayBackup {
  version: string;
  app: 'Donezy' | 'SmartDay';
  exportedAt: string;
  tasks: Task[];
  categories: Category[];
  habits: Habit[];
  settings: AppSettings;
  history: TaskHistoryItem[];
}

export class BackupRestoreService {
  static async exportBackup(): Promise<string> {
    const [tasks, categories, habits, settings, history] = await Promise.all([
      TaskRepository.getAll(),
      CategoryRepository.getAll(),
      HabitRepository.getAll(),
      SettingsRepository.getSettings(),
      HistoryRepository.getAll(),
    ]);

    const backup: SmartDayBackup = {
      version: '1.0.0',
      app: 'Donezy',
      exportedAt: new Date().toISOString(),
      tasks,
      categories,
      habits,
      settings,
      history,
    };

    return JSON.stringify(backup, null, 2);
  }

  static downloadBackupFile(jsonString: string) {
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const dateStamp = new Date().toISOString().split('T')[0];
    a.href = url;
    a.download = `donezy-backup-${dateStamp}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  static parseBackup(jsonText: string): SmartDayBackup {
    try {
      const data = JSON.parse(jsonText);
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid JSON format');
      }
      if (!Array.isArray(data.tasks)) {
        throw new Error('Missing or invalid tasks in backup file.');
      }
      return data as SmartDayBackup;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Invalid backup file';
      throw new Error(`Unable to read backup file: ${message}`);
    }
  }

  static async restoreBackup(backup: SmartDayBackup, mode: 'replace' | 'merge'): Promise<{ tasksCount: number; categoriesCount: number }> {
    if (mode === 'replace') {
      await Promise.all([
        TaskRepository.clear(),
        CategoryRepository.clear(),
        HabitRepository.clear(),
        HistoryRepository.clear(),
      ]);

      await Promise.all([
        TaskRepository.bulkSave(backup.tasks || []),
        CategoryRepository.bulkSave(backup.categories || []),
        HabitRepository.bulkSave(backup.habits || []),
        backup.settings ? SettingsRepository.saveSettings(backup.settings) : Promise.resolve(),
        HistoryRepository.bulkSave(backup.history || []),
      ]);
    } else {
      // Merge mode
      const [existingTasks, existingCategories, existingHabits] = await Promise.all([
        TaskRepository.getAll(),
        CategoryRepository.getAll(),
        HabitRepository.getAll(),
      ]);

      const existingTaskIds = new Set(existingTasks.map(t => t.id));
      const newTasks = (backup.tasks || []).filter(t => !existingTaskIds.has(t.id));
      await TaskRepository.bulkSave([...existingTasks, ...newTasks]);

      const existingCatIds = new Set(existingCategories.map(c => c.id));
      const newCats = (backup.categories || []).filter(c => !existingCatIds.has(c.id));
      if (newCats.length > 0) {
        await CategoryRepository.bulkSave([...existingCategories, ...newCats]);
      }

      const existingHabitIds = new Set(existingHabits.map(h => h.id));
      const newHabits = (backup.habits || []).filter(h => !existingHabitIds.has(h.id));
      if (newHabits.length > 0) {
        await HabitRepository.bulkSave([...existingHabits, ...newHabits]);
      }
    }

    return {
      tasksCount: backup.tasks?.length || 0,
      categoriesCount: backup.categories?.length || 0,
    };
  }
}
