let currentAdapter = null;
let detector = null;
let jobInfo = null;
let isSaving = false;

async function initialize() {
  currentAdapter = AdapterRegistry.getAdapterForCurrentPage();

  if (currentAdapter) {
    jobInfo = currentAdapter.extractAll();
    notifyBackground({ type: 'JOB_DETECTED', data: jobInfo });

    const settings = await Storage.getSettings();
    if (settings.autoSave) {
      startSuccessDetection();
    }
  }
}

function startSuccessDetection() {
  if (detector) detector.stop();

  const adapterIndicators = currentAdapter.getSuccessIndicators();
  const adapterSelectors = currentAdapter.getSuccessSelectors();
  const adapterUrlPatterns = currentAdapter.getSuccessUrlPatterns();

  if (adapterIndicators.length && window.SubmissionDetector) {
    window.SUCCESS_INDICATORS.push(...adapterIndicators.filter(i => !window.SUCCESS_INDICATORS.includes(i)));
  }
  if (adapterUrlPatterns.length && window.SUCCESS_URL_PATTERNS) {
    window.SUCCESS_URL_PATTERNS.push(...adapterUrlPatterns.filter(p => !window.SUCCESS_URL_PATTERNS.includes(p)));
  }

  detector = new SubmissionDetector({
    checkInterval: 2000,
    maxChecks: 90
  });

  detector.start(async (source) => {
    if (isSaving) return;
    isSaving = true;

    if (currentAdapter) {
      jobInfo = currentAdapter.extractAll();
    }

    const duplicateCheck = await DuplicateChecker.check(jobInfo);

    if (duplicateCheck.isDuplicate) {
      notifyBackground({ type: 'DUPLICATE_DETECTED', data: jobInfo, matchField: duplicateCheck.matchField });
      isSaving = false;
      return;
    }

    notifyBackground({ type: 'APPLICATION_SUCCESS', data: jobInfo, source });

    isSaving = false;
  });
}

async function manualSave() {
  if (isSaving) return;
  isSaving = true;

  if (currentAdapter) {
    jobInfo = currentAdapter.extractAll();
  } else {
    jobInfo = {
      title: document.title,
      url: window.location.href,
      website: window.location.hostname,
      applicationDate: Extractor.formatDate(new Date()),
      company: '',
      location: '',
      description: ''
    };
  }

  const duplicateCheck = await DuplicateChecker.check(jobInfo);

  if (duplicateCheck.isDuplicate) {
    notifyBackground({ type: 'DUPLICATE_DETECTED', data: jobInfo });
    isSaving = false;
    return { success: false, duplicate: true };
  }

  const result = await notifyBackground({ type: 'MANUAL_SAVE', data: jobInfo });
  isSaving = false;
  return result;
}

async function getJobInfo() {
  if (currentAdapter) {
    jobInfo = currentAdapter.extractAll();
  }
  return jobInfo;
}

function notifyBackground(message) {
  return chrome.runtime.sendMessage(message).catch(() => {});
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'GET_JOB_INFO':
      getJobInfo().then(info => sendResponse(info));
      return true;

    case 'MANUAL_SAVE':
      manualSave().then(result => sendResponse(result));
      return true;

    case 'GET_STATUS':
      sendResponse({
        hasAdapter: !!currentAdapter,
        adapterName: currentAdapter ? currentAdapter.name : null,
        onJobPage: currentAdapter ? currentAdapter.detectJobPage() : false,
        isSaving,
        url: window.location.href
      });
      break;
  }
});

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}

document.addEventListener('popstate', () => {
  setTimeout(() => {
    const newAdapter = AdapterRegistry.getAdapterForCurrentPage();
    if (newAdapter && (!currentAdapter || newAdapter.name !== currentAdapter.name)) {
      currentAdapter = newAdapter;
      jobInfo = currentAdapter.extractAll();
      notifyBackground({ type: 'JOB_DETECTED', data: jobInfo });
    }
  }, 500);
});
