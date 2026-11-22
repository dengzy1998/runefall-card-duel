// The turn engine: create a duel, play cards, end the turn, foe intent.
// Events are bit flags: EVENT_PLAY=1, EVENT_HIT=2, EVENT_WIN=4, EVENT_LOSE=8, EVENT_TURN=16.
import { ENERGY_PER_TURN, HAND_SIZE, MAX_TURNS_PER_DUEL } from './config.js';
import { cardById } from './cards.js';
import { createFoe, nextIntent } from './enemies.js';
import { createDeck, drawCards, discardHand, playFromHand } from './deck.js';
import { hasRelic } from './relics.js';

export const EVENT_PLAY = 1;
export const EVENT_HIT = 2;
export const EVENT_WIN = 4;
export const EVENT_LOSE = 8;
export const EVENT_TURN = 16;

export function createDuel(run, foeId, rng) {
  const foe = createFoe(foeId);
  const relics = run.relics || [];
  const perks = run.perks || [];
  const maxHp = run.maxHp || 40;
  const duel = {
    run,
    rng,
    foe,
    foeId,
    foeHp: foe.hp,
    foeMaxHp: foe.hp,
    foeBlock: 0,
    playerHp: run.hp,
    playerMaxHp: maxHp,
    playerBlock: hasRelic(run, 'emberheart') ? 6 : 0,
    energy: ENERGY_PER_TURN,
    maxEnergy: ENERGY_PER_TURN,
    turn: 1,
    phase: 'player', // 'player' | 'won' | 'lost'
    deck: createDeck(run.deck, rng),
    playedElements: [],
    surgeBonus: 0,
    focus: 0,
    playerWeak: 0,
    playerVuln: 0,
    foeWeak: 0,
    foeVuln: 0,
    playerBurn: 0,
    foeBurn: 0,
    secondWindUsed: false,
    firstCardPlayed: false,
    lastPlayed: null,
    intent: null,
    log: [],
    events: 0,
    playsThisTurn: 0,
    relics,
    perks,
  };
  const handSize = HAND_SIZE + (perks.includes('deep-hand') ? 1 : 0) + (hasRelic(run, 'swift-boots') ? 1 : 0);
  drawCards(duel.deck, handSize, rng);
  duel.intent = nextIntent(foe, intentCtx(duel));
  log(duel, foe.name + ' blocks the way. ' + (foe.boss ? 'A boss duel!' : ''));
  return duel;
}

export function intentCtx(duel) {
  return { turn: duel.turn, playerBlock: duel.playerBlock, foeHp: duel.foeHp, foeMaxHp: duel.foeMaxHp };
}

export function log(duel, line) {
  duel.log.push(line);
  if (duel.log.length > 5) duel.log.shift();
}

export function cardCost(duel, card) {
  if (hasRelic(duel.run, 'gale-feather') && !duel.firstCardPlayed) return 0;
  return card.cost || 0;
}

export function canPlay(duel, index) {
  if (duel.phase !== 'player') return false;
  const id = duel.deck.hand[index];
  if (id == null) return false;
  const card = cardById(id);
  return cardCost(duel, card) <= duel.energy;
}

// Damage the foe takes from a player attack card (raw attack value in).
function applyDamageToFoe(duel, raw, card) {
  let dmg = raw;
  if (duel.focus > 0) { dmg += duel.focus; duel.focus = 0; }
  dmg += duel.surgeBonus;
  duel.surgeBonus = 0;
  if (hasRelic(duel.run, 'whetstone')) dmg += 2;
  if (card && card.desperate && duel.playerHp <= duel.playerMaxHp / 2) dmg *= 2;
  if (duel.playerWeak > 0) dmg = Math.max(1, Math.floor(dmg * 0.75));
  if (duel.foeVuln > 0) dmg = Math.ceil(dmg * 1.25);
  let blocked = Math.min(duel.foeBlock, dmg);
  duel.foeBlock -= blocked;
  const hpDmg = dmg - blocked;
  duel.foeHp -= hpDmg;
  return hpDmg;
}

// Damage the player takes (raw attack value in).
function applyDamageToPlayer(duel, raw) {
  let dmg = raw;
  if (duel.foeWeak > 0) dmg = Math.max(1, Math.floor(dmg * 0.75));
  const blocked = Math.min(duel.playerBlock, dmg);
  duel.playerBlock -= blocked;
  let hpDmg = dmg - blocked;
  if (duel.playerVuln > 0 && hpDmg > 0) hpDmg = Math.ceil(hpDmg * 1.25);
  if (hpDmg >= duel.playerHp && hasRelic(duel.run, 'second-wind') && !duel.secondWindUsed) {
    duel.secondWindUsed = true;
    duel.playerHp = 1;
    log(duel, 'Second Wind! You survive at 1 HP.');
    return 0;
  }
  duel.playerHp -= hpDmg;
  return hpDmg;
}

function healPlayer(duel, n) {
  duel.playerHp = Math.min(duel.playerMaxHp, duel.playerHp + n);
}

export function playCard(duel, index) {
  if (!canPlay(duel, index)) return false;
  const id = duel.deck.hand[index];
  const card = cardById(id);
  const cost = cardCost(duel, card);
  duel.energy -= cost;
  duel.firstCardPlayed = true;
  duel.playsThisTurn++;
  playFromHand(duel.deck, index);
  duel.lastPlayed = card;
  duel.events |= EVENT_PLAY;

  // Surge: second card of an element already played this turn.
  if (duel.playedElements.includes(card.element)) {
    const gain = hasRelic(duel.run, 'surge-stone') ? 2 : 1;
    duel.energy += gain;
    duel.surgeBonus += 2;
    duel.events |= EVENT_HIT;
    log(duel, 'SURGE! ' + card.element + ' again: +' + gain + ' Energy, next attack +2.');
  } else {
    duel.playedElements.push(card.element);
  }

  if (card.focus) {
    duel.focus += card.focus;
    log(duel, card.name + ': next attack +' + card.focus + '.');
  }
  if (card.energy) {
    duel.energy += card.energy;
    log(duel, card.name + ': +' + card.energy + ' Energy.');
  }
  if (card.blk) {
    let blk = card.blk + (hasRelic(duel.run, 'aegis-charm') ? 3 : 0);
    duel.playerBlock += blk;
    log(duel, card.name + ': +' + blk + ' Block.');
  }
  if (card.draw) {
    drawCards(duel.deck, card.draw, duel.rng);
    log(duel, card.name + ': draw ' + card.draw + '.');
  }
  if (card.heal) {
    healPlayer(duel, card.heal);
    log(duel, card.name + ': restore ' + card.heal + ' HP.');
  }
  if (card.atk) {
    const dealt = applyDamageToFoe(duel, card.atk, card);
    duel.events |= EVENT_HIT;
    log(duel, card.name + ' hits ' + duel.foe.name + ' for ' + dealt + '.');
    // Briar Queen thorns: reflect 3 when struck and surviving.
    if (duel.foe.thorns && duel.foeHp > 0) {
      duel.playerHp -= duel.foe.thorns;
      log(duel, 'Thorns! You take ' + duel.foe.thorns + '.');
      if (duel.playerHp <= 0) {
        duel.playerHp = Math.max(0, duel.playerHp);
        duel.phase = 'lost';
        duel.events |= EVENT_LOSE;
        return true;
      }
    }
    if (card.burn) {
      duel.foeBurn += card.burn;
      log(duel, duel.foe.name + ' burns for ' + card.burn + '.');
    }
    if (duel.foeHp <= 0) {
      duel.foeHp = 0;
      duel.phase = 'won';
      duel.events |= EVENT_WIN;
      log(duel, duel.foe.name + ' falls!');
      return true;
    }
  } else if (card.burn) {
    duel.foeBurn += card.burn;
  }
  if (card.weak) { duel.foeWeak += card.weak; log(duel, duel.foe.name + ' is Weak.'); }
  if (card.vulnerable) { duel.foeVuln += card.vulnerable; log(duel, duel.foe.name + ' is Vulnerable.'); }
  if (card.element === 'tide' && hasRelic(duel.run, 'tide-pearl')) {
    healPlayer(duel, 2);
    log(duel, 'Tide Pearl: +2 HP.');
  }
  return true;
}

function foePlayCard(duel, card) {
  if (card.atk) {
    const dealt = applyDamageToPlayer(duel, card.atk);
    log(duel, duel.foe.name + ' plays ' + card.name + ' for ' + dealt + '.');
  } else {
    log(duel, duel.foe.name + ' plays ' + card.name + '.');
  }
  if (card.blk) { duel.foeBlock += card.blk; log(duel, duel.foe.name + ' gains ' + card.blk + ' Block.'); }
  if (card.heal) {
    duel.foeHp = Math.min(duel.foeMaxHp, duel.foeHp + card.heal);
    log(duel, duel.foe.name + ' restores ' + card.heal + ' HP.');
  }
  if (card.burn) { duel.playerBurn += card.burn; log(duel, 'You burn for ' + card.burn + '.'); }
  if (card.weak) { duel.playerWeak += card.weak; log(duel, 'You are Weak.'); }
  if (card.vulnerable) { duel.playerVuln += card.vulnerable; log(duel, 'You are Vulnerable.'); }
  if (duel.playerHp <= 0) {
    duel.playerHp = 0;
    duel.phase = 'lost';
    duel.events |= EVENT_LOSE;
  }
}

export function endTurn(duel) {
  if (duel.phase !== 'player') return;
  duel.events |= EVENT_TURN;
  discardHand(duel.deck);
  duel.playedElements = [];
  duel.surgeBonus = 0;
  duel.firstCardPlayed = false;
  duel.playsThisTurn = 0;

  // Foe turn: block resets, burn ticks, foe plays its telegraphed intent.
  duel.foeBlock = 0;
  if (duel.foeBurn > 0) {
    duel.foeHp -= duel.foeBurn;
    log(duel, duel.foe.name + ' takes ' + duel.foeBurn + ' burn.');
    duel.foeBurn = 0;
    if (duel.foeHp <= 0) {
      duel.foeHp = 0;
      duel.phase = 'won';
      duel.events |= EVENT_WIN;
      return;
    }
  }
  const intentId = duel.intent;
  const intentCard = cardById(intentId);
  if (intentCard) foePlayCard(duel, intentCard);
  if (duel.phase === 'lost') return;

  // New player turn: burn ticks, counters decay, block resets, refill, draw.
  duel.turn++;
  if (duel.turn > MAX_TURNS_PER_DUEL) {
    duel.phase = 'lost';
    duel.events |= EVENT_LOSE;
    log(duel, 'The duel drags on too long — you fall.');
    return;
  }
  if (duel.playerBurn > 0) {
    duel.playerHp -= duel.playerBurn;
    log(duel, 'You take ' + duel.playerBurn + ' burn.');
    duel.playerBurn = 0;
    if (duel.playerHp <= 0) {
      duel.playerHp = 0;
      duel.phase = 'lost';
      duel.events |= EVENT_LOSE;
      return;
    }
  }
  if (duel.playerWeak > 0) duel.playerWeak--;
  if (duel.playerVuln > 0) duel.playerVuln--;
  if (duel.foeWeak > 0) duel.foeWeak--;
  if (duel.foeVuln > 0) duel.foeVuln--;
  duel.playerBlock = hasRelic(duel.run, 'mountain-core') ? 2 : 0;
  duel.energy = duel.maxEnergy;
  const handSize = HAND_SIZE + (duel.perks.includes('deep-hand') ? 1 : 0) + (duel.turn === 1 && hasRelic(duel.run, 'swift-boots') ? 1 : 0);
  // Note: turn was already incremented, so turn-1 boot applies on the second turn
  // counter — Swift Boots is handled at duel start; keep the draw simple here.
  drawCards(duel.deck, handSize, duel.rng);
  duel.intent = nextIntent(duel.foe, intentCtx(duel));
  log(duel, 'Turn ' + duel.turn + ' — ' + duel.energy + ' Energy.');
}
