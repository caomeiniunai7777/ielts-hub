/* ========================================
   Module 1: 每日打卡、待办与多维计划看板
   ======================================== */

const Dashboard = {
  activeTab: 'todo',
  calMonth: null,

  render() {
    return `
      <div class="pill-tabs">
        <div class="pill-tab ${this.activeTab === 'todo' ? 'active' : ''}" onclick="Dashboard.switchTab('todo')">待办清单</div>
        <div class="pill-tab ${this.activeTab === 'calendar' ? 'active' : ''}" onclick="Dashboard.switchTab('calendar')">打卡日历</div>
        <div class="pill-tab ${this.activeTab === 'plan' ? 'active' : ''}" onclick="Dashboard.switchTab('plan')">周计划</div>
      </div>
      <div id="dash-content"></div>
    `;
  },

  init() {
    this.calMonth = new Date();
    this.renderTab();
  },

  switchTab(tab) {
    this.activeTab = tab;
    Utils.$$('.pill-tab', document.getElementById('content')).forEach((el, i) => {
      const tabs = ['todo', 'calendar', 'plan'];
      el.classList.toggle('active', tabs[i] === tab);
    });
    this.renderTab();
  },

  renderTab() {
    const c = document.getElementById('dash-content');
    if (this.activeTab === 'todo') {
      c.innerHTML = this.renderTodo();
      this.bindTodo();
    } else if (this.activeTab === 'calendar') {
      c.innerHTML = this.renderCalendar();
      this.bindCalendar();
    } else {
      c.innerHTML = this.renderPlan();
      this.bindPlan();
    }
  },

  // --- Todo List ---
  renderTodo() {
    const todos = Store.get('todos') || [];
    const active = todos.filter(t => !t.done);
    const done = todos.filter(t => t.done);

    return `
      <div class="bento-grid cols-3" style="margin-bottom:20px">
        <div class="bento-card warm">
          <div class="num-badge">№ ${Utils.today().slice(5).replace('-', '.')}</div>
          <div style="font-family:var(--font-serif);font-size:28px;font-weight:600;color:var(--text-title);margin-top:6px">${active.length}</div>
          <div style="font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;margin-top:2px">PENDING TASKS</div>
        </div>
        <div class="bento-card warm">
          <div class="num-badge">DONE TODAY</div>
          <div style="font-family:var(--font-serif);font-size:28px;font-weight:600;color:var(--text-title);margin-top:6px">${done.filter(t => t.done && t.completedAt === Utils.today()).length}</div>
          <div style="font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;margin-top:2px">COMPLETED</div>
        </div>
        <div class="bento-card warm">
          <div class="num-badge">STREAK</div>
          <div style="font-family:var(--font-serif);font-size:28px;font-weight:600;color:var(--text-title);margin-top:6px">${this.streak()}</div>
          <div style="font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;margin-top:2px">DAYS IN A ROW</div>
        </div>
      </div>
      <div class="bento-card" style="max-width:640px">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:16px">
          <input type="text" class="form-input" id="todo-input" placeholder="添加新任务，按 Enter 确认..." style="flex:1">
          <button class="btn btn-primary" onclick="Dashboard.addTodo()">+ 新增</button>
        </div>
        <div id="todo-list">
          ${active.length || done.length ? [...active, ...done].map(t => this.renderTodoItem(t)).join('') : '<div class="empty-state"><div class="text">暂无任务，添加一个开始今天的备考</div></div>'}
        </div>
        ${done.length ? '<div style="margin-top:12px"><button class="btn-ghost" onclick="Dashboard.clearDone()">清除已完成</button></div>' : ''}
      </div>
    `;
  },

  renderTodoItem(t) {
    return `
      <div class="check-item ${t.done ? 'done' : ''}" data-id="${t.id}">
        <div class="check-box ${t.done ? 'checked' : ''}" onclick="Dashboard.toggleTodo('${t.id}')"></div>
        <span class="check-text">${Utils.esc(t.text)}</span>
      </div>
    `;
  },

  bindTodo() {
    const input = document.getElementById('todo-input');
    if (input) {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') this.addTodo();
      });
    }
  },

  addTodo() {
    const input = document.getElementById('todo-input');
    const text = input.value.trim();
    if (!text) return;
    const todos = Store.get('todos') || [];
    todos.push({ id: Utils.uid(), text, done: false, createdAt: Utils.today(), completedAt: null });
    Store.set('todos', todos);
    input.value = '';
    this.renderTab();
  },

  toggleTodo(id) {
    const todos = Store.get('todos') || [];
    const t = todos.find(x => x.id === id);
    if (t) {
      t.done = !t.done;
      t.completedAt = t.done ? Utils.today() : null;
      Store.set('todos', todos);
      // Auto check-in when completing a task
      if (t.done) {
        const checkins = Store.get('checkins') || {};
        checkins[Utils.today()] = true;
        Store.set('checkins', checkins);
      }
      this.renderTab();
    }
  },

  clearDone() {
    const todos = Store.get('todos') || [];
    Store.set('todos', todos.filter(t => !t.done));
    this.renderTab();
  },

  streak() {
    const checkins = Store.get('checkins') || {};
    let streak = 0;
    let d = Utils.today();
    while (checkins[d]) {
      streak++;
      d = Utils.addDays(d, -1);
    }
    return streak;
  },

  // --- Calendar ---
  renderCalendar() {
    const checkins = Store.get('checkins') || {};
    const year = this.calMonth.getFullYear();
    const month = this.calMonth.getMonth();
    const monthName = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'][month];
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = Utils.today();
    const streak = this.streak();
    const totalDays = Object.keys(checkins).length;

    let cells = '';
    ['日', '一', '二', '三', '四', '五', '六'].forEach(d => {
      cells += `<div style="text-align:center;font-size:11px;color:var(--text-muted);padding:6px 0;font-weight:500;text-transform:uppercase">${d}</div>`;
    });
    for (let i = 0; i < firstDay; i++) {
      cells += '<div></div>';
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const isChecked = checkins[dateStr];
      const isToday = dateStr === today;
      cells += `
        <div onclick="Dashboard.toggleCheckin('${dateStr}')"
             style="text-align:center;padding:10px 0;border-radius:var(--r-sm);cursor:pointer;
             ${isChecked ? 'background:rgba(234,168,68,0.15);color:var(--accent-orange-deep);font-weight:600' : ''}
             ${isToday ? 'border:2px solid var(--accent-orange)' : 'border:1px solid var(--border-light)'}">
          ${d}${isChecked ? ' <span style="font-size:10px">●</span>' : ''}
        </div>`;
    }

    return `
      <div class="bento-grid cols-2" style="margin-bottom:20px">
        <div class="bento-card warm">
          <div class="num-badge">CONTINUOUS STREAK</div>
          <div style="font-family:var(--font-serif);font-size:32px;font-weight:600;color:var(--accent-orange-deep);margin-top:6px">${streak} <span style="font-size:14px;color:var(--text-muted)">天</span></div>
        </div>
        <div class="bento-card warm">
          <div class="num-badge">TOTAL CHECK-INS</div>
          <div style="font-family:var(--font-serif);font-size:32px;font-weight:600;color:var(--text-title);margin-top:6px">${totalDays} <span style="font-size:14px;color:var(--text-muted)">天</span></div>
        </div>
      </div>
      <div class="bento-card" style="max-width:640px">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
          <div class="section-title">${year} · ${monthName}</div>
          <div style="display:flex;gap:6px">
            <button class="icon-btn" onclick="Dashboard.prevMonth()">←</button>
            <button class="icon-btn" onclick="Dashboard.nextMonth()">→</button>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px">${cells}</div>
        <div style="margin-top:14px;font-size:12px;color:var(--text-muted)">点击日期可打卡/取消</div>
      </div>
    `;
  },

  bindCalendar() {},

  prevMonth() {
    this.calMonth.setMonth(this.calMonth.getMonth() - 1);
    this.renderTab();
  },

  nextMonth() {
    this.calMonth.setMonth(this.calMonth.getMonth() + 1);
    this.renderTab();
  },

  toggleCheckin(dateStr) {
    const checkins = Store.get('checkins') || {};
    if (checkins[dateStr]) {
      delete checkins[dateStr];
    } else {
      checkins[dateStr] = true;
    }
    Store.set('checkins', checkins);
    this.renderTab();
    App.updateMetrics();
  },

  // --- Week Plan (Feishu-style) ---
  renderPlan() {
    const plan = Store.get('weekPlan') || [];
    const modules = ['词汇', '听力', '阅读', '写作', '口语', '模考'];

    return `
      <div class="bento-card" style="overflow-x:auto">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
          <div>
            <div class="section-title">本周备考计划</div>
            <div class="section-meta">飞书多维表格风格 · 可自由增删改</div>
          </div>
          <button class="btn btn-primary" onclick="Dashboard.addPlanRow()">+ 新增任务</button>
        </div>
        <table class="data-table">
          <thead>
            <tr>
              <th>任务名称</th>
              <th>模块</th>
              <th style="width:80px">难度</th>
              <th style="width:70px">目标量</th>
              <th style="width:70px">已完成</th>
              <th style="width:100px">进度</th>
              <th>备注</th>
              <th style="width:40px"></th>
            </tr>
          </thead>
          <tbody id="plan-body">
            ${plan.length ? plan.map(r => this.renderPlanRow(r, modules)).join('') : '<tr><td colspan="8"><div class="empty-state"><div class="text">暂无计划，点击「新增任务」开始安排</div></div></td></tr>'}
          </tbody>
        </table>
      </div>
    `;
  },

  renderPlanRow(r, modules) {
    const pct = Utils.progressPct(r.completed, r.target);
    return `
      <tr data-id="${r.id}">
        <td><input type="text" value="${Utils.esc(r.name)}" onchange="Dashboard.updatePlan('${r.id}','name',this.value)"></td>
        <td>
          <select onchange="Dashboard.updatePlan('${r.id}','module',this.value)">
            ${modules.map(m => `<option ${r.module === m ? 'selected' : ''}>${m}</option>`).join('')}
          </select>
        </td>
        <td><div class="difficulty" data-id="${r.id}">
          ${[1,2,3,4,5].map(i => `<span class="star ${i <= r.difficulty ? 'filled' : ''}" onclick="Dashboard.setDifficulty('${r.id}',${i})">★</span>`).join('')}
        </div></td>
        <td><input type="number" value="${r.target}" min="0" style="width:50px" onchange="Dashboard.updatePlan('${r.id}','target',parseInt(this.value)||0)"></td>
        <td><input type="number" value="${r.completed}" min="0" style="width:50px" onchange="Dashboard.updatePlan('${r.id}','completed',parseInt(this.value)||0)"></td>
        <td>
          <div class="progress-track"><div class="progress-fill ${pct >= 100 ? 'high' : ''}" style="width:${pct}%"></div></div>
          <div style="font-size:10px;color:var(--text-muted);margin-top:2px">${pct}%</div>
        </td>
        <td><input type="text" value="${Utils.esc(r.note || '')}" placeholder="添加备注..." onchange="Dashboard.updatePlan('${r.id}','note',this.value)"></td>
        <td><button class="btn-ghost" onclick="Dashboard.delPlanRow('${r.id}')">x</button></td>
      </tr>
    `;
  },

  bindPlan() {},

  addPlanRow() {
    const plan = Store.get('weekPlan') || [];
    plan.push({ id: Utils.uid(), name: '', module: '词汇', difficulty: 3, target: 1, completed: 0, note: '' });
    Store.set('weekPlan', plan);
    this.renderTab();
  },

  updatePlan(id, field, value) {
    const plan = Store.get('weekPlan') || [];
    const r = plan.find(x => x.id === id);
    if (r) {
      r[field] = value;
      Store.set('weekPlan', plan);
      // Re-render row for progress bar update
      const modules = ['词汇', '听力', '阅读', '写作', '口语', '模考'];
      const tr = document.querySelector(`tr[data-id="${id}"]`);
      if (tr && (field === 'target' || field === 'completed')) {
        const pct = Utils.progressPct(r.completed, r.target);
        const track = tr.querySelector('.progress-track');
        const label = tr.querySelector('.progress-track').nextElementSibling;
        if (track) { track.innerHTML = `<div class="progress-fill ${pct >= 100 ? 'high' : ''}" style="width:${pct}%"></div>`; }
        if (label) { label.textContent = pct + '%'; }
      }
    }
  },

  setDifficulty(id, level) {
    const plan = Store.get('weekPlan') || [];
    const r = plan.find(x => x.id === id);
    if (r) {
      r.difficulty = level;
      Store.set('weekPlan', plan);
      this.renderTab();
    }
  },

  delPlanRow(id) {
    const plan = Store.get('weekPlan') || [];
    Store.set('weekPlan', plan.filter(x => x.id !== id));
    this.renderTab();
  },
};
