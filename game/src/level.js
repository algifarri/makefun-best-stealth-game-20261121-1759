// Level parsing: turn a level map's strings into the tiles the rules and the
// renderer share — walls, crates, bushes, lamps, shards, the exit and the start.
import { COLS, FIELD_X, FIELD_Y, ROWS, TILE } from './config.js';

export function tileToPx(tx, ty) {
  return { x: FIELD_X + tx * TILE + TILE / 2, y: FIELD_Y + ty * TILE + TILE / 2 };
}

export function pxToTile(x, y) {
  return { x: Math.floor((x - FIELD_X) / TILE), y: Math.floor((y - FIELD_Y) / TILE) };
}

export function parseLevel(def) {
  const walls = new Set();
  const crates = new Set();
  const bushes = new Set();
  const shards = [];
  let start = { x: 2, y: 2 };
  let exit = { x: 25, y: 14 };
  const guards = [];
  for (let y = 0; y < ROWS; y += 1) {
    const row = def.map[y];
    for (let x = 0; x < COLS; x += 1) {
      const ch = row[x];
      const key = `${x},${y}`;
      if (ch === '#') walls.add(key);
      else if (ch === 'C') crates.add(key);
      else if (ch === 'B') bushes.add(key);
      else if (ch === '*') shards.push({ tx: x, ty: y, taken: false });
      else if (ch === 'S') start = { x, y };
      else if (ch === 'E') exit = { x, y };
      else if (ch === 'G') guards.push({ x, y });
    }
  }
  const lamps = def.lamps.map((lamp) => ({ ...tileToPx(lamp.x, lamp.y), tx: lamp.x, ty: lamp.y, radius: 132 }));
  return { walls, crates, bushes, shards, start, exit, lamps, guards, def };
}

/** A tile blocks movement (walls and crates; bushes are walkable). */
export function isSolidTile(level, tx, ty) {
  if (tx < 0 || ty < 0 || tx >= COLS || ty >= ROWS) return true;
  return level.walls.has(`${tx},${ty}`) || level.crates.has(`${tx},${ty}`);
}

/** A tile blocks a guard's line of sight (walls, crates and bushes). */
export function blocksSightTile(level, tx, ty) {
  if (tx < 0 || ty < 0 || tx >= COLS || ty >= ROWS) return true;
  const key = `${tx},${ty}`;
  return level.walls.has(key) || level.crates.has(key) || level.bushes.has(key);
}

/** Is a point inside a bush tile (a hiding spot)? */
export function inBush(level, x, y) {
  const { x: tx, y: ty } = pxToTile(x, y);
  return level.bushes.has(`${tx},${ty}`);
}

/** Is a point inside any lamp's pool of light? */
export function inLight(level, x, y) {
  for (let i = 0; i < level.lamps.length; i += 1) {
    const lamp = level.lamps[i];
    const dx = x - lamp.x;
    const dy = y - lamp.y;
    if (dx * dx + dy * dy < lamp.radius * lamp.radius) return true;
  }
  return false;
}
