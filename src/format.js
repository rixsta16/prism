// All formatting lives here so one number reads the same everywhere.
// Money is stored as integer minor units and only becomes a string at render.

let locale = 'en-GB';
let currency = 'GBP';

export function configure(loc) {
  locale = loc.locale ?? locale;
  currency = loc.currency ?? currency;
}

export function money(minor) {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format((minor ?? 0) / 100);
}

export function moneyCompact(minor) {
  const major = (minor ?? 0) / 100;
  if (Math.abs(major) >= 1000) {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(major);
  }
  return money(minor);
}

export function count(n) {
  return new Intl.NumberFormat(locale).format(n ?? 0);
}

export function date(iso) {
  if (!iso) return '—';
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit', month: 'short', year: 'numeric',
  }).format(new Date(iso + 'T00:00:00'));
}

export function shortDate(iso) {
  if (!iso) return '—';
  return new Intl.DateTimeFormat(locale, { day: '2-digit', month: 'short' })
    .format(new Date(iso + 'T00:00:00'));
}

// Returns { text, direction } — the caller picks the class, never the string.
export function delta(current, previous, { asMoney = false } = {}) {
  if (previous == null || previous === 0) {
    return { text: asMoney ? money(current) : count(current), direction: 'flat' };
  }
  const pct = ((current - previous) / Math.abs(previous)) * 100;
  const direction = pct > 0.5 ? 'up' : pct < -0.5 ? 'down' : 'flat';
  const arrow = direction === 'up' ? '↑' : direction === 'down' ? '↓' : '—';
  return { text: `${arrow} ${Math.abs(pct).toFixed(0)}%`, direction };
}

export function titleCase(s) {
  return String(s).replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
