/* ========================================
   Module: 雅思听力 — 刘夏来语料库听写系统
   - 4 tab categories with sub-filters
   - Dictation with TTS, speed control, auto-judge
   - Error notebook with elimination mode
   - Timer sync + todo auto-complete
   ======================================== */

const Listening = {
  view: 'panel', // panel | setup | dictation | result | errors
  curTab: 'basic',
  curSub: 'all',
  dictConfig: { count: 20, speed: 1.0, mode: 'auto', interval: 3 },
  dictWords: [],
  dictIdx: 0,
  dictScore: { correct: 0, wrong: 0, wrongWords: [] },
  dictStartTime: 0,
  dictInput: '',
  dictAnswered: false,
  _keyHandler: null,

  render() {
    return `
      <div id="listening-content"></div>
    `;
  },

  init() {
    this.view = 'panel';
    this.renderView();
  },

  renderView() {
    const c = document.getElementById('listening-content');
    if (this.view === 'panel') c.innerHTML = this.renderPanel();
    else if (this.view === 'setup') c.innerHTML = this.renderSetup();
    else if (this.view === 'dictation') c.innerHTML = this.renderDictation();
    else if (this.view === 'result') c.innerHTML = this.renderResult();
    else if (this.view === 'errors') c.innerHTML = this.renderErrors();
  },

  // ========================================
  // Panel — category cards
  // ========================================

  renderPanel() {
    const progress = Store.get('listeningProgress') || {};
    const errors = Store.get('listeningErrors') || [];

    return `
      <div style="margin-bottom:16px">
        <div class="section-title">雅思听力 · 刘夏来语料库</div>
        <div class="section-meta">听写训练 · 智能判分 · 错题消灭</div>
      </div>
      <div class="bento-grid cols-2">
        ${ListeningData.tabs.map(tab => {
          const words = ListeningData.getByTab(tab.key);
          const mastered = words.filter(w => progress[w.id]?.mastered).length;
          const pct = words.length ? Math.round(mastered * 100 / words.length) : 0;
          return `
            <div class="bento-card" style="cursor:pointer" onclick="Listening.selectTab('${tab.key}')">
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
                <div>
                  <div style="font-family:var(--font-serif);font-size:16px;font-weight:600;color:var(--text-title)">${tab.label}</div>
                  <div style="font-size:11px;color:var(--text-muted);margin-top:2px">${tab.desc}</div>
                </div>
                <div style="text-align:right">
                  <div style="font-family:var(--font-serif);font-size:20px;font-weight:600;color:var(--accent-orange-deep)">${words.length}</div>
                  <div style="font-size:9px;color:var(--text-muted);text-transform:uppercase">WORDS</div>
                </div>
              </div>
              <div style="margin:10px 0">
                <div class="progress-track"><div class="progress-fill ${pct >= 100 ? 'high' : ''}" style="width:${pct}%"></div></div>
                <div style="display:flex;justify-content:space-between;margin-top:4px">
                  <span style="font-size:10px;color:var(--text-muted)">${mastered}/${words.length} 掌握</span>
                  <span style="font-size:10px;color:var(--text-muted)">${pct}%</span>
                </div>
              </div>
              <button class="btn btn-primary" style="width:100%;font-size:12px;padding:6px" onclick="event.stopPropagation();Listening.startSetup('${tab.key}')">开始听写 →</button>
            </div>
          `;
        }).join('')}
      </div>

      <!-- Error notebook shortcut -->
      <div class="bento-card warm" style="margin-top:16px;cursor:pointer;display:flex;align-items:center;justify-content:space-between" onclick="Listening.view='errors';Listening.renderView()">
        <div>
          <div style="font-family:var(--font-serif);font-size:15px;font-weight:600;color:var(--text-title)">听力错题本</div>
          <div style="font-size:12px;color:var(--text-muted)">${errors.length} 个待消灭错词</div>
        </div>
        <span class="arrow-link">进入 →</span>
      </div>
    `;
  },

  selectTab(tab) {
    this.curTab = tab;
    this.curSub = 'all';
    this.startSetup(tab);
  },

  // ========================================
  // Setup — dictation config
  // ========================================

  startSetup(tab) {
    this.curTab = tab || this.curTab;
    this.view = 'setup';
    this.renderView();
  },

  renderSetup() {
    const tabInfo = ListeningData.tabs.find(t => t.key === this.curTab);
    const words = ListeningData.getByTab(this.curTab);
    const isSpecial = this.curTab === 'special';

    return `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
        <div>
          <div class="section-title">听写设置 · ${tabInfo?.label || ''}</div>
          <div class="section-meta">${words.length} 词可选</div>
        </div>
        <button class="btn-ghost" onclick="Listening.view='panel';Listening.renderView()">返回</button>
      </div>

      ${isSpecial ? `
        <div class="pill-tabs" style="margin-bottom:16px">
          ${ListeningData.specialSubs.map(s => `
            <div class="pill-tab ${this.curSub === s.key ? 'active' : ''}" onclick="Listening.curSub='${s.key}';Listening.renderView()">${s.label}</div>
          `).join('')}
        </div>
      ` : ''}

      <div class="bento-card" style="max-width:520px;margin:0 auto">
        <!-- Range -->
        <div style="margin-bottom:20px">
          <div class="form-label">抽题范围</div>
          <div style="display:flex;gap:6px;flex-wrap:wrap">
            <select class="form-select" id="dict-count">
              <option value="10">10 词</option>
              <option value="20" selected>20 词</option>
              <option value="40">40 词</option>
              <option value="0">全部 (${this.getFilteredCount()} 词)</option>
            </select>
          </div>
        </div>

        <!-- Speed -->
        <div style="margin-bottom:20px">
          <div class="form-label">播放语速</div>
          <div style="display:flex;gap:6px">
            ${[0.8, 1.0, 1.2, 1.4].map(s => `
              <div class="pill-tab ${this.dictConfig.speed === s ? 'active' : ''}" onclick="Listening.dictConfig.speed=${s};Listening.renderView()">${s}x</div>
            `).join('')}
          </div>
        </div>

        <!-- Mode -->
        <div style="margin-bottom:20px">
          <div class="form-label">播放模式</div>
          <div style="display:flex;gap:6px">
            <div class="pill-tab ${this.dictConfig.mode === 'auto' ? 'active' : ''}" onclick="Listening.dictConfig.mode='auto';Listening.renderView()">自动下一题</div>
            <div class="pill-tab ${this.dictConfig.mode === 'manual' ? 'active' : ''}" onclick="Listening.dictConfig.mode='manual';Listening.renderView()">手动切换</div>
          </div>
          ${this.dictConfig.mode === 'auto' ? `
            <div style="display:flex;gap:6px;margin-top:8px">
              <div class="pill-tab ${this.dictConfig.interval === 3 ? 'active' : ''}" onclick="Listening.dictConfig.interval=3;Listening.renderView()">间隔 3s</div>
              <div class="pill-tab ${this.dictConfig.interval === 5 ? 'active' : ''}" onclick="Listening.dictConfig.interval=5;Listening.renderView()">间隔 5s</div>
            </div>
          ` : ''}
        </div>

        <div style="text-align:center">
          <button class="btn btn-primary" onclick="Listening.launchDictation()">开始听写 →</button>
        </div>
      </div>
    `;
  },

  getFilteredCount() {
    return ListeningData.getByTabAndSub(this.curTab, this.curSub).length;
  },

  // ========================================
  // Dictation — immersive keyboard flow
  // ========================================

  launchDictation() {
    let pool = ListeningData.getByTabAndSub(this.curTab, this.curSub);
    if (pool.length === 0) {
      Utils.toast('该范围内没有词汇');
      return;
    }
    pool.sort(() => Math.random() - 0.5);
    const countEl = document.getElementById('dict-count');
    let count = countEl ? parseInt(countEl.value) : 20;
    if (count === 0 || count > pool.length) count = pool.length;
    this.dictWords = pool.slice(0, count);
    this.dictIdx = 0;
    this.dictScore = { correct: 0, wrong: 0, wrongWords: [] };
    this.dictStartTime = Date.now();
    this.dictInput = '';
    this.dictAnswered = false;
    this.view = 'dictation';
    this.renderView();
    // Auto-play first word
    setTimeout(() => this.playWord(), 300);
    this.bindKeyboard();
  },

  renderDictation() {
    if (this.dictIdx >= this.dictWords.length) {
      return this.renderResult();
    }
    const w = this.dictWords[this.dictIdx];
    const total = this.dictWords.length;
    const elapsed = Math.round((Date.now() - this.dictStartTime) / 1000);
    const progressPct = Math.round(this.dictIdx * 100 / total);

    return `
      <div class="bento-card" style="max-width:560px;margin:0 auto;text-align:center">
        <!-- Status bar -->
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
          <span style="font-size:12px;color:var(--text-muted)">第 ${this.dictIdx + 1} / ${total} 词</span>
          <div style="display:flex;gap:10px;align-items:center">
            <span style="font-size:12px;color:var(--dot-done)">✓ ${this.dictScore.correct}</span>
            <span style="font-size:12px;color:var(--dot-key)">✗ ${this.dictScore.wrong}</span>
            <span style="font-size:12px;color:var(--text-muted)">${elapsed}s</span>
          </div>
        </div>
        <div class="progress-track" style="margin-bottom:24px"><div class="progress-fill" style="width:${progressPct}%"></div></div>

        <!-- Play button -->
        <div style="margin-bottom:20px">
          <div onclick="Listening.playWord()" style="display:inline-flex;align-items:center;justify-content:center;width:64px;height:64px;border-radius:50%;background:var(--accent-black);cursor:pointer;transition:transform 0.2s" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
            <span style="color:#fff;font-size:24px">▶</span>
          </div>
          <div style="font-size:11px;color:var(--text-muted);margin-top:8px">点击播放 · 按 Space 重播</div>
        </div>

        <!-- Input -->
        <div id="dict-input-area">
          <input type="text" id="dict-input" class="form-input" style="font-size:20px;text-align:center;font-family:var(--font-serif);padding:12px 16px;max-width:320px;margin:0 auto"
            placeholder="拼写单词..." autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"
            value="${this.dictInput}"
            oninput="Listening.dictInput=this.value"
            onkeydown="if(event.key==='Enter'){event.preventDefault();Listening.submitAnswer()}">
        </div>

        <!-- Feedback area -->
        <div id="dict-feedback" style="margin-top:16px;min-height:60px"></div>

        <!-- Controls -->
        <div style="margin-top:20px;display:flex;justify-content:space-between;align-items:center">
          <button class="btn-ghost" onclick="Listening.skipWord()">跳过</button>
          <button class="btn-ghost" onclick="Listening.quitDictation()">结束</button>
        </div>
      </div>
    `;
  },

  bindKeyboard() {
    if (this._keyHandler) document.removeEventListener('keydown', this._keyHandler);
    this._keyHandler = (e) => {
      if (e.code === 'Space' && this.view === 'dictation') {
        e.preventDefault();
        this.playWord();
      }
    };
    document.addEventListener('keydown', this._keyHandler);
  },

  playWord() {
    if (this.dictIdx >= this.dictWords.length) return;
    const w = this.dictWords[this.dictIdx];
    const accent = Store.get('settings')?.audioAccent || 'en-GB';
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(w.word);
      u.lang = accent;
      u.rate = this.dictConfig.speed;
      window.speechSynthesis.speak(u);
    }
    // Focus input
    setTimeout(() => {
      const input = document.getElementById('dict-input');
      if (input) input.focus();
    }, 100);
  },

  submitAnswer() {
    if (this.dictAnswered) return;
    const w = this.dictWords[this.dictIdx];
    const input = this.dictInput.trim().toLowerCase();
    const correct = w.word.toLowerCase();

    this.dictAnswered = true;

    if (input === correct) {
      // Correct
      this.dictScore.correct++;
      this.markProgress(w.id, true);
      document.getElementById('dict-feedback').innerHTML = `
        <div style="color:var(--dot-done);font-size:14px;font-weight:600">✓ 正确！</div>
        <div style="font-size:12px;color:var(--text-muted);margin-top:4px">${w.word} ${w.phonetic} · ${w.meaning}</div>
      `;
      document.getElementById('dict-input-area').style.opacity = '0.5';
      document.getElementById('dict-input').style.borderColor = 'var(--dot-done)';

      // Auto next
      if (this.dictConfig.mode === 'auto') {
        setTimeout(() => this.nextWord(), (this.dictConfig.interval || 3) * 1000);
      }
    } else {
      // Wrong
      this.dictScore.wrong++;
      this.dictScore.wrongWords.push(w);
      this.markProgress(w.id, false);
      this.addError(w, input);

      // Error type detection
      const errorTags = this.detectErrorType(input, correct, w);

      document.getElementById('dict-feedback').innerHTML = `
        <div style="color:var(--dot-key);font-size:14px;font-weight:600">✗ 拼写错误</div>
        <div style="margin-top:8px;padding:10px;background:var(--bg-card-warm);border-radius:var(--r-sm)">
          <div style="font-size:13px;color:var(--text-body)">你的拼写：<span style="color:var(--dot-key);font-weight:600">${Utils.esc(input)}</span></div>
          <div style="font-size:13px;color:var(--text-body);margin-top:4px">标准拼写：<span style="color:var(--dot-done);font-weight:600">${w.word}</span> ${w.phonetic}</div>
          <div style="font-size:12px;color:var(--text-muted);margin-top:4px">${w.pos} ${w.meaning}</div>
          ${errorTags.length ? `<div style="margin-top:6px">${errorTags.map(t => `<span class="tag-chip red" style="font-size:10px">${t}</span>`).join('')}</div>` : ''}
        </div>
      `;
      document.getElementById('dict-input').style.borderColor = 'var(--dot-key)';

      if (this.dictConfig.mode === 'auto') {
        setTimeout(() => this.nextWord(), (this.dictConfig.interval + 2) * 1000);
      }
    }

    // Check timer auto-save (5 min)
    this.checkAutoSave();
  },

  detectErrorType(input, correct, w) {
    const errors = [];
    // Missing plural s
    if (correct.endsWith('s') && !input.endsWith('s')) {
      errors.push('#漏写复数s');
    }
    // Extra plural s
    if (!correct.endsWith('s') && input.endsWith('s')) {
      errors.push('#多余复数s');
    }
    // Double letter missing
    for (let i = 0; i < correct.length - 1; i++) {
      if (correct[i] === correct[i + 1] && input.length > i && input[i] !== input[Math.min(i + 1, input.length - 1)]) {
        errors.push('#字母双写遗漏');
        break;
      }
    }
    // Word tags
    if (w.tags) {
      for (const tag of w.tags) {
        if (tag.includes('不可数') && input.endsWith('s')) {
          errors.push('#不可数名词加了s');
        }
        if (tag.includes('单复数同形') && input.endsWith('s')) {
          errors.push('#单复数同形无需加s');
        }
      }
    }
    return errors;
  },

  nextWord() {
    this.dictIdx++;
    this.dictInput = '';
    this.dictAnswered = false;
    if (this.dictIdx >= this.dictWords.length) {
      this.finishDictation();
    } else {
      this.renderView();
      setTimeout(() => this.playWord(), 300);
    }
  },

  skipWord() {
    if (!this.dictAnswered) {
      this.dictScore.wrong++;
      this.dictScore.wrongWords.push(this.dictWords[this.dictIdx]);
      this.addError(this.dictWords[this.dictIdx], '(skipped)');
    }
    this.nextWord();
  },

  quitDictation() {
    this.finishDictation();
  },

  finishDictation() {
    if (this._keyHandler) {
      document.removeEventListener('keydown', this._keyHandler);
      this._keyHandler = null;
    }
    this.view = 'result';
    this.renderView();
  },

  checkAutoSave() {
    const elapsed = Math.round((Date.now() - this.dictStartTime) / 1000);
    if (elapsed >= 300 && elapsed % 300 < 5) {
      // Auto-save 5 min
      const sessions = Store.get('focusSessions') || [];
      sessions.push({ date: Utils.today(), duration: 5, mode: 'listening', timestamp: Date.now(), auto: true });
      Store.set('focusSessions', sessions);
      App.updateMetrics();
      Utils.toast('听力练习已自动保存 5 分钟');
    }
  },

  markProgress(wordId, correct) {
    const progress = Store.get('listeningProgress') || {};
    if (!progress[wordId]) progress[wordId] = { correctCount: 0, wrongCount: 0, mastered: false };
    if (correct) {
      progress[wordId].correctCount++;
      if (progress[wordId].correctCount >= 2) {
        progress[wordId].mastered = true;
      }
    } else {
      progress[wordId].wrongCount++;
    }
    Store.set('listeningProgress', progress);
  },

  addError(word, userInput) {
    const errors = Store.get('listeningErrors') || [];
    // Dedup by word id — update if exists
    const existing = errors.find(e => e.id === word.id);
    if (existing) {
      existing.userInput = userInput;
      existing.date = Utils.today();
      existing.streak = 0;
    } else {
      errors.unshift({ id: word.id, word: word.word, meaning: word.meaning, phonetic: word.phonetic, userInput, date: Utils.today(), streak: 0 });
    }
    Store.set('listeningErrors', errors);
  },

  // ========================================
  // Result
  // ========================================

  renderResult() {
    const correct = this.dictScore.correct;
    const wrong = this.dictScore.wrong;
    const total = this.dictWords.length;
    const pct = total > 0 ? Math.round(correct * 100 / total) : 0;
    const elapsed = Math.round((Date.now() - this.dictStartTime) / 1000);
    const mins = Math.floor(elapsed / 60);
    const secs = elapsed % 60;
    const wrongWords = this.dictScore.wrongWords;

    // Sync todo
    this.syncTodo();

    return `
      <div class="bento-card" style="max-width:560px;margin:0 auto;text-align:center">
        <div style="font-size:48px;margin-bottom:8px;opacity:0.2">●</div>
        <div style="font-family:var(--font-serif);font-size:48px;font-weight:600;color:${pct >= 80 ? 'var(--dot-done)' : 'var(--dot-key)'}">${pct}%</div>
        <div style="font-size:13px;color:var(--text-muted);margin-top:4px;margin-bottom:24px">听写完成 · ${mins}:${String(secs).padStart(2,'0')}</div>

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

        ${wrongWords.length > 0 ? `
          <div style="text-align:left;margin-bottom:24px">
            <div style="font-size:13px;font-weight:600;color:var(--dot-key);margin-bottom:8px">✗ 错词清单 (${wrongWords.length})</div>
            ${wrongWords.map(w => `
              <div style="padding:10px;border:1px solid var(--border-card);border-radius:var(--r-sm);margin-bottom:6px">
                <div style="display:flex;align-items:center;gap:6px">
                  <span style="font-family:var(--font-serif);font-weight:600;color:var(--accent-orange-deep)">${w.word}</span>
                  <span style="font-size:12px;color:var(--text-muted)">${w.phonetic}</span>
                  <span style="font-size:12px;color:var(--text-body)">${w.meaning}</span>
                </div>
                ${w.tags?.length ? `<div style="margin-top:4px">${w.tags.map(t => `<span class="tag-chip" style="font-size:9px">${t}</span>`).join('')}</div>` : ''}
              </div>
            `).join('')}
          </div>
        ` : ''}

        <div style="display:flex;gap:8px;justify-content:center">
          ${wrongWords.length > 0 ? `<button class="btn btn-primary" onclick="Listening.retryErrors()">重听错词 (${wrongWords.length})</button>` : ''}
          <button class="btn btn-secondary" onclick="Listening.view='setup';Listening.renderView()">再练一轮</button>
          <button class="btn-ghost" onclick="Listening.view='panel';Listening.renderView()">返回面板</button>
        </div>
      </div>
    `;
  },

  retryErrors() {
    this.dictWords = [...this.dictScore.wrongWords];
    this.dictIdx = 0;
    this.dictScore = { correct: 0, wrong: 0, wrongWords: [] };
    this.dictStartTime = Date.now();
    this.dictInput = '';
    this.dictAnswered = false;
    this.view = 'dictation';
    this.renderView();
    setTimeout(() => this.playWord(), 300);
    this.bindKeyboard();
  },

  syncTodo() {
    // Auto-complete listening todo for today
    const todos = Store.get('todos') || [];
    let dirty = false;
    for (const t of todos) {
      if (!t.done && t.text && t.text.includes('听力')) {
        t.done = true;
        t.completedAt = Utils.today();
        dirty = true;
      }
    }
    if (dirty) {
      Store.set('todos', todos);
      const checkins = Store.get('checkins') || {};
      checkins[Utils.today()] = true;
      Store.set('checkins', checkins);
    }
  },

  // ========================================
  // Error Notebook
  // ========================================

  renderErrors() {
    const errors = Store.get('listeningErrors') || [];

    return `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
        <div>
          <div class="section-title">听力错题本</div>
          <div class="section-meta">${errors.length} 个待消灭错词 · 连续正确 2 次自动移出</div>
        </div>
        <div style="display:flex;gap:8px">
          ${errors.length > 0 ? `<button class="btn btn-primary" onclick="Listening.startErrorDictation()">错题二次听写 (1.2x)</button>` : ''}
          <button class="btn-ghost" onclick="Listening.view='panel';Listening.renderView()">返回</button>
        </div>
      </div>
      ${errors.length ? `
        <div class="bento-card">
          ${errors.map(e => `
            <div class="check-item" style="flex-direction:column;align-items:flex-start;gap:4px;padding:12px 0">
              <div style="display:flex;align-items:center;gap:8px;width:100%">
                <span style="font-family:var(--font-serif);font-weight:600;color:var(--accent-orange-deep)">${e.word}</span>
                <span style="font-size:12px;color:var(--text-muted)">${e.phonetic || ''}</span>
                <span style="font-size:12px;color:var(--text-body)">${e.meaning}</span>
                <span style="margin-left:auto;font-size:11px;color:var(--text-muted)">${e.date}</span>
                ${e.streak > 0 ? `<span class="tag-chip green" style="font-size:9px">连续正确 ${e.streak}</span>` : ''}
                <button class="btn-ghost" onclick="Listening.removeError('${e.id}')">x</button>
              </div>
              ${e.userInput && e.userInput !== '(skipped)' ? `<div style="font-size:11px;color:var(--dot-key)">误写：${Utils.esc(e.userInput)}</div>` : ''}
            </div>
          `).join('')}
        </div>
      ` : `
        <div class="bento-card">
          <div class="empty-state"><div class="text">暂无错题，继续保持！</div></div>
        </div>
      `}
    `;
  },

  startErrorDictation() {
    const errors = Store.get('listeningErrors') || [];
    if (errors.length === 0) {
      Utils.toast('没有错题可练习');
      return;
    }
    this.dictWords = errors.map(e => ListeningData.words.find(w => w.id === e.id)).filter(w => w);
    this.dictIdx = 0;
    this.dictScore = { correct: 0, wrong: 0, wrongWords: [] };
    this.dictStartTime = Date.now();
    this.dictInput = '';
    this.dictAnswered = false;
    this.dictConfig.speed = 1.2; // Error mode: 1.2x
    this.view = 'dictation';
    this.renderView();
    setTimeout(() => this.playWord(), 300);
    this.bindKeyboard();
  },

  removeError(id) {
    const errors = Store.get('listeningErrors') || [];
    Store.set('listeningErrors', errors.filter(e => e.id !== id));
    this.renderView();
  },
};
