// The thief, Wren: walks or sneaks, leaves footstep noise when walking, cracks the loot case
// by holding E beside it, and carries the loot to the getaway hatch.

import { THIEF, TILE } from '../config.js';
import { tileCenter, slideMove, isShadowAt } from '../world/tilemap.js';
import { emitNoise } from '../stealth/noise.js';

export function createThief(start) {
  const c = tileCenter(start.x, start.y);
  return {
    x: c.x,
    y: c.y,
    facing: 0,
    active: true,
    sneaking: false,
    moving: false,
    stepTimer: 0,
    stridePhase: 0,
    crack: 0,
    carrying: false,
    inShadow: false,
  };
}

export function updateThief(thief, ctx) {
  const { input, map, dt, noise, loot, events } = ctx;
  let mx = 0;
  let my = 0;
  if (input.held('left')) mx -= 1;
  if (input.held('right')) mx += 1;
  if (input.held('up')) my -= 1;
  if (input.held('down')) my += 1;
  thief.sneaking = input.held('sneak');
  thief.moving = mx !== 0 || my !== 0;
  if (thief.moving) {
    const len = Math.hypot(mx, my);
    const speed = (thief.sneaking ? THIEF.sneakSpeed : THIEF.walkSpeed) * (thief.carrying ? 0.9 : 1);
    slideMove(map, thief, (mx / len) * speed * dt, (my / len) * speed * dt, THIEF.radius);
    thief.facing = Math.atan2(my, mx);
    thief.stridePhase += dt * speed * 0.11;
    thief.stepTimer -= dt;
    if (!thief.sneaking && thief.stepTimer <= 0) {
      thief.stepTimer = THIEF.stepInterval;
      emitNoise(noise, thief.x, thief.y, THIEF.stepNoiseRadius, 'step');
      events.push({ type: 'step' });
    }
  }
  thief.inShadow = isShadowAt(map, thief.x, thief.y);

  // Cracking the case: hold E within reach of the loot pedestal.
  const lc = tileCenter(loot.x, loot.y);
  const near = Math.hypot(lc.x - thief.x, lc.y - thief.y) < TILE * 0.95;
  if (!thief.carrying && near && input.held('use')) {
    thief.crack += dt;
    if (Math.floor(thief.crack * 6) !== Math.floor((thief.crack - dt) * 6)) events.push({ type: 'tick' });
    if (thief.crack >= THIEF.crackTime) {
      thief.carrying = true;
      events.push({ type: 'loot' });
    }
  } else if (!thief.carrying) {
    thief.crack = Math.max(0, thief.crack - dt * 0.5);
  }
  thief.nearLoot = near && !thief.carrying;
}
