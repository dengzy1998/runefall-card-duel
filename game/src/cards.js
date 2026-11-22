// The 40-card catalogue: 20 player cards (4 starter kinds + 16 draftable)
// and 20 foe cards. Fields: id, name, element, cost, atk, blk, draw, heal,
// energy, burn, weak, vulnerable, focus, desperate, text.
export const CARDS = [
  // ---- player starter kinds ----
  { id: 'ember-strike', name: 'Ember Strike', element: 'ember', cost: 1, atk: 6, text: 'Deal 6 damage.' },
  { id: 'stone-guard', name: 'Stone Guard', element: 'stone', cost: 1, blk: 6, text: 'Gain 6 Block.' },
  { id: 'gale-swift', name: 'Gale Swift', element: 'gale', cost: 1, draw: 2, text: 'Draw 2 cards.' },
  { id: 'tide-mend', name: 'Tide Mend', element: 'tide', cost: 1, heal: 4, text: 'Restore 4 HP.' },
  // ---- player draftable ----
  { id: 'immolate', name: 'Immolate', element: 'ember', cost: 2, atk: 11, text: 'Deal 11 damage.' },
  { id: 'cinder-burst', name: 'Cinder Burst', element: 'ember', cost: 1, atk: 4, burn: 3, text: 'Deal 4 damage. Burn 3.' },
  { id: 'wildfire', name: 'Wildfire', element: 'ember', cost: 3, atk: 14, text: 'Deal 14 damage.' },
  { id: 'bulwark', name: 'Bulwark', element: 'stone', cost: 2, blk: 11, text: 'Gain 11 Block.' },
  { id: 'quake-slam', name: 'Quake Slam', element: 'stone', cost: 2, atk: 8, blk: 4, text: 'Deal 8 damage. Gain 4 Block.' },
  { id: 'granite-skin', name: 'Granite Skin', element: 'stone', cost: 1, blk: 5, heal: 2, text: 'Gain 5 Block. Restore 2 HP.' },
  { id: 'cyclone', name: 'Cyclone', element: 'gale', cost: 1, atk: 5, draw: 1, text: 'Deal 5 damage. Draw 1 card.' },
  { id: 'slipstream', name: 'Slipstream', element: 'gale', cost: 0, draw: 2, text: 'Draw 2 cards.' },
  { id: 'razor-wind', name: 'Razor Wind', element: 'gale', cost: 1, atk: 7, text: 'Deal 7 damage.' },
  { id: 'deep-current', name: 'Deep Current', element: 'tide', cost: 1, heal: 6, draw: 1, text: 'Restore 6 HP. Draw 1 card.' },
  { id: 'riptide', name: 'Riptide', element: 'tide', cost: 2, atk: 8, heal: 3, text: 'Deal 8 damage. Restore 3 HP.' },
  { id: 'still-water', name: 'Still Water', element: 'tide', cost: 1, blk: 8, text: 'Gain 8 Block.' },
  { id: 'second-chance', name: 'Second Chance', element: 'tide', cost: 1, draw: 2, heal: 2, text: 'Draw 2 cards. Restore 2 HP.' },
  { id: 'power-surge', name: 'Power Surge', element: 'ember', cost: 1, energy: 2, text: 'Gain 2 Energy.' },
  { id: 'focus', name: 'Focus', element: 'stone', cost: 0, focus: 6, text: 'Your next attack +6.' },
  { id: 'last-stand', name: 'Last Stand', element: 'ember', cost: 1, atk: 6, desperate: true, text: 'Deal 6. Double at half HP.' },
  // ---- foe cards ----
  { id: 'imp-claw', name: 'Imp Claw', element: 'ember', cost: 0, atk: 6, text: 'Deal 6 damage.' },
  { id: 'imp-spit', name: 'Imp Spit', element: 'ember', cost: 0, atk: 8, burn: 2, text: 'Deal 8 damage. Burn 2.' },
  { id: 'thorn-whip', name: 'Thorn Whip', element: 'stone', cost: 0, atk: 5, blk: 4, text: 'Deal 5 damage. Gain 4 Block.' },
  { id: 'thorn-bind', name: 'Thorn Bind', element: 'stone', cost: 0, atk: 3, weak: 1, text: 'Deal 3 damage. Weak 1.' },
  { id: 'hawk-dive', name: 'Hawk Dive', element: 'gale', cost: 0, atk: 9, text: 'Deal 4 + 5 damage.' },
  { id: 'hawk-screech', name: 'Hawk Screech', element: 'gale', cost: 0, atk: 4, weak: 1, text: 'Deal 4 damage. Weak 1.' },
  { id: 'serpent-coil', name: 'Serpent Coil', element: 'tide', cost: 0, atk: 6, heal: 6, text: 'Deal 6 damage. Restore 6 HP.' },
  { id: 'serpent-bite', name: 'Serpent Bite', element: 'tide', cost: 0, atk: 9, text: 'Deal 9 damage.' },
  { id: 'golem-slam', name: 'Golem Slam', element: 'stone', cost: 0, atk: 11, text: 'Deal 11 damage.' },
  { id: 'golem-wall', name: 'Golem Wall', element: 'stone', cost: 0, blk: 12, text: 'Gain 12 Block.' },
  { id: 'queen-briar', name: 'Royal Briar', element: 'ember', cost: 0, atk: 10, text: 'Deal 10 damage.' },
  { id: 'queen-wall', name: 'Royal Wall', element: 'stone', cost: 0, blk: 10, text: 'Gain 10 Block.' },
  { id: 'queen-hex', name: 'Royal Hex', element: 'ember', cost: 0, atk: 4, weak: 1, vulnerable: 1, text: 'Deal 4 damage. Weak 1. Vulnerable 1.' },
  { id: 'queen-storm', name: 'Queen Storm', element: 'ember', cost: 0, atk: 8, burn: 2, text: 'Deal 8 damage. Burn 2.' },
  { id: 'king-slam', name: 'King Slam', element: 'ember', cost: 0, atk: 13, text: 'Deal 13 damage.' },
  { id: 'king-wave', name: 'King Wave', element: 'ember', cost: 0, atk: 9, burn: 3, text: 'Deal 9 damage. Burn 3.' },
  { id: 'king-guard', name: 'King Guard', element: 'stone', cost: 0, blk: 10, heal: 4, text: 'Gain 10 Block. Restore 4 HP.' },
  { id: 'king-reign', name: 'King Reign', element: 'ember', cost: 0, atk: 11, weak: 1, text: 'Deal 11 damage. Weak 1.' },
  { id: 'ember-claw', name: 'Ember Claw', element: 'ember', cost: 0, atk: 9, text: 'Deal 9 damage.' },
  { id: 'ember-burst', name: 'Ember Burst', element: 'ember', cost: 0, atk: 7, burn: 3, text: 'Deal 7 damage. Burn 3.' },
];

const BY_ID = new Map(CARDS.map((c) => [c.id, c]));

export function cardById(id) {
  return BY_ID.get(id) || null;
}

export const STARTER_DECK = [
  'ember-strike', 'ember-strike', 'ember-strike',
  'stone-guard', 'stone-guard', 'stone-guard',
  'gale-swift', 'gale-swift',
  'tide-mend', 'tide-mend',
];

export const DRAFT_POOL = [
  'immolate', 'cinder-burst', 'wildfire', 'bulwark', 'quake-slam', 'granite-skin',
  'cyclone', 'slipstream', 'razor-wind', 'deep-current', 'riptide', 'still-water',
  'second-chance', 'power-surge', 'focus', 'last-stand',
];

export function cardValueLine(card) {
  const parts = [];
  if (card.atk) parts.push('⚔ ' + card.atk);
  if (card.blk) parts.push('🛡 ' + card.blk);
  if (card.draw) parts.push('↻ ' + card.draw);
  if (card.heal) parts.push('✚ ' + card.heal);
  if (card.energy) parts.push('◆ ' + card.energy);
  if (card.burn) parts.push('🔥 ' + card.burn);
  if (card.focus) parts.push('✦ ' + card.focus);
  return parts.join('  ');
}
