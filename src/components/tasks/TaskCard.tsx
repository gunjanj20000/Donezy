import React, { useState, useRef } from 'react';
import { 
  Check, 
  Clock, 
  Repeat, 
  Trash2, 
  Edit3, 
  Bell, 
  MapPin, 
  CheckSquare,
  Square,
  AlertCircle,
  Plus,
  Mic,
  ChevronDown,
  ChevronUp,
  ListChecks,
  X
} from 'lucide-react';
import { Task } from '../../types';
import { useApp } from '../../context/AppContext';
import { formatTimeDisplay, isTaskOverdue, isTaskDueNow, formatDateLabel } from '../../utils/dateUtils';
import { IconRenderer } from '../common/IconRenderer';
import { useSpeechRecognition } from '../../utils/useSpeechRecognition';

interface TaskCardProps {
  task: Task;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task }) => {
  const { categories, toggleTaskComplete, updateTask, deleteTask, setSelectedTaskForEdit, settings } = useApp();
  const category = categories.find(c => c.id === task.categoryId);

  // Swipe handling
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [swipeOffset, setSwipeOffset] = useState<number>(0);
  const cardRef = useRef<HTMLDivElement>(null);

  // Subtask UI state on card
  const [showAllSubtasks, setShowAllSubtasks] = useState(false);
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);
  const [cardSubtaskInput, setCardSubtaskInput] = useState('');

  // Subtask voice recognition hook for card
  const {
    isListening: isCardSubtaskListening,
    start: startCardSubtaskVoice,
    stop: stopCardSubtaskVoice,
  } = useSpeechRecognition({
    onResult: (text) => {
      setCardSubtaskInput(text);
    },
    onEnd: (text) => {
      if (text?.trim()) {
        setCardSubtaskInput(text.trim());
      }
    },
  });

  const isOverdue = !task.completed && isTaskOverdue(task.dueDate, task.dueTime);
  const isDueNow = !task.completed && isTaskDueNow(task.dueDate, task.dueTime);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const currentX = e.touches[0].clientX;
    const diff = currentX - touchStartX;
    // Limit swipe offset
    if (Math.abs(diff) < 120) {
      setSwipeOffset(diff);
    }
  };

  const handleTouchEnd = () => {
    if (swipeOffset > 70) {
      // Swiped right -> complete
      toggleTaskComplete(task.id);
    } else if (swipeOffset < -70) {
      // Swiped left -> open edit or delete
      setSelectedTaskForEdit(task);
    }
    setSwipeOffset(0);
    setTouchStartX(null);
  };

  const handleToggleSubtask = async (e: React.MouseEvent, subtaskId: string) => {
    e.stopPropagation();
    const updatedSubtasks = (task.subtasks || []).map(s => 
      s.id === subtaskId ? { ...s, completed: !s.completed } : s
    );
    await updateTask({
      ...task,
      subtasks: updatedSubtasks,
    });
  };

  const handleAddSubtaskOnCard = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!cardSubtaskInput.trim()) return;

    const newSub = {
      id: `sub-${Date.now()}`,
      title: cardSubtaskInput.trim(),
      completed: false,
    };

    await updateTask({
      ...task,
      subtasks: [...(task.subtasks || []), newSub],
    });

    setCardSubtaskInput('');
    setIsAddingSubtask(false);
  };

  const completedSubtasksCount = (task.subtasks || []).filter(s => s.completed).length;

  const priorityColor = {
    high: 'text-rose-500 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900',
    medium: 'text-amber-500 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900',
    low: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900',
    none: 'text-slate-400 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
  }[task.priority];

  return (
    <div
      ref={cardRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        transform: `translateX(${swipeOffset}px)`,
        transition: swipeOffset === 0 ? 'transform 0.25s ease-out' : 'none'
      }}
      className={`group relative bg-white dark:bg-slate-900 rounded-2xl border transition-all duration-200 shadow-sm hover:shadow-md ${
        task.completed 
          ? 'border-slate-200/60 dark:border-slate-800/60 opacity-60 bg-slate-50/50 dark:bg-slate-900/50' 
          : isOverdue 
            ? 'border-rose-200 dark:border-rose-900/60' 
            : 'border-slate-200 dark:border-slate-800'
      } overflow-hidden`}
    >
      {/* Category accent left bar */}
      <div 
        className="absolute left-0 top-0 bottom-0 w-1.5 transition-colors"
        style={{ backgroundColor: task.color || category?.color || 'rgb(var(--brand-500))' }}
      />

      <div className="pl-4 pr-3 py-3.5 flex items-start gap-3">
        {/* Checkbox Touch Target >= 44x44px */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleTaskComplete(task.id);
          }}
          aria-label={task.completed ? 'Mark task as incomplete' : 'Mark task as complete'}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center -ml-1 -mt-1 rounded-xl text-slate-400 hover:text-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-transform active:scale-95"
        >
          <div
            className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-200 ${
              task.completed
                ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm shadow-emerald-500/30'
                : 'border-slate-300 dark:border-slate-600 group-hover:border-brand-500'
            }`}
          >
            {task.completed && <Check className="w-4 h-4 stroke-[3] animate-scale-in" />}
          </div>
        </button>

        {/* Task Details - Tap to view & edit */}
        <div 
          onClick={() => setSelectedTaskForEdit(task)}
          className="flex-1 min-w-0 cursor-pointer pt-0.5 select-none"
        >
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3
              className={`text-base font-semibold leading-snug break-words transition-colors ${
                task.completed
                  ? 'line-through text-slate-400 dark:text-slate-500'
                  : 'text-slate-800 dark:text-slate-100'
              }`}
            >
              {task.title}
            </h3>

            {/* Recurrence Indicator */}
            {task.recurrence && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/60 px-2 py-0.5 rounded-full border border-brand-200/50 dark:border-brand-800/50">
                <Repeat className="w-3 h-3" />
                {task.recurrence.frequency}
              </span>
            )}

            {/* Priority Indicator */}
            {task.priority !== 'none' && (
              <span className={`inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${priorityColor}`}>
                {task.priority === 'high' ? '🔴 High' : task.priority === 'medium' ? '🟡 Med' : '🟢 Low'}
              </span>
            )}
          </div>

          {/* Description/Notes Preview */}
          {task.notes && (
            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mb-2">
              {task.notes}
            </p>
          )}

          {/* Metadata Chips: Time, Category, Date, Subtasks */}
          <div className="flex items-center gap-2 flex-wrap text-xs text-slate-500 dark:text-slate-400 pt-0.5">
            {/* Category badge */}
            {category && (
              <span 
                className="inline-flex items-center gap-1 font-medium px-2 py-0.5 rounded-md text-[11px]"
                style={{ 
                  backgroundColor: `${category.color}15`, 
                  color: category.color 
                }}
              >
                <IconRenderer name={category.icon} className="w-3 h-3" />
                {category.name}
              </span>
            )}

            {/* Due Time / Overdue status */}
            {task.dueTime && (
              <span 
                className={`inline-flex items-center gap-1 font-medium px-2 py-0.5 rounded-md text-[11px] ${
                  isOverdue
                    ? 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60'
                    : isDueNow
                      ? 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 font-semibold animate-pulse-subtle'
                      : 'text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800'
                }`}
              >
                {isOverdue ? <AlertCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                {formatTimeDisplay(task.dueTime, settings.timeFormat === '12h')}
                {isOverdue && ' · Overdue'}
                {isDueNow && ' · Due Now'}
              </span>
            )}

            {/* Date if not today */}
            {formatDateLabel(task.dueDate) !== 'Today' && (
              <span className="inline-flex items-center text-[11px] text-slate-500 dark:text-slate-400">
                {formatDateLabel(task.dueDate)}
              </span>
            )}

            {/* Reminder enabled icon */}
            {task.reminder?.enabled && (
              <span className="text-brand-500" title="Reminder Active">
                <Bell className="w-3 h-3" />
              </span>
            )}

            {/* Location */}
            {task.location && (
              <span className="inline-flex items-center gap-0.5 text-[11px] text-slate-400">
                <MapPin className="w-3 h-3" />
                {task.location}
              </span>
            )}
          </div>

          {/* Subtasks Section on Main Page */}
          {((task.subtasks && task.subtasks.length > 0) || isAddingSubtask) && (
            <div 
              onClick={e => e.stopPropagation()} 
              className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 space-y-1.5 cursor-default"
            >
              {/* Subtask Header & Progress */}
              {task.subtasks && task.subtasks.length > 0 && (
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  <div className="flex items-center gap-1.5">
                    <ListChecks className="w-3.5 h-3.5 text-brand-500" />
                    <span>Subtasks ({completedSubtasksCount}/{task.subtasks.length})</span>
                  </div>
                  {/* Progress bar */}
                  <div className="w-16 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500 transition-all duration-300"
                      style={{ width: `${(completedSubtasksCount / task.subtasks.length) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Subtask Items */}
              {task.subtasks && task.subtasks.length > 0 && (
                <div className="space-y-1">
                  {(showAllSubtasks ? task.subtasks : task.subtasks.slice(0, 3)).map(st => (
                    <div
                      key={st.id}
                      onClick={(e) => handleToggleSubtask(e, st.id)}
                      className={`group/st flex items-center gap-2 px-2 py-1 rounded-lg transition-colors cursor-pointer ${
                        st.completed
                          ? 'text-slate-400 dark:text-slate-500 hover:bg-slate-100/60 dark:hover:bg-slate-800/40'
                          : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={(e) => handleToggleSubtask(e, st.id)}
                        aria-label={st.completed ? `Mark subtask "${st.title}" incomplete` : `Mark subtask "${st.title}" complete`}
                        className="text-slate-400 hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors shrink-0 p-0.5"
                      >
                        {st.completed ? (
                          <CheckSquare className="w-3.5 h-3.5 text-emerald-500 fill-emerald-500/10" />
                        ) : (
                          <Square className="w-3.5 h-3.5 text-slate-400 group-hover/st:text-slate-600 dark:group-hover/st:text-slate-300" />
                        )}
                      </button>
                      <span className={`text-xs break-words transition-colors ${st.completed ? 'line-through text-slate-400 dark:text-slate-500' : ''}`}>
                        {st.title}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Show more/less toggle button if > 3 subtasks */}
              {task.subtasks && task.subtasks.length > 3 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowAllSubtasks(prev => !prev);
                  }}
                  className="text-[11px] font-semibold text-brand-600 dark:text-brand-400 hover:underline px-2 py-0.5 flex items-center gap-1"
                >
                  {showAllSubtasks ? (
                    <>
                      <span>Show less</span>
                      <ChevronUp className="w-3 h-3" />
                    </>
                  ) : (
                    <>
                      <span>+{task.subtasks.length - 3} more subtasks</span>
                      <ChevronDown className="w-3 h-3" />
                    </>
                  )}
                </button>
              )}

              {/* Add subtask inline on card */}
              {isAddingSubtask ? (
                <div className="pt-1 flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={cardSubtaskInput}
                      onChange={e => setCardSubtaskInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddSubtaskOnCard(e);
                        } else if (e.key === 'Escape') {
                          e.preventDefault();
                          setIsAddingSubtask(false);
                          setCardSubtaskInput('');
                        }
                      }}
                      autoFocus
                      placeholder={isCardSubtaskListening ? '🎙️ Listening... speak subtask' : 'New subtask...'}
                      className={`w-full bg-slate-50 dark:bg-slate-800 border rounded-lg pl-2.5 pr-8 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none transition-all ${
                        isCardSubtaskListening
                          ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/30'
                          : 'border-slate-200 dark:border-slate-700 focus:ring-1 focus:ring-brand-500'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={isCardSubtaskListening ? stopCardSubtaskVoice : startCardSubtaskVoice}
                      title={isCardSubtaskListening ? 'Stop listening' : 'Voice input for subtask'}
                      className={`absolute right-1 top-1/2 -translate-y-1/2 w-6 h-6 rounded flex items-center justify-center transition-all ${
                        isCardSubtaskListening
                          ? 'bg-rose-500 text-white animate-pulse'
                          : 'text-slate-400 hover:text-brand-500'
                      }`}
                    >
                      <Mic className={`w-3 h-3 ${isCardSubtaskListening ? 'animate-bounce' : ''}`} />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddSubtaskOnCard}
                    disabled={!cardSubtaskInput.trim()}
                    className="px-2.5 py-1.5 bg-brand-600 hover:bg-brand-500 disabled:opacity-40 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsAddingSubtask(false);
                      setCardSubtaskInput('');
                    }}
                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsAddingSubtask(true);
                  }}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 px-2 py-0.5 transition-colors mt-0.5"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add subtask</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons (Quick edit / Delete) */}
        <div className="flex items-center opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedTaskForEdit(task);
            }}
            aria-label="Edit task"
            className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              deleteTask(task.id);
            }}
            aria-label="Delete task"
            className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
