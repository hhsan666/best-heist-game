// Each job has its own floor: the annex's gallery carpet, the bonded store's poured concrete and
// the atrium's veined marble. Floors are painted once into an offscreen layer and reused.

import { TILE, COLS, ROWS, VIEW_W, MAP_H } from '../config.js';
import { tileAt, WALL } from '../world/tilemap.js';

// Cheap repeatable noise from a tile position, so every floor looks the same on every visit.
function hash(x, y, k = 0) {
  let n = (x * 374761393 + y * 668265263 + k * 2147483647) | 0;
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}

const THEMES = {
  carpet(ctx, x, y) {
    const px = x * TILE;
    const py = y * TILE;
    ctx.fillStyle = (x + y) % 2 ? '#24384a' : '#213444';
    ctx.fillRect(px, py, TILE, TILE);
    ctx.strokeStyle = 'rgba(140,200,190,0.10)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(px + TILE / 2, py + 4); ctx.lineTo(px + TILE - 4, py + TILE / 2);
    ctx.lineTo(px + TILE / 2, py + TILE - 4); ctx.lineTo(px + 4, py + TILE / 2);
    ctx.closePath();
    ctx.stroke();
  },
  concrete(ctx, x, y) {
    const px = x * TILE;
    const py = y * TILE;
    const shade = 40 + Math.floor(hash(x, y) * 8);
    ctx.fillStyle = `rgb(${shade},${shade + 6},${shade + 20})`;
    ctx.fillRect(px, py, TILE, TILE);
    ctx.fillStyle = 'rgba(200,210,230,0.07)';
    for (let i = 0; i < 6; i++) ctx.fillRect(px + hash(x, y, i) * TILE, py + hash(y, x, i + 9) * TILE, 2, 2);
    if ((x + 2 * y) % 5 === 0) {
      ctx.strokeStyle = 'rgba(0,0,0,0.18)';
      ctx.beginPath();
      ctx.moveTo(px, py + TILE * hash(x, y, 3));
      ctx.lineTo(px + TILE, py + TILE * hash(x, y, 4));
      ctx.stroke();
    }
  },
  marble(ctx, x, y) {
    const px = x * TILE;
    const py = y * TILE;
    ctx.fillStyle = (x + y) % 2 ? '#3a3252' : '#342d4b';
    ctx.fillRect(px, py, TILE, TILE);
    ctx.strokeStyle = 'rgba(230,210,255,0.13)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    const y0 = py + hash(x, y) * TILE;
    ctx.moveTo(px, y0);
    ctx.quadraticCurveTo(px + TILE / 2, py + hash(x, y, 2) * TILE, px + TILE, y0 + (hash(x, y, 5) - 0.5) * 20);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,220,150,0.08)';
    ctx.strokeRect(px + 0.5, py + 0.5, TILE - 1, TILE - 1);
  },
};

const cache = new Map();

export function drawThemedFloor(ctx, map, theme) {
  const m = ctx.getTransform();
  const w = Math.max(1, Math.round(VIEW_W * m.a));
  const h = Math.max(1, Math.round(MAP_H * m.d));
  const key = `${theme}:${map.tiles.join('')}:${w}x${h}`;
  let layer = cache.get(key);
  if (!layer) {
    layer = document.createElement('canvas');
    layer.width = w;
    layer.height = h;
    const lctx = layer.getContext('2d');
    lctx.setTransform(m.a, 0, 0, m.d, 0, 0);
    const paint = THEMES[theme] ?? THEMES.concrete;
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) if (tileAt(map, x, y) !== WALL) paint(lctx, x, y);
    }
    if (cache.size > 12) cache.clear();
    cache.set(key, layer);
  }
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, m.e, m.f);
  ctx.drawImage(layer, 0, 0);
  ctx.restore();
}
