/* ========================================
   Module 3: 阅读刷题与538同义替换
   538: List + Study Cards + Test + Mastery Tracking
   ======================================== */

const Reading = {
  view: 'exam',
  synCat: 'all',
  synSubView: 'list', // list | study | test | testSetup | testResult
  synStudyIdx: 0,
  synStudyHide: 'none', // none | cn | en
  synTestMode: null, // today | ebbinghaus | errors | custom
  synTestRange: { start: 1, end: 20 },
  synTestQuestions: [],
  synTestIdx: 0,
  synTestScore: { correct: 0, wrong: 0, wrongGroups: [] },
  synTestStartTime: 0,

  render() {
    return `
      <div class="pill-tabs">
        <div class="pill-tab ${this.view === 'exam' ? 'active' : ''}" onclick="Reading.switchView('exam')">剑雅题库</div>
        <div class="pill-tab ${this.view === 'syn538' ? 'active' : ''}" onclick="Reading.switchView('syn538')">538 考点词</div>
        <div class="pill-tab ${this.view === 'errors' ? 'active' : ''}" onclick="Reading.switchView('errors')">错题本</div>
      </div>
      <div id="reading-content"></div>
    `;
  },

  init() {
    this.renderView();
  },

  switchView(v) {
    this.view = v;
    Utils.$$('.pill-tab', document.getElementById('content')).forEach((el, i) => {
      const tabs = ['exam', 'syn538', 'errors'];
      el.classList.toggle('active', tabs[i] === v);
    });
    this.renderView();
  },

  renderView() {
    const c = document.getElementById('reading-content');
    if (this.view === 'exam') c.innerHTML = this.renderExam();
    else if (this.view === 'syn538') c.innerHTML = this.renderSyn538();
    else c.innerHTML = this.renderErrors();
  },

  // --- Exam Matrix ---
  renderExam() {
    const phases = [
      { name: '基础沉淀期', range: '剑4 - 剑14', swords: [4,5,6,7,8,9,10,11,12,13,14], desc: '适合做单篇精读与长难句拆解' },
      { name: '核心提分期', range: '剑15 - 剑18', swords: [15,16,17,18], desc: '分题型强化突破' },
      { name: '考前冲刺期', range: '剑19 - 剑21', swords: [19,20,21], desc: '全真限时模考' },
    ];

    return `
      <div class="bento-card warm" style="margin-bottom:20px">
        <div class="section-title">剑雅全题库阅读矩阵</div>
        <div class="section-meta">剑4 至最新剑21 · Test 1-4 · 链接爱听写真题库</div>
      </div>
      ${phases.map(phase => `
        <div style="margin-bottom:24px">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
            <span class="status-dot active">●</span>
            <span style="font-family:var(--font-serif);font-size:15px;font-weight:600;color:var(--text-title)">${phase.name}</span>
            <span style="font-size:12px;color:var(--text-muted)">${phase.range} · ${phase.desc}</span>
          </div>
          <div class="bento-grid cols-4">
            ${phase.swords.map(s => `
              <div class="bento-card" style="padding:16px">
                <div style="font-family:var(--font-serif);font-size:18px;font-weight:600;color:var(--text-title)">剑 ${s}</div>
                <div style="font-size:11px;color:var(--text-muted);margin-bottom:10px">Test 1-4 · Reading & Listening</div>
                <div style="display:flex;flex-direction:column;gap:4px">
                  ${[1,2,3,4].map(t => `
                    <a href="https://www.idictation.cn/main/book" target="_blank" class="arrow-link" style="font-size:12px">
                      Test ${t} <span style="color:var(--text-muted);margin-left:auto">R / L →</span>
                    </a>
                  `).join('')}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `).join('')}
    `;
  },

  // ========================================
  // 538 SYNONYMS — List + Study + Test
  // ========================================

  renderSyn538() {
    if (this.synSubView === 'study') return this.renderSyn538Study();
    if (this.synSubView === 'testSetup') return this.renderSynTestSetup();
    if (this.synSubView === 'test') return this.renderSynTest();
    if (this.synSubView === 'testResult') return this.renderSynTestResult();

    // --- List View ---
    const groups = Synonyms538.getByCategory(this.synCat);
    const cats = ['all', ...Object.keys(Synonyms538.categories)];
    const catLabels = { all: '全部', ...Synonyms538.categories };
    const progress = Store.get('synonyms538') || {};
    const mastered = Object.values(progress).filter(p => p.mastered).length;
    const inUse = Object.values(progress).filter(p => !p.mastered && p.studied).length;

    return `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
        <div>
          <div class="section-title">刘洪波 · 阅读538考点同义替换</div>
          <div class="section-meta">共 ${Synonyms538.groups.length} 组 · 掌握 ${mastered} · 在用 ${inUse}</div>
        </div>
        <div style="display:flex;gap:8px">
          <button class="btn btn-secondary" onclick="Reading.startSynStudy()">背诵学习</button>
          <button class="btn btn-primary" onclick="Reading.startSynTest()">开始考核</button>
        </div>
      </div>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
        <div class="pill-tabs" style="margin-bottom:0">
          ${cats.map(c => `
            <div class="pill-tab ${this.synCat === c ? 'active' : ''}" onclick="Reading.setSynCat('${c}')">${catLabels[c]}</div>
          `).join('')}
        </div>
        <div id="syn-accent-toggle">${Audio.accentToggle()}</div>
      </div>
      <div class="bento-grid cols-2">
        ${groups.map(g => {
          const p = progress[g.id] || {};
          const status = p.isMastered ? 'done' : p.studied ? 'active' : '';
          const statusText = p.isMastered ? '永久掌握' : p.studied ? (p.nextReviewDate && p.nextReviewDate <= Utils.today() ? '待复习' : '已学') : '未背';
          return `
            <div class="bento-card">
              <div style="display:flex;align-items:center;gap:6px;margin-bottom:10px">
                <span class="num-badge">№ ${String(g.id).padStart(3, '0')}</span>
                <span class="tag-chip orange">${g.category_cn || Synonyms538.categories[g.category]}</span>
                <span class="status-dot ${status}" style="margin-left:auto">${statusText}</span>
              </div>
              <div style="display:flex;align-items:baseline;gap:8px;margin-bottom:12px">
                <span style="font-family:var(--font-serif);font-size:20px;font-weight:600;color:var(--accent-orange-deep)">${g.core}</span>
                ${Audio.btn(g.core)}
                <span style="font-size:12px;color:var(--text-muted)">${g.pos}</span>
                <span style="font-size:14px;color:var(--text-body)">${g.cn}</span>
              </div>
              <div style="display:flex;flex-wrap:wrap;align-items:center;gap:4px">
                ${g.chain.map((item, i) => `
                  <span style="display:inline-flex;align-items:center;gap:3px">
                    <span style="font-family:var(--font-serif);font-size:14px;font-weight:${i === 0 ? '600' : '400'};color:${i === 0 ? 'var(--accent-orange-deep)' : 'var(--text-body)'};cursor:pointer;border-bottom:1px dashed transparent"
                          onmouseover="this.style.borderBottomColor='var(--accent-orange)'"
                          onmouseout="this.style.borderBottomColor='transparent'"
                          title="${item.cn}">${item.w}</span>
                    ${Audio.btn(item.w, {size: 13})}
                  </span>
                  ${i < g.chain.length - 1 ? '<span style="color:var(--text-muted);font-size:11px">=</span>' : ''}
                `).join('')}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  },

  setSynCat(c) {
    this.synCat = c;
    this.renderView();
  },

  // --- 538 Study Mode ---
  startSynStudy() {
    this.synSubView = 'study';
    // Find first unmastered group
    const progress = Store.get('synonyms538') || {};
    const groups = Synonyms538.getByCategory(this.synCat);
    let idx = groups.findIndex(g => !progress[g.id]?.mastered);
    if (idx < 0) idx = 0;
    this.synStudyIdx = idx;
    this.synStudyHide = 'none';
    this.renderView();
  },

  renderSyn538Study() {
    const groups = Synonyms538.getByCategory(this.synCat);
    const progress = Store.get('synonyms538') || {};
    const mastered = Object.values(progress).filter(p => p.mastered).length;
    const total = groups.length;

    // Find next unmastered
    let idx = this.synStudyIdx;
    while (idx < groups.length && progress[groups[idx].id]?.mastered) idx++;
    if (idx >= groups.length) idx = groups.length - 1;
    this.synStudyIdx = idx;

    const g = groups[idx];
    if (!g) return '<div class="empty-state">无数据</div>';

    const p = progress[g.id] || {};
    const isMastered = p.mastered;

    return `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
        <div>
          <div class="section-title">538 考点词背诵</div>
          <div class="section-meta">第 ${idx + 1} / ${total} 组 · 已掌握 ${mastered} / ${total}</div>
        </div>
        <div style="display:flex;gap:8px;align-items:center">
          <div id="syn-study-accent">${Audio.accentToggle()}</div>
          <button class="btn-ghost" onclick="Reading.synSubView='list';Reading.renderView()">返回列表</button>
        </div>
      </div>
      <div class="bento-card" style="max-width:600px;margin:0 auto;padding:36px 28px">
        <!-- Header -->
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:20px">
          <span class="num-badge">№ ${String(g.id).padStart(3, '0')}</span>
          <span class="tag-chip orange">${g.category_cn || Synonyms538.categories[g.category]}</span>
          <span class="status-dot ${isMastered ? 'done' : p.studied ? 'active' : ''}" style="margin-left:auto">${isMastered ? '已掌握' : p.studied ? '待复习' : '未背'}</span>
        </div>

        <!-- Core word -->
        <div style="text-align:center;margin-bottom:24px">
          <div style="font-family:var(--font-serif);font-size:36px;font-weight:600;color:var(--accent-orange-deep)">
            ${g.core} ${Audio.btn(g.core, {size: 20})}
          </div>
          <div style="font-size:13px;color:var(--text-muted);margin-top:4px">${g.pos} · ${this.synStudyHide === 'cn' ? '—— 遮挡中 ——' : g.cn}</div>
        </div>

        <!-- Chain with micro-meanings -->
        <div style="border:1px solid var(--border-card);border-radius:var(--r-md);padding:16px;margin-bottom:20px">
          <div style="font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px">同义替换链 · 微观释义</div>
          <div style="display:flex;flex-wrap:wrap;gap:8px">
            ${g.chain.map((item, i) => `
              <div style="display:inline-flex;align-items:center;gap:4px;padding:6px 10px;background:${i === 0 ? 'rgba(234,168,68,0.08)' : 'var(--bg-card-warm)'};border-radius:var(--r-sm)">
                <span style="font-family:var(--font-serif);font-size:15px;font-weight:${i === 0 ? '600' : '400'};color:${i === 0 ? 'var(--accent-orange-deep)' : 'var(--text-body)'}">${item.w}</span>
                ${Audio.btn(item.w, {size: 13})}
                <span style="font-size:11px;color:var(--text-muted);margin-left:2px">${this.synStudyHide === 'en' ? '' : item.cn}</span>
              </div>
              ${i < g.chain.length - 1 ? '<span style="color:var(--text-muted);font-size:11px;align-self:center">=</span>' : ''}
            `).join('')}
          </div>
        </div>

        <!-- Actions -->
        <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap">
          <button class="btn btn-secondary" onclick="Reading.toggleSynHide()">${this.synStudyHide === 'none' ? '遮挡中文自测' : this.synStudyHide === 'cn' ? '显示中文' : '显示英文'}</button>
          <button class="btn btn-secondary" onclick="Reading.synStudyPrev()">← 上一组</button>
          <button class="btn btn-primary" onclick="Reading.markSynMastered(${g.id})">标记掌握</button>
          <button class="btn btn-secondary" onclick="Reading.synStudyNext()">下一组 →</button>
        </div>

        <!-- Progress bar -->
        <div style="margin-top:24px">
          <div class="progress-track"><div class="progress-fill ${mastered === total ? 'high' : ''}" style="width:${Math.round(mastered / total * 100)}%"></div></div>
          <div style="display:flex;justify-content:space-between;margin-top:4px">
            <span style="font-size:11px;color:var(--text-muted)">${mastered} / ${total} mastered</span>
            <span style="font-size:11px;color:var(--text-muted)">${Math.round(mastered / total * 100)}%</span>
          </div>
        </div>
      </div>
    `;
  },

  toggleSynHide() {
    if (this.synStudyHide === 'none') this.synStudyHide = 'cn';
    else if (this.synStudyHide === 'cn') this.synStudyHide = 'en';
    else this.synStudyHide = 'none';
    this.renderView();
  },

  synStudyNext() {
    const groups = Synonyms538.getByCategory(this.synCat);
    if (this.synStudyIdx < groups.length - 1) {
      this.synStudyIdx++;
      this.synStudyHide = 'none';
      this.renderView();
    } else {
      Utils.toast('已是最后一组');
    }
  },

  synStudyPrev() {
    if (this.synStudyIdx > 0) {
      this.synStudyIdx--;
      this.synStudyHide = 'none';
      this.renderView();
    }
  },

  markSynMastered(groupId) {
    this.markStudied(groupId);
    // Directly mark as mastered (stage 5)
    const progress = Store.get('synonyms538') || {};
    if (!progress[groupId]) progress[groupId] = {};
    progress[groupId].studied = true;
    progress[groupId].isMastered = true;
    progress[groupId].reviewStage = 5;
    progress[groupId].lastReview = Utils.today();
    progress[groupId].nextReviewDate = null;
    Store.set('synonyms538', progress);
    App.updateMetrics();
    Utils.toast('已标记掌握');
    this.synStudyNext();
  },

  // --- 538 Test System ---
  startSynTest() {
    this.synSubView = 'testSetup';
    this.renderView();
  },

  renderSynTestSetup() {
    const progress = Store.get('synonyms538') || {};
    const today = Utils.today();
    const todayStudied = this.getTodayStudiedGroups();
    const dueReview = this.getEbbinghausDueGroups();
    const errorGroups = this.getErrorGroups();

    return `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px">
        <div>
          <div class="section-title">538 考点词考核</div>
          <div class="section-meta">仅针对已学词汇出题 · 艾宾浩斯滚动复习</div>
        </div>
        <button class="btn-ghost" onclick="Reading.synSubView='list';Reading.renderView()">返回列表</button>
      </div>
      <div class="bento-grid cols-2" style="max-width:640px;margin:0 auto">
        <!-- Mode A: Today's studied -->
        <div class="bento-card" style="cursor:pointer;border:2px solid ${this.synTestMode==='today'?'var(--accent-orange)':'transparent'}" onclick="Reading.selectTestMode('today')">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
            <span class="num-badge">A</span>
            <span class="tag-chip orange">今日必做</span>
            <span class="status-dot active" style="margin-left:auto">${todayStudied.length} 组</span>
          </div>
          <div style="font-family:var(--font-serif);font-size:16px;font-weight:600;color:var(--text-title);margin-bottom:4px">当日已背巩固</div>
          <div style="font-size:12px;color:var(--text-muted)">今日待考：${todayStudied.length} 组考点</div>
          ${todayStudied.length === 0 ? '<div style="font-size:11px;color:var(--text-muted);margin-top:4px">今日尚未背诵考点词，请先去背诵</div>' : ''}
        </div>

        <!-- Mode B: Ebbinghaus review -->
        <div class="bento-card" style="cursor:pointer;border:2px solid ${this.synTestMode==='ebbinghaus'?'var(--accent-orange)':'transparent'}" onclick="Reading.selectTestMode('ebbinghaus')">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
            <span class="num-badge">B</span>
            <span class="tag-chip green">智能唤醒</span>
            <span class="status-dot ${dueReview.length > 0 ? 'key' : ''}" style="margin-left:auto">${dueReview.length} 组</span>
          </div>
          <div style="font-family:var(--font-serif);font-size:16px;font-weight:600;color:var(--text-title);margin-bottom:4px">艾宾浩斯滚动复习</div>
          <div style="font-size:12px;color:var(--text-muted)">今日待复习：${dueReview.length} 组（1/2/4/7/15天节点）</div>
          ${dueReview.length === 0 ? '<div style="font-size:11px;color:var(--dot-done);margin-top:4px">暂无到期复习词，继续背新词！</div>' : ''}
        </div>

        <!-- Mode C: Error review -->
        <div class="bento-card" style="cursor:pointer;border:2px solid ${this.synTestMode==='errors'?'var(--accent-orange)':'transparent'}" onclick="Reading.selectTestMode('errors')">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
            <span class="num-badge">C</span>
            <span class="tag-chip red">弱项攻坚</span>
            <span class="status-dot key" style="margin-left:auto">${errorGroups.length} 组</span>
          </div>
          <div style="font-family:var(--font-serif);font-size:16px;font-weight:600;color:var(--text-title);margin-bottom:4px">错题本/弱项攻坚</div>
          <div style="font-size:12px;color:var(--text-muted)">历史答错且未消除的考点词</div>
          ${errorGroups.length === 0 ? '<div style="font-size:11px;color:var(--text-muted);margin-top:4px">暂无错题</div>' : ''}
        </div>

        <!-- Mode D: Custom range (only studied words in range) -->
        <div class="bento-card" style="cursor:pointer;border:2px solid ${this.synTestMode==='custom'?'var(--accent-orange)':'transparent'}" onclick="Reading.selectTestMode('custom')">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
            <span class="num-badge">D</span>
            <span class="status-dot" style="margin-left:auto">自定义</span>
          </div>
          <div style="font-family:var(--font-serif);font-size:16px;font-weight:600;color:var(--text-title);margin-bottom:8px">自定义范围考核</div>
          <div onclick="event.stopPropagation()" style="display:flex;align-items:center;gap:6px;margin-bottom:8px">
            <span style="font-size:12px;color:var(--text-muted)">从 №</span>
            <input type="number" class="form-input" style="width:64px;padding:4px 8px;text-align:center;position:relative;z-index:10" value="${this.synTestRange.start}" min="1" max="538" oninput="Reading.synTestRange.start=Math.max(1,parseInt(this.value)||1)" onclick="event.stopPropagation()" onmousedown="event.stopPropagation()">
            <span style="font-size:12px;color:var(--text-muted)">到 №</span>
            <input type="number" class="form-input" style="width:64px;padding:4px 8px;text-align:center;position:relative;z-index:10" value="${this.synTestRange.end}" min="1" max="538" oninput="Reading.synTestRange.end=Math.min(538,parseInt(this.value)||20)" onclick="event.stopPropagation()" onmousedown="event.stopPropagation()">
          </div>
          <div style="display:flex;gap:4px;flex-wrap:wrap" onclick="event.stopPropagation()">
            <span class="tag-chip" style="cursor:pointer" onclick="Reading.setTestRange(1,20)">前20组</span>
            <span class="tag-chip" style="cursor:pointer" onclick="Reading.setTestRange(1,40)">前40组</span>
            <span class="tag-chip" style="cursor:pointer" onclick="Reading.setTestRange(1,54)">第1类</span>
          </div>
        </div>
      </div>

      <!-- Quiz count + Start -->
      <div style="text-align:center;margin-top:24px">
        <div style="margin-bottom:12px;display:flex;align-items:center;justify-content:center;gap:8px">
          <span style="font-size:12px;color:var(--text-muted)">题量：</span>
          <select class="form-select" id="syn-test-count">
            <option value="10">10 题</option>
            <option value="20" selected>20 题</option>
            <option value="30">30 题</option>
            <option value="0">全部</option>
          </select>
        </div>
        <button class="btn btn-primary" onclick="Reading.launchSynTest()">开始考核 →</button>
      </div>
    `;
  },

  selectTestMode(mode) {
    this.synTestMode = mode;
    this.renderView();
  },

  setTestRange(start, end) {
    this.synTestRange = { start, end };
    this.synTestMode = 'custom';
    this.renderView();
  },

  launchSynTest() {
    let pool = [];
    let studiedPool = this.getAllStudiedGroups(); // for distractor source

    if (this.synTestMode === 'today') {
      pool = this.getTodayStudiedGroups();
    } else if (this.synTestMode === 'ebbinghaus') {
      pool = this.getEbbinghausDueGroups();
    } else if (this.synTestMode === 'errors') {
      pool = this.getErrorGroups();
    } else if (this.synTestMode === 'custom') {
      const s = Math.max(1, this.synTestRange.start);
      const e = Math.min(Synonyms538.groups.length, this.synTestRange.end);
      // Custom range: only include studied words in range (strict isolation)
      pool = Synonyms538.groups.filter(g => g.id >= s && g.id <= e && this.isStudied(g.id));
      // If no studied words in range, allow all in range as fallback
      if (pool.length === 0) {
        Utils.toast('该范围内尚无已学词汇，请先背诵');
        return;
      }
    }

    if (pool.length === 0) {
      Utils.toast('所选范围内没有已学考点词，请先背诵后再来考核');
      return;
    }

    pool.sort(() => Math.random() - 0.5);
    const countEl = document.getElementById('syn-test-count');
    let count = countEl ? parseInt(countEl.value) : 20;
    if (count === 0 || count > pool.length) count = pool.length;
    pool = pool.slice(0, count);

    // Generate questions with distractors from studied pool only
    this.synTestQuestions = pool.map(g => this.generateSynQuestion(g, studiedPool));
    this.synTestIdx = 0;
    this.synTestScore = { correct: 0, wrong: 0, wrongGroups: [] };
    this.synTestStartTime = Date.now();
    this.synSubView = 'test';
    this.renderView();
  },

  // ========================================
  // Ebbinghaus Engine
  // ========================================

  ebbinghausIntervals: [0, 1, 2, 4, 7, 15],

  getTodayStudiedGroups() {
    const progress = Store.get('synonyms538') || {};
    const today = Utils.today();
    return Object.entries(progress)
      .filter(([id, p]) => p.studied && p.lastStudiedDate === today)
      .map(([id, p]) => Synonyms538.groups.find(g => g.id == id))
      .filter(g => g);
  },

  getAllStudiedGroups() {
    const progress = Store.get('synonyms538') || {};
    return Object.entries(progress)
      .filter(([id, p]) => p.studied)
      .map(([id, p]) => Synonyms538.groups.find(g => g.id == id))
      .filter(g => g);
  },

  getEbbinghausDueGroups() {
    const progress = Store.get('synonyms538') || {};
    const today = Utils.today();
    return Object.entries(progress)
      .filter(([id, p]) => {
        if (!p.studied || p.isMastered) return false;
        return p.nextReviewDate && p.nextReviewDate <= today;
      })
      .map(([id, p]) => Synonyms538.groups.find(g => g.id == id))
      .filter(g => g);
  },

  getErrorGroups() {
    const progress = Store.get('synonyms538') || {};
    return Object.entries(progress)
      .filter(([id, p]) => p.studied && !p.isMastered && (p.historyMistakes || 0) > 0)
      .map(([id, p]) => Synonyms538.groups.find(g => g.id == id))
      .filter(g => g);
  },

  isStudied(groupId) {
    const progress = Store.get('synonyms538') || {};
    return progress[groupId]?.studied === true;
  },

  // Called when user marks a word as studied in study mode
  markStudied(groupId) {
    const progress = Store.get('synonyms538') || {};
    if (!progress[groupId]) progress[groupId] = {};
    progress[groupId].studied = true;
    progress[groupId].lastStudiedDate = Utils.today();
    progress[groupId].lastReview = Utils.today();
    progress[groupId].reviewStage = 0;
    progress[groupId].nextReviewDate = Utils.addDays(Utils.today(), 1);
    progress[groupId].historyMistakes = progress[groupId].historyMistakes || 0;
    progress[groupId].isMastered = false;
    Store.set('synonyms538', progress);
  },

  // Update Ebbinghaus state after a quiz answer
  updateEbbinghaus(groupId, isCorrect) {
    const progress = Store.get('synonyms538') || {};
    if (!progress[groupId]) progress[groupId] = { studied: true };
    const p = progress[groupId];
    p.studied = true;
    p.lastReview = Utils.today();

    if (isCorrect) {
      // Advance stage
      p.reviewStage = Math.min((p.reviewStage || 0) + 1, 5);
      if (p.reviewStage >= 5) {
        p.isMastered = true;
        p.nextReviewDate = null;
      } else {
        p.isMastered = false;
        const interval = this.ebbinghausIntervals[p.reviewStage];
        p.nextReviewDate = Utils.addDays(Utils.today(), interval);
      }
      p.error = false;
    } else {
      // Demote to stage 0/1
      p.reviewStage = Math.max(0, (p.reviewStage || 0) - 1);
      p.historyMistakes = (p.historyMistakes || 0) + 1;
      p.isMastered = false;
      p.error = true;
      p.nextReviewDate = Utils.addDays(Utils.today(), 1); // Review tomorrow
    }

    Store.set('synonyms538', progress);
  },

  generateSynQuestion(g, studiedPool) {
    // Use studiedPool for distractors (strict isolation — no unseen words)
    const distractorPool = studiedPool && studiedPool.length >= 4 ? studiedPool : Synonyms538.groups;
    const chain = g.chain.map(item => item.w);
    const qType = chain.length >= 3 ? Math.floor(Math.random() * 4) : Math.floor(Math.random() * 3);

    if (qType === 0 && chain.length >= 3) {
      // Type 1: Multi-blank chain fill
      const blankCount = Math.min(chain.length - 1, Math.max(1, Math.floor(chain.length / 2)));
      const available = [];
      for (let i = 1; i < chain.length; i++) available.push(i);
      available.sort(() => Math.random() - 0.5);
      const blankIndices = available.slice(0, blankCount);
      const blankWords = blankIndices.map(i => chain[i]);
      const displayChain = chain.map((w, i) => blankIndices.includes(i) ? null : w);
      // Distractors from studied pool chain words
      const allChainWords = distractorPool.flatMap(x => x.chain.map(item => item.w));
      const distractors = allChainWords.filter(w => !chain.includes(w)).sort(() => Math.random() - 0.5).slice(0, blankCount + 3);
      const options = [...blankWords, ...distractors].sort(() => Math.random() - 0.5);
      return { type: 0, group: g, blankIndices, blankWords, displayChain, options, blanksRemaining: [...blankWords], filledBlanks: [], answered: false, correct: false };
    } else if (qType === 1) {
      // Type 2: Chinese → English — distractors from studied pool
      const distractors = distractorPool.filter(x => x.id !== g.id).sort(() => Math.random() - 0.5).slice(0, 4);
      const options = [...distractors.map(d => d.core), g.core].sort(() => Math.random() - 0.5);
      return { type: 1, group: g, correctCn: g.cn, options, answered: false, correct: false };
    } else if (qType === 2) {
      // Type 3: English → Chinese — distractors from studied pool
      const distractors = distractorPool.filter(x => x.id !== g.id).sort(() => Math.random() - 0.5).slice(0, 4);
      const options = [...distractors.map(d => d.cn), g.cn].sort(() => Math.random() - 0.5);
      return { type: 2, group: g, correctCn: g.cn, options, answered: false, correct: false };
    } else {
      // Type 4: Pair matching — all 4 from studied pool
      const otherGroups = distractorPool.filter(x => x.id !== g.id).sort(() => Math.random() - 0.5).slice(0, 3);
      const allFour = [g, ...otherGroups];
      const leftCol = allFour.map(x => x.core);
      const rightCol = allFour.map(x => x.chain[Math.floor(Math.random() * x.chain.length)]?.w || x.core).sort(() => Math.random() - 0.5);
      return { type: 3, group: g, allFour, leftCol, rightCol, matches: {}, answered: false, correct: false };
    }
  },

  renderSynTest() {
    if (this.synTestQuestions.length === 0 || this.synTestIdx >= this.synTestQuestions.length) {
      return this.renderSynTestResult();
    }

    const q = this.synTestQuestions[this.synTestIdx];
    const total = this.synTestQuestions.length;
    const progressPct = Math.round(this.synTestIdx * 100 / total);
    const elapsed = Math.round((Date.now() - this.synTestStartTime) / 1000);

    const typeLabels = ['全链通关', '中→英选择', '英→中选择', '同义匹配'];

    let questionHtml = '';
    if (q.type === 0) {
      // Multi-blank chain fill
      questionHtml = `
        <div style="text-align:center;padding:16px 0;border:1px solid var(--border-card);border-radius:var(--r-md);margin-bottom:20px">
          <div style="font-size:11px;color:var(--text-muted);text-transform:uppercase;margin-bottom:6px">CORE WORD</div>
          <div style="display:flex;align-items:center;justify-content:center;gap:8px">
            <span style="font-family:var(--font-serif);font-size:24px;font-weight:600;color:var(--accent-orange-deep)">${q.group.core}</span>
            ${Audio.btn(q.group.core, {size: 16})}
          </div>
          <div style="font-size:13px;color:var(--text-muted);margin-top:4px">${q.group.pos} · ${q.group.cn}</div>
        </div>
        <div style="display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin-bottom:24px;justify-content:center">
          ${q.displayChain.map((w, i) => {
            if (w === null) {
              const filled = q.filledBlanks[i];
              return `<span class="syn-blank-slot" data-idx="${i}" style="display:inline-block;min-width:80px;padding:8px 14px;border:2px dashed ${filled ? 'var(--dot-done)' : 'var(--accent-orange)'};border-radius:var(--r-sm);text-align:center;font-size:14px;color:${filled ? 'var(--dot-done)' : 'var(--text-muted)'};font-weight:${filled ? '600' : '400'};cursor:pointer" onclick="Reading.unfillBlank(${i})">${filled || '? ? ?'}</span>`;
            }
            return `<span style="font-family:var(--font-serif);font-size:16px;color:var(--text-body)">${w}</span>`;
          }).map((html, i, arr) => html + (i < arr.length - 1 ? '<span style="color:var(--text-muted);font-size:12px">=</span>' : '')).join('')}
        </div>
        <div style="font-size:12px;color:var(--text-muted);margin-bottom:10px;text-align:center">点击词块填入空位 · 再点空位可撤回 · 全部填对才算通过</div>
        <div style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center" id="syn-options-area">
          ${q.options.map((o, i) => {
            const used = q.filledBlanks.includes(o);
            return `<div class="tag-chip syn-option" data-option="${o}" data-idx="${i}" style="cursor:${used ? 'default' : 'pointer'};font-size:14px;padding:8px 16px;${used ? 'opacity:0.3;pointer-events:none' : ''}" onclick="Reading.fillBlank(${i},'${o}')">${o}</div>`;
          }).join('')}
        </div>
      `;
    } else if (q.type === 1) {
      questionHtml = `
        <div style="text-align:center;padding:24px 0;margin-bottom:20px">
          <div style="font-size:11px;color:var(--text-muted);text-transform:uppercase;margin-bottom:8px">选择对应的英文主词</div>
          <div style="font-family:var(--font-serif);font-size:28px;font-weight:600;color:var(--text-title)">${q.correctCn}</div>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center">
          ${q.options.map((o, i) => `
            <div class="tag-chip syn-option" data-option="${o}" style="cursor:pointer;font-size:15px;padding:10px 20px;font-family:var(--font-serif)" onclick="Reading.synTestAnswer('${o}')">${o} ${Audio.btn(o, {size: 13})}</div>
          `).join('')}
        </div>
      `;
    } else if (q.type === 2) {
      questionHtml = `
        <div style="text-align:center;padding:24px 0;margin-bottom:20px">
          <div style="font-size:11px;color:var(--text-muted);text-transform:uppercase;margin-bottom:8px">选择对应的中文释义</div>
          <div style="display:flex;align-items:center;justify-content:center;gap:8px">
            <span style="font-family:var(--font-serif);font-size:28px;font-weight:600;color:var(--accent-orange-deep)">${q.group.core}</span>
            ${Audio.btn(q.group.core, {size: 16})}
          </div>
          <div style="font-size:13px;color:var(--text-muted);margin-top:4px">${q.group.pos || ''}</div>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center">
          ${q.options.map((o, i) => `
            <div class="tag-chip syn-option" data-option="${o}" style="cursor:pointer;font-size:14px;padding:8px 16px" onclick="Reading.synTestAnswer('${o}')">${o}</div>
          `).join('')}
        </div>
      `;
    } else {
      // Type 4: Pair matching
      questionHtml = `
        <div style="text-align:center;padding:16px 0;margin-bottom:20px">
          <div style="font-size:11px;color:var(--text-muted);text-transform:uppercase;margin-bottom:8px">将左侧主词与右侧同义替换词配对</div>
        </div>
        <div style="display:flex;gap:20px;justify-content:center;margin-bottom:20px">
          <div style="display:flex;flex-direction:column;gap:10px">
            <div style="font-size:10px;color:var(--text-muted);text-transform:uppercase;margin-bottom:4px;text-align:center">CORE</div>
            ${q.leftCol.map((word, i) => `
              <div class="syn-pair-left" data-word="${word}" data-idx="${i}" style="padding:10px 20px;border:2px solid ${q.matches[word] ? 'var(--accent-orange)' : 'var(--border-card)'};border-radius:var(--r-sm);cursor:pointer;text-align:center;font-family:var(--font-serif);font-size:15px;font-weight:600;color:var(--text-title);background:${q.matches[word] ? 'rgba(234,168,68,0.06)' : 'var(--bg-card-warm)'}" onclick="Reading.selectPairLeft('${word}')">${word}</div>
            `).join('')}
          </div>
          <div style="display:flex;flex-direction:column;gap:10px">
            <div style="font-size:10px;color:var(--text-muted);text-transform:uppercase;margin-bottom:4px;text-align:center">SYNONYM</div>
            ${q.rightCol.map((word, i) => {
              const matched = Object.entries(q.matches).find(([k,v]) => v === word);
              return `<div class="syn-pair-right" data-word="${word}" data-idx="${i}" style="padding:10px 20px;border:2px solid ${matched ? 'var(--dot-done)' : 'var(--border-card)'};border-radius:var(--r-sm);cursor:pointer;text-align:center;font-size:14px;color:var(--text-body);background:${matched ? 'rgba(111,170,91,0.06)' : 'var(--bg-card-warm)'}" onclick="Reading.selectPairRight('${word}')">${word}</div>`;
            }).join('')}
          </div>
        </div>
        <div id="syn-pair-status" style="text-align:center;font-size:12px;color:var(--text-muted)">${Object.keys(q.matches).length}/4 已配对</div>
      `;
    }

    return `
      <div class="bento-card" style="max-width:600px;margin:0 auto">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
          <span style="font-size:12px;color:var(--text-muted)">第 ${this.synTestIdx + 1} / ${total} 题</span>
          <div style="display:flex;gap:8px;align-items:center">
            <span style="font-size:12px;color:var(--dot-done)">✓ ${this.synTestScore.correct}</span>
            <span style="font-size:12px;color:var(--dot-key)">✗ ${this.synTestScore.wrong}</span>
            <span style="font-size:12px;color:var(--text-muted)">${elapsed}s</span>
          </div>
        </div>
        <div class="progress-track" style="margin-bottom:20px"><div class="progress-fill" style="width:${progressPct}%"></div></div>
        <div style="text-align:center;margin-bottom:8px">
          <span class="tag-chip orange">${typeLabels[q.type]}</span>
          <span class="num-badge" style="margin-left:4px">№ ${String(q.group.id).padStart(3, '0')}</span>
        </div>
        ${questionHtml}
        <div style="margin-top:24px;display:flex;justify-content:space-between;align-items:center">
          <button class="btn-ghost" onclick="Reading.synTestSkip()">跳过</button>
          ${q.type === 0 && q.filledBlanks.length > 0 ? '<button class="btn btn-primary" id="syn-chain-confirm" style="display:none" onclick="Reading.confirmChainFill()">确认</button>' : ''}
          <button class="btn-ghost" onclick="Reading.synTestQuit()">放弃</button>
        </div>
      </div>
    `;
  },

  // Multi-blank chain fill interaction
  fillBlank(optionIdx, word) {
    const q = this.synTestQuestions[this.synTestIdx];
    if (q.type !== 0 || q.answered) return;
    // Find first empty blank slot
    for (const idx of q.blankIndices) {
      if (!q.filledBlanks[idx]) {
        q.filledBlanks[idx] = word;
        // Remove from remaining
        const ri = q.blanksRemaining.indexOf(word);
        if (ri >= 0) q.blanksRemaining.splice(ri, 1);
        break;
      }
    }
    // Check if all filled
    const allFilled = q.blankIndices.every(idx => q.filledBlanks[idx]);
    if (allFilled) {
      this.confirmChainFill();
    } else {
      this.renderView();
    }
  },

  unfillBlank(idx) {
    const q = this.synTestQuestions[this.synTestIdx];
    if (q.type !== 0 || q.answered) return;
    const word = q.filledBlanks[idx];
    if (word) {
      delete q.filledBlanks[idx];
      q.blanksRemaining.push(word);
      this.renderView();
    }
  },

  confirmChainFill() {
    const q = this.synTestQuestions[this.synTestIdx];
    if (q.type !== 0 || q.answered) return;
    q.answered = true;
    // Check each blank — blankWords are the correct answers in order of blankIndices
    let allCorrect = true;
    for (let bi = 0; bi < q.blankIndices.length; bi++) {
      const idx = q.blankIndices[bi];
      const filled = q.filledBlanks[idx];
      const correctWord = q.blankWords[bi];
      if (filled !== correctWord) {
        allCorrect = false;
      }
    }
    q.correct = allCorrect;

    // Visual feedback
    Utils.$$('.syn-blank-slot').forEach(el => {
      const idx = parseInt(el.dataset.idx);
      const bi = q.blankIndices.indexOf(idx);
      const filled = q.filledBlanks[idx];
      const correctWord = q.blankWords[bi];
      if (filled === correctWord) {
        el.style.borderColor = 'var(--dot-done)';
        el.style.color = 'var(--dot-done)';
      } else {
        el.style.borderColor = 'var(--dot-key)';
        el.style.color = 'var(--dot-key)';
      }
    });
    Utils.$$('.syn-option').forEach(el => { el.style.pointerEvents = 'none'; });

    if (allCorrect) {
      this.synTestScore.correct++;
    } else {
      this.synTestScore.wrong++;
      this.synTestScore.wrongGroups.push(q.group);
    }
    setTimeout(() => this.synTestNext(), 1500);
  },

  // Pair matching interaction
  _pairLeftSel: null,
  selectPairLeft(word) {
    this._pairLeftSel = word;
    Utils.$$('.syn-pair-left').forEach(el => {
      el.style.background = el.dataset.word === word ? 'rgba(234,168,68,0.15)' : 'var(--bg-card-warm)';
    });
  },

  selectPairRight(word) {
    const q = this.synTestQuestions[this.synTestIdx];
    if (q.type !== 3 || q.answered) return;
    if (!this._pairLeftSel) {
      Utils.toast('请先点击左侧主词');
      return;
    }
    // Check if this right word is already matched
    const existingMatch = Object.entries(q.matches).find(([k,v]) => v === word);
    if (existingMatch) {
      delete q.matches[existingMatch[0]];
    }
    // Remove previous match for this left word
    delete q.matches[this._pairLeftSel];
    q.matches[this._pairLeftSel] = word;
    this._pairLeftSel = null;

    // Check if all 4 matched
    if (Object.keys(q.matches).length === 4) {
      this.confirmPairMatch();
    } else {
      this.renderView();
    }
  },

  confirmPairMatch() {
    const q = this.synTestQuestions[this.synTestIdx];
    if (q.type !== 3 || q.answered) return;
    q.answered = true;
    let allCorrect = true;
    for (const group of q.allFour) {
      const matched = q.matches[group.core];
      const isCorrect = group.chain.some(item => item.w === matched);
      if (!isCorrect) allCorrect = false;
      // Visual
      Utils.$$('.syn-pair-left').forEach(el => {
        if (el.dataset.word === group.core) {
          el.style.borderColor = isCorrect ? 'var(--dot-done)' : 'var(--dot-key)';
        }
      });
      Utils.$$('.syn-pair-right').forEach(el => {
        if (el.dataset.word === matched) {
          el.style.borderColor = isCorrect ? 'var(--dot-done)' : 'var(--dot-key)';
        }
      });
    }
    q.correct = allCorrect;
    if (allCorrect) {
      this.synTestScore.correct++;
    } else {
      this.synTestScore.wrong++;
      this.synTestScore.wrongGroups.push(q.group);
    }
    setTimeout(() => this.synTestNext(), 1500);
  },

  synTestAnswer(selected) {
    const q = this.synTestQuestions[this.synTestIdx];
    if (q.answered) return;
    q.answered = true;

    let correctAnswer = '';
    if (q.type === 1) correctAnswer = q.group.core;
    else correctAnswer = q.correctCn;

    const isCorrect = selected === correctAnswer;
    q.correct = isCorrect;

    Utils.$$('.syn-option').forEach(el => {
      const val = el.dataset.option;
      if (val === correctAnswer) {
        el.classList.add('green');
        el.style.fontWeight = '600';
      } else if (val === selected && !isCorrect) {
        el.classList.add('red');
      }
      el.style.pointerEvents = 'none';
    });

    if (isCorrect) {
      this.synTestScore.correct++;
    } else {
      this.synTestScore.wrong++;
      this.synTestScore.wrongGroups.push(q.group);
    }
    // Ebbinghaus state is updated in batch at finishSynTest()
    setTimeout(() => this.synTestNext(), 1200);
  },

  synTestNext() {
    if (this.synTestIdx < this.synTestQuestions.length - 1) {
      this.synTestIdx++;
      this.renderView();
    } else {
      this.finishSynTest();
    }
  },

  synTestPrev() {
    if (this.synTestIdx > 0) {
      this.synTestIdx--;
      this.renderView();
    }
  },

  synTestSkip() {
    this.synTestScore.wrong++;
    this.synTestQuestions[this.synTestIdx].correct = false;
    this.synTestScore.wrongGroups.push(this.synTestQuestions[this.synTestIdx].group);
    this.synTestNext();
  },

  synTestQuit() {
    this.finishSynTest();
  },

  finishSynTest() {
    const score = this.synTestScore.correct;
    const total = this.synTestQuestions.length;
    const pct = total > 0 ? Math.round(score * 100 / total) : 0;

    // Update Ebbinghaus state for each question
    this.synTestQuestions.forEach(q => {
      this.updateEbbinghaus(q.group.id, q.correct);
    });
    App.updateMetrics();

    // Store wrong groups for retry
    this.synTestScore.retryGroups = this.synTestScore.wrongGroups.map(g => g.id);
    this.synSubView = 'testResult';
    this.renderView();
  },

  renderSynTestResult() {
    const correct = this.synTestScore.correct;
    const wrong = this.synTestScore.wrong;
    const total = this.synTestQuestions.length;
    const pct = total > 0 ? Math.round(correct * 100 / total) : 0;
    const elapsed = Math.round((Date.now() - this.synTestStartTime) / 1000);
    const passed = pct >= 80;
    const wrongGroups = this.synTestScore.wrongGroups;
    const correctGroups = this.synTestQuestions.filter(q => q.correct).map(q => q.group);
    const mins = Math.floor(elapsed / 60);
    const secs = elapsed % 60;

    return `
      <div class="bento-card" style="max-width:600px;margin:0 auto;text-align:center">
        <div style="font-size:48px;margin-bottom:8px;opacity:0.2">●</div>
        <div style="font-family:var(--font-serif);font-size:48px;font-weight:600;color:${passed ? 'var(--dot-done)' : 'var(--dot-key)'}">${pct}%</div>
        <div style="font-size:13px;color:var(--text-muted);margin-top:4px;margin-bottom:24px">${passed ? '考核通过！正确率 ≥ 80%，已掌握词条自动流转' : '继续努力，正确率未达 80%'}</div>

        <div class="bento-grid cols-3" style="margin-bottom:24px">
          <div class="bento-card warm" style="padding:14px">
            <div style="font-family:var(--font-serif);font-size:24px;font-weight:600;color:var(--dot-done)">${correct}</div>
            <div style="font-size:11px;color:var(--text-muted);text-transform:uppercase">CORRECT</div>
          </div>
          <div class="bento-card warm" style="padding:14px">
            <div style="font-family:var(--font-serif);font-size:24px;font-weight:600;color:var(--dot-key)">${wrong}</div>
            <div style="font-size:11px;color:var(--text-muted);text-transform:uppercase">WRONG</div>
          </div>
          <div class="bento-card warm" style="padding:14px">
            <div style="font-family:var(--font-serif);font-size:24px;font-weight:600;color:var(--text-title)">${mins}:${String(secs).padStart(2,'0')}</div>
            <div style="font-size:11px;color:var(--text-muted);text-transform:uppercase">TIME</div>
          </div>
        </div>

        ${correctGroups.length > 0 ? `
          <div style="text-align:left;margin-bottom:16px">
            <div style="font-size:13px;font-weight:600;color:var(--dot-done);margin-bottom:8px">✓ 掌握清单 (${correctGroups.length})</div>
            <div style="display:flex;flex-wrap:wrap;gap:4px">
              ${correctGroups.map(g => `<span class="tag-chip green" style="font-size:11px">${g.core}</span>`).join('')}
            </div>
          </div>
        ` : ''}

        ${wrongGroups.length > 0 ? `
          <div style="text-align:left;margin-bottom:24px">
            <div style="font-size:13px;font-weight:600;color:var(--dot-key);margin-bottom:8px">✗ 需强化清单 (${wrongGroups.length}) · 同义链对比</div>
            ${wrongGroups.map(g => `
              <div style="padding:12px;border:1px solid var(--border-card);border-radius:var(--r-sm);margin-bottom:8px">
                <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px">
                  <span class="num-badge">№ ${String(g.id).padStart(3, '0')}</span>
                  <span style="font-family:var(--font-serif);font-weight:600;color:var(--accent-orange-deep)">${g.core}</span>
                  ${Audio.btn(g.core, {size: 13})}
                  <span style="font-size:12px;color:var(--text-muted)">${g.cn}</span>
                </div>
                <div style="font-size:12px;color:var(--text-body);display:flex;flex-wrap:wrap;gap:4px;align-items:center">
                  ${g.chain.map((item, i) => `
                    <span style="font-family:var(--font-serif);color:${i === 0 ? 'var(--accent-orange-deep)' : 'var(--text-body)'};font-weight:${i === 0 ? '600' : '400'}">${item.w}</span>
                    ${i < g.chain.length - 1 ? '<span style="color:var(--text-muted)">=</span>' : ''}
                  `).join('')}
                </div>
              </div>
            `).join('')}
          </div>
        ` : ''}

        <div style="display:flex;gap:8px;justify-content:center">
          ${wrongGroups.length > 0 ? `<button class="btn btn-primary" onclick="Reading.retrySynTest()">重考错题 (${wrongGroups.length})</button>` : ''}
          <button class="btn btn-secondary" onclick="Reading.synSubView='testSetup';Reading.renderView()">再考一轮</button>
          <button class="btn-ghost" onclick="Reading.synSubView='list';Reading.renderView()">返回列表</button>
        </div>
      </div>
    `;
  },

  retrySynTest() {
    const retryIds = this.synTestScore.retryGroups || [];
    const pool = retryIds.map(id => Synonyms538.groups.find(g => g.id === id)).filter(g => g);
    if (pool.length === 0) {
      Utils.toast('没有错题可重考');
      return;
    }
    this.synTestQuestions = pool.map(g => this.generateSynQuestion(g));
    this.synTestIdx = 0;
    this.synTestScore = { correct: 0, wrong: 0, wrongGroups: [], retryGroups: [] };
    this.synTestStartTime = Date.now();
    this.synSubView = 'test';
    this.renderView();
  },

  // --- Error Book ---
  renderErrors() {
    const errors = Store.get('readingErrors') || [];

    return `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
        <div>
          <div class="section-title">阅读错题本</div>
          <div class="section-meta">记录定位错题与同义替换盲区 · ${errors.length} 条</div>
        </div>
        <button class="btn btn-primary" onclick="Reading.showAddError()">+ 添加错题</button>
      </div>
      ${errors.length ? `
        <div class="bento-card">
          ${errors.map(e => `
            <div class="check-item" style="flex-direction:column;align-items:flex-start;gap:6px;padding:14px 0">
              <div style="display:flex;align-items:center;gap:8px;width:100%">
                <span class="tag-chip ${e.type === 'synonym' ? 'orange' : 'red'}">${e.type === 'synonym' ? '同义替换' : '定位错误'}</span>
                <span style="font-family:var(--font-serif);font-weight:600;color:var(--text-title)">${Utils.esc(e.word)}</span>
                <span style="margin-left:auto;font-size:11px;color:var(--text-muted)">${e.date}</span>
                <button class="btn-ghost" onclick="Reading.delError('${e.id}')">x</button>
              </div>
              ${e.note ? `<div style="font-size:13px;color:var(--text-body)">${Utils.esc(e.note)}</div>` : ''}
            </div>
          `).join('')}
        </div>
      ` : `
        <div class="bento-card">
          <div class="empty-state"><div class="text">暂无错题记录</div></div>
        </div>
      `}
    `;
  },

  showAddError() {
    App.showModal(`
      <div class="modal-title">添加错题</div>
      <div class="modal-body">
        <div style="margin-bottom:12px">
          <label class="form-label">类型</label>
          <select class="form-select" id="err-type" style="width:100%">
            <option value="synonym">同义替换盲区</option>
            <option value="location">定位错误</option>
          </select>
        </div>
        <div style="margin-bottom:12px">
          <label class="form-label">考点词 / 错题关键词</label>
          <input type="text" class="form-input" id="err-word" placeholder="如：increase = surge">
        </div>
        <div>
          <label class="form-label">备注（上下文/反思）</label>
          <textarea class="form-textarea" id="err-note" placeholder="记录错因和考点..."></textarea>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="App.closeModal()">取消</button>
        <button class="btn btn-primary" onclick="Reading.saveError()">保存</button>
      </div>
    `);
  },

  saveError() {
    const type = document.getElementById('err-type').value;
    const word = document.getElementById('err-word').value.trim();
    const note = document.getElementById('err-note').value.trim();
    if (!word) { Utils.toast('请输入关键词'); return; }
    const errors = Store.get('readingErrors') || [];
    errors.unshift({ id: Utils.uid(), type, word, note, date: Utils.today() });
    Store.set('readingErrors', errors);
    App.closeModal();
    this.renderView();
  },

  delError(id) {
    const errors = Store.get('readingErrors') || [];
    Store.set('readingErrors', errors.filter(e => e.id !== id));
    this.renderView();
  },
};
