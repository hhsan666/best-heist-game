// Vision cones shared by guards and cameras: the polygon the renderer fills, and the test of
// whether a point (the thief) stands inside it with nothing in between.

import { castRay, smokeHit, clearSight } from '../world/raycast.js';
import { isShadowAt } from '../world/tilemap.js';
import { GUARD } from '../config.js';

const RAYS = 44;

// Fan of points outlining what an eye at (x, y) facing `facing` sees within halfFov and range.
export function coneOutline(map, clouds, x, y, facing, halfFov, range) {
  const pts = [{ x, y }];
  for (let i = 0; i <= RAYS; i++) {
    const a = facing - halfFov + (2 * halfFov * i) / RAYS;
    const wall = castRay(map, x, y, a, range);
    const d = Math.min(wall, smokeHit(clouds, x, y, a));
    pts.push({ x: x + Math.cos(a) * d, y: y + Math.sin(a) * d });
  }
  return pts;
}

export function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

// How clearly the eye sees the target: 0 when not at all, up to 1 when close and dead ahead.
// Shadow tiles hide the target unless the eye is within GUARD.shadowRange.
export function sightStrength(map, clouds, eye, target) {
  const dx = target.x - eye.x;
  const dy = target.y - eye.y;
  const dist = Math.hypot(dx, dy);
  if (dist > eye.range) return 0;
  if (Math.abs(angleDiff(Math.atan2(dy, dx), eye.facing)) > eye.halfFov) return 0;
  if (isShadowAt(map, target.x, target.y) && dist > GUARD.shadowRange) return 0;
  if (!clearSight(map, clouds, eye.x, eye.y, target.x, target.y)) return 0;
  return 1 - 0.75 * (dist / eye.range);
}
