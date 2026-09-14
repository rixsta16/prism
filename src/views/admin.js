import { getState, subscribe } from '../store.js';
import * as fmt from '../format.js';
import { el, card, table, badge, pageTitle, field, switchRow, state as stateBlock } from '../ui.js';
import { getConfig } from '../app.js';
import { CATALOGUE, isEnabled } from '../modules/registry.js';

let unsub = null;

// Role gate. No auth exists yet (see docs/ARCHITECTURE.md security posture),
// so the role is read from config and the gate is advisory, not a boundary.
const USERS = [
  { id: 'u1', name: 'Jane Doe',   email: 'jane@democlient.co.uk',  role: 'owner',    lastSeen: 'Today' },
  { id: 'u2', name: 'Sam Patel',  email: 'sam@democlient.co.uk',   role: 'operator', lastSeen: 'Yesterday' },
  { id: 'u3', name: 'Alex Nkomo', email: 'alex@democlient.co.uk',  role: 'viewer',   lastSeen: '3 days ago' },
];

const AUDIT = [
  { at: 'Today 09:14',     who: 'Jane Doe',  what: 'Changed period default to This Month' },
  { at: 'Yesterday 16:02', who: 'Sam Patel', what: 'Generated Aged debt report' },
  { at: '3 days ago',      who: 'Jane Doe',  what: 'Enabled Production Story module' },
];

function render(root) {
  const cfg = getConfig();
  root.innerHTML = '';
  pageTitle('Admin Panel', `Tenant settings for ${cfg.tenant.firmName}`);

  root.append(stateBlock('partial', 'Advisory role gate only',
    'Prism has no authentication yet, so this screen is not a security boundary. It must sit behind an authenticating host before real data is loaded.'));

  root.append(card('Tenant', el('div', { class: 'grid-3' }, [
    field('Tenant ID',    el('input', { class: 'input', value: cfg.tenant.id, disabled: true }),
          'Set in prism.config.js at provisioning time'),
    field('Firm name',    el('input', { class: 'input', value: cfg.tenant.firmName, disabled: true })),
    field('Product name', el('input', { class: 'input', value: cfg.branding.productName, disabled: true })),
    field('Accent',       el('input', { class: 'input', value: cfg.branding.accent, disabled: true }),
          'Overrides --gold'),
    field('Currency',     el('input', { class: 'input', value: cfg.locale.currency, disabled: true })),
    field('Timezone',     el('input', { class: 'input', value: cfg.locale.timezone, disabled: true })),
  ])));

  root.append(card('Users and roles', table([
    { label: 'Name',  render: (u) => el('span', { class: 'font-semi', text: u.name }) },
    { label: 'Email', cellClass: 'text-muted', render: (u) => u.email },
    { label: 'Role',  render: (u) => badge(u.role === 'owner' ? 'complete' : u.role === 'operator' ? 'in_progress' : 'draft', fmt.titleCase(u.role)) },
    { label: 'Last seen', cellClass: 'text-muted', render: (u) => u.lastSeen },
  ], USERS), {
    flush: true,
    action: el('button', { class: 'btn btn-ghost', type: 'button', disabled: true,
      style: 'font-size:12px;padding:4px 10px', title: 'Needs the auth decision in docs/ROADMAP.md',
      text: 'Invite user' }),
  }));

  root.append(card('Modules', el('div', {},
    CATALOGUE.map((m) => switchRow(
      m.name,
      m.price == null ? `${m.desc} · included` : `${m.desc} · ${fmt.money(m.price)}/mo`,
      isEnabled(m.id),
      { disabled: true }
    ))
  ), {
    action: el('span', { class: 'text-xs text-muted', text: 'Edit prism.config.js → modules' }),
  }));

  root.append(card('Data source', el('div', { class: 'grid-2' }, [
    field('Adapter', el('input', { class: 'input', value: cfg.dataSource.adapter, disabled: true })),
    field('Base URL', el('input', { class: 'input', value: cfg.dataSource.baseUrl ?? '—', disabled: true }),
          'No credentials are ever stored here — the host supplies a bearer token at runtime'),
  ])));

  root.append(card('Audit log', table([
    { label: 'When', cellClass: 'text-muted', render: (a) => a.at },
    { label: 'Who',  render: (a) => a.who },
    { label: 'What', render: (a) => a.what },
  ], AUDIT), { flush: true }));
}

export default {
  mount(root) { render(root); unsub = subscribe(() => render(root)); },
  unmount() { unsub?.(); unsub = null; },
};
