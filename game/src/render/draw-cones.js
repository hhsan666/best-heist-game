// Vision cones: amber for a calm guard, hot orange for a suspicious one, red for a chase, and
// magenta scanlines for cameras. A jammed camera shows no cone at all. The cone shapes are
// worked out once a frame (coneShapes) and shared by the lighting pass and the cone fills.

import { COLORS, CAMERA } from '../config.js';
import { coneOutline } from '../stealth/vision-cone.js';
import { guardEye } from '../stealth/guard-ai.js';
import { cameraEye } from '../stealth/security-camera.js';

export function coneShapes(h) {
  const shapes = [];
  for (const cam of h.cameras) {
    if (cam.jammed > 0) continue;
    const eye = cameraEye(cam);
    shapes.push({
      kind: 'camera',
      eye,
      pts: coneOutline(h.map, h.clouds, eye.x, eye.y, eye.facing, eye.halfFov, eye.range),
      color: COLORS.cameraCone,
      strength: cam.seeing ? 1.5 : 0.9,
    });
  }
  for (const g of h.guards) {
    const eye = guardEye(g);
    let color = COLORS.guardCone;
    if (g.state === 'chase') color = COLORS.alertCone;
    else if (g.state === 'suspicious' || g.state === 'search') color = 'rgba(255,128,48,';
    shapes.push({
      kind: 'guard',
      eye,
      pts: coneOutline(h.map, h.clouds, eye.x, eye.y, eye.facing, eye.halfFov, eye.range),
      color,
      strength: g.seeing ? 1.25 : 1,
    });
  }
  return shapes;
}

export function tracePolygon(ctx, pts) {
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.closePath();
}

function fillCone(ctx, shape) {
  const { eye, color, strength } = shape;
  const grad = ctx.createRadialGradient(eye.x, eye.y, 6, eye.x, eye.y, eye.range);
  grad.addColorStop(0, color + (0.42 * strength) + ')');
  grad.addColorStop(0.7, color + (0.2 * strength) + ')');
  grad.addColorStop(1, color + (0.04 * strength) + ')');
  ctx.fillStyle = grad;
  tracePolygon(ctx, shape.pts);
  ctx.fill();
  ctx.strokeStyle = color + (0.8 * strength) + ')';
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function cameraScanlines(ctx, shape, time) {
  const { eye } = shape;
  ctx.save();
  tracePolygon(ctx, shape.pts);
  ctx.clip();
  ctx.strokeStyle = 'rgba(255,120,180,0.35)';
  ctx.lineWidth = 2;
  for (let k = 0; k < 3; k++) {
    const r = (time * 90 + k * (CAMERA.range / 3)) % CAMERA.range;
    ctx.beginPath();
    ctx.arc(eye.x, eye.y, r, eye.facing - eye.halfFov, eye.facing + eye.halfFov);
    ctx.stroke();
  }
  ctx.restore();
}

export function drawCones(ctx, shapes, time) {
  for (const shape of shapes) {
    fillCone(ctx, shape);
    if (shape.kind === 'camera') cameraScanlines(ctx, shape, time);
  }
}

// A dashed pink line from each camera that has the thief in frame: the lock-on the alarm follows.
export function drawCameraLocks(ctx, h, time) {
  for (const cam of h.cameras) {
    if (!cam.seeing) continue;
    ctx.strokeStyle = 'rgba(255,60,130,0.9)';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 5]);
    ctx.lineDashOffset = -time * 40;
    ctx.beginPath();
    ctx.moveTo(cam.x, cam.y);
    ctx.lineTo(h.thief.x, h.thief.y);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.strokeStyle = 'rgba(255,60,130,0.95)';
    ctx.beginPath();
    const r = 20 + Math.sin(time * 12) * 3;
    ctx.rect(h.thief.x - r, h.thief.y - r, r * 2, r * 2);
    ctx.stroke();
  }
}
