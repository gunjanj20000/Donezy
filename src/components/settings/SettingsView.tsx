import React, { useState, useRef } from 'react';
import { 
  Settings as SettingsIcon, 
  Palette, 
  Volume2, 
  VolumeX, 
  Vibrate, 
  Sparkles, 
  Bell, 
  Download, 
  Upload, 
  Clock, 
  Calendar, 
  ShieldCheck, 
  Trash2, 
  Plus, 
  Check, 
  AlertTriangle,
  Moon,
  Sun
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ThemeType, Category } from '../../types';
import { sounds, NotificationService } from '../../services/NotificationService';
import { BackupRestoreService, SmartDayBackup } from '../../services/BackupRestoreService';
import { IconRenderer } from '../common/IconRenderer';

const THEMES: { id: ThemeType; name: string; colors: string[] }[] = [
  { id: 'vibrant', name: 'Vibrant', colors: ['#6366f1', '#ec4899'] },
  { id: 'ocean', name: 'Ocean', colors: ['#0284c7', '#14b8a6'] },
  { id: 'sunset', name: 'Sunset', colors: ['#f43f5e', '#f59e0b'] },
  { id: 'forest', name: 'Forest', colors: ['#059669', '#10b981'] },
  { id: 'lavender', name: 'Lavender', colors: ['#8b5cf6', '#d946ef'] },
  { id: 'minimal', name: 'Minimal', colors: ['#334155', '#94a3b8'] },
];

export const SettingsView: React.FC = () => {
  const { 
    settings, 
    updateSettings, 
    categories, 
    saveCategory, 
    deleteCategory, 
    refreshAllData 
  } = useApp();

  const [backupStatus, setBackupStatus] = useState<string | null>(null);
  const [importPendingBackup, setImportPendingBackup] = useState<SmartDayBackup | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);

  // New Category State
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('#6366f1');
  const [newCatIcon, setNewCatIcon] = useState('Tag');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    try {
      const json = await BackupRestoreService.exportBackup();
      BackupRestoreService.downloadBackupFile(json);
      setBackupStatus('Backup exported successfully!');
      setTimeout(() => setBackupStatus(null), 4000);
    } catch (err) {
      setBackupStatus('Export failed. Please try again.');
    }
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async event => {
      try {
        const text = event.target?.result as string;
        const parsed = BackupRestoreService.parseBackup(text);
        setImportPendingBackup(parsed);
        setShowImportModal(true);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Invalid backup';
        alert(msg);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleConfirmImport = async (mode: 'replace' | 'merge') => {
    if (!importPendingBackup) return;
    try {
      await BackupRestoreService.restoreBackup(importPendingBackup, mode);
      await refreshAllData();
      setShowImportModal(false);
      setImportPendingBackup(null);
      setBackupStatus(`Successfully restored (${mode} mode)!`);
      setTimeout(() => setBackupStatus(null), 4000);
    } catch {
      alert('Failed to restore data.');
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    const newCat: Category = {
      id: `custom-${Date.now()}`,
      name: newCatName.trim(),
      color: newCatColor,
      icon: newCatIcon,
      isDefault: false,
    };

    await saveCategory(newCat);
    setNewCatName('');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-24 sm:pb-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <SettingsIcon className="w-6 h-6 text-brand-600 dark:text-brand-400" />
          <span>Settings</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Customize themes, reminders, sound, gestures, and local data.
        </p>
      </div>

      {backupStatus && (
        <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-2 animate-fade-in">
          <Check className="w-4 h-4" />
          <span>{backupStatus}</span>
        </div>
      )}

      {/* THEMES & APPEARANCE */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-brand-600 dark:text-brand-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Color Palette & Theme
            </h3>
          </div>

          {/* Dark Mode Quick Toggle */}
          <button
            onClick={() => updateSettings({ darkMode: !settings.darkMode })}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            {settings.darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-500" />}
            <span>{settings.darkMode ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {THEMES.map(th => {
            const isSelected = settings.theme === th.id;
            return (
              <button
                key={th.id}
                onClick={() => updateSettings({ theme: th.id })}
                className={`min-h-[48px] p-3 rounded-2xl border text-left flex items-center justify-between transition-all ${
                  isSelected
                    ? 'border-brand-500 bg-brand-50/40 dark:bg-brand-950/40 ring-2 ring-brand-500/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-1">
                    <span className="w-4 h-4 rounded-full border border-white dark:border-slate-900 shadow-sm" style={{ backgroundColor: th.colors[0] }} />
                    <span className="w-4 h-4 rounded-full border border-white dark:border-slate-900 shadow-sm" style={{ backgroundColor: th.colors[1] }} />
                  </div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {th.name}
                  </span>
                </div>
                {isSelected && <Check className="w-4 h-4 text-brand-600 dark:text-brand-400 stroke-[3]" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* AUDIO & NOTIFICATIONS */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Volume2 className="w-5 h-5 text-brand-600 dark:text-brand-400" />
          <span>Audio, Vibration & Celebration</span>
        </h3>

        <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
          {/* Sound Toggle */}
          <div className="py-3 flex items-center justify-between">
            <div>
              <div className="font-bold text-slate-800 dark:text-slate-200">
                Completion & Reminder Chimes
              </div>
              <div className="text-slate-400">
                Play synthesized harmonic chimes on task actions
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => sounds.playCompletionChime()}
                className="px-2.5 py-1 text-[11px] font-semibold text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-950 rounded-lg"
              >
                Test Sound
              </button>
              <input
                type="checkbox"
                checked={settings.soundEnabled}
                onChange={e => updateSettings({ soundEnabled: e.target.checked })}
                className="w-5 h-5 rounded text-brand-600"
              />
            </div>
          </div>

          {/* Vibration Toggle */}
          <div className="py-3 flex items-center justify-between">
            <div>
              <div className="font-bold text-slate-800 dark:text-slate-200">
                Haptic Vibration
              </div>
              <div className="text-slate-400">
                Tactile feedback when completing tasks or firing alarms
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.vibrationEnabled}
              onChange={e => updateSettings({ vibrationEnabled: e.target.checked })}
              className="w-5 h-5 rounded text-brand-600"
            />
          </div>

          {/* Celebration Confetti */}
          <div className="py-3 flex items-center justify-between">
            <div>
              <div className="font-bold text-slate-800 dark:text-slate-200">
                Confetti Celebration
              </div>
              <div className="text-slate-400">
                Reward confetti bursts upon completing to-do tasks
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.celebrationConfetti}
              onChange={e => updateSettings({ celebrationConfetti: e.target.checked })}
              className="w-5 h-5 rounded text-brand-600"
            />
          </div>

          {/* Reduced Motion */}
          <div className="py-3 flex items-center justify-between">
            <div>
              <div className="font-bold text-slate-800 dark:text-slate-200">
                Reduced Motion
              </div>
              <div className="text-slate-400">
                Minimize interface transitions and disable particle effects
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.reducedMotion}
              onChange={e => updateSettings({ reducedMotion: e.target.checked })}
              className="w-5 h-5 rounded text-brand-600"
            />
          </div>
        </div>
      </div>

      {/* TIME & FORMATS */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Clock className="w-5 h-5 text-brand-600 dark:text-brand-400" />
          <span>Date & Time Preferences</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Time Format
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => updateSettings({ timeFormat: '12h' })}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border ${
                  settings.timeFormat === '12h'
                    ? 'bg-brand-600 text-white border-brand-600'
                    : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                12-Hour (10:00 AM)
              </button>
              <button
                onClick={() => updateSettings({ timeFormat: '24h' })}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border ${
                  settings.timeFormat === '24h'
                    ? 'bg-brand-600 text-white border-brand-600'
                    : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                24-Hour (10:00)
              </button>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Week Starts On
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => updateSettings({ weekStartsOn: 1 })}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border ${
                  settings.weekStartsOn === 1
                    ? 'bg-brand-600 text-white border-brand-600'
                    : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                Monday
              </button>
              <button
                onClick={() => updateSettings({ weekStartsOn: 0 })}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border ${
                  settings.weekStartsOn === 0
                    ? 'bg-brand-600 text-white border-brand-600'
                    : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                Sunday
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* CUSTOM CATEGORIES MANAGER */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
          Categories ({categories.length})
        </h3>

        <div className="flex flex-wrap gap-2">
          {categories.map(cat => (
            <div
              key={cat.id}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold"
            >
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
              <IconRenderer name={cat.icon} className="w-3.5 h-3.5" />
              <span className="text-slate-800 dark:text-slate-200">{cat.name}</span>
              {!cat.isDefault && (
                <button
                  type="button"
                  onClick={() => deleteCategory(cat.id)}
                  className="text-slate-400 hover:text-rose-500 ml-1"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Add custom category form */}
        <form onSubmit={handleAddCategory} className="pt-2 flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={newCatName}
            onChange={e => setNewCatName(e.target.value)}
            placeholder="New Category Name..."
            className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
          />
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={newCatColor}
              onChange={e => setNewCatColor(e.target.value)}
              className="w-10 h-9 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer p-0.5 bg-transparent"
              title="Category Color"
            />
            <button
              type="submit"
              disabled={!newCatName.trim()}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold disabled:opacity-40"
            >
              Add Category
            </button>
          </div>
        </form>
      </div>

      {/* BACKUP & RESTORE */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
            Backup & Restore Data
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Export your complete offline database as a JSON file or restore anytime.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleExport}
            className="min-h-[44px] px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-2 transition-colors"
          >
            <Download className="w-4 h-4 text-brand-600" />
            <span>Export Backup (JSON)</span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleFileSelected}
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="min-h-[44px] px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-2 transition-colors"
          >
            <Upload className="w-4 h-4 text-brand-600" />
            <span>Import Backup</span>
          </button>
        </div>
      </div>

      {/* PRIVACY & LOCAL FIRST */}
      <div className="bg-slate-100/60 dark:bg-slate-900/40 rounded-3xl p-5 border border-slate-200/60 dark:border-slate-800 flex items-start gap-3">
        <ShieldCheck className="w-6 h-6 text-emerald-500 shrink-0 mt-0.5" />
        <div className="text-xs">
          <h4 className="font-bold text-slate-900 dark:text-white mb-0.5">
            100% Local-First & Private
          </h4>
          <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
            Donezy stores all tasks, categories, and settings strictly in your browser's IndexedDB. No task data is uploaded to remote servers or third-party AI models. The app is fully functional offline.
          </p>
        </div>
      </div>

      {/* IMPORT MODAL (Replace vs Merge) */}
      {showImportModal && importPendingBackup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-left animate-scale-in">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              Import Donezy Backup
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Found {importPendingBackup.tasks?.length || 0} tasks and {importPendingBackup.categories?.length || 0} categories. Choose how you want to restore:
            </p>

            <div className="space-y-3 mb-6">
              <button
                onClick={() => handleConfirmImport('merge')}
                className="w-full p-4 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-brand-500 text-left transition-all"
              >
                <div className="text-sm font-bold text-slate-900 dark:text-white">
                  Merge with Existing Data
                </div>
                <div className="text-xs text-slate-500">
                  Adds new tasks without touching current items. Recommended.
                </div>
              </button>

              <button
                onClick={() => handleConfirmImport('replace')}
                className="w-full p-4 rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/30 dark:bg-rose-950/20 hover:border-rose-500 text-left transition-all"
              >
                <div className="text-sm font-bold text-rose-600 dark:text-rose-400">
                  Replace Existing Data
                </div>
                <div className="text-xs text-rose-500/80">
                  Clears current database and loads backup file completely.
                </div>
              </button>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setImportPendingBackup(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
