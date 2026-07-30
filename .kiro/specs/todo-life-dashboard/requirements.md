# Requirements Document

## Introduction

A self-contained To-Do List Dashboard delivered as a single-page web application using HTML, CSS, and Vanilla JavaScript. All data is persisted via the browser's Local Storage API with no backend server. The dashboard combines a greeting panel, a Pomodoro-style focus timer, a task manager, quick-link shortcuts, and personalisation controls into one clean, responsive interface that works across modern browsers.

## Glossary

- **Dashboard**: The single HTML page (`index.html`) that hosts all features.
- **App**: The Vanilla JavaScript module (`js/app.js`) that drives all interactive behaviour.
- **Stylesheet**: The single CSS file (`css/style.css`) responsible for all visual styling.
- **LocalStorage**: The browser's `window.localStorage` API used for all client-side data persistence.
- **Task**: A user-created work item that can be added, edited, marked complete, or deleted.
- **Quick Link**: A user-defined bookmark entry consisting of a label and a URL.
- **Pomodoro Timer**: A countdown timer defaulting to 25 minutes, configurable by the user.
- **Theme**: The current colour scheme of the Dashboard, either Light or Dark.
- **Greeting**: A time-sensitive salutation displayed with the current date and time.
- **Duplicate Task**: A Task whose description, after trimming whitespace, matches an existing Task description using a case-insensitive comparison.

---

## Requirements

### Requirement 1 — Project Structure

**User Story:** As a developer, I want a clearly defined file structure, so that the project is easy to navigate and maintain.

#### Acceptance Criteria

1. THE Dashboard SHALL be delivered as exactly one HTML file named `index.html` at the project root.
2. THE Stylesheet SHALL be the only CSS file and SHALL reside at `css/style.css`.
3. THE App SHALL be the only JavaScript file and SHALL reside at `js/app.js`.
4. THE Dashboard SHALL load correctly as a local file opened in a browser without requiring a web server.
5. THE Dashboard SHALL load correctly in the latest stable versions of Chrome, Firefox, Edge, and Safari.

---

### Requirement 2 — Greeting Panel

**User Story:** As a user, I want to see a personalised greeting with the current time and date, so that the dashboard feels contextual and welcoming.

#### Acceptance Criteria

1. WHEN the Dashboard loads, THE App SHALL display the current date in a human-readable format (e.g., "Monday, 27 July 2026").
2. WHEN the Dashboard loads, THE App SHALL display the current time updating every second to reflect live clock changes.
3. WHEN the current hour is between 05:00 and 11:59 inclusive, THE App SHALL display the greeting "Good morning".
4. WHEN the current hour is between 12:00 and 17:59 inclusive, THE App SHALL display the greeting "Good afternoon".
5. WHEN the current hour is between 18:00 and 20:59 inclusive, THE App SHALL display the greeting "Good evening".
6. WHEN the current hour is between 21:00 and 04:59 inclusive, THE App SHALL display the greeting "Good night".
7. WHERE a custom name has been saved, THE App SHALL append the saved name to the greeting (e.g., "Good morning, Sultan").
8. WHEN a user enters and saves a custom name, THE App SHALL persist the name to LocalStorage and display it immediately.
9. WHEN the Dashboard loads and a custom name exists in LocalStorage, THE App SHALL restore and display that name without user interaction.

---

### Requirement 3 — Focus Timer

**User Story:** As a user, I want a configurable countdown timer, so that I can work in focused Pomodoro sessions.

#### Acceptance Criteria

1. THE App SHALL initialise the timer to 25 minutes (1500 seconds) by default on first load.
2. WHEN a user clicks the Start button, THE App SHALL begin counting down the timer one second at a time.
3. WHILE the timer is running, THE App SHALL display the remaining time in MM:SS format, updating every second.
4. WHEN a user clicks the Stop button, THE App SHALL pause the countdown and retain the remaining time.
5. WHEN a user clicks the Reset button, THE App SHALL reset the countdown to the currently configured duration.
6. WHEN the timer reaches 00:00, THE App SHALL stop automatically and notify the user with a browser notification or an audible beep.
7. WHEN a user changes the Pomodoro duration, THE App SHALL accept an integer number of minutes between 1 and 60 inclusive.
8. WHEN a user saves a new Pomodoro duration, THE App SHALL persist it to LocalStorage and reset the timer to the new duration immediately.
9. WHEN the Dashboard loads and a saved Pomodoro duration exists in LocalStorage, THE App SHALL restore that duration as the default timer value.
10. IF a user attempts to save a Pomodoro duration outside the range of 1–60 minutes, THEN THE App SHALL reject the input and display an inline validation message.

---

### Requirement 4 — To-Do List

**User Story:** As a user, I want to manage a list of tasks, so that I can track and organise my work.

#### Acceptance Criteria

1. WHEN a user types a task description and submits it, THE App SHALL create a new Task and append it to the task list.
2. IF a user submits a task description that is empty or contains only whitespace, THEN THE App SHALL prevent creation and display an inline error message.
3. IF a user submits a task description that, after trimming and case-insensitive comparison, matches an existing Task, THEN THE App SHALL prevent creation and display a duplicate-warning message.
4. WHEN a user marks a Task as complete, THE App SHALL toggle the Task's completion state and apply a visual strikethrough style.
5. WHEN a user clicks the edit action on a Task, THE App SHALL present an inline edit field pre-filled with the current task description.
6. WHEN a user saves an edited Task description, THE App SHALL apply the same empty-string and duplicate-prevention rules as task creation.
7. WHEN a user deletes a Task, THE App SHALL remove the Task from the list immediately.
8. WHEN the task list changes (add, edit, complete, delete), THE App SHALL persist the full task list to LocalStorage immediately.
9. WHEN the Dashboard loads, THE App SHALL restore all Tasks from LocalStorage and render them in their saved state.
10. WHEN a user selects a sort order, THE App SHALL re-render the task list sorted by that criterion without altering the stored data.
11. THE App SHALL support at least the following sort orders: "Default (creation order)", "Alphabetical A–Z", "Alphabetical Z–A", "Completed last", "Completed first".

---

### Requirement 5 — Quick Links

**User Story:** As a user, I want to save and open favourite website links, so that I can navigate quickly without leaving the dashboard.

#### Acceptance Criteria

1. WHEN a user adds a Quick Link with a label and a URL, THE App SHALL append it to the Quick Links panel.
2. IF a user submits a Quick Link with an empty label or an empty URL, THEN THE App SHALL prevent creation and display an inline validation message.
3. IF a user submits a Quick Link URL that does not match a valid URL format (must include `http://` or `https://`), THEN THE App SHALL prevent creation and display an inline validation message.
4. WHEN a user clicks a Quick Link button, THE App SHALL open the associated URL in a new browser tab.
5. WHEN a user deletes a Quick Link, THE App SHALL remove it from the panel immediately.
6. WHEN the Quick Links list changes (add, delete), THE App SHALL persist the full Quick Links list to LocalStorage immediately.
7. WHEN the Dashboard loads, THE App SHALL restore all Quick Links from LocalStorage and render them.

---

### Requirement 6 — Theme Toggle

**User Story:** As a user, I want to switch between Light and Dark mode, so that I can use the dashboard comfortably in different lighting conditions.

#### Acceptance Criteria

1. THE Dashboard SHALL default to Light mode on first load.
2. WHEN a user toggles the theme, THE Stylesheet SHALL apply a Dark colour scheme across all Dashboard components.
3. WHEN a user toggles the theme, THE App SHALL persist the selected theme to LocalStorage.
4. WHEN the Dashboard loads and a saved theme exists in LocalStorage, THE App SHALL restore that theme without a flash of the default theme.
5. WHILE Dark mode is active, THE App SHALL display appropriate label or icon indicating that clicking will switch to Light mode.
6. WHILE Light mode is active, THE App SHALL display appropriate label or icon indicating that clicking will switch to Dark mode.

---

### Requirement 7 — Personalisation

**User Story:** As a user, I want to personalise the dashboard with my name and timer preferences, so that the experience feels tailored to me.

#### Acceptance Criteria

1. THE App SHALL provide an input field for the user to enter a custom name used in the Greeting.
2. WHEN a user saves a custom name, THE App SHALL persist it to LocalStorage (see also Requirement 2.8).
3. THE App SHALL provide an input field for the user to change the Pomodoro duration (see also Requirement 3.7–3.10).
4. WHEN the Dashboard loads, THE App SHALL restore all personalisation settings from LocalStorage without user interaction.