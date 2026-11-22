// Line of sight: grid ray marching against walls and crates, plus smoke clouds that swallow rays.

import { TILE } from '../config.js';
import { isSolidTile } from './tilemap.js';

// Distance a ray from (ox, oy) along angle travels before a solid tile, up to maxDist (DDA walk).
export function castRay(map, ox, oy, angle, maxDist) {
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  let tx = Math.floor(ox / TILE);
  let ty = Math.floor(oy / TILE);
  const stepX = dx > 0 ? 1 : -1;
  const stepY = dy > 0 ? 1 : -1;
  const tDeltaX = dx === 0 ? Infinity : Math.abs(TILE / dx);
  const tDeltaY = dy === 0 ? Infinity : Math.abs(TILE / dy);
  let tMaxX = dx === 0 ? Infinity : ((dx > 0 ? (tx + 1) * TILE - ox : ox - tx * TILE) / Math.abs(dx));
  let tMaxY = dy === 0 ? Infinity : ((dy > 0 ? (ty + 1) * TILE - oy : oy - ty * TILE) / Math.abs(dy));
  let dist = 0;
  while (dist < maxDist) {
    if (tMaxX < tMaxY) { dist = tMaxX; tMaxX += tDeltaX; tx += stepX; }
    else { dist = tMaxY; tMaxY += tDeltaY; ty += stepY; }
    if (dist >= maxDist) return maxDist;
    if (isSolidTile(map, tx, ty)) return dist;
  }
  return maxDist;
}

// Distance at which the ray first enters any smoke cloud, or Infinity.
export function smokeHit(clouds, ox, oy, angle) {
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  let best = Infinity;
  for (const c of clouds) {
    const fx = ox - c.x;
    const fy = oy - c.y;
    const b = fx * dx + fy * dy;
    const cc = fx * fx + fy * fy - c.r * c.r;
    if (cc < 0) return 0; // the eye is inside the smoke
    const disc = b * b - cc;
    if (disc < 0) continue;
    const t = -b - Math.sqrt(disc);
    if (t > 0 && t < best) best = t;
  }
  return best;
}

export function clearSight(map, clouds, ax, ay, bx, by) {
  const dist = Math.hypot(bx - ax, by - ay);
  const angle = Math.atan2(by - ay, bx - ax);
  if (castRay(map, ax, ay, angle, dist) < dist - 1) return false;
  return smokeHit(clouds, ax, ay, angle) >= dist;
}
