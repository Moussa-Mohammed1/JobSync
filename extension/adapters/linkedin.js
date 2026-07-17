class LinkedInAdapter extends JobSiteAdapter {
  constructor() {
    super();
    this.name = 'LinkedIn';
    this.domains = ['linkedin.com'];
    this.urlPatterns = ['/jobs/', '/jobs/view/'];
  }

  detectJobPage() {
    const url = window.location.href.toLowerCase();
    return url.includes('/jobs/') || url.includes('/jobs/view/');
  }

  extractCompany() {
    const selectors = [
      '.job-details-jobs-unified-top-card__company-name',
      '.jobs-unified-top-card__company-name',
      '.jobs-details__main-content .job-details-jobs-unified-top-card__company-name a',
      '.job-details-jobs-unified-top-card__company-name a',
      '[class*="company-name"]',
      '[class*="companyName"]',
      '.job-view-layout a[data-tracking-control-name*="company"]',
      '.jobs-company__name',
      '.jobs-details__header-badge a'
    ];
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el && el.textContent.trim()) return el.textContent.trim();
    }

    const jsonld = Extractor.getJSONLD();
    if (jsonld && jsonld.hiringOrganization?.name) return jsonld.hiringOrganization.name;

    return '';
  }

  extractTitle() {
    const selectors = [
      '.job-details-jobs-unified-top-card__job-title',
      '.jobs-unified-top-card__job-title',
      '.jobs-details__main-content h1',
      '.job-details-jobs-unified-top-card__job-title h1',
      '[class*="job-title"] h1',
      'h1[class*="title"]',
      '.jobs-details__header-badge h1'
    ];
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el && el.textContent.trim()) return el.textContent.trim();
    }

    const jsonld = Extractor.getJSONLD();
    if (jsonld && jsonld.title) return jsonld.title;

    return document.title.replace(' - LinkedIn', '').trim();
  }

  extractLocation() {
    const selectors = [
      '.job-details-jobs-unified-top-card__bullet',
      '.jobs-unified-top-card__bullet',
      '.job-details-jobs-unified-top-card__primary-description',
      '.jobs-unified-top-card__primary-description',
      '[class*="location"]',
      '.jobs-details__main-content [class*="location"]'
    ];
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el && el.textContent.trim()) return el.textContent.trim();
    }

    const jsonld = Extractor.getJSONLD();
    if (jsonld && jsonld.jobLocation?.address?.addressLocality) {
      const loc = jsonld.jobLocation.address;
      return [loc.addressLocality, loc.addressRegion, loc.addressCountry]
        .filter(Boolean).join(', ');
    }

    return '';
  }

  extractSalary() {
    const selectors = [
      '.job-details-jobs-unified-top-card__salary-info',
      '.jobs-unified-top-card__salary-info',
      '.job-details-jobs-unified-top-card__description-container li:contains("salary")',
      '[class*="salary"]'
    ];
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el && el.textContent.trim()) return el.textContent.trim();
    }

    const jsonld = Extractor.getJSONLD();
    if (jsonld) {
      const salary = jsonld.estimatedSalary || jsonld.baseSalary;
      if (salary) return Extractor._formatSalary(salary);
    }

    const pageText = document.body.innerText || '';
    const salaryMatch = pageText.match(
      /\$[\d,]+(?:\s*-\s*\$[\d,]+)?(?:\s*(?:per|a|an)\s*(?:hour|year|month|week|day|yr|hr|annually))?/gi
    );
    return salaryMatch ? salaryMatch[0] : '';
  }

  extractEmploymentType() {
    const selectors = [
      '.job-details-jobs-unified-top-card__workplace-type',
      '[class*="employment-type"]',
      '[class*="job-type"]'
    ];
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el && el.textContent.trim()) return el.textContent.trim();
    }

    const jsonld = Extractor.getJSONLD();
    if (jsonld && jsonld.employmentType) {
      return Array.isArray(jsonld.employmentType) ? jsonld.employmentType.join(', ') : jsonld.employmentType;
    }

    const pageText = document.body.innerText || '';
    const types = ['Full-time', 'Part-time', 'Contract', 'Temporary', 'Internship', 'Freelance'];
    for (const type of types) {
      if (pageText.includes(type)) return type;
    }

    return '';
  }

  extractRemoteType() {
    const selectors = [
      '.job-details-jobs-unified-top-card__workplace-type',
      '.jobs-unified-top-card__workplace-type',
      '[class*="workplace"]',
      '[class*="remote"]',
      '[class*="onsite"]',
      '[class*="hybrid"]'
    ];
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el && el.textContent.trim()) return el.textContent.trim();
    }

    const pageText = document.body.innerText || '';
    if (pageText.includes('Remote')) return 'Remote';
    if (pageText.includes('Hybrid')) return 'Hybrid';
    if (pageText.includes('On-site') || pageText.includes('Onsite')) return 'On-site';

    return '';
  }

  extractDescription() {
    const selectors = [
      '.job-details-jobs-unified-top-card__description-container',
      '.jobs-description-content__text',
      '.jobs-box__html-content',
      '.jobs-details__main-content [class*="description"]',
      '.show-more-less-html__markup'
    ];
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el && el.textContent.trim()) return Extractor.cleanHtml(el.innerHTML);
    }

    return '';
  }

  extractSkills() {
    const selectors = [
      '.job-details-jobs-unified-top-card__skills-container',
      '[class*="skill"]',
      '.jobs-details__main-content [class*="skill"]'
    ];
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el && el.textContent.trim()) return el.textContent.trim();
    }

    const description = this.extractDescription();
    if (description) {
      const skillKeywords = [
        'JavaScript', 'Python', 'Java', 'React', 'Node.js', 'TypeScript',
        'SQL', 'AWS', 'Docker', 'Kubernetes', 'Agile', 'Scrum', 'Git',
        'CSS', 'HTML', 'REST', 'API', 'Machine Learning', 'Data Science',
        'C++', 'Go', 'Ruby', 'PHP', 'Angular', 'Vue', 'MongoDB', 'PostgreSQL'
      ];
      return skillKeywords.filter(s => description.includes(s)).join(', ');
    }

    return '';
  }

  extractExperienceRequired() {
    const pageText = document.body.innerText || '';
    const patterns = [
      /(\d+)[+]?\s*(?:years?|yrs?)(?:\s+of)?\s+experience/i,
      /experience\s*(?:level)?\s*:\s*(?:entry|mid|senior|junior|lead|principal|staff)/i,
      /(?:entry|mid|senior|junior|lead|principal|staff)\s*(?:level)?/i
    ];
    for (const pattern of patterns) {
      const match = pageText.match(pattern);
      if (match) return match[0];
    }
    return '';
  }

  extractPostingDate() {
    const selectors = [
      '.job-details-jobs-unified-top-card__posted-date',
      '.jobs-unified-top-card__posted-date',
      '[class*="posted"]',
      '[class*="date"]'
    ];
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el && el.textContent.trim()) return el.textContent.trim();
    }

    const jsonld = Extractor.getJSONLD();
    if (jsonld && jsonld.datePosted) return Extractor.formatDate(jsonld.datePosted);

    return '';
  }

  extractCompanyWebsite() {
    const jsonld = Extractor.getJSONLD();
    if (jsonld && jsonld.hiringOrganization?.sameAs) return jsonld.hiringOrganization.sameAs;

    const selectors = [
      'a[data-tracking-control-name*="company"]',
      '.jobs-company__website a',
      'a[href*="linkedin.com/company"]'
    ];
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el && el.href) return el.href;
    }
    return '';
  }

  extractCompanyLogo() {
    const selectors = [
      '.jobs-company__logo img',
      '.job-details-jobs-unified-top-card__company-logo img',
      'img[class*="company-logo"]',
      'img[class*="logo"]'
    ];
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el && el.src) return el.src;
    }
    return '';
  }

  getSuccessIndicators() {
    return [
      'application sent',
      'your application has been submitted',
      'application submitted',
      'thank you for applying',
      'we received your application',
      'successfully applied',
      'your application was successfully submitted'
    ];
  }

  getSuccessSelectors() {
    return [
      '[class*="application-success"]',
      '[class*="submission-success"]',
      '[class*="apply-success"]',
      '[data-test-applied]',
      '[class*="thank-you"]',
      'article:has(h2)',
      '.artdeco-modal:has(h2)'
    ];
  }

  getSuccessUrlPatterns() {
    return ['/jobs/apply/success/'];
  }
}

if (typeof window !== 'undefined') {
  window.LinkedInAdapter = LinkedInAdapter;
}
