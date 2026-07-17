const JobsyncNotifications = {
  async show(title, message, type = 'info') {
    try {
      const settings = await chrome.storage.local.get('settings');
      const config = settings.settings || {};
      if (config.notifications === false) return;

      const iconMap = {
        success: '✓ ',
        error: '✗ ',
        warning: '⚠ ',
        info: 'ℹ '
      };

      const prefix = iconMap[type] || '';
      chrome.notifications.create({
        type: 'basic',
        iconUrl: chrome.runtime.getURL('assets/icon128.png'),
        title: `${prefix}${title}`,
        message: message,
        priority: 2,
        requireInteraction: type === 'error'
      });
    } catch (e) {
      console.error('Notification error:', e);
    }
  },

  showSaved(jobTitle, company) {
    return this.show(
      'Application Saved',
      `${jobTitle || 'Job'} at ${company || 'Company'} recorded successfully.`,
      'success'
    );
  },

  showDuplicate(jobTitle, company) {
    return this.show(
      'Already Recorded',
      `${jobTitle || 'Job'} at ${company || 'Company'} was already saved.`,
      'warning'
    );
  },

  showNoFile() {
    return this.show(
      'Excel File Not Set',
      'Please open extension options and select an Excel file to save applications.',
      'error'
    );
  },

  showError(message) {
    return this.show(
      'Error',
      message || 'An error occurred while saving the application.',
      'error'
    );
  },

  showOfflinePending(count) {
    return this.show(
      'Pending Applications',
      `${count} application(s) saved locally. They will sync when Excel file is available.`,
      'info'
    );
  }
};

if (typeof window !== 'undefined') {
  window.JobsyncNotifications = JobsyncNotifications;
}
