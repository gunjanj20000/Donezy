import { isTaskOverdue, isTaskDueNow, parseLocalDate, formatDateLabel } from '../src/utils/dateUtils.ts';
import { getNextOccurrenceDate } from '../src/utils/recurrence.ts';
import { format, subDays, addDays } from 'date-fns';

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`✅ PASSED: ${message}`);
}

console.log('🔍 Starting Deep Reminder Architecture & Timezone Audit...\n');

// 1. Timezone Handling: parseLocalDate tests
console.log('--- 1. Testing Local Date Parsing (No UTC Shift) ---');
const d1 = parseLocalDate('2026-10-04');
assert(d1.getFullYear() === 2026, 'Year is 2026');
assert(d1.getMonth() === 9, 'Month is October (index 9)');
assert(d1.getDate() === 4, 'Day of month is strictly 4');
assert(d1.getHours() === 0, 'Hour is 0 (local midnight)');

const d2 = parseLocalDate('2026-02-28');
assert(d2.getDate() === 28, 'Day of month is 28');

// 2. Overdue Logic Audit
console.log('\n--- 2. Testing Overdue Task Edge Cases ---');
const todayStr = format(new Date(), 'yyyy-MM-dd');
const yesterdayStr = format(subDays(new Date(), 1), 'yyyy-MM-dd');
const tomorrowStr = format(addDays(new Date(), 1), 'yyyy-MM-dd');

// Yesterday task without time is ALWAYS overdue
assert(isTaskOverdue(yesterdayStr, undefined) === true, 'Yesterday task without time is overdue');

// Yesterday task with time is ALWAYS overdue
assert(isTaskOverdue(yesterdayStr, '12:00') === true, 'Yesterday task with time is overdue');

// Tomorrow task without time is NEVER overdue
assert(isTaskOverdue(tomorrowStr, undefined) === false, 'Tomorrow task without time is not overdue');

// Tomorrow task with early time is NEVER overdue
assert(isTaskOverdue(tomorrowStr, '01:00') === false, 'Tomorrow task with early time is not overdue');

// Today task without time is NOT overdue during today
assert(isTaskOverdue(todayStr, undefined) === false, 'Today task without time is not overdue during today');

// Today task with past time (00:01) is overdue (unless tested at exactly midnight)
const currentHour = new Date().getHours();
if (currentHour > 1) {
  assert(isTaskOverdue(todayStr, '00:01') === true, 'Today task with past time 00:01 is overdue');
}

// Today task with far future time (23:59) is NOT overdue
assert(isTaskOverdue(todayStr, '23:59') === false, 'Today task with future time 23:59 is not overdue');

// 3. Recurring Reminders Calculation Audit
console.log('\n--- 3. Testing Recurring Reminders & Roll-Over ---');

// Daily recurrence
const recDaily = getNextOccurrenceDate('2026-10-04', { frequency: 'daily' }, new Date('2026-10-04T12:00:00Z'));
assert(recDaily === '2026-10-05', `Daily next occurrence from 2026-10-04 is 2026-10-05 (got ${recDaily})`);

// Daily recurrence on an OVERDUE task (e.g. from 10 days ago):
// Must jump to tomorrow relative to completion date, NOT 9 days ago!
const recOverdue = getNextOccurrenceDate('2026-09-20', { frequency: 'daily' }, new Date('2026-10-04T12:00:00Z'));
assert(recOverdue === '2026-10-05', `Overdue task recurrence advances to future 2026-10-05 (got ${recOverdue})`);

// Weekday recurrence: Friday 2026-10-09 must skip Saturday (10-10) and Sunday (10-11) to Monday 2026-10-12
const recWeekdayFri = getNextOccurrenceDate('2026-10-09', { frequency: 'weekdays' }, new Date('2026-10-09T12:00:00Z'));
assert(recWeekdayFri === '2026-10-12', `Weekday recurrence from Friday skips weekend to Monday 2026-10-12 (got ${recWeekdayFri})`);

// Weekend recurrence: Sunday 2026-10-04 must advance to Saturday 2026-10-10
const recWeekendSun = getNextOccurrenceDate('2026-10-04', { frequency: 'weekends' }, new Date('2026-10-04T12:00:00Z'));
assert(recWeekendSun === '2026-10-10', `Weekend recurrence from Sunday advances to Saturday 2026-10-10 (got ${recWeekendSun})`);

// Monthly recurrence on 10th
const recMonthly = getNextOccurrenceDate('2026-10-10', { frequency: 'monthly', dayOfMonth: 10 }, new Date('2026-10-10T12:00:00Z'));
assert(recMonthly === '2026-11-10', `Monthly recurrence advances to next month (got ${recMonthly})`);

// Custom recurrence: Mon, Wed, Fri ([1, 3, 5])
// From Sunday 2026-10-04 -> next is Monday 2026-10-05
const recCustomSun = getNextOccurrenceDate('2026-10-04', { frequency: 'custom', daysOfWeek: [1, 3, 5] }, new Date('2026-10-04T12:00:00Z'));
assert(recCustomSun === '2026-10-05', `Custom recurrence from Sunday advances to Monday 2026-10-05 (got ${recCustomSun})`);

// From Monday 2026-10-05 -> next is Wednesday 2026-10-07
const recCustomMon = getNextOccurrenceDate('2026-10-05', { frequency: 'custom', daysOfWeek: [1, 3, 5] }, new Date('2026-10-05T12:00:00Z'));
assert(recCustomMon === '2026-10-07', `Custom recurrence from Monday advances to Wednesday 2026-10-07 (got ${recCustomMon})`);

console.log('\n🎉 ALL REMINDER ARCHITECTURE & TIMEZONE AUDIT TESTS PASSED!\n');
