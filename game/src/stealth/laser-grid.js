// Laser tripwires: beams that cycle on and off. Crossing a live beam trips it: a jolt on the
// alarm meter and the nearest guard sent to look. They flicker a warning just before they
// switch on, and a jammer knocks out any beam near where it is thrown.

import { TILE, ALARM } from '../config.js';
import { bumpAlarm } from './alarm-meter.js';

export const LASER_WARN = 0.45;
const TRIP_ALARM = 22;

export function createLaser(def, index) {
  return {
    id: index,
    ax: def.from[0] * TILE,
    ay: def.from[1] * TILE,
    bx: def.to[0] * TILE,
    by: def.to[1] * TILE,
    on: def.on,
    off: def.off,
    clock: def.phase ?? 0,
    live: false,
    warning: false,
    jammed: 0,
    cooldown: 0,
  };
}

function distToSegment(px, py, l) {
  const dx = l.bx - l.ax;
  const dy = l.by - l.ay;
  const t = Math.max(0, Math.min(1, ((px - l.ax) * dx + (py - l.ay) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(px - (l.ax + t * dx), py - (l.ay + t * dy));
}

export function updateLasers(lasers, ctx) {
  const { dt, thief, alarm, events } = ctx;
  for (const l of lasers) {
    l.cooldown = Math.max(0, l.cooldown - dt);
    l.jammed = Math.max(0, l.jammed - dt);
    l.clock = (l.clock + dt) % (l.on + l.off);
    const inOn = l.clock < l.on;
    l.live = inOn && l.jammed === 0;
    l.warning = !inOn && l.on + l.off - l.clock < LASER_WARN && l.jammed === 0;
    if (l.live && thief.active && l.cooldown === 0 && distToSegment(thief.x, thief.y, l) < 9) {
      l.cooldown = 2;
      bumpAlarm(alarm, TRIP_ALARM);
      events.push({ type: 'laser', x: thief.x, y: thief.y });
    }
  }
  void ALARM;
}

export function jamLasersNear(lasers, x, y, radius, seconds) {
  let hit = 0;
  for (const l of lasers) {
    if (distToSegment(x, y, l) <= radius) { l.jammed = seconds; hit++; }
  }
  return hit;
}
