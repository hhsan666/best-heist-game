// The strip under the room: stage and clock, the alarm meter, the loot status and the kit,
// plus the banner that flashes "SPOTTED!" and the red edge glow when the alarm runs hot.

import { COLORS, MAP_H, VIEW_W, HUD_H, TOOLS, ALARM } from '../config.js';
import { TOOL_ORDER } from '../gear/tools.js';
import { alarmBand } from '../stealth/alarm-meter.js';
import { formatTime, money } from '../heist/scoring.js';

const FONT = '"Trebuchet MS", Verdana, sans-serif';

export function drawHud(ctx, h, time) {
  const y = MAP_H;
  ctx.fillStyle = COLORS.hud;
  ctx.fillRect(0, y, VIEW_W, HUD_H);
  ctx.fillStyle = COLORS.hudLine;
  ctx.fillRect(0, y, VIEW_W, 2);

  // stage and clock
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = COLORS.dim;
  ctx.font = `bold 11px ${FONT}`;
  ctx.fillText(`JOB ${h.stageIndex + 1}/3`, 14, y + 22);
  ctx.fillStyle = COLORS.text;
  ctx.font = `bold 16px ${FONT}`;
  ctx.fillText(h.stage.name, 14, y + 42);
  ctx.font = `12px ${FONT}`;
  ctx.fillStyle = h.time > h.stage.par ? COLORS.warn : COLORS.dim;
  ctx.fillText(`${formatTime(h.time)}  par ${formatTime(h.stage.par)}`, 14, y + 62);
  ctx.fillStyle = h.thief.carrying ? COLORS.exit : COLORS.loot;
  ctx.font = `bold 12px ${FONT}`;
  ctx.fillText(h.thief.carrying ? 'LOOT IN BAG > EXIT' : `TARGET ${money(h.stage.loot.value)}`, 130, y + 62);

  drawAlarmMeter(ctx, h.alarm, 300, y + 12, time);
  drawKit(ctx, h.kit, 640, y + 10);
}

function drawAlarmMeter(ctx, alarm, x, y, time) {
  const w = 320;
  const level = alarm.level;
  const color = level >= ALARM.hotLevel ? COLORS.danger : level >= 25 ? COLORS.warn : COLORS.calm;
  ctx.textAlign = 'left';
  ctx.font = `bold 13px ${FONT}`;
  ctx.fillStyle = COLORS.text;
  ctx.fillText('ALARM', x, y + 12);
  ctx.textAlign = 'right';
  ctx.fillStyle = color;
  ctx.fillText(`${Math.floor(level)}%  ${alarmBand(level)}`, x + w, y + 12);
  const segs = 20;
  const sw = w / segs;
  for (let i = 0; i < segs; i++) {
    const on = (i + 1) / segs <= level / 100 + 0.0001 || (i / segs < level / 100);
    const segColor = i >= 17 ? COLORS.danger : i >= 12 ? '#ff7a3c' : i >= 5 ? COLORS.warn : COLORS.calm;
    ctx.fillStyle = on ? segColor : '#1f2640';
    if (on && level >= 85 && Math.sin(time * 14) > 0) ctx.fillStyle = '#ffffff';
    ctx.fillRect(x + i * sw + 1, y + 20, sw - 3, 22);
  }
  // hot line marker
  ctx.fillStyle = COLORS.text;
  ctx.fillRect(x + w * (ALARM.hotLevel / 100) - 1, y + 16, 2, 30);
  ctx.textAlign = 'left';
  ctx.font = `10px ${FONT}`;
  ctx.fillStyle = COLORS.dim;
  ctx.fillText('cameras fill it fast - full = lockdown', x, y + 58);
}

function drawKit(ctx, kit, x, y) {
  TOOL_ORDER.forEach((name, i) => {
    const tool = TOOLS[name];
    const sx = x + i * 106;
    const sel = kit.selected === name;
    const left = kit.counts[name];
    ctx.fillStyle = sel ? '#1d3346' : '#141a2c';
    ctx.fillRect(sx, y, 98, 60);
    ctx.strokeStyle = sel ? '#82f0ff' : COLORS.hudLine;
    ctx.lineWidth = sel ? 2 : 1;
    ctx.strokeRect(sx + 0.5, y + 0.5, 97, 59);
    drawToolIcon(ctx, name, sx + 20, y + 30, left > 0);
    ctx.textAlign = 'left';
    ctx.fillStyle = left > 0 ? COLORS.text : COLORS.dim;
    ctx.font = `bold 12px ${FONT}`;
    ctx.fillText(tool.label, sx + 38, y + 22);
    ctx.font = `bold 15px ${FONT}`;
    ctx.fillText(`x${left}`, sx + 38, y + 41);
    ctx.font = `11px ${FONT}`;
    ctx.fillStyle = COLORS.warn;
    ctx.fillText(`-$${tool.cost}`, sx + 62, y + 41);
    ctx.fillStyle = COLORS.dim;
    ctx.font = `bold 10px ${FONT}`;
    ctx.fillText(`[${tool.key}]`, sx + 6, y + 13);
  });
}

export function drawToolIcon(ctx, name, x, y, live = true) {
  ctx.globalAlpha = live ? 1 : 0.35;
  if (name === 'coin') {
    ctx.fillStyle = COLORS.loot;
    ctx.beginPath(); ctx.arc(x, y, 9, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#a87d1e'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.stroke();
  } else if (name === 'smoke') {
    ctx.fillStyle = '#c8d2e6';
    for (const [dx, dy, r] of [[-5, 2, 6], [4, 3, 7], [0, -4, 7]]) { ctx.beginPath(); ctx.arc(x + dx, y + dy, r, 0, Math.PI * 2); ctx.fill(); }
  } else {
    ctx.fillStyle = '#8fa2ff';
    ctx.fillRect(x - 8, y - 6, 16, 12);
    ctx.strokeStyle = '#8fa2ff'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x + 4, y - 6); ctx.lineTo(x + 8, y - 13); ctx.stroke();
    ctx.beginPath(); ctx.arc(x + 8, y - 13, 4, -2.4, -0.6); ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

export function drawBanner(ctx, h) {
  if (!h.banner) return;
  const a = Math.min(1, (2.2 - h.banner.age) * 2);
  ctx.globalAlpha = Math.max(0, a);
  const danger = h.banner.text.startsWith('SPOTTED');
  ctx.font = `bold 30px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const w = ctx.measureText(h.banner.text).width + 40;
  ctx.fillStyle = danger ? 'rgba(120,10,24,0.85)' : 'rgba(20,60,40,0.85)';
  ctx.fillRect(VIEW_W / 2 - w / 2, 34, w, 46);
  ctx.fillStyle = danger ? '#ffd6d6' : COLORS.exit;
  ctx.fillText(h.banner.text, VIEW_W / 2, 58);
  ctx.globalAlpha = 1;
}

export function drawAlarmVignette(ctx, alarm, time) {
  if (alarm.level < ALARM.hotLevel && alarm.flash <= 0) return;
  const k = Math.max((alarm.level - ALARM.hotLevel) / (100 - ALARM.hotLevel), alarm.flash);
  const pulse = 0.55 + 0.45 * Math.sin(time * 9);
  const g = ctx.createRadialGradient(VIEW_W / 2, MAP_H / 2, MAP_H * 0.35, VIEW_W / 2, MAP_H / 2, VIEW_W * 0.62);
  g.addColorStop(0, 'rgba(255,0,40,0)');
  g.addColorStop(1, `rgba(255,20,50,${0.45 * k * pulse})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, VIEW_W, MAP_H);
}

// One line of advice at the top of the room, from what is happening right now.
export function hintFor(h) {
  if (h.thief.nearLoot) return { text: 'Hold E to crack the case', color: COLORS.loot };
  if (h.thief.crawl) return { text: 'Crawling through the vent: nobody can see you', color: COLORS.safe };
  if (h.thief.onVent) return { text: 'Press E to crawl through the vent', color: COLORS.safe };
  if (h.thief.carrying && h.time - (h.lootAt ?? h.time) < 6) return { text: 'Loot in the bag: reach the green EXIT', color: COLORS.exit };
  if (h.guards.some((g) => g.state === 'suspicious')) return { text: '? means suspicious: break line of sight before the gauge fills', color: COLORS.warn };
  if (h.guards.some((g) => g.state === 'chase')) return { text: 'Chased! Guards are slower than you: lose them round a corner or in shadow', color: COLORS.danger };
  if (h.stageIndex === 0 && h.time < 16) return { text: 'SHIFT sneaks silently. Teal shadows hide you. Hold Q to case the guard beats.', color: COLORS.safe };
  return null;
}

export function drawHint(ctx, h) {
  if (h.banner || h.outcome) return;
  const hint = hintFor(h);
  if (!hint) return;
  ctx.font = `bold 14px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const w = ctx.measureText(hint.text).width + 28;
  ctx.fillStyle = 'rgba(8,10,20,0.82)';
  ctx.fillRect(VIEW_W / 2 - w / 2, 8, w, 26);
  ctx.strokeStyle = hint.color;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(VIEW_W / 2 - w / 2 + 0.5, 8.5, w - 1, 25);
  ctx.fillStyle = hint.color;
  ctx.fillText(hint.text, VIEW_W / 2, 22);
}
