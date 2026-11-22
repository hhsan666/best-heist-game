// The night's score: a low two-note pulse and a soft bell motif, both generated on the fly.
// Tension follows the alarm: the pulse quickens and climbs as the meter fills.

import { audioContext, masterBus, sfx } from './sfx.js';

const MOTIF = [0, 3, 7, 10, 7, 3, 5, 2];
let nextBeat = 0;
let beat = 0;
let sirenTimer = 0;

function pluck(freq, when, gain, type = 'sine', dur = 0.5) {
  const ac = audioContext();
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, when);
  g.gain.exponentialRampToValueAtTime(gain, when + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
  o.connect(g).connect(masterBus());
  o.start(when);
  o.stop(when + dur + 0.05);
}

// Called every frame while a heist runs; tension is the alarm level from 0 to 100.
export function updateAmbience(dt, tension, playing) {
  const ac = audioContext();
  if (!ac || !playing) return;
  const now = ac.currentTime;
  const interval = 0.42 - Math.min(0.2, tension / 500);
  if (nextBeat < now) nextBeat = now + 0.05;
  while (nextBeat < now + 0.15) {
    const root = tension > 60 ? 55 * 2 ** (1 / 12) : 55;
    pluck(beat % 2 ? root * 1.5 : root, nextBeat, 0.09, 'triangle', 0.35);
    if (beat % 4 === 0) {
      const n = MOTIF[(beat / 4) % MOTIF.length];
      pluck(440 * 2 ** (n / 12), nextBeat, 0.025, 'sine', 1.2);
    }
    beat++;
    nextBeat += interval;
  }
  if (tension > 60) {
    sirenTimer -= dt;
    if (sirenTimer <= 0) { sfx.siren(tension); sirenTimer = 0.9; }
  }
}

const stepTimers = new Map();
let heartTimer = 0;

// Close-quarters sound: a heartbeat that quickens as any guard's suspicion climbs, and the
// footfalls of guards near the thief, louder the closer they walk.
export function updateTension(dt, h) {
  if (!audioContext() || !h.thief.active) return;
  const worry = Math.max(0, ...h.guards.map((g) => (g.state === 'chase' ? 1 : g.suspicion)));
  if (worry > 0.12) {
    heartTimer -= dt;
    if (heartTimer <= 0) {
      sfx.heartbeat(0.05 + worry * 0.12);
      heartTimer = 0.95 - worry * 0.5;
    }
  }
  for (const g of h.guards) {
    const d = Math.hypot(g.x - h.thief.x, g.y - h.thief.y);
    if (d > 280 || g.pause > 0 || g.state === 'suspicious') continue;
    const t = (stepTimers.get(g) ?? 0) - dt;
    if (t <= 0) {
      sfx.guardStep(0.13 * (1 - d / 280));
      stepTimers.set(g, g.state === 'chase' ? 0.26 : 0.5);
    } else stepTimers.set(g, t);
  }
}
