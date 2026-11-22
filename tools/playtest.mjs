// Headless playtest: an autopilot thief walks the shortest route to the loot, cracks it, and
// heads for the hatch, in every stage, sneaking or walking. It reports how each run ends, so a
// change to the guards or the maps that makes a stage unwinnable or trivial shows up at once.
//   node tools/playtest.mjs

import { createHeist, stepHeist } from '../game/src/heist/heist-session.js';
import { findPath, toTile } from '../game/src/world/pathfind.js';
import { tileCenter, isSolidAt } from '../game/src/world/tilemap.js';
import { STAGES } from '../game/src/levels/stages.js';
import { sightStrength } from '../game/src/stealth/vision-cone.js';
import { guardEye } from '../game/src/stealth/guard-ai.js';
import { cameraEye } from '../game/src/stealth/security-camera.js';

// Whether any guard or camera would see the thief standing at (x, y) right now.
function watched(h, x, y) {
  const spot = { x, y };
  return h.guards.some((g) => sightStrength(h.map, h.clouds, { ...guardEye(g), range: guardEye(g).range + 40, halfFov: guardEye(g).halfFov + 0.25 }, spot) > 0
    || Math.hypot(g.x - x, g.y - y) < 70)
    || h.cameras.some((c) => c.jammed === 0 && sightStrength(h.map, h.clouds, { ...cameraEye(c), halfFov: cameraEye(c).halfFov + 0.3 }, spot) > 0);
}

function autopilot(h, sneak, waitAt, cautious) {
  const held = new Set();
  const input = { held: (a) => held.has(a), pressed: () => false, mouse: { clicked: false, x: 0, y: 0 } };
  return {
    input,
    think() {
      held.clear();
      if (sneak) held.add('sneak');
      const goal = h.thief.carrying ? h.map.exit : h.map.loot;
      const lc = tileCenter(goal.x, goal.y);
      if (!h.thief.carrying && Math.hypot(lc.x - h.thief.x, lc.y - h.thief.y) < 30) { held.add('use'); return; }
      if (waitAt && h.time < waitAt) return;
      const path = findPath(h.map, toTile(h.thief.x, h.thief.y), goal);
      const next = path[0] ? tileCenter(path[0].x, path[0].y) : lc;
      let dx = next.x - h.thief.x;
      let dy = next.y - h.thief.y;
      if (cautious) {
        // local planner: of eight short steps (and standing still), take the unwatched one that
        // gets closest to the next waypoint; if every one is watched, keep going
        let best = null;
        for (let k = -1; k < 8; k++) {
          const sx = k < 0 ? 0 : Math.cos((k * Math.PI) / 4) * 28;
          const sy = k < 0 ? 0 : Math.sin((k * Math.PI) / 4) * 28;
          const px = h.thief.x + sx;
          const py = h.thief.y + sy;
          if (isSolidAt(h.map, px, py) || watched(h, px, py)) continue;
          const d = Math.hypot(next.x - px, next.y - py) + (k < 0 ? 4 : 0);
          if (!best || d < best.d) best = { d, sx, sy };
        }
        if (best) { if (best.sx === 0 && best.sy === 0) return; dx = best.sx; dy = best.sy; }
      }
      if (dx > 3) held.add('right');
      if (dx < -3) held.add('left');
      if (dy > 3) held.add('down');
      if (dy < -3) held.add('up');
    },
  };
}

for (let s = 0; s < STAGES.length; s++) {
  for (const [sneak, cautious] of [[true, true], [true, false], [false, false]]) {
    for (const wait of [0, 4, 8]) {
      const h = createHeist(s);
      const pilot = autopilot(h, sneak, wait, cautious);
      const dt = 1 / 120;
      let heard = 0;
      while (!h.outcome && h.time < 240) {
        pilot.think();
        const ev = stepHeist(h, pilot.input, dt);
        heard += ev.filter((e) => e.type === 'heard').length;
      }
      console.log(`${STAGES[s].id.padEnd(7)} ${cautious ? 'careful' : sneak ? 'sneak  ' : 'walk   '} wait ${wait}s -> ${String(h.outcome).padEnd(9)} t=${h.time.toFixed(1)}s spotted=${h.spottedCount} peak=${Math.round(h.alarm.peak)} heard=${heard}`);
    }
  }
}
