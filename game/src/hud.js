// Duel HUD: top bar, HP bars, energy pips, piles, intent, relic row, surge, log.
import { COLORS, ELEMENT_ORDER, ELEMENTS } from './config.js';
import { cardById, cardValueLine } from './cards.js';
import { drawElementIcon, drawHpBar, drawCardBack } from './render.js';
import { relicById } from './relics.js';
import { currentActName } from './run.js';

export function drawTopBar(ctx, run) {
  ctx.save();
  ctx.fillStyle = COLORS.panel;
  ctx.strokeStyle = COLORS.panelEdge;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(24, 22, 1232, 44, 6);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = COLORS.text;
  ctx.font = '17px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  const actName = run ? currentActName(run) : '';
  ctx.fillText(actName, 44, 50);
  ctx.fillText('Duel ' + (run ? run.duelsWon + 1 : 1) + ' of 8', 330, 50);
  ctx.fillStyle = COLORS.gold;
  ctx.fillText('◆ Embers ' + (run ? run.embers : 0), 640, 50);
  ctx.fillStyle = COLORS.text;
  ctx.fillText('Score ' + (run ? run.score : 0), 830, 50);
  ctx.fillText('Deck ' + (run ? run.deck.length : 0) + ' cards', 1010, 50);
  ctx.restore();
}

export function drawDuelHud(ctx, duel, game) {
  const run = duel.run;
  drawTopBar(ctx, run);
  const foe = duel.foe;

  // Foe portrait + name.
  ctx.save();
  ctx.fillStyle = COLORS.panel;
  ctx.beginPath();
  ctx.arc(140, 170, 48, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = COLORS.trim;
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = COLORS.gold;
  ctx.font = 'bold 34px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(foe.name.charAt(0), 140, 172);
  if (foe.boss) {
    ctx.fillStyle = COLORS.gold;
    ctx.font = 'bold 14px Georgia, serif';
    ctx.fillText('★ BOSS ★', 140, 240);
  }
  ctx.textAlign = 'left';
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 22px Georgia, serif';
  ctx.fillText(foe.name, 330, 96);
  ctx.fillStyle = COLORS.muted;
  ctx.font = '14px Georgia, serif';
  ctx.fillText(foe.title, 330, 118);
  ctx.restore();
  drawHpBar(ctx, 330, 132, 480, 18, duel.foeHp, duel.foeMaxHp, duel.foeBlock);

  // Foe statuses.
  ctx.save();
  ctx.fillStyle = COLORS.muted;
  ctx.font = '13px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  const statuses = [];
  if (duel.foeWeak > 0) statuses.push('Weak ' + duel.foeWeak);
  if (duel.foeVuln > 0) statuses.push('Vulnerable ' + duel.foeVuln);
  if (duel.foeBurn > 0) statuses.push('Burn ' + duel.foeBurn);
  if (foe.thorns) statuses.push('Thorns 3');
  ctx.fillText(statuses.join(' · ') || 'No statuses', 330, 178);
  ctx.restore();

  // Intent panel.
  ctx.save();
  ctx.fillStyle = COLORS.panel;
  ctx.strokeStyle = COLORS.panelEdge;
  ctx.beginPath();
  ctx.roundRect(920, 84, 250, 64, 6);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = COLORS.muted;
  ctx.font = 'bold 11px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.fillText('FOE INTENDS', 934, 100);
  const intentCard = cardById(duel.intent);
  if (intentCard) {
    drawElementIcon(ctx, intentCard.element, 946, 128, 11);
    ctx.fillStyle = COLORS.text;
    ctx.font = 'bold 15px Georgia, serif';
    ctx.fillText(intentCard.name, 964, 124);
    ctx.fillStyle = COLORS.muted;
    ctx.font = '13px Georgia, serif';
    ctx.fillText(cardValueLine(intentCard), 964, 142);
  }
  ctx.restore();

  // Foe face-down hand.
  ctx.save();
  for (let i = 0; i < 3; i++) drawCardBack(ctx, 920 + i * 76, 168, 66, 92);
  ctx.fillStyle = COLORS.muted;
  ctx.font = '12px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.fillText("FOE'S HAND", 920, 280);
  ctx.restore();

  // Log.
  ctx.save();
  ctx.fillStyle = COLORS.text;
  ctx.font = '13px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  duel.log.forEach((line, i) => {
    ctx.globalAlpha = 0.55 + 0.45 * ((i + 1) / duel.log.length);
    ctx.fillText(line, 40, 300 + i * 17);
  });
  ctx.restore();

  // Surge meter.
  ctx.save();
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ELEMENT_ORDER.forEach((el, i) => {
    const played = duel.playedElements.includes(el);
    ctx.globalAlpha = played ? 1 : 0.35;
    drawElementIcon(ctx, el, 56 + i * 30, 408, 11);
  });
  ctx.globalAlpha = 1;
  ctx.fillStyle = COLORS.muted;
  ctx.font = '13px Georgia, serif';
  const surgeText = duel.surgeBonus > 0
    ? 'SURGE ready — next attack +' + duel.surgeBonus
    : 'play 2 of an element for SURGE';
  ctx.fillText(surgeText, 180, 408);
  ctx.restore();

  // Relic row.
  ctx.save();
  ctx.fillStyle = COLORS.muted;
  ctx.font = '13px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('Relics:', 40, 456);
  (duel.relics || []).forEach((id, i) => {
    const relic = relicById(id);
    if (!relic) return;
    const cx = 110 + i * 34;
    ctx.fillStyle = '#3a2f10';
    ctx.beginPath();
    ctx.arc(cx, 456, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = COLORS.gold;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = COLORS.gold;
    ctx.font = 'bold 13px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText(relic.name.charAt(0), cx, 457);
  });
  ctx.restore();

  // Player HP + statuses.
  ctx.save();
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 14px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('YOU', 190, 467);
  ctx.restore();
  drawHpBar(ctx, 237, 458, 320, 18, duel.playerHp, duel.playerMaxHp, duel.playerBlock);
  ctx.save();
  ctx.fillStyle = COLORS.muted;
  ctx.font = '13px Georgia, serif';
  ctx.textAlign = 'left';
  const pStatuses = [];
  if (duel.playerWeak > 0) pStatuses.push('Weak ' + duel.playerWeak);
  if (duel.playerVuln > 0) pStatuses.push('Vulnerable ' + duel.playerVuln);
  if (duel.playerBurn > 0) pStatuses.push('Burn ' + duel.playerBurn);
  if (duel.focus > 0) pStatuses.push('Focus +' + duel.focus);
  ctx.fillText(pStatuses.join(' · ') || '', 570, 472);
  ctx.restore();

  // Energy pips.
  ctx.save();
  for (let i = 0; i < duel.maxEnergy; i++) {
    ctx.fillStyle = i < duel.energy ? COLORS.energy : '#3a3a2a';
    ctx.beginPath();
    ctx.arc(1060 + i * 28, 500, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = COLORS.trim;
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  ctx.fillStyle = COLORS.text;
  ctx.font = '13px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.fillText('Energy ' + duel.energy + '/' + duel.maxEnergy, 1060, 524);
  ctx.restore();

  // Piles.
  ctx.save();
  drawCardBack(ctx, 48, 610, 34, 46);
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 13px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText(String(duel.deck.draw.length), 65, 640);
  ctx.fillStyle = COLORS.muted;
  ctx.font = '11px Georgia, serif';
  ctx.fillText('DRAW', 65, 668);
  drawCardBack(ctx, 140, 610, 34, 46);
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 13px Georgia, serif';
  ctx.fillText(String(duel.deck.discard.length), 157, 640);
  ctx.fillStyle = COLORS.muted;
  ctx.font = '11px Georgia, serif';
  ctx.fillText('DISCARD', 157, 668);
  ctx.restore();
}
