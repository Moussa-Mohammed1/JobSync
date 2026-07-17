class BambooHRAdapter extends JobSiteAdapter {
  constructor() {
    super();
    this.name = 'BambooHR';
    this.domains = ['bamboohr.com', 'bamboohr.co.uk'];
    this.urlPatterns = ['/jobs/', '/careers/', '/apply/'];
  }

  detectJobPage() {
    const url = window.location.href.toLowerCase();
    return url.includes('/jobs/') || url.includes('/careers/');
  }

  extractCompany() {
    const selectors = [
      '.BambooHR-ATS-careers-header-title',
      '[class*="company"] h1',
      '[class*="company"] h2',
      '.header-title',
      'h1'
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
      '.BambooHR-ATS-Jobs-ListItem-title',
      '.BambooHR-ATS-Jobs-Item-title',
      'h1[class*="title"]',
      '.job-title h1',
      'h1'
    ];
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el && el.textContent.trim()) return el.textContent.trim();
    }
    return document.title;
  }

  extractLocation() {
    const selectors = [
      '.BambooHR-ATS-Jobs-ListItem-location',
      '.BambooHR-ATS-Jobs-Item-location',
      '[class*="location"]'
    ];
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el && el.textContent.trim()) return el.textContent.trim();
    }
    return '';
  }

  extractSalary() {
    const pageText = document.body.innerText || '';
    const match = pageText.match(/\$[\d,]+(?:\s*-\s*\$[\d,]+)?(?:\s*(?:per|a|an)\s*(?:hour|year|month|yr|hr))?/gi);
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
    if (pageText.includes('On-site')) return 'On-site';
    return '';
  }

  extractDescription() {
    const selectors = [
      '.BambooHR-ATS-Jobs-Item-description',
      '.job-description',
      '[class*="description"]',
      'main'
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
      'your application has been submitted',
      'thank you for your application',
      'successfully applied',
      'application received'
    ];
  }

  getSuccessSelectors() {
    return [
      '[class*="success"]',
      '[class*="confirmation"]',
      '[class*="submitted"]'
    ];
  }
}

if (typeof window !== 'undefined') {
  window.BambooHRAdapter = BambooHRAdapter;
}
