// The night's flow from screen to screen: title, briefing, the heist, pause, the stage result
// and the final tally. It owns the run's state and feeds input to whichever screen is up.

import { STAGES } from '../levels/stages.js';
import { createHeist, stepHeist } from '../heist/heist-session.js';
import { scoreStage } from '../heist/scoring.js';
import { drawHeistFrame } from '../render/draw-scene.js';
import { drawOutro } from '../render/draw-outro.js';
import { drawTitle, drawBriefing, drawPause, drawResult, drawFinal } from '../render/draw-screens.js';
import { sfx, playEvents, unlockAudio, toggleMute } from '../audio/sfx.js';
import { updateAmbience } from '../audio/ambience.js';

export const IDLE_INPUT = { held: () => false, pressed: () => false, mouse: { clicked: false, x: 0, y: 0, inside: false } };

export function createGameFlow() {
  return {
    screen: 'title',
    stageIndex: 0,
    heist: null,
    attract: idleRoom(1),
    preview: null,
    results: [],
    lastScore: null,
    time: 0,
  };
}

// A stage with no thief in it: guards walk their beats and cameras sweep, behind menus.
export function idleRoom(stageIndex) {
  const h = createHeist(stageIndex);
  h.thief.active = false;
  return h;
}

function nightTotal(flow) {
  return flow.results.reduce((sum, r) => sum + r.take, 0);
}

function beginBriefing(flow, index) {
  flow.stageIndex = index;
  flow.preview = idleRoom(index);
  flow.screen = 'briefing';
}

export function updateGameFlow(flow, input, dt) {
  flow.time += dt;
  const go = input.pressed('confirm') || input.mouse.clicked;
  if (go || input.pressed('mute')) unlockAudio();
  if (input.pressed('mute')) toggleMute();

  switch (flow.screen) {
    case 'title':
      stepHeist(flow.attract, IDLE_INPUT, dt);
      if (go) { sfx.confirm(); flow.results = []; beginBriefing(flow, 0); }
      break;
    case 'briefing':
      stepHeist(flow.preview, IDLE_INPUT, dt);
      if (input.pressed('confirm') || input.mouse.clicked) {
        sfx.confirm();
        flow.heist = createHeist(flow.stageIndex);
        flow.screen = 'play';
      }
      break;
    case 'play': {
      flow.casing = input.held('case');
      if (input.pressed('pause')) { flow.screen = 'paused'; break; }
      const events = stepHeist(flow.heist, input, dt);
      playEvents(events);
      updateAmbience(dt, flow.heist.alarm.level, true);
      if (flow.heist.outcome) {
        flow.lastScore = scoreStage(flow.heist);
        flow.screen = 'outro';
        flow.outro = 0;
      }
      break;
    }
    case 'outro':
      flow.outro += dt;
      if (flow.outro > 1.7 || (flow.outro > 0.4 && go)) flow.screen = 'result';
      break;
    case 'paused':
      if (input.pressed('pause')) flow.screen = 'play';
      if (input.pressed('retry')) { flow.heist = createHeist(flow.stageIndex); flow.screen = 'play'; }
      break;
    case 'result': {
      const ok = flow.lastScore.escaped;
      if (ok && input.pressed('confirm')) {
        sfx.confirm();
        flow.results.push({ name: flow.heist.stage.name, take: flow.lastScore.take, rank: flow.lastScore.rank, time: flow.lastScore.time });
        if (flow.stageIndex + 1 < STAGES.length) beginBriefing(flow, flow.stageIndex + 1);
        else flow.screen = 'final';
      } else if (!ok && (input.pressed('retry') || input.pressed('confirm'))) {
        sfx.confirm();
        flow.heist = createHeist(flow.stageIndex);
        flow.screen = 'play';
      }
      break;
    }
    case 'final':
      stepHeist(flow.attract, IDLE_INPUT, dt);
      if (input.pressed('confirm')) { sfx.confirm(); flow.screen = 'title'; }
      break;
  }
}

export function drawGameFlow(ctx, flow, mouse) {
  const t = flow.time;
  switch (flow.screen) {
    case 'title':
      drawTitle(ctx, flow.attract, t, Math.sin(t * 4) > -0.3);
      break;
    case 'briefing':
      drawBriefing(ctx, flow.preview, STAGES[flow.stageIndex], flow.stageIndex, nightTotal(flow), t);
      break;
    case 'play':
      drawHeistFrame(ctx, flow.heist, t, mouse, flow.casing);
      break;
    case 'outro':
      drawHeistFrame(ctx, flow.heist, t, null);
      drawOutro(ctx, flow.heist, flow.outro / 1.7);
      break;
    case 'paused':
      drawHeistFrame(ctx, flow.heist, t, null);
      drawPause(ctx);
      break;
    case 'result':
      drawHeistFrame(ctx, flow.heist, t, null);
      drawResult(ctx, flow.heist, flow.lastScore, nightTotal(flow) + (flow.lastScore.escaped ? flow.lastScore.take : 0), t);
      break;
    case 'final':
      drawHeistFrame(ctx, flow.attract, t, null);
      drawFinal(ctx, flow.results, nightTotal(flow), t);
      break;
  }
}
