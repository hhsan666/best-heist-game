// The screens around the heist: title, job briefing, pause, the stage result and the night's
// final tally. Each draws over a dimmed live room so the game never stops looking like itself.

import { COLORS, VIEW_W, VIEW_H, TOOLS } from '../config.js';
import { drawRoom } from './draw-scene.js';
import { drawToolIcon } from './draw-hud.js';
import { formatTime, money } from '../heist/scoring.js';
import { TOOL_ORDER } from '../gear/tools.js';

const FONT = '"Trebuchet MS", Verdana, sans-serif';

function dim(ctx, alpha) {
  ctx.fillStyle = `rgba(6,8,16,${alpha})`;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
}

function text(ctx, s, x, y, { size = 16, color = COLORS.text, align = 'left', bold = false } = {}) {
  ctx.font = `${bold ? 'bold ' : ''}${size}px ${FONT}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = color;
  ctx.fillText(s, x, y);
}

function panel(ctx, x, y, w, h, edge = COLORS.hudLine) {
  ctx.fillStyle = 'rgba(12,16,30,0.92)';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = edge;
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
}

function logo(ctx, x, y, size, time) {
  ctx.font = `bold ${size}px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  const letters = 'HUSHLINE';
  const w = ctx.measureText(letters).width;
  let cx = x - w / 2;
  for (let i = 0; i < letters.length; i++) {
    const ch = letters[i];
    const cw = ctx.measureText(ch).width;
    const lit = 0.55 + 0.45 * Math.sin(time * 1.5 - i * 0.6);
    ctx.fillStyle = i < 4 ? `rgba(70,230,205,${0.6 + 0.4 * lit})` : `rgba(255,207,74,${0.6 + 0.4 * lit})`;
    ctx.fillText(ch, cx + cw / 2, y);
    cx += cw;
  }
  // a cone-shaped underline: the beam you will learn to dodge
  const g = ctx.createLinearGradient(x - w / 2, 0, x + w / 2, 0);
  g.addColorStop(0, 'rgba(255,196,64,0)');
  g.addColorStop(0.5, 'rgba(255,196,64,0.8)');
  g.addColorStop(1, 'rgba(255,196,64,0)');
  ctx.fillStyle = g;
  ctx.fillRect(x - w / 2, y + 10, w, 3);
}

export function drawTitle(ctx, attract, time, blink) {
  drawRoom(ctx, attract, time);
  dim(ctx, 0.62);
  logo(ctx, VIEW_W / 2, 150, 96, time);
  text(ctx, 'a quiet heist in three jobs', VIEW_W / 2, 196, { size: 22, color: COLORS.dim, align: 'center' });
  panel(ctx, 250, 236, 460, 236);
  text(ctx, 'HOW TO STEAL', 270, 266, { size: 15, bold: true, color: COLORS.loot });
  const lines = [
    ['WASD / arrows', 'move'],
    ['hold SHIFT', 'sneak: silent, slower'],
    ['hold E', 'crack the loot case'],
    ['1 2 3 / wheel', 'pick coin, smoke, jammer'],
    ['mouse click', 'throw / use the tool (costs $)'],
    ['P / ESC', 'pause      M  mute'],
  ];
  lines.forEach(([k, v], i) => {
    text(ctx, k, 270, 296 + i * 26, { size: 15, bold: true });
    text(ctx, v, 430, 296 + i * 26, { size: 15, color: COLORS.dim });
  });
  text(ctx, 'Teal = safe shadow.  Amber/red = guard sight.  Pink = camera.  Gold = loot.', VIEW_W / 2, 500, { size: 14, color: COLORS.safe, align: 'center' });
  if (blink) text(ctx, 'PRESS ENTER OR CLICK TO BEGIN THE NIGHT', VIEW_W / 2, 548, { size: 20, bold: true, align: 'center' });
}

export function drawBriefing(ctx, preview, stage, index, total, time) {
  drawRoom(ctx, preview, time);
  dim(ctx, 0.45);
  panel(ctx, 150, 110, 660, 330, COLORS.loot);
  text(ctx, `JOB ${index + 1} OF 3`, 180, 148, { size: 14, bold: true, color: COLORS.dim });
  text(ctx, stage.name, 180, 186, { size: 32, bold: true });
  text(ctx, stage.brief, 180, 220, { size: 15, color: COLORS.dim });
  text(ctx, 'TARGET', 180, 262, { size: 13, bold: true, color: COLORS.dim });
  text(ctx, `${stage.loot.name}  ${money(stage.loot.value)}`, 180, 286, { size: 20, bold: true, color: COLORS.loot });
  text(ctx, `Par ${formatTime(stage.par)}   Guards ${stage.guards.length}   Cameras ${stage.cameras.length}`, 180, 318, { size: 15 });
  text(ctx, 'KIT (each use is paid from the take)', 180, 352, { size: 13, bold: true, color: COLORS.dim });
  TOOL_ORDER.forEach((name, i) => {
    const x = 190 + i * 200;
    drawToolIcon(ctx, name, x, 380);
    text(ctx, `${TOOLS[name].label} x${stage.kit[name]}  -$${TOOLS[name].cost}`, x + 18, 386, { size: 15, bold: true });
  });
  text(ctx, `Night so far: ${money(total)}`, 180, 420, { size: 14, color: COLORS.calm });
  if (Math.sin(time * 4) > -0.3) text(ctx, 'ENTER: go in', 780, 420, { size: 16, bold: true, align: 'right' });
}

export function drawPause(ctx) {
  dim(ctx, 0.6);
  text(ctx, 'PAUSED', VIEW_W / 2, 250, { size: 48, bold: true, align: 'center' });
  text(ctx, 'P / ESC resume     R restart job     M mute', VIEW_W / 2, 300, { size: 18, color: COLORS.dim, align: 'center' });
}

export function drawResult(ctx, h, score, total, time) {
  const ok = score.escaped;
  const title = ok ? 'CLEAN GETAWAY' : h.outcome === 'caught' ? 'NABBED' : 'LOCKDOWN';
  const edge = ok ? COLORS.exit : COLORS.danger;
  panel(ctx, 220, 70, 520, 400, edge);
  text(ctx, h.stage.name.toUpperCase(), VIEW_W / 2, 108, { size: 14, bold: true, color: COLORS.dim, align: 'center' });
  text(ctx, title, VIEW_W / 2, 156, { size: 44, bold: true, color: edge, align: 'center' });
  const reason = ok ? `${h.stage.loot.name} is in the van.`
    : h.outcome === 'caught' ? 'A guard got a hand on your collar.' : 'The alarm hit 100%: shutters down.';
  text(ctx, reason, VIEW_W / 2, 186, { size: 15, color: COLORS.dim, align: 'center' });
  const rows = [
    ['Loot', money(score.loot), COLORS.loot],
    ['Kit used', `-${money(score.toolCost)}`, COLORS.warn],
    [`Heat (${score.spotted} spotted, peak ${score.peak}%)`, `-${money(score.heat)}`, COLORS.danger],
    [`Speed bonus (${formatTime(score.time)} vs par ${formatTime(h.stage.par)})`, `+${money(score.speed)}`, COLORS.calm],
  ];
  rows.forEach(([k, v, c], i) => {
    text(ctx, k, 260, 230 + i * 32, { size: 16 });
    text(ctx, v, 700, 230 + i * 32, { size: 16, bold: true, color: c, align: 'right' });
  });
  ctx.fillStyle = COLORS.hudLine;
  ctx.fillRect(260, 352, 440, 2);
  text(ctx, 'TAKE', 260, 384, { size: 20, bold: true });
  text(ctx, money(score.take), 700, 384, { size: 26, bold: true, color: ok ? COLORS.loot : COLORS.dim, align: 'right' });
  stamp(ctx, score.rank, 470, 378, ok ? COLORS.exit : COLORS.danger, time);
  const next = ok ? (h.stageIndex < 2 ? 'ENTER: next job' : 'ENTER: count the night') : 'R / ENTER: try the job again';
  text(ctx, `${next}     Night so far ${money(total)}`, VIEW_W / 2, 446, { size: 15, bold: true, align: 'center' });
}

function stamp(ctx, word, x, y, color, time) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-0.22 + Math.sin(time * 2) * 0.01);
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.font = `bold 20px ${FONT}`;
  const w = ctx.measureText(word).width + 24;
  ctx.strokeRect(-w / 2, -18, w, 36);
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(word, 0, 1);
  ctx.restore();
}

export function drawFinal(ctx, results, total, time) {
  dim(ctx, 0.75);
  logo(ctx, VIEW_W / 2, 110, 54, time);
  text(ctx, "THE NIGHT'S TAKE", VIEW_W / 2, 160, { size: 20, bold: true, color: COLORS.dim, align: 'center' });
  text(ctx, money(total), VIEW_W / 2, 230, { size: 64, bold: true, color: COLORS.loot, align: 'center' });
  results.forEach((r, i) => {
    const y = 300 + i * 40;
    text(ctx, r.name, 260, y, { size: 18, bold: true });
    text(ctx, r.rank, 560, y, { size: 18, bold: true, color: r.rank === 'GHOST' ? COLORS.safe : COLORS.warn, align: 'center' });
    text(ctx, money(r.take), 700, y, { size: 18, bold: true, color: COLORS.loot, align: 'right' });
  });
  text(ctx, 'ENTER: start a new night', VIEW_W / 2, 470, { size: 18, bold: true, align: 'center' });
}
