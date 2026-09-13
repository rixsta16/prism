import { getState, subscribe } from '../store.js';
import * as fmt from '../format.js';
import { el, card, pageTitle, state as stateBlock, field, badge } from '../ui.js';
import { getConfig, reload } from '../app.js';

let unsub = null;

const AVAILABLE = [
  { id: 'mock', name: 'Sample data',   desc: 'Built-in placeholder set for demos and development', ready: true },
  { id: 'csv',  name: 'CSV upload',    desc: 'Upload exports and map your columns onto Prism entities', ready: false },
  { id: 'rest', name: 'REST endpoint', desc: 'Live pull from your own API, bearer token supplied by the host', ready: false },
  { id: 'xero', name: 'Xero',          desc: 'Accounting integration', ready: false },
  { id: 'qb',   name: 'QuickBooks',    desc: 'Accounting integration', ready: false },
  { id: 'shopify', name: 'Shopify',    desc: 'Requires the eCommerce Connect module', ready: false },
];

// Field mapping is non-negotiable — no two SMBs name their columns the same.
const PRISM_FIELDS = ['id', 'clientId', 'type', 'value', 'date', 'dueDate', 'status'];

function render(root) {
  const s = getState();
  const cfg = getConfig();
  root.innerHTML = '';
  pageTitle('Data Sources', 'Connect, map and sync the data Prism reads');

  const active = AVAILABLE.find((a) => a.id === cfg.dataSource.adapter);

  root.append(card('Connected', el('div', {}, [
    el('div', { class: 'source-row' }, [
      el('div', { style: 'flex:1' }, [
        el('div', { class: 'source-name', text: active?.name ?? cfg.dataSource.adapter }),
        el('div', { class: 'source-meta', text: active?.desc ?? 'Configured in prism.config.js' }),
      ]),
      el('div', { class: 'source-meta', text: `${fmt.count(s.records.length)} records · ${fmt.count(s.clients.length)} clients · ${fmt.count(s.deals.length)} deals` }),
      badge(s.status === 'error' ? 'overdue' : s.status === 'ready' ? 'complete' : 'awaiting',
        s.status === 'error' ? 'Failed' : s.status === 'ready' ? 'Synced' : fmt.titleCase(s.status)),
      el('button', { class: 'btn btn-ghost', type: 'button', text: 'Sync now', onClick: () => reload() }),
    ]),
  ]), { flush: true }));

  root.append(card('Add a source', el('div', { class: 'grid-3' },
    AVAILABLE.filter((a) => a.id !== cfg.dataSource.adapter).map((a) =>
      el('button', {
        type: 'button',
        class: 'module-slot',
        disabled: !a.ready,
        title: a.ready ? null : 'Not built yet — see docs/ROADMAP.md Phase 3',
      }, [
        el('div', { class: 'module-slot-name', text: a.name }),
        el('div', { class: 'module-slot-desc', text: a.desc }),
        el('div', { class: 'module-slot-price', text: a.ready ? 'Available' : 'Phase 3' }),
      ])
    ))));

  root.append(card('Field mapping', el('div', {}, [
    el('div', { class: 'field-hint', style: 'margin-bottom:12px',
      text: 'Map your source columns onto Prism entities. Locked while the sample adapter is active.' }),
    el('div', { class: 'grid-3' }, PRISM_FIELDS.map((f) =>
      field(f, el('input', {
        class: 'input',
        value: f,
        disabled: true,
        'aria-label': `Source column for ${f}`,
      })))),
  ])));

  root.append(card('Sync history', el('div', {}, [
    el('div', { class: 'source-row' }, [
      el('div', { style: 'flex:1' }, [
        el('div', { class: 'source-name', text: 'Last sync' }),
        el('div', { class: 'source-meta', text: s.status === 'ready' ? 'Completed with no errors' : fmt.titleCase(s.status) }),
      ]),
      badge(s.status === 'error' ? 'overdue' : 'complete', s.status === 'error' ? 'Failed' : 'OK'),
    ]),
    s.warning ? stateBlock('partial', 'Partial sync', s.warning) : null,
    s.error ? stateBlock('error', 'Sync failed', s.error) : null,
  ]), { flush: true }));
}

export default {
  mount(root) { render(root); unsub = subscribe(() => render(root)); },
  unmount() { unsub?.(); unsub = null; },
};
