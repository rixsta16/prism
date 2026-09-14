import { getState, subscribe } from '../../store.js';
import * as fmt from '../../format.js';
import * as metrics from '../../metrics.js';
import { createChartRegistry, PALETTE } from '../../charts.js';
import { el, card, table, badge, chartBox, pageTitle, state as stateBlock } from '../../ui.js';
import { stageCounts } from './data.js';

let unsub = null;
let charts = null;

function render(root) {
  const s = getState();
  root.innerHTML = '';
  charts?.destroyAll();
  charts = createChartRegistry();
  pageTitle('Production Story', 'Build-flow from intake to dispatch');

  if (s.status !== 'ready') {
    root.append(stateBlock(s.status === 'error' ? 'error' : 'empty',
      s.status === 'error' ? 'Could not load production data' : 'Nothing in production',
      s.error ?? 'Orders appear here once a data source is connected.'));
    return;
  }

  const counts = stageCounts(s);
  const inFlight = counts.filter((c) => c.id !== 'dispatch').reduce((t, c) => t + c.count, 0);
  const worst = counts.reduce((a, b) => (b.dwellDays > a.dwellDays ? b : a), counts[0]);

  root.append(el('div', { class: 'ai-bar' }, [
    el('div', { class: 'ai-bar-icon', 'aria-hidden': 'true', text: '◍' }),
    el('div', {}, [
      el('div', { class: 'ai-bar-label', text: 'Bottleneck' }),
      el('div', { class: 'ai-bar-text', text:
        `${worst.label} holds ${worst.count} job${worst.count === 1 ? '' : 's'} at ${worst.dwellDays.toFixed(1)} days average dwell — the slowest stage on the floor.` }),
    ]),
  ]));

  root.append(card('Stage pipeline', el('div', { class: 'pipeline' }, counts.map((c) =>
    el('div', { class: `pipeline-stage${c.id === worst.id ? ' bottleneck' : ''}` }, [
      el('div', { class: 'pipeline-count', text: String(c.count) }),
      el('div', { class: 'pipeline-name', text: c.label }),
      el('div', { class: 'pipeline-dwell', text: `${c.dwellDays.toFixed(1)}d dwell` }),
    ])
  ))));

  root.append(el('div', { class: 'grid-2' }, [
    card('Jobs per stage', chartBox('prod-count')),
    card('Average dwell (days)', chartBox('prod-dwell')),
  ]));

  charts.bar(document.getElementById('prod-count'), {
    labels: counts.map((c) => c.label),
    data: counts.map((c) => c.count),
    colours: counts.map((c) => (c.id === worst.id ? PALETTE.amber : PALETTE.gold)),
    valueFormat: fmt.count,
  });
  charts.bar(document.getElementById('prod-dwell'), {
    labels: counts.map((c) => c.label),
    data: counts.map((c) => Number(c.dwellDays.toFixed(1))),
    colours: counts.map((c) => (c.id === worst.id ? PALETTE.red : PALETTE.blue)),
    valueFormat: (v) => `${v}d`,
  });

  const jobs = counts.flatMap((c) => c.rows.map((r) => ({ ...r, stage: c.label })));
  root.append(card(`Jobs on the floor — ${inFlight} in flight`,
    table([
      { label: 'ID', cellClass: 'mono text-muted', render: (r) => `#${r.id}` },
      { label: 'Client', render: (r) => metrics.clientName(s, r.clientId) },
      { label: 'Stage', render: (r) => el('span', { class: 'font-semi', text: r.stage }) },
      { label: 'Value', align: 'right', render: (r) => el('span', { class: 'mono', text: fmt.money(r.value) }) },
      { label: 'Opened', cellClass: 'text-muted', render: (r) => fmt.date(r.date) },
      { label: 'Status', render: (r) => badge(metrics.effectiveStatus(r), fmt.titleCase(metrics.effectiveStatus(r))) },
    ], jobs),
    { flush: true }));
}

export default {
  mount(root) { render(root); unsub = subscribe(() => render(root)); },
  unmount() { unsub?.(); unsub = null; charts?.destroyAll(); charts = null; },
};
