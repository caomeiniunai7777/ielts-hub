/* ========================================
   Module 6: 备考资源导航 + 数据管理
   ======================================== */

const Resources = {
  render() {
    const settings = Store.get('settings') || {};
    const daysLeft = Utils.daysUntil(settings.examDate);
    const sessions = Store.get('focusSessions') || [];
    const totalMin = sessions.reduce((s, x) => s + x.duration, 0);
    const totalHours = (totalMin / 60).toFixed(1);

    return `
      <div class="bento-grid cols-2" style="margin-bottom:20px">
        <div class="bento-card warm">
          <div class="num-badge">EXAM COUNTDOWN</div>
          <div style="font-family:var(--font-serif);font-size:32px;font-weight:600;color:var(--accent-orange-deep);margin-top:6px">
            ${daysLeft > 0 ? daysLeft + ' <span style="font-size:14px;color:var(--text-muted)">天</span>' : '已到期'}
          </div>
          <div style="font-size:11px;color:var(--text-muted);margin-top:2px">目标考试日期: ${settings.examDate}</div>
        </div>
        <div class="bento-card warm">
          <div class="num-badge">TOTAL FOCUS</div>
          <div style="font-family:var(--font-serif);font-size:32px;font-weight:600;color:var(--text-title);margin-top:6px">
            ${totalHours} <span style="font-size:14px;color:var(--text-muted)">小时</span>
          </div>
          <div style="font-size:11px;color:var(--text-muted);margin-top:2px">${sessions.length} 次专注记录</div>
        </div>
      </div>

      <!-- External Resources -->
      <div class="section-title" style="margin-bottom:4px">备考资源导航</div>
      <div class="section-meta" style="margin-bottom:16px">常用备考网站直达</div>
      <div class="bento-grid cols-3" style="margin-bottom:24px">
        <a href="https://www.bbdc.cn" target="_blank" class="bento-card" style="cursor:pointer;text-decoration:none">
          <div class="num-badge">№ 01</div>
          <div style="font-family:var(--font-serif);font-size:16px;font-weight:600;color:var(--text-title);margin-top:6px">不背单词</div>
          <div style="font-size:12px;color:var(--text-muted);margin-top:4px">bbdc.cn · 词汇扩展</div>
          <div class="arrow-link" style="margin-top:12px">前往 →</div>
        </a>
        <a href="https://www.idictation.cn/main/book" target="_blank" class="bento-card" style="cursor:pointer;text-decoration:none">
          <div class="num-badge">№ 02</div>
          <div style="font-family:var(--font-serif);font-size:16px;font-weight:600;color:var(--text-title);margin-top:6px">爱听写</div>
          <div style="font-size:12px;color:var(--text-muted);margin-top:4px">idictation.cn · 剑雅真题/听力/阅读</div>
          <div class="arrow-link" style="margin-top:12px">前往 →</div>
        </a>
        <div class="bento-card warm" style="cursor:default">
          <div class="num-badge">№ 03</div>
          <div style="font-family:var(--font-serif);font-size:16px;font-weight:600;color:var(--text-title);margin-top:6px">IELTS Hub</div>
          <div style="font-size:12px;color:var(--text-muted);margin-top:4px">本地离线 · 你正在使用的工具</div>
          <div style="margin-top:12px"><span class="status-dot active">在用</span></div>
        </div>
      </div>

      <!-- Data Management -->
      <div class="section-title" style="margin-bottom:4px">数据管理</div>
      <div class="section-meta" style="margin-bottom:16px">所有数据保存在本地浏览器，可导出/导入实现跨设备迁移</div>
      <div class="bento-grid cols-3">
        <div class="bento-card">
          <div style="font-family:var(--font-serif);font-size:15px;font-weight:600;color:var(--text-title);margin-bottom:8px">导出数据</div>
          <div style="font-size:12px;color:var(--text-muted);line-height:1.6;margin-bottom:14px">将全部备考数据（背词进度、打卡、错题本、写作/口语记录、专注统计）导出为 JSON 文件。</div>
          <button class="btn btn-primary" onclick="Store.exportData()">导出 JSON</button>
        </div>
        <div class="bento-card">
          <div style="font-family:var(--font-serif);font-size:15px;font-weight:600;color:var(--text-title);margin-bottom:8px">导入数据</div>
          <div style="font-size:12px;color:var(--text-muted);line-height:1.6;margin-bottom:14px">在其他设备上打开本页面，选择之前导出的 JSON 文件，一键恢复全部数据。</div>
          <button class="btn btn-secondary" onclick="document.getElementById('import-file-2').click()">选择文件导入</button>
          <input type="file" id="import-file-2" accept=".json" style="display:none" onchange="App.handleImport(this)">
        </div>
        <div class="bento-card">
          <div style="font-family:var(--font-serif);font-size:15px;font-weight:600;color:var(--text-title);margin-bottom:8px">重置数据</div>
          <div style="font-size:12px;color:var(--text-muted);line-height:1.6;margin-bottom:14px">清空所有数据恢复初始状态。此操作不可撤销，请先导出备份。</div>
          <button class="btn-ghost" style="color:#C0392B" onclick="Resources.confirmReset()">重置全部数据</button>
        </div>
      </div>

      <!-- Settings -->
      <div class="section-title" style="margin:24px 0 4px">备考设置</div>
      <div class="section-meta" style="margin-bottom:16px">个性化你的备考参数</div>
      <div class="bento-card" style="max-width:480px">
        <div style="margin-bottom:16px">
          <label class="form-label">目标考试日期</label>
          <input type="date" class="form-input" value="${settings.examDate}" onchange="Resources.saveSetting('examDate', this.value)">
        </div>
        <div style="margin-bottom:16px">
          <label class="form-label">每日专注目标（分钟）</label>
          <input type="number" class="form-input" value="${settings.dailyGoalMinutes}" min="30" max="600" onchange="Resources.saveSetting('dailyGoalMinutes', parseInt(this.value)||120)">
        </div>
      </div>

      <!-- About -->
      <div style="text-align:center;margin-top:32px;padding:20px">
        <div style="font-family:var(--font-serif);font-size:14px;color:var(--text-muted)">IELTS Hub · Personal Prep Workstation</div>
        <div style="font-size:11px;color:var(--text-muted);margin-top:4px">updated · ${Utils.fmtDateDisplay(Utils.today())} · 离线独立 · 本地存储</div>
      </div>
    `;
  },

  init() {},

  saveSetting(key, value) {
    const settings = Store.get('settings') || {};
    settings[key] = value;
    Store.set('settings', settings);
    Utils.toast('设置已保存');
    App.updateMetrics();
  },

  confirmReset() {
    App.showModal(`
      <div class="modal-title">确认重置</div>
      <div class="modal-body">
        <div style="font-size:13px;color:var(--text-body);line-height:1.7">
          此操作将清空所有数据，包括：<br>
          ● 背词进度与复习记录<br>
          ● 打卡与待办<br>
          ● 错题本<br>
          ● 写作与口语记录<br>
          ● 专注统计<br><br>
          <strong style="color:#C0392B">此操作不可撤销，请确保已导出备份。</strong>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="App.closeModal()">取消</button>
        <button class="btn btn-primary" style="background:#C0392B" onclick="Store.reset();App.closeModal();location.reload()">确认重置</button>
      </div>
    `);
  },
};
