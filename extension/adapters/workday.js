class WorkdayAdapter extends JobSiteAdapter {
  constructor() {
    super();
    this.name = 'Workday';
    this.domains = ['myworkdayjobs.com', 'workday.com', 'myworkday.com', 'wd1.myworkdayjobs.com', 'wd5.myworkdayjobs.com'];
    this.urlPatterns = ['/job/', '/jobs/', '/apply/', '/requisition'];
  }

  detectJobPage() {
    const url = window.location.href.toLowerCase();
    return url.includes('/job/') || url.includes('/requisition');
  }

  extractCompany() {
    const selectors = [
      '[data-automation-id="companyName"]',
      '[class*="company"]',
      '.css-16woy1n',
      '.HeaderCompanyHeaderText',
      '[data-automation-label*="Company"]'
    ];
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el && el.textContent.trim()) return el.textContent.trim();
    }

    const url = window.location.href;
    const match = url.match(/(?:https?:\/\/)?([^.]+)\.myworkdayjobs/i);
    if (match) return match[1].charAt(0).toUpperCase() + match[1].slice(1);

    const pageText = document.body.innerText || '';
    const line = pageText.split('\n').find(l => l.includes('Careers') && l.length < 50);
    return line ? line.replace(/Careers.*/i, '').trim() : '';
  }

  extractTitle() {
    const selectors = [
      '[data-automation-id="jobTitle"]',
      'h1[class*="title"]',
      '[class*="jobTitle"]',
      '.css-1q2dra3 h1',
      '[data-automation-label*="Job Title"]'
    ];
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el && el.textContent.trim()) return el.textContent.trim();
    }
    return document.title.split(' - ')[0] || document.title;
  }

  extractLocation() {
    const selectors = [
      '[data-automation-id="location"]',
      '[class*="location"]',
      '[data-automation-label*="Location"]'
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
      '[data-automation-id*="salary"]'
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
    const types = ['Full-time', 'Part-time', 'Contract', 'Temporary', 'Internship', 'Freelance', 'Regular'];
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
      '[data-automation-id="jobDescription"]',
      '[class*="description"]',
      '.css-1t5l0o'
    ];
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el && el.textContent.trim()) return Extractor.cleanHtml(el.innerHTML);
    }
    return '';
  }

  extractPostingDate() {
    const selectors = [
      '[data-automation-id="postedDate"]',
      '[class*="posted"]',
      '[data-automation-label*="Posted"]'
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
      'your application has been submitted',
      'thank you for your application',
      'successfully submitted',
      'application received'
    ];
  }

  getSuccessSelectors() {
    return [
      '[data-automation-id="applicationConfirmation"]',
      '[class*="success"]',
      '[class*="confirmation"]',
      'div[class*="submitted"]'
    ];
  }

  getSuccessUrlPatterns() {
    return ['/apply/confirmation', '/application/complete'];
  }
}

if (typeof window !== 'undefined') {
  window.WorkdayAdapter = WorkdayAdapter;
}
