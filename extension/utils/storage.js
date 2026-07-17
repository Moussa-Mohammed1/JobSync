const Storage = {
  async get(keys) {
    return chrome.storage.local.get(keys);
  },

  async set(items) {
    return chrome.storage.local.set(items);
  },

  async remove(keys) {
    return chrome.storage.local.remove(keys);
  },

  async getSettings() {
    const defaults = {
      autoSave: true,
      notifications: true,
      duplicateDetection: true,
      debugMode: false,
      supportedWebsites: [
        'linkedin', 'indeed', 'glassdoor', 'greenhouse',
        'lever', 'workday', 'ashby', 'smartrecruiters',
        'wttj', 'bamboohr'
      ],
      fileHandleStored: false,
      lastSavedPath: ''
    };
    const data = await this.get('settings');
    return data.settings ? { ...defaults, ...data.settings } : defaults;
  },

  async saveSettings(settings) {
    return this.set({ settings });
  },

  async getHistory() {
    const data = await this.get('applicationHistory');
    return data.applicationHistory || [];
  },

  async addToHistory(entry) {
    const history = await this.getHistory();
    history.unshift({
      ...entry,
      savedAt: new Date().toISOString()
    });
    await this.set({ applicationHistory: history.slice(0, 500) });
    return history;
  },

  async getPendingApplications() {
    const data = await this.get('pendingApplications');
    return data.pendingApplications || [];
  },

  async savePendingApplication(entry) {
    const pending = await this.getPendingApplications();
    pending.push(entry);
    return this.set({ pendingApplications: pending });
  },

  async clearPendingApplications() {
    return this.remove('pendingApplications');
  },

  async getSavedJobs() {
    const data = await this.get('savedJobs');
    return data.savedJobs || [];
  },

  async addSavedJob(job) {
    const jobs = await this.getSavedJobs();
    jobs.push({
      ...job,
      savedAt: new Date().toISOString()
    });
    return this.set({ savedJobs: jobs });
  },

  async setFileHandleHandle(handle) {
    return this.set({ fileHandle: handle });
  },

  async getFileHandleHandle() {
    const data = await this.get('fileHandle');
    return data.fileHandle || null;
  }
};

if (typeof window !== 'undefined') {
  window.Storage = Storage;
}
