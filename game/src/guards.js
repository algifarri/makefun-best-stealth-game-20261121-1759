// Guards: lantern-wardens on patrol. Each guard walks its waypoints, pauses, and
// watches. Awareness (0-100) rises while it sees you; past half it gets suspicious
// and walks to where it last saw you; at 100 the alarm sounds and every guard
// chases. A thrown pebble sends nearby guards to investigate the landing spot.
// When nobody has seen you for a while the alarm cools and patrols resume.
import { GUARD_CHASE_SPEED, GUARD_PATROL_SPEED, GUARD_RADIUS, TILE } from './config.js';
import { detectionRate } from './vision.js';
import { tileToPx } from './level.js';

export const GUARD_PATROL = 'patrol';
export const GUARD_SUSPICIOUS = 'suspicious';
export const GUARD_CHASE = 'chase';
export const GUARD_INVESTIGATE = 'investigate';
export const GUARD_RETURN = 'return';

export function createGuard(def, index) {
  const first = def.waypoints[0];
  const at = tileToPx(first.x, first.y);
  return {
    id: index,
    x: at.x,
    y: at.y,
    facing: 0,
    state: GUARD_PATROL,
    waypointIndex: 1 % def.waypoints.length,
    waypoints: def.waypoints.map((w) => tileToPx(w.x, w.y)),
    pause: def.pause,
    wait: 0.6 + index * 0.35,
    awareness: 0,
    lastSeen: null,
    investigateAt: null,
    investigateTime: 0,
    stepTime: 0,
    lookTime: 0,
    speed: GUARD_PATROL_SPEED,
  };
}

function moveToward(guard, tx, ty, speed, dt, level) {
  const dx = tx - guard.x;
  const dy = ty - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 1) return true;
  const step = Math.min(dist, speed * dt);
  const nx = guard.x + (dx / dist) * step;
  const ny = guard.y + (dy / dist) * step;
  guard.facing = Math.atan2(dy, dx);
  // Slide along walls: try the full step, then each axis on its own.
  if (!hitsSolid(level, nx, ny)) {
    guard.x = nx;
    guard.y = ny;
  } else if (!hitsSolid(level, nx, guard.y)) {
    guard.x = nx;
  } else if (!hitsSolid(level, guard.x, ny)) {
    guard.y = ny;
  } else {
    return true;
  }
  return Math.hypot(tx - guard.x, ty - guard.y) < 4;
}

function hitsSolid(level, x, y) {
  const r = GUARD_RADIUS - 2;
  const corners = [
    [x - r, y - r],
    [x + r, y - r],
    [x - r, y + r],
    [x + r, y + r],
  ];
  for (const [cx, cy] of corners) {
    const tx = Math.floor((cx - 80) / TILE);
    const ty = Math.floor((cy - 92) / TILE);
    if (tx < 0 || ty < 0 || tx >= 28 || ty >= 17) return true;
    const key = `${tx},${ty}`;
    if (level.walls.has(key) || level.crates.has(key)) return true;
  }
  return false;
}

export function updateGuard(guard, dt, level, player, alarm) {
  const rate = detectionRate(level, guard, player);
  if (rate > 0) {
    guard.awareness = Math.min(100, guard.awareness + rate * dt);
    guard.lastSeen = { x: player.x, y: player.y };
  } else {
    guard.awareness = Math.max(0, guard.awareness - 14 * dt);
  }

  if (alarm && guard.state !== GUARD_CHASE) guard.state = GUARD_CHASE;

  if (guard.state === GUARD_CHASE) {
    const target = guard.lastSeen ?? { x: player.x, y: player.y };
    moveToward(guard, target.x, target.y, GUARD_CHASE_SPEED, dt, level);
    if (rate > 0) guard.lastSeen = { x: player.x, y: player.y };
    return;
  }
  if (guard.state === GUARD_INVESTIGATE) {
    guard.investigateTime -= dt;
    if (guard.investigateAt && moveToward(guard, guard.investigateAt.x, guard.investigateAt.y, GUARD_PATROL_SPEED * 1.25, dt, level)) {
      guard.wait = 1.6;
    }
    if (guard.investigateTime <= 0) {
      guard.state = GUARD_RETURN;
      guard.investigateAt = null;
    }
    return;
  }
  if (guard.state === GUARD_SUSPICIOUS) {
    if (guard.lastSeen && moveToward(guard, guard.lastSeen.x, guard.lastSeen.y, GUARD_PATROL_SPEED * 1.4, dt, level)) {
      guard.wait = 1.8;
      guard.state = GUARD_RETURN;
    }
    if (guard.awareness < 30) guard.state = GUARD_RETURN;
    return;
  }
  if (guard.state === GUARD_RETURN) {
    const target = guard.waypoints[guard.waypointIndex];
    if (moveToward(guard, target.x, target.y, GUARD_PATROL_SPEED, dt, level)) {
      guard.state = GUARD_PATROL;
      guard.wait = guard.pause;
    }
    return;
  }
  // Patrol: wait at a waypoint, then walk to the next.
  if (guard.awareness > 55 && guard.lastSeen) {
    guard.state = GUARD_SUSPICIOUS;
    return;
  }
  if (guard.wait > 0) {
    guard.wait -= dt;
    guard.lookTime += dt;
    guard.facing += Math.sin(guard.lookTime * 1.1 + guard.id * 2.1) * dt * 0.35;
    return;
  }
  const target = guard.waypoints[guard.waypointIndex];
  if (moveToward(guard, target.x, target.y, GUARD_PATROL_SPEED, dt, level)) {
    guard.waypointIndex = (guard.waypointIndex + 1) % guard.waypoints.length;
    guard.wait = guard.pause;
  }
}

/** Send every guard close enough to the pebble off to investigate it. */
export function distractGuards(guards, x, y) {
  for (const guard of guards) {
    const dist = Math.hypot(guard.x - x, guard.y - y);
    if (dist < 340 && guard.state !== GUARD_CHASE) {
      guard.state = GUARD_INVESTIGATE;
      guard.investigateAt = { x, y };
      guard.investigateTime = 5;
      guard.awareness = Math.max(guard.awareness, 30);
    }
  }
}
