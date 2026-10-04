import { NaturalLanguageParser } from '../src/services/NaturalLanguageParser.ts';
import { getNextOccurrenceDate } from '../src/utils/recurrence.ts';
import { format, addDays } from 'date-fns';

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`✅ PASSED: ${message}`);
}

console.log('🧪 Starting SmartDay Logic & Parser Tests...\n');

const testDate = new Date('2026-10-04T10:00:00Z'); // Sunday

// Test 1: "Call electrician tomorrow at 10 AM"
const res1 = NaturalLanguageParser.parse('Call electrician tomorrow at 10 AM', testDate);
assert(res1.cleanTitle.toLowerCase().includes('call electrician'), 'Title contains Call electrician');
assert(res1.dueTime === '10:00', `Due time is 10:00 (got ${res1.dueTime})`);
assert(res1.reminderEnabled === true, 'Reminder enabled for explicit time');
assert(res1.categoryId === 'home', `Category inferred as home (got ${res1.categoryId})`);
assert(res1.confidence.hasDate === true, 'Confidence hasDate is true');
assert(res1.confidence.hasTime === true, 'Confidence hasTime is true');

// Test 2: "Buy medicine today evening"
const res2 = NaturalLanguageParser.parse('Buy medicine today evening', testDate);
assert(res2.cleanTitle.toLowerCase().includes('buy medicine'), 'Title contains Buy medicine');
assert(res2.dueTime === '18:30', `Due time set to evening preset 18:30 (got ${res2.dueTime})`);
assert(res2.categoryId === 'health', `Category inferred as health (got ${res2.categoryId})`);

// Test 3: "Pay electricity bill on 10th every month"
const res3 = NaturalLanguageParser.parse('Pay electricity bill on 10th every month', testDate);
assert(res3.cleanTitle.toLowerCase().includes('pay electricity bill'), 'Title contains Pay electricity bill');
assert(res3.recurrence?.frequency === 'monthly', `Recurrence is monthly (got ${res3.recurrence?.frequency})`);
assert(res3.recurrence?.dayOfMonth === 10, `Recurrence dayOfMonth is 10 (got ${res3.recurrence?.dayOfMonth})`);
assert(res3.categoryId === 'finance', `Category inferred as finance (got ${res3.categoryId})`);

// Test 4: "Workout every Monday, Wednesday and Friday at 7 AM"
const res4 = NaturalLanguageParser.parse('Workout every Monday, Wednesday and Friday at 7 AM', testDate);
assert(res4.cleanTitle.toLowerCase().includes('workout'), 'Title contains Workout');
assert(res4.recurrence?.frequency === 'custom', `Recurrence is custom (got ${res4.recurrence?.frequency})`);
assert(JSON.stringify(res4.recurrence?.daysOfWeek) === JSON.stringify([1, 3, 5]), `Days of week are [1, 3, 5] (got ${JSON.stringify(res4.recurrence?.daysOfWeek)})`);
assert(res4.dueTime === '07:00', `Due time is 07:00 (got ${res4.dueTime})`);

// Test 5: Priority keywords: "Urgent client meeting tomorrow 3 PM"
const res5 = NaturalLanguageParser.parse('Urgent client meeting tomorrow 3 PM', testDate);
assert(res5.priority === 'high', `Priority inferred as high (got ${res5.priority})`);
assert(res5.dueTime === '15:00', `Due time is 15:00 (got ${res5.dueTime})`);

// Test 6: Recurrence calculations
const nextDaily = getNextOccurrenceDate('2026-10-04', { frequency: 'daily' });
assert(nextDaily === '2026-10-05', `Next daily after 2026-10-04 is 2026-10-05 (got ${nextDaily})`);

// Friday to next weekday -> skips Sat & Sun to Monday
const nextWeekday = getNextOccurrenceDate('2026-10-09', { frequency: 'weekdays' }); // 2026-10-09 is Friday
assert(nextWeekday === '2026-10-12', `Next weekday after Friday 2026-10-09 is Monday 2026-10-12 (got ${nextWeekday})`);

// Monthly recurrence
const nextMonthly = getNextOccurrenceDate('2026-10-10', { frequency: 'monthly', dayOfMonth: 10 });
assert(nextMonthly === '2026-11-10', `Next monthly after 2026-10-10 is 2026-11-10 (got ${nextMonthly})`);

console.log('\n🎉 ALL 14 LOGIC & RECURRENCE TESTS PASSED SUCCESSFULLY!');
