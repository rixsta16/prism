// Placeholder data for demos and development.
//
// Generated from a fixed seed rather than hand-listed, so the set is large
// enough to exercise the real views — a month of paid invoices behind the
// MTD figure, enough rows for a table to scroll — while staying identical on
// every load. Swap `dataSource.adapter` to read from a real source.

const DAY = 86400000;
const iso = (offsetDays) => new Date(Date.now() - offsetDays * DAY).toISOString().slice(0, 10);

// mulberry32 — small deterministic PRNG. Same seed, same dashboard, always.
function rng(seed) {
  return function next() {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const CLIENTS = [
  { id: 'c1',  name: 'Acme Ltd',           email: 'ops@acme.example',      status: 'active',  tags: ['manufacturing'] },
  { id: 'c2',  name: 'Beta Corp',          email: 'ap@beta.example',       status: 'active',  tags: ['retail'] },
  { id: 'c3',  name: 'Gamma Works',        email: 'hello@gamma.example',   status: 'active',  tags: ['fabrication'] },
  { id: 'c4',  name: 'Delta Services',     email: 'team@delta.example',    status: 'active',  tags: ['services'] },
  { id: 'c5',  name: 'Echo Industries',    email: 'buy@echo.example',      status: 'active',  tags: ['manufacturing'] },
  { id: 'c6',  name: 'Foxtrot Fittings',   email: 'acc@foxtrot.example',   status: 'dormant', tags: ['fabrication'] },
  { id: 'c7',  name: 'Golf Components',    email: 'po@golf.example',       status: 'active',  tags: ['manufacturing'] },
  { id: 'c8',  name: 'Hotel Interiors',    email: 'pay@hotel.example',     status: 'active',  tags: ['services'] },
  { id: 'c9',  name: 'India Metalwork',    email: 'admin@india.example',   status: 'active',  tags: ['fabrication'] },
  { id: 'c10', name: 'Juliet Packaging',   email: 'office@juliet.example', status: 'dormant', tags: ['retail'] },
].map((c, i) => ({ ...c, createdAt: iso(400 - i * 28) }));

const TYPES = ['invoice', 'invoice', 'invoice', 'order', 'order', 'quote'];
const OPEN_STATUSES = ['in_progress', 'awaiting', 'draft'];

// Values are in minor units (pence) throughout.
function buildRecords() {
  const rand = rng(20260914);
  const rows = [];

  for (let i = 0; i < 140; i++) {
    const age = Math.floor(rand() * 90);
    const type = TYPES[Math.floor(rand() * TYPES.length)];
    const client = CLIENTS[Math.floor(rand() * CLIENTS.length)];

    // Older work has mostly settled; recent work is still moving. That keeps
    // the status mix plausible instead of uniformly random.
    const settled = rand() < (age > 30 ? 0.85 : 0.35);
    const status = settled ? 'complete' : OPEN_STATUSES[Math.floor(rand() * OPEN_STATUSES.length)];

    // dueDate in the past on an unsettled invoice is what makes it read as
    // overdue — derived at render time, never stored. See docs/DATA-MODEL.md.
    const dueDate = type === 'quote' ? null : iso(age - 30);

    rows.push({
      id: String(1000 + i),
      clientId: client.id,
      type,
      value: (Math.floor(rand() * 95) + 5) * 10000,   // £50 – £1,000
      date: iso(age),
      dueDate,
      status,
    });
  }

  return rows.sort((a, b) => (a.date < b.date ? 1 : -1));
}

const STAGES = ['lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost'];
const PROBABILITY = { lead: 10, qualified: 30, proposal: 45, negotiation: 70, won: 100, lost: 0 };

function buildDeals() {
  const rand = rng(77001);
  return Array.from({ length: 14 }, (_, i) => {
    const stage = STAGES[Math.floor(rand() * STAGES.length)];
    const client = rand() < 0.2 ? null : CLIENTS[Math.floor(rand() * CLIENTS.length)];
    return {
      id: `d${i + 1}`,
      clientId: client?.id ?? null,
      stage,
      value: (Math.floor(rand() * 180) + 20) * 10000,   // £200 – £2,000
      probability: PROBABILITY[stage],
      expectedClose: stage === 'lead' ? null : iso(-Math.floor(rand() * 60) - 5),
    };
  });
}

const RECORDS = buildRecords();
const DEALS = buildDeals();

export default {
  id: 'mock',
  capabilities: { write: false, realtime: false, periods: ['week', 'month', 'quarter', 'custom'] },
  async fetch() {
    // Simulated latency so loading states are exercised in development.
    await new Promise((r) => setTimeout(r, 250));
    return { clients: CLIENTS, records: RECORDS, deals: DEALS };
  },
};
