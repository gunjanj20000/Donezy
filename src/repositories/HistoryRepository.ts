import { getDB } from '../db/indexedDB';
import { TaskHistoryItem } from '../types';

export class HistoryRepository {
  static async recordTaskCreation(title: string, categoryId: string, time?: string): Promise<void> {
    const cleanTitle = title.trim();
    if (!cleanTitle || cleanTitle.length < 2) return;

    try {
      const db = await getDB();
      const id = cleanTitle.toLowerCase();
      const existing = await db.get('history', id);

      if (existing) {
        const updated: TaskHistoryItem = {
          ...existing,
          title: cleanTitle,
          categoryId: categoryId || existing.categoryId,
          typicalTime: time || existing.typicalTime,
          frequencyCount: existing.frequencyCount + 1,
          lastUsed: new Date().toISOString()
        };
        await db.put('history', updated);
      } else {
        const item: TaskHistoryItem = {
          id,
          title: cleanTitle,
          categoryId: categoryId || 'personal',
          typicalTime: time,
          frequencyCount: 1,
          lastUsed: new Date().toISOString()
        };
        await db.put('history', item);
      }
    } catch (err) {
      console.error('HistoryRepository.recordTaskCreation error:', err);
    }
  }

  static async getTopSuggestions(query?: string, limit = 5): Promise<TaskHistoryItem[]> {
    try {
      const db = await getDB();
      const all = await db.getAll('history');
      let filtered = all;

      if (query && query.trim()) {
        const q = query.toLowerCase().trim();
        filtered = all.filter(item => item.title.toLowerCase().includes(q));
      }

      // Sort by frequency count desc, then lastUsed desc
      filtered.sort((a, b) => {
        if (b.frequencyCount !== a.frequencyCount) {
          return b.frequencyCount - a.frequencyCount;
        }
        return new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime();
      });

      return filtered.slice(0, limit);
    } catch (err) {
      console.error('HistoryRepository.getTopSuggestions error:', err);
      return [];
    }
  }

  static async getAll(): Promise<TaskHistoryItem[]> {
    try {
      const db = await getDB();
      return await db.getAll('history');
    } catch {
      return [];
    }
  }

  static async bulkSave(items: TaskHistoryItem[]): Promise<void> {
    try {
      const db = await getDB();
      const tx = db.transaction('history', 'readwrite');
      for (const item of items) {
        await tx.store.put(item);
      }
      await tx.done;
    } catch (err) {
      console.error('HistoryRepository.bulkSave error:', err);
    }
  }

  static async clear(): Promise<void> {
    try {
      const db = await getDB();
      await db.clear('history');
    } catch (err) {
      console.error('HistoryRepository.clear error:', err);
    }
  }
}
