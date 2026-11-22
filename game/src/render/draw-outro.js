// The second and a half after a job ends, before the tally: a spotlight on the collar when a
// guard catches you, shutters slamming for a lockdown, and the van peeling away for a getaway.

import { VIEW_W, MAP_H, TILE, COLORS } from '../config.js';

const FONT = '"Trebuchet MS", Verdana, sans-serif';

function headline(ctx, text, color, k) {
  const size = 40 + 30 * Math.min(1, k * 3);
  ctx.save();
  ctx.globalAlpha = Math.min(1, k * 4);
  ctx.font = `bold ${size}px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineWidth = 8;
  ctx.strokeStyle = 'rgba(5,6,12,0.85)';
  ctx.strokeText(text, VIEW_W / 2, MAP_H / 2);
  ctx.fillStyle = color;
  ctx.fillText(text, VIEW_W / 2, MAP_H / 2);
  ctx.restore();
}

function spotlight(ctx, x, y, r, alpha) {
  const g = ctx.createRadialGradient(x, y, r * 0.6, x, y, r * 2.4);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, `rgba(0,0,0,${alpha})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, VIEW_W, MAP_H);
}

function drawVan(ctx, x, y) {
  ctx.fillStyle = '#d8dde9';
  ctx.fillRect(x - 34, y - 16, 56, 32);
  ctx.fillStyle = '#9fb0d0';
  ctx.fillRect(x + 22, y - 14, 16, 28);
  ctx.fillStyle = '#1a2033';
  ctx.fillRect(x + 28, y - 11, 8, 22);
  ctx.fillStyle = COLORS.loot;
  ctx.beginPath();
  ctx.arc(x - 8, y, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#10141f';
  ctx.font = `bold 11px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('$', x - 8, y + 1);
}

export function drawOutro(ctx, h, k) {
  if (h.outcome === 'caught') {
    spotlight(ctx, h.thief.x, h.thief.y, 40, Math.min(0.85, k * 2));
    ctx.strokeStyle = `rgba(255,70,70,${1 - k * 0.5})`;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(h.thief.x, h.thief.y, 26 + Math.sin(k * 30) * 3, 0, Math.PI * 2);
    ctx.stroke();
    headline(ctx, 'NABBED', COLORS.danger, k);
  } else if (h.outcome === 'lockdown') {
    const drop = Math.min(1, k * 1.6);
    for (let i = 0; i < 8; i++) {
      const y = -MAP_H / 8 + drop * (MAP_H / 8) * (i + 1);
      ctx.fillStyle = i % 2 ? '#3a1b22' : '#4a2129';
      ctx.fillRect(0, y - MAP_H / 8, VIEW_W, MAP_H / 8 - 4);
      ctx.fillStyle = '#ffb43c';
      for (let x = 0; x < VIEW_W; x += 48) ctx.fillRect(x + (i % 2) * 24, y - 10, 24, 6);
    }
    headline(ctx, 'LOCKDOWN', COLORS.warn, k);
  } else {
    const ex = (h.map.exit.x + 0.5) * TILE;
    const ey = (h.map.exit.y + 0.5) * TILE;
    spotlight(ctx, ex, ey, 70, Math.min(0.6, k));
    const vx = ex - 70 + k * k * 260;
    for (let i = 0; i < 4; i++) {
      ctx.strokeStyle = `rgba(82,245,154,${0.5 - i * 0.1})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(vx - 50 - i * 14, ey - 12 + i * 8);
      ctx.lineTo(vx - 80 - i * 22 - k * 40, ey - 12 + i * 8);
      ctx.stroke();
    }
    drawVan(ctx, vx, ey);
    headline(ctx, 'GETAWAY!', COLORS.exit, k);
  }
}
