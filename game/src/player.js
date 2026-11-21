// The player: Wren, the lantern-thief. Walks with WASD or the arrow keys, sneaks
// with Shift (slower, harder to spot, quieter), and throws pebbles with the mouse
// to lure guards away. Movement slides along walls and crates, axis by axis.
import { FIELD_X, FIELD_Y, PLAYER_RADIUS, PLAYER_SNEAK_SPEED, PLAYER_SPEED, TILE } from './config.js';
import { isSolidTile, tileToPx } from './level.js';

export function createPlayer(start) {
  const at = tileToPx(start.x, start.y);
  return {
    x: at.x,
    y: at.y,
    facing: 0,
    moving: false,
    sneaking: false,
    pebbles: 3,
    stepPhase: 0,
    invulnerable: 0,
  };
}

function hitsSolid(level, x, y) {
  const r = PLAYER_RADIUS - 2;
  const corners = [
    [x - r, y - r],
    [x + r, y - r],
    [x - r, y + r],
    [x + r, y + r],
  ];
  for (const [cx, cy] of corners) {
    const tx = Math.floor((cx - FIELD_X) / TILE);
    const ty = Math.floor((cy - FIELD_Y) / TILE);
    if (isSolidTile(level, tx, ty)) return true;
  }
  return false;
}

export function updatePlayer(player, input, dt, level) {
  let dx = 0;
  let dy = 0;
  if (input.left) dx -= 1;
  if (input.right) dx += 1;
  if (input.up) dy -= 1;
  if (input.down) dy += 1;
  player.moving = dx !== 0 || dy !== 0;
  player.sneaking = Boolean(input.sneak);
  if (!player.moving) return;
  const len = Math.hypot(dx, dy);
  const speed = player.sneaking ? PLAYER_SNEAK_SPEED : PLAYER_SPEED;
  const mx = (dx / len) * speed * dt;
  const my = (dy / len) * speed * dt;
  player.facing = Math.atan2(dy, dx);
  if (!hitsSolid(level, player.x + mx, player.y)) player.x += mx;
  if (!hitsSolid(level, player.x, player.y + my)) player.y += my;
  player.stepPhase += (speed * dt) / 26;
  if (player.invulnerable > 0) player.invulnerable -= dt;
}

/** Respawn the player at the level start after being caught. */
export function respawnPlayer(player, start) {
  const at = tileToPx(start.x, start.y);
  player.x = at.x;
  player.y = at.y;
  player.invulnerable = 2.5;
}
