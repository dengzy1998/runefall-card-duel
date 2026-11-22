// The 12 relics and the 3 Sanctum meta-progression perks.
export const RELICS = [
  { id: 'emberheart', name: 'Emberheart', text: 'Start each duel with 6 Block.' },
  { id: 'whetstone', name: 'Whetstone', text: 'Your attacks deal +2 damage.' },
  { id: 'aegis-charm', name: 'Aegis Charm', text: 'Your Block cards grant +3 Block.' },
  { id: 'swift-boots', name: 'Swift Boots', text: 'Draw +1 card on turn 1.' },
  { id: 'blood-vial', name: 'Blood Vial', text: 'Heal +3 HP after each duel won.' },
  { id: 'surge-stone', name: 'Surge Stone', text: 'Surge grants +2 Energy instead of +1.' },
  { id: 'golden-hoard', name: 'Golden Hoard', text: '+8 embers after each duel won.' },
  { id: 'iron-will', name: 'Iron Will', text: 'Max HP +8. Heal 8 HP now.' },
  { id: 'second-wind', name: 'Second Wind', text: 'Once per duel, survive lethal damage at 1 HP.' },
  { id: 'gale-feather', name: 'Gale Feather', text: 'The first card you play each turn costs 0.' },
  { id: 'tide-pearl', name: 'Tide Pearl', text: 'Restore 2 HP when you play a Tide card.' },
  { id: 'mountain-core', name: 'Mountain Core', text: 'Start each turn with +2 Block.' },
];

export const RELIC_IDS = RELICS.map((r) => r.id);

const BY_ID = new Map(RELICS.map((r) => [r.id, r]));

export function relicById(id) {
  return BY_ID.get(id) || null;
}

export function hasRelic(run, id) {
  return !!(run && run.relics && run.relics.includes(id));
}

export const SANCTUM_PERKS = [
  { id: 'vitality', name: 'Vitality', cost: 50, text: '+6 max HP every run.' },
  { id: 'deep-hand', name: 'Deep Hand', cost: 80, text: '+1 card drawn each turn.' },
  { id: 'emberheart', name: 'Emberheart', cost: 120, text: 'Start every run holding Emberheart.' },
];
