import { getState, subscribe } from '../../store.js';
import * as fmt from '../../format.js';
import * as metrics from '../../metrics.js';
import { createChartRegistry, PALETTE } from '../../charts.js';
import { el, card, table, badge, chartBox, pageTitle, state as stateBlock } from '../../ui.js';

const STAGES = ['lead', 'qualified', 'proposal', 'negotiation'];
let unsub = null;
let charts = null;

function dealCard(s, d) {
  return el('div', { class: 'deal-card' }, [
    el('div', { class: 'deal-card-name', text: d.clientId ? metrics.clientName(s, d.clientId) : 'Unqualified lead' }),
    el('div', { class: 'deal-card-meta' }, [
      el('span', { class: 'mono', text: fmt.money(d.value) }),
      el('span', { text: `${d.probability}%` }),
    ]),
    d.expectedClose
      ? el('div', { class: 'deal-card-meta' }, [el('span', { text: `Close ${fmt.date(d.expectedClose)}` })])
      : null,
  ]);
}

function render(root) {
  const s = getState();
  root.innerHTML = '';
  charts?.destroyAll();
  charts = createChartRegistry();
  pageTitle('CRM + Pipeline', 'Deal board, weighted forecast and closed history');

  if (s.status !== 'ready') {
    root.append(stateBlock(s.status === 'error' ? 'error' : 'empty',
      s.status === 'error' ? 'Could not load deals' : 'No deals yet',
      s.error ?? 'Deals appear here once a data source is connected.'));
    return;
  }

  const open = s.deals.filter((d) => STAGES.includes(d.stage));
  const weighted = open.reduce((t, d) => t + d.value * (d.probability / 100), 0);
  const won = s.deals.filter((d) => d.stage === 'won');
  const lost = s.deals.filter((d) => d.stage === 'lost');
  const winRate = won.length + lost.length ? (won.length / (won.length + lost.length)) * 100 : 0;

  root.append(el('div', { class: 'stat-bar' }, [
    ['Open deals', fmt.count(open.length), 'in play'],
    ['Pipeline value', fmt.money(open.reduce((t, d) => t + d.value, 0)), 'unweighted'],
    ['Weighted forecast', fmt.money(weighted), 'by probability'],
    ['Win rate', `${winRate.toFixed(0)}%`, `${won.length} won · ${lost.length} lost`],
  ].map(([label, value, note]) => el('div', { class: 'stat' }, [
    el('div', {}, [
      el('div', { class: 'stat-label', text: label }),
      el('div', { class: 'stat-value', text: value }),
      el('div', { class: 'stat-change', style: 'color:var(--text-dim)', text: note }),
    ]),
  ]))));

  root.append(card('Board', el('div', { class: 'board' }, STAGES.map((stage) => {
    const rows = s.deals.filter((d) => d.stage === stage);
    return el('div', { class: 'board-col' }, [
      el('div', { class: 'board-col-head' }, [
        el('span', { text: fmt.titleCase(stage) }),
        el('span', { text: String(rows.length) }),
      ]),
      ...rows.map((d) => dealCard(s, d)),
      rows.length ? null : el('div', { class: 'text-xs text-muted', text: 'Empty' }),
    ]);
  }))));

  root.append(el('div', { class: 'grid-2' }, [
    card('Value by stage', chartBox('crm-stage')),
    card('Closed deals', table([
      { label: 'Client', render: (d) => d.clientId ? metrics.clientName(s, d.clientId) : '—' },
      { label: 'Value', align: 'right', render: (d) => el('span', { class: 'mono', text: fmt.money(d.value) }) },
      { label: 'Closed', cellClass: 'text-muted', render: (d) => fmt.date(d.expectedClose) },
      { label: 'Outcome', render: (d) => badge(d.stage, fmt.titleCase(d.stage)) },
    ], [...won, ...lost]), { flush: true }),
  ]));

  charts.bar(document.getElementById('crm-stage'), {
    labels: STAGES.map(fmt.titleCase),
    data: STAGES.map((st) => s.deals.filter((d) => d.stage === st).reduce((t, d) => t + d.value, 0) / 100),
    colours: PALETTE.gold,
    horizontal: true,
    valueFormat: (v) => fmt.moneyCompact(v * 100),
  });
}

export default {
  mount(root) { render(root); unsub = subscribe(() => render(root)); },
  unmount() { unsub?.(); unsub = null; charts?.destroyAll(); charts = null; },
};
