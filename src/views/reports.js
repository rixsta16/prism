import { getState, subscribe } from '../store.js';
import * as fmt from '../format.js';
import * as metrics from '../metrics.js';
import { el, card, table, badge, pageTitle, state as stateBlock, field } from '../ui.js';
import { PERIODS } from '../periods.js';
import { exportCsv } from '../csv.js';
import { getConfig } from '../app.js';

let unsub = null;
let pending = 2;   // matches the sidebar badge

const SCHEDULED = [
  { id: 'weekly-digest', name: 'Weekly digest',     cadence: 'Every Monday 07:00', format: 'PDF', enabled: true },
  { id: 'month-end',     name: 'Month-end summary', cadence: 'First of the month', format: 'PDF', enabled: true },
  { id: 'aged-debt',     name: 'Aged debt',         cadence: 'Off',                format: 'CSV', enabled: false },
];

function buildReport(s, kind, period) {
  const scoped = { ...s, period };
  const k = metrics.kpis(scoped);
  if (kind === 'aged-debt') {
    const rows = metrics.withEffectiveStatus(s.records)
      .filter((r) => r.type === 'invoice' && (r.status === 'awaiting' || r.status === 'overdue'))
      .map((r) => ({
        ...r,
        client: metrics.clientName(s, r.clientId),
        ageDays: r.dueDate ? Math.floor((Date.now() - new Date(r.dueDate)) / 86400000) : 0,
      }))
      .sort((a, b) => b.ageDays - a.ageDays);
    return { title: 'Aged debt', rows, kind };
  }
  return {
    title: kind === 'month-end' ? 'Month-end summary' : 'Weekly digest',
    kind,
    kpis: k,
    rows: metrics.recentRecords(scoped, 20),
  };
}

function renderPreview(s, report) {
  if (report.kind === 'aged-debt') {
    return card(report.title, report.rows.length
      ? table([
          { label: 'Invoice', cellClass: 'mono text-muted', render: (r) => `#${r.id}` },
          { label: 'Client', render: (r) => r.client },
          { label: 'Value', align: 'right', render: (r) => el('span', { class: 'mono', text: fmt.money(r.value) }) },
          { label: 'Due', cellClass: 'text-muted', render: (r) => fmt.date(r.dueDate) },
          { label: 'Age', align: 'right', render: (r) => (r.ageDays > 0 ? `${r.ageDays}d` : '—') },
          { label: 'Status', render: (r) => badge(r.status, fmt.titleCase(r.status)) },
        ], report.rows)
      : stateBlock('empty', 'Nothing outstanding', 'Every invoice is paid.'),
      {
        flush: report.rows.length > 0,
        action: getConfig().features.exportCsv
          ? el('button', { class: 'btn btn-ghost', type: 'button', style: 'font-size:12px;padding:4px 10px',
              text: 'Export CSV',
              onClick: () => exportCsv('aged-debt', ['Invoice', 'Client', 'Value', 'Due', 'Age days', 'Status'],
                report.rows.map((r) => [r.id, r.client, (r.value / 100).toFixed(2), r.dueDate ?? '', r.ageDays, r.status])) })
          : null,
      });
  }

  const k = report.kpis;
  return el('div', {}, [
    el('div', { class: 'stat-bar' }, [
      ['Revenue', fmt.money(k.revenue.value)],
      ['Orders', fmt.count(k.orders.value)],
      ['Outstanding', fmt.money(k.outstanding.value)],
      ['Pipeline', fmt.count(k.pipeline.value)],
    ].map(([label, value]) => el('div', { class: 'stat' }, [
      el('div', {}, [
        el('div', { class: 'stat-label', text: label }),
        el('div', { class: 'stat-value', text: value }),
      ]),
    ]))),
    card(`${report.title} — records`, table([
      { label: 'ID', cellClass: 'mono text-muted', render: (r) => `#${r.id}` },
      { label: 'Client', render: (r) => metrics.clientName(getState(), r.clientId) },
      { label: 'Type', cellClass: 'text-muted', render: (r) => fmt.titleCase(r.type) },
      { label: 'Value', align: 'right', render: (r) => el('span', { class: 'mono', text: fmt.money(r.value) }) },
      { label: 'Date', cellClass: 'text-muted', render: (r) => fmt.date(r.date) },
      { label: 'Status', render: (r) => badge(r.status, fmt.titleCase(r.status)) },
    ], report.rows), { flush: true }),
  ]);
}

function render(root) {
  const s = getState();
  root.innerHTML = '';
  pageTitle('Reports', `${pending} report${pending === 1 ? '' : 's'} ready to generate`);

  if (s.status === 'error') {
    root.append(stateBlock('error', 'Could not load your data', s.error));
    return;
  }
  if (s.status === 'loading' || s.status === 'idle') {
    root.append(card('Loading', el('div', { class: 'skeleton skeleton-block', style: 'height:120px' })));
    return;
  }

  const kindSelect = el('select', { class: 'select', id: 'report-kind' }, [
    el('option', { value: 'weekly-digest', text: 'Weekly digest' }),
    el('option', { value: 'month-end',     text: 'Month-end summary' }),
    el('option', { value: 'aged-debt',     text: 'Aged debt' }),
  ]);
  const periodSelect = el('select', { class: 'select', id: 'report-period' },
    PERIODS.map((p) => el('option', { value: p.key, text: p.label })));

  const preview = el('div');

  const generate = () => {
    const period = PERIODS.find((p) => p.key === periodSelect.value) ?? PERIODS[0];
    preview.innerHTML = '';
    if (s.status === 'empty') {
      preview.append(stateBlock('empty', 'No data to report on',
        'Connect a data source first.',
        el('a', { class: 'btn btn-primary', href: '#/data-sources', text: 'Connect a data source' })));
      return;
    }
    preview.append(renderPreview(s, buildReport(s, kindSelect.value, period)));
  };

  root.append(card('Generate a report', el('div', {}, [
    el('div', { class: 'grid-3' }, [
      field('Report', kindSelect),
      field('Period', periodSelect),
      el('div', { class: 'field' }, [
        el('span', { class: 'field-label', text: 'Output' }),
        el('div', { class: 'flex gap-2' }, [
          el('button', { class: 'btn btn-primary', type: 'button', text: 'Generate', onClick: generate }),
          el('button', { class: 'btn btn-ghost', type: 'button', text: 'Print / PDF', onClick: () => window.print() }),
        ]),
      ]),
    ]),
    el('div', { class: 'field-hint', text: 'PDF output uses the browser print dialogue — no extra dependency.' }),
  ])));

  root.append(card('Scheduled reports', table([
    { label: 'Report', render: (r) => el('span', { class: 'font-semi', text: r.name }) },
    { label: 'Cadence', cellClass: 'text-muted', render: (r) => r.cadence },
    { label: 'Format', cellClass: 'text-muted', render: (r) => r.format },
    { label: 'State', render: (r) => badge(r.enabled ? 'complete' : 'draft', r.enabled ? 'Scheduled' : 'Off') },
  ], SCHEDULED), { flush: true }));

  root.append(preview);
  generate();
}

export default {
  mount(root) { render(root); unsub = subscribe(() => render(root)); },
  unmount() { unsub?.(); unsub = null; },
};
