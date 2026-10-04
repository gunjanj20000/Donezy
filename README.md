# SmartDay — Premium Smart Todo & Reminder PWA

> **"Capture a task in seconds, without filling forms."**

SmartDay is a production-grade, local-first Progressive Web App (PWA) built with **React 18**, **TypeScript**, **Tailwind CSS**, and **IndexedDB**. It delivers an instant, colorful, friendly, and touch-optimized experience designed to organize your life with minimum typing and zero friction.

---

## ✨ Key Features

### 1. ⚡ Quick Add in Under 5 Seconds
* **Natural Language Parsing**: Type naturally, e.g.:
  * *"Call electrician tomorrow at 10 AM"* ➔ Auto-infers Date (Tomorrow), Time (10:00 AM), Reminder (Active), Category (Home).
  * *"Buy medicine today evening"* ➔ Auto-infers Date (Today), Time (6:30 PM), Category (Health).
  * *"Pay electricity bill on 10th every month"* ➔ Auto-infers Recurrence (Monthly on the 10th), Category (Finance).
  * *"Workout every Monday, Wednesday and Friday at 7 AM"* ➔ Auto-infers Custom Repeat, Time (7:00 AM).
* **One-Tap Quick Presets**: 📞 Call, 🛒 Buy, 💳 Pay, 💊 Medicine, 🏃 Exercise, 📅 Meeting, 👨‍👩‍👧 Family, 🏠 Home, 🚗 Car, 📚 Study.
* **Smart Time Presets**: *Now*, *Later (+2h)*, *Today*, *Tonight (8 PM)*, *Tomorrow (9 AM)*, *This Weekend (Sat 10 AM)*, *Next Week (Mon 9 AM)*, and Custom.
* **Progressive Disclosure**: Keeps the quick-add sheet clean while offering optional priority, recurrence, notes, and subtasks when needed.

### 2. 🎙️ Voice Task Capture
* Prominent microphone button with pulsing sound wave animation.
* Real-time Web Speech recognition converting speech to structured tasks.
* Confirmation preview displaying Task, Date, Time, Reminder, and Category with **[Create]** and **[Edit]** buttons.
* Graceful fallback to typing when microphone permissions or speech APIs are unavailable.

### 3. 📱 Responsive Multi-Device Design
* **Mobile Portrait (320–480px)**:
  * Modern bottom navigation (`Today | Calendar | Tasks | Reminders | More`).
  * Floating Action Button (`＋`) with 56px touch target.
  * Swipe right to complete, swipe left to edit/delete.
* **Mobile Landscape**: Intelligent horizontal space utilization.
* **Tablet / iPad Portrait**: Two-column layout and roomy touch targets.
* **Desktop & Tablet Landscape**:
  * Clean left sidebar with logo, navigation, and shortcuts (`N` for new task, `Cmd/Ctrl + K` for search).
  * Centered workspace with uncluttered card design.
  * Right-side widget panel showcasing **Today's Progress**, **Upcoming Alerts**, and **One-Tap Presets**.
* All interactive touch targets adhere strictly to the **≥ 44 × 44 px** standard.

### 4. 🌅 Today & Home Screen
* Time-aware greeting (*"Good Morning 👋"*, *"Good Afternoon ☀️"*, *"Good Evening 🌆"*, *"Good Night 🌙"*) + current date.
* Compact visual productivity bar: e.g. `7 tasks today ███████░░ 70%`.
* Smart groupings: **OVERDUE**, **HAPPENING NOW**, **TODAY**, and **COMPLETED**.
* Satisfying completion celebration: smooth checkbox check, animated card transition, Web Audio arpeggio chime, haptic vibration, and confetti particle burst.
* Cheerful empty state: *"🎉 You're all caught up! Enjoy your day."*

### 5. 📅 Calendar Screen
* 4 flexible views: **Month**, **Week**, **Day**, and **Agenda** (next 14 days).
* Visual dots indicating task counts and status on calendar days.
* Tap any date to view and filter tasks; schedule directly on that date with one tap.

### 6. ⏰ Reminders & Alarms
* Background ticker monitoring tasks every 20 seconds.
* Active reminder modal with synthesized harmonic bell chime, vibration, and system notifications.
* Quick snooze buttons: `+10m`, `+30m`, `+1 hour`, `Tomorrow`.
* Dedicated reminders screen grouped by *Overdue*, *Today*, *Upcoming*, and *Recurring*.

### 7. 🔄 Recurring Tasks
* Full support for: *Daily*, *Weekly*, *Weekdays* (skips Sat/Sun), *Weekends*, *Monthly* (e.g. 10th of every month), *Yearly*, and *Custom* days of week.
* Recurrence badge `🔄` on cards.
* Completing a recurring task automatically schedules the next occurrence while archiving today's instance.

### 8. 🏃 Lightweight Daily Habits
* Track daily routines (Drink water, Walk, Read, Meditation, Medicine, Exercise, etc.).
* 7-day streak track with interactive one-tap check-ins and subtle celebration feedback.
* Custom habit creator with color and icon selection.

### 9. 📊 Productivity Dashboard & Statistics
* Clean metrics: Completed Today, Completed This Week, Completion Rate, Overdue Count.
* 7-Day Velocity visualizer showing daily completion trends.
* Insights: Most Productive Day and Top Category.

### 10. 🎨 Themes & Customization
* 6 handcrafted palettes: **Vibrant**, **Ocean**, **Sunset**, **Forest**, **Lavender**, **Minimal**.
* Dedicated **Dark Mode** with high-contrast OLED slate background.
* Toggle sound effects, haptic vibration, confetti animations, and reduced motion.
* Time format (12h vs 24h) and start of week preference (Monday vs Sunday).

### 11. 🛡️ Local-First Architecture & Data Safety
* **Zero Remote Server Tracking**: All tasks, categories, habits, and preferences stay on your device in **IndexedDB**.
* Clean repository pattern:
  * `TaskRepository`
  * `CategoryRepository`
  * `HabitRepository`
  * `SettingsRepository`
  * `HistoryRepository`
* **Backup & Restore**: Export your full database as a readable `.json` file. Import anytime with **Merge** or **Replace** modes.

### 12. 🚀 Progressive Web App (PWA)
* Configured with `vite-plugin-pwa` and Service Worker for 100% offline usage.
* Web App Manifest with icons, maskable icons, shortcuts (`Add Task`, `Voice`), and standalone display mode.
* In-app install banner with native `beforeinstallprompt` handling.

---

## 🛠️ Project Structure

```
├── public/
│   ├── favicon.ico
│   ├── pwa-192x192.png
│   ├── pwa-512x512.png
│   ├── apple-touch-icon.png
│   └── smartday-icon.svg
├── scripts/
│   ├── generate-icons.mjs
│   └── test-smartday.mjs
├── src/
│   ├── components/
│   │   ├── calendar/
│   │   │   └── CalendarView.tsx
│   │   ├── common/
│   │   │   ├── FirstRunWelcomeModal.tsx
│   │   │   ├── IconRenderer.tsx
│   │   │   └── PwaInstallPrompt.tsx
│   │   ├── habits/
│   │   │   └── HabitsView.tsx
│   │   ├── layout/
│   │   │   └── AppShell.tsx
│   │   ├── quickadd/
│   │   │   └── QuickAddSheet.tsx
│   │   ├── reminders/
│   │   │   ├── ActiveReminderModal.tsx
│   │   │   └── RemindersView.tsx
│   │   ├── settings/
│   │   │   └── SettingsView.tsx
│   │   ├── statistics/
│   │   │   └── StatisticsView.tsx
│   │   ├── tasks/
│   │   │   ├── TaskCard.tsx
│   │   │   ├── TaskDetailModal.tsx
│   │   │   └── TasksView.tsx
│   │   ├── today/
│   │   │   └── TodayView.tsx
│   │   └── voice/
│   │       └── VoiceInputModal.tsx
│   ├── context/
│   │   └── AppContext.tsx
│   ├── db/
│   │   └── indexedDB.ts
│   ├── repositories/
│   │   ├── CategoryRepository.ts
│   │   ├── HabitRepository.ts
│   │   ├── HistoryRepository.ts
│   │   ├── SettingsRepository.ts
│   │   └── TaskRepository.ts
│   ├── services/
│   │   ├── BackupRestoreService.ts
│   │   ├── NaturalLanguageParser.ts
│   │   └── NotificationService.ts
│   ├── types/
│   │   └── index.ts
│   ├── utils/
│   │   ├── dateUtils.ts
│   │   └── recurrence.ts
│   ├── App.tsx
│   ├── index.css
│   ├── main.tsx
│   └── vite-env.d.ts
├── index.html
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

---

## 🏃 Running the Application

### Development Server
```bash
npm run dev
```

### Production Build & Preview
```bash
npm run build
npm run preview
```

### Run Logic & Parser Tests
```bash
npx tsx scripts/test-smartday.mjs
```
