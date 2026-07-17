class IndeedAdapter extends JobSiteAdapter {
  constructor() {
    super();
    this.name = 'Indeed';
    this.domains = ['indeed.com'];
    this.urlPatterns = ['/job/', '/jobs/', '/viewjob'];
  }

  detectJobPage() {
    const url = window.location.href.toLowerCase();
    return url.includes('/viewjob') || url.includes('/job/');
  }

  extractCompany() {
    const selectors = [
      '[data-testid="inlineHeader-companyName"]',
      '.jobsearch-JobInfoHeader-companyName',
      '[class*="companyName"]',
      '[class*="company-name"]',
      '.jobsearch-JobInfoHeader-subtitle a',
      '.companyInfo a',
      '[data-testid="companyName"]'
    ];
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el && el.textContent.trim()) return el.textContent.trim();
    }
    return Extractor.findInElement('a[href*="company"]') || '';
  }

  extractTitle() {
    const selectors = [
      '[data-testid="jobTitle"]',
      '.jobsearch-JobInfoHeader-title',
      'h1[class*="title"]',
      'h1[class*="jobTitle"]',
      'h1'
    ];
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el && el.textContent.trim()) return el.textContent.trim();
    }
    return document.title.replace(/\s*-\s*Indeed\s*$/i, '').trim();
  }

  extractLocation() {
    const selectors = [
      '[data-testid="inlineHeader-companyLocation"]',
      '.jobsearch-JobInfoHeader-subtitle div:not([class*="company"])',
      '[class*="location"]',
      '[data-testid="jobLocation"]'
    ];
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el && el.textContent.trim()) return el.textContent.trim();
    }
    return '';
  }

  extractSalary() {
    const selectors = [
      '[data-testid="salaryInfoTable"]',
      '#salaryInfoTable',
      '[class*="salary"]',
      '.icl-u-lg-mr--sm'
    ];
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el && el.textContent.trim()) return el.textContent.trim();
    }
    const pageText = document.body.innerText || '';
    const match = pageText.match(
      /\$[\d,]+(?:\s*-\s*\$[\d,]+)?(?:\s*(?:per|a|an)\s*(?:hour|year|month|week|day|yr|hr))?/gi
    );
    return match ? match[0] : '';
  }

  extractEmploymentType() {
    const selectors = [
      '[data-testid="jobDetails"]',
      '[class*="job-type"]',
      '[class*="employment"]'
    ];
    const types = ['Full-time', 'Part-time', 'Contract', 'Temporary', 'Internship', 'Freelance'];
    const pageText = document.body.innerText || '';
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
      '#jobDescriptionText',
      '[data-testid="jobDescriptionText"]',
      '.jobsearch-jobDescriptionText'
    ];
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el && el.textContent.trim()) return Extractor.cleanHtml(el.innerHTML);
    }
    return '';
  }

  extractSkills() {
    const desc = this.extractDescription();
    if (!desc) return '';
    const skills = ['JavaScript', 'Python', 'Java', 'React', 'SQL', 'AWS',
      'Docker', 'Kubernetes', 'TypeScript', 'Node.js', 'C++', 'PHP', 'Ruby'];
    return skills.filter(s => desc.includes(s)).join(', ');
  }

  extractPostingDate() {
    const selectors = [
      '[class*="posted-date"]',
      '[data-testid="jobPostingDate"]'
    ];
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el && el.textContent.trim()) return el.textContent.trim();
    }
    return '';
  }

  getSuccessIndicators() {
    return [
      'application submitted',
      'your application has been sent',
      'thank you for applying',
      'application received',
      'successfully applied'
    ];
  }

  getSuccessSelectors() {
    return [
      '[class*="application-success"]',
      '[class*="submitted"]',
      '[class*="success-message"]'
    ];
  }

  getSuccessUrlPatterns() {
    return ['/job/apply/success', '/jobs/apply/complete'];
  }
}

if (typeof window !== 'undefined') {
  window.IndeedAdapter = IndeedAdapter;
}
