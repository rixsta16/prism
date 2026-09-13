// Prism tenant configuration.
// Copy to prism.config.js and fill in. Contains NO secrets — everything here
// is served to the browser. See docs/DATA-MODEL.md for the full contract.

export default {
  tenant: {
    id:        'demo',
    firmName:  'Demo Client Ltd',
    userName:  'Jane Doe',
    userEmail: 'jane@democlient.co.uk',
  },
  locale: {
    currency:     'GBP',
    locale:       'en-GB',
    timezone:     'Europe/London',
    weekStartsOn: 1,
  },
  branding: {
    accent:      '#c9a84c',
    logoUrl:     null,
    productName: 'Prism',
  },
  dataSource: {
    adapter: 'mock',   // 'mock' | 'rest' | 'csv'
    baseUrl: null,
  },
  modules: ['crm-pipeline', 'production-story'],
  features: {
    aiDigest:  true,
    exportCsv: true,
  },
};
