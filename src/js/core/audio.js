/* ========================================
   IELTS Hub — Global Audio Helper
   UK / US pronunciation via Web Speech API
   ======================================== */

const Audio = {
  accent: 'en-GB', // default British RP

  speak(text, accent) {
    if (!window.speechSynthesis) {
      Utils.toast('浏览器不支持语音合成');
      return;
    }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = accent || this.accent;
    u.rate = 0.9;
    u.pitch = 1;
    window.speechSynthesis.speak(u);
  },

  setAccent(accent) {
    this.accent = accent;
    // Update all accent toggle UI
    Utils.$$('.accent-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.accent === accent);
    });
    Store.update('settings', s => { s.audioAccent = accent; });
  },

  // Render a small speaker icon button
  btn(text, opts) {
    const size = opts?.size || 16;
    return `<span class="audio-btn" onclick="Audio.speak('${text.replace(/'/g, "\\'")}'${opts?.accent ? ",'" + opts.accent + "'" : ''})" style="cursor:pointer;font-size:${size}px;color:var(--text-muted);transition:color 0.2s" onmouseover="this.style.color='var(--accent-orange-deep)'" onmouseout="this.style.color='var(--text-muted)'">&#9655;</span>`;
  },

  // Render the UK/US accent toggle
  accentToggle() {
    const saved = Store.get('settings')?.audioAccent || 'en-GB';
    this.accent = saved;
    return `
      <div style="display:inline-flex;gap:4px;align-items:center">
        <span style="font-size:11px;color:var(--text-muted);margin-right:4px">Pronunciation</span>
        <div class="accent-btn ${this.accent === 'en-GB' ? 'active' : ''}" data-accent="en-GB" onclick="Audio.setAccent('en-GB')"
             style="font-size:11px;padding:3px 10px;border-radius:var(--r-pill);cursor:pointer;transition:all 0.2s;
             ${this.accent === 'en-GB' ? 'background:var(--accent-black);color:#fff' : 'background:var(--bg-card-warm);color:var(--accent-primary)'}">UK</div>
        <div class="accent-btn ${this.accent === 'en-US' ? 'active' : ''}" data-accent="en-US" onclick="Audio.setAccent('en-US')"
             style="font-size:11px;padding:3px 10px;border-radius:var(--r-pill);cursor:pointer;transition:all 0.2s;
             ${this.accent === 'en-US' ? 'background:var(--accent-black);color:#fff' : 'background:var(--bg-card-warm);color:var(--accent-primary)'}">US</div>
      </div>
    `;
  },
};
