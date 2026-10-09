// Traces the Prism mark, then resolves into the filled logo and hands over to
// the app. It covers the gap between first paint and the adapter's first
// response — a gap that previously showed an empty shell.
//
// It is a floor, not a gate: if the data arrives faster than the trace, the
// loader still plays its minimum and leaves. If boot fails, app.js calls
// fail() and the loader gets out of the way so the error is visible.

import { el, reducedMotion } from './dom.js';

const MIN_VISIBLE_MS = 650;   // long enough to read as deliberate, not a flash

export function startBootLoader() {
  const shown = performance.now();

  const svg = `
    <svg viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <polygon class="trace-fill" points="14,14 27,24 1,24" />
      <polygon class="trace-line" points="14,3 27,24 1,24"
               fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
      <line class="trace-line trace-line-2" x1="14" y1="3" x2="14" y2="24"
            stroke="currentColor" stroke-width="1"/>
      <line class="trace-line trace-line-3" x1="14" y1="14" x2="27" y2="24"
            stroke="currentColor" stroke-width="1"/>
    </svg>`;

  const overlay = el('div', {
    class: `boot-loader${reducedMotion() ? ' boot-loader-static' : ''}`,
    role: 'status',
    'aria-live': 'polite',
  }, [
    el('div', { class: 'boot-mark', html: svg }),
    el('div', { class: 'boot-label', text: 'Loading your dashboard' }),
  ]);

  document.body.append(overlay);

  let settled = false;

  const dismiss = () => {
    if (settled) return;
    settled = true;
    const wait = Math.max(0, MIN_VISIBLE_MS - (performance.now() - shown));
    setTimeout(() => {
      overlay.classList.add('boot-loader-out');
      overlay.addEventListener('transitionend', () => overlay.remove(), { once: true });
      // Belt and braces: if the transition never fires, still clear the overlay.
      setTimeout(() => overlay.remove(), 600);
    }, reducedMotion() ? 0 : wait);
  };

  return {
    done: dismiss,
    // On a failed boot there is nothing to wait for — leave immediately so the
    // error message underneath is not hidden behind a loading state.
    fail() {
      settled = true;
      overlay.remove();
    },
  };
}
