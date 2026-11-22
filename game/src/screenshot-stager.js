// Stages the moments the screenshots show, using the game's own simulation and renderer:
// ?shot=sneak | spotted | title | result | room&stage=N&t=seconds. Every scene is deterministic,
// built by running the real heist code forward and then placing the thief.

import { VIEW_W, VIEW_H, TILE } from './config.js';
import { createHeist, stepHeist } from './heist/heist-session.js';
import { scoreStage } from './heist/scoring.js';
import { drawHeistFrame } from './render/draw-scene.js';
import { drawTitle, drawResult, drawFinal } from './render/draw-screens.js';
import { IDLE_INPUT, idleRoom } from './ui/game-flow.js';
import { emitNoise } from './stealth/noise.js';
import { updateCamera } from './stealth/security-camera.js';
import { drawOutro } from './render/draw-outro.js';

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
    place(h, 11.2, 8.45, 0.05, { sneaking: true });
    const g = h.guards[2];
    Object.assign(g, { x: 7.3 * TILE, y: 8.5 * TILE, state: 'suspicious', suspicion: 0.55, seeing: true, facing: 0.1 });
    g.lastSeen = { x: h.thief.x, y: h.thief.y };
    h.kit.selected = 'coin';
    h.kit.counts.coin = 3;
    h.kit.spent = 20;
    h.alarm.level = 34;
    emitNoise(h.noise, 17.5 * TILE, 10.5 * TILE, 175, 'coin');
    h.noise.ripples[0].age = 0.35;
    h.time = 41;
    Object.assign(h.lasers[0], { clock: 0.6, live: true, warning: false });
    drawHeistFrame(ctx, h, 2.2, { inside: true, x: 16.6 * TILE, y: 8.4 * TILE });
  },
  spotted(ctx) {
    const h = createHeist(1);
    h.thief.active = false;
    advance(h, 9);
    h.thief.active = true;
    place(h, 14.2, 7.45, 2.9, { carrying: true });
    const cam = h.cameras[0];
    cam.phase = 0.15;
    updateCamera(cam, { dt: 0, thief: h.thief, map: h.map, clouds: h.clouds, events: [], alarm: h.alarm });
    const g = h.guards[0];
    Object.assign(g, { x: 12.5 * TILE, y: 5.2 * TILE, state: 'chase', suspicion: 1, seeing: true });
    g.facing = Math.atan2(h.thief.y - g.y, h.thief.x - g.x);
    h.alarm.level = 81;
    h.alarm.flash = 0.4;
    h.spottedCount = 1;
    h.banner = { text: 'SPOTTED!', age: 0.4 };
    h.time = 63;
    h.kit.counts.smoke = 0;
    drawHeistFrame(ctx, h, 3.1, null);
  },
  getaway(ctx) {
    const h = createHeist(0);
    h.thief.active = false;
    advance(h, 12);
    h.thief.active = true;
    place(h, 22.4, 10.5, 0, { carrying: true });
    h.outcome = 'escaped';
    h.time = 52;
    drawHeistFrame(ctx, h, 2, null);
    drawOutro(ctx, h, 0.55);
  },
  casing(ctx) {
    const h = createHeist(2);
    h.thief.active = false;
    advance(h, 3);
    h.thief.active = true;
    place(h, 2.5, 1.5, 0, { moving: false });
    h.time = 3;
    drawHeistFrame(ctx, h, 2, null, true);
  },
  night(ctx) {
    const h = idleRoom(2);
    advance(h, 5);
    drawHeistFrame(ctx, h, 2, null);
    drawFinal(ctx, [
      { name: 'Orchid Annex', take: 1302, rank: 'GHOST', time: 58.4 },
      { name: 'Copperline Bonded Store', take: 2418, rank: 'SHADOW', time: 81.2 },
      { name: 'The Lantern Atrium', take: 3986, rank: 'PRO', time: 114.9 },
    ], 7706, 1.1);
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
