// Shared tuning numbers and the palette for HUSHLINE. Every module reads its constants from here,
// so balancing the heist means editing one file.

export const TILE = 40;
export const COLS = 24;
export const ROWS = 13;
export const VIEW_W = 960;
export const VIEW_H = 600;
export const MAP_H = ROWS * TILE; // 520: the room; the HUD strip sits below it
export const HUD_H = VIEW_H - MAP_H;

export const THIEF = {
  radius: 12,
  walkSpeed: 118,
  sneakSpeed: 62,
  stepNoiseRadius: 105,
  stepInterval: 0.34,
  crackTime: 1.7,
};

export const GUARD = {
  radius: 13,
  patrolSpeed: 52,
  searchSpeed: 78,
  chaseSpeed: 108,
  fov: 0.95, // half-angle in radians
  range: 215,
  alertRange: 260,
  shadowRange: 58, // how close a guard must be to spot the thief standing in shadow
  suspicionRise: 1.25, // per second at mid range
  suspicionFall: 0.45,
  catchDistance: 22,
  searchLinger: 3.2,
  turnRate: 3.4,
};

export const CAMERA = {
  fov: 0.42,
  range: 250,
  alarmPerSecond: 42,
  jamTime: 7,
};

export const ALARM = {
  max: 100,
  decayPerSecond: 3,
  chasePerSecond: 14,
  noticeBump: 8,
  hotLevel: 60, // guards hurry above this
};

export const TOOLS = {
  coin: { key: '1', label: 'COIN', cost: 20, range: 280, noiseRadius: 175 },
  smoke: { key: '2', label: 'SMOKE', cost: 60, range: 220, radius: 62, life: 6.5 },
  jammer: { key: '3', label: 'JAMMER', cost: 90, range: 300, radius: 140 },
};

export const COLORS = {
  ink: '#0b0f1a',
  floor: '#151c2e',
  floorAlt: '#18203a',
  grid: 'rgba(120,150,220,0.07)',
  wall: '#232a40',
  wallTop: '#2f3854',
  wallEdge: '#6f82b8',
  crate: '#6d5238',
  crateTop: '#93714c',
  shadow: '#0a2b2f',
  shadowHatch: 'rgba(70,220,200,0.18)',
  shadowEdge: 'rgba(70,230,205,0.55)',
  safe: '#46e6cd',
  guardCone: 'rgba(255,196,64,',
  alertCone: 'rgba(255,64,64,',
  cameraCone: 'rgba(255,70,140,',
  loot: '#ffcf4a',
  lootGlow: 'rgba(255,207,74,',
  exit: '#52f59a',
  thief: '#1a1d2b',
  thiefTrim: '#46e6cd',
  guard: '#2b3f8a',
  guardTrim: '#ffd46b',
  hud: '#0d1120',
  hudLine: '#28324f',
  text: '#e8ecf8',
  dim: '#8a93b0',
  danger: '#ff4d4d',
  warn: '#ffb43c',
  calm: '#4be38f',
  smoke: 'rgba(200,210,230,',
};
