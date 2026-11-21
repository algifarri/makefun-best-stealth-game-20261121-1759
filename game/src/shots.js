// Screenshot scenes behind ?shot=start|play|alarm|win. Each one plays the real
// rules forward from a fresh level for a fixed number of steps, steered by the
// scripted input (walk a route, sneak past a patrol), so every frame is what a
// short game really looks like — and the same seed always gives the same frame.
import { STEP_SECONDS } from './config.js';
import { createScriptedInput } from './input.js';
import { stepGame, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WIN } from './game.js';
import { tileToPx } from './level.js';

const STEP = STEP_SECONDS;
const START_SECONDS = 6;
const PLAY_SECONDS = 17;
const ALARM_SECONDS = 5;
const WIN_SECONDS = 4;

/** A silent sound object: the screenshot run never touches audio. */
const SILENT = {
  footstep() {},
  guardStep() {},
  pebble() {},
  pickup() {},
  suspicious() {},
  alarm() {},
  caught() {},
  win() {},
  click() {},
};

/**
 * Set `game` to the named scene and return the screen to draw over it.
 * start: title over a live level · play: mid-level, one shard lifted, cones out
 * alarm: caught in a cone, alarm ringing, wardens closing in · win: at the exit
 * with every shard lifted, victory card up.
 */
export function stageShot(name, game) {
  if (name !== 'play' && name !== 'alarm' && name !== 'win') {
    // Title over a live level: simulate play for a few seconds, then show the card.
    game.screen = SCREEN_PLAY;
    const input = createScriptedInput([]);
    for (let i = 0; i < START_SECONDS / STEP; i += 1) stepGame(game, input, STEP, SILENT);
    game.screen = SCREEN_TITLE;
    return SCREEN_TITLE;
  }
  if (name === 'win') {
    game.screen = SCREEN_PLAY;
    const exit = tileToPx(game.level.exit.x, game.level.exit.y);
    for (const shard of game.level.shards) shard.taken = true;
    game.shardsLeft = 0;
    game.player.x = exit.x - 46;
    game.player.y = exit.y;
    game.score = 740;
    game.messageTime = 0;
    const input = createScriptedInput([{ x: exit.x, y: exit.y }]);
    for (let i = 0; i < WIN_SECONDS / STEP; i += 1) {
      input.update(game.player);
      const events = stepGame(game, input, STEP, SILENT);
      if (game.screen === SCREEN_WIN) break;
      void events;
    }
    return game.screen;
  }
  if (name === 'alarm') {
    game.screen = SCREEN_PLAY;
    const guard = game.guards[0];
    const ahead = tileToPx(10, 3);
    game.player.x = ahead.x;
    game.player.y = ahead.y;
    guard.x = tileToPx(4, 3).x;
    guard.y = tileToPx(4, 3).y;
    guard.facing = 0;
    guard.state = 'patrol';
    guard.awareness = 88;
    game.messageTime = 0;
    // Spotted point-blank: Wren sprints for the lower gallery while the wardens
    // close in behind her — fast enough to stay ahead of the chase. The route
    // keeps her moving for the whole scene, so no warden catches her in frame.
    const input = createScriptedInput([
      { x: tileToPx(8, 6).x, y: tileToPx(8, 6).y },
      { x: tileToPx(5, 10).x, y: tileToPx(5, 10).y },
      { x: tileToPx(9, 13).x, y: tileToPx(9, 13).y },
      { x: tileToPx(5, 14).x, y: tileToPx(5, 14).y },
      { x: tileToPx(3, 11).x, y: tileToPx(3, 11).y },
    ]);
    for (let i = 0; i < ALARM_SECONDS / STEP; i += 1) {
      input.update(game.player);
      stepGame(game, input, STEP, SILENT);
    }
    return SCREEN_PLAY;
  }
  // play: sneak down the gallery, lift the middle shard, head for the exit side.
  game.screen = SCREEN_PLAY;
  const shard = tileToPx(12, 6);
  const cover = tileToPx(9, 8);
  const input = createScriptedInput([
    { x: tileToPx(6, 2).x, y: tileToPx(6, 2).y },
    { x: shard.x, y: shard.y },
    { x: cover.x, y: cover.y },
    { x: tileToPx(14, 10).x, y: tileToPx(14, 10).y },
  ]);
  input.sneak = true;
  for (let i = 0; i < PLAY_SECONDS / STEP; i += 1) {
    input.update(game.player);
    stepGame(game, input, STEP, SILENT);
    if (game.screen !== SCREEN_PLAY) break;
  }
  return SCREEN_PLAY;
}
