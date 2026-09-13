import { getState, subscribe, setPeriod } from '../store.js';
import * as fmt from '../format.js';
import * as metrics from '../metrics.js';
import { createChartRegistry, STATUS_COLOUR } from '../charts.js';
import { el, card, state as stateBlock, table, badge, chartBox, pageTitle, skeletonLines } from '../ui.js';
import { PERIODS } from '../periods.js';
import { getConfig } from '../app.js';
import { renderSlot } from '../modules/registry.js';

let unsub = null;
let charts = null;
let selectedMetric = 'revenue';

const STAT_DEFS = [
  { key: 'revenue',     label: 'Revenue (MTD)' },
  { key: 'orders',      label: 'Orders' },
  { key: 'clients',     label: 'Clients' },
  { key: 'outstanding', label: 'Outstanding' },
  { key: 'pipeline',    label: 'Pipeline' },
];

function statCard(key, label, k, onSelect) {
  const isMoney = key === 'revenue' || key === 'outstanding';
  const value = isMoney ? fmt.money(k.value) : fmt.count(k.value);

  let change, changeClass = '';
  if (k.previous != null) {
    const d = fmt.delta(k.value, k.previous);
    change = `${d.text} vs last month`;
    changeClass = d.direction === 'up' ? 'up' : d.direction === 'down' ? 'down' : '';
  } else if (key === 'outstanding') {
    change = `${fmt.count(k.invoices)} invoice${k.invoices === 1 ? '' : 's'}`;
  } else if (key === 'pipeline') {
    change = `${fmt.moneyCompact(k.weighted)} weighted`;
  } else if (key === 'clients') {
    change = 'active';
  } else {
    change = 'this period';
  }

  return el('button', {
    type: 'button',
    class: `stat${key === selectedMetric ? ' active' : ''}`,
    'aria-pressed': String(key === selectedMetric),
    onClick: () => onSelect(key),
  }, [
    el('div', {}, [
      el('div', { class: 'stat-label', text: label }),
      el('div', {
        class: `stat-value${key === 'outstanding' ? ' red' : ''}`,
        text: value,
      }),
      el('div', {
        class: `stat-change ${changeClass}`,
        style: changeClass ? null : 'color:var(--text-dim)',
        text: change,
      }),
      k.periodBound ? null : el('span', { class: 'visually-hidden', text: 'Point-in-time figure; not affected by the period filter.' }),
    ]),
  ]);
}

function periodPills(active, onSelect) {
  return el('div', { class: 'pills', role: 'tablist', 'aria-label': 'Period filter' },
    PERIODS.map((p) => el('button', {
      type: 'button',
      role: 'tab',
      class: `pill${p.key === active ? ' active' : ''}`,
      'aria-selected': String(p.key === active),
      text: p.label,
      onClick: () => onSelect(p),
    }))
  );
}

function digest(s) {
  const k = metrics.kpis(s);
  const overdue = metrics.withEffectiveStatus(s.records).filter((r) => r.status === 'overdue');
  const lines = [];
  if (k.revenue.previous) {
    const d = fmt.delta(k.revenue.value, k.revenue.previous);
    lines.push(`Revenue is ${fmt.money(k.revenue.value)} month to date, ${d.text} on the same window last month.`);
  }
  if (overdue.length) {
    lines.push(`${overdue.length} record${overdue.length === 1 ? ' is' : 's are'} overdue, worth ${fmt.money(overdue.reduce((t, r) => t + r.value, 0))}.`);
  }
  const top = metrics.topClients(s);
  if (top.payingClients > 5 && top.topFiveShare > 60) {
    lines.push(`Your top five clients account for ${top.topFiveShare.toFixed(0)}% of paid revenue — concentration worth watching.`);
  }
  return lines.join(' ') || 'Not enough data yet to summarise this period.';
}

function render(root) {
  const s = getState();
  const cfg = getConfig();
  root.innerHTML = '';
  charts?.destroyAll();
  charts = createChartRegistry();

  pageTitle('Overview', `${cfg.tenant.firmName} — ${s.period.label}`);

  if (s.status === 'loading' || s.status === 'idle') {
    root.append(
      card('Loading', skeletonLines(3)),
      el('div', { class: 'grid-2' }, [
        card('Revenue trend', el('div', { class: 'skeleton skeleton-block', style: 'height:200px' })),
        card('Orders by status', el('div', { class: 'skeleton skeleton-block', style: 'height:200px' })),
      ]),
    );
    return;
  }

  if (s.status === 'error') {
    root.append(stateBlock('error', 'Could not load your data', s.error,
      el('button', { class: 'btn btn-primary', type: 'button', text: 'Retry', onClick: () => window.dispatchEvent(new Event('prism:reload')) })));
    return;
  }

  if (s.status === 'empty') {
    root.append(stateBlock('empty', 'No data connected yet',
      'Prism has nothing to show until a data source is connected.',
      el('a', { class: 'btn btn-primary', href: '#/data-sources', text: 'Connect a data source' })));
    return;
  }

  if (s.warning) {
    root.append(stateBlock('partial', 'Some data is missing', s.warning));
  }

  // AI digest
  if (cfg.features.aiDigest) {
    root.append(el('div', { class: 'ai-bar' }, [
      el('div', { class: 'ai-bar-icon', 'aria-hidden': 'true', text: '✦' }),
      el('div', {}, [
        el('div', { class: 'ai-bar-label', text: 'Prism AI · Weekly Digest' }),
        el('div', { class: 'ai-bar-text', text: digest(s) }),
      ]),
    ]));
  }

  renderSlot(root, 'overview:after-ai-bar', s);

  // Stat bar
  const k = metrics.kpis(s);
  const onSelectMetric = (key) => { selectedMetric = key; render(root); };
  root.append(el('div', { class: 'stat-bar' },
    STAT_DEFS.map((d) => statCard(d.key, d.label, k[d.key], onSelectMetric))));

  renderSlot(root, 'overview:after-stats', s);

  root.append(periodPills(s.period.key, (p) => setPeriod(p)));

  // Charts — the left chart follows the selected stat.
  const left = document.createElement('div');
  const leftTitle = selectedMetric === 'orders' ? 'Orders per week'
    : selectedMetric === 'pipeline' ? 'Pipeline by stage'
    : 'Revenue trend — 12 weeks';

  const grid = el('div', { class: 'grid-2' }, [
    card(leftTitle, chartBox('chart-left')),
    card('Orders by status', chartBox('chart-right')),
  ]);
  root.append(grid);

  if (selectedMetric === 'pipeline') {
    const stages = ['lead', 'qualified', 'proposal', 'negotiation'];
    charts.bar(document.getElementById('chart-left'), {
      labels: stages.map(fmt.titleCase),
      data: stages.map((st) => s.deals.filter((d) => d.stage === st).reduce((t, d) => t + d.value, 0)),
      valueFormat: fmt.moneyCompact,
    });
  } else if (selectedMetric === 'orders') {
    const weeks = metrics.revenueByWeek(s);
    const records = metrics.withEffectiveStatus(s.records).filter((r) => r.type === 'order');
    charts.line(document.getElementById('chart-left'), {
      labels: weeks.map((w) => w.label),
      data: weeks.map((w) => records.filter((r) => r.date >= w.from && r.date <= w.to).length),
      valueFormat: fmt.count,
    });
  } else {
    const weeks = metrics.revenueByWeek(s);
    charts.line(document.getElementById('chart-left'), {
      labels: weeks.map((w) => w.label),
      data: weeks.map((w) => w.value / 100),
      valueFormat: (v) => fmt.moneyCompact(v * 100),
    });
  }

  const byStatus = metrics.ordersByStatus(s);
  charts.bar(document.getElementById('chart-right'), {
    labels: byStatus.map((r) => fmt.titleCase(r.status)),
    data: byStatus.map((r) => r.count),
    colours: byStatus.map((r) => STATUS_COLOUR[r.status]),
    valueFormat: fmt.count,
  });

  renderSlot(root, 'overview:after-charts', s);

  // Recent records
  const rows = metrics.recentRecords(s, 5);
  root.append(card('Recent records',
    rows.length
      ? table([
          { label: 'ID',     cellClass: 'mono text-muted', render: (r) => `#${r.id}` },
          { label: 'Client', render: (r) => el('span', { class: 'font-semi', text: metrics.clientName(s, r.clientId) }) },
          { label: 'Type',   cellClass: 'text-muted', render: (r) => fmt.titleCase(r.type) },
          { label: 'Value',  align: 'right', render: (r) => el('span', { class: 'font-semi', text: fmt.money(r.value) }) },
          { label: 'Date',   cellClass: 'text-muted', render: (r) => fmt.date(r.date) },
          { label: 'Status', render: (r) => badge(r.status, fmt.titleCase(r.status)) },
        ], rows)
      : stateBlock('empty', 'No records in this period', 'Widen the period filter to see more.'),
    {
      flush: rows.length > 0,
      action: el('a', { class: 'btn btn-ghost', href: '#/analytics', style: 'font-size:12px;padding:4px 10px', text: 'View all' }),
    }));

  // Module upsell slots — generated from module metadata, and clickable.
  root.append(renderSlot(null, 'overview:module-slots', s));
}

export default {
  mount(root) {
    render(root);
    unsub = subscribe(() => render(root));
  },
  unmount() {
    unsub?.();
    unsub = null;
    charts?.destroyAll();
    charts = null;
  },
};
