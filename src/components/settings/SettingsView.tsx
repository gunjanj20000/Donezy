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
  Sun,
  Play,
  RefreshCw,
  Smartphone,
  Info,
  Layers,
  CalendarClock
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ThemeType, Category, ReminderTone, MainPageViewMode } from '../../types';
import { sounds, NotificationService } from '../../services/NotificationService';
import { BackupRestoreService, SmartDayBackup } from '../../services/BackupRestoreService';
import { IconRenderer } from '../common/IconRenderer';

const THEMES: { id: ThemeType; name: string; colors: string[]; desc: string }[] = [
  { id: 'vibrant', name: 'Vibrant', colors: ['#6366f1', '#ec4899'], desc: 'Indigo & Pink' },
  { id: 'ocean', name: 'Ocean', colors: ['#0284c7', '#14b8a6'], desc: 'Sky Blue & Teal' },
  { id: 'sunset', name: 'Sunset', colors: ['#f43f5e', '#f59e0b'], desc: 'Rose & Amber' },
  { id: 'forest', name: 'Forest', colors: ['#059669', '#10b981'], desc: 'Emerald & Mint' },
  { id: 'lavender', name: 'Lavender', colors: ['#8b5cf6', '#d946ef'], desc: 'Violet & Fuchsia' },
  { id: 'minimal', name: 'Minimal', colors: ['#334155', '#64748b'], desc: 'Monochrome Slate' },
  { id: 'dark', name: 'Midnight', colors: ['#4f46e5', '#06b6d4'], desc: 'Navy & Cyan' },
];

const CATEGORY_PALETTE = [
  '#6366f1', '#3b82f6', '#06b6d4', '#10b981', '#84cc16', 
  '#f59e0b', '#f97316', '#f43f5e', '#ec4899', '#8b5cf6', '#64748b'
];

const REMINDER_TONES: { id: ReminderTone; name: string; desc: string; icon: string }[] = [
  { id: 'chime', name: 'Classic Chime', desc: 'Soft dual-tone melodic bell', icon: '🔔' },
  { id: 'bell', name: 'Resonant Bell', desc: 'Harmonic crystal brass chime', icon: '✨' },
  { id: 'marimba', name: 'Warm Marimba', desc: 'Acoustic wooden tri-tone', icon: '🪵' },
  { id: 'cosmic', name: 'Cosmic Sweep', desc: 'Futuristic synth glow sweep', icon: '🪐' },
  { id: 'digital', name: 'Digital Watch', desc: 'Crisp modern dual-pulse beep', icon: '⌚' },
  { id: 'zen', name: 'Zen Bowl', desc: 'Harmonic 432Hz meditation gong', icon: '🧘' },
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

  // App Update State
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updateStatusMessage, setUpdateStatusMessage] = useState<string | null>(null);
  const [updateStatusType, setUpdateStatusType] = useState<'info' | 'success' | 'update'>('info');

  // Notification Permission State
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>(() => 
    NotificationService.getPermissionStatus()
  );

  React.useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then(reg => {
        if (reg?.waiting) {
          setUpdateAvailable(true);
          setUpdateStatusMessage('New version downloaded and ready to apply!');
          setUpdateStatusType('update');
        }
        reg?.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          newWorker?.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setUpdateAvailable(true);
              setUpdateStatusMessage('New version available! Tap Update App to install.');
              setUpdateStatusType('update');
            }
          });
        });
      });
    }
  }, []);

  const handleCheckUpdate = async () => {
    setIsCheckingUpdate(true);
    setUpdateStatusMessage('Checking for app updates...');
    setUpdateStatusType('info');

    try {
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg) {
          await reg.update();
          if (reg.waiting || reg.installing) {
            setUpdateAvailable(true);
            setUpdateStatusMessage('New update found! Installing...');
            setUpdateStatusType('update');
            if (reg.waiting) {
              reg.waiting.postMessage({ type: 'SKIP_WAITING' });
            }
            setTimeout(() => {
              window.location.reload();
            }, 1000);
            return;
          }
        }
      }

      const res = await fetch(`/?_chk=${Date.now()}`, { cache: 'no-store', method: 'HEAD' });
      if (res.ok) {
        setUpdateStatusMessage('Donezy is up to date with the latest version!');
        setUpdateStatusType('success');
      } else {
        setUpdateStatusMessage('Running latest cached version.');
        setUpdateStatusType('info');
      }
    } catch {
      setUpdateStatusMessage('Operating in offline mode. Local cache active.');
      setUpdateStatusType('info');
    } finally {
      setIsCheckingUpdate(false);
      setTimeout(() => {
        setUpdateStatusMessage(null);
      }, 5000);
    }
  };

  const handleForceRefresh = async () => {
    try {
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map(k => caches.delete(k)));
      }
    } catch {}
    window.location.reload();
  };

  const handleRequestNotification = async () => {
    const granted = await NotificationService.requestPermission();
    setPermissionStatus(granted ? 'granted' : 'denied');
    if (granted) {
      sounds.playReminderTone(settings.reminderTone || 'chime');
    }
  };

  // Category State
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('#6366f1');
  const [newCatIcon, setNewCatIcon] = useState('Tag');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editCatName, setEditCatName] = useState('');
  const [editCatColor, setEditCatColor] = useState('#6366f1');

  const startEditCategory = (cat: Category) => {
    setEditingCategory(cat);
    setEditCatName(cat.name);
    setEditCatColor(cat.color);
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory || !editCatName.trim()) return;
    await saveCategory({
      ...editingCategory,
      name: editCatName.trim(),
      color: editCatColor,
    });
    setEditingCategory(null);
  };

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
            {settings.darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-brand-500" />}
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
                className={`min-h-[52px] p-3 rounded-2xl border text-left flex items-center justify-between transition-all ${
                  isSelected
                    ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/60 ring-2 ring-brand-500/30 shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex -space-x-1 shrink-0">
                    <span className="w-4 h-4 rounded-full border border-white dark:border-slate-900 shadow-sm" style={{ backgroundColor: th.colors[0] }} />
                    <span className="w-4 h-4 rounded-full border border-white dark:border-slate-900 shadow-sm" style={{ backgroundColor: th.colors[1] }} />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block leading-tight">
                      {th.name}
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-400 block leading-tight mt-0.5">
                      {th.desc}
                    </span>
                  </div>
                </div>
                {isSelected && <Check className="w-4 h-4 text-brand-600 dark:text-brand-400 stroke-[3] shrink-0 ml-1" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* MAIN SCREEN BLOCKS & LAYOUT */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-brand-600 dark:text-brand-400" />
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Main Screen Blocks
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Configure which task blocks appear on your main Today screen.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            {
              id: 'both' as MainPageViewMode,
              title: 'Both Blocks',
              badge: 'Recommended',
              desc: 'Shows Today’s Tasks and Upcoming Tasks as two separate blocks',
              icon: <Layers className="w-4 h-4 text-brand-500" />
            },
            {
              id: 'today' as MainPageViewMode,
              title: 'Today Only',
              badge: undefined,
              desc: 'Focus only on today’s scheduled tasks and overdue items',
              icon: <Sparkles className="w-4 h-4 text-amber-500" />
            },
            {
              id: 'upcoming' as MainPageViewMode,
              title: 'Upcoming Only',
              badge: undefined,
              desc: 'Focus only on tasks scheduled for tomorrow and future dates',
              icon: <CalendarClock className="w-4 h-4 text-accent-500" />
            }
          ].map(opt => {
            const isSelected = (settings.mainPageView || 'both') === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => updateSettings({ mainPageView: opt.id })}
                className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                  isSelected
                    ? 'border-brand-500 bg-brand-50/80 dark:bg-brand-950/60 ring-2 ring-brand-500/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-slate-100/60 dark:hover:bg-slate-800/70'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {opt.icon}
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {opt.title}
                      </span>
                    </div>
                    {isSelected && (
                      <div className="w-4 h-4 rounded-full bg-brand-600 text-white flex items-center justify-center">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}
                  </div>
                  {opt.badge && (
                    <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-100 dark:bg-brand-900/60 text-brand-700 dark:text-brand-300 mb-1.5">
                      {opt.badge}
                    </span>
                  )}
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                    {opt.desc}
                  </p>
                </div>
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
              <div className="font-bold text-slate-900 dark:text-white">
                Completion & Reminder Chimes
              </div>
              <div className="text-slate-500 dark:text-slate-400">
                Play synthesized harmonic chimes on task actions
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => sounds.playCompletionChime()}
                className="px-2.5 py-1 text-[11px] font-semibold text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-950/60 rounded-lg transition-colors"
              >
                Test Sound
              </button>
              <input
                type="checkbox"
                checked={settings.soundEnabled}
                onChange={e => updateSettings({ soundEnabled: e.target.checked })}
                className="w-5 h-5 rounded text-brand-600 accent-brand-600 cursor-pointer"
              />
            </div>
          </div>

          {/* Vibration Toggle */}
          <div className="py-3 flex items-center justify-between">
            <div>
              <div className="font-bold text-slate-900 dark:text-white">
                Haptic Vibration
              </div>
              <div className="text-slate-500 dark:text-slate-400">
                Tactile feedback when completing tasks or firing alarms
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.vibrationEnabled}
              onChange={e => updateSettings({ vibrationEnabled: e.target.checked })}
              className="w-5 h-5 rounded text-brand-600 accent-brand-600 cursor-pointer"
            />
          </div>

          {/* Celebration Confetti */}
          <div className="py-3 flex items-center justify-between">
            <div>
              <div className="font-bold text-slate-900 dark:text-white">
                Confetti Celebration
              </div>
              <div className="text-slate-500 dark:text-slate-400">
                Reward confetti bursts upon completing to-do tasks
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.celebrationConfetti}
              onChange={e => updateSettings({ celebrationConfetti: e.target.checked })}
              className="w-5 h-5 rounded text-brand-600 accent-brand-600 cursor-pointer"
            />
          </div>

          {/* Reduced Motion */}
          <div className="py-3 flex items-center justify-between">
            <div>
              <div className="font-bold text-slate-900 dark:text-white">
                Reduced Motion
              </div>
              <div className="text-slate-500 dark:text-slate-400">
                Minimize interface transitions and disable particle effects
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.reducedMotion}
              onChange={e => updateSettings({ reducedMotion: e.target.checked })}
              className="w-5 h-5 rounded text-brand-600 accent-brand-600 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* REMINDER TONES */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-brand-600 dark:text-brand-400" />
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Reminder Tones
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Choose the audio chime for your scheduled alarms and notifications.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
          {REMINDER_TONES.map(tone => {
            const isSelected = (settings.reminderTone || 'chime') === tone.id;
            return (
              <div
                key={tone.id}
                onClick={() => {
                  updateSettings({ reminderTone: tone.id });
                  sounds.playReminderTone(tone.id);
                }}
                className={`p-3.5 rounded-2xl border text-left flex items-center justify-between cursor-pointer transition-all ${
                  isSelected
                    ? 'border-brand-500 bg-brand-50/80 dark:bg-brand-950/60 ring-2 ring-brand-500/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-slate-100/60 dark:hover:bg-slate-800/70'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-lg">{tone.icon}</span>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {tone.name}
                    </div>
                    <div className="text-[11px] text-slate-600 dark:text-slate-300 truncate">
                      {tone.desc}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      sounds.playReminderTone(tone.id);
                    }}
                    className="w-8 h-8 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-brand-600 dark:text-brand-400 flex items-center justify-center transition-transform active:scale-90"
                    title={`Preview ${tone.name}`}
                  >
                    <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                  </button>

                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-brand-600 text-white flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* PUSH NOTIFICATIONS & BACKGROUND ALERTS */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Smartphone className="w-5 h-5 text-brand-600 dark:text-brand-400" />
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Background & System Notifications
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Receive lock screen alert banners when reminder times arrive
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
              permissionStatus === 'granted'
                ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                : permissionStatus === 'denied'
                  ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                  : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
            }`}>
              {permissionStatus === 'granted' ? 'Allowed' : permissionStatus === 'denied' ? 'Blocked' : 'Action Needed'}
            </span>

            {permissionStatus !== 'granted' && (
              <button
                type="button"
                onClick={handleRequestNotification}
                className="px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition-all active:scale-95 shadow-sm"
              >
                Enable
              </button>
            )}
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-start gap-2.5 text-xs text-slate-500 dark:text-slate-400">
          <Info className="w-4 h-4 text-brand-600 dark:text-brand-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong className="text-slate-700 dark:text-slate-200">iOS & Android Tip:</strong> On iPhone/iPad (iOS 16.4+), tap Safari's <span className="font-semibold text-slate-800 dark:text-slate-200">Share → Add to Home Screen</span> to enable system lock screen banners and vibrations even when Donezy is in the background.
          </p>
        </div>
      </div>

      {/* APP VERSION & UPDATES (With small update button) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-600 to-accent-500 text-white flex items-center justify-center shadow-md shadow-brand-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Donezy App Updates
                </h3>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  v1.2.0
                </span>
                {updateAvailable && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 animate-pulse">
                    New Update Available
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Check for latest features, fixes, and offline performance enhancements.
              </p>
            </div>
          </div>

          {/* Small Update Button */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleCheckUpdate}
              disabled={isCheckingUpdate}
              className={`min-h-[38px] px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition-all disabled:opacity-50 ${
                updateAvailable
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-amber-500/25 ring-2 ring-amber-400/50'
                  : 'bg-brand-600 hover:bg-brand-500 text-white shadow-brand-500/20'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isCheckingUpdate ? 'animate-spin' : ''}`} />
              <span>
                {isCheckingUpdate 
                  ? 'Checking...' 
                  : updateAvailable 
                    ? 'Update App' 
                    : 'Check for Updates'}
              </span>
            </button>
          </div>
        </div>

        {/* Update Status Feedback */}
        {updateStatusMessage && (
          <div className={`p-3 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-fade-in ${
            updateStatusType === 'success' 
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
              : updateStatusType === 'update'
                ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
          }`}>
            {updateStatusType === 'success' && <Check className="w-4 h-4 text-emerald-500" />}
            {updateStatusType === 'update' && <Sparkles className="w-4 h-4 text-amber-500" />}
            <span>{updateStatusMessage}</span>
          </div>
        )}

        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <span>PWA Service Worker: Offline Cache Active</span>
          <button
            onClick={handleForceRefresh}
            className="text-brand-600 dark:text-brand-400 hover:underline font-semibold"
          >
            Force Clear Cache & Reload
          </button>
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
                className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                  settings.timeFormat === '12h'
                    ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-slate-100/60 dark:hover:bg-slate-800/70 text-slate-700 dark:text-slate-200'
                }`}
              >
                12-Hour (10:00 AM)
              </button>
              <button
                onClick={() => updateSettings({ timeFormat: '24h' })}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                  settings.timeFormat === '24h'
                    ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-slate-100/60 dark:hover:bg-slate-800/70 text-slate-700 dark:text-slate-200'
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
                className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                  settings.weekStartsOn === 1
                    ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-slate-100/60 dark:hover:bg-slate-800/70 text-slate-700 dark:text-slate-200'
                }`}
              >
                Monday
              </button>
              <button
                onClick={() => updateSettings({ weekStartsOn: 0 })}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                  settings.weekStartsOn === 0
                    ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-slate-100/60 dark:hover:bg-slate-800/70 text-slate-700 dark:text-slate-200'
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
          {categories.map(cat => {
            const isEditing = editingCategory?.id === cat.id;
            return (
              <div
                key={cat.id}
                onClick={() => startEditCategory(cat)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                  isEditing
                    ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/60 ring-2 ring-brand-500/30'
                    : 'border-slate-200 dark:border-slate-700 hover:border-brand-300 dark:hover:border-slate-600'
                }`}
              >
                <span className="w-3 h-3 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: cat.color }} />
                <IconRenderer name={cat.icon} className="w-3.5 h-3.5" />
                <span className="text-slate-800 dark:text-slate-200">{cat.name}</span>
                {!cat.isDefault && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (editingCategory?.id === cat.id) setEditingCategory(null);
                      deleteCategory(cat.id);
                    }}
                    className="text-slate-400 hover:text-rose-500 ml-1 p-0.5"
                    title="Delete category"
                  >
                    ×
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Edit Category Mode */}
        {editingCategory ? (
          <form onSubmit={handleUpdateCategory} className="pt-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3 animate-fade-in">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Edit Category: {editingCategory.name}
              </span>
              <button
                type="button"
                onClick={() => setEditingCategory(null)}
                className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                Cancel
              </button>
            </div>

            {/* Color Palette Swatches */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Color Palette
              </label>
              <div className="flex flex-wrap gap-1.5 items-center">
                {CATEGORY_PALETTE.map(col => (
                  <button
                    key={col}
                    type="button"
                    onClick={() => setEditCatColor(col)}
                    className={`w-6 h-6 rounded-full transition-transform ${
                      editCatColor.toLowerCase() === col.toLowerCase()
                        ? 'ring-2 ring-offset-2 ring-brand-500 scale-110 shadow-sm'
                        : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: col }}
                  />
                ))}
                <input
                  type="color"
                  value={editCatColor}
                  onChange={e => setEditCatColor(e.target.value)}
                  className="w-6 h-6 rounded-full border border-slate-300 dark:border-slate-600 cursor-pointer p-0 bg-transparent overflow-hidden"
                  title="Custom color"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={editCatName}
                onChange={e => setEditCatName(e.target.value)}
                placeholder="Category Name"
                className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <button
                type="submit"
                disabled={!editCatName.trim()}
                className="min-h-[40px] px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold disabled:opacity-40"
              >
                Save
              </button>
            </div>
          </form>
        ) : (
          /* Add custom category form with color palette */
          <div className="space-y-2 pt-2">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                Quick Color Palette
              </label>
              <div className="flex flex-wrap gap-1.5 items-center">
                {CATEGORY_PALETTE.map(col => (
                  <button
                    key={col}
                    type="button"
                    onClick={() => setNewCatColor(col)}
                    className={`w-6 h-6 rounded-full transition-transform ${
                      newCatColor.toLowerCase() === col.toLowerCase()
                        ? 'ring-2 ring-offset-2 ring-brand-500 scale-110 shadow-sm'
                        : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: col }}
                  />
                ))}
                <input
                  type="color"
                  value={newCatColor}
                  onChange={e => setNewCatColor(e.target.value)}
                  className="w-6 h-6 rounded-full border border-slate-300 dark:border-slate-600 cursor-pointer p-0 bg-transparent overflow-hidden"
                  title="Custom color"
                />
              </div>
            </div>

            <form onSubmit={handleAddCategory} className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={newCatName}
                onChange={e => setNewCatName(e.target.value)}
                placeholder="New Category Name..."
                className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <div className="flex items-center gap-2">
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
        )}
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

      {/* COPYRIGHT & BRANDING FOOTER */}
      <footer className="pt-6 pb-2 text-center space-y-1.5 border-t border-slate-200/60 dark:border-slate-800/80">
        <div className="flex items-center justify-center gap-2">
          <img
            src="/donezy-icon.svg"
            alt="Donezy"
            className="w-5 h-5 rounded-lg shadow-sm"
          />
          <span className="text-xs font-extrabold tracking-tight bg-gradient-to-r from-brand-600 to-accent-500 bg-clip-text text-transparent">
            Donezy
          </span>
          <span className="text-[10px] text-slate-300 dark:text-slate-700">•</span>
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            Smart Todo & Reminder PWA
          </span>
        </div>
        <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
          © {new Date().getFullYear()} Gunjan Jangid. All rights reserved.
        </p>
        <p className="text-[11px] text-slate-400 dark:text-slate-500">
          Crafted with care by <span className="font-semibold text-slate-600 dark:text-slate-300">Gunjan Jangid</span>
        </p>
      </footer>

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
                <div className="text-xs text-slate-500 dark:text-slate-400">
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
                <div className="text-xs text-rose-500/80 dark:text-rose-400/80">
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
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
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
