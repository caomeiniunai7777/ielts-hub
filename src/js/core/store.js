/* ========================================
   IELTS Hub — Local Store (localStorage wrapper)
   Handles all data persistence + import/export
   ======================================== */

const Store = {
  KEY: 'ielts_hub_data_v1',

  // Default data structure
  defaults() {
    return {
      // Module 1: Dashboard
      todos: [],
      checkins: {},
      weekPlan: [],

      // Module 2: Vocabulary
      vocab: {},
      vocabSession: { chapter: 1, index: 0 },

      // Module 3: Reading
      readingErrors: [],
      synonyms538: {},

      // Module 4: Speaking
      speakingRecords: [],

      // Module 5: Writing
      writingRecords: [],

      // Focus Timer
      focusSessions: [],

      // Settings
      settings: {
        examDate: '2026-12-05',
        dailyGoalMinutes: 120,
        userName: '',
        audioAccent: 'en-GB',
      },
    };
  },

  _cache: null,

  load() {
    if (this._cache) return this._cache;
    try {
      const raw = localStorage.getItem(this.KEY);
      this._cache = raw ? JSON.parse(raw) : this.defaults();
      // Merge missing keys
      this._cache = { ...this.defaults(), ...this._cache };
      this._cache.settings = { ...this.defaults().settings, ...(this._cache.settings || {}) };
    } catch (e) {
      console.error('Store load error:', e);
      this._cache = this.defaults();
    }
    return this._cache;
  },

  save() {
    try {
      localStorage.setItem(this.KEY, JSON.stringify(this._cache));
    } catch (e) {
      console.error('Store save error:', e);
    }
  },

  get(key) {
    return this.load()[key];
  },

  set(key, value) {
    this.load()[key] = value;
    this.save();
  },

  update(key, fn) {
    const data = this.load();
    fn(data[key]);
    this.save();
  },

  // --- Export ---
  exportData() {
    const data = this.load();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const date = Utils.fmtDate(new Date());
    a.href = url;
    a.download = `ielts-backup-${date}.json`;
    a.click();
    URL.revokeObjectURL(url);
    Utils.toast('数据已导出');
  },

  // --- Import ---
  importData(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          // Validate minimal structure
          if (typeof data !== 'object' || data === null) {
            throw new Error('Invalid format');
          }
          // Merge with defaults to ensure all keys exist
          this._cache = { ...this.defaults(), ...data };
          this._cache.settings = { ...this.defaults().settings, ...(data.settings || {}) };
          this.save();
          Utils.toast('数据导入成功');
          resolve(true);
        } catch (err) {
          Utils.toast('导入失败：文件格式错误');
          reject(err);
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    });
  },

  // --- Reset ---
  reset() {
    this._cache = this.defaults();
    this.save();
    Utils.toast('数据已重置');
  },
};
