const AdapterRegistry = {
  _adapters: [],

  register(adapter) {
    this._adapters.push(adapter);
  },

  getAdapterForCurrentPage() {
    const url = window.location.href;
    for (const adapter of this._adapters) {
      if (adapter.matches(url) && adapter.detectJobPage()) {
        return adapter;
      }
    }
    return null;
  },

  getAdapterByName(name) {
    return this._adapters.find(a => a.name === name) || null;
  },

  getAllAdapters() {
    return [...this._adapters];
  },

  detectCurrentWebsite() {
    const url = window.location.href.toLowerCase();
    for (const adapter of this._adapters) {
      if (adapter.matches(url)) {
        return adapter.name;
      }
    }
    return 'Unknown';
  }
};

(function registerAdapters() {
  const adapters = [];

  if (typeof LinkedInAdapter !== 'undefined') adapters.push(new LinkedInAdapter());
  if (typeof IndeedAdapter !== 'undefined') adapters.push(new IndeedAdapter());
  if (typeof GlassdoorAdapter !== 'undefined') adapters.push(new GlassdoorAdapter());
  if (typeof GreenhouseAdapter !== 'undefined') adapters.push(new GreenhouseAdapter());
  if (typeof LeverAdapter !== 'undefined') adapters.push(new LeverAdapter());
  if (typeof WorkdayAdapter !== 'undefined') adapters.push(new WorkdayAdapter());
  if (typeof AshbyAdapter !== 'undefined') adapters.push(new AshbyAdapter());
  if (typeof SmartRecruitersAdapter !== 'undefined') adapters.push(new SmartRecruitersAdapter());
  if (typeof WTTJAdapter !== 'undefined') adapters.push(new WTTJAdapter());
  if (typeof BambooHRAdapter !== 'undefined') adapters.push(new BambooHRAdapter());

  adapters.forEach(a => AdapterRegistry.register(a));
})();

if (typeof window !== 'undefined') {
  window.AdapterRegistry = AdapterRegistry;
}
