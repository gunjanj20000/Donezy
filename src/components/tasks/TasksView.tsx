import React, { useMemo } from 'react';
import { 
  Filter, 
  Search, 
  Plus, 
  CheckCircle2, 
  AlertCircle, 
  Calendar as CalendarIcon, 
  Star, 
  Repeat 
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { TaskCard } from './TaskCard';
import { TaskFilterType } from '../../types';
import { isTaskOverdue, formatDateLabel } from '../../utils/dateUtils';
import { format, isAfter, parseISO } from 'date-fns';

export const TasksView: React.FC = () => {
  const { 
    tasks, 
    filter, 
    setFilter, 
    searchQuery, 
    setSearchQuery, 
    categories, 
    selectedCategoryFilter, 
    setSelectedCategoryFilter,
    openQuickAdd 
  } = useApp();

  const todayStr = format(new Date(), 'yyyy-MM-dd');

  // Filter tasks
  const filteredTasks = useMemo(() => {
    let result = [...tasks];

    // Filter by category
    if (selectedCategoryFilter) {
      result = result.filter(t => t.categoryId === selectedCategoryFilter);
    }

    // Filter by type
    switch (filter) {
      case 'today':
        result = result.filter(t => t.dueDate === todayStr && !t.completed);
        break;
      case 'important':
        result = result.filter(t => t.priority === 'high' && !t.completed);
        break;
      case 'overdue':
        result = result.filter(t => isTaskOverdue(t.dueDate, t.dueTime) && !t.completed);
        break;
      case 'upcoming':
        result = result.filter(t => isAfter(parseISO(t.dueDate), parseISO(todayStr)) && !t.completed);
        break;
      case 'recurring':
        result = result.filter(t => Boolean(t.recurrence));
        break;
      case 'completed':
        result = result.filter(t => t.completed);
        break;
      case 'all':
      default:
        // Show pending tasks first, completed at bottom
        break;
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(t =>
        t.title.toLowerCase().includes(q) ||
        t.notes?.toLowerCase().includes(q) ||
        t.tags?.some(tag => tag.toLowerCase().includes(q))
      );
    }

    // Sort: incomplete first, then by date, then by priority
    return result.sort((a, b) => {
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }
      if (a.dueDate !== b.dueDate) {
        return a.dueDate.localeCompare(b.dueDate);
      }
      return (a.dueTime || '').localeCompare(b.dueTime || '');
    });
  }, [tasks, filter, selectedCategoryFilter, searchQuery, todayStr]);

  const filterButtons: { id: TaskFilterType; label: string; icon: React.ReactNode }[] = [
    { id: 'all', label: 'All', icon: <Filter className="w-3.5 h-3.5" /> },
    { id: 'today', label: 'Today', icon: <CalendarIcon className="w-3.5 h-3.5" /> },
    { id: 'important', label: 'Important', icon: <Star className="w-3.5 h-3.5 text-amber-500" /> },
    { id: 'overdue', label: 'Overdue', icon: <AlertCircle className="w-3.5 h-3.5 text-rose-500" /> },
    { id: 'upcoming', label: 'Upcoming', icon: <CalendarIcon className="w-3.5 h-3.5" /> },
    { id: 'recurring', label: 'Recurring', icon: <Repeat className="w-3.5 h-3.5 text-brand-500" /> },
    { id: 'completed', label: 'Completed', icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> },
  ];

  return (
    <div className="space-y-5 max-w-4xl mx-auto pb-24 sm:pb-8">
      {/* Search & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            All Tasks
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {filteredTasks.length} {filteredTasks.length === 1 ? 'task found' : 'tasks found'}
          </p>
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search tasks, notes, #tags..."
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-sm"
          />
        </div>
      </div>

      {/* Filter Tabs Horizontal Scroll */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {filterButtons.map(btn => (
          <button
            key={btn.id}
            onClick={() => setFilter(btn.id)}
            className={`min-h-[44px] px-3.5 py-2 rounded-2xl text-xs font-semibold flex items-center gap-1.5 shrink-0 border transition-all ${
              filter === btn.id
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent shadow-sm'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300'
            }`}
          >
            {btn.icon}
            <span>{btn.label}</span>
          </button>
        ))}
      </div>

      {/* Categories Filter Strip */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        <button
          onClick={() => setSelectedCategoryFilter(null)}
          className={`min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 border transition-colors ${
            selectedCategoryFilter === null
              ? 'bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 border-brand-200 dark:border-brand-800'
              : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
          }`}
        >
          All Categories
        </button>
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategoryFilter(cat.id === selectedCategoryFilter ? null : cat.id)}
            className={`min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 border transition-colors ${
              selectedCategoryFilter === cat.id
                ? 'text-white border-transparent'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800'
            }`}
            style={{
              backgroundColor: selectedCategoryFilter === cat.id ? cat.color : undefined
            }}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Tasks List */}
      {filteredTasks.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-10 text-center flex flex-col items-center justify-center shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mb-3">
            <Filter className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-1">
            No matching tasks
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Try adjusting your search terms or filters.
          </p>
          <button
            onClick={() => openQuickAdd()}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-brand-600 text-white text-xs font-bold"
          >
            Create Task
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredTasks.map(task => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      )}
    </div>
  );
};
