class AshbyAdapter extends JobSiteAdapter {
  constructor() {
    super();
    this.name = 'Ashby';
    this.domains = ['ashbyhq.com'];
    this.urlPatterns = ['/jobs/', '/application/'];
  }

  detectJobPage() {
    return window.location.href.toLowerCase().includes('/jobs/');
  }

  extractCompany() {
    const selectors = [
      '.company-name',
      '.company-header h2',
      '[class*="company"] h2',
      '.logo-text',
      'header h2'
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
      'h1[class*="title"]',
      'h1',
      '.job-title h1',
      '.posting-header h1'
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
      '[class*="location"]',
      '.posting-category',
      '.job-meta [class*="location"]',
      'span:contains("Remote")',
      'span:contains("On-site")',
      'span:contains("Hybrid")'
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
      '.compensation',
      '.salary-range'
    ];
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el && el.textContent.trim()) return el.textContent.trim();
    }
    const pageText = document.body.innerText || '';
    const match = pageText.match(/\$[\d,]+(?:\s*-\s*\$[\d,]+)?/);
    return match ? match[0] : '';
  }

  extractDescription() {
    const selectors = [
      '.job-description',
      '.content',
      '[class*="description"]',
      'main'
    ];
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el && el.textContent.trim()) return Extractor.cleanHtml(el.innerHTML);
    }
    return '';
  }

  extractRemoteType() {
    const pageText = document.body.innerText || '';
    if (pageText.includes('Remote')) return 'Remote';
    if (pageText.includes('Hybrid')) return 'Hybrid';
    if (pageText.includes('On-site') || pageText.includes('Onsite')) return 'On-site';
    return '';
  }

  getSuccessIndicators() {
    return [
      'application submitted',
      'your application has been submitted',
      'thank you for applying',
      'successfully applied',
      'we received your application',
      'application received'
    ];
  }

  getSuccessSelectors() {
    return [
      '.application-confirmation',
      '.success-message',
      '[class*="submitted"]',
      '[class*="success"]'
    ];
  }

  getSuccessUrlPatterns() {
    return ['/application/confirmation', '/apply/complete'];
  }
}

if (typeof window !== 'undefined') {
  window.AshbyAdapter = AshbyAdapter;
}
