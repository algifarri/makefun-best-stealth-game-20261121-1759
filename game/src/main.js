// Boot and the one loop: input is read every frame, the game advances in fixed
// 1/60 s steps (several in a slow frame, none in a fast one), and the renderer
// paints what is there. Enter starts / advances / restarts; P pauses; M mutes.
//
// ?seed=N fixes the level's random touches. ?shot=start|play|alarm|win (with
// &seed=N) stages that scene instead of running the loop, paints it twice and
// sets window.__shotReady for a screenshot.
import { STEP_SECONDS } from './config.js';
import { createRandom } from './random.js';
import {
  createGame,
  nextLevel,
  startGame,
  stepGame,
  SCREEN_CLEAR,
  SCREEN_OVER,
  SCREEN_PAUSED,
  SCREEN_PLAY,
  SCREEN_TITLE,
  SCREEN_WIN,
} from './game.js';
import { createInput } from './input.js';
import { createRenderer } from './render.js';
import { createSound } from './sound.js';
import { stageShot } from './shots.js';

/** The longest frame the loop catches up on; a longer stall is dropped, not replayed. */
const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const game = createGame(createRandom(seed));
const renderer = createRenderer(canvas);
const sound = createSound();

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem('ember-heist-best') ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem('ember-heist-best', String(value));
  } catch {
    // Storage can be off (private windows): the best score then lasts this visit only.
  }
}

function announce(message) {
  status.textContent = message;
}

function runShot(name) {
  const screen = stageShot(name, game);
  let painted = 0;
  function paint() {
    renderer.draw(game, 1.2, false);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  void screen;
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas);
  let best = readBest();
  game.best = best;
  let accumulator = 0;
  let last = performance.now();

  function confirm() {
    sound.unlock();
    sound.click();
    if (game.screen === SCREEN_TITLE) {
      startGame(game);
      announce('Playing. Lift every shard, then reach the exit unseen.');
    } else if (game.screen === SCREEN_CLEAR) {
      nextLevel(game);
      announce(`Level ${game.levelIndex + 1}.`);
    } else if (game.screen === SCREEN_OVER || game.screen === SCREEN_WIN) {
      if (game.score > best) {
        best = game.score;
        saveBest(best);
      }
      startGame(game);
      announce('Playing. Lift every shard, then reach the exit unseen.');
    }
  }

  window.addEventListener('keydown', (event) => {
    if (event.code === 'Enter' || event.code === 'Space') confirm();
    if ((event.code === 'KeyP' || event.code === 'Escape') && game.screen === SCREEN_PLAY) {
      game.screen = SCREEN_PAUSED;
      announce('Paused.');
    } else if ((event.code === 'KeyP' || event.code === 'Escape') && game.screen === SCREEN_PAUSED) {
      game.screen = SCREEN_PLAY;
      announce('Playing.');
    }
    if (event.code === 'KeyM') {
      const muted = sound.toggleMute();
      announce(muted ? 'Muted.' : 'Sound on.');
    }
    if (event.code === 'KeyR' && (game.screen === SCREEN_PLAY || game.screen === SCREEN_PAUSED)) {
      startGame(game);
      announce('Playing. Lift every shard, then reach the exit unseen.');
    }
  });
  canvas.addEventListener('mousedown', () => sound.unlock());

  function frame(now) {
    const elapsed = Math.min(MAX_FRAME, (now - last) / 1000);
    last = now;
    accumulator += elapsed;
    while (accumulator >= STEP_SECONDS) {
      stepGame(game, input, STEP_SECONDS, sound);
      accumulator -= STEP_SECONDS;
    }
    renderer.draw(game, now / 1000, sound.muted);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
