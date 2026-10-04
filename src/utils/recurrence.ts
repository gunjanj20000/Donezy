import { addDays, addMonths, addYears, getDay, parseISO, format, isValid } from 'date-fns';
import { TaskRecurrence } from '../types';

export function getNextOccurrenceDate(currentDateStr: string, recurrence: TaskRecurrence): string {
  try {
    const current = parseISO(currentDateStr);
    if (!isValid(current)) {
      return format(addDays(new Date(), 1), 'yyyy-MM-dd');
    }

    switch (recurrence.frequency) {
      case 'daily': {
        const interval = recurrence.interval || 1;
        return format(addDays(current, interval), 'yyyy-MM-dd');
      }

      case 'weekdays': {
        let next = addDays(current, 1);
        while (getDay(next) === 0 || getDay(next) === 6) { // 0 = Sun, 6 = Sat
          next = addDays(next, 1);
        }
        return format(next, 'yyyy-MM-dd');
      }

      case 'weekends': {
        let next = addDays(current, 1);
        while (getDay(next) !== 0 && getDay(next) !== 6) {
          next = addDays(next, 1);
        }
        return format(next, 'yyyy-MM-dd');
      }

      case 'weekly': {
        const interval = recurrence.interval || 1;
        return format(addDays(current, 7 * interval), 'yyyy-MM-dd');
      }

      case 'monthly': {
        const interval = recurrence.interval || 1;
        const nextMonth = addMonths(current, interval);
        if (recurrence.dayOfMonth) {
          nextMonth.setDate(Math.min(recurrence.dayOfMonth, 28)); // Safe day
        }
        return format(nextMonth, 'yyyy-MM-dd');
      }

      case 'yearly': {
        const interval = recurrence.interval || 1;
        return format(addYears(current, interval), 'yyyy-MM-dd');
      }

      case 'custom': {
        if (recurrence.daysOfWeek && recurrence.daysOfWeek.length > 0) {
          const sortedDays = [...recurrence.daysOfWeek].sort((a, b) => a - b);
          let check = addDays(current, 1);
          // Check next 14 days for match
          for (let i = 0; i < 14; i++) {
            if (sortedDays.includes(getDay(check))) {
              return format(check, 'yyyy-MM-dd');
            }
            check = addDays(check, 1);
          }
        }
        return format(addDays(current, 1), 'yyyy-MM-dd');
      }

      default:
        return format(addDays(current, 1), 'yyyy-MM-dd');
    }
  } catch {
    return format(addDays(new Date(), 1), 'yyyy-MM-dd');
  }
}
