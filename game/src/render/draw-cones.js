// Vision cones, drawn under the actors: amber for a calm guard, hot orange for a suspicious one,
// red for a chase, and magenta scanlines for cameras. A jammed camera shows no cone at all.

import { COLORS, CAMERA } from '../config.js';
import { coneOutline } from '../stealth/vision-cone.js';
import { guardEye } from '../stealth/guard-ai.js';
import { cameraEye } from '../stealth/security-camera.js';

function fillCone(ctx, pts, eye, color, strength) {
  const grad = ctx.createRadialGradient(eye.x, eye.y, 6, eye.x, eye.y, eye.range);
  grad.addColorStop(0, color + (0.42 * strength) + ')');
  grad.addColorStop(0.7, color + (0.22 * strength) + ')');
  grad.addColorStop(1, color + (0.05 * strength) + ')');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = color + (0.75 * strength) + ')';
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

export function drawGuardCones(ctx, h) {
  for (const g of h.guards) {
    const eye = guardEye(g);
    const pts = coneOutline(h.map, h.clouds, eye.x, eye.y, eye.facing, eye.halfFov, eye.range);
    let color = COLORS.guardCone;
    if (g.state === 'chase') color = COLORS.alertCone;
    else if (g.state === 'suspicious' || g.state === 'search') color = 'rgba(255,128,48,';
    fillCone(ctx, pts, eye, color, g.seeing ? 1.25 : 1);
  }
}

export function drawCameraCones(ctx, h, time) {
  for (const cam of h.cameras) {
    if (cam.jammed > 0) continue;
    const eye = cameraEye(cam);
    const pts = coneOutline(h.map, h.clouds, eye.x, eye.y, eye.facing, eye.halfFov, eye.range);
    fillCone(ctx, pts, eye, COLORS.cameraCone, cam.seeing ? 1.5 : 0.9);
    // scanline sweeping outwards along the cone
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.closePath();
    ctx.clip();
    ctx.strokeStyle = 'rgba(255,120,180,0.35)';
    ctx.lineWidth = 2;
    for (let k = 0; k < 3; k++) {
      const r = ((time * 90 + k * (CAMERA.range / 3)) % CAMERA.range);
      ctx.beginPath();
      ctx.arc(eye.x, eye.y, r, eye.facing - eye.halfFov, eye.facing + eye.halfFov);
      ctx.stroke();
    }
    ctx.restore();
  }
}

