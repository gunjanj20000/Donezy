import { addDays, format, nextDay, parse, isValid, getDay } from 'date-fns';
import { Priority, TaskRecurrence } from '../types';

export interface ParsedTaskResult {
  originalInput: string;
  cleanTitle: string;
  dueDate: string; // YYYY-MM-DD
  dueTime?: string; // HH:mm
  reminderEnabled: boolean;
  priority: Priority;
  categoryId?: string;
  recurrence?: TaskRecurrence;
  confidence: {
    hasDate: boolean;
    hasTime: boolean;
    hasRecurrence: boolean;
    isTimeAmbiguous: boolean;
  };
  detectedChips: {
    type: 'date' | 'time' | 'recurrence' | 'priority' | 'category';
    label: string;
    value: string;
  }[];
}

const DAYS_MAP: Record<string, number> = {
  sunday: 0,
  sun: 0,
  monday: 1,
  mon: 1,
  tuesday: 2,
  tue: 2,
  wednesday: 3,
  wed: 3,
  thursday: 4,
  thu: 4,
  friday: 5,
  fri: 5,
  saturday: 6,
  sat: 6,
};

export class NaturalLanguageParser {
  static parse(rawInput: string, now: Date = new Date()): ParsedTaskResult {
    let text = rawInput.trim();
    const todayStr = format(now, 'yyyy-MM-dd');
    let targetDate = todayStr;
    let targetTime: string | undefined = undefined;
    let reminderEnabled = false;
    let priority: Priority = 'none';
    let categoryId: string | undefined = undefined;
    let recurrence: TaskRecurrence | undefined = undefined;

    let hasDate = false;
    let hasTime = false;
    let hasRecurrence = false;
    let isTimeAmbiguous = false;

    const detectedChips: ParsedTaskResult['detectedChips'] = [];

    // 1. Detect Priority
    const highPriMatch = text.match(/\b(urgent|high priority|important|p1|asap)\b/i);
    if (highPriMatch) {
      priority = 'high';
      text = text.replace(highPriMatch[0], '').trim();
      detectedChips.push({ type: 'priority', label: '🔴 High Priority', value: 'high' });
    } else {
      const medPriMatch = text.match(/\b(medium priority|p2)\b/i);
      if (medPriMatch) {
        priority = 'medium';
        text = text.replace(medPriMatch[0], '').trim();
        detectedChips.push({ type: 'priority', label: '🟡 Medium Priority', value: 'medium' });
      } else {
        const lowPriMatch = text.match(/\b(low priority|p3)\b/i);
        if (lowPriMatch) {
          priority = 'low';
          text = text.replace(lowPriMatch[0], '').trim();
          detectedChips.push({ type: 'priority', label: '🟢 Low Priority', value: 'low' });
        }
      }
    }

    // 2. Detect Recurrence
    // Example: "every month on the 10th" or "on 10th every month" or "on the 10th of every month"
    const monthlyDayMatch = text.match(/\b(?:on\s+(?:the\s+)?(\d{1,2})(?:st|nd|rd|th)?\s+(?:of\s+)?every\s+month|every\s+month\s+(?:on\s+)?(?:the\s+)?(\d{1,2})(?:st|nd|rd|th)?)\b/i);
    if (monthlyDayMatch) {
      const dayNum = parseInt(monthlyDayMatch[1] || monthlyDayMatch[2], 10);
      if (dayNum >= 1 && dayNum <= 31) {
        recurrence = { frequency: 'monthly', dayOfMonth: dayNum };
        hasRecurrence = true;
        text = text.replace(monthlyDayMatch[0], '').trim();
        detectedChips.push({ type: 'recurrence', label: `🔄 Monthly (Day ${dayNum})`, value: 'monthly' });
      }
    }

    // Example: "every Monday, Wednesday and Friday" or "every Mon, Wed, Fri"
    if (!recurrence) {
      const multiDayMatch = text.match(/\bevery\s+((?:(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun)(?:,\s*|\s+and\s+|\s+))+)/i);
      if (multiDayMatch) {
        const rawDays = multiDayMatch[1].toLowerCase().match(/monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun/g);
        if (rawDays && rawDays.length > 0) {
          const daysOfWeek = Array.from(new Set(rawDays.map(d => DAYS_MAP[d]))).sort();
          recurrence = { frequency: 'custom', daysOfWeek };
          hasRecurrence = true;
          text = text.replace(multiDayMatch[0], '').trim();
          const dayNames = daysOfWeek.map(d => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d]).join(', ');
          detectedChips.push({ type: 'recurrence', label: `🔄 Repeat: ${dayNames}`, value: 'custom' });
        }
      }
    }

    // Generic recurrences: every day, weekdays, weekends, weekly, monthly, yearly
    if (!recurrence) {
      const repeatMatch = text.match(/\b(every\s+day|daily|every\s+weekday|weekdays|every\s+weekend|weekends|every\s+week|weekly|every\s+month|monthly|every\s+year|yearly)\b/i);
      if (repeatMatch) {
        const phrase = repeatMatch[1].toLowerCase();
        if (phrase.includes('weekday')) {
          recurrence = { frequency: 'weekdays' };
          detectedChips.push({ type: 'recurrence', label: '🔄 Weekdays', value: 'weekdays' });
        } else if (phrase.includes('weekend')) {
          recurrence = { frequency: 'weekends' };
          detectedChips.push({ type: 'recurrence', label: '🔄 Weekends', value: 'weekends' });
        } else if (phrase.includes('day') || phrase === 'daily') {
          recurrence = { frequency: 'daily' };
          detectedChips.push({ type: 'recurrence', label: '🔄 Daily', value: 'daily' });
        } else if (phrase.includes('week') || phrase === 'weekly') {
          recurrence = { frequency: 'weekly' };
          detectedChips.push({ type: 'recurrence', label: '🔄 Weekly', value: 'weekly' });
        } else if (phrase.includes('month') || phrase === 'monthly') {
          recurrence = { frequency: 'monthly' };
          detectedChips.push({ type: 'recurrence', label: '🔄 Monthly', value: 'monthly' });
        } else if (phrase.includes('year') || phrase === 'yearly') {
          recurrence = { frequency: 'yearly' };
          detectedChips.push({ type: 'recurrence', label: '🔄 Yearly', value: 'yearly' });
        }
        hasRecurrence = true;
        text = text.replace(repeatMatch[0], '').trim();
      }
    }

    // 3. Detect Exact Time (e.g. "at 10:30 AM", "at 5 PM", "10am", "16:00", "5:00 pm")
    const exactTimeMatch = text.match(/\b(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i) ||
                           text.match(/\bat\s+(\d{1,2})(?::(\d{2}))?\b/i);
    if (exactTimeMatch) {
      let hours = parseInt(exactTimeMatch[1], 10);
      const minutes = exactTimeMatch[2] ? parseInt(exactTimeMatch[2], 10) : 0;
      const meridiem = exactTimeMatch[3]?.toLowerCase();

      if (meridiem === 'pm' && hours < 12) hours += 12;
      if (meridiem === 'am' && hours === 12) hours = 0;

      if (!meridiem && hours <= 6) {
        // e.g. "at 5" -> usually 5 PM (17:00) in task context
        hours += 12;
      }

      if (hours >= 0 && hours < 24 && minutes >= 0 && minutes < 60) {
        targetTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        hasTime = true;
        reminderEnabled = true;
        text = text.replace(exactTimeMatch[0], '').trim();

        const formattedTimeDisplay = format(parse(targetTime, 'HH:mm', new Date()), 'h:mm a');
        detectedChips.push({ type: 'time', label: `⏰ ${formattedTimeDisplay}`, value: targetTime });
      }
    }

    // 4. Detect Relative / Presets Time keywords (morning, afternoon, evening, tonight, now)
    if (!targetTime) {
      if (/\b(?:tonight)\b/i.test(text)) {
        targetTime = '20:00';
        hasTime = true;
        reminderEnabled = true;
        text = text.replace(/\btonight\b/i, '').trim();
        detectedChips.push({ type: 'time', label: '🌙 Tonight (8:00 PM)', value: targetTime });
      } else if (/\b(?:this\s+evening|in\s+the\s+evening|evening)\b/i.test(text)) {
        targetTime = '18:30';
        hasTime = true;
        reminderEnabled = true;
        text = text.replace(/\b(?:this\s+evening|in\s+the\s+evening|evening)\b/i, '').trim();
        detectedChips.push({ type: 'time', label: '🌆 Evening (6:30 PM)', value: targetTime });
      } else if (/\b(?:this\s+afternoon|in\s+the\s+afternoon|afternoon)\b/i.test(text)) {
        targetTime = '14:00';
        hasTime = true;
        reminderEnabled = true;
        text = text.replace(/\b(?:this\s+afternoon|in\s+the\s+afternoon|afternoon)\b/i, '').trim();
        detectedChips.push({ type: 'time', label: '☀️ Afternoon (2:00 PM)', value: targetTime });
      } else if (/\b(?:this\s+morning|in\s+the\s+morning|morning)\b/i.test(text)) {
        targetTime = '09:00';
        hasTime = true;
        reminderEnabled = true;
        text = text.replace(/\b(?:this\s+morning|in\s+the\s+morning|morning)\b/i, '').trim();
        detectedChips.push({ type: 'time', label: '🌅 Morning (9:00 AM)', value: targetTime });
      } else if (/\b(?:now)\b/i.test(text)) {
        targetTime = format(now, 'HH:mm');
        hasTime = true;
        reminderEnabled = true;
        text = text.replace(/\bnow\b/i, '').trim();
        detectedChips.push({ type: 'time', label: '⚡ Now', value: targetTime });
      }
    }

    // 5. Detect Date keywords (today, tomorrow, day after tomorrow, this weekend, next week, specific day)
    const dayAfterMatch = text.match(/\b(day\s+after\s+tomorrow)\b/i);
    if (dayAfterMatch) {
      const dt = addDays(now, 2);
      targetDate = format(dt, 'yyyy-MM-dd');
      hasDate = true;
      text = text.replace(dayAfterMatch[0], '').trim();
      detectedChips.push({ type: 'date', label: `📅 ${format(dt, 'EEE, MMM d')}`, value: targetDate });
    } else {
      const tomorrowMatch = text.match(/\b(tomorrow)\b/i);
      if (tomorrowMatch) {
        const dt = addDays(now, 1);
        targetDate = format(dt, 'yyyy-MM-dd');
        hasDate = true;
        text = text.replace(tomorrowMatch[0], '').trim();
        detectedChips.push({ type: 'date', label: '📅 Tomorrow', value: targetDate });
      } else {
        const todayMatch = text.match(/\b(today)\b/i);
        if (todayMatch) {
          targetDate = todayStr;
          hasDate = true;
          text = text.replace(todayMatch[0], '').trim();
          detectedChips.push({ type: 'date', label: '📅 Today', value: targetDate });
        } else {
          const weekendMatch = text.match(/\b(this\s+weekend)\b/i);
          if (weekendMatch) {
            // Saturday of current week
            const currentDay = getDay(now);
            const daysUntilSat = (6 - currentDay + 7) % 7 || 7;
            const sat = addDays(now, daysUntilSat);
            targetDate = format(sat, 'yyyy-MM-dd');
            if (!targetTime) targetTime = '10:00';
            hasDate = true;
            hasTime = true;
            reminderEnabled = true;
            text = text.replace(weekendMatch[0], '').trim();
            detectedChips.push({ type: 'date', label: `📅 This Weekend (${format(sat, 'MMM d')})`, value: targetDate });
          } else {
            const nextWeekMatch = text.match(/\b(next\s+week)\b/i);
            if (nextWeekMatch) {
              const currentDay = getDay(now);
              // Next Monday
              const daysUntilMon = ((1 - currentDay + 7) % 7) || 7;
              const mon = addDays(now, daysUntilMon);
              targetDate = format(mon, 'yyyy-MM-dd');
              if (!targetTime) targetTime = '09:00';
              hasDate = true;
              hasTime = true;
              reminderEnabled = true;
              text = text.replace(nextWeekMatch[0], '').trim();
              detectedChips.push({ type: 'date', label: `📅 Next Week (${format(mon, 'MMM d')})`, value: targetDate });
            } else {
              // Specific day of week, e.g. "next Friday", "on Friday", "Friday"
              const dayMatch = text.match(/\b(?:(?:on|next)\s+)?(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i);
              if (dayMatch) {
                const dayName = dayMatch[1].toLowerCase();
                const targetDayIndex = DAYS_MAP[dayName];
                const dt = nextDay(now, targetDayIndex as 0 | 1 | 2 | 3 | 4 | 5 | 6);
                targetDate = format(dt, 'yyyy-MM-dd');
                hasDate = true;
                text = text.replace(dayMatch[0], '').trim();
                detectedChips.push({ type: 'date', label: `📅 ${format(dt, 'EEE, MMM d')}`, value: targetDate });
              }
            }
          }
        }
      }
    }

    // 6. Clean "remind me to" or "remind me" or "remember to" or "todo" prefix
    text = text.replace(/^remind\s+me\s+(?:to\s+)?/i, '')
               .replace(/^remember\s+to\s+/i, '')
               .replace(/^todo:?\s+/i, '')
               .replace(/^please\s+/i, '')
               .trim();

    // Remove leftover dangling prepositions at end: "at", "on", "for", "in"
    text = text.replace(/\s+(at|on|for|in|by)$/i, '').trim();

    // 7. Category Auto-Inference if not set (domain-specific keywords first)
    const lowerText = text.toLowerCase();
    if (/\b(medicine|dr|doctor|pill|prescription|clinic|dentist|exercise|workout|gym|run|walk|yoga)\b/i.test(lowerText)) {
      categoryId = 'health';
    } else if (/\b(bill|electricity|rent|tax|salary|mortgage|fee|invest|bank|invoice)\b/i.test(lowerText)) {
      categoryId = 'finance';
    } else if (/\b(electrician|plumber|fix|repair|ac|clean|chore|furniture|paint|leak)\b/i.test(lowerText)) {
      categoryId = 'home';
    } else if (/\b(groceries|buy|market|milk|eggs|shop|store|order|cart|supermarket)\b/i.test(lowerText)) {
      categoryId = 'shopping';
    } else if (/\b(call|meet|meeting|client|report|email|presentation|boss|slack|zoom)\b/i.test(lowerText)) {
      categoryId = 'work';
    } else if (/\b(study|exam|homework|read|book|chapter|course|learn)\b/i.test(lowerText)) {
      categoryId = 'study';
    } else if (/\b(car|mechanic|oil|tire|vehicle|insurance)\b/i.test(lowerText)) {
      categoryId = 'car';
    } else if (/\b(mom|dad|family|kids|dinner|birthday|anniversary)\b/i.test(lowerText)) {
      categoryId = 'family';
    } else {
      categoryId = 'personal';
    }

    if (categoryId) {
      detectedChips.push({
        type: 'category',
        label: `🏷️ ${categoryId.charAt(0).toUpperCase() + categoryId.slice(1)}`,
        value: categoryId
      });
    }

    // Capitalize first letter of cleaned title
    const cleanTitle = text.length > 0 
      ? text.charAt(0).toUpperCase() + text.slice(1)
      : rawInput.trim();

    return {
      originalInput: rawInput,
      cleanTitle: cleanTitle || 'New Task',
      dueDate: targetDate,
      dueTime: targetTime,
      reminderEnabled: reminderEnabled || Boolean(targetTime),
      priority,
      categoryId,
      recurrence,
      confidence: {
        hasDate,
        hasTime,
        hasRecurrence,
        isTimeAmbiguous
      },
      detectedChips
    };
  }
}
