import fs from 'fs';
import path from 'path';

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`✅ PASSED: ${message}`);
}

console.log('🎨 Starting Theme & Color Palette Audit...\n');

// 1. Check tailwind.config.js for dynamic CSS variables
const tailwindConfigPath = path.resolve('tailwind.config.js');
const tailwindConfig = fs.readFileSync(tailwindConfigPath, 'utf8');

assert(
  tailwindConfig.includes("500: 'rgb(var(--brand-500) / <alpha-value>)'"),
  'tailwind.config.js defines dynamic brand-500 using rgb(var(--brand-500) / <alpha-value>)'
);
assert(
  tailwindConfig.includes("950: 'rgb(var(--brand-950) / <alpha-value>)'"),
  'tailwind.config.js defines dynamic brand-950'
);
assert(
  tailwindConfig.includes("accent: {"),
  'tailwind.config.js defines accent color palette'
);
assert(
  tailwindConfig.includes("500: 'rgb(var(--accent-500) / <alpha-value>)'"),
  'tailwind.config.js defines dynamic accent-500'
);

// 2. Check src/index.css for complete theme definitions
const indexCssPath = path.resolve('src/index.css');
const indexCss = fs.readFileSync(indexCssPath, 'utf8');

const requiredThemes = ['vibrant', 'ocean', 'sunset', 'forest', 'lavender', 'minimal', 'dark'];
for (const theme of requiredThemes) {
  assert(
    indexCss.includes(`[data-theme='${theme}']`),
    `src/index.css includes definition for [data-theme='${theme}']`
  );
}

assert(
  indexCss.includes(".dark[data-theme='minimal']"),
  'src/index.css includes high-contrast dark mode definition for minimal theme'
);

// Verify RGB triplet presence (space-separated)
assert(
  indexCss.includes('--brand-500: 99 102 241;'),
  'vibrant theme defines --brand-500 triplet (99 102 241)'
);
assert(
  indexCss.includes('--brand-500: 14 165 233;'),
  'ocean theme defines --brand-500 triplet (14 165 233)'
);
assert(
  indexCss.includes('--brand-500: 244 63 94;'),
  'sunset theme defines --brand-500 triplet (244 63 94)'
);
assert(
  indexCss.includes('--brand-500: 16 185 129;'),
  'forest theme defines --brand-500 triplet (16 185 129)'
);
assert(
  indexCss.includes('--brand-500: 139 92 246;'),
  'lavender theme defines --brand-500 triplet (139 92 246)'
);
assert(
  indexCss.includes('--brand-500: 71 85 105;'),
  'minimal theme defines --brand-500 triplet (71 85 105)'
);
assert(
  indexCss.includes('--accent-500: 6 182 212;'),
  'dark/midnight theme defines --accent-500 triplet (6 182 212)'
);

// 3. Check index.html early hydration script
const indexHtmlPath = path.resolve('index.html');
const indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');

assert(
  indexHtml.includes("localStorage.getItem('donezy_theme')"),
  'index.html contains early theme hydration from localStorage to prevent FOUC'
);
assert(
  indexHtml.includes("localStorage.getItem('donezy_dark')"),
  'index.html contains early dark mode hydration from localStorage'
);

// 4. Check SettingsView.tsx
const settingsViewPath = path.resolve('src/components/settings/SettingsView.tsx');
const settingsView = fs.readFileSync(settingsViewPath, 'utf8');

assert(
  settingsView.includes("id: 'dark'"),
  'SettingsView.tsx includes Midnight (dark) theme in THEMES list'
);
assert(
  settingsView.includes("CATEGORY_PALETTE"),
  'SettingsView.tsx includes CATEGORY_PALETTE for quick color swatches'
);
assert(
  settingsView.includes("editingCategory"),
  'SettingsView.tsx supports interactive category color editing'
);

// 5. Check TaskDetailModal.tsx
const taskModalPath = path.resolve('src/components/tasks/TaskDetailModal.tsx');
const taskModal = fs.readFileSync(taskModalPath, 'utf8');

assert(
  taskModal.includes("TASK_PALETTE"),
  'TaskDetailModal.tsx includes TASK_PALETTE for task custom color'
);
assert(
  taskModal.includes("Task Color Highlight"),
  'TaskDetailModal.tsx renders Task Color Highlight palette UI'
);

// 6. Check TaskCard.tsx
const taskCardPath = path.resolve('src/components/tasks/TaskCard.tsx');
const taskCard = fs.readFileSync(taskCardPath, 'utf8');

assert(
  taskCard.includes("task.color || category?.color || 'rgb(var(--brand-500))'"),
  'TaskCard.tsx respects task.color override and dynamic brand fallback'
);

console.log('\n🎉 ALL THEME & COLOR PALETTE VERIFICATION TESTS PASSED!\n');
