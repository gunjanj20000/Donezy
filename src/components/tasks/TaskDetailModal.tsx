import React, { useState, useEffect } from 'react';
import { 
  X, 
  Trash2, 
  Check, 
  Calendar as CalendarIcon, 
  Clock, 
  Bell, 
  Repeat, 
  Tag as TagIcon, 
  MapPin, 
  AlignLeft, 
  Plus, 
  CheckSquare, 
  Square 
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Task, Priority, TaskRecurrence } from '../../types';

const TASK_PALETTE = [
  '#6366f1', '#3b82f6', '#06b6d4', '#10b981', '#84cc16',
  '#f59e0b', '#f97316', '#f43f5e', '#ec4899', '#8b5cf6'
];

export const TaskDetailModal: React.FC = () => {
  const { selectedTaskForEdit, setSelectedTaskForEdit, updateTask, deleteTask, categories } = useApp();

  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState<string | undefined>(undefined);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [priority, setPriority] = useState<Priority>('none');
  const [categoryId, setCategoryId] = useState('personal');
  const [color, setColor] = useState<string | undefined>(undefined);
  const [recurrence, setRecurrence] = useState<TaskRecurrence | undefined>(undefined);
  const [notes, setNotes] = useState('');
  const [location, setLocation] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [subtasks, setSubtasks] = useState<{ id: string; title: string; completed: boolean }[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  useEffect(() => {
    if (selectedTaskForEdit) {
      setTitle(selectedTaskForEdit.title);
      setDueDate(selectedTaskForEdit.dueDate);
      setDueTime(selectedTaskForEdit.dueTime);
      setReminderEnabled(Boolean(selectedTaskForEdit.reminder?.enabled));
      setPriority(selectedTaskForEdit.priority);
      setCategoryId(selectedTaskForEdit.categoryId || 'personal');
      setColor(selectedTaskForEdit.color);
      setRecurrence(selectedTaskForEdit.recurrence);
      setNotes(selectedTaskForEdit.notes || '');
      setLocation(selectedTaskForEdit.location || '');
      setTags(selectedTaskForEdit.tags || []);
      setSubtasks(selectedTaskForEdit.subtasks || []);
    }
  }, [selectedTaskForEdit]);

  if (!selectedTaskForEdit) return null;

  const handleSave = async () => {
    const updated: Task = {
      ...selectedTaskForEdit,
      title: title.trim() || 'Untitled Task',
      dueDate,
      dueTime,
      reminder: reminderEnabled ? { enabled: true, time: dueTime } : undefined,
      priority,
      categoryId,
      color: color || undefined,
      recurrence,
      notes: notes.trim(),
      location: location.trim(),
      tags,
      subtasks,
    };

    await updateTask(updated);
    setSelectedTaskForEdit(null);
  };

  const handleDelete = async () => {
    await deleteTask(selectedTaskForEdit.id);
    setSelectedTaskForEdit(null);
  };

  const handleAddSubtask = () => {
    if (!newSubtaskTitle.trim()) return;
    setSubtasks(prev => [
      ...prev,
      { id: `sub-${Date.now()}`, title: newSubtaskTitle.trim(), completed: false }
    ]);
    setNewSubtaskTitle('');
  };

  const toggleSubtask = (id: string) => {
    setSubtasks(prev =>
      prev.map(s => (s.id === id ? { ...s, completed: !s.completed } : s))
    );
  };

  const handleAddTag = () => {
    if (!tagInput.trim()) return;
    const clean = tagInput.trim().replace(/^#/, '');
    if (!tags.includes(clean)) {
      setTags([...tags, clean]);
    }
    setTagInput('');
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
      onClick={() => setSelectedTaskForEdit(null)}
    >
      <div 
        onClick={e => e.stopPropagation()}
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[85vh] overflow-hidden animate-scale-in"
        role="dialog"
        aria-modal="true"
        aria-label="Edit Task"
      >
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
            Task Details
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={handleDelete}
              aria-label="Delete task"
              className="w-9 h-9 flex items-center justify-center rounded-full text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setSelectedTaskForEdit(null)}
              aria-label="Close"
              className="w-9 h-9 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Title */}
          <div>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Task Title"
              className="w-full text-lg font-bold text-slate-900 dark:text-white bg-transparent border-b border-slate-200 dark:border-slate-700 pb-2 focus:outline-none focus:border-brand-500"
            />
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Time
              </label>
              <input
                type="time"
                value={dueTime || ''}
                onChange={e => setDueTime(e.target.value || undefined)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          {/* Priority */}
          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
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

          {/* Category */}
          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
              Category
            </label>
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
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Color Highlight Palette */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Task Color Highlight
              </label>
              {color && (
                <button
                  type="button"
                  onClick={() => setColor(undefined)}
                  className="text-[10px] text-slate-400 hover:text-rose-500 font-semibold"
                >
                  Reset to category color
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5 items-center">
              {TASK_PALETTE.map(col => (
                <button
                  key={col}
                  type="button"
                  onClick={() => setColor(col)}
                  className={`w-6 h-6 rounded-full transition-transform ${
                    color?.toLowerCase() === col.toLowerCase()
                      ? 'ring-2 ring-offset-2 ring-brand-500 scale-110 shadow-sm'
                      : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: col }}
                />
              ))}
              <input
                type="color"
                value={color || '#6366f1'}
                onChange={e => setColor(e.target.value)}
                className="w-6 h-6 rounded-full border border-slate-300 dark:border-slate-600 cursor-pointer p-0 bg-transparent overflow-hidden"
                title="Custom Color"
              />
            </div>
          </div>

          {/* Recurrence */}
          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
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

          {/* Reminder Toggle */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-brand-500" />
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Reminder Notification
              </span>
            </div>
            <input
              type="checkbox"
              checked={reminderEnabled}
              onChange={e => setReminderEnabled(e.target.checked)}
              className="w-5 h-5 rounded text-brand-600 focus:ring-brand-500"
            />
          </div>

          {/* Subtasks */}
          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
              Subtasks ({subtasks.filter(s => s.completed).length}/{subtasks.length})
            </label>
            <div className="space-y-1.5 mb-2">
              {subtasks.map(st => (
                <div 
                  key={st.id} 
                  className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700"
                >
                  <button
                    type="button"
                    onClick={() => toggleSubtask(st.id)}
                    className="text-slate-400 hover:text-emerald-500"
                  >
                    {st.completed ? (
                      <CheckSquare className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                  <span className={`text-xs flex-1 ${st.completed ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-200'}`}>
                    {st.title}
                  </span>
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
                value={newSubtaskTitle}
                onChange={e => setNewSubtaskTitle(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSubtask();
                  }
                }}
                placeholder="Add subtask..."
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

          {/* Notes */}
          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Notes
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Add extra notes..."
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
            />
          </div>

          {/* Location & Tags */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Location
              </label>
              <input
                type="text"
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="e.g. Office, Market"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Tags
              </label>
              <div className="flex gap-1">
                <input
                  type="text"
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  placeholder="tag + Enter"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
                />
              </div>
            </div>
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {tags.map(tag => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => setTags(tags.filter(t => t !== tag))}
                    className="hover:text-rose-500"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2 bg-slate-50 dark:bg-slate-900">
          <button
            type="button"
            onClick={() => setSelectedTaskForEdit(null)}
            className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="min-h-[44px] px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-md shadow-brand-500/20 active:scale-95 transition-all"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};
