// The 8-foe roster and each foe's readable intent policy.
// nextIntent(foe, ctx) returns the foe card id it will play next.
// ctx: { turn, playerBlock, foeHp, foeMaxHp }
import { cardById } from './cards.js';

export const ENEMIES = [
  { id: 'cinder-imp', name: 'Cinder Imp', title: 'Act I Foe', hp: 30, boss: false, hand: ['imp-claw', 'imp-spit'] },
  { id: 'thorn-sprout', name: 'Thorn Sprout', title: 'Act I Foe', hp: 32, boss: false, hand: ['thorn-whip', 'thorn-bind'] },
  { id: 'gale-hawk', name: 'Gale Hawk', title: 'Act II Foe', hp: 40, boss: false, hand: ['hawk-dive', 'hawk-screech'] },
  { id: 'tide-serpent', name: 'Tide Serpent', title: 'Act II Foe', hp: 42, boss: false, hand: ['serpent-coil', 'serpent-bite'] },
  { id: 'briar-queen', name: 'Briar Queen', title: 'Act II Boss · Thorns 3', hp: 60, boss: true, thorns: 3, hand: ['queen-briar', 'queen-wall', 'queen-hex', 'queen-storm'] },
  { id: 'ember-imp', name: 'Ember Imp', title: 'Act III Foe', hp: 38, boss: false, hand: ['ember-claw', 'ember-burst'] },
  { id: 'stone-golem', name: 'Stone Golem', title: 'Act III Foe', hp: 50, boss: false, hand: ['golem-slam', 'golem-wall'] },
  { id: 'ashen-king', name: 'The Ashen King', title: 'Act III Boss', hp: 80, boss: true, hand: ['king-slam', 'king-wave', 'king-guard', 'king-reign'] },
];

const BY_ID = new Map(ENEMIES.map((e) => [e.id, e]));

export function enemyById(id) {
  return BY_ID.get(id) || null;
}

export function createFoe(id) {
  const def = enemyById(id);
  if (!def) throw new Error('unknown foe ' + id);
  return { ...def, hand: def.hand.slice() };
}

export function nextIntent(foe, ctx) {
  const turn = ctx.turn || 1;
  const half = ctx.foeHp <= ctx.foeMaxHp / 2;
  switch (foe.id) {
    case 'cinder-imp':
    case 'ember-imp':
      return turn % 2 === 0 ? foe.hand[0] : foe.hand[1];
    case 'thorn-sprout':
      return ctx.playerBlock === 0 ? 'thorn-bind' : 'thorn-whip';
    case 'gale-hawk':
      return ctx.playerBlock === 0 ? 'hawk-dive' : 'hawk-screech';
    case 'tide-serpent':
      return half ? 'serpent-coil' : 'serpent-bite';
    case 'briar-queen':
      if (turn % 3 === 2) return 'queen-storm';
      if (half && turn % 2 === 0) return 'queen-wall';
      if (ctx.playerBlock === 0 && turn % 2 === 1) return 'queen-hex';
      return 'queen-briar';
    case 'stone-golem':
      return half ? 'golem-wall' : 'golem-slam';
    case 'ashen-king':
      if (turn % 3 === 2) return 'king-reign';
      if (half && turn % 2 === 0) return 'king-guard';
      if (turn % 2 === 1) return 'king-wave';
      return 'king-slam';
    default:
      return foe.hand[0];
  }
}

export function randomFoeCard(foe, rng) {
  return foe.hand[Math.floor(rng() * foe.hand.length)];
}

export function intentCard(foe, ctx) {
  return cardById(nextIntent(foe, ctx));
}
