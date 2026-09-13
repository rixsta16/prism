// Per-viewer conveniences only. localStorage can throw or come back empty
// (private window, blocked site data), so every read and write is guarded.

const KEY = 'prism.prefs';

const DEFAULTS = {
  landing:  '#/overview',
  period:   'all',
  aiDigest: true,
  compact:  true,
};

let cache = null;

export function prefs() {
  if (cache) return cache;
  try {
    cache = { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) ?? '{}') };
  } catch {
    cache = { ...DEFAULTS };
  }
  return cache;
}

export function savePrefs(next) {
  cache = { ...prefs(), ...next };
  try {
    localStorage.setItem(KEY, JSON.stringify(cache));
  } catch {
    // Storage unavailable — preferences apply for this session only.
  }
  return cache;
}
