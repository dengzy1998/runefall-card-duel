// Canvas setup, the baize table, card faces, element icons, hand layout.
import { W, H, COLORS, ELEMENTS } from './config.js';
import { cardValueLine } from './cards.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_DUEL = 'duel';
export const SCREEN_DRAFT = 'draft';
export const SCREEN_RELIC = 'relic';
export const SCREEN_VICTORY = 'victory';
export const SCREEN_DEFEAT = 'defeat';
export const SCREEN_PAUSED = 'paused';

export function setupCanvas(canvas) {
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  return ctx;
}

export function fitCanvas(canvas) {
  const scale = Math.min(window.innerWidth / W, window.innerHeight / H);
  canvas.style.width = Math.floor(W * scale) + 'px';
  canvas.style.height = Math.floor(H * scale) + 'px';
}

export function drawTable(ctx, watermarkAlpha) {
  ctx.fillStyle = COLORS.backdrop;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = COLORS.table;
  ctx.fillRect(14, 14, W - 28, H - 28);
  ctx.strokeStyle = COLORS.trim;
  ctx.lineWidth = 6;
  ctx.strokeRect(14, 14, W - 28, H - 28);
  ctx.strokeStyle = 'rgba(212,175,55,0.25)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(640, 330, 300, 92, 0, 0, Math.PI * 2);
  ctx.stroke();
  // Faint table watermark — faded to 0.10 so it never fights the title buttons.
  ctx.save();
  ctx.globalAlpha = watermarkAlpha == null ? 0.10 : watermarkAlpha;
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 44px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('✦ RUNEFALL ✦', 640, 338);
  ctx.restore();
}

export function drawElementIcon(ctx, element, x, y, r) {
  const el = ELEMENTS[element] || ELEMENTS.ember;
  ctx.save();
  ctx.fillStyle = el.color;
  ctx.strokeStyle = el.dark;
  ctx.lineWidth = 1.5;
  if (el.shape === 'flame' || el.shape === 'drop') {
    // Teardrop: quadratic curves meeting at a point on top.
    ctx.beginPath();
    ctx.moveTo(x, y - r);
    ctx.quadraticCurveTo(x + r, y - r * 0.2, x + r * 0.7, y + r * 0.5);
    ctx.quadraticCurveTo(x + r * 0.4, y + r, x, y + r);
    ctx.quadraticCurveTo(x - r * 0.4, y + r, x - r * 0.7, y + r * 0.5);
    ctx.quadraticCurveTo(x - r, y - r * 0.2, x, y - r);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (el.shape === 'swirl') {
    ctx.beginPath();
    ctx.arc(x, y, r, 0.3, Math.PI * 1.6);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, y, r * 0.55, Math.PI * 0.9, Math.PI * 2.2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, y, r * 0.25, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Diamond: 4-point.
    ctx.beginPath();
    ctx.moveTo(x, y - r);
    ctx.lineTo(x + r * 0.8, y);
    ctx.lineTo(x, y + r);
    ctx.lineTo(x - r * 0.8, y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}

export function wrapText(ctx, text, maxWidth) {
  const words = String(text).split(' ');
  const lines = [];
  let line = '';
  for (const word of words) {
    const test = line ? line + ' ' + word : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export function drawButton(ctx, rect, label, opts) {
  const o = opts || {};
  ctx.save();
  ctx.fillStyle = o.fill || COLORS.panel;
  ctx.strokeStyle = o.edge || COLORS.trim;
  ctx.lineWidth = o.lineWidth || 2;
  ctx.beginPath();
  ctx.roundRect(rect.x, rect.y, rect.w, rect.h, 8);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = o.textColor || COLORS.gold;
  ctx.font = 'bold ' + (o.fontSize || 18) + 'px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, rect.x + rect.w / 2, rect.y + rect.h / 2 + 1);
  ctx.restore();
}

export function drawCardFace(ctx, card, x, y, w, h, opts) {
  const o = opts || {};
  const s = h / 210; // scale offsets designed for 150x210
  const el = ELEMENTS[card.element] || ELEMENTS.ember;
  ctx.save();
  // Face.
  ctx.fillStyle = o.dimmed ? '#b8b0a0' : COLORS.cardFace;
  ctx.strokeStyle = el.dark;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 8);
  ctx.fill();
  ctx.stroke();
  // Element band.
  ctx.fillStyle = el.color;
  ctx.beginPath();
  ctx.roundRect(x + 3, y + 3, w - 6, 44 * s, [8, 8, 0, 0]);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold ' + Math.round(15 * s) + 'px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(el.name, x + 10 * s, y + 25 * s);
  drawElementIcon(ctx, card.element, x + w - 22 * s, y + 25 * s, 12 * s);
  // Cost circle.
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath();
  ctx.arc(x + 16 * s, y + 62 * s, 13 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold ' + Math.round(15 * s) + 'px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText(String(card.cost || 0), x + 16 * s, y + 63 * s);
  // Big value line.
  ctx.fillStyle = '#1a1a1a';
  ctx.font = 'bold ' + Math.round(26 * s) + 'px Georgia, serif';
  ctx.fillText(cardValueLine(card) || '—', x + w / 2, y + 122 * s);
  // Name.
  ctx.font = 'bold ' + Math.round(16 * s) + 'px Georgia, serif';
  ctx.fillText(card.name, x + w / 2, y + 152 * s);
  // Rules text, wrapped, up to 2 lines.
  ctx.font = Math.round(12 * s) + 'px Georgia, serif';
  ctx.fillStyle = '#44403a';
  const lines = wrapText(ctx, card.text || '', w - 16 * s).slice(0, 2);
  lines.forEach((ln, i) => ctx.fillText(ln, x + w / 2, y + (176 + i * 15) * s));
  ctx.restore();
}

export function drawCardBack(ctx, x, y, w, h) {
  ctx.save();
  ctx.fillStyle = COLORS.enemyCard;
  ctx.strokeStyle = COLORS.enemyCardEdge;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 6);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = COLORS.trim;
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 6, y + 6, w - 12, h - 12);
  ctx.fillStyle = COLORS.gold;
  ctx.font = 'bold 24px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('✦', x + w / 2, y + h / 2);
  ctx.restore();
}

export function handLayout(count) {
  const w = 150;
  const h = 210;
  const gap = 14;
  const total = count * w + (count - 1) * gap;
  const startX = (W - total) / 2;
  const rects = [];
  for (let i = 0; i < count; i++) {
    rects.push({ x: startX + i * (w + gap), y: 486, w, h });
  }
  return rects;
}

export function endTurnRect() {
  return { x: 1064, y: 620, w: 150, h: 52 };
}

export function drawHpBar(ctx, x, y, w, h, hp, maxHp, block) {
  ctx.save();
  ctx.fillStyle = COLORS.hpBack;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 4);
  ctx.fill();
  const frac = Math.max(0, Math.min(1, hp / maxHp));
  ctx.fillStyle = COLORS.hp;
  if (frac > 0) {
    ctx.beginPath();
    ctx.roundRect(x, y, w * frac, h, 4);
    ctx.fill();
  }
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 13px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(hp + ' / ' + maxHp, x + 6, y + h / 2 + 1);
  if (block > 0) {
    ctx.fillStyle = COLORS.block;
    ctx.beginPath();
    ctx.arc(x + w + 14, y + h / 2, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0d1a12';
    ctx.font = 'bold 12px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText(String(block), x + w + 14, y + h / 2 + 1);
  }
  ctx.restore();
}
