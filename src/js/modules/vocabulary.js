/* ========================================
   Module 2: 词汇真经闪卡记忆系统
   3-pass learning + Ebbinghaus review
   ======================================== */

const Vocabulary = {
  view: 'browse', // browse | study | quiz
  curChapter: 1,
  curIdx: 0,
  passPhase: 1, // 1=recognize, 2=recall, 3=spell

  render() {
    return `
      <div class="pill-tabs">
        <div class="pill-tab ${this.view === 'browse' ? 'active' : ''}" onclick="Vocabulary.switchView('browse')">章节总览</div>
        <div class="pill-tab ${this.view === 'study' ? 'active' : ''}" onclick="Vocabulary.switchView('study')">背词学习</div>
        <div class="pill-tab ${this.view === 'quiz' ? 'active' : ''}" onclick="Vocabulary.switchView('quiz')">巩固测验</div>
        <div class="pill-tab ${this.view === 'review' ? 'active' : ''}" onclick="Vocabulary.switchView('review')">艾宾浩斯复习</div>
      </div>
      <div id="vocab-content"></div>
    `;
  },

  init() {
    const sess = Store.get('vocabSession') || { chapter: 1, index: 0 };
    this.curChapter = sess.chapter;
    this.curIdx = sess.index;
    this.renderView();
  },

  switchView(v) {
    this.view = v;
    Utils.$$('.pill-tab', document.getElementById('content')).forEach((el, i) => {
      const tabs = ['browse', 'study', 'quiz', 'review'];
      el.classList.toggle('active', tabs[i] === v);
    });
    this.renderView();
  },

  renderView() {
    const c = document.getElementById('vocab-content');
    if (this.view === 'browse') c.innerHTML = this.renderBrowse();
    else if (this.view === 'study') c.innerHTML = this.renderStudy();
    else if (this.view === 'quiz') c.innerHTML = this.renderQuiz();
    else if (this.view === 'review') c.innerHTML = this.renderReview();
  },

  // --- Browse ---
  renderBrowse() {
    const vocab = Store.get('vocab') || {};
    const chapters = VocabData.chapters;

    return `
      <div class="bento-card" style="margin-bottom:20px">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px">
          <div class="section-title">雅思词汇真经</div>
          <div class="section-meta">刘洪波 · 共 ${VocabData.totalWords()} 词 · 22 章</div>
        </div>
      </div>
      <div class="bento-grid cols-2">
        ${chapters.map(ch => {
          const chWords = ch.words;
          const mastered = chWords.filter(w => vocab[`${ch.id}-${w.w}`]?.mastered).length;
          const started = chWords.filter(w => vocab[`${ch.id}-${w.w}`]?.pass > 0).length;
          const pct = Math.round((mastered / chWords.length) * 100);
          return `
            <div class="bento-card" style="cursor:pointer" onclick="Vocabulary.startStudy(${ch.id})">
              <div style="display:flex;align-items:center;justify-content:space-between">
                <div>
                  <div class="num-badge">№ ${String(ch.id).padStart(2, '0')}</div>
                  <div style="font-family:var(--font-serif);font-size:15px;font-weight:600;color:var(--text-title);margin-top:4px">${ch.name}</div>
                </div>
                <div style="text-align:right">
                  <div style="font-size:11px;color:var(--text-muted)">${mastered}/${chWords.length} 掌握</div>
                </div>
              </div>
              <div style="margin-top:12px">
                <div class="progress-track"><div class="progress-fill ${pct >= 100 ? 'high' : ''}" style="width:${pct}%"></div></div>
                <div style="display:flex;justify-content:space-between;margin-top:6px">
                  <span class="status-dot ${pct >= 100 ? 'done' : started > 0 ? 'active' : ''}">${pct >= 100 ? '已掌握' : started > 0 ? '在用' : '未开始'}</span>
                  <span class="arrow-link">进入 →</span>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  },

  startStudy(chId) {
    this.curChapter = chId;
    this.curIdx = 0;
    this.view = 'study';
    Store.set('vocabSession', { chapter: chId, index: 0 });
    Utils.$$('.pill-tab', document.getElementById('content')).forEach((el, i) => {
      el.classList.toggle('active', i === 1);
    });
    this.renderView();
  },

  // --- Study (3-pass learning) ---
  renderStudy() {
    const ch = VocabData.getChapter(this.curChapter);
    if (!ch) return '<div class="empty-state">章节不存在</div>';

    // Auto-find next unmastered word
    const vocab = Store.get('vocab') || {};
    let idx = this.curIdx;
    while (idx < ch.words.length) {
      const key = `${ch.id}-${ch.words[idx].w}`;
      const progress = vocab[key];
      if (!progress || !progress.mastered) break;
      idx++;
    }

    if (idx >= ch.words.length) {
      return `
        <div class="bento-card" style="text-align:center;max-width:480px;margin:0 auto">
          <div style="font-size:48px;margin-bottom:12px;opacity:0.2">●</div>
          <div class="section-title">本章已全部掌握</div>
          <div class="section-meta" style="margin-bottom:20px">${ch.name} · ${ch.words.length} words completed</div>
          <button class="btn btn-primary" onclick="Vocabulary.switchView('browse')">返回章节总览</button>
        </div>
      `;
    }

    this.curIdx = idx;
    const word = ch.words[idx];
    const key = `${ch.id}-${word.w}`;
    const progress = vocab[key] || { pass: 0, mastered: false };
    this.passPhase = progress.pass >= 2 ? 3 : progress.pass >= 1 ? 2 : 1;

    const total = ch.words.length;
    const mastered = ch.words.filter(w => vocab[`${ch.id}-${w.w}`]?.mastered).length;

    return `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
        <div>
          <div class="section-title">${ch.name}</div>
          <div class="section-meta">第 ${idx + 1} / ${total} 词 · 已掌握 ${mastered}</div>
        </div>
        <select class="form-select" onchange="Vocabulary.jumpChapter(parseInt(this.value))">
          ${VocabData.chapters.map(c => `<option value="${c.id}" ${c.id === ch.id ? 'selected' : ''}>Ch.${c.id} ${c.name}</option>`).join('')}
        </select>
      </div>
      <div style="display:flex;justify-content:center;margin-bottom:12px">${Audio.accentToggle()}</div>
      <div class="bento-card" style="max-width:560px;margin:0 auto;padding:40px 32px;text-align:center">
        <div style="display:flex;justify-content:center;gap:8px;margin-bottom:24px">
          <div class="tag-chip ${this.passPhase >= 1 ? 'green' : ''}">第1遍 认知</div>
          <div class="tag-chip ${this.passPhase >= 2 ? 'green' : ''}">第2遍 回忆</div>
          <div class="tag-chip ${this.passPhase >= 3 ? 'green' : ''}">第3遍 拼写</div>
        </div>
        <div style="font-family:var(--font-serif);font-size:42px;font-weight:600;color:var(--text-title);margin-bottom:8px">
          ${word.w} ${Audio.btn(word.w)}
        </div>
        <div style="font-size:16px;color:var(--accent-primary);font-style:italic;margin-bottom:16px">${word.phon}</div>
        <div style="display:flex;justify-content:center;gap:6px;margin-bottom:20px">
          <span class="tag-chip orange">${word.pos}</span>
          ${word.tags.map(t => `<span class="tag-chip">${t}</span>`).join('')}
        </div>
        <div id="word-detail" style="min-height:80px">
          ${this.passPhase === 1 ? `
            <div style="font-size:20px;color:var(--text-title);margin-bottom:12px">${word.cn}</div>
            <button class="btn btn-primary" onclick="Vocabulary.completePass('${key}')">已认知，进入第2遍 →</button>
          ` : this.passPhase === 2 ? `
            <div id="recall-area" style="margin-bottom:16px">
              <div style="font-size:14px;color:var(--text-muted);margin-bottom:8px">请尝试回忆释义，然后点击查看</div>
              <button class="btn btn-secondary" onclick="Vocabulary.showRecall('${word.cn}')">显示释义</button>
            </div>
          ` : `
            <div style="margin-bottom:16px">
              <div style="font-size:14px;color:var(--text-muted);margin-bottom:8px">${word.cn} · 请拼写英文单词</div>
              <input type="text" class="form-input" id="spell-input" placeholder="输入拼写..." style="max-width:300px;margin:0 auto;text-align:center;font-size:18px;font-family:var(--font-serif)" onkeydown="if(event.key==='Enter')Vocabulary.checkSpell('${word.w}','${key}')">
            </div>
            <button class="btn btn-primary" onclick="Vocabulary.checkSpell('${word.w}','${key}')">确认拼写</button>
            <button class="btn-ghost" style="margin-left:8px" onclick="Vocabulary.skipSpell('${key}')">跳过</button>
          `}
        </div>
        <div style="margin-top:32px;display:flex;justify-content:space-between;align-items:center">
          <button class="btn-ghost" onclick="Vocabulary.prevWord()">← 上一个</button>
          <span class="num-badge">№ ${String(idx + 1).padStart(3, '0')}</span>
          <button class="btn-ghost" onclick="Vocabulary.nextWord()">下一个 →</button>
        </div>
      </div>
    `;
  },

  completePass(key) {
    const vocab = Store.get('vocab') || {};
    if (!vocab[key]) vocab[key] = { pass: 0, mastered: false, lastReview: Utils.today(), reviewCount: 0, chapter: this.curChapter };
    vocab[key].pass = Math.max(vocab[key].pass, this.passPhase) + 0;
    // Actually advance the pass
    if (this.passPhase === 1) vocab[key].pass = 1;
    vocab[key].lastReview = Utils.today();
    Store.set('vocab', vocab);
    this.renderView();
  },

  showRecall(meaning) {
    const area = document.getElementById('recall-area');
    if (area) {
      area.innerHTML = `
        <div style="font-size:20px;color:var(--text-title);margin-bottom:12px">${meaning}</div>
        <button class="btn btn-primary" onclick="Vocabulary.completeRecall()">回忆正确，进入第3遍 →</button>
        <button class="btn-ghost" style="margin-left:8px" onclick="Vocabulary.failRecall()">重新记忆</button>
      `;
    }
  },

  completeRecall() {
    const ch = VocabData.getChapter(this.curChapter);
    const word = ch.words[this.curIdx];
    const key = `${ch.id}-${word.w}`;
    const vocab = Store.get('vocab') || {};
    if (!vocab[key]) vocab[key] = { pass: 0, mastered: false, lastReview: Utils.today(), reviewCount: 0, chapter: this.curChapter };
    vocab[key].pass = 2;
    vocab[key].lastReview = Utils.today();
    Store.set('vocab', vocab);
    this.renderView();
  },

  failRecall() {
    const ch = VocabData.getChapter(this.curChapter);
    const word = ch.words[this.curIdx];
    const key = `${ch.id}-${word.w}`;
    const vocab = Store.get('vocab') || {};
    if (!vocab[key]) vocab[key] = { pass: 0, mastered: false, lastReview: Utils.today(), reviewCount: 0, chapter: this.curChapter };
    vocab[key].pass = 0;
    Store.set('vocab', vocab);
    this.renderView();
  },

  checkSpell(correctWord, key) {
    const input = document.getElementById('spell-input');
    const val = input.value.trim().toLowerCase();
    if (val === correctWord.toLowerCase()) {
      Utils.toast('拼写正确！');
      const vocab = Store.get('vocab') || {};
      if (!vocab[key]) vocab[key] = { pass: 0, mastered: false, lastReview: Utils.today(), reviewCount: 0, chapter: this.curChapter };
      vocab[key].pass = 3;
      vocab[key].mastered = true;
      vocab[key].lastReview = Utils.today();
      vocab[key].reviewCount = 0;
      vocab[key].nextReview = Utils.nextReviewDate(Utils.today(), 0);
      Store.set('vocab', vocab);
      App.updateMetrics();
      setTimeout(() => this.nextWord(), 600);
    } else {
      Utils.toast('拼写错误，正确拼写：' + correctWord);
      input.style.borderColor = '#D9534F';
      setTimeout(() => { input.style.borderColor = ''; }, 1500);
    }
  },

  skipSpell(key) {
    const ch = VocabData.getChapter(this.curChapter);
    const word = ch.words[this.curIdx];
    const vocab = Store.get('vocab') || {};
    if (!vocab[key]) vocab[key] = { pass: 0, mastered: false, lastReview: Utils.today(), reviewCount: 0, chapter: this.curChapter };
    vocab[key].pass = 3;
    vocab[key].mastered = true;
    vocab[key].lastReview = Utils.today();
    vocab[key].nextReview = Utils.nextReviewDate(Utils.today(), 0);
    Store.set('vocab', vocab);
    App.updateMetrics();
    this.nextWord();
  },

  nextWord() {
    const ch = VocabData.getChapter(this.curChapter);
    if (this.curIdx < ch.words.length - 1) {
      this.curIdx++;
      Store.set('vocabSession', { chapter: this.curChapter, index: this.curIdx });
      this.renderView();
    } else {
      Utils.toast('本章已学完！');
    }
  },

  prevWord() {
    if (this.curIdx > 0) {
      this.curIdx--;
      Store.set('vocabSession', { chapter: this.curChapter, index: this.curIdx });
      this.renderView();
    }
  },

  jumpChapter(chId) {
    this.curChapter = chId;
    this.curIdx = 0;
    Store.set('vocabSession', { chapter: chId, index: 0 });
    this.renderView();
  },

  // --- Quiz ---
  renderQuiz() {
    const ch = VocabData.getChapter(this.curChapter);
    const vocab = Store.get('vocab') || {};
    // Get words studied today
    const todayWords = ch.words.filter(w => {
      const key = `${ch.id}-${w.w}`;
      return vocab[key]?.lastReview === Utils.today();
    });

    if (todayWords.length < 4) {
      return `
        <div class="bento-card" style="max-width:480px;margin:0 auto;text-align:center">
          <div class="section-title">当日巩固测验</div>
          <div class="section-meta" style="margin-bottom:16px">需要至少学过 4 个单词才能开始测验</div>
          <div class="empty-state"><div class="text">今日已学 ${todayWords.length} 词，继续背词解锁测验</div></div>
          <button class="btn btn-primary" style="margin-top:12px" onclick="Vocabulary.switchView('study')">去背词</button>
        </div>
      `;
    }

    // Generate quiz: English → Chinese match
    const quizWords = todayWords.slice(0, Math.min(8, todayWords.length));
    const shuffled = [...quizWords].sort(() => Math.random() - 0.5);

    return `
      <div class="bento-card" style="max-width:600px;margin:0 auto">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
          <div>
            <div class="section-title">英汉互选测验</div>
            <div class="section-meta">${ch.name} · ${quizWords.length} 词 · 选择正确中文释义</div>
          </div>
          ${Audio.accentToggle()}
        </div>
        <div id="quiz-area">
          ${quizWords.map((w, i) => {
            // Generate 3 distractors from same chapter
            const distractors = ch.words.filter(x => x.w !== w.w).sort(() => Math.random() - 0.5).slice(0, 3);
            const options = [...distractors, w].sort(() => Math.random() - 0.5);
            return `
              <div class="check-item" style="flex-direction:column;align-items:flex-start;gap:8px;padding:16px 0">
                <div style="font-family:var(--font-serif);font-size:20px;font-weight:600;color:var(--text-title)">${i + 1}. ${w.w} ${Audio.btn(w.w)} <span style="font-size:14px;color:var(--text-muted);font-style:italic">${w.phon}</span></div>
                <div style="display:flex;flex-wrap:wrap;gap:8px;width:100%">
                  ${options.map(o => `
                    <div class="tag-chip" style="cursor:pointer;font-size:13px;padding:6px 14px" onclick="Vocabulary.quizAnswer(this,'${o.cn}','${w.cn}')">${o.cn}</div>
                  `).join('')}
                </div>
              </div>
            `;
          }).join('')}
        </div>
        <div style="margin-top:20px;text-align:center">
          <button class="btn-ghost" onclick="Vocabulary.switchView('study')">返回背词</button>
        </div>
      </div>
    `;
  },

  quizAnswer(el, selected, correct) {
    if (selected === correct) {
      el.classList.add('green');
      el.style.fontWeight = '600';
      Utils.toast('正确！');
    } else {
      el.classList.add('red');
      Utils.toast('正确答案：' + correct);
    }
    el.style.pointerEvents = 'none';
  },

  // --- Ebbinghaus Review ---
  renderReview() {
    const vocab = Store.get('vocab') || {};
    const today = Utils.today();
    const reviewList = [];

    Object.entries(vocab).forEach(([key, v]) => {
      if (!v.mastered && v.pass > 0) return; // Not mastered but in progress
      if (v.mastered && v.nextReview && v.nextReview <= today) {
        const parts = key.split('-');
        const chId = parseInt(parts[0]);
        const wordStr = parts.slice(1).join('-');
        const ch = VocabData.getChapter(chId);
        if (ch) {
          const word = ch.words.find(w => w.w === wordStr);
          if (word) reviewList.push({ key, word, chapter: ch, progress: v });
        }
      }
    });

    return `
      <div class="bento-card warm" style="margin-bottom:20px">
        <div style="display:flex;align-items:center;justify-content:space-between">
          <div>
            <div class="section-title">艾宾浩斯智能复习</div>
            <div class="section-meta">遗忘节点 1/2/4/7/15 天 · 今日待复习 ${reviewList.length} 词</div>
          </div>
          <div class="num-badge" style="font-size:24px;color:var(--accent-orange-deep)">${reviewList.length}</div>
        </div>
      </div>
      ${reviewList.length ? `
        <div class="bento-card">
          ${reviewList.map((r, i) => `
            <div class="check-item" style="padding:14px 0">
              <div style="flex:1">
                <div style="font-family:var(--font-serif);font-size:18px;font-weight:600;color:var(--text-title)">${r.word.w} ${Audio.btn(r.word.w)} <span style="font-size:13px;color:var(--text-muted);font-style:italic">${r.word.phon}</span></div>
                <div style="font-size:13px;color:var(--text-body);margin-top:2px">${r.word.cn}</div>
                <div style="font-size:11px;color:var(--text-muted);margin-top:4px">
                  ${r.chapter.name} · 上次复习 ${r.progress.lastReview} · 第 ${r.progress.reviewCount + 1} 轮
                </div>
              </div>
              <button class="btn btn-primary" onclick="Vocabulary.markReviewed('${r.key}')">已复习</button>
            </div>
          `).join('')}
        </div>
      ` : `
        <div class="bento-card">
          <div class="empty-state">
            <div class="text">今日无待复习单词</div>
            <div style="margin-top:8px;font-size:12px;color:var(--text-muted)">继续背新词，系统会自动安排复习</div>
          </div>
        </div>
      `}
    `;
  },

  markReviewed(key) {
    const vocab = Store.get('vocab') || {};
    if (!vocab[key]) return;
    vocab[key].reviewCount = (vocab[key].reviewCount || 0) + 1;
    vocab[key].lastReview = Utils.today();
    vocab[key].nextReview = Utils.nextReviewDate(Utils.today(), vocab[key].reviewCount);
    Store.set('vocab', vocab);
    this.renderView();
    App.updateMetrics();
  },
};
