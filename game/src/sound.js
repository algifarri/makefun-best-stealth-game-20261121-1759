// Sound: every effect is synthesised with WebAudio — no audio files, no network.
// Footsteps tick softly (louder when a guard is near), pickups chime, the alarm
// stings, being caught thuds, and clearing a level plays a short jingle.
export function createSound() {
  let ctx = null;
  let muted = false;

  function ensure() {
    if (ctx) return ctx;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      ctx = new AC();
    } catch {
      ctx = null;
    }
    return ctx;
  }

  function tone(freq, dur, type, gain, when = 0, slideTo = null) {
    if (muted) return;
    const ac = ensure();
    if (!ac) return;
    try {
      const t0 = ac.currentTime + when;
      const osc = ac.createOscillator();
      const g = ac.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t0);
      if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(g);
      g.connect(ac.destination);
      osc.start(t0);
      osc.stop(t0 + dur + 0.05);
    } catch {
      // Audio is decoration: never let it break the game.
    }
  }

  return {
    unlock() {
      ensure();
      if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
    },
    toggleMute() {
      muted = !muted;
      return muted;
    },
    get muted() {
      return muted;
    },
    footstep(sneak) {
      tone(sneak ? 130 : 95, 0.07, 'triangle', sneak ? 0.02 : 0.045);
    },
    guardStep(distance) {
      const gain = Math.max(0.008, 0.06 * (1 - distance / 420));
      tone(78, 0.09, 'sine', gain);
    },
    pebble() {
      tone(1900, 0.05, 'square', 0.03);
      tone(1500, 0.06, 'square', 0.025, 0.05);
    },
    pickup() {
      tone(660, 0.12, 'sine', 0.09);
      tone(990, 0.18, 'sine', 0.09, 0.09);
    },
    suspicious() {
      tone(440, 0.16, 'triangle', 0.06, 0, 620);
    },
    alarm() {
      tone(220, 0.22, 'sawtooth', 0.09, 0, 440);
      tone(220, 0.22, 'sawtooth', 0.09, 0.24, 440);
    },
    caught() {
      tone(160, 0.5, 'sawtooth', 0.12, 0, 55);
      tone(90, 0.4, 'triangle', 0.1, 0.08, 45);
    },
    win() {
      [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.22, 'sine', 0.09, i * 0.11));
    },
    click() {
      tone(520, 0.06, 'sine', 0.05);
    },
  };
}
