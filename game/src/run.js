// The run: 3 acts, 8 duels, drafts, relics, Sanctum, score and grades.
import { ACTS, EMBERS_PER_WIN, SCORE_PER_WIN_BASE, ACT_CLEAR_BONUS, PLAYER_MAX_HP } from './config.js';
import { STARTER_DECK, DRAFT_POOL } from './cards.js';
import { RELICS, RELIC_IDS, SANCTUM_PERKS, hasRelic } from './relics.js';
import { shuffle } from './random.js';

const store = {
  get(key) {
    try {
      if (typeof globalThis !== 'undefined' && globalThis.localStorage) return globalThis.localStorage.getItem(key);
    } catch (e) { /* no storage */ }
    return null;
  },
  set(key, value) {
    try {
      if (typeof globalThis !== 'undefined' && globalThis.localStorage) globalThis.localStorage.setItem(key, value);
    } catch (e) { /* no storage */ }
  },
};

export function loadSanctum() {
  const bank = parseInt(store.get('runefall.bank') || '0', 10) || 0;
  const best = parseInt(store.get('runefall.best') || '0', 10) || 0;
  let perks = [];
  try { perks = JSON.parse(store.get('runefall.sanctum') || '[]'); } catch (e) { perks = []; }
  if (!Array.isArray(perks)) perks = [];
  return { bank, best, perks };
}

export function saveSanctum(sanctum) {
  store.set('runefall.bank', String(sanctum.bank || 0));
  store.set('runefall.best', String(sanctum.best || 0));
  store.set('runefall.sanctum', JSON.stringify(sanctum.perks || []));
}

export function bankEmbers(run) {
  const s = loadSanctum();
  s.bank += run.embers || 0;
  if (run.score > s.best) s.best = run.score;
  saveSanctum(s);
  return s;
}

export function createRun(rng, sanctum) {
  const s = sanctum || loadSanctum();
  const perks = s.perks || [];
  const maxHp = PLAYER_MAX_HP + (perks.includes('vitality') ? 6 : 0);
  const run = {
    act: 0,
    duelIndex: 0,
    hp: maxHp,
    maxHp,
    embers: 0,
    score: 0,
    duelsWon: 0,
    deck: STARTER_DECK.slice(),
    relics: perks.includes('emberheart') ? ['emberheart'] : [],
    perks,
    rng,
    sanctum: s,
  };
  return run;
}

export function currentAct(run) {
  return ACTS[run.act];
}

export function currentActName(run) {
  return currentAct(run).name;
}

export function currentFoeId(run) {
  return currentAct(run).foes[run.duelIndex];
}

export function isBossDuel(run) {
  const id = currentFoeId(run);
  return id === 'briar-queen' || id === 'ashen-king';
}

export function totalDuels() {
  return ACTS.reduce((n, a) => n + a.foes.length, 0);
}

// Returns 'draft' | 'relic' | 'victory'. Mutates run.
export function settleDuelWon(run, random, finalHp) {
  run.hp = finalHp;
  const act = run.act;
  let gained = EMBERS_PER_WIN[act];
  if (hasRelic(run, 'golden-hoard')) gained += 8;
  run.embers += gained;
  run.score += SCORE_PER_WIN_BASE + gained + Math.max(0, finalHp);
  run.duelsWon++;
  run.hp = Math.min(run.maxHp, run.hp + 6 + (hasRelic(run, 'blood-vial') ? 3 : 0));
  const actFoes = currentAct(run).foes;
  const lastInAct = run.duelIndex >= actFoes.length - 1;
  if (lastInAct) {
    run.score += ACT_CLEAR_BONUS;
    if (act >= ACTS.length - 1) {
      bankEmbers(run);
      return 'victory';
    }
    run.act++;
    run.duelIndex = 0;
    return 'relic';
  }
  run.duelIndex++;
  return 'draft';
}

export function settleDuelLost(run) {
  bankEmbers(run);
  return 'defeat';
}

export function offerDraft(run, rng) {
  const pool = shuffle(DRAFT_POOL.slice(), rng || run.rng);
  return pool.slice(0, 3);
}

export function offerRelics(run, rng) {
  const held = run.relics || [];
  const pool = shuffle(RELIC_IDS.filter((id) => !held.includes(id)), rng || run.rng);
  return pool.slice(0, 3).map((id) => RELICS.find((r) => r.id === id));
}

export function applyRelic(run, relicId) {
  if (!run.relics.includes(relicId)) run.relics.push(relicId);
  if (relicId === 'iron-will') {
    run.maxHp += 8;
    run.hp = Math.min(run.maxHp, run.hp + 8);
  }
}

export function buyPerk(sanctum, perkId) {
  const perk = SANCTUM_PERKS.find((p) => p.id === perkId);
  if (!perk) return false;
  if ((sanctum.perks || []).includes(perkId)) return false;
  if ((sanctum.bank || 0) < perk.cost) return false;
  sanctum.bank -= perk.cost;
  sanctum.perks = (sanctum.perks || []).concat([perkId]);
  saveSanctum(sanctum);
  return true;
}

export function gradeForScore(score) {
  if (score >= 750) return 'S';
  if (score >= 600) return 'A';
  if (score >= 450) return 'B';
  return 'C';
}
