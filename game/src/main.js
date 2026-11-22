// Boots HUSHLINE: sizes the canvas to the window (crisp at any pixel ratio), runs the fixed-step
// game loop, and hands a ?shot= URL over to the screenshot stager instead.

import { VIEW_W, VIEW_H } from './config.js';
import { createInput } from './ui/input.js';
import { createGameFlow, updateGameFlow, drawGameFlow } from './ui/game-flow.js';
import { stageScreenshot } from './screenshot-stager.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

function fitCanvas() {
  const scale = Math.min(window.innerWidth / VIEW_W, window.innerHeight / VIEW_H);
  const cssW = Math.floor(VIEW_W * scale);
  const cssH = Math.floor(VIEW_H * scale);
  const dpr = window.devicePixelRatio || 1;
  canvas.style.width = `${cssW}px`;
  canvas.style.height = `${cssH}px`;
  canvas.width = Math.round(cssW * dpr);
  canvas.height = Math.round(cssH * dpr);
  ctx.setTransform(canvas.width / VIEW_W, 0, 0, canvas.height / VIEW_H, 0, 0);
}

window.addEventListener('resize', fitCanvas);
fitCanvas();

const shot = new URLSearchParams(location.search).get('shot');
if (shot) {
  stageScreenshot(ctx, shot);
} else {
  const input = createInput(canvas);
  const flow = createGameFlow();
  const STEP = 1 / 120;
  let last = performance.now();
  let acc = 0;
  const frame = (now) => {
    acc += Math.min(0.1, (now - last) / 1000);
    last = now;
    while (acc >= STEP) {
      updateGameFlow(flow, input, STEP);
      input.endFrame();
      acc -= STEP;
    }
    ctx.clearRect(0, 0, VIEW_W, VIEW_H);
    drawGameFlow(ctx, flow, input.mouse);
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}
