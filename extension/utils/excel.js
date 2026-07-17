const ExcelManager = {
  COLUMNS: [
    'Application Date', 'Company', 'Job Title', 'Location', 'Website',
    'Job URL', 'Salary', 'Employment Type', 'Remote Type', 'Recruiter',
    'Recruiter Email', 'Posting Date', 'Required Skills', 'Experience Required',
    'Application Status', 'Priority', 'Notes', 'Follow-up Date',
    'Company Website', 'Description', 'Created At'
  ],

  async getWorkbook() {
    const data = await chrome.storage.local.get('excelData');
    if (data.excelData) {
      try {
        const buffer = this._base64ToArrayBuffer(data.excelData);
        return XLSX.read(buffer, { type: 'array' });
      } catch (e) {
        console.error('Failed to parse stored Excel data:', e);
      }
    }
    return this._createEmptyWorkbook();
  },

  async saveWorkbook(workbook) {
    const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const base64 = this._arrayBufferToBase64(wbout);
    await chrome.storage.local.set({ excelData: base64 });
    return wbout;
  },

  async initFromFile(file) {
    const buffer = await file.arrayBuffer();
    let workbook;
    try {
      workbook = XLSX.read(buffer, { type: 'array' });
    } catch (e) {
      workbook = this._createEmptyWorkbook();
    }

    const ws = workbook.Sheets[workbook.SheetNames[0]];
    if (!ws || !ws['!ref']) {
      const newWs = XLSX.utils.aoa_to_sheet([this.COLUMNS]);
      workbook.Sheets[workbook.SheetNames[0]] = newWs;
    } else {
      const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
      if (!data || data.length === 0 || !data[0] || data[0][0] !== 'Application Date') {
        XLSX.utils.sheet_add_aoa(ws, [this.COLUMNS], { origin: 'A1' });
      }
    }

    await this.saveWorkbook(workbook);
    return workbook;
  },

  async appendRow(jobData) {
    const workbook = await this.getWorkbook();
    const sheetName = workbook.SheetNames[0];
    const ws = workbook.Sheets[sheetName];

    const row = this._buildRow(jobData);
    const existingData = XLSX.utils.sheet_to_json(ws, { header: 1 });
    const nextRow = existingData.length + 1;

    XLSX.utils.sheet_add_aoa(ws, [row], { origin: `A${nextRow}` });

    this._autoFitColumns(ws);

    await this.saveWorkbook(workbook);
    return workbook;
  },

  async exportToFile(fileHandle) {
    const data = await chrome.storage.local.get('excelData');
    if (!data.excelData) return { success: false, error: 'NO_DATA' };

    try {
      const buffer = this._base64ToArrayBuffer(data.excelData);
      const writable = await fileHandle.createWritable();
      await writable.write(buffer);
      await writable.close();
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  async getAllRows() {
    const workbook = await this.getWorkbook();
    const ws = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
    return data.slice(1);
  },

  _buildRow(data) {
    const appDate = data.applicationDate || (() => {
      try { return new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }); } catch (e) { return ''; }
    })();

    return [
      appDate, data.company || '', data.title || '', data.location || '',
      data.website || '', data.jobUrl || data.url || '', data.salary || '',
      data.employmentType || '', data.remoteType || '', data.recruiterName || '',
      data.recruiterEmail || '', data.postingDate || '', data.skills || '',
      data.experienceRequired || '', 'Saved', 'Normal', '', '',
      data.companyWebsite || '', data.description || '', new Date().toISOString()
    ];
  },

  _autoFitColumns(ws) {
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:A1');
    for (let col = range.e.c; col >= 0; col--) {
      let maxWidth = 12;
      for (let row = range.s.r; row <= range.e.r; row++) {
        const addr = XLSX.utils.encode_cell({ r: row, c: col });
        const cell = ws[addr];
        if (cell && cell.v !== undefined && cell.v !== null) {
          const len = String(cell.v).length;
          if (len > maxWidth) maxWidth = Math.min(len + 3, 80);
        }
      }
      if (!ws['!cols']) ws['!cols'] = [];
      ws['!cols'][col] = { wch: maxWidth };
    }
  },

  _createEmptyWorkbook() {
    const ws = XLSX.utils.aoa_to_sheet([this.COLUMNS]);
    this._autoFitColumns(ws);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Applications');
    return wb;
  },

  _base64ToArrayBuffer(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  },

  _arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }
};

if (typeof window !== 'undefined') {
  window.ExcelManager = ExcelManager;
}
