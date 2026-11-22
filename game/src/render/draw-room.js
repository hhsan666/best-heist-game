// The room itself: floor, walls, crates, safe shadow pools, the loot case and the getaway hatch.
// Colour carries meaning: teal is safe cover, gold is loot, green is the way out.

import { TILE, COLS, ROWS, COLORS, THIEF } from '../config.js';
import { tileAt, WALL, CRATE, SHADOW } from '../world/tilemap.js';
import { drawThemedFloor } from './floor-themes.js';

export function drawFloor(ctx, map, theme) {
  drawThemedFloor(ctx, map, theme);
  ctx.strokeStyle = COLORS.grid;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = 0; x <= COLS; x++) { ctx.moveTo(x * TILE + 0.5, 0); ctx.lineTo(x * TILE + 0.5, ROWS * TILE); }
  for (let y = 0; y <= ROWS; y++) { ctx.moveTo(0, y * TILE + 0.5); ctx.lineTo(COLS * TILE, y * TILE + 0.5); }
  ctx.stroke();
}

export function drawShadows(ctx, map, time) {
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if (tileAt(map, x, y) !== SHADOW) continue;
      const px = x * TILE;
      const py = y * TILE;
      ctx.fillStyle = COLORS.shadow;
      ctx.fillRect(px, py, TILE, TILE);
      ctx.save();
      ctx.beginPath();
      ctx.rect(px, py, TILE, TILE);
      ctx.clip();
      ctx.strokeStyle = COLORS.shadowHatch;
      ctx.lineWidth = 2;
      ctx.beginPath();
      const off = (time * 6) % 10;
      for (let k = -TILE; k < TILE * 2; k += 10) { ctx.moveTo(px + k + off, py); ctx.lineTo(px + k + off - TILE, py + TILE); }
      ctx.stroke();
      ctx.restore();
      ctx.strokeStyle = COLORS.shadowEdge;
      ctx.lineWidth = 2;
      ctx.beginPath();
      if (tileAt(map, x, y - 1) !== SHADOW) { ctx.moveTo(px, py + 1); ctx.lineTo(px + TILE, py + 1); }
      if (tileAt(map, x, y + 1) !== SHADOW) { ctx.moveTo(px, py + TILE - 1); ctx.lineTo(px + TILE, py + TILE - 1); }
      if (tileAt(map, x - 1, y) !== SHADOW) { ctx.moveTo(px + 1, py); ctx.lineTo(px + 1, py + TILE); }
      if (tileAt(map, x + 1, y) !== SHADOW) { ctx.moveTo(px + TILE - 1, py); ctx.lineTo(px + TILE - 1, py + TILE); }
      ctx.stroke();
    }
  }
}

// One faint SAFE tag per pool of shadow, on its first tile, so cover reads at a glance.
export function drawShadowTags(ctx, map) {
  const seen = new Set();
  ctx.font = 'bold 10px Verdana, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const k = y * COLS + x;
      if (seen.has(k) || tileAt(map, x, y) !== SHADOW) continue;
      const stack = [[x, y]];
      seen.add(k);
      let size = 0;
      while (stack.length) {
        const [cx, cy] = stack.pop();
        size++;
        for (const [nx, ny] of [[cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]]) {
          const nk = ny * COLS + nx;
          if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS || seen.has(nk) || tileAt(map, nx, ny) !== SHADOW) continue;
          seen.add(nk);
          stack.push([nx, ny]);
        }
      }
      if (size < 2) continue;
      ctx.fillStyle = 'rgba(70,230,205,0.75)';
      ctx.fillText('SAFE', (x + 1) * TILE, y * TILE + 11);
    }
  }
}

export function drawWalls(ctx, map) {
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const t = tileAt(map, x, y);
      const px = x * TILE;
      const py = y * TILE;
      if (t === WALL) {
        ctx.fillStyle = COLORS.wall;
        ctx.fillRect(px, py, TILE, TILE);
        ctx.fillStyle = COLORS.wallTop;
        ctx.fillRect(px + 3, py + 3, TILE - 6, TILE - 6);
        ctx.strokeStyle = COLORS.wallEdge;
        ctx.lineWidth = 2;
        ctx.beginPath();
        const open = (dx, dy) => tileAt(map, x + dx, y + dy) !== WALL;
        if (open(0, -1)) { ctx.moveTo(px, py + 1); ctx.lineTo(px + TILE, py + 1); }
        if (open(0, 1)) { ctx.moveTo(px, py + TILE - 1); ctx.lineTo(px + TILE, py + TILE - 1); }
        if (open(-1, 0)) { ctx.moveTo(px + 1, py); ctx.lineTo(px + 1, py + TILE); }
        if (open(1, 0)) { ctx.moveTo(px + TILE - 1, py); ctx.lineTo(px + TILE - 1, py + TILE); }
        ctx.stroke();
      } else if (t === CRATE) {
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.fillRect(px + 5, py + 7, TILE - 6, TILE - 6);
        ctx.fillStyle = COLORS.crate;
        ctx.fillRect(px + 2, py + 2, TILE - 5, TILE - 5);
        ctx.strokeStyle = COLORS.crateTop;
        ctx.lineWidth = 3;
        ctx.strokeRect(px + 4, py + 4, TILE - 9, TILE - 9);
        ctx.beginPath();
        ctx.moveTo(px + 6, py + 6); ctx.lineTo(px + TILE - 7, py + TILE - 7);
        ctx.moveTo(px + TILE - 7, py + 6); ctx.lineTo(px + 6, py + TILE - 7);
        ctx.stroke();
      }
    }
  }
}

export function drawLoot(ctx, map, thief, time) {
  if (thief.carrying) {
    const cx = (map.loot.x + 0.5) * TILE;
    const cy = (map.loot.y + 0.5) * TILE;
    ctx.strokeStyle = 'rgba(255,207,74,0.35)';
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 2;
    ctx.strokeRect(cx - 14, cy - 14, 28, 28);
    ctx.setLineDash([]);
    return;
  }
  const cx = (map.loot.x + 0.5) * TILE;
  const cy = (map.loot.y + 0.5) * TILE;
  const pulse = 0.5 + 0.5 * Math.sin(time * 3);
  const glow = ctx.createRadialGradient(cx, cy, 4, cx, cy, 58);
  glow.addColorStop(0, COLORS.lootGlow + (0.55 + 0.2 * pulse) + ')');
  glow.addColorStop(1, COLORS.lootGlow + '0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(cx, cy, 58, 0, Math.PI * 2);
  ctx.fill();
  // glass case on a plinth
  ctx.fillStyle = '#2a2236';
  ctx.fillRect(cx - 15, cy - 15, 30, 30);
  ctx.strokeStyle = '#d9c38a';
  ctx.lineWidth = 2;
  ctx.strokeRect(cx - 15, cy - 15, 30, 30);
  // the gem
  ctx.fillStyle = COLORS.loot;
  ctx.beginPath();
  ctx.moveTo(cx, cy - 10);
  ctx.lineTo(cx + 9, cy - 2);
  ctx.lineTo(cx, cy + 10);
  ctx.lineTo(cx - 9, cy - 2);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#fff6cf';
  ctx.beginPath();
  ctx.moveTo(cx, cy - 10); ctx.lineTo(cx + 4, cy - 2); ctx.lineTo(cx - 4, cy - 2);
  ctx.closePath();
  ctx.fill();
  // sparkles
  for (let i = 0; i < 3; i++) {
    const a = time * 1.4 + i * 2.1;
    const sx = cx + Math.cos(a) * 20;
    const sy = cy + Math.sin(a) * 20;
    const s = 2 + 2 * Math.abs(Math.sin(time * 4 + i));
    ctx.fillStyle = '#fff3c0';
    ctx.fillRect(sx - s / 2, sy - 0.5, s, 1.5);
    ctx.fillRect(sx - 0.5, sy - s / 2, 1.5, s);
  }
  // crack progress ring
  if (thief.crack > 0) {
    ctx.strokeStyle = '#fff3c0';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(cx, cy, 24, -Math.PI / 2, -Math.PI / 2 + (thief.crack / THIEF.crackTime) * Math.PI * 2);
    ctx.stroke();
  }
  label(ctx, 'LOOT', cx, cy - 30, COLORS.loot);
}

export function drawExit(ctx, map, thief, time) {
  const cx = (map.exit.x + 0.5) * TILE;
  const cy = (map.exit.y + 0.5) * TILE;
  const live = thief.carrying;
  ctx.fillStyle = live ? 'rgba(82,245,154,0.28)' : 'rgba(82,245,154,0.1)';
  ctx.fillRect(cx - 20, cy - 20, 40, 40);
  ctx.strokeStyle = COLORS.exit;
  ctx.globalAlpha = live ? 1 : 0.55;
  ctx.lineWidth = 2;
  ctx.strokeRect(cx - 18, cy - 18, 36, 36);
  const shift = live ? (time * 18) % 12 : 0;
  ctx.beginPath();
  for (let k = 0; k < 2; k++) {
    const ox = cx - 9 + k * 9 + shift * 0.5;
    ctx.moveTo(ox - 4, cy - 8); ctx.lineTo(ox + 4, cy); ctx.lineTo(ox - 4, cy + 8);
  }
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.globalAlpha = 1;
  label(ctx, 'EXIT', cx - 6, cy - 30, COLORS.exit);
}

export function label(ctx, text, x, y, color) {
  ctx.font = 'bold 12px "Trebuchet MS", Verdana, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const w = ctx.measureText(text).width + 10;
  ctx.fillStyle = 'rgba(8,10,18,0.8)';
  ctx.fillRect(x - w / 2, y - 8, w, 16);
  ctx.fillStyle = color;
  ctx.fillText(text, x, y + 1);
}

// Vent grates: teal slatted squares, a safe way through. While casing the room, a dotted line
// shows which grates are joined.
export function drawVents(ctx, vents, casing) {
  for (const v of vents) {
    if (casing) {
      ctx.strokeStyle = 'rgba(70,230,205,0.7)';
      ctx.lineWidth = 2;
      ctx.setLineDash([2, 6]);
      ctx.beginPath();
      ctx.moveTo(v.a.x, v.a.y);
      ctx.lineTo(v.b.x, v.b.y);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    for (const end of [v.a, v.b]) {
      ctx.fillStyle = '#0d2326';
      ctx.fillRect(end.x - 14, end.y - 14, 28, 28);
      ctx.strokeStyle = COLORS.safe;
      ctx.lineWidth = 2;
      ctx.strokeRect(end.x - 14, end.y - 14, 28, 28);
      ctx.beginPath();
      for (let k = -8; k <= 8; k += 4) { ctx.moveTo(end.x - 10, end.y + k); ctx.lineTo(end.x + 10, end.y + k); }
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    label(ctx, 'VENT', v.a.x, v.a.y - 24, COLORS.safe);
    label(ctx, 'VENT', v.b.x, v.b.y - 24, COLORS.safe);
  }
}
