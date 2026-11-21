// Game rules and state: one level at a time, three lives, a score, and the screens
// title → play → paused → level clear → victory / game over. The alarm is a shared
// timer: it starts when any guard's awareness hits 100 and cools only while no
// guard can see you. Being caught costs a life and sends you back to the start.
import { CATCH_RADIUS, LEVELS, LIVES } from './config.js';
import { createGuard, distractGuards, updateGuard } from './guards.js';
import { createPlayer, respawnPlayer, updatePlayer } from './player.js';
import { parseLevel, tileToPx } from './level.js';
import { PEBBLE_RANGE, PEBBLE_THROW_SPEED } from './config.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_CLEAR = 'clear';
export const SCREEN_OVER = 'over';
export const SCREEN_WIN = 'win';

export const EVENT_NONE = 0;
export const EVENT_PICKUP = 1;
export const EVENT_ALARM = 2;
export const EVENT_CAUGHT = 4;
export const EVENT_CLEAR = 8;
export const EVENT_WIN = 16;
export const EVENT_SUSPICIOUS = 32;

export function createGame(seed) {
  const game = {
    seed,
    levelIndex: 0,
    screen: SCREEN_TITLE,
    score: 0,
    lives: LIVES,
    time: 0,
    levelTime: 0,
    alarm: false,
    alarmCooldown: 0,
    alarmedThisLevel: false,
    message: '',
    messageTime: 0,
    pebble: null,
    level: null,
    player: null,
    guards: [],
    shardsLeft: 0,
    best: 0,
  };
  loadLevel(game, 0);
  return game;
}

export function loadLevel(game, index) {
  const def = LEVELS[index];
  game.levelIndex = index;
  game.level = parseLevel(def);
  game.player = createPlayer(game.level.start);
  game.player.pebbles = 3;
  game.guards = def.guards.map((g, i) => createGuard(g, i));
  game.shardsLeft = game.level.shards.length;
  game.alarm = false;
  game.alarmCooldown = 0;
  game.alarmedThisLevel = false;
  game.levelTime = 0;
  game.pebble = null;
  game.message = def.intro;
  game.messageTime = 5;
}

function say(game, text, seconds = 3) {
  game.message = text;
  game.messageTime = seconds;
}

export function startGame(game) {
  game.score = 0;
  game.lives = LIVES;
  game.time = 0;
  loadLevel(game, 0);
  game.screen = SCREEN_PLAY;
}

export function nextLevel(game) {
  if (game.levelIndex + 1 >= LEVELS.length) {
    game.screen = SCREEN_WIN;
    return EVENT_WIN;
  }
  loadLevel(game, game.levelIndex + 1);
  game.screen = SCREEN_PLAY;
  return EVENT_NONE;
}

/** Throw a pebble toward a screen point (clamped to range). Returns true if thrown. */
export function throwPebble(game, x, y) {
  const player = game.player;
  if (player.pebbles <= 0 || game.pebble) return false;
  const dx = x - player.x;
  const dy = y - player.y;
  const dist = Math.hypot(dx, dy);
  const range = Math.min(dist, PEBBLE_RANGE);
  const tx = player.x + (dist === 0 ? 0 : (dx / dist) * range);
  const ty = player.y + (dist === 0 ? 0 : (dy / dist) * range);
  game.pebble = { x: player.x, y: player.y, ox: player.x, oy: player.y, tx, ty, t: 0, duration: Math.max(0.05, dist / PEBBLE_THROW_SPEED) };
  player.pebbles -= 1;
  return true;
}

export function stepGame(game, input, dt, sound) {
  if (game.screen !== SCREEN_PLAY) return EVENT_NONE;
  let events = EVENT_NONE;
  game.time += dt;
  game.levelTime += dt;
  if (game.messageTime > 0) game.messageTime -= dt;

  const player = game.player;
  const wasMoving = player.moving;
  updatePlayer(player, input, dt, game.level);
  if (player.moving && !wasMoving) {
    // Footsteps tick on the stride: one sound per half phase.
  }
  if (player.moving && Math.floor(player.stepPhase * 2) !== Math.floor((player.stepPhase - dt * 6) * 2)) {
    sound.footstep(player.sneaking);
  }

  // Pebble flight: on landing, nearby guards go to investigate.
  if (game.pebble) {
    const p = game.pebble;
    p.t += dt;
    const k = Math.min(1, p.t / Math.max(0.05, p.duration));
    p.x = p.ox + (p.tx - p.ox) * k;
    p.y = p.oy + (p.ty - p.oy) * k;
    if (k >= 1) {
      distractGuards(game.guards, p.tx, p.ty);
      sound.pebble();
      game.pebble = null;
    }
  }
  if (input.pebbleAt) {
    throwPebble(game, input.pebbleAt.x, input.pebbleAt.y);
    input.pebbleAt = null;
  }

  // Guards watch, patrol, chase.
  let sawPlayer = false;
  for (const guard of game.guards) {
    const before = guard.awareness;
    updateGuard(guard, dt, game.level, player, game.alarm);
    if (guard.awareness > 55 && before <= 55 && guard.state !== 'chase') {
      events |= EVENT_SUSPICIOUS;
      sound.suspicious();
    }
    if (guard.awareness >= 100) sawPlayer = true;
  }
  if (!game.alarm && game.guards.some((g) => g.awareness >= 100)) {
    game.alarm = true;
    game.alarmCooldown = 7;
    game.alarmedThisLevel = true;
    events |= EVENT_ALARM;
    sound.alarm();
    say(game, 'SPOTTED! Break line of sight and hide!', 3);
  }
  if (game.alarm) {
    const anySees = game.guards.some((g) => g.awareness > 40);
    if (!anySees) {
      game.alarmCooldown -= dt;
      if (game.alarmCooldown <= 0) {
        game.alarm = false;
        for (const guard of game.guards) {
          if (guard.state === 'chase') guard.state = 'return';
          guard.awareness = Math.min(guard.awareness, 45);
        }
        say(game, 'You slipped away. The wardens return to patrol.', 3);
      }
    } else {
      game.alarmCooldown = 7;
    }
  }

  // Shards: touch one to lift it.
  for (const shard of game.level.shards) {
    if (shard.taken) continue;
    const at = tileToPx(shard.tx, shard.ty);
    if (Math.hypot(player.x - at.x, player.y - at.y) < 30) {
      shard.taken = true;
      game.shardsLeft -= 1;
      game.score += 100;
      events |= EVENT_PICKUP;
      sound.pickup();
      say(game, game.shardsLeft === 0 ? 'All shards lifted — the exit is open. Go!' : `Shard lifted — ${game.shardsLeft} to go.`, 3);
    }
  }

  // Exit: open once every shard is lifted.
  if (game.shardsLeft === 0) {
    const exit = tileToPx(game.level.exit.x, game.level.exit.y);
    if (Math.hypot(player.x - exit.x, player.y - exit.y) < 30) {
      const timeBonus = Math.max(0, Math.round(300 - game.levelTime * 2));
      const ghostBonus = game.alarmedThisLevel ? 0 : 250;
      game.score += 200 + timeBonus + ghostBonus;
      if (game.levelIndex + 1 >= LEVELS.length) {
        game.screen = SCREEN_WIN;
        sound.win();
        return EVENT_WIN;
      }
      game.screen = SCREEN_CLEAR;
      sound.win();
      return EVENT_CLEAR;
    }
  }

  // Caught: a chasing guard reaches you.
  if (game.alarm && player.invulnerable <= 0) {
    for (const guard of game.guards) {
      if (guard.state === 'chase' && Math.hypot(guard.x - player.x, guard.y - player.y) < CATCH_RADIUS) {
        game.lives -= 1;
        sound.caught();
        if (game.lives <= 0) {
          game.screen = SCREEN_OVER;
        } else {
          respawnPlayer(player, game.level.start);
          game.alarm = false;
          for (const g of game.guards) {
            g.awareness = 0;
            g.state = 'return';
          }
          say(game, `Caught! ${game.lives} ${game.lives === 1 ? 'life' : 'lives'} left.`, 3);
        }
        return EVENT_CAUGHT;
      }
    }
  }
  return events;
}
