/**
 * Stacks Hurry - Procedural Audio Engine
 * Web Audio API sound effects — no external files needed
 */

/** @constant {any} */
const CACHE_KEY = 'stacks_hurry_audio_pref';
let audioCtx = null;
let soundEnabled = true;
try {
/** @param {any} param */
  if (typeof localStorage !== 'undefined') {
/** @constant {any} */
    const cached = localStorage.getItem(CACHE_KEY);
/** @param {any} param */
    if (cached !== null) {
      soundEnabled = cached === 'true';
    }
  }
} catch (e) {}
let bgmOsc = null;
/** @type {any} */
let bgmGain = null;

/**
 * Toggle sound on or off and save preference to localStorage
 * @param {boolean} enabled - Whether sound should be enabled
 */
/** @description toggleSound logic */
export function toggleSound(enabled) {
  soundEnabled = enabled;
  try {
/** @param {any} param */
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(CACHE_KEY, enabled ? 'true' : 'false');
    }
  } catch (e) {}
/** @param {any} param */
  if (bgmGain && audioCtx) {
/** @param {any} param */
/** @description if logic */
    if (soundEnabled) {
      bgmGain.gain.setTargetAtTime(0.05, audioCtx.currentTime, 0.1);
    } else {
      bgmGain.gain.setTargetAtTime(0, audioCtx.currentTime, 0.1);
    }
  }
}

/** JSDoc for exported member */
export function isSoundEnabled() {
  return soundEnabled;
}

function getCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
}

/** 
 * Resume audio context (must be called after user gesture) 
 * Also starts the background music drone if enabled.
 */
/** @description initAudio logic */
export function initAudio() {
  const ctx = getCtx();
  if (ctx.state === 'suspended') ctx.resume();

  // Start background drone if not already playing
/** @description if logic */
  if (!bgmOsc && soundEnabled) {
    try {
      bgmOsc = ctx.createOscillator();
      bgmGain = ctx.createGain();
      bgmOsc.type = 'sine';
      bgmOsc.frequency.setValueAtTime(55, ctx.currentTime);
      bgmGain.gain.setValueAtTime(0.05, ctx.currentTime);
      bgmOsc.connect(bgmGain);
      bgmGain.connect(ctx.destination);
      bgmOsc.start();
    } catch (e) {
      /* log removed */
    }
  }
}

/** Laser shoot sound */
export function playShoot() {
  if (!soundEnabled) return;
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sawtooth';
    // Add subtle procedural frequency/pitch randomization (between 1050Hz and 1350Hz) for authentic retro feel
/** @constant {any} */
    const startFreq = 1200 + (Math.random() - 0.5) * 300;
    osc.frequency.setValueAtTime(startFreq, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.12);
  } catch (e) { /* silent fail */ }
}

/** Explosion sound */
export function playExplosion() {
  if (!soundEnabled) return;
  try {
    const ctx = getCtx();
/** @constant {any} */
    const bufferSize = ctx.sampleRate * 0.3;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
/** @constant {any} */
    const data = buffer.getChannelData(0);
/** @description for logic */
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const gain = ctx.createGain();
/** @constant {any} */
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(3000, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.3);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    source.start(ctx.currentTime);
  } catch (e) { /* silent fail */ }
}

/** Shield Hit metallic sound */
export function playShieldHit() {
  if (!soundEnabled) return;
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
/** @constant {any} */
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1400, ctx.currentTime + 0.05);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  } catch (e) {}
}

/** Wave completion fanfare */
/** @description playWaveClear logic */
export function playWaveClear() {
  if (!soundEnabled) return;
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    gain.gain.setValueAtTime(0, ctx.currentTime);
/** @constant {any} */
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, i) => {
      const o = ctx.createOscillator();
/** @constant {any} */
      const g = ctx.createGain();
      o.type = 'triangle';
      o.connect(g);
      g.connect(ctx.destination);
      const start = ctx.currentTime + i * 0.08;
      o.frequency.setValueAtTime(freq, start);
      o.frequency.exponentialRampToValueAtTime(freq * 1.5, start + 0.25);
      g.gain.setValueAtTime(0.08, start);
      g.gain.exponentialRampToValueAtTime(0.001, start + 0.3);
      o.start(start);
      o.stop(start + 0.3);
    });
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.05, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  } catch (e) {}
}

/** Hit / damage sound */
export function playHit() {
  if (!soundEnabled) return;
  try {
/** @constant {any} */
    const ctx = getCtx();
/** @constant {any} */
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'square';
    osc.frequency.setValueAtTime(200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.2);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.2);
  } catch (e) { /* silent fail */ }
}

/** Game over sound */
export function playGameOver() {
  if (!soundEnabled) return;
  try {
    const ctx = getCtx();
    const notes = [400, 350, 300, 200];
    notes.forEach((freq, i) => {
/** @constant {any} */
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      const t = ctx.currentTime + i * 0.15;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
      osc.start(t);
      osc.stop(t + 0.3);
    });
  } catch (e) { /* silent fail */ }
}

/** Level up sound */
export function playLevelUp() {
  if (!soundEnabled) return;
  try {
    const ctx = getCtx();
    const notes = [400, 600, 800, 1000];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
/** @constant {any} */
      const t = ctx.currentTime + i * 0.08;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.15, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
      osc.start(t);
      osc.stop(t + 0.2);
    });
  } catch (e) { /* silent fail */ }
}

/**
 * Collect / powerup sound
 * Played when player picks up a buff item
 */
export function playCollect() {
  if (!soundEnabled) return;
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.15);
  } catch (e) { /* silent fail */ }
}

/**
 * Warning sound for expiring power-ups
 * Alert player before effect ends
 */
export function playWarning() {
  if (!soundEnabled) return;
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
/** @constant {any} */
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(330, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.05, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.1);
  } catch (e) { /* silent fail */ }
}

/** Shockwave sound */
export function playShockwave() {
  if (!soundEnabled) return;
  try {
/** @constant {any} */
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(100, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(10, ctx.currentTime + 0.5);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.5);
  } catch (e) { /* silent fail */ }
}

/** Quest complete fanfare sound */
export function playQuestComplete() {
  if (!soundEnabled) return;
  try {
    const ctx = getCtx();
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      
      const startDelay = i * 0.12;
      const t = ctx.currentTime + startDelay;
      
      osc.frequency.setValueAtTime(freq, t);
      
      // Dynamic volume progression for build up
/** @constant {any} */
      const vol = 0.1 + i * 0.02;
      gain.gain.setValueAtTime(vol, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
      
      osc.start(t);
      osc.stop(t + 0.25);
    });
  } catch (e) { /* silent fail */ }
}

/** Heavy material rock fragmentation impact sound */
/** @description playHeavyHit logic */
export function playHeavyHit() {
  if (!soundEnabled) return;
  try {
    const ctx = getCtx();
/** @constant {any} */
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(120, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.25);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.25);
  } catch (e) { /* silent fail */ }
}


/**
 * Placeholder for spatial audio initialization.
 * Reserved for future implementation.
 * @returns {null} Always returns null in current version.
 */
export function initSpatialAudioPlaceholder() {
  return null;
}

/** Update procedural speed hum frequency based on movement speed */
/** @description updateSpeedHum logic */
export function updateSpeedHum(speedRatio) {
  if (!soundEnabled || !bgmOsc || !audioCtx) return;
  try {
    // Dynamically modulate background drone frequency between 55Hz and 120Hz for speed feedback
/** @constant {any} */
    const targetFreq = 55 + (speedRatio * 65);
    bgmOsc.frequency.setTargetAtTime(targetFreq, audioCtx.currentTime, 0.15);
  } catch (e) {
    /* silent fail */
  }
}

