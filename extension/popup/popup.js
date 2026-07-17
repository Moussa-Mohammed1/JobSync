document.addEventListener('DOMContentLoaded', async () => {
  const statusDot = document.getElementById('detectionStatus');
  const websiteEl = document.getElementById('website');
  const companyEl = document.getElementById('company');
  const positionEl = document.getElementById('position');
  const detectionLabel = document.getElementById('detectionLabel');
  const saveBtn = document.getElementById('saveBtn');
  const optionsBtn = document.getElementById('optionsBtn');
  const historyBtn = document.getElementById('historyBtn');
  const messageArea = document.getElementById('messageArea');
  const infoSection = document.getElementById('infoSection');

  async function refreshStatus() {
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tabs[0] || !tabs[0].id) {
        setInactive('No active tab');
        return;
      }

      const response = await chrome.tabs.sendMessage(tabs[0].id, { type: 'GET_STATUS' }).catch(() => null);

      if (response) {
        statusDot.className = 'status-dot active';
        websiteEl.textContent = response.adapterName || response.url?.hostname || 'Unknown';
        detectionLabel.textContent = response.onJobPage ? 'Watching for submission...' : 'Not a job page';

        if (response.onJobPage) {
          const jobInfo = await chrome.tabs.sendMessage(tabs[0].id, { type: 'GET_JOB_INFO' }).catch(() => null);
          if (jobInfo) {
            companyEl.textContent = jobInfo.company || '-';
            positionEl.textContent = jobInfo.title || '-';

            document.getElementById('infoLocation').textContent = jobInfo.location || '-';
            document.getElementById('infoSalary').textContent = jobInfo.salary || '-';
            document.getElementById('infoType').textContent = jobInfo.employmentType || '-';
            document.getElementById('infoRemote').textContent = jobInfo.remoteType || '-';
            infoSection.style.display = 'block';
          }
        } else {
          companyEl.textContent = '-';
          positionEl.textContent = '-';
          infoSection.style.display = 'none';
        }

        saveBtn.disabled = !response.onJobPage;
      } else {
        setInactive('Extension not active on this page');
        saveBtn.disabled = true;
      }
    } catch (e) {
      setInactive('Cannot access this page');
      saveBtn.disabled = true;
    }
  }

  function setInactive(message) {
    statusDot.className = 'status-dot inactive';
    detectionLabel.textContent = message;
    websiteEl.textContent = '-';
    companyEl.textContent = '-';
    positionEl.textContent = '-';
    infoSection.style.display = 'none';
  }

  saveBtn.addEventListener('click', async () => {
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tabs[0]?.id) return;

      showMessage('Saving...', 'info');
      saveBtn.disabled = true;

      const response = await chrome.tabs.sendMessage(tabs[0].id, { type: 'MANUAL_SAVE' }).catch(() => null);

      if (response && response.success) {
        showMessage('✓ Application saved successfully!', 'success');
      } else if (response && response.duplicate) {
        showMessage('Already recorded - duplicate detected.', 'warning');
      } else {
        showMessage('Saved locally. The job will sync to Excel when available.', 'info');
      }

      setTimeout(() => {
        hideMessage();
        saveBtn.disabled = false;
      }, 2000);
    } catch (e) {
      showMessage('Error saving. Try again.', 'error');
      saveBtn.disabled = false;
    }
  });

  optionsBtn.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });

  historyBtn.addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('history/history.html') });
  });

  function showMessage(text, type) {
    messageArea.textContent = text;
    messageArea.className = `message ${type}`;
    messageArea.style.display = 'block';
  }

  function hideMessage() {
    messageArea.style.display = 'none';
  }

  await refreshStatus();
});
