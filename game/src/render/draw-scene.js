// Draws one frame of a heist in play, layer by layer: floor, night darkness, safe shadows,
// patrol beats, cones, walls, loot and exit, the people, then effects and the HUD.

import { drawFloor, drawShadows, drawShadowTags, drawWalls, drawLoot, drawExit, drawVents } from './draw-room.js';
import { coneShapes, drawCones, drawCameraLocks } from './draw-cones.js';
import { drawDarkness } from './lighting.js';
import { drawPatrols, drawCasingLabel } from './draw-patrols.js';
import { drawLasers } from './draw-lasers.js';
import { drawThief, drawGuards, drawCameras, drawSmoke, drawNoise, drawReticle, drawCrawl } from './draw-actors.js';
import { drawHud, drawBanner, drawAlarmVignette, drawHint, drawJobIntro } from './draw-hud.js';

export function drawRoom(ctx, h, time, casing = false) {
  const shapes = coneShapes(h);
  drawFloor(ctx, h.map, h.stage.floor);
  drawDarkness(ctx, h, shapes, time);
  drawShadows(ctx, h.map, time);
  drawPatrols(ctx, h, time, casing);
  drawCones(ctx, shapes, time);
  drawWalls(ctx, h.map);
  drawShadowTags(ctx, h.map);
  drawLasers(ctx, h.lasers, time);
  drawVents(ctx, h.vents, casing);
  drawExit(ctx, h.map, h.thief, time);
  drawLoot(ctx, h.map, h.thief, time);
  drawNoise(ctx, h.noise);
  if (h.thief.active) drawCameraLocks(ctx, h, time);
  drawCameras(ctx, h, time);
  drawGuards(ctx, h);
  if (h.thief.active) drawThief(ctx, h.thief, time);
  drawCrawl(ctx, h.thief, time);
  drawSmoke(ctx, h.clouds, time);
}

export function drawHeistFrame(ctx, h, time, mouse, casing = false) {
  drawRoom(ctx, h, time, casing);
  drawAlarmVignette(ctx, h.alarm, time);
  if (mouse) drawReticle(ctx, h, mouse);
  drawBanner(ctx, h);
  if (mouse) drawJobIntro(ctx, h);
  if (casing) drawCasingLabel(ctx);
  else if (mouse) drawHint(ctx, h);
  drawHud(ctx, h, time);
}
