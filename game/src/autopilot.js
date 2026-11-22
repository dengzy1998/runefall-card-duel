// Autopilot pilots + a synchronous whole-duel player for tests and shots.
import { cardById } from './cards.js';
import { canPlay, cardCost, playCard, endTurn } from './duel.js';

function incomingDamage(duel) {
  const intent = cardById(duel.intent);
  return intent && intent.atk ? intent.atk : 0;
}

function cardValue(duel, card) {
  let v = 0;
  if (card.atk) v += card.atk;
  if (card.burn) v += card.burn * 2;
  if (card.draw) v += card.draw * 2;
  if (card.blk) v += card.blk * 0.4;
  if (card.heal) v += card.heal * 0.5;
  if (card.energy) v += card.energy * 3;
  if (card.focus) v += card.focus * 0.8;
  if (card.desperate && duel.playerHp <= duel.playerMaxHp / 2) v += card.atk || 0;
  return v;
}

// smartPilot(duel): returns a hand index to play, or -1 to end the turn.
export function smartPilot(duel) {
  const hand = duel.deck.hand;
  const incoming = incomingDamage(duel);
  const playable = hand.map((id, i) => ({ id, i, card: cardById(id) }))
    .filter((p) => p.card && canPlay(duel, p.i));

  // (1) Lethal playable attack first.
  for (const p of playable) {
    if (p.card.atk) {
      let dmg = p.card.atk + duel.surgeBonus + duel.focus;
      if (duel.playerWeak > 0) dmg = Math.max(1, Math.floor(dmg * 0.75));
      if (dmg >= duel.foeHp + duel.foeBlock) return p.i;
    }
  }
  // (2) Big incoming damage: play the biggest Block card.
  if (incoming >= 8) {
    const blocks = playable.filter((p) => p.card.blk).sort((a, b) => b.card.blk - a.card.blk);
    if (blocks.length > 0) return blocks[0].i;
  }
  // (3) Low HP and light incoming: heal.
  if (duel.playerHp <= duel.playerMaxHp / 2 && incoming < 5) {
    const heals = playable.filter((p) => p.card.heal).sort((a, b) => b.card.heal - a.card.heal);
    if (heals.length > 0) return heals[0].i;
  }
  // (4) Best damage-per-energy among attack/draw/energy cards.
  const attackers = playable
    .filter((p) => p.card.atk || p.card.draw || p.card.energy)
    .map((p) => ({ ...p, score: cardValue(duel, p.card) / Math.max(1, cardCost(duel, p.card)) }))
    .sort((a, b) => b.score - a.score);
  if (attackers.length > 0 && attackers[0].score > 0) return attackers[0].i;
  // (5) A cheap draw or block card.
  const cheap = playable
    .filter((p) => p.card.draw || p.card.blk)
    .sort((a, b) => cardCost(duel, a.card) - cardCost(duel, b.card));
  if (cheap.length > 0) return cheap[0].i;
  return -1;
}

export function recklessPilot(duel) {
  for (let i = 0; i < duel.deck.hand.length; i++) {
    const card = cardById(duel.deck.hand[i]);
    if (card && card.atk && canPlay(duel, i)) return i;
  }
  return -1;
}

// Plays a whole duel synchronously. Returns 'won' | 'lost'.
export function playDuel(duel, pilot) {
  let guard = 0;
  while (duel.phase === 'player' && guard < 600) {
    guard++;
    let plays = 0;
    while (duel.phase === 'player' && plays < 12) {
      const idx = pilot(duel);
      if (idx < 0) break;
      playCard(duel, idx);
      plays++;
    }
    if (duel.phase === 'player') endTurn(duel);
  }
  return duel.phase === 'won' ? 'won' : 'lost';
}
