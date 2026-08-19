/* ========================================
   Module 5: 写作精批中心
   Task 1 / Task 2 · TR/CC/LR/GRA 诊断
   ======================================== */

const Writing = {
  view: 'write', // write | samples | records
  taskType: 2, // 1 or 2

  render() {
    return `
      <div class="pill-tabs">
        <div class="pill-tab ${this.view === 'write' ? 'active' : ''}" onclick="Writing.switchView('write')">写作与精批</div>
        <div class="pill-tab ${this.view === 'samples' ? 'active' : ''}" onclick="Writing.switchView('samples')">范文素材库</div>
        <div class="pill-tab ${this.view === 'records' ? 'active' : ''}" onclick="Writing.switchView('records')">历史记录</div>
      </div>
      <div id="writing-content"></div>
    `;
  },

  init() {
    this.renderView();
  },

  switchView(v) {
    this.view = v;
    Utils.$$('.pill-tab', document.getElementById('content')).forEach((el, i) => {
      const tabs = ['write', 'samples', 'records'];
      el.classList.toggle('active', tabs[i] === v);
    });
    this.renderView();
  },

  renderView() {
    const c = document.getElementById('writing-content');
    if (this.view === 'write') c.innerHTML = this.renderWrite();
    else if (this.view === 'samples') c.innerHTML = this.renderSamples();
    else c.innerHTML = this.renderRecords();
  },

  // --- Write & Evaluate ---
  renderWrite() {
    return `
      <div class="pill-tabs">
        <div class="pill-tab ${this.taskType === 1 ? 'active' : ''}" onclick="Writing.setTask(1)">Task 1 · 小作文</div>
        <div class="pill-tab ${this.taskType === 2 ? 'active' : ''}" onclick="Writing.setTask(2)">Task 2 · 大作文</div>
      </div>
      <div class="bento-grid cols-2" style="margin-bottom:16px">
        <div class="bento-card">
          <div class="form-label">题目</div>
          <textarea class="form-textarea" id="wt-prompt" placeholder="${this.taskType === 1 ? '如：The chart below shows the percentage of households in owned and rented accommodation in England and Wales between 1918 and 2011.' : '如：Some people believe that university education should be free for everyone. To what extent do you agree or disagree?'}" style="min-height:80px"></textarea>
        </div>
        <div class="bento-card">
          <div class="form-label">你的作文</div>
          <textarea class="form-textarea" id="wt-essay" placeholder="在此输入你的作文..." style="min-height:200px" oninput="Writing.updateWordCount()"></textarea>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px">
            <span style="font-size:12px;color:var(--text-muted)" id="wt-count">0 words</span>
            <span style="font-size:12px;color:var(--text-muted)">${this.taskType === 1 ? '建议 150+ 词' : '建议 250+ 词'}</span>
          </div>
        </div>
      </div>
      <div style="text-align:center">
        <button class="btn btn-primary" onclick="Writing.evaluate()">提交精批分析</button>
      </div>
    `;
  },

  setTask(t) {
    this.taskType = t;
    this.renderView();
  },

  updateWordCount() {
    const ta = document.getElementById('wt-essay');
    const el = document.getElementById('wt-count');
    if (ta && el) {
      const count = ta.value.trim().split(/\s+/).filter(w => w.length > 0).length;
      el.textContent = count + ' words';
    }
  },

  evaluate() {
    const prompt = document.getElementById('wt-prompt').value.trim();
    const essay = document.getElementById('wt-essay').value.trim();
    if (!essay) { Utils.toast('请输入作文'); return; }

    const words = essay.split(/\s+/).filter(w => w.length > 0);
    const wordCount = words.length;
    const sentences = essay.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const sentCount = sentences.length;
    const avgSentLen = sentCount ? Math.round(wordCount / sentCount) : 0;
    const paragraphs = essay.split(/\n\s*\n/).filter(p => p.trim().length > 0).length;

    // Basic vocabulary analysis
    const uniqueWords = new Set(words.map(w => w.toLowerCase().replace(/[^a-z]/g, '')));
    const lexicalDiversity = wordCount ? Math.round((uniqueWords.size / wordCount) * 100) : 0;

    // Common errors detection
    const lowerText = essay.toLowerCase();
    const issues = [];

    // Check for simple connectors
    const simpleConnectors = (essay.match(/\b(but|and|so|because|also)\b/gi) || []).length;
    const advancedConnectors = (essay.match(/\b(however|moreover|furthermore|nevertheless|consequently|therefore|thus|nevertheless|nonetheless)\b/gi) || []).length;
    if (simpleConnectors > 5 && advancedConnectors < 2) {
      issues.push('过度使用简单连接词，建议替换为 however / moreover / consequently 等高级连接词');
    }

    // Check for contractions
    const contractions = (essay.match(/\b(don't|can't|won't|shouldn't|it's|that's|isn't|aren't)\b/gi) || []).length;
    if (contractions > 0) {
      issues.push('学术写作应避免缩写，如 don\'t → do not, can\'t → cannot');
    }

    // Check sentence length variance
    const sentLens = sentences.map(s => s.trim().split(/\s+/).length);
    const variance = sentLens.length > 1 ? Math.max(...sentLens) - Math.min(...sentLens) : 0;
    if (variance < 5) {
      issues.push('句式长度单一，建议长短句交替以增强节奏感');
    }

    // Check for first person
    const firstPerson = (essay.match(/\b(I|my|me|we|our)\b/g) || []).length;
    if (this.taskType === 2 && firstPerson > 3) {
      issues.push('大作文建议减少第一人称使用，增强客观论证');
    }

    // Word count check
    const minWords = this.taskType === 1 ? 150 : 250;
    if (wordCount < minWords) {
      issues.push(`字数不足：${wordCount}/${minWords} 词，Task ${this.taskType} 至少需要 ${minWords} 词`);
    }

    // Scoring (simplified)
    const tr = Math.min(7, Math.max(4, Math.round(wordCount / minWords * 5) + 2));
    const cc = Math.min(7, Math.max(4, advancedConnectors >= 3 ? 6 : 5));
    const lr = Math.min(7, Math.max(4, Math.round(lexicalDiversity / 15) + 2));
    const gra = Math.min(7, Math.max(4, variance > 10 ? 6 : 5));
    const overall = ((tr + cc + lr + gra) / 4).toFixed(1);

    // Save record
    const records = Store.get('writingRecords') || [];
    records.unshift({
      id: Utils.uid(),
      task: this.taskType,
      prompt,
      essay,
      date: Utils.today(),
      wordCount,
      scores: { tr, cc, lr, gra, overall: parseFloat(overall) },
    });
    Store.set('writingRecords', records);

    // Show report
    App.showModal(`
      <div class="modal-title">写作精批报告</div>
      <div class="modal-body">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
          <div style="font-size:13px;color:var(--text-muted)">Task ${this.taskType} · ${wordCount} words · ${sentCount} sentences · ${paragraphs} paragraphs</div>
          <div style="text-align:center">
            <div style="font-family:var(--font-serif);font-size:32px;font-weight:600;color:var(--accent-orange-deep)">${overall}</div>
            <div style="font-size:10px;color:var(--text-muted);text-transform:uppercase">OVERALL</div>
          </div>
        </div>
        <div class="bento-grid cols-4" style="margin-bottom:16px">
          <div class="bento-card warm" style="padding:12px;text-align:center">
            <div class="num-badge">TR</div>
            <div style="font-family:var(--font-serif);font-size:20px;font-weight:600;color:var(--text-title)">${tr}.0</div>
            <div style="font-size:10px;color:var(--text-muted)">Task Response</div>
          </div>
          <div class="bento-card warm" style="padding:12px;text-align:center">
            <div class="num-badge">CC</div>
            <div style="font-family:var(--font-serif);font-size:20px;font-weight:600;color:var(--text-title)">${cc}.0</div>
            <div style="font-size:10px;color:var(--text-muted)">Coherence</div>
          </div>
          <div class="bento-card warm" style="padding:12px;text-align:center">
            <div class="num-badge">LR</div>
            <div style="font-family:var(--font-serif);font-size:20px;font-weight:600;color:var(--text-title)">${lr}.0</div>
            <div style="font-size:10px;color:var(--text-muted)">Lexical</div>
          </div>
          <div class="bento-card warm" style="padding:12px;text-align:center">
            <div class="num-badge">GRA</div>
            <div style="font-family:var(--font-serif);font-size:20px;font-weight:600;color:var(--text-title)">${gra}.0</div>
            <div style="font-size:10px;color:var(--text-muted)">Grammar</div>
          </div>
        </div>

        <div style="font-size:13px;font-weight:600;color:var(--text-title);margin-bottom:8px">诊断分析</div>
        <div style="font-size:13px;color:var(--text-body);line-height:1.8;margin-bottom:16px">
          <div style="margin-bottom:4px">词汇多样性: ${lexicalDiversity}%（${uniqueWords.size} 个独立词汇 / ${wordCount} 总词数）</div>
          <div style="margin-bottom:4px">平均句长: ${avgSentLen} 词/句</div>
          <div style="margin-bottom:4px">高级连接词: ${advancedConnectors} 次 · 简单连接词: ${simpleConnectors} 次</div>
          <div>段落数: ${paragraphs}</div>
        </div>

        ${issues.length ? `
          <div style="font-size:13px;font-weight:600;color:var(--text-title);margin-bottom:8px">提分建议</div>
          <div style="font-size:13px;color:var(--text-body);line-height:1.8">
            ${issues.map(i => `<div style="padding:6px 0;border-bottom:1px solid var(--border-light)">● ${i}</div>`).join('')}
          </div>
        ` : '<div style="font-size:13px;color:var(--dot-done)">未检测到明显问题，继续保持！</div>'}
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="App.closeModal()">关闭</button>
        <button class="btn btn-primary" onclick="App.closeModal();Writing.switchView('records')">查看记录</button>
      </div>
    `);
  },

  // --- Sample Library ---
  renderSamples() {
    const samples = [
      { type: 'Simon 9分范文', title: 'Task 2: Free University Education', text: 'It is argued that university education should be free for all students. While I agree that education is a fundamental right, I believe that completely free tertiary education would place an unsustainable burden on governments and may devalue the quality of higher learning.\n\nFirstly, the financial implications of free university education are substantial...' },
      { type: 'Simon 9分范文', title: 'Task 2: Technology and Communication', text: 'Some people believe that technology has improved our communication, while others argue it has made us more isolated. In my opinion, technology has revolutionized the way we connect...' },
      { type: '真经万能句式', title: '开头段模板', text: 'It is widely debated whether [topic]. While some argue that [view A], others contend that [view B]. In this essay, I will discuss both perspectives and provide my own opinion.' },
      { type: '真经万能句式', title: '结尾段模板', text: 'In conclusion, while [concession], I firmly believe that [thesis]. It is therefore imperative that [recommendation].' },
      { type: '真经万能句式', title: '让步句式', text: 'Admittedly, [concession point]; however, this does not diminish the fact that [main argument].' },
      { type: '真经万能句式', title: '举例句式', text: 'A compelling illustration of this can be seen in [example], which demonstrates [point].' },
      { type: '顾家北方法论', title: 'TR 提分要点', text: '1. 立场明确，全文一致\n2. 论点要有展开（reason → example → result）\n3. 每段必须有明确的中心句\n4. Task Response 不只是回答题目，而是 fully address all parts' },
      { type: '顾家北方法论', title: 'CC 提分要点', text: '1. 段落内部逻辑清晰\n2. 使用多样化的连接手段（不只是 however, moreover）\n3. 指代和替换避免重复\n4. 信息递进要有层次' },
      { type: '顾家北方法论', title: 'GRA 提分要点', text: '1. 句式多样：简单句、并列句、复合句交替\n2. 准确使用从句（定语从句、状语从句、名词性从句）\n3. 注意时态和主谓一致\n4. 避免中式英语句式' },
    ];

    return `
      <div class="section-title" style="margin-bottom:4px">范文素材库</div>
      <div class="section-meta" style="margin-bottom:16px">Simon 9分范文 · 真经万能句式 · 顾家北写作方法论</div>
      <div class="bento-grid cols-2">
        ${samples.map(s => `
          <div class="bento-card">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:8px">
              <span class="tag-chip ${s.type.includes('Simon') ? 'orange' : s.type.includes('真经') ? 'green' : ''}">${s.type}</span>
            </div>
            <div style="font-family:var(--font-serif);font-size:15px;font-weight:600;color:var(--text-title);margin-bottom:8px">${s.title}</div>
            <div style="font-size:13px;color:var(--text-body);line-height:1.7;white-space:pre-wrap">${s.text}</div>
          </div>
        `).join('')}
      </div>
    `;
  },

  // --- Records ---
  renderRecords() {
    const records = Store.get('writingRecords') || [];

    return `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
        <div>
          <div class="section-title">写作练习记录</div>
          <div class="section-meta">${records.length} 条记录</div>
        </div>
      </div>
      ${records.length ? `
        <div class="bento-grid cols-2">
          ${records.map(r => `
            <div class="bento-card">
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
                <span class="tag-chip orange">Task ${r.task}</span>
                <span style="font-family:var(--font-serif);font-size:20px;font-weight:600;color:var(--accent-orange-deep)">${r.scores.overall}</span>
                <span class="num-badge">${r.date}</span>
              </div>
              <div style="font-size:13px;color:var(--text-body);margin-bottom:8px;line-height:1.5">${Utils.esc(r.prompt?.slice(0, 80) || '')}${r.prompt?.length > 80 ? '...' : ''}</div>
              <div style="font-size:12px;color:var(--text-muted);margin-bottom:8px">${r.wordCount} words</div>
              <div style="display:flex;gap:6px">
                <span class="tag-chip">TR ${r.scores.tr}</span>
                <span class="tag-chip">CC ${r.scores.cc}</span>
                <span class="tag-chip">LR ${r.scores.lr}</span>
                <span class="tag-chip">GRA ${r.scores.gra}</span>
              </div>
              <div style="margin-top:10px;font-size:12px;color:var(--text-body);max-height:60px;overflow:hidden;line-height:1.5">${Utils.esc(r.essay.slice(0, 100))}${r.essay.length > 100 ? '...' : ''}</div>
            </div>
          `).join('')}
        </div>
      ` : `
        <div class="bento-card"><div class="empty-state"><div class="text">暂无写作记录</div></div></div>
      `}
    `;
  },
};
