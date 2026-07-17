const COLUMNS = [
  'Application Date', 'Company', 'Job Title', 'Location', 'Website',
  'Job URL', 'Salary', 'Employment Type', 'Remote Type', 'Recruiter',
  'Recruiter Email', 'Posting Date', 'Required Skills', 'Experience Required',
  'Application Status', 'Priority', 'Notes', 'Follow-up Date',
  'Company Website', 'Description', 'Created At'
];

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message).then(sendResponse);
  return true;
});

async function handleMessage(message) {
  switch (message.type) {
    case 'APPEND_ROW':
      return await appendRow(message.data);

    case 'INIT_EMPTY':
      return await initEmpty();

    case 'PING':
      return { pong: true };

    default:
      return { error: 'Unknown: ' + message.type };
  }
}

async function getWorkbook() {
  const data = await chrome.storage.local.get('excelData');
  if (data.excelData) {
    try {
      return XLSX.read(base64ToBuffer(data.excelData), { type: 'array' });
    } catch (e) {}
  }
  return createEmptyWorkbook();
}

async function saveWorkbook(wb) {
  const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  await chrome.storage.local.set({ excelData: bufferToBase64(out) });
  return true;
}

async function appendRow(data) {
  try {
    const wb = await getWorkbook();
    const ws = wb.Sheets[wb.SheetNames[0]];
    const existing = XLSX.utils.sheet_to_json(ws, { header: 1 });
    const row = buildRow(data);
    XLSX.utils.sheet_add_aoa(ws, [row], { origin: `A${existing.length + 1}` });
    autoFitColumns(ws);
    await saveWorkbook(wb);
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

async function initEmpty() {
  try {
    const wb = createEmptyWorkbook();
    await saveWorkbook(wb);
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

function buildRow(data) {
  return [
    data.applicationDate || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
    data.company || '', data.title || '', data.location || '',
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

function createEmptyWorkbook() {
  const ws = XLSX.utils.aoa_to_sheet([COLUMNS]);
  autoFitColumns(ws);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Applications');
  return wb;
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
