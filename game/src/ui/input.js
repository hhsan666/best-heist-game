// Keyboard and mouse, mapped to the game's actions. The mouse position is kept in the game's own
// 960x600 coordinates whatever size the canvas is drawn at.

import { VIEW_W, VIEW_H } from '../config.js';

const BINDINGS = {
  up: ['KeyW', 'ArrowUp'],
  down: ['KeyS', 'ArrowDown'],
  left: ['KeyA', 'ArrowLeft'],
  right: ['KeyD', 'ArrowRight'],
  sneak: ['ShiftLeft', 'ShiftRight'],
  use: ['KeyE'],
  confirm: ['Enter', 'Space'],
  pause: ['Escape', 'KeyP'],
  retry: ['KeyR'],
  tool1: ['Digit1'],
  tool2: ['Digit2'],
  tool3: ['Digit3'],
  mute: ['KeyM'],
};

export function createInput(canvas) {
  const down = new Set();
  const pressed = new Set();
  const mouse = { x: VIEW_W / 2, y: VIEW_H / 2, clicked: false, inside: false };
  const actionOf = (code) => Object.keys(BINDINGS).filter((a) => BINDINGS[a].includes(code));

  window.addEventListener('keydown', (e) => {
    const acts = actionOf(e.code);
    if (acts.length) e.preventDefault();
    for (const a of acts) {
      if (!down.has(a)) pressed.add(a);
      down.add(a);
    }
  });
  window.addEventListener('keyup', (e) => { for (const a of actionOf(e.code)) down.delete(a); });
  window.addEventListener('blur', () => down.clear());

  const toGame = (e) => {
    const r = canvas.getBoundingClientRect();
    mouse.x = ((e.clientX - r.left) / r.width) * VIEW_W;
    mouse.y = ((e.clientY - r.top) / r.height) * VIEW_H;
  };
  canvas.addEventListener('mousemove', (e) => { toGame(e); mouse.inside = true; });
  canvas.addEventListener('mouseleave', () => { mouse.inside = false; });
  canvas.addEventListener('mousedown', (e) => { toGame(e); if (e.button === 0) mouse.clicked = true; });
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  canvas.addEventListener('wheel', (e) => { e.preventDefault(); pressed.add(e.deltaY > 0 ? 'toolNext' : 'toolPrev'); }, { passive: false });

  return {
    mouse,
    held: (a) => down.has(a),
    pressed: (a) => pressed.has(a),
    endFrame() { pressed.clear(); mouse.clicked = false; },
  };
}
