const Extractor = {
  getMetaContent(name) {
    const el = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`);
    return el ? el.getAttribute('content') || '' : '';
  },

  getJSONLD() {
    try {
      const scripts = document.querySelectorAll('script[type="application/ld+json"]');
      for (const script of scripts) {
        try {
          const data = JSON.parse(script.textContent);
          if (data && data['@type'] === 'JobPosting') return data;
        } catch (e) {}
      }
    } catch (e) {}
    return null;
  },

  getOpenGraph() {
    const data = {};
    const metas = document.querySelectorAll('meta[property^="og:"], meta[name^="og:"]');
    metas.forEach(m => {
      const prop = m.getAttribute('property') || m.getAttribute('name') || '';
      data[prop.replace('og:', '')] = m.getAttribute('content') || '';
    });
    return data;
  },

  extractFromJSONLD() {
    const job = this.getJSONLD();
    if (!job) return null;

    return {
      title: job.title || '',
      company: job.hiringOrganization?.name || job.hiringOrganization?.legalName || '',
      location: job.jobLocation?.address?.addressLocality || job.jobLocation?.address?.streetAddress || '',
      description: job.description || '',
      salary: this._formatSalary(job.estimatedSalary || job.salary || job.baseSalary || null),
      employmentType: job.employmentType || job.employmentType?.join(', ') || '',
      datePosted: job.datePosted || '',
      companyWebsite: job.hiringOrganization?.sameAs || job.hiringOrganization?.url || '',
      companyLogo: job.hiringOrganization?.logo || '',
      skills: job.skills || job.skills?.join(', ') || ''
    };
  },

  extractFromMeta() {
    return {
      title: this.getMetaContent('og:title') || document.title || '',
      description: this.getMetaContent('og:description') || this.getMetaContent('description') || '',
      url: this.getMetaContent('og:url') || window.location.href,
      siteName: this.getMetaContent('og:site_name') || ''
    };
  },

  extractFromPage() {
    return {
      url: window.location.href,
      title: document.title,
      text: document.body.innerText || ''
    };
  },

  cleanHtml(html) {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, ' ').replace(/&[^;]+;/g, ' ').replace(/\s+/g, ' ').trim();
  },

  _formatSalary(salary) {
    if (!salary) return '';
    try {
      if (typeof salary === 'object') {
        const min = salary.minValue || salary.value?.minValue || '';
        const max = salary.maxValue || salary.value?.maxValue || '';
        const currency = salary.currency || '';
        const unitText = salary.unitText || '';
        return `${currency} ${min} - ${max} ${unitText}`.trim();
      }
      return String(salary);
    } catch (e) {
      return String(salary);
    }
  },

  findInPageText(patterns, text) {
    if (!text) return '';
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) return match[1] || match[0];
    }
    return '';
  },

  findInElement(selector, attribute = 'textContent') {
    const el = document.querySelector(selector);
    if (!el) return '';
    if (attribute === 'textContent') return el.textContent?.trim() || '';
    if (attribute === 'href') return el.href || '';
    if (attribute === 'src') return el.src || '';
    return el.getAttribute(attribute) || '';
  },

  findInElements(selector, attribute = 'textContent') {
    const els = document.querySelectorAll(selector);
    const results = [];
    els.forEach(el => {
      if (attribute === 'textContent') results.push(el.textContent?.trim() || '');
      else if (attribute === 'href') results.push(el.href || '');
      else if (attribute === 'src') results.push(el.src || '');
      else results.push(el.getAttribute(attribute) || '');
    });
    return results.filter(r => r).join(', ');
  },

  formatDate(date) {
    if (!date) return new Date().toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
    try {
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric'
      });
    } catch (e) {
      return String(date);
    }
  }
};

if (typeof window !== 'undefined') {
  window.Extractor = Extractor;
}
