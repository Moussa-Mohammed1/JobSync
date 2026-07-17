class JobSiteAdapter {
  constructor() {
    this.name = '';
    this.domains = [];
    this.urlPatterns = [];
  }

  matches(url) {
    if (!url) return false;
    const lower = url.toLowerCase();
    return this.domains.some(domain => lower.includes(domain)) ||
           this.urlPatterns.some(pattern => lower.includes(pattern));
  }

  detectJobPage() {
    return false;
  }

  extractJob() {
    return null;
  }

  extractCompany() {
    return '';
  }

  extractTitle() {
    return '';
  }

  extractLocation() {
    return '';
  }

  extractSalary() {
    return '';
  }

  extractEmploymentType() {
    return '';
  }

  extractRemoteType() {
    return '';
  }

  extractDescription() {
    return '';
  }

  extractSkills() {
    return '';
  }

  extractExperienceRequired() {
    return '';
  }

  extractPostingDate() {
    return '';
  }

  extractCompanyWebsite() {
    return '';
  }

  extractCompanyLogo() {
    return '';
  }

  extractRecruiterName() {
    return '';
  }

  extractRecruiterEmail() {
    return '';
  }

  extractJobUrl() {
    return window.location.href;
  }

  extractAll() {
    return {
      company: this.extractCompany(),
      title: this.extractTitle(),
      location: this.extractLocation(),
      salary: this.extractSalary(),
      employmentType: this.extractEmploymentType(),
      remoteType: this.extractRemoteType(),
      description: this.extractDescription(),
      skills: this.extractSkills(),
      experienceRequired: this.extractExperienceRequired(),
      postingDate: this.extractPostingDate(),
      companyWebsite: this.extractCompanyWebsite(),
      companyLogo: this.extractCompanyLogo(),
      recruiterName: this.extractRecruiterName(),
      recruiterEmail: this.extractRecruiterEmail(),
      jobUrl: this.extractJobUrl(),
      applicationDate: Extractor.formatDate(new Date()),
      website: window.location.hostname
    };
  }

  getSuccessIndicators() {
    return [];
  }

  getSuccessSelectors() {
    return [];
  }

  getSuccessUrlPatterns() {
    return [];
  }
}

if (typeof window !== 'undefined') {
  window.JobSiteAdapter = JobSiteAdapter;
}
