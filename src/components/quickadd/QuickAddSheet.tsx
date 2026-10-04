import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Mic, 
  Send, 
  Sparkles, 
  Calendar as CalendarIcon, 
  Clock, 
  ChevronDown, 
  Plus, 
  Check, 
  Trash2,
  Tag,
  Repeat,
  Flag,
  Zap,
  ListChecks
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { NaturalLanguageParser, ParsedTaskResult } from '../../services/NaturalLanguageParser';
import { formatDateLabel, formatTimeDisplay } from '../../utils/dateUtils';
import { HistoryRepository } from '../../repositories/HistoryRepository';
import { Priority, TaskRecurrence, TaskHistoryItem } from '../../types';
import { VoiceInputModal } from '../voice/VoiceInputModal';
import { IconRenderer } from '../common/IconRenderer';
import { format, startOfTomorrow, nextSaturday, nextMonday, addHours } from 'date-fns';

const QUICK_PRESETS = [
  { id: 'call', label: 'Call', icon: '📞', defaultCategory: 'work', prefix: 'Call ' },
  { id: 'buy', label: 'Buy', icon: '🛒', defaultCategory: 'shopping', prefix: 'Buy ' },
  { id: 'pay', label: 'Pay', icon: '💳', defaultCategory: 'finance', prefix: 'Pay ' },
  { id: 'medicine', label: 'Medicine', icon: '💊', defaultCategory: 'health', prefix: 'Take ' },
  { id: 'exercise', label: 'Exercise', icon: '🏃', defaultCategory: 'health', prefix: 'Workout: ' },
  { id: 'meeting', label: 'Meeting', icon: '📅', defaultCategory: 'work', prefix: 'Meeting with ' },
  { id: 'family', label: 'Family', icon: '👨‍👩‍👧', defaultCategory: 'family', prefix: 'Family: ' },
  { id: 'home', label: 'Home', icon: '🏠', defaultCategory: 'home', prefix: 'Home chore: ' },
  { id: 'car', label: 'Car', icon: '🚗', defaultCategory: 'car', prefix: 'Car service: ' },
  { id: 'study', label: 'Study', icon: '📚', defaultCategory: 'study', prefix: 'Study ' },
];

type ActiveDropdown = 'date' | 'category' | 'priority' | 'repeat' | 'template' | 'recent' | null;

export const QuickAddSheet: React.FC = () => {
  const { 
    isQuickAddOpen, 
    closeQuickAdd, 
    createTask, 
    categories, 
    quickAddInitialText, 
    quickAddPreset 
  } = useApp();

  const [input, setInput] = useState('');
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [selectedTime, setSelectedTime] = useState<string | undefined>(undefined);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [priority, setPriority] = useState<Priority>('none');
  const [categoryId, setCategoryId] = useState('personal');
  const [recurrence, setRecurrence] = useState<TaskRecurrence | undefined>(undefined);
  const [notes, setNotes] = useState('');
  const [subtasks, setSubtasks] = useState<{ id: string; title: string; completed: boolean }[]>([]);
  const [newSubtaskText, setNewSubtaskText] = useState('');
  const [showSubtasks, setShowSubtasks] = useState(false);

  const [activeDropdown, setActiveDropdown] = useState<ActiveDropdown>(null);
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [historySuggestions, setHistorySuggestions] = useState<TaskHistoryItem[]>([]);
  const [detectedChips, setDetectedChips] = useState<ParsedTaskResult['detectedChips']>([]);

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setActiveDropdown(null);
      }
    };
    if (activeDropdown) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('touchstart', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [activeDropdown]);

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (activeDropdown) {
          e.stopPropagation();
          setActiveDropdown(null);
        } else if (isQuickAddOpen) {
          closeQuickAdd();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeDropdown, isQuickAddOpen, closeQuickAdd]);

  // Reset and initialize when opened
  useEffect(() => {
    if (isQuickAddOpen) {
      const todayStr = format(new Date(), 'yyyy-MM-dd');
      let startText = quickAddInitialText || '';
      let initialCat = 'personal';

      if (quickAddPreset) {
        const p = QUICK_PRESETS.find(item => item.id === quickAddPreset);
        if (p) {
          startText = p.prefix;
          initialCat = p.defaultCategory;
        }
      }

      setInput(startText);
      setSelectedDate(todayStr);
      setSelectedTime(undefined);
      setReminderEnabled(false);
      setPriority('none');
      setCategoryId(initialCat);
      setRecurrence(undefined);
      setNotes('');
      setSubtasks([]);
      setShowSubtasks(false);
      setActiveDropdown(null);

      // Load history suggestions
      HistoryRepository.getTopSuggestions(startText, 4).then(setHistorySuggestions);

      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isQuickAddOpen, quickAddInitialText, quickAddPreset]);

  // Live natural language parsing on keystroke
  const handleInputChange = (val: string) => {
    setInput(val);

    if (val.trim().length > 3) {
      const parsed = NaturalLanguageParser.parse(val);
      setDetectedChips(parsed.detectedChips);

      // Set detected values if parsed
      if (parsed.confidence.hasDate) {
        setSelectedDate(parsed.dueDate);
      }
      if (parsed.confidence.hasTime && parsed.dueTime) {
        setSelectedTime(parsed.dueTime);
        setReminderEnabled(true);
      }
      if (parsed.confidence.hasRecurrence && parsed.recurrence) {
        setRecurrence(parsed.recurrence);
      }
      if (parsed.priority !== 'none') {
        setPriority(parsed.priority);
      }
      if (parsed.categoryId) {
        setCategoryId(parsed.categoryId);
      }
    } else {
      setDetectedChips([]);
    }

    // Refresh history suggestions
    HistoryRepository.getTopSuggestions(val, 4).then(setHistorySuggestions);
  };

  const applyPresetClick = (preset: typeof QUICK_PRESETS[0]) => {
    setInput(preset.prefix);
    setCategoryId(preset.defaultCategory);
    setActiveDropdown(null);
    inputRef.current?.focus();
  };

  const applySuggestion = (item: TaskHistoryItem) => {
    setInput(item.title);
    if (item.categoryId) setCategoryId(item.categoryId);
    if (item.typicalTime) {
      setSelectedTime(item.typicalTime);
      setReminderEnabled(true);
    }
    setActiveDropdown(null);
    inputRef.current?.focus();
  };

  const handleVoiceSave = (parsed: ParsedTaskResult) => {
    createTask({
      title: parsed.cleanTitle,
      dueDate: parsed.dueDate,
      dueTime: parsed.dueTime,
      reminder: parsed.reminderEnabled ? { enabled: true, time: parsed.dueTime } : undefined,
      priority: parsed.priority,
      categoryId: parsed.categoryId || 'personal',
      recurrence: parsed.recurrence,
      subtasks: [],
    }, 'voice');
    closeQuickAdd();
  };

  const handleVoiceEdit = (parsed: ParsedTaskResult) => {
    setInput(parsed.cleanTitle);
    setSelectedDate(parsed.dueDate);
    setSelectedTime(parsed.dueTime);
    setReminderEnabled(parsed.reminderEnabled);
    setPriority(parsed.priority);
    if (parsed.categoryId) setCategoryId(parsed.categoryId);
    if (parsed.recurrence) setRecurrence(parsed.recurrence);
    inputRef.current?.focus();
  };

  const handleAddSubtask = () => {
    if (!newSubtaskText.trim()) return;
    setSubtasks(prev => [
      ...prev,
      { id: `sub-${Date.now()}`, title: newSubtaskText.trim(), completed: false }
    ]);
    setNewSubtaskText('');
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const trimmed = input.trim();
    if (!trimmed) return;

    // Run clean parsing on title
    const parsed = NaturalLanguageParser.parse(trimmed);
    const finalTitle = parsed.cleanTitle || trimmed;

    await createTask({
      title: finalTitle,
      dueDate: selectedDate,
      dueTime: selectedTime,
      reminder: reminderEnabled || selectedTime ? { enabled: true, time: selectedTime } : undefined,
      priority,
      categoryId,
      recurrence,
      notes: notes.trim(),
      subtasks,
    }, detectedChips.length > 0 ? 'nl' : 'manual');

    closeQuickAdd();
  };

  const toggleDropdown = (name: ActiveDropdown) => {
    setActiveDropdown(prev => prev === name ? null : name);
  };

  if (!isQuickAddOpen) return null;

  // Selected Category Info
  const currentCategory = categories.find(c => c.id === categoryId) || categories[0] || {
    id: 'personal',
    name: 'Personal',
    icon: 'User',
    color: '#6366f1'
  };

  // Quick Date Helpers for dropdown
  const now = new Date();
  const todayStr = format(now, 'yyyy-MM-dd');
  const tomorrowStr = format(startOfTomorrow(), 'yyyy-MM-dd');
  const weekendDate = nextSaturday(now);
  const weekendStr = format(weekendDate, 'yyyy-MM-dd');
  const nextWeekDate = nextMonday(now);
  const nextWeekStr = format(nextWeekDate, 'yyyy-MM-dd');

  // Format button labels
  const dateButtonLabel = `${formatDateLabel(selectedDate)}${selectedTime ? `, ${formatTimeDisplay(selectedTime)}` : ''}`;

  const priorityLabelMap: Record<Priority, { label: string; icon: string; color: string }> = {
    none: { label: 'Priority', icon: '🏳️', color: 'text-slate-400' },
    low: { label: 'Low', icon: '🟢', color: 'text-emerald-500' },
    medium: { label: 'Med', icon: '🟡', color: 'text-amber-500' },
    high: { label: 'High', icon: '🔴', color: 'text-rose-500' },
  };

  const recurrenceLabelMap: Record<string, string> = {
    daily: 'Daily',
    weekdays: 'Weekdays',
    weekends: 'Weekends',
    weekly: 'Weekly',
    monthly: 'Monthly',
    yearly: 'Yearly',
  };

  const repeatButtonLabel = recurrence ? recurrenceLabelMap[recurrence.frequency] || 'Repeat' : 'Repeat';

  return (
    <>
      <div 
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
        onClick={closeQuickAdd}
      >
        <div 
          onClick={e => e.stopPropagation()}
          className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh] overflow-hidden animate-slide-up"
          role="dialog"
          aria-modal="true"
          aria-label="Quick Add Task"
        >
          {/* Header */}
          <div className="px-5 pt-3.5 pb-2.5 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 rounded-lg">
                <Sparkles className="w-4 h-4" />
              </span>
              <span className="text-sm font-bold tracking-tight text-slate-800 dark:text-slate-200">
                Quick Task
              </span>
            </div>
            <button
              onClick={closeQuickAdd}
              aria-label="Close"
              className="w-10 h-10 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-4 sm:px-5 py-3 space-y-3.5">
            {/* Primary Input Container */}
            <div className="relative flex items-center bg-slate-50 dark:bg-slate-800/70 rounded-2xl border-2 border-brand-500/20 focus-within:border-brand-500 focus-within:ring-4 focus-within:ring-brand-500/10 transition-all p-1">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => handleInputChange(e.target.value)}
                placeholder="What do you need to do? (e.g. Call dentist tomorrow at 2 PM)"
                className="w-full bg-transparent px-3 py-2.5 text-base font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
              />

              {/* Voice button inside input */}
              <button
                type="button"
                onClick={() => setIsVoiceOpen(true)}
                title="Voice Input"
                className="w-10 h-10 min-w-[40px] min-h-[40px] shrink-0 flex items-center justify-center rounded-xl bg-gradient-to-tr from-brand-500 to-accent-500 text-white hover:from-brand-600 hover:to-accent-600 shadow-md shadow-brand-500/20 active:scale-95 transition-all mr-0.5"
              >
                <Mic className="w-4 h-4" />
              </button>
            </div>

            {/* Smart Parsed Chips Feedback */}
            {detectedChips.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 mr-0.5">
                  Interpreted:
                </span>
                {detectedChips.map((chip, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800/80 animate-scale-in"
                  >
                    {chip.label}
                  </span>
                ))}
              </div>
            )}

            {/* DROPDOWN BUTTONS TOOLBAR */}
            <div ref={dropdownRef} className="relative flex flex-wrap items-center gap-2 pt-0.5">
              {/* 1. Date & Time Dropdown Button */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => toggleDropdown('date')}
                  className={`min-h-[40px] px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all shadow-sm active:scale-95 ${
                    activeDropdown === 'date'
                      ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-300 ring-2 ring-brand-500/20'
                      : selectedDate !== todayStr || selectedTime
                        ? 'border-brand-300 dark:border-brand-700 bg-brand-50/50 dark:bg-brand-950/30 text-brand-700 dark:text-brand-300'
                        : 'bg-slate-100 hover:bg-slate-200/70 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                  }`}
                  aria-expanded={activeDropdown === 'date'}
                  aria-haspopup="true"
                >
                  <CalendarIcon className="w-3.5 h-3.5 text-brand-500 shrink-0" />
                  <span className="whitespace-nowrap">{dateButtonLabel}</span>
                  <ChevronDown className={`w-3.5 h-3.5 opacity-60 transition-transform duration-200 ${activeDropdown === 'date' ? 'rotate-180 text-brand-500 opacity-100' : ''}`} />
                </button>

                {/* Date Dropdown Menu */}
                {activeDropdown === 'date' && (
                  <div className="absolute top-full mt-2 left-0 z-40 w-72 sm:w-80 max-w-[calc(100vw-2.5rem)] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-3 space-y-3 animate-fade-in">
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                        Quick Date Presets
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedDate(todayStr);
                          }}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-medium text-left flex items-center justify-between transition-colors ${
                            selectedDate === todayStr
                              ? 'bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-300 font-bold'
                              : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
                          }`}
                        >
                          <span>⚡ Today</span>
                          {selectedDate === todayStr && <Check className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedDate(tomorrowStr);
                          }}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-medium text-left flex items-center justify-between transition-colors ${
                            selectedDate === tomorrowStr
                              ? 'bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-300 font-bold'
                              : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
                          }`}
                        >
                          <span>🌅 Tomorrow</span>
                          {selectedDate === tomorrowStr && <Check className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedDate(weekendStr);
                          }}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-medium text-left flex items-center justify-between transition-colors ${
                            selectedDate === weekendStr
                              ? 'bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-300 font-bold'
                              : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
                          }`}
                        >
                          <span>🏖️ Weekend</span>
                          {selectedDate === weekendStr && <Check className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedDate(nextWeekStr);
                          }}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-medium text-left flex items-center justify-between transition-colors ${
                            selectedDate === nextWeekStr
                              ? 'bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-300 font-bold'
                              : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
                          }`}
                        >
                          <span>💼 Next Week</span>
                          {selectedDate === nextWeekStr && <Check className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                        Time of Day
                      </div>
                      <div className="grid grid-cols-3 gap-1.5 text-center">
                        {[
                          { label: 'Morning', time: '09:00' },
                          { label: 'Afternoon', time: '14:00' },
                          { label: 'Evening', time: '18:00' },
                          { label: 'Night', time: '20:00' },
                          { label: 'Now', time: format(now, 'HH:mm') },
                          { label: 'Later (+2h)', time: format(addHours(now, 2), 'HH:mm') },
                        ].map(t => (
                          <button
                            key={t.label}
                            type="button"
                            onClick={() => {
                              setSelectedTime(t.time);
                              setReminderEnabled(true);
                            }}
                            className={`px-1.5 py-1 rounded-lg text-[11px] font-medium transition-colors border ${
                              selectedTime === t.time
                                ? 'bg-brand-600 text-white border-brand-600'
                                : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-brand-400'
                            }`}
                          >
                            {t.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Custom Date & Time Inputs */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                          Custom Date
                        </label>
                        <input
                          type="date"
                          value={selectedDate}
                          onChange={e => setSelectedDate(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                          Custom Time
                        </label>
                        <input
                          type="time"
                          value={selectedTime || ''}
                          onChange={e => {
                            setSelectedTime(e.target.value || undefined);
                            if (e.target.value) setReminderEnabled(true);
                          }}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
                        />
                      </div>
                    </div>

                    {/* Action buttons inside date dropdown */}
                    <div className="pt-1 flex items-center justify-between">
                      {selectedTime ? (
                        <button
                          type="button"
                          onClick={() => setSelectedTime(undefined)}
                          className="text-[11px] text-rose-500 hover:underline font-semibold"
                        >
                          Clear time
                        </button>
                      ) : <div />}
                      <button
                        type="button"
                        onClick={() => setActiveDropdown(null)}
                        className="px-3 py-1 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-xs font-semibold"
                      >
                        Done
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* 2. Category Dropdown Button */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => toggleDropdown('category')}
                  className={`min-h-[40px] px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all shadow-sm active:scale-95 ${
                    activeDropdown === 'category'
                      ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-300 ring-2 ring-brand-500/20'
                      : 'bg-slate-100 hover:bg-slate-200/70 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                  }`}
                  aria-expanded={activeDropdown === 'category'}
                  aria-haspopup="true"
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"
                    style={{ backgroundColor: currentCategory.color }}
                  />
                  <span className="whitespace-nowrap">{currentCategory.name}</span>
                  <ChevronDown className={`w-3.5 h-3.5 opacity-60 transition-transform duration-200 ${activeDropdown === 'category' ? 'rotate-180 text-brand-500 opacity-100' : ''}`} />
                </button>

                {/* Category Dropdown Menu */}
                {activeDropdown === 'category' && (
                  <div className="absolute top-full mt-2 left-0 z-40 w-56 sm:w-64 max-w-[calc(100vw-2.5rem)] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-2 space-y-1 animate-fade-in">
                    <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Select Category
                    </div>
                    <div className="max-h-56 overflow-y-auto space-y-0.5 no-scrollbar">
                      {categories.map(cat => {
                        const isSelected = categoryId === cat.id;
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => {
                              setCategoryId(cat.id);
                              setActiveDropdown(null);
                            }}
                            className={`w-full min-h-[38px] px-2.5 py-2 rounded-xl flex items-center justify-between text-xs font-semibold transition-colors ${
                              isSelected
                                ? 'bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 font-bold'
                                : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <span
                                className="w-2.5 h-2.5 rounded-full shrink-0"
                                style={{ backgroundColor: cat.color }}
                              />
                              <IconRenderer name={cat.icon} className="w-3.5 h-3.5 opacity-60" />
                              <span>{cat.name}</span>
                            </div>
                            {isSelected && <Check className="w-4 h-4 text-brand-600 dark:text-brand-400" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* 3. Priority Dropdown Button */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => toggleDropdown('priority')}
                  className={`min-h-[40px] px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all shadow-sm active:scale-95 ${
                    activeDropdown === 'priority'
                      ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-300 ring-2 ring-brand-500/20'
                      : priority !== 'none'
                        ? 'border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300'
                        : 'bg-slate-100 hover:bg-slate-200/70 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                  }`}
                  aria-expanded={activeDropdown === 'priority'}
                  aria-haspopup="true"
                >
                  <Flag className="w-3.5 h-3.5 shrink-0 opacity-70" />
                  <span className="whitespace-nowrap">
                    {priority === 'none' ? 'Priority' : `${priorityLabelMap[priority].icon} ${priorityLabelMap[priority].label}`}
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 opacity-60 transition-transform duration-200 ${activeDropdown === 'priority' ? 'rotate-180 text-brand-500 opacity-100' : ''}`} />
                </button>

                {/* Priority Dropdown Menu */}
                {activeDropdown === 'priority' && (
                  <div className="absolute top-full mt-2 left-0 sm:left-auto sm:right-0 z-40 w-48 max-w-[calc(100vw-2.5rem)] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-2 space-y-1 animate-fade-in">
                    <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Task Priority
                    </div>
                    {(['none', 'low', 'medium', 'high'] as Priority[]).map(p => {
                      const isSelected = priority === p;
                      return (
                        <button
                          key={p}
                          type="button"
                          onClick={() => {
                            setPriority(p);
                            setActiveDropdown(null);
                          }}
                          className={`w-full min-h-[38px] px-2.5 py-2 rounded-xl flex items-center justify-between text-xs font-semibold transition-colors ${
                            isSelected
                              ? 'bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 font-bold'
                              : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span>{priorityLabelMap[p].icon}</span>
                            <span>{p === 'none' ? 'None (Normal)' : `${priorityLabelMap[p].label} Priority`}</span>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-brand-600 dark:text-brand-400" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 4. Repeat Dropdown Button */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => toggleDropdown('repeat')}
                  className={`min-h-[40px] px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all shadow-sm active:scale-95 ${
                    activeDropdown === 'repeat'
                      ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-300 ring-2 ring-brand-500/20'
                      : recurrence
                        ? 'border-indigo-300 dark:border-indigo-700 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300'
                        : 'bg-slate-100 hover:bg-slate-200/70 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                  }`}
                  aria-expanded={activeDropdown === 'repeat'}
                  aria-haspopup="true"
                >
                  <Repeat className="w-3.5 h-3.5 shrink-0 opacity-70" />
                  <span className="whitespace-nowrap">{repeatButtonLabel}</span>
                  <ChevronDown className={`w-3.5 h-3.5 opacity-60 transition-transform duration-200 ${activeDropdown === 'repeat' ? 'rotate-180 text-brand-500 opacity-100' : ''}`} />
                </button>

                {/* Repeat Dropdown Menu */}
                {activeDropdown === 'repeat' && (
                  <div className="absolute top-full mt-2 left-0 sm:left-auto sm:right-0 z-40 w-52 max-w-[calc(100vw-2.5rem)] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-2 space-y-1 animate-fade-in">
                    <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Repeat Frequency
                    </div>
                    {[
                      { id: undefined, label: 'Never (Does not repeat)' },
                      { id: 'daily', label: 'Daily (Every day)' },
                      { id: 'weekdays', label: 'Weekdays (Mon-Fri)' },
                      { id: 'weekends', label: 'Weekends (Sat-Sun)' },
                      { id: 'weekly', label: 'Weekly' },
                      { id: 'monthly', label: 'Monthly' },
                      { id: 'yearly', label: 'Yearly' },
                    ].map(rec => {
                      const isSelected = recurrence?.frequency === rec.id || (!recurrence && !rec.id);
                      return (
                        <button
                          key={rec.label}
                          type="button"
                          onClick={() => {
                            setRecurrence(rec.id ? { frequency: rec.id as TaskRecurrence['frequency'] } : undefined);
                            setActiveDropdown(null);
                          }}
                          className={`w-full min-h-[38px] px-2.5 py-2 rounded-xl flex items-center justify-between text-xs font-semibold transition-colors ${
                            isSelected
                              ? 'bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 font-bold'
                              : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <span>{rec.label}</span>
                          {isSelected && <Check className="w-4 h-4 text-brand-600 dark:text-brand-400" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 5. Templates Dropdown Button */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => toggleDropdown('template')}
                  className={`min-h-[40px] px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all shadow-sm active:scale-95 ${
                    activeDropdown === 'template'
                      ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-300 ring-2 ring-brand-500/20'
                      : 'bg-slate-100 hover:bg-slate-200/70 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                  }`}
                  aria-expanded={activeDropdown === 'template'}
                  aria-haspopup="true"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span className="whitespace-nowrap">Templates</span>
                  <ChevronDown className={`w-3.5 h-3.5 opacity-60 transition-transform duration-200 ${activeDropdown === 'template' ? 'rotate-180 text-brand-500 opacity-100' : ''}`} />
                </button>

                {/* Templates Dropdown Menu */}
                {activeDropdown === 'template' && (
                  <div className="absolute top-full mt-2 right-0 z-40 w-64 sm:w-72 max-w-[calc(100vw-2.5rem)] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-2.5 space-y-2 animate-fade-in">
                    <div className="px-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Quick Templates (1-Tap Prefill)
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {QUICK_PRESETS.map(preset => (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => applyPresetClick(preset)}
                          className="px-2.5 py-2 rounded-xl text-xs font-semibold bg-slate-50 hover:bg-brand-50 dark:bg-slate-800/80 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition-colors text-left"
                        >
                          <span className="text-base leading-none">{preset.icon}</span>
                          <span>{preset.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 6. Recent & Suggested Dropdown Button (if history available) */}
              {historySuggestions.length > 0 && (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => toggleDropdown('recent')}
                    className={`min-h-[40px] px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all shadow-sm active:scale-95 ${
                      activeDropdown === 'recent'
                        ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-300 ring-2 ring-brand-500/20'
                        : 'bg-slate-100 hover:bg-slate-200/70 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                    }`}
                    aria-expanded={activeDropdown === 'recent'}
                    aria-haspopup="true"
                  >
                    <Clock className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <span className="whitespace-nowrap">Recent ({historySuggestions.length})</span>
                    <ChevronDown className={`w-3.5 h-3.5 opacity-60 transition-transform duration-200 ${activeDropdown === 'recent' ? 'rotate-180 text-brand-500 opacity-100' : ''}`} />
                  </button>

                  {/* Recent Suggestions Dropdown Menu */}
                  {activeDropdown === 'recent' && (
                    <div className="absolute top-full mt-2 right-0 z-40 w-64 sm:w-72 max-w-[calc(100vw-2.5rem)] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-2 space-y-1 animate-fade-in">
                      <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Recent & Suggested Tasks
                      </div>
                      <div className="space-y-0.5">
                        {historySuggestions.map(s => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => applySuggestion(s)}
                            className="w-full px-2.5 py-2 rounded-xl text-xs font-medium text-left hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 flex items-center justify-between transition-colors"
                          >
                            <span className="truncate">{s.title}</span>
                            {s.typicalTime && (
                              <span className="text-[10px] text-slate-400 ml-2 shrink-0">
                                {s.typicalTime}
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Optional Notes Input */}
            <div>
              <textarea
                rows={2}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Add details, notes, or link... (optional)"
                className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 resize-none transition-all"
              />
            </div>

            {/* Subtasks Section */}
            {!showSubtasks && subtasks.length === 0 ? (
              <button
                type="button"
                onClick={() => setShowSubtasks(true)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-400 transition-colors py-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add checklist / subtasks</span>
              </button>
            ) : (
              <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-800/80 animate-fade-in">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Checklist ({subtasks.length})
                  </label>
                  {subtasks.length === 0 && (
                    <button
                      type="button"
                      onClick={() => setShowSubtasks(false)}
                      className="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      Hide
                    </button>
                  )}
                </div>

                {subtasks.length > 0 && (
                  <div className="space-y-1 max-h-32 overflow-y-auto no-scrollbar">
                    {subtasks.map((st, i) => (
                      <div key={st.id} className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/60 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700/60">
                        <span className="text-[10px] text-slate-400 font-mono">{i + 1}.</span>
                        <span className="text-xs text-slate-800 dark:text-slate-200 flex-1 truncate">{st.title}</span>
                        <button
                          type="button"
                          onClick={() => setSubtasks(subtasks.filter(item => item.id !== st.id))}
                          className="text-slate-400 hover:text-rose-500 p-0.5 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newSubtaskText}
                    onChange={e => setNewSubtaskText(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSubtask();
                      }
                    }}
                    placeholder="Add subtask item and press enter..."
                    className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddSubtask}
                    className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Bottom Actions */}
            <div className="pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
              <span className="hidden sm:inline-block text-[11px] text-slate-400 font-medium">
                Press <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-mono">↵ Enter</kbd> to save
              </span>
              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  onClick={closeQuickAdd}
                  className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="min-h-[44px] px-5 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-accent-500 hover:from-brand-500 hover:to-accent-400 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-brand-500/25 disabled:opacity-40 transition-all active:scale-95"
                >
                  <span>Create Task</span>
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Voice input modal */}
      <VoiceInputModal
        isOpen={isVoiceOpen}
        onClose={() => setIsVoiceOpen(false)}
        onSave={handleVoiceSave}
        onEdit={handleVoiceEdit}
      />
    </>
  );
};
