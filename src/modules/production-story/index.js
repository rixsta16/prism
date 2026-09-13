import { el } from '../../ui.js';
import { STAGES, stageCounts } from './data.js';

export default {
  id: 'production-story',
  nav: [{ label: 'Production Story', route: '#/modules/production-story' }],
  routes: { '#/modules/production-story': () => import('./view.js') },
  widgets: [{
    slot: 'overview:after-charts',
    render(state) {
      const counts = stageCounts(state);
      const worst = counts.reduce((a, b) => (b.dwellDays > a.dwellDays ? b : a), counts[0]);
      return el('div', { class: 'card' }, [
        el('div', { class: 'card-header' }, [
          el('span', { class: 'card-title', text: 'Production flow' }),
          el('a', { class: 'btn btn-ghost', href: '#/modules/production-story',
                    style: 'font-size:12px;padding:4px 10px', text: 'Open module' }),
        ]),
        el('div', { class: 'card-body' }, [
          el('div', { class: 'pipeline' }, counts.map((c) =>
            el('div', { class: `pipeline-stage${c.id === worst.id ? ' bottleneck' : ''}` }, [
              el('div', { class: 'pipeline-count', text: String(c.count) }),
              el('div', { class: 'pipeline-name', text: c.label }),
              el('div', { class: 'pipeline-dwell', text: `${c.dwellDays.toFixed(1)}d dwell` }),
            ])
          )),
        ]),
      ]);
    },
  }],
  mount() {},
  unmount() {},
};

export { STAGES };
