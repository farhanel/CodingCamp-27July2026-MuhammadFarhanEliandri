/* js/app.js — To-Do List Dashboard application logic */

(function () {
  'use strict';

  // ── StorageManager ─────────────────────────────────────────────────────────
  // Central access point for all localStorage reads and writes.
  // All keys are defined here to avoid magic strings scattered throughout.

  const KEYS = {
    NAME:     'tdd_name',
    POMODORO: 'tdd_pomodoro',
    TASKS:    'tdd_tasks',
    LINKS:    'tdd_links',
    THEME:    'tdd_theme'
  };

  const StorageManager = {
    /**
     * Read and JSON-parse a value from localStorage.
     * Returns `fallback` if the key is missing or parsing fails.
     *
     * @param {string} key
     * @param {*} fallback
     * @returns {*}
     */
    get(key, fallback) {
      try {
        const raw = localStorage.getItem(key);
        if (raw === null) return fallback;
        return JSON.parse(raw);
      } catch (_err) {
        return fallback;
      }
    },

    /**
     * JSON-stringify `value` and write it to localStorage.
     * Catches QuotaExceededError and logs a warning without crashing the app.
     *
     * @param {string} key
     * @param {*} value
     */
    set(key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch (err) {
        if (
          err instanceof DOMException &&
          (err.name === 'QuotaExceededError' ||
            err.name === 'NS_ERROR_DOM_QUOTA_REACHED')
        ) {
          console.warn(
            '[StorageManager] localStorage quota exceeded — could not save key:',
            key
          );
          // Surface a brief status notification if the status bar element exists
          const statusEl = document.getElementById('storage-status');
          if (statusEl) {
            statusEl.textContent = 'Storage full — some data could not be saved.';
            statusEl.hidden = false;
            setTimeout(() => {
              statusEl.hidden = true;
            }, 4000);
          }
        } else {
          throw err;
        }
      }
    },

    /**
     * Remove a single key from localStorage.
     *
     * @param {string} key
     */
    remove(key) {
      localStorage.removeItem(key);
    }
  };

  // ── GreetingModule ────────────────────────────────────────────────────────
  const GreetingModule = {
    _intervalId: null,

    /**
     * Returns the appropriate greeting word for a given hour (0–23).
     * - 5–11  → "Good morning"
     * - 12–17 → "Good afternoon"
     * - 18–20 → "Good evening"
     * - 21–4  → "Good night"
     *
     * @param {number} hour — integer 0–23
     * @returns {string}
     */
    getGreeting(hour) {
      if (hour >= 5 && hour <= 11) return 'Good morning';
      if (hour >= 12 && hour <= 17) return 'Good afternoon';
      if (hour >= 18 && hour <= 20) return 'Good evening';
      return 'Good night';
    },

    /**
     * Combines a greeting word with an optional name.
     * Returns "word" when name is empty/whitespace-only,
     * or "word, name" when name is non-empty.
     *
     * @param {string} word
     * @param {string} name
     * @returns {string}
     */
    formatGreeting(word, name) {
      const trimmed = (name || '').trim();
      return trimmed ? `${word}, ${trimmed}` : word;
    },

    /**
     * Updates clock, date and greeting DOM elements to reflect the current time.
     * Called once immediately and then every second via setInterval.
     */
    _render() {
      const now = new Date();

      // Clock: HH:MM:SS
      const h = String(now.getHours()).padStart(2, '0');
      const m = String(now.getMinutes()).padStart(2, '0');
      const s = String(now.getSeconds()).padStart(2, '0');
      const clockEl = document.getElementById('clock-display');
      if (clockEl) clockEl.textContent = `${h}:${m}:${s}`;

      // Date: e.g. "Monday, 27 July 2026"
      const dateEl = document.getElementById('date-display');
      if (dateEl) {
        dateEl.textContent = now.toLocaleDateString('en-GB', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        });
      }

      // Greeting with optional saved name
      const name = StorageManager.get(KEYS.NAME, '');
      const word = this.getGreeting(now.getHours());
      const greetEl = document.getElementById('greeting-text');
      if (greetEl) greetEl.textContent = this.formatGreeting(word, name);
    },

    /**
     * Initialises the greeting panel:
     * - Renders current date/time/greeting immediately.
     * - Starts a 1-second interval to keep the clock live.
     * - Restores any previously saved name into the name input.
     * - Wires the save button (and Enter key) to persist and re-render.
     */
    init() {
      this._render();
      this._intervalId = setInterval(() => this._render(), 1000);

      // Restore saved name into the input field
      const savedName = StorageManager.get(KEYS.NAME, '');
      const nameInput = document.getElementById('name-input');
      if (nameInput) nameInput.value = savedName;

      // Wire save button
      const saveBtn = document.getElementById('name-save');
      if (saveBtn) {
        saveBtn.addEventListener('click', () => {
          const val = (nameInput ? nameInput.value : '').trim();
          StorageManager.set(KEYS.NAME, val);
          this._render();
        });
      }

      // Also trigger save on Enter key inside the name input
      if (nameInput) {
        nameInput.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') saveBtn && saveBtn.click();
        });
      }
    }
  };

  // ── TimerModule ───────────────────────────────────────────────────────────
  const TimerModule = {
    _state: {
      durationSeconds:  25 * 60,
      remainingSeconds: 25 * 60,
      intervalId:       null,
      running:          false
    },

    /**
     * Returns true iff n is an integer in the range 1–60 inclusive.
     * @param {*} n
     * @returns {boolean}
     */
    isValidDuration(n) {
      return Number.isInteger(n) && n >= 1 && n <= 60;
    },

    /**
     * Pure function: converts an integer number of seconds into "MM:SS" format.
     * @param {number} seconds
     * @returns {string}
     */
    formatTime(seconds) {
      const m = Math.floor(seconds / 60);
      const s = seconds % 60;
      return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    },

    /** Updates the #timer-display element with the current remaining time. */
    _render() {
      const el = document.getElementById('timer-display');
      if (el) el.textContent = this.formatTime(this._state.remainingSeconds);
    },

    /**
     * Notifies the user that the session is complete.
     * Priority: Notification API → AudioContext beep → visual flash on #timer-display.
     */
    _notify() {
      // 1. Try Notification API
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Focus session complete!', {
          body: 'Great work — take a short break.',
          icon: ''
        });
      } else if ('Notification' in window && Notification.permission !== 'denied') {
        Notification.requestPermission().then(perm => {
          if (perm === 'granted') {
            new Notification('Focus session complete!', {
              body: 'Great work — take a short break.'
            });
          }
        });
      }

      // 2. AudioContext beep fallback
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc  = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.value = 880;
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 1);
      } catch (_e) {
        // 3. Visual flash fallback
        const el = document.getElementById('timer-display');
        if (el) {
          el.classList.add('flash');
          setTimeout(() => el.classList.remove('flash'), 2500);
        }
      }
    },

    /**
     * Starts the countdown. No-op if already running.
     * Decrements remainingSeconds every second; auto-stops and notifies at 0.
     */
    start() {
      if (this._state.running) return;
      this._state.running = true;
      this._state.intervalId = setInterval(() => {
        this._state.remainingSeconds -= 1;
        this._render();
        if (this._state.remainingSeconds <= 0) {
          this.stop();
          this._notify();
        }
      }, 1000);
    },

    /**
     * Pauses the countdown, retaining the remaining time.
     */
    stop() {
      clearInterval(this._state.intervalId);
      this._state.intervalId = null;
      this._state.running = false;
    },

    /**
     * Stops the countdown and resets remaining time to the configured duration.
     */
    reset() {
      this.stop();
      this._state.remainingSeconds = this._state.durationSeconds;
      this._render();
    },

    /**
     * Reads saved duration from StorageManager (default 25 min),
     * renders the initial display, and wires Start / Stop / Reset buttons.
     */
    init() {
      const saved = StorageManager.get(KEYS.POMODORO, 25);
      this._state.durationSeconds  = saved * 60;
      this._state.remainingSeconds = saved * 60;
      this._render();

      const startBtn = document.getElementById('timer-start');
      const stopBtn  = document.getElementById('timer-stop');
      const resetBtn = document.getElementById('timer-reset');
      if (startBtn) startBtn.addEventListener('click', () => this.start());
      if (stopBtn)  stopBtn.addEventListener('click',  () => this.stop());
      if (resetBtn) resetBtn.addEventListener('click', () => this.reset());

      // Wire Pomodoro duration input
      const durationInput = document.getElementById('timer-duration-input');
      const durationSave  = document.getElementById('timer-duration-save');
      const durationError = document.getElementById('timer-duration-error');

      // Pre-fill the input with the saved duration
      if (durationInput) durationInput.value = saved;

      const applyDuration = () => {
        const raw = durationInput ? parseInt(durationInput.value, 10) : NaN;
        if (!this.isValidDuration(raw)) {
          if (durationError) {
            durationError.textContent = 'Please enter a number between 1 and 60.';
            durationError.hidden = false;
          }
          return;
        }
        if (durationError) {
          durationError.textContent = '';
          durationError.hidden = true;
        }
        this._state.durationSeconds = raw * 60;
        StorageManager.set(KEYS.POMODORO, raw);
        this.reset();
      };

      if (durationSave) durationSave.addEventListener('click', applyDuration);
      if (durationInput) {
        durationInput.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') applyDuration();
        });
      }
    }
  };

  // ── TodoModule ────────────────────────────────────────────────────────────
  const TodoModule = {
    _state: {
      tasks: [],
      sortOrder: 'default'
    },

    isBlankText(text) {
      return !text || text.trim().length === 0;
    },

    isDuplicate(text, tasks, excludeId) {
      const normalised = text.trim().toLowerCase();
      return tasks.some(t => t.id !== excludeId && t.text.toLowerCase() === normalised);
    },

    _persist() {
      StorageManager.set(KEYS.TASKS, this._state.tasks);
    },

    addTask(text) {
      if (this.isBlankText(text)) return { ok: false, error: 'blank' };
      if (this.isDuplicate(text, this._state.tasks)) return { ok: false, error: 'duplicate' };
      const task = {
        id:        Date.now().toString() + Math.random().toString(36).substr(2, 9),
        text:      text.trim(),
        completed: false,
        createdAt: Date.now()
      };
      this._state.tasks.push(task);
      this._persist();
      this.renderTasks();
      return { ok: true };
    },

    editTask(id, newText) {
      if (this.isBlankText(newText)) return { ok: false, error: 'blank' };
      if (this.isDuplicate(newText, this._state.tasks, id)) return { ok: false, error: 'duplicate' };
      const task = this._state.tasks.find(t => t.id === id);
      if (!task) return { ok: false, error: 'not_found' };
      task.text = newText.trim();
      this._persist();
      this.renderTasks();
      return { ok: true };
    },

    toggleTask(id) {
      const task = this._state.tasks.find(t => t.id === id);
      if (task) {
        task.completed = !task.completed;
        this._persist();
        this.renderTasks();
      }
    },

    deleteTask(id) {
      this._state.tasks = this._state.tasks.filter(t => t.id !== id);
      this._persist();
      this.renderTasks();
    },

    sortTasks(order, tasks) {
      const copy = [...tasks];
      switch (order) {
        case 'alpha-asc':
          return copy.sort((a, b) => a.text.localeCompare(b.text));
        case 'alpha-desc':
          return copy.sort((a, b) => b.text.localeCompare(a.text));
        case 'completed-last':
          return copy.sort((a, b) => {
            if (a.completed === b.completed) return a.createdAt - b.createdAt;
            return a.completed ? 1 : -1;
          });
        case 'completed-first':
          return copy.sort((a, b) => {
            if (a.completed === b.completed) return a.createdAt - b.createdAt;
            return a.completed ? -1 : 1;
          });
        default: // 'default' — creation order
          return copy.sort((a, b) => a.createdAt - b.createdAt);
      }
    },

    renderTasks() {
      const list = document.getElementById('task-list');
      if (!list) return;
      const sorted = this.sortTasks(this._state.sortOrder, this._state.tasks);
      list.innerHTML = '';

      if (sorted.length === 0) {
        const empty = document.createElement('li');
        empty.className = 'task-empty';
        empty.textContent = 'No tasks yet. Add one above!';
        list.appendChild(empty);
        return;
      }

      sorted.forEach(task => {
        const li = document.createElement('li');
        if (task.completed) li.classList.add('completed');

        // Checkbox
        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.checked = task.completed;
        cb.setAttribute('aria-label', `Mark "${task.text}" as ${task.completed ? 'incomplete' : 'complete'}`);
        cb.addEventListener('change', () => this.toggleTask(task.id));

        // Task text span
        const span = document.createElement('span');
        span.className = 'task-text';
        span.textContent = task.text;

        // Actions container
        const actions = document.createElement('div');
        actions.className = 'task-actions';

        // Edit button
        const editBtn = document.createElement('button');
        editBtn.className = 'btn-icon';
        editBtn.setAttribute('aria-label', `Edit task: ${task.text}`);
        editBtn.textContent = '✏️';
        editBtn.addEventListener('click', () => this._enterEditMode(li, task));

        // Delete button
        const delBtn = document.createElement('button');
        delBtn.className = 'btn-icon btn-icon--danger';
        delBtn.setAttribute('aria-label', `Delete task: ${task.text}`);
        delBtn.textContent = '🗑️';
        delBtn.addEventListener('click', () => this.deleteTask(task.id));

        actions.appendChild(editBtn);
        actions.appendChild(delBtn);
        li.appendChild(cb);
        li.appendChild(span);
        li.appendChild(actions);
        list.appendChild(li);
      });
    },

    _enterEditMode(li, task) {
      const span = li.querySelector('.task-text');
      const actions = li.querySelector('.task-actions');
      if (!span || !actions) return;

      // Replace span with input
      const input = document.createElement('input');
      input.type = 'text';
      input.className = 'task-edit-input';
      input.value = task.text;
      span.replaceWith(input);
      input.focus();
      input.select();

      // Error element for edit
      const errSpan = document.createElement('span');
      errSpan.className = 'error';
      errSpan.hidden = true;

      // Replace action buttons with save/cancel
      actions.innerHTML = '';
      const saveBtn = document.createElement('button');
      saveBtn.className = 'btn-icon';
      saveBtn.setAttribute('aria-label', 'Save edit');
      saveBtn.textContent = '✔️';

      const cancelBtn = document.createElement('button');
      cancelBtn.className = 'btn-icon';
      cancelBtn.setAttribute('aria-label', 'Cancel edit');
      cancelBtn.textContent = '✖️';

      actions.appendChild(saveBtn);
      actions.appendChild(cancelBtn);
      li.insertBefore(errSpan, actions);

      const doSave = () => {
        const result = this.editTask(task.id, input.value);
        if (!result.ok) {
          errSpan.textContent = result.error === 'blank'
            ? 'Task cannot be empty.'
            : 'A task with that name already exists.';
          errSpan.hidden = false;
        }
        // On success renderTasks() replaces the entire list
      };

      saveBtn.addEventListener('click', doSave);
      cancelBtn.addEventListener('click', () => this.renderTasks());
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') doSave();
        if (e.key === 'Escape') this.renderTasks();
      });
    },

    init() {
      this._state.tasks = StorageManager.get(KEYS.TASKS, []);
      this._state.sortOrder = 'default';
      this.renderTasks();

      const addInput = document.getElementById('add-task-input');
      const addBtn   = document.getElementById('add-task-btn');
      const errEl    = document.getElementById('add-task-error');

      const doAdd = () => {
        const text = addInput ? addInput.value : '';
        const result = this.addTask(text);
        if (result.ok) {
          if (addInput) addInput.value = '';
          if (errEl) { errEl.textContent = ''; errEl.hidden = true; }
        } else {
          if (errEl) {
            errEl.textContent = result.error === 'blank'
              ? 'Task cannot be empty.'
              : 'That task already exists.';
            errEl.hidden = false;
          }
        }
      };

      if (addBtn) addBtn.addEventListener('click', doAdd);
      if (addInput) {
        addInput.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') doAdd();
        });
      }

      const sortSelect = document.getElementById('sort-select');
      if (sortSelect) {
        sortSelect.addEventListener('change', () => {
          this._state.sortOrder = sortSelect.value;
          this.renderTasks();
        });
      }
    }
  };

  // ── LinksModule ───────────────────────────────────────────────────────────
  const LinksModule = {
    _state: {
      links: []
    },

    /**
     * Returns true iff url is a string starting with "http://" or "https://".
     * @param {string} url
     * @returns {boolean}
     */
    isValidUrl(url) {
      return typeof url === 'string' &&
             (url.startsWith('http://') || url.startsWith('https://'));
    },

    /** Persists the current links array to localStorage. */
    _persist() {
      StorageManager.set(KEYS.LINKS, this._state.links);
    },

    /**
     * Validates inputs, creates a QuickLink, pushes it to state, persists, and re-renders.
     * Returns { ok: true } on success or { ok: false, error: 'empty' | 'invalid_url' } on failure.
     *
     * @param {string} label
     * @param {string} url
     * @returns {{ ok: boolean, error?: string }}
     */
    addLink(label, url) {
      const trimLabel = (label || '').trim();
      const trimUrl   = (url || '').trim();
      if (!trimLabel || !trimUrl) return { ok: false, error: 'empty' };
      if (!this.isValidUrl(trimUrl)) return { ok: false, error: 'invalid_url' };
      const link = {
        id:    Date.now().toString() + Math.random().toString(36).substr(2, 9),
        label: trimLabel,
        url:   trimUrl
      };
      this._state.links.push(link);
      this._persist();
      this.renderLinks();
      return { ok: true };
    },

    /**
     * Removes the link with the given id from state, persists, and re-renders.
     * @param {string} id
     */
    deleteLink(id) {
      this._state.links = this._state.links.filter(l => l.id !== id);
      this._persist();
      this.renderLinks();
    },

    /**
     * Clears #links-grid and re-populates it from the current links state.
     * Each link renders as an <a target="_blank"> with a delete button beside it.
     */
    renderLinks() {
      const grid = document.getElementById('links-grid');
      if (!grid) return;
      grid.innerHTML = '';

      this._state.links.forEach(link => {
        const item = document.createElement('div');
        item.className = 'link-item';

        const anchor = document.createElement('a');
        anchor.href = link.url;
        anchor.target = '_blank';
        anchor.rel = 'noopener noreferrer';
        anchor.textContent = link.label;
        anchor.className = 'link-btn';

        const delBtn = document.createElement('button');
        delBtn.className = 'link-delete';
        delBtn.setAttribute('aria-label', `Delete link: ${link.label}`);
        delBtn.textContent = '×';
        delBtn.addEventListener('click', () => this.deleteLink(link.id));

        item.appendChild(anchor);
        item.appendChild(delBtn);
        grid.appendChild(item);
      });
    },

    /**
     * Restores links from StorageManager, renders them, and wires the add-link form.
     * Supports both button click and Enter key on the URL input to submit.
     */
    init() {
      this._state.links = StorageManager.get(KEYS.LINKS, []);
      this.renderLinks();

      const labelInput = document.getElementById('link-label-input');
      const urlInput   = document.getElementById('link-url-input');
      const addBtn     = document.getElementById('add-link-btn');
      const errEl      = document.getElementById('add-link-error');

      const doAdd = () => {
        const label = labelInput ? labelInput.value : '';
        const url   = urlInput   ? urlInput.value   : '';
        const result = this.addLink(label, url);
        if (result.ok) {
          if (labelInput) labelInput.value = '';
          if (urlInput)   urlInput.value   = '';
          if (errEl) { errEl.textContent = ''; errEl.hidden = true; }
        } else {
          if (errEl) {
            errEl.textContent = result.error === 'empty'
              ? 'Both label and URL are required.'
              : 'URL must start with http:// or https://';
            errEl.hidden = false;
          }
        }
      };

      if (addBtn) addBtn.addEventListener('click', doAdd);
      if (urlInput) {
        urlInput.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') doAdd();
        });
      }
    }
  };

  // ── ThemeModule ───────────────────────────────────────────────────────────
  const ThemeModule = {
    /**
     * Returns the button label for the given theme.
     * When the current theme is "light", user can switch TO dark → show dark label.
     * When the current theme is "dark", user can switch TO light → show light label.
     *
     * @param {"light"|"dark"} theme
     * @returns {string}
     */
    getThemeLabel(theme) {
      return theme === 'dark' ? '☀️ Light mode' : '🌙 Dark mode';
    },

    /**
     * Flips data-theme on <html>, updates button label, persists via StorageManager.
     */
    toggle() {
      const current = document.documentElement.getAttribute('data-theme') || 'light';
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      StorageManager.set(KEYS.THEME, next);
      this._updateButton(next);
    },

    /**
     * Updates the toggle button's text content to reflect the current theme.
     * @param {"light"|"dark"} theme
     */
    _updateButton(theme) {
      const btn = document.getElementById('theme-toggle');
      if (btn) btn.textContent = this.getThemeLabel(theme);
    },

    /**
     * Reads saved theme from StorageManager, applies to DOM, sets correct label,
     * and wires the toggle button click handler.
     */
    init() {
      const saved = StorageManager.get(KEYS.THEME, 'light');
      document.documentElement.setAttribute('data-theme', saved);
      this._updateButton(saved);
      const btn = document.getElementById('theme-toggle');
      if (btn) btn.addEventListener('click', () => this.toggle());
    }
  };

  // ── Bootstrap ─────────────────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', function () {
    ThemeModule.init();
    GreetingModule.init();
    TimerModule.init();
    TodoModule.init();
    LinksModule.init();
  });

})();