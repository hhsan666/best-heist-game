// The building's alarm meter. Cameras and chasing guards fill it; it drains slowly while nobody
// is watching. Past the hot line guards hurry and see faster; full means lockdown and the job fails.

import { ALARM } from '../config.js';

export function createAlarm() {
  return { level: 0, peak: 0, chasing: false, cameraSaw: false, flash: 0 };
}

export function beginAlarmFrame(alarm) {
  alarm.chasing = false;
  alarm.cameraSaw = false;
}

export function bumpAlarm(alarm, amount) {
  alarm.level = Math.min(ALARM.max, alarm.level + amount);
  alarm.flash = 0.6;
}

export function endAlarmFrame(alarm, dt) {
  if (alarm.chasing) alarm.level += ALARM.chasePerSecond * dt;
  if (!alarm.chasing && !alarm.cameraSaw) alarm.level -= ALARM.decayPerSecond * dt;
  alarm.level = Math.max(0, Math.min(ALARM.max, alarm.level));
  alarm.peak = Math.max(alarm.peak, alarm.level);
  alarm.flash = Math.max(0, alarm.flash - dt);
  return alarm.level >= ALARM.max;
}

export function alarmBand(level) {
  if (level >= 85) return 'LOCKDOWN IMMINENT';
  if (level >= ALARM.hotLevel) return 'HOT';
  if (level >= 25) return 'UNEASY';
  return 'QUIET';
}
