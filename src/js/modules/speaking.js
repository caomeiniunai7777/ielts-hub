/* ========================================
   Module 4: 口语练测中心
   当季题库 + Multi-accent TTS + 四维评分
   ======================================== */

const Speaking = {
  view: 'topics', // topics | practice | records
  curPart: 1,
  curCat: '全部',
  accent: 'en-GB',
  practiceTopic: null,
  recognition: null,
  recognitionActive: false,

  render() {
    return `
      <div class="pill-tabs">
        <div class="pill-tab ${this.view === 'topics' ? 'active' : ''}" onclick="Speaking.switchView('topics')">当季题库</div>
        <div class="pill-tab ${this.view === 'practice' ? 'active' : ''}" onclick="Speaking.switchView('practice')">AI 考官对练</div>
        <div class="pill-tab ${this.view === 'records' ? 'active' : ''}" onclick="Speaking.switchView('records')">练习记录</div>
      </div>
      <div id="speaking-content"></div>
    `;
  },

  init() {
    this.renderView();
  },

  switchView(v) {
    this.view = v;
    Utils.$$('.pill-tab', document.getElementById('content')).forEach((el, i) => {
      const tabs = ['topics', 'practice', 'records'];
      el.classList.toggle('active', tabs[i] === v);
    });
    this.renderView();
  },

  renderView() {
    const c = document.getElementById('speaking-content');
    if (this.view === 'topics') c.innerHTML = this.renderTopics();
    else if (this.view === 'practice') c.innerHTML = this.renderPractice();
    else c.innerHTML = this.renderRecords();
  },

  // --- Topics ---
  renderTopics() {
    const partTabs = [1, 2, 3];
    let topics;
    if (this.curPart === 1) topics = SpeakingTopics.filterByCat(SpeakingTopics.part1, this.curCat);
    else if (this.curPart === 2) topics = SpeakingTopics.part2;
    else topics = SpeakingTopics.part3;

    const cats1 = ['全部', '人物', '事物', '事件', '地点'];

    return `
      <div class="pill-tabs">
        ${partTabs.map(p => `
          <div class="pill-tab ${this.curPart === p ? 'active' : ''}" onclick="Speaking.setPart(${p})">Part ${p}</div>
        `).join('')}
      </div>
      ${this.curPart === 1 ? `
        <div class="pill-tabs">
          ${cats1.map(c => `
            <div class="pill-tab ${this.curCat === c ? 'active' : ''}" onclick="Speaking.setCat('${c}')">${c}</div>
          `).join('')}
        </div>
      ` : ''}
      <div class="bento-grid cols-2">
        ${topics.map(t => `
          <div class="bento-card">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
              <span class="num-badge">№ ${t.id}</span>
              <span class="tag-chip">${t.cat}</span>
            </div>
            <div style="font-family:var(--font-serif);font-size:16px;font-weight:600;color:var(--text-title);margin-bottom:8px">${t.topic}</div>
            ${this.curPart === 1 || this.curPart === 3 ? `
              <div style="font-size:13px;color:var(--text-body);margin-bottom:12px">
                ${(t.q || []).map((q, i) => `<div style="margin-bottom:4px">${i + 1}. ${q}</div>`).join('')}
              </div>
            ` : `
              <div style="font-size:13px;color:var(--text-body);margin-bottom:12px;line-height:1.7">${t.cue}</div>
            `}
            <button class="btn btn-secondary" style="width:100%" onclick="Speaking.startPractice('${t.id}')">开始练习 →</button>
          </div>
        `).join('')}
      </div>
    `;
  },

  setPart(p) {
    this.curPart = p;
    this.renderView();
  },

  setCat(c) {
    this.curCat = c;
    this.renderView();
  },

  startPractice(topicId) {
    let topic;
    topic = [...SpeakingTopics.part1, ...SpeakingTopics.part2, ...SpeakingTopics.part3].find(t => t.id === topicId);
    if (!topic) return;
    this.practiceTopic = topic;
    this.view = 'practice';
    Utils.$$('.pill-tab', document.getElementById('content')).forEach((el, i) => {
      el.classList.toggle('active', i === 1);
    });
    this.renderView();
  },

  // --- Practice ---
  renderPractice() {
    if (!this.practiceTopic) {
      return '<div class="bento-card"><div class="empty-state"><div class="text">请从题库选择一个话题开始练习</div><button class="btn btn-primary" style="margin-top:12px" onclick="Speaking.switchView(\'topics\')">选择话题</button></div></div>';
    }

    const t = this.practiceTopic;
    const partNum = t.id.startsWith('p1') ? 1 : t.id.startsWith('p2') ? 2 : 3;

    // Framework hints
    const frameworks = {
      1: '直接回答 + 原因/细节 + 举例（2-3句，25-35秒）',
      2: 'Background → Details → Challenges → Reflection（2分钟独白）',
      3: '阐述观点 → 深度归因 → 正反/社会宏观影响',
    };

    return `
      <div style="margin-bottom:16px">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
          <span class="tag-chip orange">Part ${partNum}</span>
          <span class="tag-chip">${t.cat}</span>
          <span class="num-badge">${t.id}</span>
        </div>
        <div style="font-family:var(--font-serif);font-size:20px;font-weight:600;color:var(--text-title);margin-bottom:8px">${t.topic}</div>
        ${partNum === 2 ? `<div style="font-size:14px;color:var(--text-body);line-height:1.7;background:var(--bg-card-warm);padding:14px;border-radius:var(--r-sm)">${t.cue}</div>` : ''}
      </div>

      <!-- Accent selector -->
      <div class="bento-card warm" style="margin-bottom:16px">
        <div style="font-size:12px;color:var(--text-muted);margin-bottom:10px;text-transform:uppercase;letter-spacing:0.5px">AI 考官口音</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          ${SpeakingTopics.accents.map(a => `
            <div class="pill-tab ${this.accent === a.key ? 'active' : ''}" onclick="Speaking.setAccent('${a.key}')">${a.label}</div>
          `).join('')}
        </div>
      </div>

      <!-- Question display with TTS -->
      ${partNum !== 2 ? `
        <div class="bento-card" style="margin-bottom:16px">
          <div style="font-size:12px;color:var(--text-muted);margin-bottom:8px">考官提问</div>
          ${(t.q || []).map((q, i) => `
            <div style="display:flex;align-items:flex-start;gap:10px;padding:10px 0;border-bottom:1px solid var(--border-light)">
              <span class="num-badge" style="margin-top:2px">Q${i + 1}</span>
              <span style="flex:1;font-size:14px;color:var(--text-body)">${q}</span>
              <button class="icon-btn" onclick="Speaking.speak(${JSON.stringify(q).replace(/"/g,'&quot;')})" title="考官朗读">▶</button>
            </div>
          `).join('')}
        </div>
      ` : `
        <div class="bento-card" style="margin-bottom:16px">
          <div style="display:flex;align-items:center;justify-content:space-between">
            <div style="font-size:14px;color:var(--text-body)">Part 2 独白计时（2分钟）</div>
            <button class="btn btn-primary" onclick="Speaking.startPart2Timer()">开始计时</button>
          </div>
          <div id="p2-timer" style="font-family:var(--font-mono);font-size:28px;text-align:center;margin-top:12px;color:var(--accent-orange-deep)">02:00</div>
        </div>
      `}

      <!-- Framework hint -->
      <div class="bento-card warm" style="margin-bottom:16px">
        <div style="font-size:12px;color:var(--text-muted);margin-bottom:6px;text-transform:uppercase;letter-spacing:0.5px">答题框架</div>
        <div style="font-size:13px;color:var(--accent-primary);line-height:1.7">${frameworks[partNum]}</div>
        ${partNum === 1 ? '<div style="margin-top:8px;font-size:12px;color:var(--text-muted)">填充词: Well... / Let me think... / To be honest... / Actually...</div>' : ''}
      </div>

      <!-- Voice input -->
      <div class="bento-card" style="margin-bottom:16px">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
          <div style="font-size:14px;color:var(--text-body)">语音输入 / 文本转写</div>
          <button class="btn ${this.recognitionActive ? 'btn-primary' : 'btn-secondary'}" id="mic-btn" onclick="Speaking.toggleMic()">
            ${this.recognitionActive ? '● 停止' : '◉ 开始录音'}
          </button>
        </div>
        <textarea class="form-textarea" id="speak-transcript" placeholder="点击录音后，你的回答将自动转写到这里，也可以手动编辑..."></textarea>
        <div style="margin-top:10px;display:flex;gap:8px">
          <button class="btn btn-primary" onclick="Speaking.saveRecord()">保存练习</button>
          <button class="btn-ghost" onclick="Speaking.switchView('topics')">返回题库</button>
        </div>
      </div>
    `;
  },

  setAccent(key) {
    this.accent = key;
    this.renderView();
  },

  speak(text) {
    if (!window.speechSynthesis) { Utils.toast('浏览器不支持语音合成'); return; }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = this.accent;
    u.rate = 0.95;
    window.speechSynthesis.speak(u);
  },

  startPart2Timer() {
    let sec = 120;
    const el = document.getElementById('p2-timer');
    if (!el) return;
    const id = setInterval(() => {
      sec--;
      const m = Math.floor(sec / 60);
      const s = sec % 60;
      el.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
      if (sec <= 0) {
        clearInterval(id);
        Utils.toast('时间到！请停止作答');
        el.style.color = '#D9534F';
      }
    }, 1000);
  },

  toggleMic() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      Utils.toast('浏览器不支持语音识别，请手动输入');
      return;
    }

    if (this.recognitionActive) {
      if (this.recognition) this.recognition.stop();
      this.recognitionActive = false;
      this.renderView();
      return;
    }

    this.recognition = new SR();
    this.recognition.lang = 'en-US';
    this.recognition.continuous = true;
    this.recognition.interimResults = true;

    const ta = document.getElementById('speak-transcript');
    let finalText = ta.value;

    this.recognition.onresult = (e) => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) {
          finalText += e.results[i][0].transcript + ' ';
        } else {
          interim += e.results[i][0].transcript;
        }
      }
      ta.value = finalText + interim;
    };

    this.recognition.onerror = (e) => {
      Utils.toast('语音识别错误: ' + e.error);
      this.recognitionActive = false;
      this.renderView();
    };

    this.recognition.onend = () => {
      this.recognitionActive = false;
      const btn = document.getElementById('mic-btn');
      if (btn) { btn.textContent = '◉ 开始录音'; btn.className = 'btn btn-secondary'; }
    };

    this.recognition.start();
    this.recognitionActive = true;
    const btn = document.getElementById('mic-btn');
    if (btn) { btn.textContent = '● 停止'; btn.className = 'btn btn-primary'; }
    Utils.toast('录音中...');
  },

  saveRecord() {
    const ta = document.getElementById('speak-transcript');
    if (!ta || !ta.value.trim()) { Utils.toast('请先输入或录制回答'); return; }

    const records = Store.get('speakingRecords') || [];
    const t = this.practiceTopic;
    const partNum = t.id.startsWith('p1') ? 1 : t.id.startsWith('p2') ? 2 : 3;

    // Simple auto-evaluation
    const text = ta.value.trim();
    const words = text.split(/\s+/);
    const wordCount = words.length;
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgSentLen = sentences.length ? Math.round(wordCount / sentences.length) : wordCount;

    // Basic metrics
    const fillers = (text.match(/\b(um|uh|er|like|you know|well|actually)\b/gi) || []).length;
    const fc = Math.max(3, 9 - Math.round(fillers / Math.max(1, sentences.length) * 3));
    const lr = wordCount > 50 ? 6 : wordCount > 20 ? 5 : 4;
    const gra = avgSentLen > 8 ? 6 : 5;
    const pr = 5; // placeholder

    records.unshift({
      id: Utils.uid(),
      part: partNum,
      topic: t.topic,
      topicId: t.id,
      transcript: text,
      date: Utils.today(),
      wordCount,
      scores: { fc, lr, gra, pr },
    });
    Store.set('speakingRecords', records);
    Utils.toast('练习已保存');

    // Show score report
    App.showModal(`
      <div class="modal-title">练习评分报告</div>
      <div class="modal-body">
        <div style="font-size:13px;color:var(--text-muted);margin-bottom:12px">${t.topic} · Part ${partNum} · ${wordCount} words</div>
        <div class="bento-grid cols-2">
          <div class="bento-card warm" style="padding:14px">
            <div class="num-badge">FC 25%</div>
            <div style="font-family:var(--font-serif);font-size:24px;font-weight:600;color:var(--text-title)">${fc}.0</div>
            <div style="font-size:11px;color:var(--text-muted)">流利度与连贯性</div>
            <div style="font-size:11px;color:var(--text-muted);margin-top:4px">填充词 ${fillers} 次</div>
          </div>
          <div class="bento-card warm" style="padding:14px">
            <div class="num-badge">LR 25%</div>
            <div style="font-family:var(--font-serif);font-size:24px;font-weight:600;color:var(--text-title)">${lr}.0</div>
            <div style="font-size:11px;color:var(--text-muted)">词汇丰富度</div>
          </div>
          <div class="bento-card warm" style="padding:14px">
            <div class="num-badge">GRA 25%</div>
            <div style="font-family:var(--font-serif);font-size:24px;font-weight:600;color:var(--text-title)">${gra}.0</div>
            <div style="font-size:11px;color:var(--text-muted)">语法多样性</div>
            <div style="font-size:11px;color:var(--text-muted);margin-top:4px">平均句长 ${avgSentLen} 词</div>
          </div>
          <div class="bento-card warm" style="padding:14px">
            <div class="num-badge">PR 25%</div>
            <div style="font-family:var(--font-serif);font-size:24px;font-weight:600;color:var(--text-title)">${pr}.0</div>
            <div style="font-size:11px;color:var(--text-muted)">发音与自然度</div>
            <div style="font-size:11px;color:var(--text-muted);margin-top:4px">需人工复核</div>
          </div>
        </div>
        <div style="margin-top:16px;font-size:12px;color:var(--text-muted);line-height:1.7">
          提示：评分基于文本分析自动生成，仅供参考。建议结合 TTS 朗读和录音回放进行人工校准。
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-primary" onclick="App.closeModal();Speaking.switchView('records')">查看记录</button>
      </div>
    `);
  },

  // --- Records ---
  renderRecords() {
    const records = Store.get('speakingRecords') || [];

    return `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
        <div>
          <div class="section-title">口语练习记录</div>
          <div class="section-meta">${records.length} 条记录</div>
        </div>
      </div>
      ${records.length ? `
        <div class="bento-grid cols-2">
          ${records.map(r => `
            <div class="bento-card">
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
                <span class="tag-chip orange">Part ${r.part}</span>
                <span class="num-badge">${r.date}</span>
              </div>
              <div style="font-family:var(--font-serif);font-size:15px;font-weight:600;color:var(--text-title);margin-bottom:8px">${r.topic}</div>
              <div style="font-size:12px;color:var(--text-body);line-height:1.6;margin-bottom:10px;max-height:60px;overflow:hidden">${Utils.esc(r.transcript.slice(0, 120))}${r.transcript.length > 120 ? '...' : ''}</div>
              <div style="display:flex;gap:6px">
                <span class="tag-chip">FC ${r.scores.fc}</span>
                <span class="tag-chip">LR ${r.scores.lr}</span>
                <span class="tag-chip">GRA ${r.scores.gra}</span>
                <span class="tag-chip">PR ${r.scores.pr}</span>
                <span style="margin-left:auto;font-size:11px;color:var(--text-muted);align-self:center">${r.wordCount} words</span>
              </div>
            </div>
          `).join('')}
        </div>
      ` : `
        <div class="bento-card"><div class="empty-state"><div class="text">暂无练习记录</div></div></div>
      `}
    `;
  },
};
