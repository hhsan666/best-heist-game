// One attempt at one stage: builds the room, its guards and cameras, and runs a tick of the
// heist in order (thief, tools, cameras, lasers, guards, alarm), turning what happened into events the
// sound and the screens react to.

import { STAGES } from '../levels/stages.js';
import { parseTilemap, tileCenter } from '../world/tilemap.js';
import { createThief, updateThief } from '../actors/thief.js';
import { createGuard, updateGuard, sendToSearch } from '../stealth/guard-ai.js';
import { createCamera, updateCamera } from '../stealth/security-camera.js';
import { createAlarm, beginAlarmFrame, endAlarmFrame, bumpAlarm } from '../stealth/alarm-meter.js';
import { createNoiseField, updateNoise, settleNoise } from '../stealth/noise.js';
import { createKit, createSmokeField, updateSmoke, useTool, TOOL_ORDER } from '../gear/tools.js';
import { ALARM, TILE } from '../config.js';
import { createLaser, updateLasers } from '../stealth/laser-grid.js';
import { createVents, ventUnder, startCrawl, updateCrawl } from '../world/vents.js';

export function createHeist(stageIndex) {
  const stage = STAGES[stageIndex];
  const map = parseTilemap(stage.map);
  return {
    stageIndex,
    stage,
    map,
    thief: createThief(map.start),
    guards: stage.guards.map(createGuard),
    cameras: stage.cameras.map(createCamera),
    lasers: (stage.lasers ?? []).map(createLaser),
    vents: createVents(stage.vents),
    alarm: createAlarm(),
    noise: createNoiseField(),
    clouds: createSmokeField(),
    kit: createKit(stage.kit),
    time: 0,
    spottedCount: 0,
    outcome: null, // 'escaped' | 'caught' | 'lockdown'
    events: [],
    banner: null,
  };
}

function selectTool(h, input) {
  if (input.pressed('tool1')) h.kit.selected = 'coin';
  if (input.pressed('tool2')) h.kit.selected = 'smoke';
  if (input.pressed('tool3')) h.kit.selected = 'jammer';
  const i = TOOL_ORDER.indexOf(h.kit.selected);
  if (input.pressed('toolNext')) h.kit.selected = TOOL_ORDER[(i + 1) % 3];
  if (input.pressed('toolPrev')) h.kit.selected = TOOL_ORDER[(i + 2) % 3];
}

export function stepHeist(h, input, dt) {
  if (h.outcome) return [];
  const events = [];
  const ctx = { ...h, input, dt, events, loot: h.map.loot, time: h.time };
  h.time += dt;
  beginAlarmFrame(h.alarm);

  if (h.thief.crawl) {
    if (updateCrawl(h.thief, dt)) events.push({ type: 'ventOut' });
  } else {
    updateThief(h.thief, ctx);
    selectTool(h, input);
    const vent = h.thief.active ? ventUnder(h.vents, h.thief.x, h.thief.y) : null;
    h.thief.onVent = Boolean(vent) && !h.thief.nearLoot;
    if (h.thief.onVent && input.pressed('use')) {
      startCrawl(h.thief, vent);
      events.push({ type: 'ventIn' });
    } else if (input.mouse.clicked && input.mouse.y < 520) useTool(h.kit, ctx, input.mouse.x, input.mouse.y);
  }
  h.clouds = updateSmoke(h.clouds, dt);
  ctx.clouds = h.clouds;

  for (const cam of h.cameras) updateCamera(cam, ctx);
  updateLasers(h.lasers, ctx);
  for (const g of h.guards) updateGuard(g, ctx);
  settleNoise(h.noise);
  updateNoise(h.noise, dt);

  for (const e of events) {
    if (e.type === 'camera' || e.type === 'laser') {
      let best = null;
      for (const g of h.guards) {
        const d = Math.hypot(g.x - e.x, g.y - e.y);
        if (g.state !== 'chase' && (!best || d < best.d)) best = { g, d };
      }
      if (best) sendToSearch(best.g, h.map, e.x, e.y, 0.5);
    }
    if (e.type === 'spotted') { h.spottedCount++; bumpAlarm(h.alarm, ALARM.noticeBump); h.banner = { text: 'SPOTTED!', age: 0 }; }
    if (e.type === 'loot') h.lootAt = h.time;
    if (e.type === 'laser') { h.tripped = (h.tripped ?? 0) + 1; h.banner = { text: 'LASER TRIPPED!', age: 0 }; }
    if (e.type === 'loot') h.banner = { text: 'LOOT SECURED: RUN FOR THE HATCH', age: 0 };
    if (e.type === 'caught') h.outcome = 'caught';
  }

  if (endAlarmFrame(h.alarm, dt) && !h.outcome) h.outcome = 'lockdown';

  const exit = tileCenter(h.map.exit.x, h.map.exit.y);
  if (!h.outcome && h.thief.carrying && Math.hypot(exit.x - h.thief.x, exit.y - h.thief.y) < TILE * 0.8) h.outcome = 'escaped';
  if (h.outcome) events.push({ type: h.outcome });
  if (h.banner) { h.banner.age += dt; if (h.banner.age > 2.2) h.banner = null; }
  h.events = events;
  return events;
}
