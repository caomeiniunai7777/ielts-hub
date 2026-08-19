/* ========================================
   IELTS Hub — Floating Focus Timer
   Modes: Stopwatch / 25m Pomodoro / 45m Deep / 60m Mock
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
    this.bind();
  },

  render() {
    const el = document.getElementById('focus-timer');
    el.innerHTML = `
      <div class="timer-badge" onclick="Timer.toggle()">
        <span class="pulse-dot idle" id="timer-pulse"></span>
        <span id="timer-badge-text">00:00</span>
      </div>
      <div class="timer-panel">
        <div class="timer-header">
          <span class="timer-label">Focus Session</span>
          <span class="timer-close" onclick="Timer.toggle()">-</span>
        </div>
        <div class="timer-display" id="timer-display">00:00</div>
        <div class="timer-modes" id="timer-modes">
          ${this.modes.map(m => `
            <div class="timer-mode ${m.key === this.mode ? 'active' : ''}"
                 onclick="Timer.setMode('${m.key}')">${m.label}</div>
          `).join('')}
        </div>
        <div class="timer-actions">
          <div class="timer-btn" onclick="Timer.reset()">Reset</div>
          <div class="timer-btn primary" id="timer-start-btn" onclick="Timer.toggleRun()">Start</div>
          <div class="timer-btn" onclick="Timer.saveSession()">Save</div>
        </div>
      </div>
    `;
  },

  bind() {
    // No-op, events are inline
  },

  toggle() {
    this.collapsed = !this.collapsed;
    const el = document.getElementById('focus-timer');
    el.classList.toggle('collapsed', this.collapsed);
  },

  setMode(key) {
    const mode = this.modes.find(m => m.key === key);
    if (!mode) return;
    this.mode = key;
    this.targetMin = mode.min;
    this.reset();
    // Update active states
    Utils.$$('#timer-modes .timer-mode').forEach((el, i) => {
      el.classList.toggle('active', this.modes[i].key === key);
    });
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
    btn.textContent = 'Pause';
    document.getElementById('timer-pulse').classList.remove('idle');

    this.intervalId = setInterval(() => {
      this.elapsed++;
      this.updateDisplay();
      if (this.targetMin > 0 && this.elapsed >= this.targetMin * 60) {
        this.complete();
      }
    }, 1000);
  },

  pause() {
    this.running = false;
    clearInterval(this.intervalId);
    document.getElementById('timer-start-btn').textContent = 'Resume';
    document.getElementById('timer-pulse').classList.add('idle');
  },

  reset() {
    this.running = false;
    clearInterval(this.intervalId);
    this.elapsed = 0;
    this.updateDisplay();
    const btn = document.getElementById('timer-start-btn');
    if (btn) btn.textContent = 'Start';
    const pulse = document.getElementById('timer-pulse');
    if (pulse) pulse.classList.add('idle');
  },

  complete() {
    this.pause();
    this.saveSession();
    Utils.toast('专注完成！' + Math.round(this.elapsed / 60) + ' 分钟');
  },

  updateDisplay() {
    const m = Math.floor(this.elapsed / 60);
    const s = this.elapsed % 60;
    const str = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    const display = document.getElementById('timer-display');
    const badge = document.getElementById('timer-badge-text');
    if (display) display.textContent = str;
    if (badge) badge.textContent = str;
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
  },
};
