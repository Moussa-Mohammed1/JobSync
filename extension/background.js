try {
  importScripts('lib/xlsx.full.min.js');
  console.log('XLSX loaded successfully, version:', XLSX?.version || 'unknown');
} catch (e) {
  console.error('Failed to load XLSX library:', e);
}

function isXlsxReady() { return typeof XLSX !== 'undefined' && typeof XLSX.utils !== 'undefined'; }

const COLUMNS = [
  'Application Date', 'Company', 'Job Title', 'Location', 'Website',
  'Job URL', 'Salary', 'Employment Type', 'Remote Type', 'Recruiter',
  'Recruiter Email', 'Posting Date', 'Required Skills', 'Experience Required',
  'Application Status', 'Priority', 'Notes', 'Follow-up Date',
  'Company Website', 'Description', 'Created At'
];

// ---- Lifecycle ----

chrome.runtime.onInstalled.addListener(async () => {
  const data = await chrome.storage.local.get('settings');
  if (!data.settings) {
    await chrome.storage.local.set({
      settings: {
        autoSave: true, notifications: true, duplicateDetection: true, debugMode: false,
        autoExportXlsx: true,
        supportedWebsites: ['linkedin', 'indeed', 'glassdoor', 'greenhouse', 'lever',
          'workday', 'ashby', 'smartrecruiters', 'wttj', 'bamboohr'],
        fileHandleStored: false, lastSavedPath: ''
      }
    });
  }
  const saved = await chrome.storage.local.get('savedJobs');
  if (!saved.savedJobs) await chrome.storage.local.set({ savedJobs: [] });
  const history = await chrome.storage.local.get('applicationHistory');
  if (!history.applicationHistory) await chrome.storage.local.set({ applicationHistory: [] });

  try { await initWorkbook(); } catch (e) { console.error('initWorkbook on install:', e); }
  chrome.alarms.create('syncPending', { periodInMinutes: 5 });
});

chrome.runtime.onStartup.addListener(async () => {
  try { await initWorkbook(); } catch (e) { console.error('initWorkbook on startup:', e); }
});

// ---- Message handling ----

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message, sender).then(sendResponse);
  return true;
});

async function handleMessage(message, sender) {
  try {
    switch (message.type) {
      case 'JOB_DETECTED': return { received: true };

      case 'APPLICATION_SUCCESS':
      case 'MANUAL_SAVE':
        return await handleSave(message.data, message.type === 'MANUAL_SAVE' ? 'manual' : 'auto');

      case 'CHECK_DUPLICATE': return await checkDuplicate(message.data);

      case 'GET_STATUS':
        return { fileHandleStored: (await getSettings()).fileHandleStored || false };

      case 'OPEN_OPTIONS': chrome.runtime.openOptionsPage(); return { success: true };

      case 'GET_HISTORY':
        return { history: (await chrome.storage.local.get('applicationHistory')).applicationHistory || [] };

      case 'GET_SAVED_JOBS':
        return { jobs: (await chrome.storage.local.get('savedJobs')).savedJobs || [] };

      case 'GET_SETTINGS': return { settings: await getSettings() };

      case 'SAVE_SETTINGS':
        await chrome.storage.local.set({ settings: message.settings });
        return { success: true };

      case 'INIT_FROM_FILE':
        await chrome.storage.local.set({ excelData: message.fileData });
        const s = await getSettings();
        s.fileHandleStored = true;
        s.lastSavedPath = message.fileName || 'Excel File';
        await chrome.storage.local.set({ settings: s });
        return { success: true };

      case 'SYNC_PENDING': return await syncPending();
      case 'DOWNLOAD_XLSX': return await exportToDownloads();
      case 'GET_EXCEL_STATUS': return await getExcelStatus();

      default: return { error: 'Unknown: ' + message.type };
    }
  } catch (e) {
    console.error('Error:', e);
    return { error: e.message };
  }
}

// ---- Save flow ----

async function handleSave(data, source) {
  const settings = await getSettings();
  const dup = await checkDuplicateInner(data);

  if (dup.isDuplicate) {
    notify('Already Recorded', `${data.title || 'Job'} at ${data.company || 'Company'} was already saved.`, 'warning');
    return { success: false, duplicate: true };
  }

  const entry = {
    ...data,
    status: 'Saved', priority: 'Normal', notes: '', followUpDate: '',
    createdAt: new Date().toISOString(), savedAt: new Date().toISOString()
  };

  const jobs = (await chrome.storage.local.get('savedJobs')).savedJobs || [];
  jobs.push(entry);
  await chrome.storage.local.set({ savedJobs: jobs });

  const history = (await chrome.storage.local.get('applicationHistory')).applicationHistory || [];
  history.unshift({
    company: data.company || '', title: data.title || '',
    website: data.website || '', jobUrl: data.jobUrl || data.url || '',
    savedAt: new Date().toISOString()
  });
  await chrome.storage.local.set({ applicationHistory: history.slice(0, 500) });

  // Append to in-storage workbook (no offscreen needed, XLSX is loaded directly)
  const appendOk = await appendRowToWorkbook(data);

  if (!appendOk) {
    const pending = (await chrome.storage.local.get('pendingApplications')).pendingApplications || [];
    pending.push(entry);
    await chrome.storage.local.set({ pendingApplications: pending });
  }

  // Auto-export to Downloads
  let exportOk = false;
  if (settings.autoExportXlsx !== false) {
    const r = await exportToDownloads();
    exportOk = r.success;
  }

  notify('Application Saved',
    exportOk
      ? `${data.title || 'Job'} at ${data.company || 'Company'} recorded. File saved to Downloads.`
      : `${data.title || 'Job'} at ${data.company || 'Company'} recorded.`,
    'success');

  return { success: true };
}

// ---- Excel operations (direct, no offscreen) ----

async function initWorkbook() {
  const existing = await chrome.storage.local.get('excelData');
  if (!existing.excelData) {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([COLUMNS]);
    autoFitColumns(ws);
    XLSX.utils.book_append_sheet(wb, ws, 'Applications');
    await saveWorkbookToStorage(wb);
  }
}

async function getWorkbookFromStorage() {
  const data = await chrome.storage.local.get('excelData');
  if (data.excelData) {
    try {
      const buf = base64ToBuffer(data.excelData);
      return XLSX.read(buf, { type: 'array' });
    } catch (e) {
      console.error('Failed to parse workbook, creating new:', e);
    }
  }
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([COLUMNS]);
  autoFitColumns(ws);
  XLSX.utils.book_append_sheet(wb, ws, 'Applications');
  return wb;
}

async function saveWorkbookToStorage(wb) {
  const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  await chrome.storage.local.set({ excelData: bufferToBase64(out) });
}

async function appendRowToWorkbook(data) {
  try {
    const wb = await getWorkbookFromStorage();
    const ws = wb.Sheets[wb.SheetNames[0]];
    const existing = XLSX.utils.sheet_to_json(ws, { header: 1 });
    const row = buildRow(data);
    XLSX.utils.sheet_add_aoa(ws, [row], { origin: `A${existing.length + 1}` });
    autoFitColumns(ws);
    await saveWorkbookToStorage(wb);
    return true;
  } catch (e) {
    console.error('appendRowToWorkbook error:', e);
    return false;
  }
}

function buildRow(data) {
  const d = data.applicationDate ||
    new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  return [
    d, data.company || '', data.title || '', data.location || '',
    data.website || '', data.jobUrl || data.url || '', data.salary || '',
    data.employmentType || '', data.remoteType || '', data.recruiterName || '',
    data.recruiterEmail || '', data.postingDate || '', data.skills || '',
    data.experienceRequired || '', 'Saved', 'Normal', '', '',
    data.companyWebsite || '', data.description || '', new Date().toISOString()
  ];
}

function autoFitColumns(ws) {
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:A1');
  for (let c = 0; c <= range.e.c; c++) {
    let w = 12;
    for (let r = range.s.r; r <= range.e.r; r++) {
      const cell = ws[XLSX.utils.encode_cell({ r, c })];
      if (cell && cell.v != null) w = Math.max(w, Math.min(String(cell.v).length + 3, 80));
    }
    if (!ws['!cols']) ws['!cols'] = [];
    ws['!cols'][c] = { wch: w };
  }
}

// ---- Duplicate check ----

async function checkDuplicate(data) {
  return checkDuplicateInner(data);
}

async function checkDuplicateInner(data) {
  const settings = await getSettings();
  if (settings.duplicateDetection === false) return { isDuplicate: false };

  const all = [
    ...((await chrome.storage.local.get('savedJobs')).savedJobs || []),
    ...((await chrome.storage.local.get('pendingApplications')).pendingApplications || [])
  ];

  const url = (data.jobUrl || data.url || '').toLowerCase().trim();
  const company = (data.company || '').toLowerCase().trim();
  const title = (data.title || '').toLowerCase().trim();

  for (const j of all) {
    const ju = (j.jobUrl || j.url || '').toLowerCase().trim();
    const jc = (j.company || '').toLowerCase().trim();
    const jt = (j.title || '').toLowerCase().trim();

    if (url && ju && url === ju) return { isDuplicate: true, matchField: 'URL', matchValue: url };
    if (company && title && jc && jt && company === jc && title === jt)
      return { isDuplicate: true, matchField: 'Company + Title', matchValue: `${company} - ${title}` };
  }
  return { isDuplicate: false };
}

// ---- Sync pending ----

async function syncPending() {
  const pending = (await chrome.storage.local.get('pendingApplications')).pendingApplications || [];
  if (pending.length === 0) return { synced: 0 };

  await initWorkbook();
  let synced = 0, failed = [];

  for (const entry of pending) {
    const ok = await appendRowToWorkbook(entry);
    if (ok) { synced++; } else { failed.push(entry); }
  }

  await chrome.storage.local.set({ pendingApplications: failed });

  if (synced > 0) {
    notify('Sync Complete', `${synced} application(s) synced to workbook.`, 'success');
  }

  return { synced, failed: failed.length };
}

// ---- Export to Downloads ----

async function exportToDownloads() {
  if (!isXlsxReady()) {
    return { success: false, error: 'XLSX_LIBRARY_NOT_LOADED' };
  }

  await initWorkbook();
  const d = await chrome.storage.local.get('excelData');
  if (!d.excelData) {
    return { success: false, error: 'NO_DATA - tried initWorkbook but excelData is still empty' };
  }
  if (typeof d.excelData !== 'string' || d.excelData.length === 0) {
    return { success: false, error: 'INVALID_DATA - excelData exists but is not a valid base64 string' };
  }

  try {
    // Service workers don't have URL.createObjectURL, use data URL instead
    const dataUrl = 'data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,' + d.excelData;

    await chrome.downloads.download({
      url: dataUrl,
      filename: 'JobSync/JobSync_Applications.xlsx',
      conflictAction: 'overwrite',
      saveAs: false
    });

    return { success: true };
  } catch (e) {
    return { success: false, error: 'DOWNLOAD_ERROR: ' + e.message };
  }
}

async function getExcelStatus() {
  const excel = await chrome.storage.local.get('excelData');
  const saved = await chrome.storage.local.get('savedJobs');
  const pending = await chrome.storage.local.get('pendingApplications');
  let workbookRowCount = 0;
  if (excel.excelData && isXlsxReady()) {
    try {
      const buf = base64ToBuffer(excel.excelData);
      const wb = XLSX.read(buf, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });
      workbookRowCount = rows.length - 1; // subtract header
    } catch (e) {
      workbookRowCount = -1; // error
    }
  }
  return {
    xlsxLoaded: isXlsxReady(),
    hasExcelData: !!excel.excelData,
    excelDataLength: excel.excelData ? excel.excelData.length : 0,
    savedJobsCount: (saved.savedJobs || []).length,
    pendingCount: (pending.pendingApplications || []).length,
    workbookRowCount
  };
}

// ---- Helpers ----

async function getSettings() {
  return ((await chrome.storage.local.get('settings')).settings || {});
}

function notify(title, message, type) {
  getSettings().then(settings => {
    if (settings.notifications === false) return;
    const icon = type === 'warning' ? '⚠ ' : type === 'error' ? '✗ ' : '✓ ';
    chrome.notifications.create({
      type: 'basic', iconUrl: chrome.runtime.getURL('assets/icon128.png'),
      title: icon + title, message, priority: 2
    }).catch(() => {});
  });
}

function base64ToBuffer(b64) {
  const bin = atob(b64);
  const u8 = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
  return u8.buffer;
}

function bufferToBase64(buf) {
  const u8 = new Uint8Array(buf);
  let bin = '';
  for (let i = 0; i < u8.byteLength; i++) bin += String.fromCharCode(u8[i]);
  return btoa(bin);
}

// ---- Alarms ----

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'syncPending') {
    const pending = (await chrome.storage.local.get('pendingApplications')).pendingApplications || [];
    if (pending.length > 0) await syncPending();
  }
});

chrome.notifications.onClicked.addListener((id) => chrome.notifications.clear(id));
