/* ========================================
   IELTS Hub — Floating Focus Timer
   Modes: Stopwatch / 25m Pomodoro / 45m Deep / 60m Mock
   - State persistence: survives page refresh & module switch
   - Auto-save: every 5 min / on page unload / on completion
   - Auto-collapse after Start, timer continues in background
   - Click outside or close button to collapse
   - Countdown completion: pulse + beep + auto-save
   ======================================== */

const Timer = {
  mode: 'stopwatch',
  targetMin: 0,
  elapsed: 0,
  running: false,
  intervalId: null,
  collapsed: true,
  startTimestamp: 0,
  lastAutoSave: 0,
  STORE_KEY: 'ielts_timer_state',

  modes: [
    { key: 'stopwatch', label: '正计时', min: 0 },
    { key: 'pomodoro', label: '25m 番茄', min: 25 },
    { key: 'deep', label: '45m 深度', min: 45 },
    { key: 'mock', label: '60m 模考', min: 60 },
  ],

  init() {
    this.restoreState();
    this.render();
    this.bindOutsideClick();
    this.bindBeforeUnload();

    // If was running, resume the interval
    if (this.running) {
      this.intervalId = setInterval(() => this.tick(), 1000);
    }
  },

  // ========================================
  // State Persistence
  // ========================================

  saveState() {
    try {
      localStorage.setItem(this.STORE_KEY, JSON.stringify({
        mode: this.mode,
        targetMin: this.targetMin,
        elapsed: this.elapsed,
        running: this.running,
        startTimestamp: this.startTimestamp,
        lastAutoSave: this.lastAutoSave,
        collapsed: this.collapsed,
      }));
    } catch(e) {}
  },

  restoreState() {
    try {
      const raw = localStorage.getItem(this.STORE_KEY);
      if (!raw) return;
      const s = JSON.parse(raw);
      this.mode = s.mode || 'stopwatch';
      this.targetMin = s.targetMin || 0;
      this.elapsed = s.elapsed || 0;
      this.running = s.running || false;
      this.startTimestamp = s.startTimestamp || 0;
      this.lastAutoSave = s.lastAutoSave || 0;
      this.collapsed = s.collapsed !== false; // default true

      // If was running, calculate elapsed from timestamp
      if (this.running && this.startTimestamp > 0) {
        const now = Math.floor(Date.now() / 1000);
        const diff = now - this.startTimestamp;
        if (diff > 0 && diff < 86400) { // sanity check: less than 24h
          this.elapsed += diff;
          this.startTimestamp = now; // reset base
        } else if (diff >= 86400) {
          // Too much time passed, stop
          this.running = false;
          this.elapsed = 0;
        }
      }

      // Check if countdown already completed while away
      if (this.running && this.targetMin > 0 && this.elapsed >= this.targetMin * 60) {
        this.running = false;
        // Auto-save if >= 5 min
        if (this.elapsed >= 300) {
          this.autoSave(true);
        }
        this.elapsed = 0;
      }
    } catch(e) {}
  },

  // ========================================
  // Core Timer Logic
  // ========================================

  tick() {
    this.elapsed++;
    this.updateBadge();
    this.saveState();

    // 5-minute auto-save checkpoint
    if (this.elapsed > 0 && this.elapsed % 300 === 0) {
      this.autoSave(false);
    }

    // Countdown complete
    if (this.targetMin > 0 && this.elapsed >= this.targetMin * 60) {
      this.complete();
    }
  },

  // ========================================
  // Auto-Save
  // ========================================

  autoSave(silent) {
    if (this.elapsed < 300) return; // Only save if >= 5 min

    const mins = Math.round(this.elapsed / 60);
    const sessions = Store.get('focusSessions') || [];
    sessions.push({
      date: Utils.today(),
      duration: mins,
      mode: this.mode,
      timestamp: Date.now(),
      auto: true,
    });
    Store.set('focusSessions', sessions);

    // Reset the auto-save counter so we don't double-count
    this.lastAutoSave = this.elapsed;

    App.updateMetrics();

    if (!silent) {
      Utils.toast('自动保存 ' + mins + ' 分钟专注');
    }
  },

  // ========================================
  // BeforeUnload handler — save on page exit
  // ========================================

  bindBeforeUnload() {
    window.addEventListener('beforeunload', () => {
      if (this.running && this.elapsed >= 300) {
        // Save the unsaved portion
        const unsaved = this.elapsed - this.lastAutoSave;
        if (unsaved >= 300) {
          const mins = Math.round(unsaved / 60);
          const sessions = Store.get('focusSessions') || [];
          sessions.push({
            date: Utils.today(),
            duration: mins,
            mode: this.mode,
            timestamp: Date.now(),
            auto: true,
          });
          Store.set('focusSessions', sessions);
        }
      }
      // Always save timer state
      this.saveState();
    });

    // Also save on visibility change (mobile/tab switch)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.running) {
        this.saveState();
      }
    });
  },

  // ========================================
  // Rendering
  // ========================================

  render() {
    const el = document.getElementById('focus-timer');
    if (!el) return;

    const modeLabel = this.modes.find(m => m.key === this.mode)?.label || '';
    const badgeText = this.running ? `${this.fmtTime()} · ${modeLabel}` : this.fmtTime();

    el.innerHTML = `
      <div class="timer-badge" onclick="Timer.expand()">
        <span class="pulse-dot ${this.running ? '' : 'idle'}" id="timer-pulse"></span>
        <span id="timer-badge-text">${badgeText}</span>
      </div>
      <div class="timer-panel">
        <div class="timer-header">
          <span class="timer-label">Focus Session</span>
          <span class="timer-close" onclick="Timer.collapse()" title="收起">✕</span>
        </div>
        <div class="timer-display" id="timer-display">${this.fmtTime()}</div>
        <div class="timer-modes" id="timer-modes">
          ${this.modes.map(m => `
            <div class="timer-mode ${m.key === this.mode ? 'active' : ''}"
                 onclick="Timer.setMode('${m.key}')">${m.label}</div>
          `).join('')}
        </div>
        <div class="timer-actions">
          <div class="timer-btn" onclick="Timer.reset()">Reset</div>
          <div class="timer-btn primary" id="timer-start-btn" onclick="Timer.toggleRun()">${this.running ? 'Pause' : 'Start'}</div>
          <div class="timer-btn" onclick="Timer.saveSession()">Save</div>
        </div>
        ${this.running && this.elapsed >= 300 ? '<div style="text-align:center;font-size:10px;color:var(--dot-done);margin-top:8px">● 已自动保存 ' + Math.round(this.lastAutoSave / 60) + ' 分钟</div>' : ''}
      </div>
    `;
  },

  updateBadge() {
    const badge = document.getElementById('timer-badge-text');
    const display = document.getElementById('timer-display');
    const pulse = document.getElementById('timer-pulse');
    const modeLabel = this.modes.find(m => m.key === this.mode)?.label || '';
    const timeStr = this.fmtTime();
    const badgeStr = this.running ? `${timeStr} · ${modeLabel}` : timeStr;
    if (badge) badge.textContent = badgeStr;
    if (display) display.textContent = timeStr;
    if (pulse) {
      pulse.classList.toggle('idle', !this.running);
    }
  },

  fmtTime() {
    const m = Math.floor(this.elapsed / 60);
    const s = this.elapsed % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  },

  // ========================================
  // Interaction
  // ========================================

  bindOutsideClick() {
    document.addEventListener('click', (e) => {
      if (this.collapsed) return;
      const timer = document.getElementById('focus-timer');
      if (timer && !timer.contains(e.target)) {
        this.collapse();
      }
    });
  },

  expand() {
    this.collapsed = false;
    const el = document.getElementById('focus-timer');
    if (el) el.classList.remove('collapsed');
    this.saveState();
  },

  collapse() {
    this.collapsed = true;
    const el = document.getElementById('focus-timer');
    if (el) el.classList.add('collapsed');
    this.saveState();
  },

  setMode(key) {
    const mode = this.modes.find(m => m.key === key);
    if (!mode) return;
    this.mode = key;
    this.targetMin = mode.min;
    this.reset();
    this.render();
  },

  toggleRun() {
    if (this.running) {
      this.pause();
    } else {
      this.start();
    }
  },

  start() {
    this.running = true;
    this.startTimestamp = Math.floor(Date.now() / 1000);
    const btn = document.getElementById('timer-start-btn');
    if (btn) btn.textContent = 'Pause';
    const pulse = document.getElementById('timer-pulse');
    if (pulse) pulse.classList.remove('idle');

    this.intervalId = setInterval(() => this.tick(), 1000);
    this.saveState();
    this.collapse();
  },

  pause() {
    this.running = false;
    clearInterval(this.intervalId);
    const btn = document.getElementById('timer-start-btn');
    if (btn) btn.textContent = 'Resume';
    const pulse = document.getElementById('timer-pulse');
    if (pulse) pulse.classList.add('idle');
    this.updateBadge();
    this.saveState();
  },

  reset() {
    // Auto-save if >= 5 min before resetting
    if (this.elapsed >= 300) {
      const unsaved = this.elapsed - this.lastAutoSave;
      if (unsaved >= 60) {
        this.autoSave(true);
      }
    }
    this.running = false;
    clearInterval(this.intervalId);
    this.elapsed = 0;
    this.lastAutoSave = 0;
    this.startTimestamp = 0;
    this.updateBadge();
    const btn = document.getElementById('timer-start-btn');
    if (btn) btn.textContent = 'Start';
    this.saveState();
  },

  complete() {
    this.running = false;
    clearInterval(this.intervalId);
    const mins = Math.round(this.elapsed / 60);

    // Auto-save (always save on completion, even if < 5 min)
    const sessions = Store.get('focusSessions') || [];
    const unsaved = this.elapsed - this.lastAutoSave;
    if (unsaved >= 60) {
      sessions.push({
        date: Utils.today(),
        duration: Math.round(unsaved / 60),
        mode: this.mode,
        timestamp: Date.now(),
        auto: true,
      });
      Store.set('focusSessions', sessions);
      this.lastAutoSave = this.elapsed;
      App.updateMetrics();
    }

    this.expand();
    this.render();

    // Pulse badge
    const el = document.getElementById('focus-timer');
    if (el) {
      el.style.animation = 'none';
      el.offsetHeight;
      el.style.animation = 'pulse 0.5s ease-in-out 3';
    }

    // Beep
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);
      osc.start();
      osc.stop(ctx.currentTime + 0.8);
    } catch(e) {}

    Utils.toast('专注完成！' + mins + ' 分钟，已自动保存');
    this.saveState();
  },

  saveSession() {
    if (this.elapsed < 60) {
      Utils.toast('专注不足 1 分钟，未记录');
      return;
    }

    // Save only the unsaved portion
    const unsaved = this.elapsed - this.lastAutoSave;
    if (unsaved >= 60) {
      const sessions = Store.get('focusSessions') || [];
      sessions.push({
        date: Utils.today(),
        duration: Math.round(unsaved / 60),
        mode: this.mode,
        timestamp: Date.now(),
        auto: false,
      });
      Store.set('focusSessions', sessions);
      this.lastAutoSave = this.elapsed;
      Utils.toast('已记录 ' + Math.round(unsaved / 60) + ' 分钟专注');
      App.updateMetrics();
    } else {
      Utils.toast('本次时长已自动保存');
    }

    this.reset();
    this.render();
    this.collapse();
  },
};
