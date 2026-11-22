// Keyboard + pointer input in logical 1280x720 coordinates.
// ACTION_* flags name the intent; main.js polls the queues each frame.
import { W, H } from './config.js';

export const ACTION_PLAY = 'play';
export const ACTION_END_TURN = 'end-turn';
export const ACTION_CONFIRM = 'confirm';
export const ACTION_PAUSE = 'pause';
export const ACTION_RESTART = 'restart';
export const ACTION_MUTE = 'mute';

export function inside(x, y, rect) {
  return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}

export function createInput(canvas, onAction) {
  const state = {
    clicks: [], // {x, y} in logical coords, consumed by main.js
    keys: [], // action strings queued by keydown
    hover: { x: -1, y: -1 },
  };

  function toLogical(e) {
    const rect = canvas.getBoundingClientRect();
    const scale = Math.min(rect.width / W, rect.height / H);
    const ox = (rect.width - W * scale) / 2;
    const oy = (rect.height - H * scale) / 2;
    return {
      x: (e.clientX - rect.left - ox) / scale,
      y: (e.clientY - rect.top - oy) / scale,
    };
  }

  canvas.addEventListener('pointerdown', (e) => {
    const p = toLogical(e);
    state.clicks.push(p);
    if (onAction) onAction(ACTION_CONFIRM, p);
  });
  canvas.addEventListener('pointermove', (e) => {
    state.hover = toLogical(e);
  });

  const KEY_ACTIONS = {
    ' ': ACTION_END_TURN,
    Enter: ACTION_CONFIRM,
    Escape: ACTION_PAUSE,
    p: ACTION_PAUSE,
    P: ACTION_PAUSE,
    m: ACTION_MUTE,
    M: ACTION_MUTE,
    r: ACTION_RESTART,
    R: ACTION_RESTART,
  };

  window.addEventListener('keydown', (e) => {
    if (e.key >= '1' && e.key <= '7') {
      state.keys.push({ type: ACTION_PLAY, index: parseInt(e.key, 10) - 1 });
      return;
    }
    const action = KEY_ACTIONS[e.key];
    if (action) {
      if (e.key === ' ') e.preventDefault();
      state.keys.push({ type: action });
      if (onAction) onAction(action);
    }
  });

  return state;
}
