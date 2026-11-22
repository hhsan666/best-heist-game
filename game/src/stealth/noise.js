// Noises: footsteps and thrown coins. Each ripple lives briefly so guards can hear it and the
// renderer can draw the ring; guards within its radius turn to investigate where it came from.

export function createNoiseField() {
  return { ripples: [] };
}

export function emitNoise(field, x, y, radius, kind) {
  field.ripples.push({ x, y, radius, kind, age: 0, life: kind === 'coin' ? 1.1 : 0.55, heard: false });
}

export function updateNoise(field, dt) {
  for (const r of field.ripples) r.age += dt;
  field.ripples = field.ripples.filter((r) => r.age < r.life);
}

// Ripples a listener at (x, y) hears this frame (each ripple is heard once, when it starts).
export function freshNoisesNear(field, x, y) {
  return field.ripples.filter((r) => !r.heard && Math.hypot(r.x - x, r.y - y) <= r.radius);
}

export function settleNoise(field) {
  for (const r of field.ripples) r.heard = true;
}
