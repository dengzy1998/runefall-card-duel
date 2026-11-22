// RUNEFALL config — every tuning number, colour and layout constant in one place.
export const W = 1280;
export const H = 720;
export const PLAYER_MAX_HP = 40;
export const ENERGY_PER_TURN = 3;
export const HAND_SIZE = 5;
export const MAX_TURNS_PER_DUEL = 60;

export const COLORS = {
  backdrop: '#0d1a12',
  table: '#14532d',
  tableEdge: '#0b3d20',
  trim: '#d4af37',
  panel: '#10231a',
  panelEdge: '#2c4a38',
  text: '#f2ead8',
  muted: '#a8b8a4',
  gold: '#e8c85a',
  hp: '#e85d3d',
  hpBack: '#3a1512',
  block: '#7fb3d5',
  energy: '#e8c85a',
  enemyCard: '#2a1e33',
  enemyCardEdge: '#5a4a6b',
  cardFace: '#f7f1e3',
  red: '#e85d3d',
};

export const ELEMENTS = {
  ember: { color: '#e85d3d', dark: '#8a2f1d', name: 'Ember', shape: 'flame' },
  tide: { color: '#3d9be8', dark: '#1d4f8a', name: 'Tide', shape: 'drop' },
  gale: { color: '#46c98a', dark: '#1d7a4d', name: 'Gale', shape: 'swirl' },
  stone: { color: '#c9a13b', dark: '#7a5f1d', name: 'Stone', shape: 'diamond' },
};

export const ELEMENT_ORDER = ['ember', 'tide', 'gale', 'stone'];

export const ACTS = [
  { name: 'Act I — Cinderwood', foes: ['cinder-imp', 'thorn-sprout'] },
  { name: 'Act II — The Briar Deep', foes: ['gale-hawk', 'tide-serpent', 'briar-queen'] },
  { name: 'Act III — The Ashen Throne', foes: ['ember-imp', 'stone-golem', 'ashen-king'] },
];

export const EMBERS_PER_WIN = [12, 16, 20];
export const SCORE_PER_WIN_BASE = 25;
export const ACT_CLEAR_BONUS = 100;
