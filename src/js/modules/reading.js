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
  synTestMode: null, // today | custom | errors | random
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
          const status = p.mastered ? 'done' : p.studied ? 'active' : '';
          const statusText = p.mastered ? '已掌握' : p.studied ? '待复习' : '未背';
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
    const progress = Store.get('synonyms538') || {};
    if (!progress[groupId]) progress[groupId] = {};
    progress[groupId].mastered = true;
    progress[groupId].studied = true;
    progress[groupId].lastReview = Utils.today();
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
    const todayStudied = Object.entries(progress).filter(([id, p]) => p.studied && p.lastReview === today);
    const errorGroups = Object.entries(progress).filter(([id, p]) => p.studied && !p.mastered);
    const masteredCount = Object.values(progress).filter(p => p.mastered).length;

    return `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px">
        <div>
          <div class="section-title">538 考点词考核</div>
          <div class="section-meta">选择考核范围，精准检测背诵效果</div>
        </div>
        <button class="btn-ghost" onclick="Reading.synSubView='list';Reading.renderView()">返回列表</button>
      </div>
      <div class="bento-grid cols-2" style="max-width:640px;margin:0 auto">
        <!-- Mode A: Today's studied -->
        <div class="bento-card" style="cursor:pointer;border:2px solid ${this.synTestMode==='today'?'var(--accent-orange)':'transparent'}" onclick="Reading.selectTestMode('today')">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
            <span class="num-badge">A</span>
            <span class="tag-chip orange">推荐</span>
            <span class="status-dot active" style="margin-left:auto">${todayStudied.length} 组</span>
          </div>
          <div style="font-family:var(--font-serif);font-size:16px;font-weight:600;color:var(--text-title);margin-bottom:4px">当日已背巩固</div>
          <div style="font-size:12px;color:var(--text-muted)">今日待考：${todayStudied.length} 组考点</div>
          ${todayStudied.length === 0 ? '<div style="font-size:11px;color:var(--text-muted);margin-top:4px">今天还没有背词，去背诵后再来考核</div>' : ''}
        </div>

        <!-- Mode B: Custom range -->
        <div class="bento-card" style="cursor:pointer;border:2px solid ${this.synTestMode==='custom'?'var(--accent-orange)':'transparent'}" onclick="Reading.selectTestMode('custom')">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
            <span class="num-badge">B</span>
            <span class="status-dot" style="margin-left:auto">自定义</span>
          </div>
          <div style="font-family:var(--font-serif);font-size:16px;font-weight:600;color:var(--text-title);margin-bottom:8px">自定义范围考核</div>
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:8px">
            <span style="font-size:12px;color:var(--text-muted)">从 №</span>
            <input type="number" class="form-input" style="width:60px;padding:4px 8px;text-align:center" value="${this.synTestRange.start}" min="1" max="${Synonyms538.groups.length}" onchange="Reading.synTestRange.start=parseInt(this.value)||1">
            <span style="font-size:12px;color:var(--text-muted)">到 №</span>
            <input type="number" class="form-input" style="width:60px;padding:4px 8px;text-align:center" value="${this.synTestRange.end}" min="1" max="${Synonyms538.groups.length}" onchange="Reading.synTestRange.end=parseInt(this.value)||20">
          </div>
          <div style="display:flex;gap:4px;flex-wrap:wrap">
            <span class="tag-chip" style="cursor:pointer" onclick="Reading.setTestRange(1,20)">前20组</span>
            <span class="tag-chip" style="cursor:pointer" onclick="Reading.setTestRange(1,40)">前40组</span>
            <span class="tag-chip" style="cursor:pointer" onclick="Reading.setTestRange(1,54)">第1类</span>
            <span class="tag-chip" style="cursor:pointer" onclick="Reading.setTestRange(55,${Synonyms538.groups.length})">第2+3类</span>
          </div>
        </div>

        <!-- Mode C: Error review -->
        <div class="bento-card" style="cursor:pointer;border:2px solid ${this.synTestMode==='errors'?'var(--accent-orange)':'transparent'}" onclick="Reading.selectTestMode('errors')">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
            <span class="num-badge">C</span>
            <span class="tag-chip red">待复习</span>
            <span class="status-dot key" style="margin-left:auto">${errorGroups.length} 组</span>
          </div>
          <div style="font-family:var(--font-serif);font-size:16px;font-weight:600;color:var(--text-title);margin-bottom:4px">错题/待复习专项</div>
          <div style="font-size:12px;color:var(--text-muted)">从待复习的考点池中抽题</div>
          ${errorGroups.length === 0 ? '<div style="font-size:11px;color:var(--text-muted);margin-top:4px">暂无待复习词条</div>' : ''}
        </div>

        <!-- Mode D: Random all -->
        <div class="bento-card" style="cursor:pointer;border:2px solid ${this.synTestMode==='random'?'var(--accent-orange)':'transparent'}" onclick="Reading.selectTestMode('random')">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
            <span class="num-badge">D</span>
            <span class="tag-chip green">全书</span>
            <span class="status-dot done" style="margin-left:auto">${Synonyms538.groups.length} 组</span>
          </div>
          <div style="font-family:var(--font-serif);font-size:16px;font-weight:600;color:var(--text-title);margin-bottom:4px">全书随机挑战</div>
          <div style="font-size:12px;color:var(--text-muted)">从全部 ${Synonyms538.groups.length} 组考点中随机抽题</div>
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
    const progress = Store.get('synonyms538') || {};
    const today = Utils.today();
    let pool = [];

    if (this.synTestMode === 'today') {
      pool = Object.entries(progress)
        .filter(([id, p]) => p.studied && p.lastReview === today)
        .map(([id, p]) => Synonyms538.groups.find(g => g.id == id))
        .filter(g => g);
    } else if (this.synTestMode === 'custom') {
      const s = Math.max(1, this.synTestRange.start);
      const e = Math.min(Synonyms538.groups.length, this.synTestRange.end);
      pool = Synonyms538.groups.filter(g => g.id >= s && g.id <= e);
    } else if (this.synTestMode === 'errors') {
      pool = Object.entries(progress)
        .filter(([id, p]) => p.studied && !p.mastered)
        .map(([id, p]) => Synonyms538.groups.find(g => g.id == id))
        .filter(g => g);
    } else {
      pool = [...Synonyms538.groups];
    }

    if (pool.length === 0) {
      Utils.toast('所选范围内没有考点词，请先背诵');
      return;
    }

    // Shuffle pool
    pool.sort(() => Math.random() - 0.5);

    // Get question count
    const countEl = document.getElementById('syn-test-count');
    let count = countEl ? parseInt(countEl.value) : 20;
    if (count === 0 || count > pool.length) count = pool.length;
    pool = pool.slice(0, count);

    // Generate questions (mix of 3 types)
    this.synTestQuestions = pool.map(g => this.generateSynQuestion(g));
    this.synTestIdx = 0;
    this.synTestScore = { correct: 0, wrong: 0, wrongGroups: [] };
    this.synTestStartTime = Date.now();
    this.synSubView = 'test';
    this.renderView();
  },

  generateSynQuestion(g) {
    // Randomly pick question type: 0=chain fill, 1=cn-en match, 2=en-cn match
    const qType = Math.floor(Math.random() * 3);
    const chain = g.chain.map(item => item.w);
    const correctCn = g.cn;

    if (qType === 0 && chain.length >= 3) {
      // Type 1: Chain fill-in-blank
      const blankIdx = 1 + Math.floor(Math.random() * (chain.length - 2));
      const blankWord = chain[blankIdx];
      const displayChain = chain.map((w, i) => i === blankIdx ? null : w);
      const distractors = Synonyms538.groups
        .flatMap(x => x.chain.map(item => item.w))
        .filter(w => !chain.includes(w))
        .sort(() => Math.random() - 0.5).slice(0, 4);
      const options = [...distractors, blankWord].sort(() => Math.random() - 0.5);
      return { type: 0, group: g, blankIdx, blankWord, displayChain, options, answered: false, correct: false };
    } else if (qType === 1) {
      // Type 2: Chinese → English (pick the English word matching the Chinese meaning)
      const distractors = Synonyms538.groups
        .filter(x => x.id !== g.id)
        .sort(() => Math.random() - 0.5).slice(0, 4);
      const options = [...distractors.map(d => d.core), g.core].sort(() => Math.random() - 0.5);
      return { type: 1, group: g, correctCn, options, answered: false, correct: false };
    } else {
      // Type 3: English → Chinese (pick the Chinese meaning matching the English word)
      const distractors = Synonyms538.groups
        .filter(x => x.id !== g.id)
        .sort(() => Math.random() - 0.5).slice(0, 4);
      const options = [...distractors.map(d => d.cn), correctCn].sort(() => Math.random() - 0.5);
      return { type: 2, group: g, correctCn, options, answered: false, correct: false };
    }
  },

  renderSynTest() {
    if (this.synTestQuestions.length === 0 || this.synTestIdx >= this.synTestQuestions.length) {
      return this.renderSynTestResult();
    }

    const q = this.synTestQuestions[this.synTestIdx];
    const total = this.synTestQuestions.length;
    const progressPct = Math.round(this.synTestIdx * 100 / total);
    const score = this.synTestScore.correct + this.synTestScore.wrong;
    const elapsed = Math.round((Date.now() - this.synTestStartTime) / 1000);

    let questionHtml = '';
    if (q.type === 0) {
      // Chain fill
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
              return `<span id="syn-blank" style="display:inline-block;min-width:90px;padding:8px 14px;border:2px dashed var(--accent-orange);border-radius:var(--r-sm);text-align:center;font-size:14px;color:var(--text-muted)">? ? ?</span>`;
            }
            return `<span style="display:inline-flex;align-items:center;gap:3px"><span style="font-family:var(--font-serif);font-size:16px;color:var(--text-body)">${w}</span></span>`;
          }).map((html, i, arr) => html + (i < arr.length - 1 ? '<span style="color:var(--text-muted);font-size:12px">=</span>' : '')).join('')}
        </div>
        <div style="font-size:12px;color:var(--text-muted);margin-bottom:10px;text-align:center">选择正确的同义替换词</div>
        <div style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center">
          ${q.options.map((o, i) => `
            <div class="tag-chip syn-option" data-option="${o}" style="cursor:pointer;font-size:14px;padding:8px 16px" onclick="Reading.synTestAnswer(${i},'${o}')">${o}</div>
          `).join('')}
        </div>
      `;
    } else if (q.type === 1) {
      // CN → EN
      questionHtml = `
        <div style="text-align:center;padding:24px 0;margin-bottom:20px">
          <div style="font-size:11px;color:var(--text-muted);text-transform:uppercase;margin-bottom:8px">选择对应的英文主词</div>
          <div style="font-family:var(--font-serif);font-size:28px;font-weight:600;color:var(--text-title)">${q.correctCn}</div>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center">
          ${q.options.map((o, i) => `
            <div class="tag-chip syn-option" data-option="${o}" style="cursor:pointer;font-size:15px;padding:10px 20px;font-family:var(--font-serif)" onclick="Reading.synTestAnswer(${i},'${o}')">${o} ${Audio.btn(o, {size: 13})}</div>
          `).join('')}
        </div>
      `;
    } else {
      // EN → CN
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
            <div class="tag-chip syn-option" data-option="${o}" style="cursor:pointer;font-size:14px;padding:8px 16px" onclick="Reading.synTestAnswer(${i},'${o}')">${o}</div>
          `).join('')}
        </div>
      `;
    }

    return `
      <div class="bento-card" style="max-width:600px;margin:0 auto">
        <!-- Progress bar -->
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
          <span style="font-size:12px;color:var(--text-muted)">第 ${this.synTestIdx + 1} / ${total} 题</span>
          <div style="display:flex;gap:8px;align-items:center">
            <span style="font-size:12px;color:var(--dot-done)">✓ ${this.synTestScore.correct}</span>
            <span style="font-size:12px;color:var(--dot-key)">✗ ${this.synTestScore.wrong}</span>
            <span style="font-size:12px;color:var(--text-muted)">${elapsed}s</span>
          </div>
        </div>
        <div class="progress-track" style="margin-bottom:20px"><div class="progress-fill" style="width:${progressPct}%"></div></div>

        <!-- Question type label -->
        <div style="text-align:center;margin-bottom:8px">
          <span class="tag-chip orange">${q.type === 0 ? '同义链填空' : q.type === 1 ? '中→英选择' : '英→中选择'}</span>
          <span class="num-badge" style="margin-left:4px">№ ${String(q.group.id).padStart(3, '0')}</span>
        </div>

        ${questionHtml}

        <div style="margin-top:24px;display:flex;justify-content:space-between;align-items:center">
          <button class="btn-ghost" onclick="Reading.synTestSkip()">跳过</button>
          ${this.synTestIdx > 0 ? `<button class="btn-ghost" onclick="Reading.synTestPrev()">← 上一题</button>` : ''}
          <button class="btn-ghost" onclick="Reading.synTestQuit()">放弃</button>
        </div>
      </div>
    `;
  },

  synTestAnswer(optionIdx, selected) {
    const q = this.synTestQuestions[this.synTestIdx];
    if (q.answered) return;
    q.answered = true;

    let correctAnswer = '';
    if (q.type === 0) correctAnswer = q.blankWord;
    else if (q.type === 1) correctAnswer = q.group.core;
    else correctAnswer = q.correctCn;

    const isCorrect = selected === correctAnswer;
    q.correct = isCorrect;

    // Update options visual
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
      // Mark as error in progress
      const progress = Store.get('synonyms538') || {};
      if (!progress[q.group.id]) progress[q.group.id] = {};
      progress[q.group.id].studied = true;
      progress[q.group.id].error = true;
      progress[q.group.id].lastReview = Utils.today();
      Store.set('synonyms538', progress);
    }

    // Auto-advance after 1.2s
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
    const elapsed = Math.round((Date.now() - this.synTestStartTime) / 1000);

    // Auto-master words with >= 80% accuracy
    if (pct >= 80) {
      const progress = Store.get('synonyms538') || {};
      this.synTestQuestions.forEach(q => {
        if (q.correct) {
          if (!progress[q.group.id]) progress[q.group.id] = {};
          progress[q.group.id].mastered = true;
          progress[q.group.id].studied = true;
          progress[q.group.id].lastReview = Utils.today();
          progress[q.group.id].error = false;
        }
      });
      Store.set('synonyms538', progress);
      App.updateMetrics();
    }

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
    const mins = Math.floor(elapsed / 60);
    const secs = elapsed % 60;

    return `
      <div class="bento-card" style="max-width:600px;margin:0 auto;text-align:center">
        <div style="font-size:48px;margin-bottom:8px;opacity:0.2">●</div>
        <div style="font-family:var(--font-serif);font-size:48px;font-weight:600;color:${passed ? 'var(--dot-done)' : 'var(--dot-key)'}">${pct}%</div>
        <div style="font-size:13px;color:var(--text-muted);margin-top:4px;margin-bottom:24px">${passed ? '考核通过！正确率 ≥ 80%' : '继续努力，正确率未达 80%'}</div>

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

        ${wrongGroups.length > 0 ? `
          <div style="text-align:left;margin-bottom:24px">
            <div style="font-size:13px;font-weight:600;color:var(--text-title);margin-bottom:8px">错误考点词 · 同义链对比</div>
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
