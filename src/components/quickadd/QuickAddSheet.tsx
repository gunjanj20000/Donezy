import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  ListChecks,
  ArrowLeft,
  AlertCircle
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { NaturalLanguageParser, ParsedTaskResult } from '../../services/NaturalLanguageParser';
import { formatDateLabel, formatTimeDisplay } from '../../utils/dateUtils';
import { HistoryRepository } from '../../repositories/HistoryRepository';
import { Priority, TaskRecurrence } from '../../types';
import { VoiceInputModal } from '../voice/VoiceInputModal';
import { IconRenderer } from '../common/IconRenderer';
import { useSpeechRecognition } from '../../utils/useSpeechRecognition';
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

type ActiveDropdown = 'date' | 'category' | 'priority' | 'repeat' | 'template' | null;

interface AutoSuggestionItem {
  id: string;
  title: string;
  categoryId?: string;
  typicalTime?: string;
  source: 'history' | 'task';
}

export const QuickAddSheet: React.FC = () => {
  const { 
    isQuickAddOpen, 
    closeQuickAdd, 
    createTask, 
    categories, 
    tasks,
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
  const [detectedChips, setDetectedChips] = useState<ParsedTaskResult['detectedChips']>([]);

  // Autosuggestion state
  const [autosuggestions, setAutosuggestions] = useState<AutoSuggestionItem[]>([]);
  const [showAutosuggest, setShowAutosuggest] = useState(false);
  const [selectedSuggestionIdx, setSelectedSuggestionIdx] = useState<number>(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const autosuggestRef = useRef<HTMLDivElement>(null);

  // Subtask Voice recognition hook
  const {
    isListening: isSubtaskListening,
    error: subtaskVoiceError,
    start: startSubtaskVoice,
    stop: stopSubtaskVoice,
  } = useSpeechRecognition({
    onResult: (text) => {
      setNewSubtaskText(text);
    },
    onEnd: (text) => {
      if (text?.trim()) {
        setNewSubtaskText(text.trim());
      }
    },
  });

  // Query autosuggestions from history and existing tasks
  const fetchAutosuggestions = useCallback(async (query: string) => {
    const q = query.trim().toLowerCase();

    // 1. Top suggestions from history
    const historyList = await HistoryRepository.getTopSuggestions(query, 8);

    // 2. Matching tasks
    const taskMatches = q
      ? tasks.filter(t => t.title.toLowerCase().includes(q)).slice(0, 8)
      : tasks.slice(0, 6);

    const seen = new Set<string>();
    const results: AutoSuggestionItem[] = [];

    // History first
    for (const h of historyList) {
      const key = h.title.trim().toLowerCase();
      if (!seen.has(key) && (q.length === 0 || key !== q)) {
        seen.add(key);
        results.push({
          id: `hist-${h.id}`,
          title: h.title,
          categoryId: h.categoryId,
          typicalTime: h.typicalTime,
          source: 'history',
        });
      }
    }

    // Existing tasks
    for (const t of taskMatches) {
      const key = t.title.trim().toLowerCase();
      if (!seen.has(key) && (q.length === 0 || key !== q)) {
        seen.add(key);
        results.push({
          id: `task-${t.id}`,
          title: t.title,
          categoryId: t.categoryId,
          typicalTime: t.dueTime,
          source: 'task',
        });
      }
    }

    setAutosuggestions(results.slice(0, 6));
  }, [tasks]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setActiveDropdown(null);
      }
      if (
        autosuggestRef.current && 
        !autosuggestRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowAutosuggest(false);
      }
    };

    if (activeDropdown || showAutosuggest) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('touchstart', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [activeDropdown, showAutosuggest]);

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showAutosuggest) {
          e.stopPropagation();
          setShowAutosuggest(false);
          setSelectedSuggestionIdx(-1);
        } else if (activeDropdown) {
          e.stopPropagation();
          setActiveDropdown(null);
        } else if (isQuickAddOpen) {
          closeQuickAdd();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeDropdown, showAutosuggest, isQuickAddOpen, closeQuickAdd]);

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
      setShowAutosuggest(false);
      setSelectedSuggestionIdx(-1);

      // Preload suggestions
      fetchAutosuggestions(startText);

      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isQuickAddOpen, quickAddInitialText, quickAddPreset, fetchAutosuggestions]);

  // Live natural language parsing on keystroke
  const handleInputChange = (val: string) => {
    setInput(val);
    fetchAutosuggestions(val);
    setShowAutosuggest(true);
    setSelectedSuggestionIdx(-1);

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
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (showAutosuggest && autosuggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedSuggestionIdx(prev => (prev < autosuggestions.length - 1 ? prev + 1 : 0));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedSuggestionIdx(prev => (prev > 0 ? prev - 1 : autosuggestions.length - 1));
        return;
      }
      if (e.key === 'Enter' && selectedSuggestionIdx >= 0 && selectedSuggestionIdx < autosuggestions.length) {
        e.preventDefault();
        applyAutosuggestion(autosuggestions[selectedSuggestionIdx]);
        return;
      }
    }
  };

  const applyAutosuggestion = (item: AutoSuggestionItem) => {
    setInput(item.title);
    if (item.categoryId) setCategoryId(item.categoryId);
    if (item.typicalTime) {
      setSelectedTime(item.typicalTime);
      setReminderEnabled(true);
    }
    setShowAutosuggest(false);
    setSelectedSuggestionIdx(-1);
    inputRef.current?.focus();
  };

  const applyPresetClick = (preset: typeof QUICK_PRESETS[0]) => {
    setInput(preset.prefix);
    setCategoryId(preset.defaultCategory);
    setActiveDropdown(null);
    setShowAutosuggest(false);
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
    setShowAutosuggest(false);
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
        className="fixed inset-0 z-50 bg-slate-50 dark:bg-slate-950 flex flex-col h-[100dvh] w-screen overflow-hidden animate-fade-in"
        role="dialog"
        aria-modal="true"
        aria-label="Quick Task"
      >
        {/* Full Window Header */}
        <header className="px-4 sm:px-8 py-3.5 flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 shrink-0">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={closeQuickAdd}
              aria-label="Back / Close"
              className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 sm:hidden" />
              <X className="w-5 h-5 hidden sm:block" />
            </button>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-brand-50 dark:bg-brand-950/80 text-brand-600 dark:text-brand-400 rounded-lg">
                <Sparkles className="w-4 h-4" />
              </span>
              <div>
                <h2 className="text-base font-bold tracking-tight text-slate-800 dark:text-slate-100 leading-tight">
                  Quick Task
                </h2>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 hidden sm:block">
                  Full window capture • Smart date & voice recognition
                </p>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={closeQuickAdd}
            aria-label="Close"
            className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors sm:hidden"
          >
            <X className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={closeQuickAdd}
            aria-label="Close"
            className="text-xs font-semibold px-3 py-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors hidden sm:flex items-center gap-1.5"
          >
            <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-mono border border-slate-200 dark:border-slate-700">ESC</kbd>
            Close
          </button>
        </header>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 md:px-8 py-5 sm:py-7">
            <div className="max-w-2xl mx-auto w-full space-y-5">
              
              {/* Primary Input Container with Autosuggestion */}
              <div className="relative">
                <div className="relative flex items-center bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-200 dark:border-slate-800 focus-within:border-brand-500 focus-within:ring-4 focus-within:ring-brand-500/10 transition-all p-1 shadow-sm">
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onFocus={() => {
                      setShowAutosuggest(true);
                      fetchAutosuggestions(input);
                    }}
                    onChange={e => handleInputChange(e.target.value)}
                    onKeyDown={handleInputKeyDown}
                    placeholder="What do you need to do? (e.g. Call dentist tomorrow at 2 PM)"
                    className="w-full bg-transparent px-3.5 py-3 text-base font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
                    autoComplete="off"
                  />

                  {/* Clear input button if typed */}
                  {input && (
                    <button
                      type="button"
                      onClick={() => {
                        setInput('');
                        setDetectedChips([]);
                        fetchAutosuggestions('');
                        inputRef.current?.focus();
                      }}
                      className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 mr-1"
                      title="Clear input"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}

                  {/* Voice button inside main input */}
                  <button
                    type="button"
                    onClick={() => setIsVoiceOpen(true)}
                    title="Voice Input"
                    className="w-10 h-10 min-w-[40px] min-h-[40px] shrink-0 flex items-center justify-center rounded-xl bg-gradient-to-tr from-brand-500 to-accent-500 text-white hover:from-brand-600 hover:to-accent-600 shadow-md shadow-brand-500/20 active:scale-95 transition-all mr-0.5"
                  >
                    <Mic className="w-4 h-4" />
                  </button>
                </div>

                {/* AUTOSUGGESTION DROPDOWN */}
                {showAutosuggest && autosuggestions.length > 0 && (
                  <div 
                    ref={autosuggestRef}
                    className="absolute top-full left-0 right-0 mt-2 z-40 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 animate-slide-up"
                  >
                    <div className="px-3.5 py-2 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-brand-500" />
                        {input.trim() ? 'Matching Suggestions' : 'Recent & Frequent Tasks'}
                      </span>
                      <span className="text-[10px] text-slate-400 hidden sm:inline">Use ↑↓ and ↵ to choose</span>
                    </div>
                    <div className="max-h-60 overflow-y-auto py-1">
                      {autosuggestions.map((item, idx) => {
                        const isSelected = idx === selectedSuggestionIdx;
                        const itemCat = categories.find(c => c.id === item.categoryId);
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onMouseEnter={() => setSelectedSuggestionIdx(idx)}
                            onClick={() => applyAutosuggestion(item)}
                            className={`w-full px-3.5 py-2.5 text-left text-xs flex items-center justify-between transition-colors ${
                              isSelected 
                                ? 'bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 font-semibold' 
                                : 'hover:bg-slate-50 dark:hover:bg-slate-800/70 text-slate-700 dark:text-slate-200'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
                              <span className="text-slate-400 shrink-0">
                                {item.source === 'history' ? (
                                  <Clock className="w-3.5 h-3.5 text-blue-500" />
                                ) : (
                                  <Sparkles className="w-3.5 h-3.5 text-brand-500" />
                                )}
                              </span>
                              <span className="truncate">{item.title}</span>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              {itemCat && (
                                <span 
                                  className="text-[10px] font-medium px-2 py-0.5 rounded-md"
                                  style={{ backgroundColor: `${itemCat.color}15`, color: itemCat.color }}
                                >
                                  {itemCat.name}
                                </span>
                              )}
                              {item.typicalTime && (
                                <span className="text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                                  {item.typicalTime}
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
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

              {/* DROPDOWN BUTTONS TOOLBAR (Recent tab removed) */}
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
                          : 'bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-800'
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
                        : 'bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-800'
                    }`}
                    aria-expanded={activeDropdown === 'category'}
                    aria-haspopup="true"
                  >
                    <IconRenderer name={currentCategory.icon} className="w-3.5 h-3.5" style={{ color: currentCategory.color }} />
                    <span className="whitespace-nowrap">{currentCategory.name}</span>
                    <ChevronDown className={`w-3.5 h-3.5 opacity-60 transition-transform duration-200 ${activeDropdown === 'category' ? 'rotate-180 text-brand-500 opacity-100' : ''}`} />
                  </button>

                  {/* Category Dropdown Menu */}
                  {activeDropdown === 'category' && (
                    <div className="absolute top-full mt-2 left-0 z-40 w-64 max-w-[calc(100vw-2.5rem)] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-2 space-y-1 animate-fade-in max-h-64 overflow-y-auto">
                      <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Select Category
                      </div>
                      {categories.map(cat => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => {
                            setCategoryId(cat.id);
                            setActiveDropdown(null);
                          }}
                          className={`w-full px-2.5 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors ${
                            categoryId === cat.id
                              ? 'bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-300'
                              : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span 
                              className="w-5 h-5 rounded-lg flex items-center justify-center text-white text-[10px]"
                              style={{ backgroundColor: cat.color }}
                            >
                              <IconRenderer name={cat.icon} className="w-3 h-3" />
                            </span>
                            <span>{cat.name}</span>
                          </div>
                          {categoryId === cat.id && <Check className="w-4 h-4 text-brand-500" />}
                        </button>
                      ))}
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
                          ? 'border-amber-400 bg-amber-50/50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300'
                          : 'bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-800'
                    }`}
                    aria-expanded={activeDropdown === 'priority'}
                    aria-haspopup="true"
                  >
                    <Flag className={`w-3.5 h-3.5 ${priorityLabelMap[priority].color}`} />
                    <span className="whitespace-nowrap">{priorityLabelMap[priority].label}</span>
                    <ChevronDown className={`w-3.5 h-3.5 opacity-60 transition-transform duration-200 ${activeDropdown === 'priority' ? 'rotate-180 text-brand-500 opacity-100' : ''}`} />
                  </button>

                  {/* Priority Dropdown Menu */}
                  {activeDropdown === 'priority' && (
                    <div className="absolute top-full mt-2 left-0 z-40 w-48 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-2 space-y-1 animate-fade-in">
                      <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Priority Level
                      </div>
                      {(['none', 'low', 'medium', 'high'] as Priority[]).map(p => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => {
                            setPriority(p);
                            setActiveDropdown(null);
                          }}
                          className={`w-full px-2.5 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors ${
                            priority === p
                              ? 'bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-300'
                              : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span>{priorityLabelMap[p].icon}</span>
                            <span>{priorityLabelMap[p].label}</span>
                          </div>
                          {priority === p && <Check className="w-4 h-4 text-brand-500" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* 4. Recurrence / Repeat Dropdown Button */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => toggleDropdown('repeat')}
                    className={`min-h-[40px] px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all shadow-sm active:scale-95 ${
                      activeDropdown === 'repeat'
                        ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-300 ring-2 ring-brand-500/20'
                        : recurrence
                          ? 'border-brand-300 dark:border-brand-700 bg-brand-50/50 dark:bg-brand-950/30 text-brand-700 dark:text-brand-300'
                          : 'bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-800'
                    }`}
                    aria-expanded={activeDropdown === 'repeat'}
                    aria-haspopup="true"
                  >
                    <Repeat className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    <span className="whitespace-nowrap">{repeatButtonLabel}</span>
                    <ChevronDown className={`w-3.5 h-3.5 opacity-60 transition-transform duration-200 ${activeDropdown === 'repeat' ? 'rotate-180 text-brand-500 opacity-100' : ''}`} />
                  </button>

                  {/* Recurrence Dropdown Menu */}
                  {activeDropdown === 'repeat' && (
                    <div className="absolute top-full mt-2 left-0 z-40 w-52 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-2 space-y-1 animate-fade-in">
                      <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Repeat Schedule
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setRecurrence(undefined);
                          setActiveDropdown(null);
                        }}
                        className={`w-full px-2.5 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors ${
                          !recurrence
                            ? 'bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-300'
                            : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
                        }`}
                      >
                        <span>No Repeat (One-off)</span>
                        {!recurrence && <Check className="w-4 h-4 text-brand-500" />}
                      </button>
                      {(['daily', 'weekdays', 'weekends', 'weekly', 'monthly'] as const).map(freq => (
                        <button
                          key={freq}
                          type="button"
                          onClick={() => {
                            setRecurrence({ frequency: freq, interval: 1 });
                            setActiveDropdown(null);
                          }}
                          className={`w-full px-2.5 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors ${
                            recurrence?.frequency === freq
                              ? 'bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-300'
                              : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
                          }`}
                        >
                          <span>{recurrenceLabelMap[freq]}</span>
                          {recurrence?.frequency === freq && <Check className="w-4 h-4 text-brand-500" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* 5. Preset Templates Dropdown Button */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => toggleDropdown('template')}
                    className={`min-h-[40px] px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all shadow-sm active:scale-95 ${
                      activeDropdown === 'template'
                        ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-300 ring-2 ring-brand-500/20'
                        : 'bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-800'
                    }`}
                    aria-expanded={activeDropdown === 'template'}
                    aria-haspopup="true"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span className="whitespace-nowrap">Presets</span>
                    <ChevronDown className={`w-3.5 h-3.5 opacity-60 transition-transform duration-200 ${activeDropdown === 'template' ? 'rotate-180 text-brand-500 opacity-100' : ''}`} />
                  </button>

                  {/* Templates Dropdown Menu */}
                  {activeDropdown === 'template' && (
                    <div className="absolute top-full mt-2 left-0 sm:left-auto sm:right-0 z-40 w-72 max-w-[calc(100vw-2.5rem)] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-2.5 space-y-2 animate-fade-in">
                      <div className="px-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Quick Task Templates
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
              </div>

              {/* Subtasks Section with Voice Function */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ListChecks className="w-4 h-4 text-brand-500" />
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                      Checklist / Subtasks ({subtasks.length})
                    </label>
                  </div>
                  {subtasks.length > 0 && (
                    <span className="text-[11px] text-slate-400 font-medium">
                      {subtasks.filter(s => s.completed).length}/{subtasks.length} done
                    </span>
                  )}
                </div>

                {/* Subtask list */}
                {subtasks.length > 0 && (
                  <div className="space-y-1.5 max-h-44 overflow-y-auto no-scrollbar">
                    {subtasks.map((st, i) => (
                      <div key={st.id} className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/60 px-3 py-2 rounded-xl border border-slate-200/70 dark:border-slate-700/60">
                        <span className="text-[11px] text-slate-400 font-mono">{i + 1}.</span>
                        <span className="text-xs text-slate-800 dark:text-slate-200 flex-1 break-words">{st.title}</span>
                        <button
                          type="button"
                          onClick={() => setSubtasks(subtasks.filter(item => item.id !== st.id))}
                          className="text-slate-400 hover:text-rose-500 p-1 transition-colors"
                          title="Delete subtask"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Subtask Input with Voice Button */}
                <div className="space-y-1.5">
                  <div className="flex gap-2 items-center">
                    <div className="relative flex-1">
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
                        placeholder={isSubtaskListening ? '🎙️ Listening... speak subtask' : 'Add subtask item and press enter...'}
                        className={`w-full bg-slate-50 dark:bg-slate-800 border rounded-xl pl-3.5 pr-10 py-2.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none transition-all ${
                          isSubtaskListening
                            ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/30 dark:bg-rose-950/30 font-medium'
                            : 'border-slate-200 dark:border-slate-700 focus:ring-1 focus:ring-brand-500'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={isSubtaskListening ? stopSubtaskVoice : startSubtaskVoice}
                        title={isSubtaskListening ? 'Stop listening' : 'Voice input for subtask'}
                        aria-label={isSubtaskListening ? 'Stop subtask voice input' : 'Voice input for subtask'}
                        className={`absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                          isSubtaskListening
                            ? 'bg-rose-500 text-white animate-pulse shadow-md shadow-rose-500/30'
                            : 'text-slate-400 hover:text-brand-500 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        <Mic className={`w-3.5 h-3.5 ${isSubtaskListening ? 'animate-bounce' : ''}`} />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddSubtask}
                      disabled={!newSubtaskText.trim()}
                      className="px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-brand-600 dark:hover:bg-brand-500 disabled:opacity-40 text-white text-xs font-semibold shadow-sm transition-all"
                      title="Add subtask"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  {subtaskVoiceError && (
                    <p className="text-[11px] text-rose-500 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {subtaskVoiceError}
                    </p>
                  )}
                </div>
              </div>

              {/* Optional Notes Input */}
              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Notes & Details (Optional)
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Add extra details, notes, links, or instructions..."
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 resize-none transition-all shadow-sm"
                />
              </div>

            </div>
          </div>

          {/* Bottom Actions Bar */}
          <div className="border-t border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 px-4 sm:px-8 py-3.5 pb-[calc(0.875rem+env(safe-area-inset-bottom,0px))] shrink-0">
            <div className="max-w-2xl mx-auto w-full flex items-center justify-between">
              <span className="hidden sm:inline-block text-[11px] text-slate-400 font-medium">
                Press <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-mono border border-slate-200 dark:border-slate-700">↵ Enter</kbd> to save • <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-mono border border-slate-200 dark:border-slate-700">ESC</kbd> to close
              </span>
              <div className="flex items-center gap-2.5 ml-auto">
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
          </div>
        </form>
      </div>

      {/* Voice input modal for main task */}
      <VoiceInputModal
        isOpen={isVoiceOpen}
        onClose={() => setIsVoiceOpen(false)}
        onSave={handleVoiceSave}
        onEdit={handleVoiceEdit}
      />
    </>
  );
};
