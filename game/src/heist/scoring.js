// The take and the crew's verdict on a finished stage: loot value, minus what the kit cost,
// minus heat for every time a guard saw you, plus a bonus for beating the stage's par time.

export function scoreStage(h) {
  const escaped = h.outcome === 'escaped';
  const loot = escaped ? h.stage.loot.value : 0;
  const heat = h.spottedCount * 150 + Math.round(h.alarm.peak) * 4;
  const speed = escaped ? Math.max(0, Math.round((h.stage.par - h.time) * 10)) : 0;
  const take = escaped ? Math.max(0, loot - h.kit.spent - heat + speed) : 0;
  return {
    escaped,
    loot,
    toolCost: h.kit.spent,
    heat,
    speed,
    take,
    time: h.time,
    spotted: h.spottedCount,
    peak: Math.round(h.alarm.peak),
    rank: rankOf(h),
  };
}

export function rankOf(h) {
  if (h.outcome !== 'escaped') return h.outcome === 'caught' ? 'NABBED' : 'LOCKED IN';
  if (h.spottedCount === 0 && h.alarm.peak < 15) return 'GHOST';
  if (h.spottedCount === 0) return 'SHADOW';
  if (h.alarm.peak < 60) return 'PRO';
  return 'LOUD';
}

export function formatTime(t) {
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function money(n) {
  return `$${n.toLocaleString('en-US')}`;
}
