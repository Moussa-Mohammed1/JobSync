window.SUCCESS_INDICATORS = [
  'application submitted',
  'thanks for applying',
  'application received',
  'application completed',
  'submission successful',
  'your application has been submitted',
  'application sent',
  'we received your application',
  'successfully applied',
  'application confirmation',
  'applied successfully',
  'your application was submitted',
  'thank you for your application',
  'application has been received',
  'your submission has been received',
  'application success',
  'congratulations, you have applied',
  'you have successfully applied',
  'apply complete',
  'submitted successfully'
];

window.SUCCESS_URL_PATTERNS = [
  '/jobs/apply/success',
  '/applications/submitted',
  '/application/confirmation',
  '/job-search/success',
  '/apply/complete',
  '/submission/confirmation',
  '/applicant/confirmation',
  '/application-success',
  '/submitted',
  '/confirmation'
];

class SubmissionDetector {
  constructor(config = {}) {
    this.config = {
      observeMutations: true,
      observeUrlChanges: true,
      checkInterval: config.checkInterval || 2000,
      maxChecks: config.maxChecks || 60,
      ...config
    };
    this._observer = null;
    this._urlCheckInterval = null;
    this._checkCount = 0;
    this._onSuccess = null;
    this._originalUrl = window.location.href;
    this._detected = false;
  }

  start(onSuccess) {
    this._onSuccess = onSuccess;

    if (this.config.observeMutations) {
      this._startMutationObserver();
    }

    if (this.config.observeUrlChanges) {
      this._startUrlObserver();
    }

    this._startPolling();
  }

  stop() {
    if (this._observer) {
      this._observer.disconnect();
      this._observer = null;
    }
    if (this._urlCheckInterval) {
      clearInterval(this._urlCheckInterval);
      this._urlCheckInterval = null;
    }
  }

  _startMutationObserver() {
    this._observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList' || mutation.type === 'characterData') {
          const addedNodes = mutation.addedNodes;
          for (const node of addedNodes) {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const text = node.textContent || '';
              if (this._checkSuccessText(text)) {
                this._detected = true;
                this._onSuccess('mutation');
                return;
              }
            }
          }
          if (mutation.target && mutation.target.nodeType === Node.ELEMENT_NODE) {
            const text = mutation.target.textContent || '';
            if (this._checkSuccessText(text)) {
              this._detected = true;
              this._onSuccess('mutation');
              return;
            }
          }
        }
      }

      this._checkVisibleElements();
    });

    this._observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: false
    });
  }

  _startUrlObserver() {
    this._urlCheckInterval = setInterval(() => {
      if (this._detected) return;
      const currentUrl = window.location.href;
      if (currentUrl !== this._originalUrl) {
        this._originalUrl = currentUrl;
        if (this._checkUrlPattern(currentUrl)) {
          this._detected = true;
          this._onSuccess('url');
        }
      }
    }, 500);
  }

  _startPolling() {
    const poll = () => {
      if (this._detected) return;
      this._checkCount++;

      if (this._checkVisibleElements()) return;
      if (this._checkUrlPattern(window.location.href)) return;

      const pageText = document.body.innerText || '';
      if (this._checkSuccessText(pageText)) {
        this._detected = true;
        this._onSuccess('text');
        return;
      }

      const toastElements = document.querySelectorAll(
        '[class*="toast"], [class*="alert"], [class*="notification"], ' +
        '[class*="success"], [class*="confirmation"], [class*="message"], ' +
        '[role="alert"], [role="status"], [aria-live="polite"]'
      );
      for (const el of toastElements) {
        if (el.offsetParent !== null && this._checkSuccessText(el.textContent || '')) {
          this._detected = true;
          this._onSuccess('toast');
          return;
        }
      }

      this._checkForSuccessModal();

      if (this._checkCount < this.config.maxChecks) {
        setTimeout(poll, this.config.checkInterval);
      }
    };
    setTimeout(poll, 1000);
  }

  _checkVisibleElements() {
    const visibleElements = document.querySelectorAll(
      'h1, h2, h3, h4, .success-message, .application-success, ' +
      '[class*="success"], [class*="thank"], [class*="confirmation"]'
    );
    for (const el of visibleElements) {
      if (el.offsetParent !== null && this._checkSuccessText(el.textContent || '')) {
        this._detected = true;
        this._onSuccess('visible');
        return true;
      }
    }
    return false;
  }

  _checkForSuccessModal() {
    const modals = document.querySelectorAll(
      '[class*="modal"], [class*="dialog"], [class*="overlay"], ' +
      '[class*="popup"], [class*="drawer"]'
    );
    for (const modal of modals) {
      if (modal.offsetParent !== null) {
        const text = modal.textContent || '';
        if (this._checkSuccessText(text)) {
          this._detected = true;
          this._onSuccess('modal');
          return true;
        }
      }
    }
    return false;
  }

  _checkSuccessText(text) {
    if (!text) return false;
    const lower = text.toLowerCase().trim();
    return window.SUCCESS_INDICATORS.some(indicator => lower.includes(indicator));
  }

  _checkUrlPattern(url) {
    if (!url) return false;
    const lower = url.toLowerCase();
    return window.SUCCESS_URL_PATTERNS.some(pattern => lower.includes(pattern));
  }
}

if (typeof window !== 'undefined') {
  window.SubmissionDetector = SubmissionDetector;
}
