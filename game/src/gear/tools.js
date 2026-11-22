// The thief's kit, each use paid out of the take: a coin to throw as a lure, a smoke pellet that
// blinds cones, and a jammer that darkens nearby cameras. Aim with the mouse, click to use.

import { TOOLS } from '../config.js';
import { emitNoise } from '../stealth/noise.js';
import { jamCamerasNear } from '../stealth/security-camera.js';
import { clearSight } from '../world/raycast.js';
import { isSolidAt } from '../world/tilemap.js';

export const TOOL_ORDER = ['coin', 'smoke', 'jammer'];

export function createKit(kit) {
  return { counts: { ...kit }, selected: 'coin', spent: 0, used: { coin: 0, smoke: 0, jammer: 0 } };
}

export function createSmokeField() {
  return [];
}

export function updateSmoke(clouds, dt) {
  for (const c of clouds) {
    c.age += dt;
    const grow = Math.min(1, c.age / 0.5);
    const fade = c.age > c.life - 1 ? Math.max(0, c.life - c.age) : 1;
    c.r = c.maxR * grow * (0.6 + 0.4 * fade);
  }
  return clouds.filter((c) => c.age < c.life);
}

// Whether the tool can be used at (x, y) from the thief's spot, and why not when it cannot.
export function aimCheck(kit, thief, map, x, y) {
  const tool = TOOLS[kit.selected];
  if (kit.counts[kit.selected] <= 0) return { ok: false, why: 'none left' };
  if (Math.hypot(x - thief.x, y - thief.y) > tool.range) return { ok: false, why: 'out of reach' };
  if (kit.selected !== 'jammer' && (isSolidAt(map, x, y) || !clearSight(map, [], thief.x, thief.y, x, y))) return { ok: false, why: 'no clear throw' };
  return { ok: true, why: '' };
}

export function useTool(kit, ctx, x, y) {
  const { thief, map, noise, cameras, events } = ctx;
  const check = aimCheck(kit, thief, map, x, y);
  if (!check.ok) { events.push({ type: 'denied' }); return false; }
  const name = kit.selected;
  const tool = TOOLS[name];
  kit.counts[name] -= 1;
  kit.spent += tool.cost;
  kit.used[name] += 1;
  if (name === 'coin') {
    emitNoise(noise, x, y, tool.noiseRadius, 'coin');
    events.push({ type: 'coin', x, y });
  } else if (name === 'smoke') {
    ctx.clouds.push({ x, y, r: 0, maxR: tool.radius, age: 0, life: tool.life });
    events.push({ type: 'smoke', x, y });
  } else if (name === 'jammer') {
    const hit = jamCamerasNear(cameras, x, y, tool.radius);
    events.push({ type: 'jam', x, y, hit });
  }
  return true;
}
