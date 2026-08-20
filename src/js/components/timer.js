/* ========================================
   IELTS Hub — Floating Focus Timer
   Modes: Stopwatch / 25m Pomodoro / 45m Deep / 60m Mock
   - Auto-collapse after Start, timer continues in background
   - Click outside or close button to collapse
   - Countdown completion: pulse + toast + auto-expand for Save
   ======================================== */

const Timer = {
  mode: 'stopwatch',
  targetMin: 0,
  elapsed: 0,
  running: false,
  intervalId: null,
  collapsed: true,

  modes: [
    { key: 'stopwatch', label: '正计时', min: 0 },
    { key: 'pomodoro', label: '25m 番茄', min: 25 },
    { key: 'deep', label: '45m 深度', min: 45 },
    { key: 'mock', label: '60m 模考', min: 60 },
  ],

  init() {
    this.render();
    this.bindOutsideClick();
  },

  render() {
    const el = document.getElementById('focus-timer');
    if (!el) return;

    // Badge shows mode label when collapsed and running
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
      </div>
    `;
  },

  // Only re-render the badge text + display (not full re-render)
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
  },

  collapse() {
    this.collapsed = true;
    const el = document.getElementById('focus-timer');
    if (el) el.classList.add('collapsed');
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
    const btn = document.getElementById('timer-start-btn');
    if (btn) btn.textContent = 'Pause';
    const pulse = document.getElementById('timer-pulse');
    if (pulse) pulse.classList.remove('idle');

    this.intervalId = setInterval(() => {
      this.elapsed++;
      this.updateBadge();
      if (this.targetMin > 0 && this.elapsed >= this.targetMin * 60) {
        this.complete();
      }
    }, 1000);

    // Auto-collapse after starting
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
  },

  reset() {
    this.running = false;
    clearInterval(this.intervalId);
    this.elapsed = 0;
    this.updateBadge();
    const btn = document.getElementById('timer-start-btn');
    if (btn) btn.textContent = 'Start';
  },

  complete() {
    this.running = false;
    clearInterval(this.intervalId);
    const mins = Math.round(this.elapsed / 60);

    // Expand panel for Save
    this.expand();
    this.render();

    // Pulse badge
    const el = document.getElementById('focus-timer');
    if (el) {
      el.style.animation = 'none';
      el.offsetHeight; // trigger reflow
      el.style.animation = 'pulse 0.5s ease-in-out 3';
    }

    // Play a gentle beep using Web Audio API
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

    Utils.toast('专注完成！' + mins + ' 分钟，点击 Save 记录');
  },

  saveSession() {
    if (this.elapsed < 60) {
      Utils.toast('专注不足 1 分钟，未记录');
      return;
    }
    const sessions = Store.get('focusSessions') || [];
    sessions.push({
      date: Utils.today(),
      duration: Math.round(this.elapsed / 60),
      mode: this.mode,
    });
    Store.set('focusSessions', sessions);
    Utils.toast('已记录 ' + Math.round(this.elapsed / 60) + ' 分钟专注');
    App.updateMetrics();
    this.reset();
    this.render();
    this.collapse();
  },
};
