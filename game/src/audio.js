// WebAudio synth SFX + ambient pad loop. No audio files.
let ctx = null;
let muted = false;
let musicTimer = null;
let musicStep = 0;

const PAD_NOTES = [220, 277.18, 329.63, 440];

function ensureCtx() {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    } catch (e) { return null; }
  }
  if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

function tone(freq, dur, type, vol, when) {
  if (muted) return;
  const ac = ensureCtx();
  if (!ac) return;
  try {
    const t = when || ac.currentTime;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(vol || 0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  } catch (e) { /* audio unavailable */ }
}

function arpeggio(notes, type, dur) {
  if (muted) return;
  const ac = ensureCtx();
  if (!ac) return;
  notes.forEach((f, i) => tone(f, dur || 0.25, type || 'triangle', 0.12, ac.currentTime + i * 0.12));
}

export const audio = {
  get muted() { return muted; },
  unlock() { ensureCtx(); },
  toggleMute() {
    muted = !muted;
    return muted;
  },
  playCard() { tone(520, 0.12, 'triangle', 0.1); tone(780, 0.12, 'triangle', 0.08); },
  hit() { tone(140, 0.18, 'sawtooth', 0.12); tone(90, 0.2, 'square', 0.08); },
  block() { tone(340, 0.15, 'sine', 0.1); },
  heal() { tone(660, 0.15, 'sine', 0.09); tone(880, 0.2, 'sine', 0.07); },
  surge() { tone(880, 0.12, 'triangle', 0.1); tone(1174, 0.18, 'triangle', 0.09); },
  turn() { tone(440, 0.12, 'sine', 0.08); },
  win() { arpeggio([523, 659, 784, 1046], 'triangle', 0.3); },
  lose() { arpeggio([392, 330, 262, 196], 'sawtooth', 0.3); },
  startMusic() {
    if (musicTimer || typeof window === 'undefined') return;
    musicTimer = window.setInterval(() => {
      if (muted) return;
      const ac = ensureCtx();
      if (!ac) return;
      const f = PAD_NOTES[musicStep % PAD_NOTES.length];
      musicStep++;
      tone(f, 0.85, 'sine', 0.035);
      tone(f * 1.5, 0.85, 'sine', 0.02);
    }, 900);
  },
  stopMusic() {
    if (musicTimer) { clearInterval(musicTimer); musicTimer = null; }
  },
};
