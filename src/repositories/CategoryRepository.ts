import { getDB, DEFAULT_CATEGORIES } from '../db/indexedDB';
import { Category } from '../types';

export class CategoryRepository {
  static async getAll(): Promise<Category[]> {
    try {
      const db = await getDB();
      const categories = await db.getAll('categories');
      if (categories.length === 0) {
        await this.initDefaults();
        return DEFAULT_CATEGORIES;
      }
      return categories;
    } catch (err) {
      console.error('CategoryRepository.getAll error:', err);
      return DEFAULT_CATEGORIES;
    }
  }

  static async initDefaults(): Promise<void> {
    try {
      const db = await getDB();
      const tx = db.transaction('categories', 'readwrite');
      for (const cat of DEFAULT_CATEGORIES) {
        await tx.store.put(cat);
      }
      await tx.done;
    } catch (err) {
      console.error('CategoryRepository.initDefaults error:', err);
    }
  }

  static async save(category: Category): Promise<void> {
    try {
      const db = await getDB();
      await db.put('categories', category);
    } catch (err) {
      console.error('CategoryRepository.save error:', err);
      throw new Error('We could not save category. Please try again.');
    }
  }

  static async delete(id: string): Promise<void> {
    try {
      const db = await getDB();
      await db.delete('categories', id);
    } catch (err) {
      console.error('CategoryRepository.delete error:', err);
      throw new Error('We could not delete category.');
    }
  }

  static async bulkSave(categories: Category[]): Promise<void> {
    try {
      const db = await getDB();
      const tx = db.transaction('categories', 'readwrite');
      for (const cat of categories) {
        await tx.store.put(cat);
      }
      await tx.done;
    } catch (err) {
      console.error('CategoryRepository.bulkSave error:', err);
    }
  }

  static async clear(): Promise<void> {
    try {
      const db = await getDB();
      await db.clear('categories');
    } catch (err) {
      console.error('CategoryRepository.clear error:', err);
    }
  }
}
