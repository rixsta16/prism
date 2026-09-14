// Loads and validates the tenant config. A missing required key is a hard
// failure with a readable message, never a silent `undefined` in the topbar.

const REQUIRED = [
  'tenant.id',
  'tenant.firmName',
  'locale.currency',
  'locale.locale',
  'dataSource.adapter',
];

const DEFAULTS = {
  locale:   { timezone: 'Europe/London', weekStartsOn: 1 },
  branding: { accent: '#c9a84c', logoUrl: null, productName: 'Prism' },
  modules:  [],
  features: { aiDigest: true, exportCsv: true },
};

function get(obj, path) {
  return path.split('.').reduce((o, k) => (o == null ? o : o[k]), obj);
}

export function validate(raw) {
  const missing = REQUIRED.filter((p) => get(raw, p) === undefined || get(raw, p) === '');
  if (missing.length) {
    throw new Error(
      `prism.config.js is missing required ${missing.length === 1 ? 'key' : 'keys'}: ` +
      missing.join(', ')
    );
  }
  return {
    ...raw,
    locale:   { ...DEFAULTS.locale, ...raw.locale },
    branding: { ...DEFAULTS.branding, ...raw.branding },
    features: { ...DEFAULTS.features, ...raw.features },
    modules:  raw.modules ?? DEFAULTS.modules,
  };
}

export async function loadConfig() {
  const mod = await import('../prism.config.js');
  return validate(mod.default);
}
