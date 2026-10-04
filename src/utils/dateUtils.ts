import { 
  format, 
  isToday, 
  isTomorrow, 
  isYesterday, 
  parseISO, 
  addHours, 
  addDays, 
  startOfTomorrow, 
  nextSaturday, 
  nextMonday, 
  isBefore,
  parse
} from 'date-fns';

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
    const d = parseISO(dateStr);
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

export function isTaskOverdue(dueDate: string, dueTime?: string): boolean {
  try {
    const now = new Date();
    if (dueTime) {
      const dt = parseISO(`${dueDate}T${dueTime}`);
      return isBefore(dt, now);
    } else {
      const d = parseISO(`${dueDate}T23:59:59`);
      return isBefore(d, now);
    }
  } catch {
    return false;
  }
}

export function isTaskDueNow(dueDate: string, dueTime?: string): boolean {
  if (!dueTime) return false;
  try {
    const now = new Date();
    const dt = parseISO(`${dueDate}T${dueTime}`);
    const diffMinutes = (dt.getTime() - now.getTime()) / (1000 * 60);
    // Due now if between -30 mins and +60 mins
    return diffMinutes >= -30 && diffMinutes <= 60;
  } catch {
    return false;
  }
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
