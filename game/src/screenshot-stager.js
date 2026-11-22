// Stages the moments the screenshots show, using the game's own simulation and renderer:
// ?shot=sneak | spotted | title | result | room&stage=N&t=seconds. Every scene is deterministic,
// built by running the real heist code forward and then placing the thief.

import { VIEW_W, VIEW_H, TILE } from './config.js';
import { createHeist, stepHeist } from './heist/heist-session.js';
import { scoreStage } from './heist/scoring.js';
import { drawHeistFrame } from './render/draw-scene.js';
import { drawTitle, drawResult } from './render/draw-screens.js';
import { IDLE_INPUT, idleRoom } from './ui/game-flow.js';
import { emitNoise } from './stealth/noise.js';

function advance(h, seconds, input = IDLE_INPUT) {
  const dt = 1 / 120;
  for (let t = 0; t < seconds; t += dt) stepHeist(h, input, dt);
}

function place(h, tx, ty, facing, extra = {}) {
  Object.assign(h.thief, { x: tx * TILE, y: ty * TILE, facing, moving: true, stridePhase: 1.2 }, extra);
}

const SCENES = {
  room(ctx, params) {
    const h = idleRoom(Number(params.get('stage') ?? 0));
    advance(h, Number(params.get('t') ?? 0));
    drawHeistFrame(ctx, h, 1, null);
  },
  sneak(ctx) {
    const h = createHeist(2);
    h.thief.active = false;
    advance(h, 6.5);
    h.thief.active = true;
    place(h, 12.4, 8.5, -0.2, { sneaking: true, inShadow: true });
    h.kit.selected = 'coin';
    h.kit.counts.coin = 3;
    h.kit.spent = 20;
    h.alarm.level = 34;
    emitNoise(h.noise, 6.5 * TILE, 10.5 * TILE, 175, 'coin');
    h.noise.ripples[0].age = 0.35;
    h.time = 41;
    drawHeistFrame(ctx, h, 2.2, { inside: true, x: 17.3 * TILE, y: 8.4 * TILE });
  },
  spotted(ctx) {
    const h = createHeist(1);
    h.thief.active = false;
    advance(h, 9);
    h.thief.active = true;
    place(h, 17.5, 6.6, 1.2, { carrying: true });
    const g = h.guards[0];
    Object.assign(g, { x: 15.6 * TILE, y: 7.5 * TILE, state: 'chase', suspicion: 1, seeing: true });
    g.facing = Math.atan2(h.thief.y - g.y, h.thief.x - g.x);
    h.alarm.level = 81;
    h.alarm.flash = 0.4;
    h.spottedCount = 1;
    h.banner = { text: 'SPOTTED!', age: 0.4 };
    h.time = 63;
    h.kit.counts.smoke = 0;
    drawHeistFrame(ctx, h, 3.1, null);
  },
  title(ctx) {
    const h = idleRoom(1);
    advance(h, 4);
    drawTitle(ctx, h, 1.3, true);
  },
  result(ctx) {
    const h = createHeist(0);
    h.thief.active = false;
    advance(h, 5);
    h.thief.active = true;
    place(h, 22.5, 10.5, 0, { carrying: true });
    h.outcome = 'escaped';
    h.time = 58.4;
    h.spottedCount = 0;
    h.alarm.peak = 12;
    h.kit.spent = 40;
    h.kit.used.coin = 2;
    drawHeistFrame(ctx, h, 2, null);
    drawResult(ctx, h, scoreStage(h), 0, 0.5);
  },
};

export function stageScreenshot(ctx, name) {
  const params = new URLSearchParams(location.search);
  ctx.clearRect(0, 0, VIEW_W, VIEW_H);
  (SCENES[name] ?? SCENES.title)(ctx, params);
  document.body.dataset.ready = 'yes';
}
