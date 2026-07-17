class GreenhouseAdapter extends JobSiteAdapter {
  constructor() {
    super();
    this.name = 'Greenhouse';
    this.domains = ['greenhouse.io'];
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
      '.logo-text'
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
      '.app-title',
      '.job-title',
      'h1[class*="title"]',
      '.header h1',
      '.posting-header h1'
    ];
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el && el.textContent.trim()) return el.textContent.trim();
    }
    const jsonld = Extractor.getJSONLD();
    if (jsonld && jsonld.title) return jsonld.title;
    return document.title.split(' - ')[0] || document.title;
  }

  extractLocation() {
    const selectors = [
      '.location',
      '[class*="location"]',
      '.posting-header .location',
      '.header .location'
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
    const match = pageText.match(
      /\$[\d,]+(?:\s*-\s*\$[\d,]+)?(?:\s*(?:per|a|an)\s*(?:hour|year|month|yr|hr))?/gi
    );
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
      '.job-description',
      '.content',
      '.posting-content',
      '.posting-description'
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
      'Docker', 'TypeScript', 'Node.js', 'Go', 'Ruby', 'Kubernetes', 'Git'];
    return skills.filter(s => desc.includes(s)).join(', ');
  }

  getSuccessIndicators() {
    return [
      'your application has been submitted',
      'application submitted',
      'thank you for your application',
      'we received your application',
      'successfully submitted'
    ];
  }

  getSuccessSelectors() {
    return [
      '.application-confirmation',
      '.success-message',
      '[class*="submitted"]',
      '[class*="confirmation"]'
    ];
  }

  getSuccessUrlPatterns() {
    return ['/application/confirmation', '/apply/complete'];
  }
}

if (typeof window !== 'undefined') {
  window.GreenhouseAdapter = GreenhouseAdapter;
}
