/* ========================================
   IELTS Hub — Hash Router
   ======================================== */

const Router = {
  routes: {},
  current: null,

  register(path, handler) {
    this.routes[path] = handler;
  },

  init() {
    window.addEventListener('hashchange', () => this.handle());
    this.handle();
  },

  handle() {
    let hash = location.hash.slice(1) || '/dashboard';
    if (!hash.startsWith('/')) hash = '/' + hash;

    // Find matching route or fallback
    const route = this.routes[hash] || this.routes['/dashboard'];
    this.current = hash;

    // Update sidebar active state
    Utils.$$('.nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.route === hash);
    });

    // Render page
    route();

    // Scroll to top
    Utils.$('.content-area').scrollTop = 0;
  },

  go(path) {
    location.hash = path;
  },
};
