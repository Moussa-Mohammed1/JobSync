document.addEventListener('DOMContentLoaded', async () => {
  const historyList = document.getElementById('historyList');
  const searchInput = document.getElementById('searchInput');
  const refreshBtn = document.getElementById('refreshBtn');

  let allEntries = [];

  async function loadHistory() {
    const result = await chrome.storage.local.get(['savedJobs', 'applicationHistory']);
    const savedJobs = result.savedJobs || [];
    const appHistory = result.applicationHistory || [];

    const entries = new Map();

    savedJobs.forEach(job => {
      const key = job.jobUrl || job.url || `${job.company}-${job.title}-${job.applicationDate}`;
      if (!entries.has(key)) {
        entries.set(key, {
          company: job.company || '',
          title: job.title || '',
          website: job.website || '',
          jobUrl: job.jobUrl || job.url || '',
          savedAt: job.savedAt || job.createdAt || job.applicationDate || '',
          status: job.status || 'Saved'
        });
      }
    });

    appHistory.forEach(entry => {
      const key = entry.jobUrl || `${entry.company}-${entry.title}-${entry.savedAt}`;
      if (!entries.has(key)) {
        entries.set(key, {
          company: entry.company || '',
          title: entry.title || '',
          website: entry.website || '',
          jobUrl: entry.jobUrl || '',
          savedAt: entry.savedAt || '',
          status: 'History'
        });
      }
    });

    allEntries = Array.from(entries.values())
      .sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt));

    renderEntries(allEntries);
  }

  function renderEntries(entries) {
    if (entries.length === 0) {
      historyList.innerHTML = '<div class="empty-state">No applications saved yet.</div>';
      return;
    }

    historyList.innerHTML = entries.map(entry => {
      const date = entry.savedAt ? new Date(entry.savedAt).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
      }) : '';

      const domain = entry.website || (entry.jobUrl ? new URL(entry.jobUrl).hostname : '');

      return `
        <div class="history-item">
          <div class="history-icon">
            ${entry.company ? entry.company.charAt(0).toUpperCase() : '?'}
          </div>
          <div class="history-content">
            <div class="history-company">${escapeHtml(entry.company) || 'Unknown Company'}</div>
            <div class="history-title">${escapeHtml(entry.title) || 'Unknown Position'}</div>
            <div class="history-meta">
              <span>${date}</span>
              <span>${escapeHtml(domain)}</span>
            </div>
          </div>
          <div class="history-actions">
            ${entry.jobUrl ? `<a href="${escapeHtml(entry.jobUrl)}" target="_blank" class="btn btn-text">Open</a>` : ''}
          </div>
        </div>
      `;
    }).join('');
  }

  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  searchInput.addEventListener('input', () => {
    const query = searchInput.value.toLowerCase().trim();
    if (!query) {
      renderEntries(allEntries);
      return;
    }
    const filtered = allEntries.filter(e =>
      (e.company && e.company.toLowerCase().includes(query)) ||
      (e.title && e.title.toLowerCase().includes(query)) ||
      (e.website && e.website.toLowerCase().includes(query))
    );
    renderEntries(filtered);
  });

  refreshBtn.addEventListener('click', loadHistory);

  await loadHistory();
});
