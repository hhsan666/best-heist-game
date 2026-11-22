// Wall-mounted security cameras: they sweep back and forth, feed the alarm while the thief is in
// frame, call the nearest guard to look, and go dark for a while when jammed.

import { CAMERA } from '../config.js';
import { TILE } from '../config.js';
import { sightStrength } from './vision-cone.js';

export function createCamera(def, index) {
  return {
    id: index,
    x: def.x * TILE,
    y: def.y * TILE,
    baseAngle: def.angle,
    sweep: def.sweep,
    speed: def.speed,
    phase: index * 1.3,
    facing: def.angle,
    jammed: 0,
    seeing: false,
    callCooldown: 0,
  };
}

export function cameraEye(cam) {
  return { x: cam.x, y: cam.y, facing: cam.facing, halfFov: CAMERA.fov, range: CAMERA.range };
}

export function updateCamera(cam, ctx) {
  const { dt, thief, map, clouds, events } = ctx;
  cam.callCooldown = Math.max(0, cam.callCooldown - dt);
  if (cam.jammed > 0) {
    cam.jammed = Math.max(0, cam.jammed - dt);
    cam.seeing = false;
    return;
  }
  cam.phase += dt * cam.speed;
  cam.facing = cam.baseAngle + Math.sin(cam.phase) * cam.sweep;
  cam.seeing = thief.active && sightStrength(map, clouds, cameraEye(cam), thief) > 0;
  if (cam.seeing) {
    ctx.alarm.level += CAMERA.alarmPerSecond * dt;
    ctx.alarm.cameraSaw = true;
    if (cam.callCooldown === 0) {
      cam.callCooldown = 2.5;
      events.push({ type: 'camera', camera: cam, x: thief.x, y: thief.y });
    }
  }
}

export function jamCamerasNear(cameras, x, y, radius) {
  let hit = 0;
  for (const cam of cameras) {
    if (Math.hypot(cam.x - x, cam.y - y) <= radius) { cam.jammed = CAMERA.jamTime; hit++; }
  }
  return hit;
}
