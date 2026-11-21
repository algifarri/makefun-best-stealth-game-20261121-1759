// Renderer: paints the night museum on one canvas — floor, lamp light, cover,
// crates and bushes, the exit, the ember shards, the guards with their vision
// cones, Wren with her lantern, and the HUD and screen overlays on top.
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  COLS,
  FIELD_X,
  FIELD_Y,
  HUD_HEIGHT,
  LEVELS,
  ROWS,
  TILE,
} from './config.js';
import { conePolygon } from './vision.js';
import { tileToPx } from './level.js';
import {
  SCREEN_CLEAR,
  SCREEN_OVER,
  SCREEN_PAUSED,
  SCREEN_TITLE,
  SCREEN_WIN,
} from './game.js';

function hash2(x, y) {
  let h = (x * 374761393 + y * 668265263) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = CANVAS_WIDTH * dpr;
  canvas.height = CANVAS_HEIGHT * dpr;
  ctx.scale(dpr, dpr);

  function drawFloor(level) {
    ctx.fillStyle = '#141824';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    for (let y = 0; y < ROWS; y += 1) {
      for (let x = 0; x < COLS; x += 1) {
        const px = FIELD_X + x * TILE;
        const py = FIELD_Y + y * TILE;
        const key = `${x},${y}`;
        if (level.walls.has(key)) continue;
        const shade = (x + y) % 2 === 0 ? '#1d2334' : '#1a1f2e';
        ctx.fillStyle = shade;
        ctx.fillRect(px, py, TILE, TILE);
        const h = hash2(x, y);
        if (h > 0.72) {
          ctx.fillStyle = 'rgba(255,255,255,0.03)';
          ctx.fillRect(px + 6 + h * 20, py + 8 + h * 18, 3, 3);
        }
      }
    }
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= COLS; x += 1) {
      ctx.beginPath();
      ctx.moveTo(FIELD_X + x * TILE, FIELD_Y);
      ctx.lineTo(FIELD_X + x * TILE, FIELD_Y + ROWS * TILE);
      ctx.stroke();
    }
    for (let y = 0; y <= ROWS; y += 1) {
      ctx.beginPath();
      ctx.moveTo(FIELD_X, FIELD_Y + y * TILE);
      ctx.lineTo(FIELD_X + COLS * TILE, FIELD_Y + y * TILE);
      ctx.stroke();
    }
  }

  function drawLamps(level) {
    for (const lamp of level.lamps) {
      const g = ctx.createRadialGradient(lamp.x, lamp.y, 6, lamp.x, lamp.y, lamp.radius);
      g.addColorStop(0, 'rgba(255, 205, 110, 0.30)');
      g.addColorStop(1, 'rgba(255, 205, 110, 0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(lamp.x, lamp.y, lamp.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffcf6e';
      ctx.beginPath();
      ctx.arc(lamp.x, lamp.y, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#8a6a2a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(lamp.x, lamp.y, 8, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  function drawCover(level) {
    for (const key of level.crates) {
      const [x, y] = key.split(',').map(Number);
      const px = FIELD_X + x * TILE;
      const py = FIELD_Y + y * TILE;
      ctx.fillStyle = '#6d4c26';
      ctx.fillRect(px + 3, py + 3, TILE - 6, TILE - 6);
      ctx.fillStyle = '#7d5a30';
      ctx.fillRect(px + 3, py + 3, TILE - 6, 8);
      ctx.strokeStyle = '#4a3416';
      ctx.lineWidth = 2;
      ctx.strokeRect(px + 3, py + 3, TILE - 6, TILE - 6);
      ctx.beginPath();
      ctx.moveTo(px + 3, py + 3);
      ctx.lineTo(px + TILE - 3, py + TILE - 3);
      ctx.moveTo(px + TILE - 3, py + 3);
      ctx.lineTo(px + 3, py + TILE - 3);
      ctx.stroke();
    }
    for (const key of level.bushes) {
      const [x, y] = key.split(',').map(Number);
      const cx = FIELD_X + x * TILE + TILE / 2;
      const cy = FIELD_Y + y * TILE + TILE / 2;
      ctx.fillStyle = '#244d2b';
      for (let i = 0; i < 5; i += 1) {
        const a = hash2(x * 5 + i, y) * Math.PI * 2;
        const r = 7 + hash2(x, y * 5 + i) * 9;
        ctx.beginPath();
        ctx.arc(cx + Math.cos(a) * 9, cy + Math.sin(a) * 9, r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#356b3d';
      ctx.beginPath();
      ctx.arc(cx - 5, cy - 4, 6, 0, Math.PI * 2);
      ctx.arc(cx + 6, cy + 3, 5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawWalls(level) {
    for (const key of level.walls) {
      const [x, y] = key.split(',').map(Number);
      const px = FIELD_X + x * TILE;
      const py = FIELD_Y + y * TILE;
      ctx.fillStyle = '#39415a';
      ctx.fillRect(px, py, TILE, TILE);
      ctx.fillStyle = '#4b5570';
      ctx.fillRect(px, py, TILE, 5);
      ctx.strokeStyle = '#232838';
      ctx.lineWidth = 1;
      ctx.strokeRect(px + 0.5, py + 0.5, TILE - 1, TILE - 1);
    }
  }

  function drawExit(level, open, time) {
    const at = tileToPx(level.exit.x, level.exit.y);
    const pulse = open ? 0.75 + Math.sin(time * 4) * 0.25 : 0.25;
    const g = ctx.createRadialGradient(at.x, at.y, 4, at.x, at.y, 46);
    g.addColorStop(0, `rgba(64, 224, 200, ${0.55 * pulse + 0.2})`);
    g.addColorStop(1, 'rgba(64, 224, 200, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(at.x, at.y, 46, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = open ? '#2fd8c0' : '#1d6f63';
    ctx.fillRect(at.x - 13, at.y - 16, 26, 32);
    ctx.strokeStyle = '#0e3f38';
    ctx.lineWidth = 2;
    ctx.strokeRect(at.x - 13, at.y - 16, 26, 32);
    ctx.beginPath();
    ctx.moveTo(at.x, at.y - 16);
    ctx.lineTo(at.x, at.y + 16);
    ctx.stroke();
    ctx.fillStyle = '#eafffa';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(open ? 'EXIT' : 'LOCKED', at.x, at.y - 24);
  }

  function drawShards(level, time) {
    for (const shard of level.shards) {
      if (shard.taken) continue;
      const at = tileToPx(shard.tx, shard.ty);
      const bob = Math.sin(time * 3 + shard.tx) * 3;
      const g = ctx.createRadialGradient(at.x, at.y + bob, 2, at.x, at.y + bob, 26);
      g.addColorStop(0, 'rgba(255, 150, 60, 0.75)');
      g.addColorStop(1, 'rgba(255, 150, 60, 0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(at.x, at.y + bob, 26, 0, Math.PI * 2);
      ctx.fill();
      ctx.save();
      ctx.translate(at.x, at.y + bob);
      ctx.rotate(Math.PI / 4 + Math.sin(time * 1.5 + shard.tx) * 0.15);
      ctx.fillStyle = '#ff9a3c';
      ctx.fillRect(-8, -8, 16, 16);
      ctx.fillStyle = '#ffd27a';
      ctx.fillRect(-4, -4, 8, 8);
      ctx.restore();
    }
  }

  function drawGuard(guard, level, time) {
    const poly = conePolygon(level, guard);
    const heat = guard.awareness / 100;
    const coneColor =
      guard.state === 'chase'
        ? `rgba(255, 64, 64, ${0.30 + heat * 0.1})`
        : heat > 0.55
          ? `rgba(255, 140, 60, ${0.22 + heat * 0.12})`
          : `rgba(255, 214, 110, ${0.20 + heat * 0.1})`;
    ctx.fillStyle = coneColor;
    ctx.beginPath();
    ctx.moveTo(poly[0].x, poly[0].y);
    for (let i = 1; i < poly.length; i += 1) ctx.lineTo(poly[i].x, poly[i].y);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 220, 130, 0.25)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Body: crimson warden with a brass helm and a lantern of his own.
    ctx.fillStyle = '#7d1f2b';
    ctx.beginPath();
    ctx.arc(guard.x, guard.y, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#c9a227';
    ctx.beginPath();
    ctx.arc(guard.x, guard.y, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#2a0d12';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(guard.x, guard.y);
    ctx.lineTo(guard.x + Math.cos(guard.facing) * 18, guard.y + Math.sin(guard.facing) * 18);
    ctx.stroke();
    ctx.fillStyle = '#ffe9a8';
    ctx.beginPath();
    ctx.arc(guard.x + Math.cos(guard.facing) * 10, guard.y + Math.sin(guard.facing) * 10, 2.5, 0, Math.PI * 2);
    ctx.fill();
    if (guard.awareness > 55 || guard.state === 'chase') {
      ctx.fillStyle = guard.state === 'chase' ? '#ff5252' : '#ffb020';
      ctx.font = 'bold 22px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(guard.state === 'chase' ? '!' : '?', guard.x, guard.y - 22);
    } else if (guard.state === 'investigate') {
      ctx.fillStyle = '#9fd8ff';
      ctx.font = 'bold 20px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('?', guard.x, guard.y - 22);
    }
    void time;
  }

  function drawPlayer(player, time) {
    const blink = player.invulnerable > 0 && Math.floor(time * 8) % 2 === 0;
    if (blink) return;
    const g = ctx.createRadialGradient(player.x, player.y, 4, player.x, player.y, 44);
    g.addColorStop(0, 'rgba(255, 200, 110, 0.35)');
    g.addColorStop(1, 'rgba(255, 200, 110, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(player.x, player.y, 44, 0, Math.PI * 2);
    ctx.fill();
    // Hooded cloak, crouched lower while sneaking.
    const crouch = player.sneaking ? 3 : 0;
    ctx.fillStyle = '#2e3a5c';
    ctx.beginPath();
    ctx.arc(player.x, player.y + crouch, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#46557e';
    ctx.beginPath();
    ctx.arc(player.x, player.y + crouch - 3, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffe9a8';
    ctx.beginPath();
    ctx.arc(player.x + Math.cos(player.facing) * 6, player.y + crouch - 3 + Math.sin(player.facing) * 6, 2.5, 0, Math.PI * 2);
    ctx.fill();
    // Lantern swinging at her side.
    const swing = Math.sin(player.stepPhase * 2) * 3;
    ctx.fillStyle = '#ffcf6e';
    ctx.fillRect(player.x + 11, player.y + 4 + swing, 5, 7);
    ctx.strokeStyle = '#8a6a2a';
    ctx.lineWidth = 1;
    ctx.strokeRect(player.x + 11, player.y + 4 + swing, 5, 7);
  }

  function drawPebble(pebble) {
    if (!pebble) return;
    ctx.fillStyle = '#cfd6e4';
    ctx.beginPath();
    ctx.arc(pebble.x, pebble.y, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawHud(game, muted) {
    ctx.fillStyle = '#10131d';
    ctx.fillRect(0, 0, CANVAS_WIDTH, HUD_HEIGHT);
    ctx.strokeStyle = '#2a3044';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, HUD_HEIGHT + 0.5);
    ctx.lineTo(CANVAS_WIDTH, HUD_HEIGHT + 0.5);
    ctx.stroke();
    const level = LEVELS[game.levelIndex];
    ctx.fillStyle = '#e8eaf2';
    ctx.font = 'bold 17px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`EMBER HEIST · ${level.name}`, 20, 26);
    ctx.fillStyle = '#9aa3b8';
    ctx.font = '13px sans-serif';
    const total = game.level.shards.length;
    const got = total - game.shardsLeft;
    ctx.fillText(`◆ ${got}/${total} shards   ♥ ${'●'.repeat(game.lives)}${'○'.repeat(Math.max(0, 3 - game.lives))}   ◐ ${game.player.pebbles} pebbles   ★ ${game.score}`, 20, 48);
    // Suspicion meter: the hottest guard's awareness.
    const hottest = Math.max(0, ...game.guards.map((g) => g.awareness));
    const label = game.alarm ? 'ALARM' : hottest > 55 ? 'SUSPICIOUS' : 'UNSEEN';
    ctx.fillStyle = '#9aa3b8';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(label, 1000, 24);
    ctx.fillStyle = '#262c3d';
    ctx.fillRect(1020, 12, 180, 16);
    ctx.fillStyle = game.alarm ? '#ff5252' : hottest > 55 ? '#ffb020' : '#ffd66e';
    ctx.fillRect(1020, 12, 180 * (hottest / 100), 16);
    ctx.strokeStyle = '#3a415a';
    ctx.strokeRect(1020.5, 12.5, 180, 16);
    ctx.fillStyle = '#9aa3b8';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`⏱ ${Math.floor(game.levelTime)}s   ${muted ? '🔇 muted (M)' : 'M mute · P pause'}`, 1260, 48);
  }

  function drawMessage(game) {
    if (game.messageTime <= 0 || !game.message) return;
    const alpha = Math.min(1, game.messageTime);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = 'rgba(16, 19, 29, 0.88)';
    ctx.font = 'bold 15px sans-serif';
    const w = ctx.measureText(game.message).width + 36;
    ctx.fillRect((CANVAS_WIDTH - w) / 2, HUD_HEIGHT + 12, w, 32);
    ctx.strokeStyle = '#3a415a';
    ctx.strokeRect((CANVAS_WIDTH - w) / 2 + 0.5, HUD_HEIGHT + 12.5, w, 32);
    ctx.fillStyle = '#ffe9a8';
    ctx.textAlign = 'center';
    ctx.fillText(game.message, CANVAS_WIDTH / 2, HUD_HEIGHT + 33);
    ctx.restore();
  }

  function overlay(title, lines, accent) {
    ctx.fillStyle = 'rgba(10, 12, 20, 0.72)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.fillStyle = accent;
    ctx.font = 'bold 44px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(title, CANVAS_WIDTH / 2, 300);
    ctx.fillStyle = '#e8eaf2';
    ctx.font = '17px sans-serif';
    lines.forEach((line, i) => ctx.fillText(line, CANVAS_WIDTH / 2, 348 + i * 28));
  }

  function draw(game, time, muted) {
    const level = game.level;
    drawFloor(level);
    drawLamps(level);
    drawCover(level);
    drawWalls(level);
    drawExit(level, game.shardsLeft === 0, time);
    drawShards(level, time);
    drawPebble(game.pebble);
    for (const guard of game.guards) drawGuard(guard, level, time);
    if (game.screen !== SCREEN_TITLE) drawPlayer(game.player, time);
    drawHud(game, muted);
    drawMessage(game);
    if (game.screen === SCREEN_TITLE) {
      overlay('EMBER HEIST', [
        'You are Wren, lantern-thief. Lift every ember shard, then reach the teal exit — unseen.',
        'WASD / arrows to move · SHIFT to sneak · CLICK to toss a pebble and lure a guard',
        'Bushes hide you. Lamplight gives you away. A full suspicion bar raises the alarm.',
        '',
        'Press ENTER to begin',
      ], '#ffd66e');
    } else if (game.screen === SCREEN_PAUSED) {
      overlay('PAUSED', ['Press P to keep sneaking.'], '#9fd8ff');
    } else if (game.screen === SCREEN_CLEAR) {
      const timeBonus = Math.max(0, Math.round(300 - game.levelTime * 2));
      const ghost = game.alarmedThisLevel ? 0 : 250;
      overlay('LEVEL CLEAR', [
        `${LEVELS[game.levelIndex].name} — slipped out clean.`,
        `Score ${game.score}  ·  time bonus +${timeBonus}${ghost ? `  ·  ghost bonus +${ghost}` : ''}`,
        '',
        'Press ENTER for the next level',
      ], '#2fd8c0');
    } else if (game.screen === SCREEN_OVER) {
      overlay('CAUGHT', [
        'The wardens found Wren. The vault keeps its embers — this time.',
        `Score ${game.score}`,
        '',
        'Press ENTER to try again',
      ], '#ff5252');
    } else if (game.screen === SCREEN_WIN) {
      overlay('THE VAULT IS YOURS', [
        'Every shard lifted, every warden outwitted. Wren vanishes into the night.',
        `Final score ${game.score}`,
        '',
        'Press ENTER to play again',
      ], '#ffd66e');
    }
  }

  return { draw };
}
