import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Mic, 
  Send, 
  Sparkles, 
  Calendar as CalendarIcon, 
  Clock, 
  ChevronDown, 
  ChevronUp, 
  Plus, 
  Check, 
  Trash2,
  Tag,
  Repeat
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { NaturalLanguageParser, ParsedTaskResult } from '../../services/NaturalLanguageParser';
import { getSmartTimePresets, formatDateLabel } from '../../utils/dateUtils';
import { HistoryRepository } from '../../repositories/HistoryRepository';
import { Priority, TaskRecurrence, TaskHistoryItem } from '../../types';
import { VoiceInputModal } from '../voice/VoiceInputModal';
import { format } from 'date-fns';

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

  const [showMoreDetails, setShowMoreDetails] = useState(false);
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [historySuggestions, setHistorySuggestions] = useState<TaskHistoryItem[]>([]);
  const [detectedChips, setDetectedChips] = useState<ParsedTaskResult['detectedChips']>([]);

  const inputRef = useRef<HTMLInputElement>(null);
  const timePresets = getSmartTimePresets();

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
      setShowMoreDetails(false);

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

  const applyTimePreset = (preset: typeof timePresets[0]) => {
    setSelectedDate(preset.date);
    setSelectedTime(preset.time);
    if (preset.time) {
      setReminderEnabled(true);
    }
  };

  const applyPresetClick = (preset: typeof QUICK_PRESETS[0]) => {
    setInput(preset.prefix);
    setCategoryId(preset.defaultCategory);
    inputRef.current?.focus();
  };

  const applySuggestion = (item: TaskHistoryItem) => {
    setInput(item.title);
    if (item.categoryId) setCategoryId(item.categoryId);
    if (item.typicalTime) {
      setSelectedTime(item.typicalTime);
      setReminderEnabled(true);
    }
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

  if (!isQuickAddOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
        onClick={closeQuickAdd}
      >
        <div 
          onClick={e => e.stopPropagation()}
          className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh] overflow-hidden animate-slide-up"
          role="dialog"
          aria-modal="true"
          aria-label="Quick Add Task"
        >
          {/* Header */}
          <div className="px-5 pt-4 pb-2 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
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
              className="w-9 h-9 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 py-3 space-y-4">
            {/* Primary Input Container */}
            <div className="relative flex items-center bg-slate-50 dark:bg-slate-800/60 rounded-2xl border-2 border-brand-500/20 focus-within:border-brand-500 focus-within:ring-4 focus-within:ring-brand-500/10 transition-all p-1">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => handleInputChange(e.target.value)}
                placeholder="What do you need to do? (e.g. Call electrician tomorrow at 10 AM)"
                className="w-full bg-transparent px-3 py-3 text-base text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
              />

              {/* Voice button inside input */}
              <button
                type="button"
                onClick={() => setIsVoiceOpen(true)}
                title="Voice Input"
                className="w-10 h-10 shrink-0 flex items-center justify-center rounded-xl bg-gradient-to-tr from-brand-500 to-indigo-600 text-white hover:from-brand-600 hover:to-indigo-700 shadow-md shadow-brand-500/20 active:scale-95 transition-all mr-1"
              >
                <Mic className="w-5 h-5" />
              </button>
            </div>

            {/* Smart Parsed Chips Feedback */}
            {detectedChips.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 mr-1">
                  Interpreted:
                </span>
                {detectedChips.map((chip, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800/80 animate-scale-in"
                  >
                    {chip.label}
                  </span>
                ))}
              </div>
            )}

            {/* Smart History Suggestions if available */}
            {historySuggestions.length > 0 && !input.trim().includes(' ') && (
              <div className="space-y-1">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Recent & Suggested:
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {historySuggestions.map(s => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => applySuggestion(s)}
                      className="text-xs font-medium px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-brand-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors"
                    >
                      {s.title}
                      {s.typicalTime && <span className="ml-1 text-slate-400">({s.typicalTime})</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Smart Time Presets (WHEN?) */}
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center justify-between">
                <span>WHEN?</span>
                <span className="text-brand-600 dark:text-brand-400 font-medium">
                  {formatDateLabel(selectedDate)} {selectedTime ? `at ${selectedTime}` : ''}
                </span>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                {timePresets.map(preset => {
                  const isSelected = selectedDate === preset.date && selectedTime === preset.time;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => applyTimePreset(preset)}
                      className={`min-h-[44px] px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-all border shrink-0 ${
                        isSelected
                          ? 'bg-brand-600 text-white border-brand-600 shadow-sm shadow-brand-500/30'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-brand-300'
                      }`}
                    >
                      <span>{preset.label}</span>
                      <span className={`text-[10px] ${isSelected ? 'text-brand-100' : 'text-slate-400'}`}>
                        {preset.description}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick Task Presets (1-tap categories & templates) */}
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                QUICK TEMPLATES
              </div>
              <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {QUICK_PRESETS.map(preset => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => applyPresetClick(preset)}
                    className="min-h-[44px] px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 flex items-center gap-1 shrink-0 transition-colors"
                  >
                    <span>{preset.icon}</span>
                    <span>{preset.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Category Selector Chips */}
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                CATEGORY
              </div>
              <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategoryId(cat.id)}
                    className={`min-h-[44px] px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 shrink-0 border transition-all ${
                      categoryId === cat.id
                        ? 'border-transparent text-white shadow-sm'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                    style={{
                      backgroundColor: categoryId === cat.id ? cat.color : undefined
                    }}
                  >
                    <Tag className="w-3 h-3" />
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Progressive Disclosure Toggle */}
            <button
              type="button"
              onClick={() => setShowMoreDetails(!showMoreDetails)}
              className="w-full flex items-center justify-between py-2 text-xs font-bold text-slate-500 hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-400 transition-colors"
            >
              <span>{showMoreDetails ? 'Hide Details' : 'More Details (Priority, Recurrence, Notes, Subtasks)'}</span>
              {showMoreDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {/* More Details Collapsible */}
            {showMoreDetails && (
              <div className="space-y-4 pt-1 border-t border-slate-100 dark:border-slate-800 animate-fade-in">
                {/* Custom Date & Time Inputs */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Due Date
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        value={selectedDate}
                        onChange={e => setSelectedDate(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Due Time
                    </label>
                    <div className="relative">
                      <input
                        type="time"
                        value={selectedTime || ''}
                        onChange={e => {
                          setSelectedTime(e.target.value || undefined);
                          if (e.target.value) setReminderEnabled(true);
                        }}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Priority Selection */}
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                    Priority
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {(['none', 'low', 'medium', 'high'] as Priority[]).map(p => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPriority(p)}
                        className={`min-h-[44px] px-2 py-2 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1 transition-all ${
                          priority === p
                            ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent shadow-sm'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {p === 'high' && '🔴 High'}
                        {p === 'medium' && '🟡 Med'}
                        {p === 'low' && '🟢 Low'}
                        {p === 'none' && 'None'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Recurrence Selection */}
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                    Repeat
                  </label>
                  <div className="flex gap-1.5 flex-wrap">
                    {[
                      { id: undefined, label: 'Never' },
                      { id: 'daily', label: 'Daily' },
                      { id: 'weekdays', label: 'Weekdays' },
                      { id: 'weekends', label: 'Weekends' },
                      { id: 'weekly', label: 'Weekly' },
                      { id: 'monthly', label: 'Monthly' },
                      { id: 'yearly', label: 'Yearly' },
                    ].map(rec => (
                      <button
                        key={rec.label}
                        type="button"
                        onClick={() => setRecurrence(rec.id ? { frequency: rec.id as TaskRecurrence['frequency'] } : undefined)}
                        className={`min-h-[44px] px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                          recurrence?.frequency === rec.id || (!recurrence && !rec.id)
                            ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {rec.id && <Repeat className="w-3 h-3 inline mr-1" />}
                        {rec.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Notes Input */}
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Notes
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Add details, instructions or link..."
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                  />
                </div>

                {/* Subtasks List */}
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                    Subtasks ({subtasks.length})
                  </label>
                  <div className="space-y-1.5 mb-2">
                    {subtasks.map((st, i) => (
                      <div key={st.id} className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                        <span className="text-xs text-slate-500 font-mono">{i + 1}.</span>
                        <span className="text-xs text-slate-800 dark:text-slate-200 flex-1">{st.title}</span>
                        <button
                          type="button"
                          onClick={() => setSubtasks(subtasks.filter(item => item.id !== st.id))}
                          className="text-slate-400 hover:text-rose-500"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
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
                      placeholder="Add subtask and press enter..."
                      className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleAddSubtask}
                      className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-300 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Bottom Actions */}
            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={closeQuickAdd}
                className="min-h-[48px] px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!input.trim()}
                className="min-h-[48px] px-6 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-semibold text-sm flex items-center gap-2 shadow-lg shadow-brand-500/25 disabled:opacity-40 transition-all active:scale-95"
              >
                <span>Create Task</span>
                <Send className="w-4 h-4" />
              </button>
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
