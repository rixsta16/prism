// Motion primitives, adapted from the patterns in dqnamo.com/kitchen.
//
// Every one of these is decorative. The rule across this folder: the page must
// read correctly with all of it switched off. Each primitive checks
// prefers-reduced-motion and jumps straight to its final state when set, and
// each returns a stop() so a view can tear it down on unmount.

export const reducedMotion = () =>
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789£$%#@&*+=<>/\\';

// Scramble a node's text from its current value to `next`.
// The node keeps an aria-label of the final value throughout, so assistive
// tech reads the number once rather than announcing every frame of noise.
export function scrambleTo(node, next, { duration = 420, fps = 24 } = {}) {
  const final = String(next);
  node.setAttribute('aria-label', final);

  if (reducedMotion() || !node.isConnected) {
    node.textContent = final;
    return () => {};
  }

  const from = node.textContent ?? '';
  const frames = Math.max(1, Math.round((duration / 1000) * fps));
  // Digits scramble as digits and letters as letters, so the string keeps its
  // shape and the layout never jumps mid-animation.
  const pool = (ch) => (/\d/.test(ch) ? '0123456789' : GLYPHS);
  let frame = 0;
  let timer = null;

  const stop = () => { clearInterval(timer); timer = null; };

  timer = setInterval(() => {
    frame += 1;
    const progress = frame / frames;
    if (progress >= 1 || !node.isConnected) {
      node.textContent = final;
      stop();
      return;
    }
    const settled = Math.floor(final.length * progress);
    let out = '';
    for (let i = 0; i < final.length; i++) {
      const ch = final[i];
      if (i < settled || ch === ' ' || ch === ',' || ch === '.') out += ch;
      else if (/[£$%A-Za-z0-9]/.test(ch)) {
        const p = pool(ch);
        out += p[Math.floor(Math.random() * p.length)];
      } else out += ch;
    }
    node.textContent = out || from;
  }, 1000 / fps);

  return stop;
}

// Swap a button's label while animating its width, so the control grows and
// shrinks around the new text instead of snapping.
export function morphLabel(button, labelNode, next) {
  const final = String(next);
  if (reducedMotion()) {
    labelNode.textContent = final;
    button.style.width = '';
    return;
  }

  const before = button.getBoundingClientRect().width;
  labelNode.textContent = final;
  button.style.width = '';
  const after = button.getBoundingClientRect().width;

  if (Math.abs(after - before) < 1) return;

  button.style.width = `${before}px`;
  // Force a reflow so the browser has the start width before the transition.
  void button.offsetWidth;
  button.style.transition = 'width 0.22s cubic-bezier(0.2, 0, 0, 1)';
  button.style.width = `${after}px`;

  const done = () => {
    button.style.width = '';
    button.style.transition = '';
    button.removeEventListener('transitionend', done);
  };
  button.addEventListener('transitionend', done);
}

// Fade the top and bottom edges of a scrollable element, but only on the side
// that actually has content out of view — a fade with nothing behind it reads
// as a rendering bug.
export function scrollFade(node) {
  const update = () => {
    const { scrollTop, scrollHeight, clientHeight } = node;
    node.classList.toggle('faded-top', scrollTop > 4);
    node.classList.toggle('faded-bottom', scrollTop + clientHeight < scrollHeight - 4);
  };

  node.classList.add('scroll-fade');
  node.addEventListener('scroll', update, { passive: true });

  const observer = new ResizeObserver(update);
  observer.observe(node);
  update();

  return () => {
    node.removeEventListener('scroll', update);
    observer.disconnect();
  };
}

// Tie the iridescent sheen on an element to pointer position. The element
// paints a static gradient without this; the listener only moves it.
export function foil(node) {
  if (reducedMotion() || window.matchMedia?.('(pointer: coarse)').matches) return () => {};

  const onMove = (e) => {
    const r = node.getBoundingClientRect();
    node.style.setProperty('--foil-x', `${((e.clientX - r.left) / r.width) * 100}%`);
    node.style.setProperty('--foil-y', `${((e.clientY - r.top) / r.height) * 100}%`);
  };
  const onLeave = () => {
    node.style.removeProperty('--foil-x');
    node.style.removeProperty('--foil-y');
  };

  node.addEventListener('pointermove', onMove);
  node.addEventListener('pointerleave', onLeave);
  return () => {
    node.removeEventListener('pointermove', onMove);
    node.removeEventListener('pointerleave', onLeave);
  };
}
