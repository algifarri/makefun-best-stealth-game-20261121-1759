// Input: keyboard (WASD / arrows, Shift to sneak) and the mouse (click tosses a
// pebble at the clicked point). The game reads this plain object every frame.
export function createInput(canvas) {
  const input = {
    left: false,
    right: false,
    up: false,
    down: false,
    sneak: false,
    pebbleAt: null,
  };
  const keys = new Set();

  function applyKey(code, down) {
    if (down) keys.add(code);
    else keys.delete(code);
    input.left = keys.has('ArrowLeft') || keys.has('KeyA');
    input.right = keys.has('ArrowRight') || keys.has('KeyD');
    input.up = keys.has('ArrowUp') || keys.has('KeyW');
    input.down = keys.has('ArrowDown') || keys.has('KeyS');
    input.sneak = keys.has('ShiftLeft') || keys.has('ShiftRight');
  }

  window.addEventListener('keydown', (event) => {
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space'].includes(event.code)) {
      event.preventDefault();
    }
    applyKey(event.code, true);
    input.lastKey = event.code;
  });
  window.addEventListener('keyup', (event) => applyKey(event.code, false));
  window.addEventListener('blur', () => {
    keys.clear();
    applyKey('', false);
  });
  canvas.addEventListener('mousedown', (event) => {
    const rect = canvas.getBoundingClientRect();
    // The canvas fills the window; map the click back to the 1280×800 game space.
    input.pebbleAt = {
      x: ((event.clientX - rect.left) / rect.width) * 1280,
      y: ((event.clientY - rect.top) / rect.height) * 800,
    };
  });
  return input;
}

/** A scripted input for the screenshot scenes: walk toward waypoints in order. */
export function createScriptedInput(targets) {
  let index = 0;
  return {
    left: false,
    right: false,
    up: false,
    down: false,
    sneak: false,
    pebbleAt: null,
    update(player) {
      if (index >= targets.length) {
        this.left = this.right = this.up = this.down = false;
        return;
      }
      const t = targets[index];
      const dx = t.x - player.x;
      const dy = t.y - player.y;
      if (Math.hypot(dx, dy) < 16) {
        index += 1;
        return;
      }
      this.left = dx < -8;
      this.right = dx > 8;
      this.up = dy < -8;
      this.down = dy > 8;
    },
  };
}
