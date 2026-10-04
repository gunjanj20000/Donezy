import { addDays, addMonths, addYears, getDay, format } from 'date-fns';
import { TaskRecurrence } from '../types';
import { parseLocalDate } from './dateUtils';

/**
 * Computes the next occurrence date for a recurring task.
 * Guarantees that the generated date is in the future relative to the completed event,
 * even if the original task was overdue.
 */
export function getNextOccurrenceDate(currentDateStr: string, recurrence: TaskRecurrence, fromDate: Date = new Date()): string {
  try {
    const todayStr = format(fromDate, 'yyyy-MM-dd');
    let base = parseLocalDate(currentDateStr);
    const today = parseLocalDate(todayStr);

    // If current dueDate is in the past, anchor base to today so recurrence doesn't regenerate into the past
    if (base.getTime() < today.getTime()) {
      base = today;
    }

    switch (recurrence.frequency) {
      case 'daily': {
        const interval = recurrence.interval || 1;
        return format(addDays(base, interval), 'yyyy-MM-dd');
      }

      case 'weekdays': {
        let next = addDays(base, 1);
        while (getDay(next) === 0 || getDay(next) === 6) { // 0 = Sun, 6 = Sat
          next = addDays(next, 1);
        }
        return format(next, 'yyyy-MM-dd');
      }

      case 'weekends': {
        let next = addDays(base, 1);
        while (getDay(next) !== 0 && getDay(next) !== 6) {
          next = addDays(next, 1);
        }
        return format(next, 'yyyy-MM-dd');
      }

      case 'weekly': {
        const interval = recurrence.interval || 1;
        return format(addDays(base, 7 * interval), 'yyyy-MM-dd');
      }

      case 'monthly': {
        const interval = recurrence.interval || 1;
        const nextMonth = addMonths(base, interval);
        if (recurrence.dayOfMonth) {
          nextMonth.setDate(Math.min(recurrence.dayOfMonth, 28)); // Safe day
        }
        return format(nextMonth, 'yyyy-MM-dd');
      }

      case 'yearly': {
        const interval = recurrence.interval || 1;
        return format(addYears(base, interval), 'yyyy-MM-dd');
      }

      case 'custom': {
        if (recurrence.daysOfWeek && recurrence.daysOfWeek.length > 0) {
          const sortedDays = [...recurrence.daysOfWeek].sort((a, b) => a - b);
          let check = addDays(base, 1);
          // Look ahead up to 14 days for next matching day of week
          for (let i = 0; i < 14; i++) {
            if (sortedDays.includes(getDay(check))) {
              return format(check, 'yyyy-MM-dd');
            }
            check = addDays(check, 1);
          }
        }
        return format(addDays(base, 1), 'yyyy-MM-dd');
      }

      default:
        return format(addDays(base, 1), 'yyyy-MM-dd');
    }
  } catch {
    return format(addDays(new Date(), 1), 'yyyy-MM-dd');
  }
}
