// Headless playtest: an autopilot thief walks the shortest route to the loot, cracks it, and
// heads for the hatch, in every stage, sneaking or walking. It reports how each run ends, so a
// change to the guards or the maps that makes a stage unwinnable or trivial shows up at once.
//   node tools/playtest.mjs

import { createHeist, stepHeist } from '../game/src/heist/heist-session.js';
import { findPath, toTile } from '../game/src/world/pathfind.js';
import { tileCenter } from '../game/src/world/tilemap.js';
import { STAGES } from '../game/src/levels/stages.js';

function autopilot(h, sneak, waitAt) {
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
      const dx = next.x - h.thief.x;
      const dy = next.y - h.thief.y;
      if (dx > 3) held.add('right');
      if (dx < -3) held.add('left');
      if (dy > 3) held.add('down');
      if (dy < -3) held.add('up');
    },
  };
}

for (let s = 0; s < STAGES.length; s++) {
  for (const sneak of [true, false]) {
    for (const wait of [0, 4, 8]) {
      const h = createHeist(s);
      const pilot = autopilot(h, sneak, wait);
      const dt = 1 / 120;
      let heard = 0;
      while (!h.outcome && h.time < 240) {
        pilot.think();
        const ev = stepHeist(h, pilot.input, dt);
        heard += ev.filter((e) => e.type === 'heard').length;
      }
      console.log(`${STAGES[s].id.padEnd(7)} ${sneak ? 'sneak' : 'walk '} wait ${wait}s -> ${String(h.outcome).padEnd(9)} t=${h.time.toFixed(1)}s spotted=${h.spottedCount} peak=${Math.round(h.alarm.peak)} heard=${heard}`);
    }
  }
}
