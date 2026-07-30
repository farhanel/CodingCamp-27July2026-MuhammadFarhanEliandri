# Design Document — To-Do List Dashboard

## Overview

A zero-dependency, single-page web application delivered as three files:

```
index.html       ← structure and markup
css/style.css    ← all visual styling (one file)
js/app.js        ← all interactive behaviour (one file)
```

The App is written in Vanilla JavaScript (ES2020+), relies exclusively on the browser's `localStorage` API for persistence, and requires no build step or server.

---

## Architecture

### High-Level Component Map

```
index.html
└── <body>
    ├── #greeting-panel      ← Greeting, clock, name input
    ├── #timer-panel         ← Pomodoro timer + controls
    ├── #todo-panel          ← Task list + sort controls
    ├── #links-panel         ← Quick Links grid
    └── #settings-bar        ← Theme toggle + name/timer settings
```

`js/app.js` is structured as an IIFE (Immediately Invoked Function Expression) split into focused modules via plain objects / factory functions:

```
app.js
├── StorageManager   ← read/write LocalStorage (all keys centralised)
├── GreetingModule   ← clock, date, greeting text, name display
├── TimerModule      ← countdown logic, start/stop/reset, config
├── TodoModule       ← task CRUD, validation, sorting, persistence
├── LinksModule      ← quick-link CRUD, validation, persistence
└── ThemeModule      ← theme toggle, persistence, icon update
```

Each module exposes an `init()` function called once on `DOMContentLoaded`.

---

## Data Models

All data is stored in `localStorage` as JSON strings.

### Keys

| Key | Type | Description |
|-----|------|-------------|
| `tdd_name` | `string` | Custom greeting name |
| `tdd_pomodoro` | `number` | Timer duration in minutes |
| `tdd_tasks` | `Task[]` | Serialised task array |
| `tdd_links` | `QuickLink[]` | Serialised quick-links array |
| `tdd_theme` | `"light" \| "dark"` | Active colour scheme |

### Task

```javascript
{
  id:        string,   // crypto.randomUUID() or Date.now().toString()
  text:      string,   // trimmed task description
  completed: boolean,  // completion state
  createdAt: number    // Unix timestamp (ms)
}
```

### QuickLink

```javascript
{
  id:    string,  // unique identifier
  label: string,  // display label
  url:   string   // full URL including protocol
}
```

---

## Component Design

### StorageManager

```javascript
const StorageManager = {
  get(key, fallback)   { /* JSON.parse with try/catch, return fallback on failure */ },
  set(key, value)      { /* JSON.stringify, localStorage.setItem */ },
  remove(key)          { /* localStorage.removeItem */ }
};
```

Single source of truth for all LocalStorage access. Parsing errors fall back to the supplied default.

### GreetingModule

- On `init()`: render date string, start `setInterval` every 1000 ms to update clock.
- `getGreeting(hour)` → pure function, returns greeting word based on hour partition:
  - 5–11 → "Good morning"
  - 12–17 → "Good afternoon"
  - 18–20 → "Good evening"
  - 21–4 → "Good night"
- `formatGreeting(word, name)` → returns `"${word}"` or `"${word}, ${name}"` when name is non-empty.
- Name is read from `StorageManager` on init; saved on form submit.

### TimerModule

```
State: { durationSeconds, remainingSeconds, intervalId, running }
```

- `formatTime(seconds)` → pure function returning `"MM:SS"` string.
- `start()`: sets `running = true`, creates `setInterval` decrementing `remainingSeconds` each second.
- `stop()`: clears interval, sets `running = false`.
- `reset()`: calls `stop()`, sets `remainingSeconds = durationSeconds`, re-renders display.
- On reaching 0: calls `stop()`, triggers `Notification` API or `AudioContext` beep.
- Duration change: validates 1–60, saves to `StorageManager`, calls `reset()`.

### TodoModule

```
State: { tasks: Task[], sortOrder: string }
```

- `addTask(text)`:
  1. Trim + empty check → reject if blank.
  2. Case-insensitive duplicate check against existing `tasks[].text` → reject if found.
  3. Create `Task` object, push to `tasks`, persist, render.
- `editTask(id, newText)`: same validation as `addTask` (excluding the task being edited from duplicate check).
- `toggleTask(id)`: flip `completed`, persist, render.
- `deleteTask(id)`: filter out task, persist, render.
- `sortTasks(order)`: returns a sorted copy without mutating `tasks` (sort only affects render order).
- Supported sort orders: `default`, `alpha-asc`, `alpha-desc`, `completed-last`, `completed-first`.
- Render: maps `tasks` (sorted copy) to `<li>` elements with checkbox, label, edit button, delete button.

### LinksModule

```
State: { links: QuickLink[] }
```

- `addLink(label, url)`:
  1. Empty check on both fields → reject if either is blank.
  2. URL format check: must start with `http://` or `https://` → reject otherwise.
  3. Create `QuickLink`, push, persist, render.
- `deleteLink(id)`: filter out, persist, render.
- Links render as `<button>` or `<a target="_blank">` elements in a flex grid.

### ThemeModule

- Toggles `data-theme="dark"` attribute on `<html>` element.
- CSS uses `[data-theme="dark"]` selector overrides.
- `getThemeLabel(theme)` → `"🌙 Dark mode"` when light, `"☀️ Light mode"` when dark.
- Persists to `StorageManager` on toggle; restores on `init()` before first paint (script runs in `<head>` or inline script before body renders) to prevent flash.

---

## Interface Design (HTML Structure)

```html
<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Dashboard</title>
  <link rel="stylesheet" href="css/style.css" />
  <script>
    /* Inline theme restore to prevent flash */
    const t = localStorage.getItem('tdd_theme');
    if (t === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
  </script>
</head>
<body>
  <header id="settings-bar">
    <!-- Theme toggle button, name input, pomodoro duration input -->
  </header>

  <main>
    <section id="greeting-panel">
      <!-- Date, time, greeting text -->
    </section>

    <section id="timer-panel">
      <!-- Timer display (MM:SS), Start / Stop / Reset buttons -->
    </section>

    <section id="todo-panel">
      <!-- Add-task input + button, sort select, task list <ul> -->
    </section>

    <section id="links-panel">
      <!-- Add-link form, links grid -->
    </section>
  </main>

  <script src="js/app.js"></script>
</body>
</html>
```

---

## CSS Design

- CSS custom properties (variables) for colours, declared in `:root` and overridden in `[data-theme="dark"]`.
- Layout: CSS Flexbox for the main two-column layout (greeting + timer on left; todo + links on right on wider screens). Single column on mobile.
- Typography: system font stack (`-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`).
- Visual hierarchy: clear heading sizes, muted secondary text, high-contrast action buttons.
- Completed tasks: `text-decoration: line-through` + reduced opacity.
- Theme tokens example:

```css
:root {
  --bg:          #f8f9fa;
  --surface:     #ffffff;
  --text:        #212529;
  --text-muted:  #6c757d;
  --accent:      #4361ee;
  --danger:      #e63946;
  --border:      #dee2e6;
}

[data-theme="dark"] {
  --bg:          #121212;
  --surface:     #1e1e1e;
  --text:        #e9ecef;
  --text-muted:  #adb5bd;
  --accent:      #6a8bff;
  --danger:      #ff6b6b;
  --border:      #333333;
}
```

---

## Error Handling

| Scenario | Behaviour |
|----------|-----------|
| Task text is blank / whitespace | Inline `<span class="error">` shown below input; submission blocked |
| Duplicate task (case-insensitive) | Inline duplicate-warning message; submission blocked |
| Invalid Pomodoro duration (< 1 or > 60) | Inline validation message; value not saved |
| Quick Link missing label or URL | Inline validation message; link not added |
| Quick Link URL missing protocol | Inline validation message; link not added |
| `localStorage` read parse error | `StorageManager.get()` catches exception and returns supplied fallback |
| `localStorage` write quota exceeded | Error caught; user notified via status message |
| Notification API not available | Silent fallback to `AudioContext` beep; if neither available, visual flash on timer display |

---

## Correctness Properties

*A property is a characteristic or behaviour that should hold true across all valid executions of the system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Greeting time partition is exhaustive and non-overlapping

For any integer hour in the range 0–23, `getGreeting(hour)` SHALL return exactly one of "Good morning", "Good afternoon", "Good evening", or "Good night", and no two adjacent hours on either side of a boundary SHALL return the same greeting word.

**Validates: Requirements 2.3, 2.4, 2.5, 2.6**

---

### Property 2: Greeting name interpolation

For any non-empty name string `n` and any greeting word `w`, `formatGreeting(w, n)` SHALL return a string that contains both `w` and `n`. For the empty name, `formatGreeting(w, "")` SHALL return exactly `w` with no trailing comma or space.

**Validates: Requirements 2.7**

---

### Property 3: Timer display format

For any integer number of seconds `s` in the range 0–3599, `formatTime(s)` SHALL return a string matching the regular expression `^\d{2}:\d{2}$` and the numerical values SHALL equal `Math.floor(s / 60)` for minutes and `s % 60` for seconds.

**Validates: Requirements 3.3**

---

### Property 4: Pomodoro duration validation

For any integer `n`, `isValidDuration(n)` SHALL return `true` if and only if `1 ≤ n ≤ 60`. For any non-integer or non-numeric input, it SHALL return `false`.

**Validates: Requirements 3.7, 3.10**

---

### Property 5: Task creation — empty and whitespace rejection

For any string composed entirely of whitespace characters (including the empty string), `addTask(text)` SHALL not increase the length of the task list and SHALL return an error indicator.

**Validates: Requirements 4.2**

---

### Property 6: Task creation — duplicate rejection

For any task list containing a task with description `d`, calling `addTask(t)` where `t.trim().toLowerCase() === d.trim().toLowerCase()` SHALL not increase the length of the task list and SHALL return a duplicate-error indicator.

**Validates: Requirements 4.3**

---

### Property 7: Task completion toggle is its own inverse

For any task `T` in any task list, calling `toggleTask(T.id)` twice SHALL leave `T.completed` in its original state — i.e., `toggle(toggle(T)) === T`.

**Validates: Requirements 4.4**

---

### Property 8: Task deletion removes exactly one task

For any task list of length `n` containing a task with id `id`, calling `deleteTask(id)` SHALL produce a list of length `n - 1` that contains no task with that `id`.

**Validates: Requirements 4.7**

---

### Property 9: Task list LocalStorage round-trip

For any array of `Task` objects `tasks`, after `StorageManager.set('tdd_tasks', tasks)`, calling `StorageManager.get('tdd_tasks', [])` SHALL return an array deeply equal to `tasks`.

**Validates: Requirements 4.8, 4.9**

---

### Property 10: Sort order correctness

For any task list and each of the five supported sort orders, `sortTasks(order, tasks)` SHALL return a list containing exactly the same tasks as the input (same length, same ids) where every adjacent pair satisfies the sort criterion for that order.

**Validates: Requirements 4.10, 4.11**

---

### Property 11: Quick link input validation

For any quick link submission where `label` is empty or `url` is empty or `url` does not start with `http://` or `https://`, `addLink(label, url)` SHALL not increase the length of the links list and SHALL return an error indicator.

**Validates: Requirements 5.2, 5.3**

---

### Property 12: Quick link LocalStorage round-trip

For any array of `QuickLink` objects `links`, after `StorageManager.set('tdd_links', links)`, calling `StorageManager.get('tdd_links', [])` SHALL return an array deeply equal to `links`.

**Validates: Requirements 5.6, 5.7**

---

### Property 13: Theme toggle label correctness

For any theme value `t` in `{ "light", "dark" }`, `getThemeLabel(t)` SHALL return a non-empty string, and the two results for "light" and "dark" SHALL be distinct strings.

**Validates: Requirements 6.5, 6.6**

---

### Property 14: Theme LocalStorage round-trip

For any theme value `t` in `{ "light", "dark" }`, after `StorageManager.set('tdd_theme', t)`, calling `StorageManager.get('tdd_theme', 'light')` SHALL return `t`.

**Validates: Requirements 6.3, 6.4**

---

### Property 15: Name and duration LocalStorage round-trip

For any non-empty name string `n`, after `StorageManager.set('tdd_name', n)`, calling `StorageManager.get('tdd_name', '')` SHALL return `n`. For any valid duration integer `d`, after `StorageManager.set('tdd_pomodoro', d)`, calling `StorageManager.get('tdd_pomodoro', 25)` SHALL return `d`.

**Validates: Requirements 2.8, 2.9, 3.8, 3.9, 7.2, 7.4**