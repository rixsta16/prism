// Module registry. Core never imports a module directly — modules are
// discovered from config.modules and dynamically imported.

import { el } from '../ui.js';
import * as fmt from '../format.js';

// Catalogue metadata for every module, enabled or not. A disabled module
// renders as an upsell slot built from this same metadata.
export const CATALOGUE = [
  { id: 'crm-pipeline',      name: 'CRM + Pipeline',    desc: 'Deal board by stage, weighted forecast', price: null,   icon: '◫', load: () => import('./crm-pipeline/index.js') },
  { id: 'production-story',  name: 'Production Story',  desc: 'Visual build-flow from intake to dispatch', price: 4900, icon: '◍', load: () => import('./production-story/index.js') },
  { id: 'inventory',         name: 'Inventory / Stock', desc: 'Real-time stock levels and reorder alerts', price: 3900, icon: '▤', load: () => import('./inventory/index.js') },
  { id: 'ecommerce',         name: 'eCommerce Connect', desc: 'Shopify / WooCommerce live sync',           price: 3900, icon: '⇄', load: () => import('./ecommerce/index.js') },
];

const enabled = new Map();

export async function loadEnabled(ids = []) {
  enabled.clear();
  for (const id of ids) {
    const entry = CATALOGUE.find((c) => c.id === id);
    if (!entry) {
      console.warn(`Unknown module id in config: ${id}`);
      continue;
    }
    try {
      const mod = (await entry.load()).default;
      enabled.set(id, { ...entry, ...mod });
    } catch (e) {
      console.error(`Module "${id}" failed to load`, e);
    }
  }
  return [...enabled.values()];
}

export function enabledModules() {
  return [...enabled.values()];
}

export function isEnabled(id) {
  return enabled.has(id);
}

export function navEntries() {
  return enabledModules().flatMap((m) => m.nav ?? []);
}

export function routes() {
  return Object.assign({}, ...enabledModules().map((m) => m.routes ?? {}));
}

function upsellSlots() {
  const off = CATALOGUE.filter((c) => !enabled.has(c.id) && c.price != null);
  if (!off.length) return null;
  return el('div', {}, [
    el('div', { class: 'flex items-center gap-2', style: 'margin-bottom:12px' }, [
      el('span', { class: 'text-xs text-muted', style: 'text-transform:uppercase;letter-spacing:0.08em', text: 'Add-on modules' }),
    ]),
    el('div', { class: 'grid-3' }, off.map((c) =>
      el('button', {
        type: 'button',
        class: 'module-slot',
        onClick: () => window.dispatchEvent(new CustomEvent('prism:enable-module', { detail: c.id })),
      }, [
        el('div', { class: 'module-slot-icon', 'aria-hidden': 'true', text: c.icon }),
        el('div', { class: 'module-slot-name', text: c.name }),
        el('div', { class: 'module-slot-desc', text: c.desc }),
        el('div', { class: 'module-slot-price', text: `${fmt.money(c.price)}/mo — click to enable` }),
      ])
    )),
  ]);
}

// Named insertion points core views expose. Render order follows config order.
export function renderSlot(root, slot, state) {
  const node = slot === 'overview:module-slots'
    ? upsellSlots()
    : (() => {
        const widgets = enabledModules()
          .flatMap((m) => (m.widgets ?? []).filter((w) => w.slot === slot));
        if (!widgets.length) return null;
        return el('div', {}, widgets.map((w) => {
          try { return w.render(state); }
          catch (e) { console.error(`widget in ${slot} failed`, e); return null; }
        }).filter(Boolean));
      })();

  if (node && root) root.append(node);
  return node ?? document.createComment('empty slot');
}

export function unmountAll() {
  for (const m of enabled.values()) {
    try { m.unmount?.(); } catch (e) { console.error(`module ${m.id} unmount failed`, e); }
  }
}
