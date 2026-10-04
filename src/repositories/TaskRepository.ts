import { getDB } from '../db/indexedDB';
import { Task } from '../types';

export class TaskRepository {
  static async getAll(): Promise<Task[]> {
    try {
      const db = await getDB();
      return await db.getAll('tasks');
    } catch (err) {
      console.error('TaskRepository.getAll error:', err);
      return [];
    }
  }

  static async getById(id: string): Promise<Task | undefined> {
    try {
      const db = await getDB();
      return await db.get('tasks', id);
    } catch (err) {
      console.error('TaskRepository.getById error:', err);
      return undefined;
    }
  }

  static async getByDate(date: string): Promise<Task[]> {
    try {
      const db = await getDB();
      const index = db.transaction('tasks').store.index('by-dueDate');
      return await index.getAll(date);
    } catch (err) {
      console.error('TaskRepository.getByDate error:', err);
      return [];
    }
  }

  static async save(task: Task): Promise<void> {
    try {
      const db = await getDB();
      await db.put('tasks', task);
    } catch (err) {
      console.error('TaskRepository.save error:', err);
      throw new Error('We could not save that task. Please try again.');
    }
  }

  static async delete(id: string): Promise<void> {
    try {
      const db = await getDB();
      await db.delete('tasks', id);
    } catch (err) {
      console.error('TaskRepository.delete error:', err);
      throw new Error('We could not delete that task. Please try again.');
    }
  }

  static async bulkSave(tasks: Task[]): Promise<void> {
    try {
      const db = await getDB();
      const tx = db.transaction('tasks', 'readwrite');
      for (const task of tasks) {
        await tx.store.put(task);
      }
      await tx.done;
    } catch (err) {
      console.error('TaskRepository.bulkSave error:', err);
      throw new Error('Failed to save tasks batch.');
    }
  }

  static async clear(): Promise<void> {
    try {
      const db = await getDB();
      await db.clear('tasks');
    } catch (err) {
      console.error('TaskRepository.clear error:', err);
    }
  }
}
