// The 7 screens: duel, title, draft, relic, victory, defeat, paused.
import { W, COLORS } from './config.js';
import { cardById } from './cards.js';
import { relicById, SANCTUM_PERKS } from './relics.js';
import { drawTable, drawButton, drawCardFace, drawElementIcon, handLayout, endTurnRect, wrapText } from './render.js';
import { drawDuelHud, drawTopBar } from './hud.js';
import { canPlay, cardCost } from './duel.js';
import { gradeForScore } from './run.js';

export function drawDuel(ctx, game) {
  const duel = game.duel;
  drawTable(ctx, 0.10);
  drawDuelHud(ctx, duel, game);
  const hover = game.input ? game.input.hover : { x: -1, y: -1 };

  // Last played card.
  ctx.save();
  ctx.fillStyle = COLORS.muted;
  ctx.font = '12px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('LAST PLAYED', 640, 258);
  if (duel.lastPlayed) {
    drawCardFace(ctx, duel.lastPlayed, 565, 268, 150, 210);
  } else {
    ctx.fillStyle = COLORS.text;
    ctx.font = '15px Georgia, serif';
    ctx.fillText('Click a card to play it — or press 1–5.', 640, 380);
    ctx.fillStyle = COLORS.muted;
    ctx.font = '13px Georgia, serif';
    ctx.fillText('Space ends your turn · Esc pauses · M mutes', 640, 404);
  }
  ctx.restore();

  // Hand.
  const rects = handLayout(duel.deck.hand.length);
  duel.deck.hand.forEach((id, i) => {
    const card = cardById(id);
    if (!card) return;
    const r = rects[i];
    const isHover = hover.x >= r.x && hover.x <= r.x + r.w && hover.y >= r.y && hover.y <= r.y + r.h;
    const y = isHover ? r.y - 26 : r.y;
    drawCardFace(ctx, card, r.x, y, r.w, r.h, { dimmed: !canPlay(duel, i) });
    if (!canPlay(duel, i)) {
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.beginPath();
      ctx.roundRect(r.x, y, r.w, r.h, 8);
      ctx.fill();
      ctx.restore();
    }
  });

  // End turn button.
  drawButton(ctx, endTurnRect(), 'END TURN', { fill: '#3a2f10' });
  ctx.save();
  ctx.fillStyle = COLORS.muted;
  ctx.font = '12px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('Space', 1139, 690);
  ctx.restore();
}

export function drawTitle(ctx, game) {
  drawTable(ctx, 0.10);
  const s = game.sanctum || { bank: 0, best: 0, perks: [] };
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = COLORS.gold;
  ctx.font = 'bold 84px Georgia, serif';
  ctx.fillText('RUNEFALL', 640, 150);
  ctx.fillStyle = COLORS.text;
  ctx.font = '22px Georgia, serif';
  ctx.fillText('A DECK-BUILDING CARD DUEL', 640, 190);
  ctx.fillStyle = COLORS.muted;
  ctx.font = '18px Georgia, serif';
  ctx.fillText('3 ACTS · 2 BOSSES · 40 CARDS · 12 RELICS · 6 FOES · 1 SANCTUM', 640, 226);
  ctx.restore();

  drawButton(ctx, { x: 515, y: 268, w: 250, h: 58 }, 'START RUN', { fill: '#3a2f10', fontSize: 22 });
  drawButton(ctx, { x: 515, y: 340, w: 250, h: 40 }, 'HOW TO PLAY', { fontSize: 16 });

  if (game.showHelp) {
    ctx.save();
    ctx.fillStyle = COLORS.panel;
    ctx.strokeStyle = COLORS.panelEdge;
    ctx.beginPath();
    ctx.roundRect(240, 396, 800, 128, 8);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = COLORS.text;
    ctx.font = '15px Georgia, serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    const lines = [
      'Each turn you get 3 Energy and draw to 5 cards. Cards cost Energy to play.',
      'Play a second card of an element already played this turn for SURGE: +1 Energy, next attack +2.',
      'Read the foe\'s telegraphed intent — its next card is shown before it plays.',
      'Click a card or press 1–5 to play it. Space ends your turn. Draft cards and relics between duels.',
    ];
    lines.forEach((ln, i) => ctx.fillText(ln, 264, 420 + i * 26));
    ctx.restore();
  }

  // Sanctum.
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = COLORS.muted;
  ctx.font = '15px Georgia, serif';
  ctx.fillText('SANCTUM — banked embers: ◆ ' + s.bank + ' · best score: ' + s.best, 640, game.showHelp ? 556 : 448);
  const perkY = game.showHelp ? 572 : 464;
  SANCTUM_PERKS.forEach((perk, i) => {
    const x = 290 + i * 240;
    const owned = (s.perks || []).includes(perk.id);
    ctx.fillStyle = COLORS.panel;
    ctx.strokeStyle = owned ? COLORS.gold : COLORS.panelEdge;
    ctx.lineWidth = owned ? 2 : 1;
    ctx.beginPath();
    ctx.roundRect(x, perkY, 220, 84, 8);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = COLORS.gold;
    ctx.font = 'bold 16px Georgia, serif';
    ctx.fillText(perk.name, x + 110, perkY + 20);
    ctx.fillStyle = owned ? COLORS.gold : COLORS.text;
    ctx.font = '14px Georgia, serif';
    ctx.fillText(owned ? 'OWNED' : '◆ ' + perk.cost + ' embers', x + 110, perkY + 44);
    ctx.fillStyle = COLORS.muted;
    ctx.font = '12px Georgia, serif';
    ctx.fillText(perk.text, x + 110, perkY + 66);
  });
  ctx.fillStyle = COLORS.muted;
  ctx.font = '13px Georgia, serif';
  ctx.fillText('Win duels to bank embers. Spend them here to grow stronger across runs.', 640, 688);
  ctx.restore();
}

export function drawDraft(ctx, game) {
  drawTable(ctx, 0.10);
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = COLORS.gold;
  ctx.font = 'bold 34px Georgia, serif';
  ctx.fillText('DUEL WON — CHOOSE A CARD', 640, 120);
  ctx.fillStyle = COLORS.muted;
  ctx.font = '16px Georgia, serif';
  ctx.fillText('Add one card to your deck, or skip.', 640, 152);
  ctx.restore();
  const hover = game.input ? game.input.hover : { x: -1, y: -1 };
  (game.draftOptions || []).forEach((id, i) => {
    const card = cardById(id);
    if (!card) return;
    const x = 290 + i * 240;
    const isHover = hover.x >= x && hover.x <= x + 200 && hover.y >= 220 && hover.y <= 500;
    drawCardFace(ctx, card, x, isHover ? 204 : 220, 200, 280);
  });
  drawButton(ctx, { x: 565, y: 560, w: 150, h: 46 }, 'SKIP', { fontSize: 16 });
}

export function drawRelic(ctx, game) {
  drawTable(ctx, 0.10);
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = COLORS.gold;
  ctx.font = 'bold 34px Georgia, serif';
  ctx.fillText('ACT CLEARED — CHOOSE A RELIC', 640, 120);
  ctx.fillStyle = COLORS.muted;
  ctx.font = '16px Georgia, serif';
  ctx.fillText('Relics change every duel. Choose wisely.', 640, 152);
  ctx.restore();
  (game.relicOptions || []).forEach((relic, i) => {
    if (!relic) return;
    const x = 290 + i * 240;
    const y = 220;
    ctx.save();
    ctx.fillStyle = COLORS.panel;
    ctx.strokeStyle = COLORS.trim;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(x, y, 200, 180, 8);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#3a2f10';
    ctx.beginPath();
    ctx.arc(x + 100, y + 52, 30, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = COLORS.gold;
    ctx.stroke();
    ctx.fillStyle = COLORS.gold;
    ctx.font = 'bold 24px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(relic.name.charAt(0), x + 100, y + 53);
    ctx.fillStyle = COLORS.text;
    ctx.font = 'bold 18px Georgia, serif';
    ctx.fillText(relic.name, x + 100, y + 118);
    ctx.fillStyle = COLORS.muted;
    ctx.font = '13px Georgia, serif';
    const lines = wrapText(ctx, relic.text, 176);
    lines.forEach((ln, j) => ctx.fillText(ln, x + 100, y + 142 + j * 17));
    ctx.restore();
  });
}

function drawEndScreen(ctx, game, won) {
  drawTable(ctx, 0.10);
  const run = game.run;
  const score = run ? run.score : 0;
  const grade = gradeForScore(score);
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = won ? COLORS.gold : COLORS.red;
  ctx.font = 'bold 64px Georgia, serif';
  ctx.fillText(won ? '👑 VICTORY 👑' : 'DEFEAT', 640, 170);
  ctx.fillStyle = COLORS.text;
  ctx.font = '18px Georgia, serif';
  ctx.fillText(
    won ? 'The Ashen King falls. The run is yours.' : 'Briar Queen takes the run. The cards were not with you this time.',
    640, 212,
  );
  ctx.fillStyle = COLORS.panel;
  ctx.strokeStyle = COLORS.panelEdge;
  ctx.beginPath();
  ctx.roundRect(440, 250, 400, 220, 8);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 30px Georgia, serif';
  ctx.fillText('SCORE ' + score, 640, 310);
  ctx.fillStyle = COLORS.gold;
  ctx.font = 'bold 26px Georgia, serif';
  ctx.fillText('GRADE ' + grade, 640, 352);
  ctx.fillStyle = COLORS.muted;
  ctx.font = '16px Georgia, serif';
  ctx.fillText('Duels won: ' + (run ? run.duelsWon : 0) + ' · Embers banked: ◆ ' + (run ? run.embers : 0), 640, 392);
  ctx.fillText('Relics held: ' + (run ? run.relics.length : 0) + ' · Deck: ' + (run ? run.deck.length : 0) + ' cards', 640, 420);
  ctx.fillStyle = COLORS.text;
  ctx.font = '16px Georgia, serif';
  ctx.fillText(won ? 'Press R or click anywhere to run it back.' : 'Press R or click anywhere to try again.', 640, 520);
  ctx.fillStyle = COLORS.muted;
  ctx.font = '14px Georgia, serif';
  ctx.fillText('M mutes · Esc pauses', 640, 548);
  ctx.restore();
}

export function drawVictory(ctx, game) {
  drawEndScreen(ctx, game, true);
}

export function drawDefeat(ctx, game) {
  drawEndScreen(ctx, game, false);
}

export function drawPaused(ctx, game) {
  if (game.duel) drawDuel(ctx, game);
  else drawTitle(ctx, game);
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(0, 0, W, 720);
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 56px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('PAUSED', 640, 350);
  ctx.font = '18px Georgia, serif';
  ctx.fillStyle = COLORS.muted;
  ctx.fillText('Esc or P to resume · R to restart the run', 640, 396);
  ctx.restore();
}
