class WTTJAdapter extends JobSiteAdapter {
  constructor() {
    super();
    this.name = 'WelcomeToTheJungle';
    this.domains = ['welcomehunt.com', 'welcometothejungle.com'];
    this.urlPatterns = ['/jobs/', '/apply/', '/offre/'];
  }

  detectJobPage() {
    const url = window.location.href.toLowerCase();
    return url.includes('/jobs/') || url.includes('/offre/');
  }

  extractCompany() {
    const selectors = [
      '[class*="company"] h2',
      '[class*="companyName"]',
      '.company-header-name',
      '[class*="organization"]'
    ];
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el && el.textContent.trim()) return el.textContent.trim();
    }
    return '';
  }

  extractTitle() {
    const selectors = [
      'h1',
      '[class*="job-title"] h1',
      '[class*="title"] h1'
    ];
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el && el.textContent.trim()) return el.textContent.trim();
    }
    return document.title;
  }

  extractLocation() {
    const selectors = [
      '[class*="location"]',
      '[class*="place"]'
    ];
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el && el.textContent.trim()) return el.textContent.trim();
    }
    return '';
  }

  extractSalary() {
    const pageText = document.body.innerText || '';
    const match = pageText.match(/\$?[\d,]+(?:\s*[-àà]\s*\$?[\d,]+)?(?:\s*(?:per|a|an|par|an)\s*(?:hour|year|month|week|day|yr|hr|an|mois))?/i);
    return match ? match[0] : '';
  }

  extractDescription() {
    const selectors = [
      '[class*="description"]',
      '[class*="content"]',
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
    if (pageText.includes('Remote') || pageText.includes('Télétravail') || pageText.includes('À distance')) return 'Remote';
    if (pageText.includes('Hybrid') || pageText.includes('Hybride')) return 'Hybrid';
    if (pageText.includes('On-site') || pageText.includes('Sur site') || pageText.includes('Présentiel')) return 'On-site';
    return '';
  }

  getSuccessIndicators() {
    return [
      'application submitted',
      'your application has been sent',
      'thank you for applying',
      'candidature envoyée',
      'merci pour votre candidature',
      'successfully applied'
    ];
  }

  getSuccessSelectors() {
    return [
      '[class*="success"]',
      '[class*="confirmation"]',
      '[class*="thank"]'
    ];
  }
}

if (typeof window !== 'undefined') {
  window.WTTJAdapter = WTTJAdapter;
}
