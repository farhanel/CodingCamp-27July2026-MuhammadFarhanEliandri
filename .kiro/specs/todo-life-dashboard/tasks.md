# Implementation Plan: To-Do List Dashboard

## Overview

Implement a zero-dependency, single-page dashboard in plain HTML, CSS, and Vanilla JavaScript. Work proceeds from static structure → styling foundation → StorageManager → individual feature modules → wiring and integration. Each task builds directly on the previous and ends with everything connected into the final deliverable.

---

## Tasks

- [x] 1. Create project file structure and HTML skeleton
  - Create `index.html` with semantic sections: `#settings-bar`, `#greeting-panel`, `#timer-panel`, `#todo-panel`, `#links-panel`
  - Add inline theme-restore script in `<head>` (reads `tdd_theme` from localStorage before first paint)
  - Link `css/style.css` and `js/app.js`
  - Create empty `css/style.css` and `js/app.js` placeholder files
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 2. Implement CSS foundation and theme system
  - [x] 2.1 Define CSS custom properties and layout
    - Declare all colour tokens (`--bg`, `--surface`, `--text`, `--text-muted`, `--accent`, `--danger`, `--border`) in `:root`
    - Add `[data-theme="dark"]` overrides for all tokens
    - Implement two-column Flexbox layout for desktop and single-column fallback for mobile via `@media`
    - Style typography with system font stack, clear heading sizes, and readable line heights
    - _Requirements: 6.1, 6.2, NFR-3_

  - [x] 2.2 Style all panel components and interactive states
    - Style `#greeting-panel`, `#timer-panel`, `#todo-panel`, `#links-panel`, `#settings-bar` using surface tokens
    - Style buttons, inputs, select dropdowns, and error/warning inline messages
    - Add `.completed` rule with `text-decoration: line-through` and reduced opacity
    - Style Quick Links grid as a flex-wrap container of link buttons
    - _Requirements: 4.4, NFR-3_

- [x] 3. Implement StorageManager
  - [x] 3.1 Write StorageManager module
    - Implement `StorageManager.get(key, fallback)` — JSON.parse with try/catch, returns fallback on any error
    - Implement `StorageManager.set(key, value)` — JSON.stringify + localStorage.setItem, catches quota errors
    - Implement `StorageManager.remove(key)`
    - Define all key constants: `tdd_name`, `tdd_pomodoro`, `tdd_tasks`, `tdd_links`, `tdd_theme`
    - _Requirements: 2.9, 3.9, 4.9, 5.7, 6.4, 7.4_

  - [ ]* 3.2 Write property tests for StorageManager round-trips
    - **Property 9: Task list LocalStorage round-trip** — for any Task array, set then get returns deeply equal array
    - **Property 12: Quick link LocalStorage round-trip**
    - **Property 14: Theme LocalStorage round-trip**
    - **Property 15: Name and duration LocalStorage round-trip**
    - **Validates: Requirements 2.8, 2.9, 3.8, 3.9, 4.8, 4.9, 5.6, 5.7, 6.3, 6.4, 7.2, 7.4**

- [x] 4. Implement ThemeModule
  - [x] 4.1 Write ThemeModule
    - Implement `getThemeLabel(theme)` — returns distinct labels for "light" and "dark"
    - Implement `toggle()` — flips `data-theme` on `<html>`, updates button label, persists via StorageManager
    - Implement `init()` — reads saved theme from StorageManager, applies to DOM, sets correct label
    - Wire toggle button click handler
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

  - [ ]* 4.2 Write property test for theme label correctness
    - **Property 13: Theme toggle label correctness** — `getThemeLabel("light")` and `getThemeLabel("dark")` return distinct non-empty strings
    - **Validates: Requirements 6.5, 6.6**

- [x] 5. Implement GreetingModule
  - [x] 5.1 Write GreetingModule
    - Implement `getGreeting(hour)` — pure function returning greeting word for hours 0–23
    - Implement `formatGreeting(word, name)` — returns word alone or "word, name" when name is non-empty
    - Implement `init()` — renders current date string, starts `setInterval` every 1000 ms to update clock and greeting, restores saved name via StorageManager
    - Wire name-save form: trim input, save to StorageManager, update greeting display immediately
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 7.1, 7.2_

  - [ ]* 5.2 Write property tests for greeting functions
    - **Property 1: Greeting time partition** — for every hour 0–23, `getGreeting(hour)` returns one of the four expected strings with no gaps or overlaps
    - **Property 2: Greeting name interpolation** — for any non-empty name and greeting word, `formatGreeting` output contains both; for empty name returns word only
    - **Validates: Requirements 2.3, 2.4, 2.5, 2.6, 2.7**

- [x] 6. Implement TimerModule
  - [x] 6.1 Write TimerModule core logic
    - Implement `formatTime(seconds)` — pure function returning "MM:SS" from integer seconds
    - Implement `start()`, `stop()`, `reset()` using internal state `{ durationSeconds, remainingSeconds, intervalId, running }`
    - On timer reaching 0: auto-stop, attempt `Notification` API, fall back to `AudioContext` beep, fall back to visual flash
    - Implement `init()` — reads saved duration from StorageManager (default 25), renders initial display, binds Start/Stop/Reset buttons
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.9_

  - [ ]* 6.2 Write property test for timer display format
    - **Property 3: Timer display format** — for any integer seconds 0–3599, `formatTime(s)` matches `^\d{2}:\d{2}$` with correct minute and second values
    - **Validates: Requirements 3.3**

  - [x] 6.3 Implement Pomodoro duration configuration
    - Implement `isValidDuration(n)` — returns true iff `Number.isInteger(n) && n >= 1 && n <= 60`
    - Wire duration input form: validate on submit, show inline error if invalid, otherwise save via StorageManager and call `reset()`
    - _Requirements: 3.7, 3.8, 3.9, 3.10, 7.3, 7.4_

  - [ ]* 6.4 Write property test for duration validation
    - **Property 4: Pomodoro duration validation** — `isValidDuration(n)` returns true iff `1 ≤ n ≤ 60`; non-integers and out-of-range values return false
    - **Validates: Requirements 3.7, 3.10**

- [x] 7. Checkpoint — core modules
  - Ensure StorageManager, ThemeModule, GreetingModule, and TimerModule all initialise without errors. Ask the user if any questions arise before continuing.

- [x] 8. Implement TodoModule
  - [x] 8.1 Write task validation and CRUD functions
    - Implement `isBlankText(text)` — returns true for empty or whitespace-only strings
    - Implement `isDuplicate(text, tasks, excludeId?)` — case-insensitive trim comparison against existing tasks
    - Implement `addTask(text)` — validate blank and duplicate, create Task object with `crypto.randomUUID()`, push to state, persist, re-render
    - Implement `editTask(id, newText)` — same validation (passing `excludeId = id` to duplicate check), update text, persist, re-render
    - Implement `toggleTask(id)` — flip `completed`, persist, re-render
    - Implement `deleteTask(id)` — filter out, persist, re-render
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8_

  - [ ]* 8.2 Write property tests for task validation
    - **Property 5: Task creation — empty and whitespace rejection** — for any whitespace-only string, `addTask` leaves list length unchanged
    - **Property 6: Task creation — duplicate rejection** — for any task in the list, adding a case-insensitively equal text leaves list length unchanged
    - **Validates: Requirements 4.2, 4.3**

  - [ ]* 8.3 Write property tests for task mutation
    - **Property 7: Task completion toggle is its own inverse** — `toggleTask` twice restores original `completed` state
    - **Property 8: Task deletion removes exactly one task** — after `deleteTask(id)`, list length is `n-1` and no task with that id remains
    - **Validates: Requirements 4.4, 4.7**

  - [x] 8.4 Implement task sorting and rendering
    - Implement `sortTasks(order, tasks)` — returns sorted copy for orders: `default`, `alpha-asc`, `alpha-desc`, `completed-last`, `completed-first`
    - Implement `renderTasks()` — maps sorted task copy to `<li>` elements with checkbox, label (with `.completed` class when done), edit button, delete button
    - Implement `init()` — restores tasks from StorageManager, binds add-task form and sort select, renders list
    - _Requirements: 4.9, 4.10, 4.11_

  - [ ]* 8.5 Write property test for sort correctness
    - **Property 10: Sort order correctness** — for any task list and each of the five sort orders, `sortTasks` returns same tasks in valid sorted order
    - **Validates: Requirements 4.10, 4.11**

- [x] 9. Implement LinksModule
  - [x] 9.1 Write link validation and CRUD functions
    - Implement `isValidUrl(url)` — returns true iff url starts with `http://` or `https://`
    - Implement `addLink(label, url)` — validate empty fields and URL format, create QuickLink object, push to state, persist, re-render
    - Implement `deleteLink(id)` — filter out, persist, re-render
    - Implement `renderLinks()` — maps links to `<a target="_blank">` elements with delete button
    - Implement `init()` — restores links from StorageManager, binds add-link form, renders grid
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_

  - [ ]* 9.2 Write property test for link validation
    - **Property 11: Quick link input validation** — for any submission where label is empty, url is empty, or url lacks http/https prefix, `addLink` leaves list length unchanged
    - **Validates: Requirements 5.2, 5.3**

- [x] 10. Wire all modules and finalise index.html markup
  - [x] 10.1 Complete index.html with full markup for all panels
    - Fill in all form controls, buttons, `<ul>` containers, and display elements referenced by each module
    - Ensure all element IDs and classes match those used in app.js
    - Verify inline theme-restore script is in `<head>` before the stylesheet link
    - _Requirements: 1.1, 1.4, 1.5_

  - [x] 10.2 Wire module initialisation in app.js
    - Call `ThemeModule.init()`, `GreetingModule.init()`, `TimerModule.init()`, `TodoModule.init()`, `LinksModule.init()` inside a single `DOMContentLoaded` listener
    - Confirm all event listeners are attached after DOM is ready
    - _Requirements: 2.9, 3.9, 4.9, 5.7, 6.4, 7.4_

- [x] 11. Final checkpoint — full integration
  - Open `index.html` as a local file in a browser. Verify greeting, timer, tasks, links, and theme all load from a populated localStorage without errors. Ensure all tests pass. Ask the user if questions arise.

---

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP delivery
- No test framework is required per NFR-1; property and unit tests can be written as plain JS functions in a separate `tests/` folder or console-executed snippets
- All five sort orders must be implemented before the sort select can be wired up (8.4 depends on 8.1)
- The inline theme-restore script in `<head>` must run before `css/style.css` is applied to prevent a light-flash on dark-mode reload

---

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1"] },
    { "id": 1, "tasks": ["2.1", "3.1"] },
    { "id": 2, "tasks": ["2.2", "3.2", "4.1"] },
    { "id": 3, "tasks": ["4.2", "5.1"] },
    { "id": 4, "tasks": ["5.2", "6.1"] },
    { "id": 5, "tasks": ["6.2", "6.3"] },
    { "id": 6, "tasks": ["6.4", "8.1"] },
    { "id": 7, "tasks": ["8.2", "8.3", "8.4", "9.1"] },
    { "id": 8, "tasks": ["8.5", "9.2", "10.1"] },
    { "id": 9, "tasks": ["10.2"] }
  ]
}
```