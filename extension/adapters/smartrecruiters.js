class SmartRecruitersAdapter extends JobSiteAdapter {
  constructor() {
    super();
    this.name = 'SmartRecruiters';
    this.domains = ['smartrecruiters.com'];
    this.urlPatterns = ['/jobs/', '/apply/'];
  }

  detectJobPage() {
    return window.location.href.toLowerCase().includes('/jobs/');
  }

  extractCompany() {
    const selectors = [
      '.company-name',
      '[class*="company"] h2',
      '.Header-companyName',
      '.header-company-name'
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
      '.job-title h1',
      '.header h1',
      'h1'
    ];
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el && el.textContent.trim()) return el.textContent.trim();
    }
    return document.title.split(' | ')[0] || document.title;
  }

  extractLocation() {
    const selectors = [
      '.location',
      '[class*="location"]',
      '[class*="Location"]'
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
      '.compensation'
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
    if (pageText.includes('On-site')) return 'On-site';
    return '';
  }

  getSuccessIndicators() {
    return [
      'application submitted',
      'your application has been submitted',
      'thank you for your application',
      'successfully applied',
      'application received'
    ];
  }

  getSuccessSelectors() {
    return [
      '.application-success',
      '.confirmation',
      '[class*="submitted"]',
      '[class*="success"]'
    ];
  }
}

if (typeof window !== 'undefined') {
  window.SmartRecruitersAdapter = SmartRecruitersAdapter;
}
