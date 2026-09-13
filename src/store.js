// Normalised in-memory store plus a subscribe/notify pair.
// Views read from here; they never call an adapter directly.

const state = {
  status:  'idle',        // idle | loading | ready | empty | error | partial
  error:   null,
  warning: null,          // set when some sources loaded and others did not
  period:  { key: 'all', from: null, to: null, label: 'All' },
  clients: [],
  records: [],
  deals:   [],
  modules: {},            // namespaced module slices
};

const subscribers = new Set();

export function getState() {
  return state;
}

export function subscribe(fn) {
  subscribers.add(fn);
  return () => subscribers.delete(fn);
}

function notify() {
  for (const fn of subscribers) fn(state);
}

export function setStatus(status, { error = null, warning = null } = {}) {
  state.status = status;
  state.error = error;
  state.warning = warning;
  notify();
}

export function setData({ clients = [], records = [], deals = [] }) {
  state.clients = clients;
  state.records = records;
  state.deals = deals;
  state.status = clients.length || records.length || deals.length ? 'ready' : 'empty';
  notify();
}

export function setModuleData(id, data) {
  state.modules[id] = data;
  notify();
}

export function setPeriod(period) {
  state.period = period;
  notify();
}
