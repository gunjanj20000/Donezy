import { getDB, DEFAULT_SETTINGS } from '../db/indexedDB';
import { AppSettings } from '../types';

export class SettingsRepository {
  static async getSettings(): Promise<AppSettings> {
    try {
      const db = await getDB();
      const stored = await db.get('settings', 'app_settings');
      if (stored && typeof stored.value === 'object') {
        return { ...DEFAULT_SETTINGS, ...(stored.value as AppSettings) };
      }
      return DEFAULT_SETTINGS;
    } catch (err) {
      console.error('SettingsRepository.getSettings error:', err);
      return DEFAULT_SETTINGS;
    }
  }

  static async saveSettings(settings: AppSettings): Promise<void> {
    try {
      const db = await getDB();
      await db.put('settings', { key: 'app_settings', value: settings });
    } catch (err) {
      console.error('SettingsRepository.saveSettings error:', err);
    }
  }

  static async updatePartial(partial: Partial<AppSettings>): Promise<AppSettings> {
    const current = await this.getSettings();
    const updated = { ...current, ...partial };
    await this.saveSettings(updated);
    return updated;
  }
}
