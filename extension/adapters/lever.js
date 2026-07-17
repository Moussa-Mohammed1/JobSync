class LeverAdapter extends JobSiteAdapter {
  constructor() {
    super();
    this.name = 'Lever';
    this.domains = ['lever.co'];
    this.urlPatterns = ['/jobs/', '/apply/'];
  }

  detectJobPage() {
    const url = window.location.href.toLowerCase();
    return url.includes('/jobs/') || url.includes('/apply/');
  }

  extractCompany() {
    const selectors = [
      '.posting-header h2',
      '[class*="company-name"]',
      '.header-logo-text',
      '.main-header-text'
    ];
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el && el.textContent.trim()) return el.textContent.trim();
    }

    const hostParts = window.location.hostname.split('.');
    if (hostParts.length > 1 && hostParts[0] !== 'www') {
      return hostParts[0].charAt(0).toUpperCase() + hostParts[0].slice(1);
    }
    return '';
  }

  extractTitle() {
    const selectors = [
      '.posting-header h1',
      'h1[class*="title"]',
      '.posting-title',
      'h1'
    ];
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el && el.textContent.trim()) return el.textContent.trim();
    }
    const ogTitle = Extractor.getMetaContent('og:title');
    return ogTitle || document.title;
  }

  extractLocation() {
    const selectors = [
      '.posting-category',
      '.location',
      '[class*="location"]',
      '.posting-header .location'
    ];
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el && el.textContent.trim()) return el.textContent.trim();
    }
    return '';
  }

  extractSalary() {
    const selectors = [
      '[class*="salary"]',
      '.salary-range',
      '.compensation'
    ];
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el && el.textContent.trim()) return el.textContent.trim();
    }
    const pageText = document.body.innerText || '';
    const match = pageText.match(
      /\$[\d,]+(?:\s*-\s*\$[\d,]+)?(?:\s*(?:per|a|an)\s*(?:hour|year|month|yr|hr))?/gi
    );
    return match ? match[0] : '';
  }

  extractDescription() {
    const selectors = [
      '.content',
      '.posting-description',
      '.page-content',
      '.posting-content'
    ];
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el && el.textContent.trim()) return Extractor.cleanHtml(el.innerHTML);
    }
    return '';
  }

  getSuccessIndicators() {
    return [
      'application submitted',
      'your application has been received',
      'thank you for applying',
      'successfully applied',
      'we have received your application'
    ];
  }

  getSuccessSelectors() {
    return [
      '.application-success',
      '.success-message',
      '[class*="confirmation"]',
      '[class*="thank"]'
    ];
  }

  getSuccessUrlPatterns() {
    return ['/apply/complete', '/application/confirmation'];
  }
}

if (typeof window !== 'undefined') {
  window.LeverAdapter = LeverAdapter;
}
