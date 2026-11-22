// Night lighting: the room sits in darkness and only the guards' flashlights, the cameras' beams
// and the loot's glow light the floor, so the danger reads as light and the safe ground as dark.

import { VIEW_W, MAP_H, TILE } from '../config.js';
import { tracePolygon } from './draw-cones.js';

let layer = null;
let lctx = null;

function ensureLayer(w, h) {
  if (!layer || layer.width !== w || layer.height !== h) {
    layer = document.createElement('canvas');
    layer.width = w;
    layer.height = h;
    lctx = layer.getContext('2d');
  }
}

function punchLight(x, y, radius, alpha) {
  const g = lctx.createRadialGradient(x, y, 0, x, y, radius);
  g.addColorStop(0, `rgba(0,0,0,${alpha})`);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  lctx.fillStyle = g;
  lctx.beginPath();
  lctx.arc(x, y, radius, 0, Math.PI * 2);
  lctx.fill();
}

export function drawDarkness(ctx, h, shapes, time) {
  const m = ctx.getTransform();
  const w = Math.max(1, Math.round(VIEW_W * m.a));
  const ht = Math.max(1, Math.round(MAP_H * m.d));
  ensureLayer(w, ht);
  lctx.setTransform(m.a, 0, 0, m.d, 0, 0);
  lctx.globalCompositeOperation = 'source-over';
  lctx.clearRect(0, 0, VIEW_W, MAP_H);
  lctx.fillStyle = 'rgba(2,4,14,0.5)';
  lctx.fillRect(0, 0, VIEW_W, MAP_H);
  lctx.globalCompositeOperation = 'destination-out';
  for (const s of shapes) {
    const g = lctx.createRadialGradient(s.eye.x, s.eye.y, 4, s.eye.x, s.eye.y, s.eye.range);
    g.addColorStop(0, 'rgba(0,0,0,0.95)');
    g.addColorStop(1, 'rgba(0,0,0,0.45)');
    lctx.fillStyle = g;
    tracePolygon(lctx, s.pts);
    lctx.fill();
  }
  const loot = h.map.loot;
  if (!h.thief.carrying) punchLight((loot.x + 0.5) * TILE, (loot.y + 0.5) * TILE, 90 + Math.sin(time * 3) * 6, 0.85);
  punchLight((h.map.exit.x + 0.5) * TILE, (h.map.exit.y + 0.5) * TILE, 70, 0.7);
  if (h.thief.active) punchLight(h.thief.x, h.thief.y, 46, 0.45);
  for (const g of h.guards) punchLight(g.x, g.y, 30, 0.6);
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, m.e, m.f);
  ctx.drawImage(layer, 0, 0);
  ctx.restore();
}
