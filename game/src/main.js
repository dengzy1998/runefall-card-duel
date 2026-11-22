// RUNEFALL boot + game loop + screen transitions + demo mode.
import { W, H } from './config.js';
import { createRng } from './random.js';
import { createRun, currentFoeId, settleDuelWon, settleDuelLost, offerDraft, offerRelics, applyRelic, buyPerk, loadSanctum, saveSanctum } from './run.js';
import { createDuel, playCard, endTurn, canPlay } from './duel.js';
import { smartPilot } from './autopilot.js';
import { stageShot } from './shots.js';
import { audio } from './audio.js';
import { createInput, inside, ACTION_PLAY, ACTION_END_TURN, ACTION_CONFIRM, ACTION_PAUSE, ACTION_RESTART, ACTION_MUTE } from './input.js';
import { setupCanvas, fitCanvas, handLayout, endTurnRect, SCREEN_TITLE, SCREEN_DUEL, SCREEN_DRAFT, SCREEN_RELIC, SCREEN_VICTORY, SCREEN_DEFEAT, SCREEN_PAUSED } from './render.js';
import { drawDuel, drawTitle, drawDraft, drawRelic, drawVictory, drawDefeat, drawPaused } from './screens.js';
import { SANCTUM_PERKS } from './relics.js';
import { cardById } from './cards.js';

const params = new URLSearchParams(window.location.search);
const seed = parseInt(params.get('seed') || '1', 10) || 1;
const demoMode = params.get('demo') === '1';
const shotName = params.get('shot');

const canvas = document.getElementById('game');
const statusEl = document.getElementById('status');
const ctx = setupCanvas(canvas);
fitCanvas(canvas);
window.addEventListener('resize', () => fitCanvas(canvas));

const game = {
  screen: SCREEN_TITLE,
  run: null,
  duel: null,
  rng: createRng(seed),
  sanctum: loadSanctum(),
  showHelp: false,
  draftOptions: [],
  relicOptions: [],
  input: null,
  seed,
};

game.input = createInput(canvas, () => {});

function setStatus(text) {
  if (statusEl) statusEl.textContent = text;
}

function startRun() {
  game.rng = createRng(seed + Date.now() % 100000);
  game.run = createRun(game.rng, game.sanctum);
  game.duel = createDuel(game.run, currentFoeId(game.run), game.rng);
  game.screen = SCREEN_DUEL;
  setStatus('Duel — ' + game.duel.foe.name);
  audio.unlock();
  audio.startMusic();
}

function advanceAfterDuel() {
  const duel = game.duel;
  if (!duel) return;
  if (duel.phase === 'won') {
    const next = settleDuelWon(game.run, game.rng, duel.playerHp);
    audio.win();
    if (next === 'victory') {
      game.screen = SCREEN_VICTORY;
      setStatus('Victory! Score ' + game.run.score);
      game.duel = null;
    } else if (next === 'relic') {
      game.relicOptions = offerRelics(game.run, game.rng);
      game.screen = SCREEN_RELIC;
      setStatus('Act cleared — choose a relic');
    } else {
      game.draftOptions = offerDraft(game.run, game.rng);
      game.screen = SCREEN_DRAFT;
      setStatus('Duel won — choose a card');
    }
  } else if (duel.phase === 'lost') {
    settleDuelLost(game.run);
    audio.lose();
    game.screen = SCREEN_DEFEAT;
    setStatus('Defeat — score ' + game.run.score);
  }
}

function nextDuel() {
  game.duel = createDuel(game.run, currentFoeId(game.run), game.rng);
  game.screen = SCREEN_DUEL;
  setStatus('Duel — ' + game.duel.foe.name);
}

function handleClick(p) {
  audio.unlock();
  audio.startMusic();
  if (game.screen === SCREEN_TITLE) {
    if (inside(p.x, p.y, { x: 515, y: 268, w: 250, h: 58 })) { startRun(); return; }
    if (inside(p.x, p.y, { x: 515, y: 340, w: 250, h: 40 })) { game.showHelp = !game.showHelp; return; }
    // Sanctum perk cards.
    const perkY = game.showHelp ? 572 : 464;
    SANCTUM_PERKS.forEach((perk, i) => {
      const x = 290 + i * 240;
      if (inside(p.x, p.y, { x, y: perkY, w: 220, h: 84 })) {
        if (buyPerk(game.sanctum, perk.id)) {
          game.sanctum = loadSanctum();
          setStatus('Sanctum perk bought: ' + perk.name);
        }
      }
    });
    return;
  }
  if (game.screen === SCREEN_DUEL) {
    const duel = game.duel;
    if (!duel || duel.phase !== 'player') return;
    if (inside(p.x, p.y, endTurnRect())) {
      endTurn(duel);
      audio.turn();
      advanceAfterDuel();
      return;
    }
    const rects = handLayout(duel.deck.hand.length);
    for (let i = 0; i < rects.length; i++) {
      const r = rects[i];
      if (inside(p.x, p.y, { x: r.x, y: r.y - 26, w: r.w, h: r.h + 26 })) {
        if (canPlay(duel, i)) {
          playCard(duel, i);
          audio.playCard();
          advanceAfterDuel();
        }
        return;
      }
    }
    return;
  }
  if (game.screen === SCREEN_DRAFT) {
    for (let i = 0; i < game.draftOptions.length; i++) {
      const x = 290 + i * 240;
      if (inside(p.x, p.y, { x, y: 204, w: 200, h: 296 })) {
        game.run.deck.push(game.draftOptions[i]);
        nextDuel();
        return;
      }
    }
    if (inside(p.x, p.y, { x: 565, y: 560, w: 150, h: 46 })) nextDuel();
    return;
  }
  if (game.screen === SCREEN_RELIC) {
    for (let i = 0; i < game.relicOptions.length; i++) {
      const x = 290 + i * 240;
      if (inside(p.x, p.y, { x, y: 220, w: 200, h: 180 })) {
        applyRelic(game.run, game.relicOptions[i].id);
        game.draftOptions = offerDraft(game.run, game.rng);
        game.screen = SCREEN_DRAFT;
        setStatus('Duel won — choose a card');
        return;
      }
    }
    return;
  }
  if (game.screen === SCREEN_VICTORY || game.screen === SCREEN_DEFEAT) {
    game.sanctum = loadSanctum();
    game.screen = SCREEN_TITLE;
    setStatus('RUNEFALL — title screen');
    return;
  }
  if (game.screen === SCREEN_PAUSED) {
    game.screen = SCREEN_DUEL;
    return;
  }
}

function handleKey(k) {
  if (k.type === ACTION_MUTE) {
    audio.toggleMute();
    return;
  }
  if (k.type === ACTION_PAUSE) {
    if (game.screen === SCREEN_DUEL) game.screen = SCREEN_PAUSED;
    else if (game.screen === SCREEN_PAUSED) game.screen = SCREEN_DUEL;
    return;
  }
  if (k.type === ACTION_RESTART) {
    if (game.screen === SCREEN_VICTORY || game.screen === SCREEN_DEFEAT || game.screen === SCREEN_PAUSED) {
      game.sanctum = loadSanctum();
      game.screen = SCREEN_TITLE;
      setStatus('RUNEFALL — title screen');
    }
    return;
  }
  if (k.type === ACTION_PLAY) {
    if (game.screen !== SCREEN_DUEL || !game.duel || game.duel.phase !== 'player') return;
    if (canPlay(game.duel, k.index)) {
      playCard(game.duel, k.index);
      audio.playCard();
      advanceAfterDuel();
    }
    return;
  }
  if (k.type === ACTION_END_TURN || k.type === ACTION_CONFIRM) {
    if (game.screen === SCREEN_DUEL && game.duel && game.duel.phase === 'player') {
      endTurn(game.duel);
      audio.turn();
      advanceAfterDuel();
    } else if (game.screen === SCREEN_VICTORY || game.screen === SCREEN_DEFEAT) {
      game.sanctum = loadSanctum();
      game.screen = SCREEN_TITLE;
      setStatus('RUNEFALL — title screen');
    }
  }
}

function demoStep() {
  if (game.screen === SCREEN_TITLE) { startRun(); return; }
  if (game.screen === SCREEN_DUEL && game.duel) {
    if (game.duel.phase !== 'player') { advanceAfterDuel(); return; }
    const idx = smartPilot(game.duel);
    if (idx >= 0) playCard(game.duel, idx);
    else endTurn(game.duel);
    advanceAfterDuel();
    return;
  }
  if (game.screen === SCREEN_DRAFT) {
    if (game.draftOptions.length > 0) game.run.deck.push(game.draftOptions[0]);
    nextDuel();
    return;
  }
  if (game.screen === SCREEN_RELIC) {
    if (game.relicOptions.length > 0) applyRelic(game.run, game.relicOptions[0].id);
    game.draftOptions = offerDraft(game.run, game.rng);
    game.screen = SCREEN_DRAFT;
    return;
  }
  if (game.screen === SCREEN_VICTORY || game.screen === SCREEN_DEFEAT) {
    game.sanctum = loadSanctum();
    game.screen = SCREEN_TITLE;
  }
}

function draw() {
  switch (game.screen) {
    case SCREEN_TITLE: drawTitle(ctx, game); break;
    case SCREEN_DUEL: drawDuel(ctx, game); break;
    case SCREEN_DRAFT: drawDraft(ctx, game); break;
    case SCREEN_RELIC: drawRelic(ctx, game); break;
    case SCREEN_VICTORY: drawVictory(ctx, game); break;
    case SCREEN_DEFEAT: drawDefeat(ctx, game); break;
    case SCREEN_PAUSED: drawPaused(ctx, game); break;
    default: drawTitle(ctx, game);
  }
}

function loop() {
  // Consume queued input.
  while (game.input.clicks.length > 0) handleClick(game.input.clicks.shift());
  while (game.input.keys.length > 0) handleKey(game.input.keys.shift());
  draw();
  requestAnimationFrame(loop);
}

window.__runefall = game;

if (shotName) {
  stageShot(shotName, game);
  setStatus('RUNEFALL — ' + shotName + ' scene');
  window.__shotReady = true;
} else {
  game.run = createRun(game.rng, game.sanctum);
  setStatus('RUNEFALL — A Deck-Building Card Duel');
}

if (demoMode) {
  window.setInterval(demoStep, 500);
}

requestAnimationFrame(loop);
