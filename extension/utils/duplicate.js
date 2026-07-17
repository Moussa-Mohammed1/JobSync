const DuplicateChecker = {
  async check(jobData) {
    try {
      const settings = await chrome.storage.local.get('settings');
      const config = settings.settings || {};
      if (config.duplicateDetection === false) {
        return { isDuplicate: false };
      }

      const result = await chrome.runtime.sendMessage({
        type: 'CHECK_DUPLICATE',
        data: jobData
      });

      if (result && result.isDuplicate) {
        return {
          isDuplicate: true,
          matchField: result.matchField,
          matchValue: result.matchValue
        };
      }

      return { isDuplicate: false };
    } catch (e) {
      return { isDuplicate: false, error: e.message };
    }
  }
};

if (typeof window !== 'undefined') {
  window.DuplicateChecker = DuplicateChecker;
}
