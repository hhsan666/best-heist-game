// Casing the room: each guard's beat drawn as a dotted loop with direction chevrons, and each
// camera's sweep as a faint arc. Always faint on the floor; bright while the player holds Q.

import { TILE, COLORS, CAMERA } from '../config.js';
import { findPath } from '../world/pathfind.js';

function routeLine(h, g) {
  if (g.routeLine) return g.routeLine;
  const pts = [];
  for (let i = 0; i < g.route.length; i++) {
    const a = g.route[i];
    const b = g.route[(i + 1) % g.route.length];
    const leg = findPath(h.map, { x: a[0], y: a[1] }, { x: b[0], y: b[1] });
    if (i === 0) pts.push({ x: (a[0] + 0.5) * TILE, y: (a[1] + 0.5) * TILE });
    for (const n of leg) pts.push({ x: (n.x + 0.5) * TILE, y: (n.y + 0.5) * TILE });
  }
  g.routeLine = pts;
  return pts;
}

export function drawPatrols(ctx, h, time, casing) {
  const alpha = casing ? 0.85 : 0.22;
  for (const g of h.guards) {
    const pts = routeLine(h, g);
    ctx.strokeStyle = `rgba(255,205,90,${alpha})`;
    ctx.lineWidth = casing ? 2.5 : 1.5;
    ctx.setLineDash([3, 7]);
    ctx.lineDashOffset = -time * 14;
    ctx.beginPath();
    pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
    ctx.stroke();
    ctx.setLineDash([]);
    if (casing) {
      // chevrons every few tiles pointing along the beat
      ctx.fillStyle = 'rgba(255,205,90,0.9)';
      for (let i = 2; i < pts.length; i += 3) {
        const p = pts[i];
        const q = pts[i - 1];
        const a = Math.atan2(p.y - q.y, p.x - q.x);
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(a);
        ctx.beginPath();
        ctx.moveTo(5, 0); ctx.lineTo(-4, -5); ctx.lineTo(-4, 5);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
    }
  }
  if (!casing) return;
  for (const cam of h.cameras) {
    ctx.strokeStyle = 'rgba(255,90,160,0.75)';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 6]);
    ctx.beginPath();
    ctx.arc(cam.x, cam.y, CAMERA.range * 0.92, cam.baseAngle - cam.sweep - CAMERA.fov, cam.baseAngle + cam.sweep + CAMERA.fov);
    ctx.stroke();
    ctx.setLineDash([]);
  }
}

export function drawCasingLabel(ctx) {
  ctx.font = 'bold 14px Verdana, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const msg = 'CASING THE ROOM: yellow = guard beats, pink = camera sweeps, teal = vents';
  const w = ctx.measureText(msg).width + 28;
  ctx.fillStyle = 'rgba(8,10,20,0.85)';
  ctx.fillRect(480 - w / 2, 8, w, 26);
  ctx.fillStyle = COLORS.loot;
  ctx.fillText(msg, 480, 22);
}
