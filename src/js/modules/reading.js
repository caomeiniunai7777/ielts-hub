/* ========================================
   Module 3: 阅读刷题与538同义替换
   538: List + Study Cards + Test + Mastery Tracking
   ======================================== */

const Reading = {
  view: 'exam',
  synCat: 'all',
  synSubView: 'list', // list | study | test
  synStudyIdx: 0,
  synStudyHide: 'none', // none | cn | en

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
    if (this.synSubView === 'test') return this.renderSynTest();

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

  // --- 538 Test ---
  startSynTest() {
    this.synSubView = 'test';
    this.renderView();
  },

  renderSynTest() {
    const groups = Synonyms538.getByCategory(this.synCat);
    const g = groups[Math.floor(Math.random() * groups.length)];
    const chain = g.chain.map(item => item.w);
    // Blank 1-2 words (not the first)
    const possibleBlanks = [];
    for (let i = 1; i < chain.length; i++) possibleBlanks.push(i);
    possibleBlanks.sort(() => Math.random() - 0.5);
    const numBlanks = Math.random() > 0.5 ? 1 : 2;
    const blankIndices = possibleBlanks.slice(0, numBlanks);
    const blankWords = blankIndices.map(i => chain[i]);

    // Build display chain
    const displayChain = chain.map((w, i) => blankIndices.includes(i) ? null : w);

    // Generate options: correct answers + distractors
    const allWords = Synonyms538.groups.flatMap(x => x.chain.map(item => item.w));
    const distractors = allWords.filter(w => !chain.includes(w)).sort(() => Math.random() - 0.5).slice(0, 5);
    const options = [...blankWords, ...distractors].sort(() => Math.random() - 0.5);

    return `
      <div class="bento-card" style="max-width:640px;margin:0 auto">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px">
          <div>
            <div class="section-title">同义替换考核</div>
            <div class="section-meta">№ ${String(g.id).padStart(3, '0')} · ${Synonyms538.categories[g.category]}</div>
          </div>
          <div style="display:flex;gap:8px;align-items:center">
            <div id="syn-test-accent">${Audio.accentToggle()}</div>
            <button class="btn-ghost" onclick="Reading.synSubView='list';Reading.renderView()">返回列表</button>
          </div>
        </div>

        <!-- Core word -->
        <div style="text-align:center;padding:20px 0;border:1px solid var(--border-card);border-radius:var(--r-md);margin-bottom:20px">
          <div style="font-size:11px;color:var(--text-muted);text-transform:uppercase;margin-bottom:6px">CORE WORD</div>
          <div style="display:flex;align-items:center;justify-content:center;gap:8px">
            <span style="font-family:var(--font-serif);font-size:28px;font-weight:600;color:var(--accent-orange-deep)">${g.core}</span>
            ${Audio.btn(g.core, {size: 18})}
          </div>
          <div style="font-size:13px;color:var(--text-muted);margin-top:4px">${g.pos} · ${g.cn}</div>
        </div>

        <!-- Chain with blanks -->
        <div style="display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin-bottom:24px;justify-content:center">
          ${displayChain.map((w, i) => {
            if (w === null) {
              return `<span id="blank-${i}" style="display:inline-block;min-width:90px;padding:8px 14px;border:2px dashed var(--accent-orange);border-radius:var(--r-sm);text-align:center;font-size:14px;color:var(--text-muted)">? ? ?</span>`;
            }
            return `<span style="display:inline-flex;align-items:center;gap:3px"><span style="font-family:var(--font-serif);font-size:16px;color:var(--text-body)">${w}</span>${Audio.btn(w, {size: 13})}</span>`;
          }).map((html, i, arr) => {
            return html + (i < arr.length - 1 ? '<span style="color:var(--text-muted);font-size:12px">=</span>' : '');
          }).join('')}
        </div>

        <!-- Options -->
        <div style="font-size:12px;color:var(--text-muted);margin-bottom:10px;text-align:center">选择正确的同义替换词填入空缺（共 ${numBlanks} 个空）</div>
        <div style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center">
          ${options.map(o => `
            <div class="tag-chip" style="cursor:pointer;font-size:14px;padding:8px 16px" onclick="Reading.synTestAnswer(this,'${o}','${blankWords.join(',')}')">${o}</div>
          `).join('')}
        </div>

        <div style="margin-top:24px;display:flex;justify-content:center;gap:8px">
          <button class="btn btn-primary" onclick="Reading.startSynTest()">换一组</button>
          <button class="btn btn-secondary" onclick="Reading.startSynStudy()">去背诵</button>
        </div>
      </div>
    `;
  },

  synTestAnswer(el, selected, correct) {
    const correctList = correct.split(',');
    if (correctList.includes(selected)) {
      el.classList.add('green');
      el.style.fontWeight = '600';
      Utils.toast('正确！');
      // Fill in the first empty blank
      const blanks = Utils.$$('.bento-card span[id^="blank-"]');
      for (const b of blanks) {
        if (b.textContent.includes('?')) {
          b.textContent = selected;
          b.style.border = '2px solid var(--dot-done)';
          b.style.color = 'var(--dot-done)';
          b.style.fontWeight = '600';
          break;
        }
      }
    } else {
      el.classList.add('red');
      Utils.toast('不正确，正确答案见链条');
    }
    el.style.pointerEvents = 'none';
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
