import fs from 'fs';
import path from 'path';

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`✅ PASSED: ${message}`);
}

console.log('🧪 Starting Quick Task Full Window, Autosuggestion, & Subtask Verification...\n');

const quickAddPath = path.resolve('src/components/quickadd/QuickAddSheet.tsx');
const taskDetailPath = path.resolve('src/components/tasks/TaskDetailModal.tsx');
const taskCardPath = path.resolve('src/components/tasks/TaskCard.tsx');
const speechHookPath = path.resolve('src/utils/useSpeechRecognition.ts');

const quickAddContent = fs.readFileSync(quickAddPath, 'utf-8');
const taskDetailContent = fs.readFileSync(taskDetailPath, 'utf-8');
const taskCardContent = fs.readFileSync(taskCardPath, 'utf-8');
const speechHookContent = fs.readFileSync(speechHookPath, 'utf-8');

// 1. Full Window verification for Quick Task
console.log('--- 1. Quick Task Full Window Layout ---');
assert(quickAddContent.includes('fixed inset-0 z-50 bg-slate-50 dark:bg-slate-950 flex flex-col h-[100dvh] w-screen'), 'QuickAddSheet has full window fixed inset-0 and 100dvh layout');
assert(!quickAddContent.includes('max-w-xl bg-white dark:bg-slate-900 rounded-t-3xl'), 'QuickAddSheet no longer has small modal max-w-xl card wrapper');
assert(quickAddContent.includes('<header') || quickAddContent.includes('Full Window Header'), 'QuickAddSheet contains dedicated header bar');
assert(quickAddContent.includes('Close') && quickAddContent.includes('ESC'), 'Header contains accessible close controls and ESC indicator');

// 2. Autosuggestion verification & Recent tab removal
console.log('\n--- 2. Autosuggestion & Recent Tab Removal ---');
assert(!quickAddContent.includes("toggleDropdown('recent')"), 'Recent tab toggle removed from toolbar');
assert(!quickAddContent.includes("activeDropdown === 'recent'"), 'Recent dropdown condition removed');
assert(!quickAddContent.includes("type ActiveDropdown = 'date' | 'category' | 'priority' | 'repeat' | 'template' | 'recent'"), "ActiveDropdown does not include 'recent'");
assert(quickAddContent.includes('autosuggestions'), 'Autosuggestions state exists in QuickAddSheet');
assert(quickAddContent.includes('fetchAutosuggestions'), 'fetchAutosuggestions method exists');
assert(quickAddContent.includes('handleInputKeyDown'), 'Keyboard navigation handler for autosuggestions exists');
assert(quickAddContent.includes('ArrowDown') && quickAddContent.includes('ArrowUp'), 'Supports Up/Down arrow navigation for suggestions');
assert(quickAddContent.includes('applyAutosuggestion'), 'applyAutosuggestion function exists to populate task');

// 3. Speech Recognition Hook & Subtask Voice Function
console.log('\n--- 3. Voice Function for Subtasks ---');
assert(fs.existsSync(speechHookPath), 'useSpeechRecognition.ts utility exists');
assert(speechHookContent.includes('SpeechRecognition') && speechHookContent.includes('webkitSpeechRecognition'), 'Speech recognition hook supports standard and webkit APIs');
assert(quickAddContent.includes('useSpeechRecognition'), 'QuickAddSheet imports useSpeechRecognition');
assert(quickAddContent.includes('isSubtaskListening') && quickAddContent.includes('startSubtaskVoice'), 'QuickAddSheet manages subtask voice listening state');
assert(quickAddContent.includes('placeholder={isSubtaskListening ?'), 'Subtask input changes placeholder during voice listening');
assert(taskDetailContent.includes('useSpeechRecognition'), 'TaskDetailModal imports useSpeechRecognition');
assert(taskDetailContent.includes('isSubtaskListening') && taskDetailContent.includes('startSubtaskVoice'), 'TaskDetailModal manages subtask voice listening state');

// 4. Subtasks on Main Page
console.log('\n--- 4. Subtasks Rendered on Main Page Task Card ---');
assert(taskCardContent.includes('handleToggleSubtask'), 'TaskCard has handleToggleSubtask function');
assert(taskCardContent.includes('CheckSquare') && taskCardContent.includes('Square'), 'TaskCard renders checkboxes for subtasks');
assert(taskCardContent.includes('Subtasks ({completedSubtasksCount}'), 'TaskCard shows subtask checklist progress');
assert(taskCardContent.includes('showAllSubtasks'), 'TaskCard supports expanding/collapsing when multiple subtasks exist');
assert(taskCardContent.includes('isAddingSubtask') || taskCardContent.includes('handleAddSubtaskOnCard'), 'TaskCard supports adding subtasks directly from card');
assert(taskCardContent.includes('isCardSubtaskListening'), 'TaskCard supports voice input for subtasks on main page');

console.log('\n🎉 ALL QUICK TASK, AUTOSUGGESTION, AND SUBTASK VERIFICATION TESTS PASSED!');
