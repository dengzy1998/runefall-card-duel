// Draw pile / hand / discard pile.
import { shuffle } from './random.js';

export function createDeck(cardIds, rng) {
  return {
    draw: shuffle(cardIds.slice(), rng),
    hand: [],
    discard: [],
  };
}

export function drawCards(deck, n, rng) {
  for (let i = 0; i < n; i++) {
    if (deck.draw.length === 0) {
      if (deck.discard.length === 0) return;
      deck.draw = shuffle(deck.discard, rng);
      deck.discard = [];
    }
    deck.hand.push(deck.draw.pop());
  }
}

export function discardHand(deck) {
  while (deck.hand.length > 0) deck.discard.push(deck.hand.pop());
}

export function playFromHand(deck, index) {
  const [cardId] = deck.hand.splice(index, 1);
  if (cardId != null) deck.discard.push(cardId);
  return cardId;
}

export function deckSize(deck) {
  return deck.draw.length + deck.hand.length + deck.discard.length;
}
