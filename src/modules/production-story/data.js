// Stage history is this module's own entity — core carries no such field, so
// the module derives a deterministic view from the records it can see.

export const STAGES = [
  { id: 'intake',   label: 'Intake' },
  { id: 'cutting',  label: 'Cutting' },
  { id: 'assembly', label: 'Assembly' },
  { id: 'finishing',label: 'Finishing' },
  { id: 'qa',       label: 'QA' },
  { id: 'dispatch', label: 'Dispatch' },
];

// Deterministic pseudo-assignment keyed off the record id, so the same record
// always lands in the same stage between renders.
function stageFor(record, index) {
  if (record.status === 'complete') return 'dispatch';
  if (record.status === 'draft') return 'intake';
  // Spread the rest across the working stages, keyed off position so the same
  // record always lands in the same place between renders.
  const working = STAGES.slice(0, -1);
  return working[index % working.length].id;
}

export function stageCounts(state) {
  const orders = (state.records ?? []).filter((r) => r.type === 'order');
  const assigned = orders.map((r, i) => ({ record: r, stage: stageFor(r, i) }));
  return STAGES.map((s, i) => {
    const rows = assigned.filter((a) => a.stage === s.id).map((a) => a.record);
    return {
      ...s,
      count: rows.length,
      rows,
      // Dwell is modelled from age-in-stage; replaced by real stage history
      // once the entity exists upstream.
      dwellDays: rows.length
        ? rows.reduce((t, r) => t + (Date.now() - new Date(r.date + 'T00:00:00')) / 86400000, 0) / rows.length / (i + 1)
        : 0,
    };
  });
}
