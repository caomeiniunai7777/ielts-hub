/* ========================================
   Module 1: 每日打卡、待办与多维计划看板
   - Smart plan import (淘口令式解析)
   - Calendar auto-distribution
   - Todo auto-sync from plan
   ======================================== */

const Dashboard = {
  activeTab: 'todo',
  calMonth: null,

  render() {
    return `
      <div class="pill-tabs">
        <div class="pill-tab ${this.activeTab === 'todo' ? 'active' : ''}" onclick="Dashboard.switchTab('todo')">待办清单</div>
        <div class="pill-tab ${this.activeTab === 'calendar' ? 'active' : ''}" onclick="Dashboard.switchTab('calendar')">打卡日历</div>
        <div class="pill-tab ${this.activeTab === 'plan' ? 'active' : ''}" onclick="Dashboard.switchTab('plan')">备考计划</div>
      </div>
      <div id="dash-content"></div>
    `;
  },

  init() {
    this.calMonth = new Date();
    this.cleanDirtyTodos();
    this.renderTab();
  },

  // Deep dedup of localStorage todos on init — fixes historical dirty data
  cleanDirtyTodos() {
    let todos = Store.get('todos') || [];
    if (todos.length === 0) return;

    // Dedup by id first
    const seenIds = new Set();
    let deduped = [];
    for (const t of todos) {
      const key = t.id || `noid_${t.text}_${t.createdAt}`;
      if (seenIds.has(key)) continue;
      seenIds.add(key);
      deduped.push(t);
    }

    // Then dedup by planTaskId (keep the one with done=true if any, else first)
    const planMap = {};
    const nonPlan = [];
    for (const t of deduped) {
      if (t.planTaskId) {
        if (planMap[t.planTaskId]) {
          // Keep the done one if either is done
          if (t.done && !planMap[t.planTaskId].done) {
            planMap[t.planTaskId] = t;
          }
        } else {
          planMap[t.planTaskId] = t;
        }
      } else {
        nonPlan.push(t);
      }
    }
    const finalTodos = [...nonPlan, ...Object.values(planMap)];

    if (finalTodos.length !== todos.length) {
      Store.set('todos', finalTodos);
      console.log(`[Dashboard] Cleaned ${todos.length - finalTodos.length} duplicate todo(s)`);
    }
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

  // ========================================
  // Todo List — auto-syncs from plan (deduplicated)
  // ========================================

  renderTodo() {
    // Sync plan tasks to todos ONCE with dedup by planTaskId
    this.syncPlansToTodos();

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

  // Sync plan tasks to todos — strict dedup, only adds missing items
  syncPlansToTodos() {
    let todos = Store.get('todos') || [];
    const planTasks = this.getTodayPlanTasks();
    if (planTasks.length === 0) return;

    // Build a Set of all existing todo IDs and planTaskIds
    const existingIds = new Set(todos.map(t => t.id));
    const existingPlanIds = new Set(todos.filter(t => t.planTaskId).map(t => t.planTaskId));

    let dirty = false;
    for (const pt of planTasks) {
      // Use stable deterministic ID: plan_{planTaskId}
      const stableId = `plan_${pt.id}`;
      
      // Skip if this planTaskId already has a todo (regardless of its current id)
      if (existingPlanIds.has(pt.id)) continue;
      
      // Safety: skip if stable ID already exists
      if (existingIds.has(stableId)) continue;

      todos.push({
        id: stableId,
        text: `[${pt.module}] ${pt.name}`,
        done: false,
        createdAt: Utils.today(),
        completedAt: null,
        planTaskId: pt.id,
      });
      existingIds.add(stableId);
      existingPlanIds.add(pt.id);
      dirty = true;
    }

    if (dirty) {
      Store.set('todos', todos);
    }
  },

  renderTodoItem(t) {
    const isPlanTask = t.planTaskId ? '<span class="tag-chip orange" style="margin-right:6px;font-size:9px;padding:1px 6px">计划</span>' : '';
    return `
      <div class="check-item ${t.done ? 'done' : ''}" data-id="${t.id}">
        <div class="check-box ${t.done ? 'checked' : ''}" onclick="Dashboard.toggleTodo('${t.id}')"></div>
        <span class="check-text">${isPlanTask}${Utils.esc(t.text)}</span>
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
    if (!t) return;
    t.done = !t.done;
    t.completedAt = t.done ? Utils.today() : null;
    Store.set('todos', todos);
    if (t.done) {
      const checkins = Store.get('checkins') || {};
      checkins[Utils.today()] = true;
      Store.set('checkins', checkins);
      if (t.planTaskId) {
        this.syncPlanProgress(t.planTaskId);
      }
    }
    // Update only the DOM element, no full re-render (avoids sync loop)
    const item = document.querySelector(`.check-item[data-id="${CSS.escape(id)}"]`);
    if (item) {
      item.classList.toggle('done', t.done);
      const box = item.querySelector('.check-box');
      if (box) box.classList.toggle('checked', t.done);
    }
    // Update metrics counters
    const active = todos.filter(x => !x.done);
    const doneToday = todos.filter(x => x.done && x.completedAt === Utils.today());
    const pendingEl = document.querySelector('.bento-grid .bento-card.warm .num-badge');
    // Lightweight: just re-render to refresh counts but syncPlansToTodos won't add dups
    this.renderTab();
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

  // ========================================
  // Calendar — with plan task capsules
  // ========================================

  renderCalendar() {
    const checkins = Store.get('checkins') || {};
    const planData = Store.get('weekPlan') || [];
    const year = this.calMonth.getFullYear();
    const month = this.calMonth.getMonth();
    const monthName = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'][month];
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = Utils.today();
    const streak = this.streak();
    const totalDays = Object.keys(checkins).length;

    // Module colors
    const moduleColors = {
      '词汇': '#EAA844', '听力': '#5B9BD5', '阅读': '#6FAA5B',
      '写作': '#D9534F', '口语': '#9B59B6', '模考': '#2B2825',
    };

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
      // Get plan tasks for this date
      const dayTasks = planData.filter(r => r.date === dateStr);
      const taskCapsules = dayTasks.map(t => {
        const color = moduleColors[t.module] || '#9E9488';
        return `<div style="font-size:8px;padding:1px 4px;background:${color}22;color:${color};border-radius:3px;margin-top:2px;overflow:hidden;white-space:nowrap;text-overflow:ellipsis">${t.module}</div>`;
      }).join('');

      cells += `
        <div onclick="Dashboard.toggleCheckin('${dateStr}')"
             style="text-align:center;padding:6px 4px;border-radius:var(--r-sm);cursor:pointer;min-height:48px;
             ${isChecked ? 'background:rgba(234,168,68,0.12);' : ''}
             ${isToday ? 'border:2px solid var(--accent-orange)' : 'border:1px solid var(--border-light)'}">
          <div style="font-size:13px;color:${isChecked ? 'var(--accent-orange-deep)' : 'var(--text-body)'};font-weight:${isToday ? '600' : '400'}">${d}</div>
          ${taskCapsules}
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
        <div style="margin-top:14px;display:flex;gap:8px;flex-wrap:wrap">
          ${Object.entries(moduleColors).map(([m, c]) => `<div style="display:flex;align-items:center;gap:4px"><span style="width:8px;height:8px;border-radius:50%;background:${c}22;border:1px solid ${c}"></span><span style="font-size:10px;color:var(--text-muted)">${m}</span></div>`).join('')}
        </div>
        <div style="margin-top:8px;font-size:12px;color:var(--text-muted)">点击日期可打卡/取消 · 胶囊显示当日计划任务</div>
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

  // ========================================
  // Plan (备考计划) — with smart import
  // ========================================

  renderPlan() {
    const plan = Store.get('weekPlan') || [];
    const modules = ['词汇', '听力', '阅读', '写作', '口语', '模考'];

    return `
      <div class="bento-card" style="overflow-x:auto">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
          <div>
            <div class="section-title">备考计划</div>
            <div class="section-meta">飞书多维表格风格 · 支持智能导入 · 可自由增删改</div>
          </div>
          <div style="display:flex;gap:8px">
            <button class="btn btn-outline-danger" onclick="Dashboard.confirmClearPlan()">清空所有计划</button>
            <button class="btn btn-smart-import" onclick="Dashboard.showImportModal()">✦ 智能导入计划</button>
            <button class="btn btn-primary" onclick="Dashboard.addPlanRow()">+ 新增任务</button>
          </div>
        </div>
        <table class="data-table">
          <thead>
            <tr>
              <th>任务名称</th>
              <th>模块</th>
              <th style="width:60px">日期</th>
              <th style="width:80px">难度</th>
              <th style="width:70px">目标量</th>
              <th style="width:70px">已完成</th>
              <th style="width:100px">进度</th>
              <th>备注</th>
              <th style="width:40px"></th>
            </tr>
          </thead>
          <tbody id="plan-body">
            ${plan.length ? plan.map(r => this.renderPlanRow(r, modules)).join('') : '<tr><td colspan="9"><div class="empty-state"><div class="text">暂无计划，点击「智能导入计划」或「新增任务」开始安排</div></div></td></tr>'}
          </tbody>
        </table>
      </div>
    `;
  },

  renderPlanRow(r, modules) {
    const pct = Utils.progressPct(r.completed, r.target);
    const dateShort = r.date ? r.date.slice(5) : '—';
    return `
      <tr data-id="${r.id}">
        <td><input type="text" value="${Utils.esc(r.name)}" onchange="Dashboard.updatePlan('${r.id}','name',this.value)"></td>
        <td>
          <select onchange="Dashboard.updatePlan('${r.id}','module',this.value)">
            ${modules.map(m => `<option ${r.module === m ? 'selected' : ''}>${m}</option>`).join('')}
          </select>
        </td>
        <td><span style="font-size:11px;color:var(--text-muted)">${dateShort}</span></td>
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
    plan.push({ id: Utils.uid(), name: '', module: '词汇', date: Utils.today(), difficulty: 3, target: 1, completed: 0, note: '' });
    Store.set('weekPlan', plan);
    this.renderTab();
  },

  updatePlan(id, field, value) {
    const plan = Store.get('weekPlan') || [];
    const r = plan.find(x => x.id === id);
    if (r) {
      r[field] = value;
      Store.set('weekPlan', plan);
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
    // Sync: remove corresponding uncompleted todos
    const todos = Store.get('todos') || [];
    Store.set('todos', todos.filter(t => t.planTaskId !== id || t.done));
    this.renderTab();
  },

  // ========================================
  // Clear All Plans
  // ========================================

  confirmClearPlan() {
    const plan = Store.get('weekPlan') || [];
    if (plan.length === 0) {
      Utils.toast('当前没有计划可清空');
      return;
    }
    App.showModal(`
      <div class="modal-title">确认清空</div>
      <div class="modal-body">
        <div style="font-size:13px;color:var(--text-body);line-height:1.7">
          确定要清空所有已排计划与关联待办吗？<br>
          <span style="color:var(--text-muted);font-size:12px">已打卡记录不受影响。</span>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="App.closeModal()">取消</button>
        <button class="btn btn-primary" style="background:#C0392B" onclick="Dashboard.clearAllPlan()">确认清空</button>
      </div>
    `);
  },

  clearAllPlan() {
    Store.set('weekPlan', []);
    // Remove plan-generated uncompleted todos (keep manually added & completed)
    const todos = Store.get('todos') || [];
    Store.set('todos', todos.filter(t => !t.planTaskId || t.done));
    App.closeModal();
    Utils.toast('已清空所有计划');
    this.renderTab();
  },

  // ========================================
  // Smart Import — 淘口令式智能计划解析
  // ========================================

  showImportModal() {
    App.showModal(`
      <div class="modal-title">✦ 智能导入计划</div>
      <div class="modal-body">
        <div style="margin-bottom:12px">
          <label class="form-label">起始日期（Day 1 绑定到该日期）</label>
          <input type="date" class="form-input" id="import-start-date" value="${Utils.today()}">
        </div>
        <div style="margin-bottom:12px">
          <label class="form-label">粘贴计划内容（支持 Markdown 表格 / 分行排期）</label>
          <textarea class="form-textarea" id="import-text" placeholder="粘贴你的备考计划，例如：

Day 1 | 词汇 | 自然地理 Ch.1 背词 | 60min
Day 2 | 阅读 | 剑14 Test 1 精读 | 45min
Day 3 | 听力 | 剑14 Test 1 精听 | 30min
Day 4 | 写作 | Task 2 练习 | 40min
Day 5 | 口语 | Part 1 话题练习 | 20min

或 Markdown 表格格式：

| Day | 模块 | 任务 | 时长 |
|-----|------|------|------|
| Day 1 | 词汇 | Ch.1 自然地理 | 60 |
| Day 2 | 阅读 | 剑14 T1 | 45 |

也可直接粘贴分行的任意格式文本。" style="min-height:200px;font-size:12px;line-height:1.6"></textarea>
        </div>
        <div style="font-size:11px;color:var(--text-muted);margin-bottom:8px">
          解析规则：自动识别 Day/天数/日期、模块（词汇/听力/阅读/写作/口语/模考）、任务名称、耗时。Day 1 = 起始日期，后续顺延。
        </div>
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:8px">
          <input type="checkbox" id="import-overwrite" checked style="accent-color:var(--accent-orange)">
          <label for="import-overwrite" style="font-size:12px;color:var(--text-body);cursor:pointer">覆盖现有计划（勾选时先清空旧计划，不勾选则追加）</label>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="App.closeModal()">取消</button>
        <button class="btn btn-primary" onclick="Dashboard.parseAndImport()">智能解析并生成</button>
      </div>
    `);
  },

  parseAndImport() {
    const startDate = document.getElementById('import-start-date').value || Utils.today();
    const text = document.getElementById('import-text').value.trim();

    if (!text) {
      Utils.toast('请粘贴计划内容');
      return;
    }

    const overwrite = document.getElementById('import-overwrite').checked;
    const lines = text.split('\n').map(l => l.trim()).filter(l => l);
    const plan = overwrite ? [] : (Store.get('weekPlan') || []);

    // If overwrite, also clean up plan-generated todos
    if (overwrite) {
      const todos = Store.get('todos') || [];
      Store.set('todos', todos.filter(t => !t.planTaskId));
    }

    const modules = ['词汇', '听力', '阅读', '写作', '口语', '模考'];
    let currentDay = 0;
    let parsedCount = 0;

    for (const line of lines) {
      // Skip markdown table separators (|---|---|)
      if (/^[\|\-:\s]+$/.test(line)) continue;
      // Skip headers like | Day | 模块 |...
      if (/day.*模块.*任务/i.test(line) || /day.*module.*task/i.test(line)) continue;

      // Parse the line
      const result = this.parsePlanLine(line, modules);
      if (!result) continue;

      // Assign date based on day number
      currentDay = result.dayNum || (currentDay + 1);
      if (!result.dayNum) result.dayNum = currentDay;
      const taskDate = Utils.addDays(startDate, result.dayNum - 1);

      plan.push({
        id: Utils.uid(),
        name: result.name,
        module: result.module,
        date: taskDate,
        difficulty: result.difficulty || 3,
        target: result.target || 1,
        completed: 0,
        note: result.note || (result.duration ? result.duration + 'min' : ''),
      });
      parsedCount++;
    }

    Store.set('weekPlan', plan);
    App.closeModal();
    Utils.toast(`已导入 ${parsedCount} 条计划`);
    this.renderTab();
  },

  parsePlanLine(line, modules) {
    // Remove markdown table pipes if present
    let clean = line.replace(/^\|/, '').replace(/\|$/, '').trim();

    // Try pipe-separated format: Day 1 | 词汇 | task | 60min
    let parts = clean.split('|').map(p => p.trim()).filter(p => p);

    // If no pipes, try comma/tab/space separation
    if (parts.length < 2) {
      parts = clean.split(/[\t,]+/).map(p => p.trim()).filter(p => p);
    }

    // If still single part, try space separation with known module keywords
    if (parts.length < 2) {
      parts = [clean];
    }

    // Extract day number
    let dayNum = 0;
    let dayMatch = null;
    for (let i = 0; i < parts.length; i++) {
      const m = parts[i].match(/day\s*(\d+)/i) || parts[i].match(/^第\s*(\d+)\s*天/) || parts[i].match(/^(\d+)\s*[日天]/);
      if (m) {
        dayNum = parseInt(m[1]);
        parts.splice(i, 1);
        break;
      }
    }

    // Extract date (YYYY-MM-DD)
    let dateStr = '';
    for (let i = 0; i < parts.length; i++) {
      const m = parts[i].match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
      if (m) {
        dateStr = `${m[1]}-${m[2].padStart(2,'0')}-${m[3].padStart(2,'0')}`;
        parts.splice(i, 1);
        break;
      }
    }

    // Extract module
    let module = '词汇';
    for (let i = 0; i < parts.length; i++) {
      let found = false;
      for (const mod of modules) {
        if (parts[i].includes(mod)) {
          module = mod;
          parts.splice(i, 1);
          found = true;
          break;
        }
      }
      if (found) break;
    }

    // Extract duration (e.g. 60min, 45分钟, 30m)
    let duration = '';
    for (let i = 0; i < parts.length; i++) {
      const m = parts[i].match(/(\d+)\s*(min|分钟|m)/i);
      if (m) {
        duration = m[1] + 'min';
        parts.splice(i, 1);
        break;
      }
    }

    // Extract difficulty (e.g. 难度3, ★★★, D3)
    let difficulty = 3;
    for (let i = 0; i < parts.length; i++) {
      const m = parts[i].match(/(?:难度|D|★)\s*(\d)/i) || parts[i].match(/(★+)/);
      if (m) {
        difficulty = m[1] ? parseInt(m[1]) : m[1].length;
        parts.splice(i, 1);
        break;
      }
    }

    // Remaining parts = task name
    const name = parts.join(' ').trim();
    if (!name) return null;

    return { dayNum, dateStr, module, name, duration, difficulty, target: 1 };
  },

  // ========================================
  // Cross-view sync helpers
  // ========================================

  getTodayPlanTasks() {
    const plan = Store.get('weekPlan') || [];
    const today = Utils.today();
    return plan.filter(r => r.date === today);
  },

  syncPlanProgress(planTaskId) {
    const plan = Store.get('weekPlan') || [];
    const r = plan.find(x => x.id === planTaskId);
    if (r) {
      r.completed = Math.min(r.target || 1, (r.completed || 0) + 1);
      Store.set('weekPlan', plan);
    }
  },
};
