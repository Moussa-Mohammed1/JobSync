class GlassdoorAdapter extends JobSiteAdapter {
  constructor() {
    super();
    this.name = 'Glassdoor';
    this.domains = ['glassdoor.com', 'glassdoor.co.uk'];
    this.urlPatterns = ['/job/', '/jobs/', '/partner/job'];
  }

  detectJobPage() {
    return window.location.href.toLowerCase().includes('/job-listing/') ||
           window.location.href.toLowerCase().includes('/job/');
  }

  extractCompany() {
    const selectors = [
      '[data-test="employerName"]',
      '.employer-name',
      '[class*="employer"]',
      '.css-1x1fupb',
      '.css-1qg7z3v'
    ];
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el && el.textContent.trim()) return el.textContent.trim();
    }
    return '';
  }

  extractTitle() {
    const selectors = [
      '[data-test="jobTitle"]',
      '.job-title',
      'h1[class*="title"]',
      '.css-1j1j7v1 h1'
    ];
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el && el.textContent.trim()) return el.textContent.trim();
    }
    return document.title.replace(/\s*-\s*Glassdoor\s*$/i, '').trim();
  }

  extractLocation() {
    const selectors = [
      '[data-test="location"]',
      '[class*="location"]',
      '.css-1v5m2bh'
    ];
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el && el.textContent.trim()) return el.textContent.trim();
    }
    return '';
  }

  extractSalary() {
    const selectors = [
      '[data-test="salaryRange"]',
      '[class*="salary"]',
      '.css-1vxh2cc'
    ];
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el && el.textContent.trim()) return el.textContent.trim();
    }
    const pageText = document.body.innerText || '';
    const match = pageText.match(/\$[\d,]+(?:\s*-\s*\$[\d,]+)?/);
    return match ? match[0] : '';
  }

  extractEmploymentType() {
    const pageText = document.body.innerText || '';
    const types = ['Full-time', 'Part-time', 'Contract', 'Temporary', 'Internship', 'Freelance'];
    for (const type of types) {
      if (pageText.includes(type)) return type;
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

  extractDescription() {
    const selectors = [
      '[data-test="jobDescription"]',
      '.job-description',
      '.css-1r4hrsk'
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
      'your application has been sent',
      'thank you for your application',
      'successfully applied',
      'application received'
    ];
  }

  getSuccessSelectors() {
    return [
      '[class*="success"]',
      '[class*="confirmation"]',
      '[class*="thank-you"]'
    ];
  }
}

if (typeof window !== 'undefined') {
  window.GlassdoorAdapter = GlassdoorAdapter;
}
