// The people and gadgets in the room: Wren the thief, the guards with their suspicion gauges,
// the cameras, smoke clouds, noise ripples and the mouse aiming reticle.

import { COLORS, THIEF, GUARD, TOOLS } from '../config.js';
import { aimCheck } from '../gear/tools.js';

export function drawThief(ctx, t, time) {
  const bob = t.moving ? Math.sin(t.stridePhase) * 1.5 : 0;
  ctx.save();
  ctx.translate(t.x, t.y + bob);
  // soft ring so the thief reads at a glance, teal when hidden in shadow
  ctx.strokeStyle = t.inShadow ? COLORS.safe : 'rgba(230,240,255,0.85)';
  ctx.lineWidth = 2.5;
  ctx.setLineDash(t.inShadow ? [3, 3] : []);
  ctx.beginPath();
  ctx.arc(0, 0, THIEF.radius + 5, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.rotate(t.facing);
  ctx.fillStyle = t.inShadow ? 'rgba(26,29,43,0.75)' : COLORS.thief;
  ctx.beginPath();
  ctx.ellipse(0, 0, THIEF.radius, THIEF.radius - 2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = COLORS.thiefTrim;
  ctx.lineWidth = 2;
  ctx.stroke();
  // mask band and eyes, facing forward
  ctx.fillStyle = COLORS.thiefTrim;
  ctx.fillRect(2, -6, 5, 12);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(4, -4, 2, 2);
  ctx.fillRect(4, 2, 2, 2);
  if (t.carrying) {
    ctx.fillStyle = COLORS.loot;
    ctx.beginPath();
    ctx.arc(-9, 0, 6, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
  if (t.sneaking && t.moving) {
    ctx.fillStyle = COLORS.safe;
    ctx.font = 'bold 10px Verdana, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('sneak', t.x, t.y + 26);
  }
  void time;
}

export function drawGuards(ctx, h) {
  for (const g of h.guards) {
    const stride = Math.sin(g.stepPhase) * 2;
    ctx.save();
    ctx.translate(g.x, g.y);
    ctx.rotate(g.facing);
    // flashlight
    ctx.fillStyle = '#ffe9a8';
    ctx.fillRect(GUARD.radius - 3, -3, 8, 6);
    ctx.fillStyle = g.state === 'chase' ? '#7a1f2e' : COLORS.guard;
    ctx.beginPath();
    ctx.ellipse(stride * 0.3, 0, GUARD.radius, GUARD.radius + 1, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = COLORS.guardTrim;
    ctx.lineWidth = 2;
    ctx.stroke();
    // cap
    ctx.fillStyle = '#111a3d';
    ctx.beginPath();
    ctx.arc(1, 0, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = COLORS.guardTrim;
    ctx.fillRect(6, -4, 3, 8);
    ctx.restore();
    drawGuardStatus(ctx, g);
  }
}

function drawGuardStatus(ctx, g) {
  const x = g.x;
  const y = g.y - 26;
  if (g.state === 'patrol' && g.suspicion < 0.05) return;
  // suspicion gauge
  ctx.fillStyle = 'rgba(8,10,18,0.85)';
  ctx.fillRect(x - 15, y + 9, 30, 5);
  ctx.fillStyle = g.suspicion >= 1 ? COLORS.danger : COLORS.warn;
  ctx.fillRect(x - 14, y + 10, 28 * Math.min(1, g.suspicion), 3);
  const mark = g.state === 'chase' ? '!' : '?';
  ctx.fillStyle = g.state === 'chase' ? COLORS.danger : COLORS.warn;
  ctx.beginPath();
  ctx.arc(x, y - 2, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#10121c';
  ctx.font = 'bold 14px Verdana, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(mark, x, y - 1);
}

export function drawCameras(ctx, h, time) {
  for (const cam of h.cameras) {
    ctx.save();
    ctx.translate(cam.x, cam.y);
    ctx.fillStyle = '#20263d';
    ctx.beginPath();
    ctx.arc(0, 0, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.rotate(cam.facing);
    ctx.fillStyle = cam.jammed > 0 ? '#4a4f63' : '#d8dcec';
    ctx.fillRect(-4, -6, 16, 12);
    ctx.fillStyle = '#11131d';
    ctx.fillRect(10, -4, 5, 8);
    ctx.restore();
    const blink = cam.jammed > 0 ? false : (cam.seeing || Math.sin(time * 6 + cam.id) > 0);
    ctx.fillStyle = cam.seeing ? '#ff2b5e' : blink ? '#ff5d7e' : '#5a2633';
    ctx.beginPath();
    ctx.arc(cam.x, cam.y, 3, 0, Math.PI * 2);
    ctx.fill();
    if (cam.jammed > 0) {
      ctx.fillStyle = 'rgba(150,170,255,0.9)';
      ctx.font = 'bold 10px Verdana, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`JAMMED ${Math.ceil(cam.jammed)}s`, cam.x, cam.y - 14);
    }
  }
}

export function drawSmoke(ctx, clouds, time) {
  for (const c of clouds) {
    for (let i = 0; i < 6; i++) {
      const a = i * 1.05 + time * 0.4;
      const ox = Math.cos(a) * c.r * 0.35;
      const oy = Math.sin(a) * c.r * 0.35;
      const g = ctx.createRadialGradient(c.x + ox, c.y + oy, 2, c.x + ox, c.y + oy, c.r * 0.75);
      g.addColorStop(0, COLORS.smoke + '0.55)');
      g.addColorStop(1, COLORS.smoke + '0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(c.x + ox, c.y + oy, c.r * 0.75, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

export function drawNoise(ctx, noise) {
  for (const r of noise.ripples) {
    const k = r.age / r.life;
    ctx.strokeStyle = r.kind === 'coin' ? `rgba(255,220,120,${0.7 * (1 - k)})` : `rgba(230,235,255,${0.35 * (1 - k)})`;
    ctx.lineWidth = r.kind === 'coin' ? 3 : 1.5;
    ctx.beginPath();
    ctx.arc(r.x, r.y, r.radius * (0.25 + 0.75 * k), 0, Math.PI * 2);
    ctx.stroke();
  }
}

export function drawReticle(ctx, h, mouse) {
  if (!mouse.inside || mouse.y >= 520) return;
  const tool = TOOLS[h.kit.selected];
  const check = aimCheck(h.kit, h.thief, h.map, mouse.x, mouse.y);
  const color = check.ok ? 'rgba(130,240,255,0.95)' : 'rgba(255,90,90,0.9)';
  ctx.strokeStyle = 'rgba(130,240,255,0.18)';
  ctx.setLineDash([6, 6]);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(h.thief.x, h.thief.y, tool.range, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  const r = h.kit.selected === 'jammer' ? tool.radius : h.kit.selected === 'smoke' ? tool.radius : 12;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(mouse.x, mouse.y, r, 0, Math.PI * 2);
  ctx.moveTo(mouse.x - 6, mouse.y); ctx.lineTo(mouse.x + 6, mouse.y);
  ctx.moveTo(mouse.x, mouse.y - 6); ctx.lineTo(mouse.x, mouse.y + 6);
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.font = 'bold 11px Verdana, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(check.ok ? `${tool.label} -$${tool.cost}` : check.why, mouse.x + 14, mouse.y - 10);
}
