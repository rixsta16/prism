// Placeholder data. This is the scaffold's hardcoded set — moved out of the
// markup, not invented again. Swap `dataSource.adapter` to use a real source.

const DAY = 86400000;
const iso = (offsetDays) => new Date(Date.now() - offsetDays * DAY).toISOString().slice(0, 10);

const CLIENTS = [
  { id: 'c1', name: 'Acme Ltd',          email: 'ops@acme.example',    status: 'active',  createdAt: iso(420), tags: ['manufacturing'] },
  { id: 'c2', name: 'Beta Corp',         email: 'ap@beta.example',     status: 'active',  createdAt: iso(360), tags: ['retail'] },
  { id: 'c3', name: 'Gamma Works',       email: 'hello@gamma.example', status: 'active',  createdAt: iso(300), tags: ['fabrication'] },
  { id: 'c4', name: 'Delta Services',    email: 'team@delta.example',  status: 'active',  createdAt: iso(240), tags: ['services'] },
  { id: 'c5', name: 'Echo Industries',   email: 'buy@echo.example',    status: 'active',  createdAt: iso(180), tags: ['manufacturing'] },
  { id: 'c6', name: 'Foxtrot Fittings',  email: 'acc@foxtrot.example', status: 'dormant', createdAt: iso(700), tags: ['fabrication'] },
];

// value is in minor units (pence).
const RECORDS = [
  { id: '0001', clientId: 'c1', type: 'order',   value: 120000, date: iso(3),  dueDate: null,     status: 'complete' },
  { id: '0002', clientId: 'c2', type: 'invoice', value: 350000, date: iso(4),  dueDate: iso(-26), status: 'awaiting' },
  { id: '0003', clientId: 'c3', type: 'order',   value:  80000, date: iso(5),  dueDate: iso(2),   status: 'in_progress' },
  { id: '0004', clientId: 'c4', type: 'quote',   value: 500000, date: iso(6),  dueDate: null,     status: 'in_progress' },
  { id: '0005', clientId: 'c5', type: 'order',   value: 210000, date: iso(7),  dueDate: null,     status: 'complete' },
  { id: '0006', clientId: 'c1', type: 'invoice', value: 610000, date: iso(9),  dueDate: iso(-21), status: 'complete' },
  { id: '0007', clientId: 'c2', type: 'order',   value:  45000, date: iso(11), dueDate: null,     status: 'draft' },
  { id: '0008', clientId: 'c3', type: 'invoice', value: 155000, date: iso(14), dueDate: iso(4),   status: 'awaiting' },
  { id: '0009', clientId: 'c5', type: 'invoice', value: 520000, date: iso(18), dueDate: iso(-12), status: 'complete' },
  { id: '0010', clientId: 'c4', type: 'order',   value:  96000, date: iso(21), dueDate: iso(6),   status: 'in_progress' },
  { id: '0011', clientId: 'c1', type: 'invoice', value: 480000, date: iso(26), dueDate: iso(-4),  status: 'complete' },
  { id: '0012', clientId: 'c6', type: 'invoice', value:  72000, date: iso(31), dueDate: iso(10),  status: 'awaiting' },
  { id: '0013', clientId: 'c2', type: 'invoice', value: 550000, date: iso(35), dueDate: iso(5),   status: 'complete' },
  { id: '0014', clientId: 'c3', type: 'order',   value: 132000, date: iso(38), dueDate: null,     status: 'complete' },
  { id: '0015', clientId: 'c5', type: 'invoice', value: 420000, date: iso(44), dueDate: iso(14),  status: 'complete' },
  { id: '0016', clientId: 'c4', type: 'order',   value:  67000, date: iso(49), dueDate: null,     status: 'complete' },
  { id: '0017', clientId: 'c1', type: 'invoice', value: 510000, date: iso(53), dueDate: iso(23),  status: 'complete' },
  { id: '0018', clientId: 'c2', type: 'order',   value:  88000, date: iso(58), dueDate: null,     status: 'complete' },
  { id: '0019', clientId: 'c3', type: 'invoice', value: 460000, date: iso(62), dueDate: iso(32),  status: 'complete' },
  { id: '0020', clientId: 'c5', type: 'order',   value: 143000, date: iso(67), dueDate: null,     status: 'complete' },
  { id: '0021', clientId: 'c1', type: 'invoice', value: 410000, date: iso(72), dueDate: iso(42),  status: 'complete' },
  { id: '0022', clientId: 'c4', type: 'invoice', value: 380000, date: iso(79), dueDate: iso(49),  status: 'complete' },
  { id: '0023', clientId: 'c2', type: 'order',   value:  59000, date: iso(84), dueDate: null,     status: 'complete' },
];

const DEALS = [
  { id: 'd1', clientId: 'c1',  stage: 'negotiation', value: 850000,  probability: 70, expectedClose: iso(-20) },
  { id: 'd2', clientId: 'c3',  stage: 'proposal',    value: 420000,  probability: 45, expectedClose: iso(-35) },
  { id: 'd3', clientId: null,  stage: 'lead',        value: 150000,  probability: 10, expectedClose: null },
  { id: 'd4', clientId: 'c4',  stage: 'qualified',   value: 300000,  probability: 30, expectedClose: iso(-50) },
  { id: 'd5', clientId: 'c5',  stage: 'negotiation', value: 1200000, probability: 60, expectedClose: iso(-14) },
  { id: 'd6', clientId: 'c2',  stage: 'won',         value: 550000,  probability: 100, expectedClose: iso(20) },
  { id: 'd7', clientId: 'c6',  stage: 'lost',        value: 200000,  probability: 0,  expectedClose: iso(30) },
  { id: 'd8', clientId: null,  stage: 'lead',        value: 90000,   probability: 10, expectedClose: null },
];

export default {
  id: 'mock',
  capabilities: { write: false, realtime: false, periods: ['week', 'month', 'quarter', 'custom'] },
  async fetch() {
    // Simulated latency so loading states are exercised in development.
    await new Promise((r) => setTimeout(r, 250));
    return { clients: CLIENTS, records: RECORDS, deals: DEALS };
  },
};
