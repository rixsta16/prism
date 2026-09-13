// Small DOM helpers. All text from the data layer goes in via textContent —
// client names and record references are untrusted input.

export function el(tag, props = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (v == null || v === false) continue;
    if (k === 'class') node.className = v;
    else if (k === 'text') node.textContent = v;
    else if (k === 'html') node.innerHTML = v;          // literals only, never data
    else if (k.startsWith('on')) node.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === 'dataset') Object.assign(node.dataset, v);
    else node.setAttribute(k, v === true ? '' : v);
  }
  for (const child of [].concat(children)) {
    if (child == null || child === false) continue;
    node.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return node;
}

export function card(title, body, { action = null, flush = false } = {}) {
  const header = title
    ? el('div', { class: 'card-header' }, [
        el('span', { class: 'card-title', text: title }),
        action,
      ])
    : null;
  return el('div', { class: 'card' }, [
    header,
    el('div', { class: flush ? 'card-body-flush' : 'card-body' }, body),
  ]);
}

export function state(kind, title, detail, action = null) {
  const icon = { loading: '·', empty: '○', error: '!', partial: '⚠' }[kind] ?? '○';
  return el('div', { class: `state state-${kind}`, role: kind === 'error' ? 'alert' : null }, [
    el('div', { class: 'state-icon', 'aria-hidden': 'true', text: icon }),
    el('div', { class: 'state-title', text: title }),
    detail ? el('div', { text: detail }) : null,
    action,
  ]);
}

export function skeletonLines(n = 4) {
  return el('div', {}, Array.from({ length: n }, (_, i) =>
    el('div', { class: 'skeleton skeleton-line', style: `width:${100 - i * 12}%` })
  ));
}

export function badge(status, label) {
  const map = {
    complete: 'green', in_progress: 'blue', awaiting: 'amber',
    overdue: 'red', draft: 'muted',
    won: 'green', lost: 'red', active: 'green', dormant: 'muted', archived: 'muted',
  };
  return el('span', { class: `badge badge-${map[status] ?? 'muted'}`, text: label });
}

export function table(columns, rows) {
  const head = el('tr', {}, columns.map((c) =>
    el('th', { text: c.label, style: c.align === 'right' ? 'text-align:right' : null })
  ));
  const body = rows.map((row) =>
    el('tr', {}, columns.map((c) => {
      const cell = el('td', {
        class: c.cellClass ?? null,
        style: c.align === 'right' ? 'text-align:right' : null,
      });
      const v = c.render(row);
      cell.append(v instanceof Node ? v : document.createTextNode(String(v ?? '—')));
      return cell;
    }))
  );
  return el('div', { class: 'table-scroll' }, [
    el('table', { class: 'data-table' }, [
      el('thead', {}, [head]),
      el('tbody', {}, body),
    ]),
  ]);
}

export function tabs(items, activeKey, onSelect) {
  return el('div', { class: 'tabs', role: 'tablist' }, items.map((item) =>
    el('button', {
      class: 'tab',
      type: 'button',
      role: 'tab',
      id: `tab-${item.key}`,
      'aria-selected': String(item.key === activeKey),
      text: item.label,
      onClick: () => onSelect(item.key),
    })
  ));
}

export function chartBox(id, height = 220) {
  return el('div', { class: 'chart-container', style: `height:${height}px` }, [
    el('canvas', { id }),
  ]);
}

export function pageTitle(title, subtitle) {
  document.getElementById('topbar-title').textContent = title;
  document.getElementById('topbar-subtitle').textContent = subtitle ?? '';
}

export function field(label, control, hint) {
  return el('div', { class: 'field' }, [
    el('label', { class: 'field-label', for: control.id || null, text: label }),
    control,
    hint ? el('div', { class: 'field-hint', text: hint }) : null,
  ]);
}

export function switchRow(label, desc, checked, { disabled = false } = {}) {
  const input = el('input', { type: 'checkbox', checked, disabled });
  return el('label', { class: 'switch' }, [
    el('div', { class: 'switch-label' }, [
      el('div', { text: label }),
      desc ? el('div', { class: 'switch-desc', text: desc }) : null,
    ]),
    input,
  ]);
}
