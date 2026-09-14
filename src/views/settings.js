import { getState, setPeriod } from '../store.js';
import { el, card, pageTitle, field, switchRow, state as stateBlock } from '../ui.js';
import { PERIODS } from '../periods.js';
import { getConfig } from '../app.js';
import { prefs, savePrefs } from '../prefs.js';

// User-scoped preferences, distinct from Admin's tenant scope. These persist
// per browser until the adapter gains a write path (docs/ROADMAP.md Phase 4).

function render(root) {
  const cfg = getConfig();
  const p = prefs();
  root.innerHTML = '';
  pageTitle('Settings', `Preferences for ${cfg.tenant.userName ?? cfg.tenant.userEmail ?? 'this user'}`);

  const landing = el('select', { class: 'select', id: 'pref-landing' }, [
    ['#/overview', 'Overview'],
    ['#/analytics', 'Analytics'],
    ['#/reports', 'Reports'],
  ].map(([v, label]) => el('option', { value: v, text: label, selected: p.landing === v })));

  const period = el('select', { class: 'select', id: 'pref-period' },
    PERIODS.map((x) => el('option', { value: x.key, text: x.label, selected: p.period === x.key })));

  const digest = switchRow('Weekly digest', 'Show the AI summary strip on Overview', p.aiDigest);
  const compact = switchRow('Compact numbers', 'Show £6.1k instead of £6,100 in chart axes', p.compact);

  const save = el('button', { class: 'btn btn-primary', type: 'button', text: 'Save preferences',
    onClick: () => {
      savePrefs({
        landing: landing.value,
        period: period.value,
        aiDigest: digest.querySelector('input').checked,
        compact: compact.querySelector('input').checked,
      });
      const chosen = PERIODS.find((x) => x.key === period.value);
      if (chosen) setPeriod(chosen);
      status.textContent = 'Saved to this browser.';
    } });

  const status = el('span', { class: 'text-xs text-muted', role: 'status' });

  root.append(card('Profile', el('div', { class: 'grid-2' }, [
    field('Name',  el('input', { class: 'input', value: cfg.tenant.userName ?? '', disabled: true })),
    field('Email', el('input', { class: 'input', value: cfg.tenant.userEmail ?? '', disabled: true }),
          'Managed by your identity provider'),
  ])));

  root.append(card('Display', el('div', {}, [
    el('div', { class: 'grid-2' }, [
      field('Landing view', landing),
      field('Default period', period),
    ]),
    digest,
    compact,
  ]), {
    action: el('div', { class: 'flex items-center gap-2' }, [status, save]),
  }));

  root.append(card('Locale', el('div', { class: 'grid-3' }, [
    field('Locale',   el('input', { class: 'input', value: cfg.locale.locale, disabled: true })),
    field('Currency', el('input', { class: 'input', value: cfg.locale.currency, disabled: true })),
    field('Timezone', el('input', { class: 'input', value: cfg.locale.timezone, disabled: true })),
  ]), { action: el('span', { class: 'text-xs text-muted', text: 'Tenant-level — change in Admin' }) }));

  root.append(stateBlock('partial', 'Stored in this browser only',
    'Preferences persist per browser until the adapter gains a write path.'));
}

export default {
  mount(root) { render(root); },
  unmount() {},
};
