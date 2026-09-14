// Hash routing, chosen so static hosting needs no rewrite rules.
// Each route names a view; the previous view is always unmounted first.

const routes = new Map();
let current = null;
let root = null;
let fallback = '#/overview';
let onChange = () => {};

export function register(hash, loader) {
  routes.set(hash, loader);
}

export function registerAll(map) {
  for (const [hash, loader] of Object.entries(map)) register(hash, loader);
}

export function currentHash() {
  return window.location.hash || fallback;
}

export function navigate(hash) {
  if (window.location.hash === hash) render();
  else window.location.hash = hash;
}

async function render() {
  const hash = currentHash();
  const loader = routes.get(hash) ?? routes.get(fallback);

  if (current?.unmount) {
    try { current.unmount(); } catch (e) { console.error('unmount failed', e); }
  }
  current = null;
  root.innerHTML = '';

  let view;
  try {
    const mod = await loader();
    view = mod.default ?? mod;
  } catch (e) {
    console.error('view failed to load', e);
    root.innerHTML = '<div class="state state-error"><div class="state-icon">!</div>' +
      '<div class="state-title">This screen failed to load</div>' +
      '<div>Reload the page, or pick another screen from the sidebar.</div></div>';
    return;
  }

  current = view;
  view.mount(root);
  onChange(hash, view);
}

export function start({ mount, notFound = '#/overview', onNavigate = () => {} }) {
  root = mount;
  fallback = notFound;
  onChange = onNavigate;
  window.addEventListener('hashchange', render);
  if (!window.location.hash) window.location.hash = fallback;
  else render();
}
