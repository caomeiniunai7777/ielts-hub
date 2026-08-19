/* ========================================
   IELTS Hub — App Entry & Shell
   ======================================== */

const App = {
  init() {
    Store.load();
    this.renderShell();
    this.registerRoutes();
    this.bindGlobal();
    Router.init();
    Timer.init();
    this.updateMetrics();
  },

  renderShell() {
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="app-shell">
        <!-- Sidebar -->
        <aside class="sidebar">
          <div class="sidebar-logo">
            <h1>IELTS Hub</h1>
            <div class="sub">Personal Prep Workstation</div>
          </div>
          <nav id="nav">
            <div class="nav-item" data-route="/dashboard">
              <span class="nav-dot"></span>
              <span>每日打卡与计划</span>
            </div>
            <div class="nav-item" data-route="/vocabulary">
              <span class="nav-dot"></span>
              <span>词汇闪卡真经</span>
            </div>
            <div class="nav-item" data-route="/reading">
              <span class="nav-dot"></span>
              <span>阅读刷题与538</span>
            </div>
            <div class="nav-item" data-route="/speaking">
              <span class="nav-dot"></span>
              <span>口语练测中心</span>
            </div>
            <div class="nav-item" data-route="/writing">
              <span class="nav-dot"></span>
              <span>写作精批中心</span>
            </div>
            <div class="nav-item" data-route="/resources">
              <span class="nav-dot"></span>
              <span>备考资源导航</span>
            </div>
          </nav>
          <div class="sidebar-footer">
            <div class="data-btn" onclick="Store.exportData()">导出数据</div>
            <div class="data-btn" onclick="document.getElementById('import-file').click()">导入数据</div>
            <input type="file" id="import-file" accept=".json" style="display:none" onchange="App.handleImport(this)">
          </div>
        </aside>

        <!-- Main -->
        <main class="main-area">
          <div class="topbar">
            <div class="topbar-left">
              <div>
                <div class="topbar-title" id="page-title">每日打卡与计划</div>
                <div class="topbar-meta" id="page-meta"></div>
              </div>
            </div>
            <div class="topbar-right">
              <div class="metrics-bar" id="metrics-bar"></div>
              <div class="search-pill">
                <span style="font-size:13px;color:var(--text-muted)">/</span>
                <input type="text" id="global-search" placeholder="搜索词汇 / 任务...">
                <span class="kbd-hint">⌘K</span>
              </div>
            </div>
          </div>
          <div class="content-area">
            <div class="content-inner" id="content"></div>
          </div>
        </main>
      </div>
      <!-- Floating Focus Timer -->
      <div class="focus-timer collapsed" id="focus-timer"></div>
      <!-- Modal -->
      <div class="modal-overlay" id="modal-overlay">
        <div class="modal" id="modal"></div>
      </div>
    `;
  },

  registerRoutes() {
    Router.register('/dashboard', () => this.renderPage('dashboard', '每日打卡与计划', Dashboard));
    Router.register('/vocabulary', () => this.renderPage('vocabulary', '词汇闪卡真经', Vocabulary));
    Router.register('/reading', () => this.renderPage('reading', '阅读刷题与538', Reading));
    Router.register('/speaking', () => this.renderPage('speaking', '口语练测中心', Speaking));
    Router.register('/writing', () => this.renderPage('writing', '写作精批中心', Writing));
    Router.register('/resources', () => this.renderPage('resources', '备考资源导航', Resources));
  },

  renderPage(route, title, module) {
    document.getElementById('page-title').textContent = title;
    const daysLeft = Utils.daysUntil(Store.get('settings').examDate);
    document.getElementById('page-meta').textContent =
      `updated · ${Utils.fmtDateDisplay(Utils.today())} · ${daysLeft} days left`;
    const content = document.getElementById('content');
    content.innerHTML = module.render();
    if (module.init) module.init();
    this.updateMetrics();
  },

  updateMetrics() {
    const vocab = Store.get('vocab') || {};
    const synProgress = Store.get('synonyms538') || {};
    const vocabMastered = Object.values(vocab).filter(v => v.mastered).length;
    const synMastered = Object.values(synProgress).filter(p => p.mastered).length;
    const mastered = vocabMastered + synMastered;

    const vocabPending = Object.values(vocab).filter(v => !v.mastered && v.pass > 0).length;
    const synInUse = Object.values(synProgress).filter(p => !p.mastered && p.studied).length;
    const pending = vocabPending + synInUse;

    const sessions = Store.get('focusSessions') || [];
    const today = Utils.today();
    const todayMin = sessions
      .filter(s => s.date === today)
      .reduce((sum, s) => sum + s.duration, 0);
    const hours = (todayMin / 60).toFixed(1);

    document.getElementById('metrics-bar').innerHTML = `
      <div class="metric-chip"><div class="val">${mastered}</div><div class="label">MASTERED</div></div>
      <div class="metric-chip"><div class="val">${pending}</div><div class="label">IN USE</div></div>
      <div class="metric-chip"><div class="val">${hours}h</div><div class="label">FOCUS</div></div>
    `;
  },

  bindGlobal() {
    // ⌘K / Ctrl+K
    document.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('global-search').focus();
      }
    });

    // Nav clicks
    document.addEventListener('click', (e) => {
      const navItem = e.target.closest('.nav-item');
      if (navItem && navItem.dataset.route) {
        Router.go(navItem.dataset.route);
      }
    });

    // Modal close on overlay
    document.getElementById('modal-overlay').addEventListener('click', (e) => {
      if (e.target.id === 'modal-overlay') this.closeModal();
    });
  },

  handleImport(input) {
    const file = input.files[0];
    if (!file) return;
    Store.importData(file).then(() => {
      location.reload();
    });
    input.value = '';
  },

  // --- Modal ---
  showModal(html) {
    document.getElementById('modal').innerHTML = html;
    document.getElementById('modal-overlay').classList.add('show');
  },

  closeModal() {
    document.getElementById('modal-overlay').classList.remove('show');
  },
};

// Boot
document.addEventListener('DOMContentLoaded', () => App.init());
