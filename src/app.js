import { loadConfig } from './config.js';
import * as fmt from './format.js';
import * as store from './store.js';
import * as router from './router.js';
import { PERIODS } from './periods.js';
import { prefs } from './prefs.js';
import { loadEnabled, navEntries, routes as moduleRoutes } from './modules/registry.js';
import { el } from './ui.js';

let config = null;
let adapter = null;

export function getConfig() {
  return config;
}

const ADAPTERS = {
  mock: () => import('./adapters/mock.js'),
  // rest / csv land in Phase 3 — see docs/ROADMAP.md
};

const CORE_ROUTES = {
  '#/overview':     () => import('./views/overview.js'),
  '#/analytics':    () => import('./views/analytics.js'),
  '#/reports':      () => import('./views/reports.js'),
  '#/data-sources': () => import('./views/data-sources.js'),
  '#/admin':        () => import('./views/admin.js'),
  '#/settings':     () => import('./views/settings.js'),
};

export async function reload() {
  store.setStatus('loading');
  try {
    const data = await adapter.fetch(store.getState().period);
    store.setData(data);
  } catch (e) {
    console.error('adapter fetch failed', e);
    store.setStatus('error', { error: e.message ?? 'The data source did not respond.' });
  }
}

const NAV_ICON = {
  '#/overview':     '<rect x="1" y="1" width="6" height="6" rx="1.2"/><rect x="9" y="1" width="6" height="6" rx="1.2"/><rect x="1" y="9" width="6" height="6" rx="1.2"/><rect x="9" y="9" width="6" height="6" rx="1.2"/>',
  '#/analytics':    '<polyline points="1,12 5,7 8,10 11,5 15,2"/><line x1="1" y1="14" x2="15" y2="14"/>',
  '#/reports':      '<rect x="2" y="1" width="12" height="14" rx="1.5"/><line x1="5" y1="5" x2="11" y2="5"/><line x1="5" y1="8" x2="11" y2="8"/><line x1="5" y1="11" x2="8" y2="11"/>',
  '#/data-sources': '<circle cx="6" cy="5" r="3"/><circle cx="10" cy="11" r="3"/><line x1="6" y1="8" x2="6" y2="13"/><line x1="10" y1="2" x2="10" y2="8"/>',
  '#/admin':        '<rect x="1" y="4" width="14" height="9" rx="1.2"/><line x1="5" y1="4" x2="5" y2="13"/><line x1="1" y1="8" x2="15" y2="8"/>',
  '#/settings':     '<circle cx="8" cy="8" r="6.5"/><circle cx="8" cy="6" r="2.5"/><path d="M2.5 13.5 C3 10.5 5 9 8 9 C11 9 13 10.5 13.5 13.5"/>',
  module:           '<circle cx="5" cy="8" r="3.5"/><circle cx="11" cy="8" r="3.5"/>',
};

function navItem({ route, label, badge }) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 16 16');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '1.6');
  svg.setAttribute('aria-hidden', 'true');
  svg.innerHTML = NAV_ICON[route] ?? NAV_ICON.module;

  const a = el('a', { class: 'nav-item', href: route, dataset: { route } });
  a.append(svg, document.createTextNode(label));
  if (badge) a.append(el('span', { class: 'nav-badge', text: String(badge) }));
  return a;
}

function buildNav() {
  const workspace = document.getElementById('nav-workspace');
  const modules = document.getElementById('nav-modules');
  workspace.innerHTML = '';
  modules.innerHTML = '';

  workspace.append(
    navItem({ route: '#/overview',     label: 'Overview' }),
    navItem({ route: '#/analytics',    label: 'Analytics' }),
    navItem({ route: '#/reports',      label: 'Reports', badge: 2 }),
    navItem({ route: '#/data-sources', label: 'Data Sources' }),
  );

  modules.append(navItem({ route: '#/admin', label: 'Admin Panel' }));
  for (const entry of navEntries()) modules.append(navItem(entry));
}

function markActive(hash) {
  for (const a of document.querySelectorAll('.nav-item[data-route]')) {
    const on = a.dataset.route === hash;
    a.classList.toggle('active', on);
    if (on) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  }
}

function wireShell() {
  const shell = document.getElementById('shell');
  const toggle = document.getElementById('sidebar-toggle');
  const scrim = document.getElementById('sidebar-scrim');

  const close = () => shell.classList.remove('nav-open');
  toggle.addEventListener('click', () => {
    const open = shell.classList.toggle('nav-open');
    toggle.setAttribute('aria-expanded', String(open));
  });
  scrim.addEventListener('click', close);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
  window.addEventListener('hashchange', close);

  document.getElementById('refresh').addEventListener('click', () => reload());
  window.addEventListener('prism:reload', () => reload());

  window.addEventListener('prism:enable-module', (e) => {
    window.alert(
      `Enabling "${e.detail}" is a provisioning change: add it to the modules array in ` +
      `prism.config.js and redeploy. Self-serve enablement needs the billing decision in docs/ROADMAP.md.`
    );
  });
}

function fatal(message) {
  document.body.innerHTML = '';
  document.body.append(el('div', {
    style: 'max-width:640px;margin:80px auto;padding:24px;border:1px solid rgba(224,92,106,0.4);border-radius:10px;background:#1a1a2e',
  }, [
    el('div', { style: 'color:#e05c6a;font-weight:600;margin-bottom:8px', text: 'Prism could not start' }),
    el('div', { style: 'color:#e8e4da;font-size:13px', text: message }),
  ]));
}

async function boot() {
  try {
    config = await loadConfig();
  } catch (e) {
    fatal(e.message);
    return;
  }

  fmt.configure(config.locale);

  if (config.branding.accent) {
    document.documentElement.style.setProperty('--gold', config.branding.accent);
  }
  document.title = `${config.branding.productName} — ${config.tenant.firmName}`;
  document.getElementById('brand-name').textContent = config.branding.productName;
  document.getElementById('user-name').textContent = config.tenant.userName ?? '';
  document.getElementById('user-email').textContent = config.tenant.userEmail ?? '';

  const p = prefs();
  const startPeriod = PERIODS.find((x) => x.key === p.period) ?? PERIODS[0];
  store.setPeriod(startPeriod);

  await loadEnabled(config.modules);
  buildNav();
  wireShell();

  const load = ADAPTERS[config.dataSource.adapter];
  if (!load) {
    store.setStatus('error', {
      error: `No adapter named "${config.dataSource.adapter}". Available: ${Object.keys(ADAPTERS).join(', ')}.`,
    });
  } else {
    adapter = (await load()).default;
  }

  router.registerAll({ ...CORE_ROUTES, ...moduleRoutes() });
  router.start({
    mount: document.getElementById('view'),
    notFound: p.landing ?? '#/overview',
    onNavigate: markActive,
  });

  if (adapter) reload();
}

boot();
