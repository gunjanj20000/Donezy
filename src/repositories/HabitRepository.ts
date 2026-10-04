import { getDB } from '../db/indexedDB';
import { Habit } from '../types';

export const DEFAULT_HABITS: Habit[] = [
  { id: 'habit-1', title: 'Drink 2L Water', icon: 'Droplets', color: '#06b6d4', frequency: 'daily', completedDates: [], createdAt: new Date().toISOString() },
  { id: 'habit-2', title: 'Walk 30 Mins', icon: 'Footprints', color: '#10b981', frequency: 'daily', completedDates: [], createdAt: new Date().toISOString() },
  { id: 'habit-3', title: 'Read 15 Mins', icon: 'BookOpen', color: '#8b5cf6', frequency: 'daily', completedDates: [], createdAt: new Date().toISOString() },
  { id: 'habit-4', title: 'Meditation', icon: 'Sun', color: '#f59e0b', frequency: 'weekdays', completedDates: [], createdAt: new Date().toISOString() },
];

export class HabitRepository {
  static async getAll(): Promise<Habit[]> {
    try {
      const db = await getDB();
      const habits = await db.getAll('habits');
      if (habits.length === 0) {
        await this.initDefaults();
        return DEFAULT_HABITS;
      }
      return habits;
    } catch (err) {
      console.error('HabitRepository.getAll error:', err);
      return DEFAULT_HABITS;
    }
  }

  static async initDefaults(): Promise<void> {
    try {
      const db = await getDB();
      const tx = db.transaction('habits', 'readwrite');
      for (const habit of DEFAULT_HABITS) {
        await tx.store.put(habit);
      }
      await tx.done;
    } catch (err) {
      console.error('HabitRepository.initDefaults error:', err);
    }
  }

  static async save(habit: Habit): Promise<void> {
    try {
      const db = await getDB();
      await db.put('habits', habit);
    } catch (err) {
      console.error('HabitRepository.save error:', err);
      throw new Error('Could not save habit.');
    }
  }

  static async delete(id: string): Promise<void> {
    try {
      const db = await getDB();
      await db.delete('habits', id);
    } catch (err) {
      console.error('HabitRepository.delete error:', err);
      throw new Error('Could not delete habit.');
    }
  }

  static async toggleHabitDay(habitId: string, dateStr: string): Promise<Habit | null> {
    try {
      const db = await getDB();
      const habit = await db.get('habits', habitId);
      if (!habit) return null;

      const exists = habit.completedDates.includes(dateStr);
      const updatedDates = exists 
        ? habit.completedDates.filter(d => d !== dateStr)
        : [...habit.completedDates, dateStr];

      const updatedHabit: Habit = {
        ...habit,
        completedDates: updatedDates
      };

      await db.put('habits', updatedHabit);
      return updatedHabit;
    } catch (err) {
      console.error('HabitRepository.toggleHabitDay error:', err);
      return null;
    }
  }

  static async bulkSave(habits: Habit[]): Promise<void> {
    try {
      const db = await getDB();
      const tx = db.transaction('habits', 'readwrite');
      for (const h of habits) {
        await tx.store.put(h);
      }
      await tx.done;
    } catch (err) {
      console.error('HabitRepository.bulkSave error:', err);
    }
  }

  static async clear(): Promise<void> {
    try {
      const db = await getDB();
      await db.clear('habits');
    } catch (err) {
      console.error('HabitRepository.clear error:', err);
    }
  }
}
