// Breadth-first routes over the tile grid, for guards walking beats, searching and chasing.

import { COLS, ROWS, TILE } from '../config.js';
import { isSolidTile } from './tilemap.js';

const STEPS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

export function findPath(map, from, to) {
  const start = from.y * COLS + from.x;
  const goal = to.y * COLS + to.x;
  if (isSolidTile(map, to.x, to.y)) return [];
  if (start === goal) return [{ x: to.x, y: to.y }];
  const prev = new Int32Array(COLS * ROWS).fill(-1);
  prev[start] = start;
  const queue = [start];
  for (let head = 0; head < queue.length; head++) {
    const cur = queue[head];
    if (cur === goal) break;
    const cx = cur % COLS;
    const cy = (cur - cx) / COLS;
    for (const [sx, sy] of STEPS) {
      const nx = cx + sx;
      const ny = cy + sy;
      if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS) continue;
      const n = ny * COLS + nx;
      if (prev[n] !== -1 || isSolidTile(map, nx, ny)) continue;
      prev[n] = cur;
      queue.push(n);
    }
  }
  if (prev[goal] === -1) return [];
  const path = [];
  for (let at = goal; at !== start; at = prev[at]) path.push({ x: at % COLS, y: Math.floor(at / COLS) });
  return path.reverse();
}

export function toTile(px, py) {
  return { x: Math.floor(px / TILE), y: Math.floor(py / TILE) };
}
