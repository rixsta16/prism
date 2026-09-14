// One period window applied to every date-bounded metric and both charts.

function iso(d) { return d.toISOString().slice(0, 10); }

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return iso(d);
}

export const PERIODS = [
  { key: 'all',     label: 'All',          from: null,        to: null },
  { key: 'week',    label: 'This Week',    from: daysAgo(7),  to: iso(new Date()) },
  { key: 'month',   label: 'This Month',   from: daysAgo(30), to: iso(new Date()) },
  { key: 'quarter', label: 'Last Quarter', from: daysAgo(90), to: iso(new Date()) },
];

export const DEFAULT_PERIOD = PERIODS[0];
