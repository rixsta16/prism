// Derived metrics. Definitions are fixed in docs/DATA-MODEL.md — a view never
// invents one. `overdue` is derived here and must never arrive stored.

const OPEN_DEAL_STAGES = ['lead', 'qualified', 'proposal', 'negotiation'];

export function effectiveStatus(record, today = new Date()) {
  if (record.status === 'complete') return 'complete';
  if (record.dueDate && new Date(record.dueDate + 'T00:00:00') < today) return 'overdue';
  return record.status;
}

export function withEffectiveStatus(records, today = new Date()) {
  return records.map((r) => ({ ...r, status: effectiveStatus(r, today) }));
}

export function inPeriod(iso, period) {
  if (!period?.from && !period?.to) return true;
  if (!iso) return false;
  if (period.from && iso < period.from) return false;
  if (period.to && iso > period.to) return false;
  return true;
}

function sum(rows) {
  return rows.reduce((t, r) => t + (r.value ?? 0), 0);
}

function monthWindow(ref = new Date()) {
  const y = ref.getFullYear();
  const m = String(ref.getMonth() + 1).padStart(2, '0');
  return { from: `${y}-${m}-01`, to: ref.toISOString().slice(0, 10), day: ref.getDate() };
}

function prevMonthWindow(ref = new Date()) {
  const prev = new Date(ref.getFullYear(), ref.getMonth() - 1, 1);
  const y = prev.getFullYear();
  const m = String(prev.getMonth() + 1).padStart(2, '0');
  // Same day-count window, so a mid-month figure is not compared to a full month.
  const lastDay = new Date(prev.getFullYear(), prev.getMonth() + 1, 0).getDate();
  const day = String(Math.min(ref.getDate(), lastDay)).padStart(2, '0');
  return { from: `${y}-${m}-01`, to: `${y}-${m}-${day}` };
}

export function kpis(state, today = new Date()) {
  const records = withEffectiveStatus(state.records, today);
  const mtd = monthWindow(today);
  const prev = prevMonthWindow(today);

  const paidInvoices = records.filter((r) => r.type === 'invoice' && r.status === 'complete');
  const revenue = sum(paidInvoices.filter((r) => inPeriod(r.date, mtd)));
  const revenuePrev = sum(paidInvoices.filter((r) => inPeriod(r.date, prev)));

  const orders = records.filter((r) => r.type === 'order' && inPeriod(r.date, state.period));

  const outstandingRows = records.filter(
    (r) => r.type === 'invoice' && (r.status === 'awaiting' || r.status === 'overdue')
  );

  const openDeals = state.deals.filter((d) => OPEN_DEAL_STAGES.includes(d.stage));

  return {
    revenue:     { value: revenue, previous: revenuePrev, periodBound: true },
    orders:      { value: orders.length, previous: null, periodBound: true },
    clients:     { value: state.clients.filter((c) => c.status === 'active').length,
                   previous: null, periodBound: false },
    outstanding: { value: sum(outstandingRows), invoices: outstandingRows.length,
                   previous: null, periodBound: false },
    pipeline:    { value: openDeals.length,
                   weighted: openDeals.reduce((t, d) => t + d.value * (d.probability / 100), 0),
                   previous: null, periodBound: false },
  };
}

export function revenueByWeek(state, weeks = 12, today = new Date()) {
  const records = withEffectiveStatus(state.records, today)
    .filter((r) => r.type === 'invoice' && r.status === 'complete');

  const buckets = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const end = new Date(today);
    end.setDate(end.getDate() - i * 7);
    const start = new Date(end);
    start.setDate(start.getDate() - 6);
    buckets.push({
      label: `W${weeks - i}`,
      from: start.toISOString().slice(0, 10),
      to: end.toISOString().slice(0, 10),
      value: 0,
    });
  }
  for (const r of records) {
    const b = buckets.find((x) => r.date >= x.from && r.date <= x.to);
    if (b) b.value += r.value;
  }
  return buckets;
}

export const STATUS_ORDER = ['complete', 'in_progress', 'awaiting', 'overdue', 'draft'];

export function ordersByStatus(state, today = new Date()) {
  const records = withEffectiveStatus(state.records, today)
    .filter((r) => r.type === 'order' && inPeriod(r.date, state.period));
  return STATUS_ORDER.map((status) => ({
    status,
    count: records.filter((r) => r.status === status).length,
  }));
}

export function recentRecords(state, limit = 5, today = new Date()) {
  return withEffectiveStatus(state.records, today)
    .filter((r) => inPeriod(r.date, state.period))
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, limit);
}

export function clientName(state, id) {
  return state.clients.find((c) => c.id === id)?.name ?? 'Unknown';
}

export function topClients(state, limit = 5, today = new Date()) {
  const records = withEffectiveStatus(state.records, today)
    .filter((r) => r.type === 'invoice' && r.status === 'complete' && inPeriod(r.date, state.period));
  const totals = new Map();
  for (const r of records) totals.set(r.clientId, (totals.get(r.clientId) ?? 0) + r.value);
  const all = [...totals.entries()].sort((a, b) => b[1] - a[1]);
  const grand = all.reduce((t, [, v]) => t + v, 0);
  return {
    grand,
    payingClients: all.length,
    rows: all.slice(0, limit).map(([id, value]) => ({
      id,
      name: clientName(state, id),
      value,
      share: grand ? (value / grand) * 100 : 0,
    })),
    topFiveShare: grand
      ? (all.slice(0, 5).reduce((t, [, v]) => t + v, 0) / grand) * 100
      : 0,
  };
}
