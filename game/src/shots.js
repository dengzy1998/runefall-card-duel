// Staged screenshot scenes from real simulated play (fixed seed).
// stageShot(name, game) mutates the game object into the named scene.
import { createRng } from './random.js';
import { createRun, currentFoeId, settleDuelWon, settleDuelLost, offerDraft, offerRelics, applyRelic } from './run.js';
import { createDuel, playCard, endTurn } from './duel.js';
import { smartPilot, recklessPilot, playDuel } from './autopilot.js';

function freshGame(seed) {
  const rng = createRng(seed);
  const run = createRun(rng, { bank: 132, best: 890, perks: [] });
  run.embers = 0;
  return {
    screen: 'title',
    run,
    duel: null,
    rng,
    sanctum: { bank: 132, best: 890, perks: [] },
    showHelp: false,
    draftOptions: [],
    relicOptions: [],
    input: { hover: { x: -1, y: -1 }, clicks: [], keys: [] },
  };
}

// Win `n` duels with the smart pilot, applying draft/relic picks automatically.
function winDuels(game, n) {
  for (let k = 0; k < n; k++) {
    const duel = createDuel(game.run, currentFoeId(game.run), game.rng);
    game.duel = duel;
    const result = playDuel(duel, smartPilot);
    if (result !== 'won') return false;
    const next = settleDuelWon(game.run, game.rng, duel.playerHp);
    if (next === 'draft') {
      const opts = offerDraft(game.run, game.rng);
      if (opts.length > 0) game.run.deck.push(opts[0]);
    } else if (next === 'relic') {
      const opts = offerRelics(game.run, game.rng);
      if (opts.length > 0) applyRelic(game.run, opts[0].id);
    }
  }
  return true;
}

// Play `turns` turns of the current duel, at most 4 card plays per turn.
function playTurns(duel, turns) {
  for (let t = 0; t < turns && duel.phase === 'player'; t++) {
    let plays = 0;
    while (duel.phase === 'player' && plays < 4) {
      const idx = smartPilot(duel);
      if (idx < 0) break;
      playCard(duel, idx);
      plays++;
    }
    if (duel.phase === 'player') endTurn(duel);
  }
}

export function stageShot(name, game) {
  const seed = 1;
  if (name === 'title') {
    const g = freshGame(seed);
    Object.assign(game, g);
    game.screen = 'title';
    game.sanctum = { bank: 132, best: 890, perks: ['vitality'] };
    return game;
  }
  if (name === 'cover') {
    const g = freshGame(seed);
    Object.assign(game, g);
    winDuels(game, 4);
    const duel = createDuel(game.run, currentFoeId(game.run), game.rng);
    game.duel = duel;
    game.screen = 'duel';
    playTurns(duel, 3);
    return game;
  }
  if (name === 'boss') {
    const g = freshGame(seed);
    Object.assign(game, g);
    winDuels(game, 7);
    const duel = createDuel(game.run, currentFoeId(game.run), game.rng);
    game.duel = duel;
    game.screen = 'duel';
    playTurns(duel, 4);
    return game;
  }
  if (name === 'victory') {
    const g = freshGame(seed);
    Object.assign(game, g);
    winDuels(game, 8);
    game.duel = null;
    game.screen = 'victory';
    return game;
  }
  if (name === 'defeat') {
    const g = freshGame(seed);
    Object.assign(game, g);
    winDuels(game, 4);
    const duel = createDuel(game.run, currentFoeId(game.run), game.rng);
    game.duel = duel;
    playDuel(duel, recklessPilot);
    game.screen = 'defeat';
    settleDuelLost(game.run);
    return game;
  }
  const g = freshGame(seed);
  Object.assign(game, g);
  game.screen = 'title';
  return game;
}
