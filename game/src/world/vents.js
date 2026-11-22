// Air vents: paired grates that make another route through a room. Press E on a grate to crawl
// to its twin; while crawling the thief is out of sight of every cone and camera.

import { TILE } from '../config.js';

export const CRAWL_TIME = 1.4;

export function createVents(defs) {
  return (defs ?? []).map(([ax, ay, bx, by], id) => ({
    id,
    a: { x: (ax + 0.5) * TILE, y: (ay + 0.5) * TILE },
    b: { x: (bx + 0.5) * TILE, y: (by + 0.5) * TILE },
  }));
}

// The grate the thief stands on, with the far end it leads to, or null.
export function ventUnder(vents, x, y) {
  for (const v of vents) {
    if (Math.hypot(v.a.x - x, v.a.y - y) < 18) return { vent: v, from: v.a, to: v.b };
    if (Math.hypot(v.b.x - x, v.b.y - y) < 18) return { vent: v, from: v.b, to: v.a };
  }
  return null;
}

export function startCrawl(thief, entry) {
  thief.crawl = { from: entry.from, to: entry.to, t: 0 };
  thief.active = false;
}

// Advances a crawl; returns true on the frame the thief climbs out.
export function updateCrawl(thief, dt) {
  if (!thief.crawl) return false;
  thief.crawl.t += dt;
  if (thief.crawl.t < CRAWL_TIME) return false;
  thief.x = thief.crawl.to.x;
  thief.y = thief.crawl.to.y;
  thief.crawl = null;
  thief.active = true;
  return true;
}
