// Guard behaviour: a small state machine per guard.
//   patrol      walks its beat, pausing at each corner to glance around
//   suspicious  half-saw something: stops, stares, and fills its suspicion meter
//   search      walks to a noise or a last sighting and looks around there
//   chase       has seen the thief: runs at them, raising the alarm, and catches on contact

import { GUARD, ALARM } from '../config.js';
import { findPath, toTile } from '../world/pathfind.js';
import { tileCenter, slideMove } from '../world/tilemap.js';
import { sightStrength, angleDiff } from './vision-cone.js';
import { freshNoisesNear } from './noise.js';

export function createGuard(def, index) {
  const first = def.route[0];
  const c = tileCenter(first[0], first[1]);
  const next = def.route[1] ?? first;
  return {
    id: index,
    x: c.x,
    y: c.y,
    facing: Math.atan2(next[1] - first[1], next[0] - first[0]),
    route: def.route,
    routeIndex: 1 % def.route.length,
    path: [],
    state: 'patrol',
    suspicion: 0,
    target: null,
    linger: 0,
    pause: 0,
    lookBase: 0,
    seeing: false,
    lostFor: 0,
    stepPhase: index * 1.7,
  };
}

export function guardEye(g) {
  return { x: g.x, y: g.y, facing: g.facing, halfFov: GUARD.fov, range: g.state === 'chase' ? GUARD.alertRange : GUARD.range };
}

function turnToward(g, angle, dt, rate = GUARD.turnRate) {
  const d = angleDiff(angle, g.facing);
  const step = rate * dt;
  g.facing += Math.abs(d) <= step ? d : Math.sign(d) * step;
}

function walkPath(g, map, speed, dt) {
  if (g.path.length === 0) return true;
  const node = tileCenter(g.path[0].x, g.path[0].y);
  const dx = node.x - g.x;
  const dy = node.y - g.y;
  const dist = Math.hypot(dx, dy);
  const step = speed * dt;
  if (dist <= step) {
    g.x = node.x;
    g.y = node.y;
    g.path.shift();
  } else {
    g.x += (dx / dist) * step;
    g.y += (dy / dist) * step;
    turnToward(g, Math.atan2(dy, dx), dt);
  }
  g.stepPhase += dt * speed * 0.12;
  return g.path.length === 0;
}

function headTo(g, map, px, py) {
  g.path = findPath(map, toTile(g.x, g.y), toTile(px, py));
}

export function sendToSearch(g, map, x, y, suspicion = 0.35) {
  if (g.state === 'chase') return;
  g.state = 'search';
  g.target = { x, y };
  g.suspicion = Math.max(g.suspicion, suspicion);
  g.linger = 0;
  headTo(g, map, x, y);
}

function lookAround(g, dt, t) {
  g.facing = g.lookBase + Math.sin(t * 2.2) * 1.1;
}

export function updateGuard(g, ctx) {
  const { map, clouds, thief, dt, events, noise } = ctx;
  const hot = ctx.alarm.level >= ALARM.hotLevel;
  const strength = thief.active ? sightStrength(map, clouds, guardEye(g), thief) : 0;
  g.seeing = strength > 0;

  if (g.seeing) {
    g.lastSeen = { x: thief.x, y: thief.y };
    g.lostFor = 0;
    if (g.state !== 'chase') {
      g.suspicion += dt * GUARD.suspicionRise * (0.45 + strength * 1.4) * (hot ? 1.6 : 1);
      if (g.state === 'patrol' && g.suspicion > 0.2) { g.state = 'suspicious'; events.push({ type: 'huh', guard: g }); }
      if (g.suspicion >= 1) {
        g.suspicion = 1;
        g.state = 'chase';
        events.push({ type: 'spotted', guard: g });
      }
    }
  } else if (g.state !== 'chase') {
    g.suspicion = Math.max(0, g.suspicion - dt * GUARD.suspicionFall);
  }

  if (g.state !== 'chase') {
    for (const r of freshNoisesNear(noise, g.x, g.y)) {
      sendToSearch(g, map, r.x, r.y, r.kind === 'coin' ? 0.3 : 0.4);
      events.push({ type: 'heard', guard: g });
    }
  }

  switch (g.state) {
    case 'patrol': {
      if (g.pause > 0) {
        g.pause -= dt;
        lookAround(g, dt, ctx.time + g.id);
        break;
      }
      if (g.path.length === 0) {
        const [tx, ty] = g.route[g.routeIndex];
        const c = tileCenter(tx, ty);
        if (Math.hypot(c.x - g.x, c.y - g.y) < 2) {
          g.routeIndex = (g.routeIndex + 1) % g.route.length;
          g.pause = 0.9;
          g.lookBase = g.facing;
        } else headTo(g, map, c.x, c.y);
      }
      walkPath(g, map, GUARD.patrolSpeed * (hot ? 1.35 : 1), dt);
      break;
    }
    case 'suspicious': {
      if (g.lastSeen) turnToward(g, Math.atan2(g.lastSeen.y - g.y, g.lastSeen.x - g.x), dt, 5);
      if (!g.seeing && g.suspicion < 0.5) {
        if (g.suspicion > 0.25 && g.lastSeen) sendToSearch(g, map, g.lastSeen.x, g.lastSeen.y, g.suspicion);
        else if (g.suspicion <= 0.05) { g.state = 'patrol'; g.path = []; }
      }
      break;
    }
    case 'search': {
      const arrived = walkPath(g, map, GUARD.searchSpeed * (hot ? 1.25 : 1), dt);
      if (g.seeing && g.lastSeen) turnToward(g, Math.atan2(g.lastSeen.y - g.y, g.lastSeen.x - g.x), dt, 5);
      if (arrived) {
        if (g.linger === 0) g.lookBase = g.facing;
        g.linger += dt;
        lookAround(g, dt, g.linger * 1.3);
        if (g.linger > GUARD.searchLinger) {
          g.state = 'patrol';
          g.path = [];
          g.suspicion = Math.min(g.suspicion, 0.15);
        }
      }
      break;
    }
    case 'chase': {
      ctx.alarm.chasing = true;
      if (g.seeing) {
        const dx = thief.x - g.x;
        const dy = thief.y - g.y;
        const d = Math.hypot(dx, dy) || 1;
        slideMove(map, g, (dx / d) * GUARD.chaseSpeed * dt, (dy / d) * GUARD.chaseSpeed * dt, GUARD.radius - 2);
        turnToward(g, Math.atan2(dy, dx), dt, 7);
        g.path = [];
        g.stepPhase += dt * GUARD.chaseSpeed * 0.12;
        if (d < GUARD.catchDistance) events.push({ type: 'caught', guard: g });
      } else {
        g.lostFor += dt;
        if (g.path.length === 0 && g.lastSeen) headTo(g, map, g.lastSeen.x, g.lastSeen.y);
        const arrived = walkPath(g, map, GUARD.chaseSpeed * 0.85, dt);
        if (arrived || g.lostFor > 5) {
          g.state = 'search';
          g.target = g.lastSeen;
          g.linger = 0.001;
          g.lookBase = g.facing;
          g.suspicion = 0.6;
          events.push({ type: 'lost', guard: g });
        }
      }
      break;
    }
  }
}
