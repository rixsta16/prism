import { getState, subscribe, setPeriod } from '../store.js';
import * as fmt from '../format.js';
import * as metrics from '../metrics.js';
import { createChartRegistry, PALETTE, STATUS_COLOUR } from '../charts.js';
import { el, card, table, badge, chartBox, tabs, pageTitle, state as stateBlock } from '../ui.js';
import { PERIODS } from '../periods.js';
import { exportCsv } from '../csv.js';
import { getConfig } from '../app.js';

const TABS = [
  { key: 'revenue',  label: 'Revenue' },
  { key: 'orders',   label: 'Orders' },
  { key: 'clients',  label: 'Clients' },
  { key: 'pipeline', label: 'Pipeline' },
];

let active = 'revenue';
let unsub = null;
let charts = null;

function exportButton(name, columns, rows) {
  if (!getConfig().features.exportCsv) return null;
  return el('button', {
    class: 'btn btn-ghost', type: 'button',
    style: 'font-size:12px;padding:4px 10px',
    text: 'Export CSV',
    onClick: () => exportCsv(name, columns, rows),
  });
}

function revenueTab(s, root) {
  const weeks = metrics.revenueByWeek(s);
  const top = metrics.topClients(s, 8);
  const paid = metrics.withEffectiveStatus(s.records)
    .filter((r) => r.type === 'invoice' && r.status === 'complete' && metrics.inPeriod(r.date, s.period));

  const byType = ['invoice', 'order', 'quote'].map((t) => ({
    type: t,
    value: metrics.withEffectiveStatus(s.records)
      .filter((r) => r.type === t && metrics.inPeriod(r.date, s.period))
      .reduce((acc, r) => acc + r.value, 0),
  }));

  root.append(
    el('div', { class: 'grid-2' }, [
      card('Revenue trend — 12 weeks', chartBox('an-rev')),
      card('Value by record type', chartBox('an-type')),
    ]),
    card('Top clients by paid revenue',
      top.rows.length
        ? table([
            { label: 'Client', render: (r) => el('span', { class: 'font-semi', text: r.name }) },
            { label: 'Paid', align: 'right', render: (r) => el('span', { class: 'mono', text: fmt.money(r.value) }) },
            { label: 'Share', align: 'right', render: (r) => `${r.share.toFixed(1)}%` },
          ], top.rows)
        : stateBlock('empty', 'No paid revenue in this period', 'Widen the period filter.'),
      {
        flush: top.rows.length > 0,
        action: exportButton('top-clients', ['Client', 'Paid', 'Share %'],
          top.rows.map((r) => [r.name, (r.value / 100).toFixed(2), r.share.toFixed(1)])),
      }),
  );

  if (top.payingClients > 5 && top.topFiveShare > 60) {
    root.append(stateBlock('partial', 'Revenue concentration',
      `Your top five clients account for ${top.topFiveShare.toFixed(0)}% of paid revenue.`));
  }

  charts.line(document.getElementById('an-rev'), {
    labels: weeks.map((w) => w.label),
    data: weeks.map((w) => w.value / 100),
    valueFormat: (v) => fmt.moneyCompact(v * 100),
  });
  charts.doughnut(document.getElementById('an-type'), {
    labels: byType.map((b) => fmt.titleCase(b.type)),
    data: byType.map((b) => b.value / 100),
    colours: [PALETTE.gold, PALETTE.blue, PALETTE.muted],
    valueFormat: (v) => fmt.moneyCompact(v * 100),
  });

  return paid;
}

function ordersTab(s, root) {
  const byStatus = metrics.ordersByStatus(s);
  const weeks = metrics.revenueByWeek(s);
  const orders = metrics.withEffectiveStatus(s.records)
    .filter((r) => r.type === 'order' && metrics.inPeriod(r.date, s.period));

  const cycle = orders.filter((r) => r.dueDate).map((r) =>
    (new Date(r.dueDate) - new Date(r.date)) / 86400000);
  const avgCycle = cycle.length ? cycle.reduce((a, b) => a + b, 0) / cycle.length : 0;

  root.append(
    el('div', { class: 'grid-2' }, [
      card('Throughput per week', chartBox('an-thru')),
      card('Status mix', chartBox('an-mix')),
    ]),
    card('Orders', orders.length
      ? table([
          { label: 'ID', cellClass: 'mono text-muted', render: (r) => `#${r.id}` },
          { label: 'Client', render: (r) => metrics.clientName(s, r.clientId) },
          { label: 'Value', align: 'right', render: (r) => el('span', { class: 'mono', text: fmt.money(r.value) }) },
          { label: 'Date', cellClass: 'text-muted', render: (r) => fmt.date(r.date) },
          { label: 'Due', cellClass: 'text-muted', render: (r) => fmt.date(r.dueDate) },
          { label: 'Status', render: (r) => badge(r.status, fmt.titleCase(r.status)) },
        ], orders)
      : stateBlock('empty', 'No orders in this period', 'Widen the period filter.'),
      {
        flush: orders.length > 0,
        action: exportButton('orders', ['ID', 'Client', 'Value', 'Date', 'Due', 'Status'],
          orders.map((r) => [r.id, metrics.clientName(s, r.clientId), (r.value / 100).toFixed(2), r.date, r.dueDate ?? '', r.status])),
      }),
    el('div', { class: 'text-xs text-muted', style: 'padding:4px 2px',
      text: `Average quoted cycle time: ${avgCycle.toFixed(1)} days across ${cycle.length} order${cycle.length === 1 ? '' : 's'} with a due date.` }),
  );

  charts.line(document.getElementById('an-thru'), {
    labels: weeks.map((w) => w.label),
    data: weeks.map((w) => orders.filter((r) => r.date >= w.from && r.date <= w.to).length),
    valueFormat: fmt.count,
  });
  charts.bar(document.getElementById('an-mix'), {
    labels: byStatus.map((r) => fmt.titleCase(r.status)),
    data: byStatus.map((r) => r.count),
    colours: byStatus.map((r) => STATUS_COLOUR[r.status]),
    valueFormat: fmt.count,
  });
}

function clientsTab(s, root) {
  const top = metrics.topClients(s, 100);
  const rows = s.clients.map((c) => {
    const mine = metrics.withEffectiveStatus(s.records).filter((r) => r.clientId === c.id);
    const paid = mine.filter((r) => r.type === 'invoice' && r.status === 'complete');
    const last = mine.map((r) => r.date).sort().at(-1) ?? null;
    return {
      ...c,
      records: mine.length,
      paid: paid.reduce((t, r) => t + r.value, 0),
      last,
      dormantDays: last ? Math.floor((Date.now() - new Date(last)) / 86400000) : null,
    };
  }).sort((a, b) => b.paid - a.paid);

  const dormant = rows.filter((r) => r.dormantDays == null || r.dormantDays > 60);

  root.append(
    el('div', { class: 'grid-2' }, [
      card('Revenue concentration', chartBox('an-conc')),
      card('Dormancy', dormant.length
        ? table([
            { label: 'Client', render: (r) => r.name },
            { label: 'Last activity', cellClass: 'text-muted', render: (r) => fmt.date(r.last) },
            { label: 'Status', render: (r) => badge(r.status, fmt.titleCase(r.status)) },
          ], dormant)
        : stateBlock('empty', 'No dormant clients', 'Everyone has been active in the last 60 days.'),
        { flush: dormant.length > 0 }),
    ]),
    card('All clients', table([
      { label: 'Client', render: (r) => el('span', { class: 'font-semi', text: r.name }) },
      { label: 'Email', cellClass: 'text-muted', render: (r) => r.email ?? '—' },
      { label: 'Records', align: 'right', render: (r) => fmt.count(r.records) },
      { label: 'Paid', align: 'right', render: (r) => el('span', { class: 'mono', text: fmt.money(r.paid) }) },
      { label: 'Last activity', cellClass: 'text-muted', render: (r) => fmt.date(r.last) },
      { label: 'Status', render: (r) => badge(r.status, fmt.titleCase(r.status)) },
    ], rows), {
      flush: true,
      action: exportButton('clients', ['Client', 'Email', 'Records', 'Paid', 'Last activity', 'Status'],
        rows.map((r) => [r.name, r.email ?? '', r.records, (r.paid / 100).toFixed(2), r.last ?? '', r.status])),
    }),
  );

  charts.bar(document.getElementById('an-conc'), {
    labels: top.rows.slice(0, 8).map((r) => r.name),
    data: top.rows.slice(0, 8).map((r) => r.value / 100),
    colours: PALETTE.gold,
    horizontal: true,
    valueFormat: (v) => fmt.moneyCompact(v * 100),
  });
}

function pipelineTab(s, root) {
  const stages = ['lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost'];
  const rows = s.deals.map((d) => ({
    ...d,
    client: d.clientId ? metrics.clientName(s, d.clientId) : 'Unqualified lead',
    weighted: d.value * (d.probability / 100),
  }));

  root.append(
    el('div', { class: 'grid-2' }, [
      card('Value by stage', chartBox('an-stage')),
      card('Weighted forecast', chartBox('an-weighted')),
    ]),
    card('All deals', table([
      { label: 'Client', render: (r) => el('span', { class: 'font-semi', text: r.client }) },
      { label: 'Stage', render: (r) => badge(r.stage, fmt.titleCase(r.stage)) },
      { label: 'Value', align: 'right', render: (r) => el('span', { class: 'mono', text: fmt.money(r.value) }) },
      { label: 'Probability', align: 'right', render: (r) => `${r.probability}%` },
      { label: 'Weighted', align: 'right', render: (r) => el('span', { class: 'mono', text: fmt.money(r.weighted) }) },
      { label: 'Expected close', cellClass: 'text-muted', render: (r) => fmt.date(r.expectedClose) },
    ], rows), {
      flush: true,
      action: exportButton('deals', ['Client', 'Stage', 'Value', 'Probability', 'Weighted', 'Expected close'],
        rows.map((r) => [r.client, r.stage, (r.value / 100).toFixed(2), r.probability, (r.weighted / 100).toFixed(2), r.expectedClose ?? ''])),
    }),
  );

  charts.bar(document.getElementById('an-stage'), {
    labels: stages.map(fmt.titleCase),
    data: stages.map((st) => s.deals.filter((d) => d.stage === st).reduce((t, d) => t + d.value, 0) / 100),
    colours: stages.map((st) => (st === 'won' ? PALETTE.green : st === 'lost' ? PALETTE.red : PALETTE.gold)),
    valueFormat: (v) => fmt.moneyCompact(v * 100),
  });
  const open = rows.filter((r) => !['won', 'lost'].includes(r.stage));
  charts.doughnut(document.getElementById('an-weighted'), {
    labels: open.map((r) => r.client),
    data: open.map((r) => r.weighted / 100),
    colours: [PALETTE.gold, PALETTE.blue, PALETTE.green, PALETTE.amber, PALETTE.muted, PALETTE.red],
    valueFormat: (v) => fmt.moneyCompact(v * 100),
  });
}

function render(root) {
  const s = getState();
  root.innerHTML = '';
  charts?.destroyAll();
  charts = createChartRegistry();
  pageTitle('Analytics', `Deeper cuts — ${s.period.label}`);

  if (s.status === 'loading' || s.status === 'idle') {
    root.append(card('Loading', el('div', { class: 'skeleton skeleton-block', style: 'height:200px' })));
    return;
  }
  if (s.status === 'error') {
    root.append(stateBlock('error', 'Could not load your data', s.error));
    return;
  }
  if (s.status === 'empty') {
    root.append(stateBlock('empty', 'Nothing to analyse yet',
      'Connect a data source and this fills in.',
      el('a', { class: 'btn btn-primary', href: '#/data-sources', text: 'Connect a data source' })));
    return;
  }

  root.append(tabs(TABS, active, (key) => { active = key; render(root); }));
  root.append(el('div', { class: 'pills' }, PERIODS.map((p) =>
    el('button', {
      type: 'button', class: `pill${p.key === s.period.key ? ' active' : ''}`,
      'aria-pressed': String(p.key === s.period.key), text: p.label,
      onClick: () => setPeriod(p),
    }))));

  const panel = el('div', { role: 'tabpanel', 'aria-labelledby': `tab-${active}` });
  root.append(panel);

  if (active === 'revenue') revenueTab(s, panel);
  else if (active === 'orders') ordersTab(s, panel);
  else if (active === 'clients') clientsTab(s, panel);
  else pipelineTab(s, panel);
}

export default {
  mount(root) { render(root); unsub = subscribe(() => render(root)); },
  unmount() { unsub?.(); unsub = null; charts?.destroyAll(); charts = null; },
};
