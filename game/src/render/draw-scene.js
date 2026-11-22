// Draws one frame of a heist in play, layer by layer: room, cones, actors, effects, HUD.

import { drawFloor, drawShadows, drawWalls, drawLoot, drawExit } from './draw-room.js';
import { drawGuardCones, drawCameraCones } from './draw-cones.js';
import { drawThief, drawGuards, drawCameras, drawSmoke, drawNoise, drawReticle } from './draw-actors.js';
import { drawHud, drawBanner, drawAlarmVignette } from './draw-hud.js';

export function drawRoom(ctx, h, time) {
  drawFloor(ctx, h.map);
  drawShadows(ctx, h.map, time);
  drawCameraCones(ctx, h, time);
  drawGuardCones(ctx, h);
  drawWalls(ctx, h.map);
  drawExit(ctx, h.map, h.thief, time);
  drawLoot(ctx, h.map, h.thief, time);
  drawNoise(ctx, h.noise);
  drawCameras(ctx, h, time);
  drawGuards(ctx, h);
  if (h.thief.active) drawThief(ctx, h.thief, time);
  drawSmoke(ctx, h.clouds, time);
}

export function drawHeistFrame(ctx, h, time, mouse) {
  drawRoom(ctx, h, time);
  drawAlarmVignette(ctx, h.alarm, time);
  if (mouse) drawReticle(ctx, h, mouse);
  drawBanner(ctx, h);
  drawHud(ctx, h, time);
}
