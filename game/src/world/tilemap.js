// The room as a grid: parses a stage's map strings into tiles and answers what stands where.

import { TILE, COLS, ROWS } from '../config.js';

export const WALL = '#';
export const CRATE = 'c';
export const SHADOW = ':';
export const FLOOR = '.';

export function parseTilemap(rows) {
  if (rows.length !== ROWS) throw new Error(`map has ${rows.length} rows, expected ${ROWS}`);
  const tiles = [];
  let start = null;
  let loot = null;
  let exit = null;
  rows.forEach((row, y) => {
    if (row.length !== COLS) throw new Error(`map row ${y} has ${row.length} columns, expected ${COLS}`);
    for (let x = 0; x < COLS; x++) {
      let ch = row[x];
      if (ch === 'P') { start = { x, y }; ch = FLOOR; }
      if (ch === '$') { loot = { x, y }; ch = FLOOR; }
      if (ch === 'X') { exit = { x, y }; ch = FLOOR; }
      tiles.push(ch);
    }
  });
  if (!start || !loot || !exit) throw new Error('map needs P, $ and X');
  return { tiles, start, loot, exit };
}

export function tileAt(map, tx, ty) {
  if (tx < 0 || ty < 0 || tx >= COLS || ty >= ROWS) return WALL;
  return map.tiles[ty * COLS + tx];
}

export function isSolidTile(map, tx, ty) {
  const t = tileAt(map, tx, ty);
  return t === WALL || t === CRATE;
}

export function isSolidAt(map, px, py) {
  return isSolidTile(map, Math.floor(px / TILE), Math.floor(py / TILE));
}

export function isShadowAt(map, px, py) {
  return tileAt(map, Math.floor(px / TILE), Math.floor(py / TILE)) === SHADOW;
}

export function tileCenter(tx, ty) {
  return { x: (tx + 0.5) * TILE, y: (ty + 0.5) * TILE };
}

// Whether a circle of radius r centred on (px, py) overlaps a solid tile.
export function circleHitsWall(map, px, py, r) {
  const x0 = Math.floor((px - r) / TILE);
  const x1 = Math.floor((px + r) / TILE);
  const y0 = Math.floor((py - r) / TILE);
  const y1 = Math.floor((py + r) / TILE);
  for (let ty = y0; ty <= y1; ty++) {
    for (let tx = x0; tx <= x1; tx++) {
      if (!isSolidTile(map, tx, ty)) continue;
      const nx = Math.max(tx * TILE, Math.min(px, (tx + 1) * TILE));
      const ny = Math.max(ty * TILE, Math.min(py, (ty + 1) * TILE));
      if ((nx - px) ** 2 + (ny - py) ** 2 < r * r) return true;
    }
  }
  return false;
}

// Moves a circle by (dx, dy), sliding along walls one axis at a time.
export function slideMove(map, pos, dx, dy, r) {
  if (!circleHitsWall(map, pos.x + dx, pos.y, r)) pos.x += dx;
  if (!circleHitsWall(map, pos.x, pos.y + dy, r)) pos.y += dy;
}
