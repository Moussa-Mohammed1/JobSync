const ALL_WEBSITES = [
  { id: 'linkedin', name: 'LinkedIn' }, { id: 'indeed', name: 'Indeed' },
  { id: 'glassdoor', name: 'Glassdoor' }, { id: 'greenhouse', name: 'Greenhouse' },
  { id: 'lever', name: 'Lever' }, { id: 'workday', name: 'Workday' },
  { id: 'ashby', name: 'Ashby' }, { id: 'smartrecruiters', name: 'SmartRecruiters' },
  { id: 'wttj', name: 'WTTJ' }, { id: 'bamboohr', name: 'BambooHR' }
];

document.addEventListener('DOMContentLoaded', async () => {
  const selectFileBtn = document.getElementById('selectFileBtn');
  const downloadXlsxBtn = document.getElementById('downloadXlsxBtn');
  const downloadXlsxLink = document.getElementById('downloadXlsxLink');
  const filePathEl = document.getElementById('filePath');
  const fileIndicator = document.getElementById('fileIndicator');
  const selectFileBtnText = document.getElementById('selectFileBtnText');
  const fileInput = document.getElementById('fileInput');
  const autoSaveEl = document.getElementById('autoSave');
  const autoExportXlsxEl = document.getElementById('autoExportXlsx');
  const notificationsEl = document.getElementById('notifications');
  const duplicateDetectionEl = document.getElementById('duplicateDetection');
  const debugModeEl = document.getElementById('debugMode');
  const websiteList = document.getElementById('websiteList');
  const syncBtn = document.getElementById('syncBtn');
  const pendingCount = document.getElementById('pendingCount');
  const exportJsonBtn = document.getElementById('exportJsonBtn');
  const clearHistoryBtn = document.getElementById('clearHistoryBtn');
  const debugCard = document.getElementById('debugCard');
  const debugInfo = document.getElementById('debugInfo');

  let settings = await loadSettings();

  // ---- Render website toggles ----

  function renderWebsites() {
    websiteList.innerHTML = '';
    ALL_WEBSITES.forEach(site => {
      const label = document.createElement('label');
      label.className = 'website-item';
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.checked = (settings.supportedWebsites || []).includes(site.id);
      cb.addEventListener('change', async () => {
        if (cb.checked) {
          if (!settings.supportedWebsites.includes(site.id))
            settings.supportedWebsites.push(site.id);
        } else {
          settings.supportedWebsites = settings.supportedWebsites.filter(s => s !== site.id);
        }
        await saveSettings();
      });
      label.appendChild(cb);
      label.appendChild(document.createTextNode(site.name));
      websiteList.appendChild(label);
    });
  }

  // ---- Load / Save settings ----

  async function loadSettings() {
    const r = await chrome.storage.local.get('settings');
    const defaults = {
      autoSave: true, autoExportXlsx: false, notifications: true,
      duplicateDetection: true, debugMode: false,
      supportedWebsites: ALL_WEBSITES.map(s => s.id),
      fileHandleStored: false, lastSavedPath: ''
    };
    const s = r.settings || {};
    const merged = { ...defaults, ...s };

    autoSaveEl.checked = merged.autoSave;
    autoExportXlsxEl.checked = merged.autoExportXlsx;
    notificationsEl.checked = merged.notifications;
    duplicateDetectionEl.checked = merged.duplicateDetection;
    debugModeEl.checked = merged.debugMode;

    updateFileStatusUI(merged);
    if (merged.debugMode) debugCard.style.display = 'block';
    return merged;
  }

  async function saveSettings() {
    settings.autoSave = autoSaveEl.checked;
    settings.autoExportXlsx = autoExportXlsxEl.checked;
    settings.notifications = notificationsEl.checked;
    settings.duplicateDetection = duplicateDetectionEl.checked;
    settings.debugMode = debugModeEl.checked;
    await chrome.storage.local.set({ settings });
    debugCard.style.display = settings.debugMode ? 'block' : 'none';
    await updatePendingCount();
  }

  // ---- File status UI ----

  function updateFileStatusUI(s) {
    const downloadLink = '<a href="#" class="dl-link">Download .xlsx</a>';

    if (s.autoExportXlsx !== false) {
      filePathEl.innerHTML =
        `Auto-exporting to <strong>Downloads/JobSync/JobSync_Applications.xlsx</strong> — ${downloadLink}`;
      fileIndicator.className = 'status-indicator ready';
      selectFileBtnText.textContent = 'Import .xlsx File';
    } else if (s.fileHandleStored && s.lastSavedPath) {
      filePathEl.innerHTML =
        `Imported from: ${escapeHtml(s.lastSavedPath)} — ${downloadLink}`;
      fileIndicator.className = 'status-indicator ready';
      selectFileBtnText.textContent = 'Import .xlsx File';
    } else {
      filePathEl.innerHTML =
        `Data stored in extension. ${downloadLink} to save to your computer.`;
      fileIndicator.className = 'status-indicator missing';
      selectFileBtnText.textContent = 'Import .xlsx File';
    }

    document.querySelectorAll('.dl-link').forEach(el => {
      el.addEventListener('click', (e) => { e.preventDefault(); downloadXlsx(); });
    });
  }

  async function updateFileStatus() {
    const s = await loadSettings();
    updateFileStatusUI(s);
  }

  async function updatePendingCount() {
    const d = await chrome.storage.local.get('pendingApplications');
    const pending = d.pendingApplications || [];
    pendingCount.textContent =
      `${pending.length} application(s) pending sync to Excel workbook.`;
  }

  async function debugLog(msg, data) {
    if (settings.debugMode) {
      const line = `[${new Date().toLocaleTimeString()}] ${msg} ${data ? JSON.stringify(data) : ''}`;
      debugInfo.textContent = debugInfo.textContent + '\n' + line;
      debugInfo.scrollTop = debugInfo.scrollHeight;
    }
  }

  // ---- File Import (load .xlsx into storage) ----

  selectFileBtn.addEventListener('click', () => {
    fileInput.click();
  });

  fileInput.addEventListener('change', async () => {
    const file = fileInput.files[0];
    if (!file) return;
    await processSelectedFile(file);
    fileInput.value = '';
    showToast(`Imported: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`, 'success');
    debugLog('Imported file:', `${file.name} (${file.size} bytes)`);
  });

  async function processSelectedFile(file) {
    const buffer = await file.arrayBuffer();
    const u8 = new Uint8Array(buffer);
    let bin = '';
    for (let i = 0; i < u8.byteLength; i++) bin += String.fromCharCode(u8[i]);
    const base64 = btoa(bin);
    await chrome.storage.local.set({ excelData: base64 });
    const s = await getSettingsFromStorage();
    s.fileHandleStored = true;
    s.lastSavedPath = file.name;
    await chrome.storage.local.set({ settings: s });
    settings = { ...settings, ...s };
    updateFileStatusUI(settings);
  }

  // ---- Download .xlsx (export from storage to Downloads folder) ----

  downloadXlsxBtn.addEventListener('click', downloadXlsx);

  async function downloadXlsx() {
    showToast('Exporting .xlsx...', 'info');
    const result = await chrome.runtime.sendMessage({ type: 'DOWNLOAD_XLSX' });
    if (result && result.success) {
      showToast('Saved to Downloads/JobSync/JobSync_Applications.xlsx', 'success');
      debugLog('Exported .xlsx to Downloads');
    } else {
      const errorMsg = result?.error || 'Unknown error (no response)';
      debugLog('Export error:', errorMsg);
      showToast('Export failed: ' + errorMsg, 'error');
    }
  }

  // ---- Settings change handlers ----

  autoSaveEl.addEventListener('change', saveSettings);
  autoExportXlsxEl.addEventListener('change', async () => {
    await saveSettings();
    // Toggle auto-export on/off
    const on = autoExportXlsxEl.checked;
    showToast(on ? 'Auto-export enabled' : 'Auto-export disabled', 'info');
    updateFileStatusUI(settings);
  });
  notificationsEl.addEventListener('change', saveSettings);
  duplicateDetectionEl.addEventListener('change', saveSettings);
  debugModeEl.addEventListener('change', saveSettings);

  // ---- Sync ----

  syncBtn.addEventListener('click', async () => {
    const r = await chrome.runtime.sendMessage({ type: 'SYNC_PENDING' });
    if (r && r.synced > 0) showToast(`Synced ${r.synced} application(s)!`, 'success');
    else if (r && r.synced === 0) showToast('Nothing to sync.', 'info');
    else if (r && r.error === 'NO_FILE') showToast('Import an .xlsx file first.', 'error');
    else showToast('Sync completed.', 'info');
    await updatePendingCount();
  });

  // ---- Export JSON backup ----

  exportJsonBtn.addEventListener('click', async () => {
    const data = await chrome.storage.local.get(['savedJobs', 'settings']);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    try {
      await chrome.downloads.download({
        url, filename: `JobSync_backup_${new Date().toISOString().split('T')[0]}.json`, saveAs: true
      });
    } catch (e) {
      const a = document.createElement('a');
      a.href = url;
      a.download = `JobSync_backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
    }
    URL.revokeObjectURL(url);
    showToast('Backup exported!', 'success');
  });

  // ---- Clear history ----

  clearHistoryBtn.addEventListener('click', async () => {
    if (confirm('Clear all local application history? This cannot be undone.')) {
      await chrome.storage.local.set({ savedJobs: [], applicationHistory: [] });
      showToast('Local history cleared.', 'info');
    }
  });

  // ---- Helpers ----

  async function getSettingsFromStorage() {
    const r = await chrome.storage.local.get('settings');
    return r.settings || {};
  }

  function escapeHtml(text) {
    if (!text) return '';
    const d = document.createElement('div');
    d.textContent = text;
    return d.innerHTML;
  }

  // ---- Diagnostic ----

  async function checkWorkbookStatus() {
    try {
      const status = await chrome.runtime.sendMessage({ type: 'GET_EXCEL_STATUS' });
      debugLog('Background status:', JSON.stringify(status, null, 2));
    } catch (e) {
      debugLog('Failed to get status:', e.message);
    }
  }

  setTimeout(checkWorkbookStatus, 1000);

  // ---- Init ----

  renderWebsites();
  await updatePendingCount();

  function showToast(message, type) {
    const t = document.getElementById('toast');
    t.textContent = message;
    t.className = `toast ${type}`;
    t.style.display = 'block';
    setTimeout(() => { t.style.display = 'none'; }, 4000);
  }
});
