// Laser tripwires: a hot red beam while live, a stutter of warning flickers just before it comes
// on, a faint dotted guide while dark, and blue static while jammed. Emitters sit on the walls.

import { LASER_WARN } from '../stealth/laser-grid.js';

function emitter(ctx, x, y, live) {
  ctx.fillStyle = '#1b1f2e';
  ctx.fillRect(x - 5, y - 5, 10, 10);
  ctx.fillStyle = live ? '#ff3b4f' : '#5a2633';
  ctx.fillRect(x - 2.5, y - 2.5, 5, 5);
}

export function drawLasers(ctx, lasers, time) {
  for (const l of lasers) {
    ctx.save();
    if (l.jammed > 0) {
      ctx.strokeStyle = 'rgba(140,160,255,0.55)';
      ctx.setLineDash([2, 5]);
      ctx.lineWidth = 2;
    } else if (l.live) {
      ctx.shadowColor = '#ff2840';
      ctx.shadowBlur = 12;
      ctx.strokeStyle = `rgba(255,${50 + Math.sin(time * 40) * 20},70,0.95)`;
      ctx.lineWidth = 3;
    } else if (l.warning && Math.sin(time * 50) > 0) {
      ctx.strokeStyle = 'rgba(255,90,100,0.6)';
      ctx.lineWidth = 1.5;
    } else {
      ctx.strokeStyle = 'rgba(255,90,100,0.22)';
      ctx.setLineDash([3, 6]);
      ctx.lineWidth = 1.5;
    }
    ctx.beginPath();
    ctx.moveTo(l.ax, l.ay);
    ctx.lineTo(l.bx, l.by);
    ctx.stroke();
    ctx.restore();
    emitter(ctx, l.ax, l.ay, l.live);
    emitter(ctx, l.bx, l.by, l.live);
    void LASER_WARN;
  }
}
