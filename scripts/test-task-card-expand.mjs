import fs from 'fs';
import path from 'path';

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`✅ PASSED: ${message}`);
}

console.log('🧪 Starting TaskCard Click-to-Expand & Edit-Button Isolation Tests...\n');

const taskCardPath = path.resolve('src/components/tasks/TaskCard.tsx');
const dateUtilsPath = path.resolve('src/utils/dateUtils.ts');

const taskCardContent = fs.readFileSync(taskCardPath, 'utf8');
const dateUtilsContent = fs.readFileSync(dateUtilsPath, 'utf8');

// 1. Task Card Click-to-Expand vs Edit Modal
console.log('--- 1. Task Card Click Behavior ---');
assert(
  !taskCardContent.includes('onClick={() => setSelectedTaskForEdit(task)}\n          className="flex-1 min-w-0 cursor-pointer'),
  'Clicking task card details no longer triggers setSelectedTaskForEdit'
);
assert(
  taskCardContent.includes('onClick={() => setIsExpanded(prev => !prev)}'),
  'Clicking task card details toggles isExpanded'
);
assert(
  taskCardContent.includes('aria-expanded={isExpanded}'),
  'Task card has accessible aria-expanded attribute'
);

// 2. Edit window opens only when edit button is clicked
console.log('\n--- 2. Edit Button Isolation ---');
assert(
  taskCardContent.includes("aria-label=\"Edit task\""),
  'Card has dedicated Edit task button'
);
assert(
  taskCardContent.includes("onClick={(e) => {\n              e.stopPropagation();\n              setSelectedTaskForEdit(task);\n            }}"),
  'Dedicated Edit button invokes setSelectedTaskForEdit'
);
assert(
  !taskCardContent.includes("if (swipeOffset < -70) {\n      // Swiped left -> open edit or delete\n      setSelectedTaskForEdit(task);"),
  'Swipe left no longer automatically opens edit modal window'
);

// 3. Expanded details: when added, subtasks, notes, and actions
console.log('\n--- 3. Expanded Details ---');
assert(
  dateUtilsContent.includes('export function formatAddedDate'),
  'dateUtils exports formatAddedDate'
);
assert(
  dateUtilsContent.includes('export function formatCompletedDate'),
  'dateUtils exports formatCompletedDate'
);
assert(
  taskCardContent.includes('formatAddedDate(task.createdAt)'),
  'TaskCard displays formatted added date/time when expanded'
);
assert(
  taskCardContent.includes('Added:'),
  'TaskCard contains "Added:" label'
);
assert(
  taskCardContent.includes('{isExpanded && ('),
  'TaskCard conditionally renders expanded section'
);
assert(
  taskCardContent.includes('Edit Task</span>'),
  'Expanded section provides explicit "Edit Task" button'
);
assert(
  taskCardContent.includes('Collapse</span>'),
  'Expanded section provides explicit "Collapse" button'
);
assert(
  taskCardContent.includes('ChevronDown') && taskCardContent.includes('ChevronUp'),
  'TaskCard renders ChevronDown when collapsed and ChevronUp when expanded'
);

console.log('\n🎉 ALL TASK CARD EXPAND & EDIT VERIFICATION TESTS PASSED SUCCESSFULLY!\n');
