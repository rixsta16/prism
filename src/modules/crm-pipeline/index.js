export default {
  id: 'crm-pipeline',
  nav: [{ label: 'CRM + Pipeline', route: '#/modules/crm-pipeline' }],
  routes: { '#/modules/crm-pipeline': () => import('./view.js') },
  mount() {},
  unmount() {},
};
