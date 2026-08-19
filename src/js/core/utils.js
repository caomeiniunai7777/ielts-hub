/* ========================================
   IELTS Hub — Utility Functions
   ======================================== */

const Utils = {

  // --- Date ---
  today() {
    const d = new Date();
    return this.fmtDate(d);
  },

  fmtDate(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  },

  fmtDateDisplay(dateStr) {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    return `${y}.${m}.${d}`;
  },

  daysBetween(date1, date2) {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return Math.floor((d2 - d1) / 86400000);
  },

  daysUntil(dateStr) {
    return this.daysBetween(this.today(), dateStr);
  },

  addDays(dateStr, n) {
    const d = new Date(dateStr);
    d.setDate(d.getDate() + n);
    return this.fmtDate(d);
  },

  // Ebbinghaus intervals: 1, 2, 4, 7, 15 days
  ebbinghausIntervals: [1, 2, 4, 7, 15],

  nextReviewDate(lastReview, reviewCount) {
    const idx = Math.min(reviewCount, this.ebbinghausIntervals.length - 1);
    return this.addDays(lastReview, this.ebbinghausIntervals[idx]);
  },

  // --- DOM ---
  el(tag, className, html) {
    const e = document.createElement(tag);
    if (className) e.className = className;
    if (html !== undefined) e.innerHTML = html;
    return e;
  },

  $(selector, parent) {
    return (parent || document).querySelector(selector);
  },

  $$(selector, parent) {
    return [...(parent || document).querySelectorAll(selector)];
  },

  // --- ID ---
  uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  },

  // --- Toast ---
  toast(msg) {
    const t = this.el('div', 'toast', msg);
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2400);
  },

  // --- Escaping ---
  esc(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  },

  // --- Progress Bar ---
  progressPct(completed, target) {
    if (!target || target === 0) return 0;
    return Math.min(100, Math.round((completed / target) * 100));
  },

  // --- Debounce ---
  debounce(fn, ms) {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), ms);
    };
  },
};
