import { 
  format, 
  isToday, 
  isTomorrow, 
  isYesterday, 
  addHours, 
  addDays, 
  startOfTomorrow, 
  nextSaturday, 
  nextMonday, 
  parse
} from 'date-fns';

/**
 * Safely parse 'yyyy-MM-dd' string into a Date object at local midnight,
 * preventing any UTC off-by-one timezone shifting.
 */
export function parseLocalDate(dateStr: string): Date {
  if (!dateStr) return new Date();
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
      return new Date(year, month, day, 0, 0, 0, 0);
    }
  }
  return new Date(dateStr);
}

export function getGreeting(): { text: string; icon: string } {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) {
    return { text: 'Good Morning', icon: '🌅' };
  } else if (hour >= 12 && hour < 17) {
    return { text: 'Good Afternoon', icon: '☀️' };
  } else if (hour >= 17 && hour < 22) {
    return { text: 'Good Evening', icon: '🌆' };
  } else {
    return { text: 'Good Night', icon: '🌙' };
  }
}

export function formatDateLabel(dateStr: string): string {
  try {
    const d = parseLocalDate(dateStr);
    if (isToday(d)) return 'Today';
    if (isTomorrow(d)) return 'Tomorrow';
    if (isYesterday(d)) return 'Yesterday';
    return format(d, 'EEE, MMM d');
  } catch {
    return dateStr;
  }
}

export function formatTimeDisplay(timeStr?: string, is12Hour: boolean = true): string {
  if (!timeStr) return '';
  try {
    const parsed = parse(timeStr, 'HH:mm', new Date());
    return is12Hour ? format(parsed, 'h:mm a') : format(parsed, 'HH:mm');
  } catch {
    return timeStr;
  }
}

/**
 * Checks if a task is overdue taking exact local date & time into account.
 * - Tasks due on earlier dates are ALWAYS overdue.
 * - Tasks due today with a specific dueTime are overdue once that time has passed.
 * - Tasks due today with NO time specified are NOT overdue until the next calendar day.
 * - Tasks due in the future are never overdue.
 */
export function isTaskOverdue(dueDate: string, dueTime?: string): boolean {
  try {
    const now = new Date();
    const todayStr = format(now, 'yyyy-MM-dd');

    // If dueDate is before today, it's overdue
    if (dueDate < todayStr) {
      return true;
    }

    // If dueDate is after today, it's not overdue
    if (dueDate > todayStr) {
      return false;
    }

    // Due today: check time if specified
    if (dueTime) {
      const timeParts = dueTime.split(':');
      if (timeParts.length >= 2) {
        const hours = parseInt(timeParts[0], 10);
        const minutes = parseInt(timeParts[1], 10);
        const target = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
          hours,
          minutes,
          0,
          0
        );
        return target.getTime() < now.getTime();
      }
    }

    // Due today without specific time: not overdue during the day
    return false;
  } catch {
    return false;
  }
}

/**
 * Checks if a task is due right around current time (within -30 min to +60 min).
 */
export function isTaskDueNow(dueDate: string, dueTime?: string): boolean {
  if (!dueTime) return false;
  try {
    const now = new Date();
    const todayStr = format(now, 'yyyy-MM-dd');
    if (dueDate !== todayStr) return false;

    const timeParts = dueTime.split(':');
    if (timeParts.length >= 2) {
      const hours = parseInt(timeParts[0], 10);
      const minutes = parseInt(timeParts[1], 10);
      const target = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        hours,
        minutes,
        0,
        0
      );
      const diffMinutes = (target.getTime() - now.getTime()) / (1000 * 60);
      return diffMinutes >= -30 && diffMinutes <= 60;
    }
  } catch {
    return false;
  }
  return false;
}

export function getSmartTimePresets() {
  const now = new Date();
  const todayStr = format(now, 'yyyy-MM-dd');
  const laterTime = format(addHours(now, 2), 'HH:mm');
  const tomorrowStr = format(startOfTomorrow(), 'yyyy-MM-dd');
  const weekendDate = nextSaturday(now);
  const nextWeekDate = nextMonday(now);

  return [
    {
      id: 'now',
      label: 'Now',
      description: format(now, 'h:mm a'),
      date: todayStr,
      time: format(now, 'HH:mm'),
      icon: 'Zap'
    },
    {
      id: 'later',
      label: 'Later (+2h)',
      description: format(addHours(now, 2), 'h:mm a'),
      date: todayStr,
      time: laterTime,
      icon: 'Clock'
    },
    {
      id: 'today',
      label: 'Today',
      description: 'Anytime today',
      date: todayStr,
      time: undefined,
      icon: 'Calendar'
    },
    {
      id: 'tonight',
      label: 'Tonight',
      description: '8:00 PM',
      date: todayStr,
      time: '20:00',
      icon: 'Moon'
    },
    {
      id: 'tomorrow',
      label: 'Tomorrow',
      description: '9:00 AM',
      date: tomorrowStr,
      time: '09:00',
      icon: 'SunMedium'
    },
    {
      id: 'weekend',
      label: 'This Weekend',
      description: format(weekendDate, 'EEE, 10:00 AM'),
      date: format(weekendDate, 'yyyy-MM-dd'),
      time: '10:00',
      icon: 'Coffee'
    },
    {
      id: 'next_week',
      label: 'Next Week',
      description: format(nextWeekDate, 'MMM d, 9:00 AM'),
      date: format(nextWeekDate, 'yyyy-MM-dd'),
      time: '09:00',
      icon: 'Briefcase'
    },
  ];
}
