// Vision: what a guard can see. A guard sees the player when the player is inside
// the guard's cone (range + field of view) and the line of sight is clear of walls,
// crates and bushes — unless the player is crouched inside a bush, which hides them
// outright. The same ray march drives the cone the renderer paints.
import { GUARD_FOV, GUARD_RANGE } from './config.js';
import { blocksSightTile, inBush, inLight, pxToTile } from './level.js';

function angleTo(fromX, fromY, toX, toY) {
  return Math.atan2(toY - fromY, toX - fromX);
}

function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

/** March a ray from (x, y) along `angle`; return the distance to the first sight-blocking tile. */
export function castSightRay(level, x, y, angle, maxDistance) {
  const step = 6;
  const dx = Math.cos(angle) * step;
  const dy = Math.sin(angle) * step;
  let px = x;
  let py = y;
  for (let d = step; d <= maxDistance; d += step) {
    px += dx;
    py += dy;
    const { x: tx, y: ty } = pxToTile(px, py);
    if (blocksSightTile(level, tx, ty)) return d;
  }
  return maxDistance;
}

/** The cone's outline as screen points, for the renderer. */
export function conePolygon(level, guard) {
  const rays = 26;
  const points = [{ x: guard.x, y: guard.y }];
  for (let i = 0; i <= rays; i += 1) {
    const angle = guard.facing - GUARD_FOV / 2 + (GUARD_FOV * i) / rays;
    const dist = castSightRay(level, guard.x, guard.y, angle, GUARD_RANGE);
    points.push({ x: guard.x + Math.cos(angle) * dist, y: guard.y + Math.sin(angle) * dist });
  }
  return points;
}

/**
 * How fast this guard's awareness rises (per second) toward the player right now:
 * 0 when the player cannot be seen. Closer, lit and running players are spotted
 * faster; sneaking and hiding in bushes slow it right down.
 */
export function detectionRate(level, guard, player) {
  if (inBush(level, player.x, player.y)) return 0;
  const dx = player.x - guard.x;
  const dy = player.y - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist > GUARD_RANGE) return 0;
  if (Math.abs(angleDiff(angleTo(guard.x, guard.y, player.x, player.y), guard.facing)) > GUARD_FOV / 2) return 0;
  const steps = Math.max(1, Math.ceil(dist / 8));
  for (let i = 1; i < steps; i += 1) {
    const { x: tx, y: ty } = pxToTile(guard.x + (dx * i) / steps, guard.y + (dy * i) / steps);
    if (blocksSightTile(level, tx, ty)) return 0;
  }
  const closeness = 1 - dist / GUARD_RANGE;
  let rate = 26 + closeness * 74;
  if (inLight(level, player.x, player.y)) rate *= 1.6;
  if (player.sneaking) rate *= 0.5;
  if (player.moving) rate *= 1.25;
  return rate;
}
