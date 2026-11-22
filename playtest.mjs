// RUNEFALL play-test (my own): real clicks + keys on the live game, then ?demo=1.
import puppeteer from '/home/hatch/workspace/makefun/tools/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js';
import { readFileSync, existsSync } from 'node:fs';
import { join, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const gameDir = join(here, 'game');
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8' };

const browser = await puppeteer.launch({
  executablePath: '/opt/meta-chromium/chrome',
  headless: 'new',
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu',
    '--hatch-webgl-allowed-domains-file=/var/lib/hatch-browser/rootfs-base/usr/share/hatch/chromium/webgl-allowed-domains.txt',
    '--hatch-webgl-allowed-domains-sha256=8097045f0459c96c4cdc76e3a1af4e0f43f640b4b59c43d6db35e3641c0264c6',
    '--window-size=1280,720', '--force-device-scale-factor=1'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 720, deviceScaleFactor: 1 });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });

const cdp = await page.createCDPSession();
await cdp.send('Fetch.enable', { patterns: [{ urlPattern: 'https://runefall.local/*', requestStage: 'Request' }] });
cdp.on('Fetch.requestPaused', async (ev) => {
  const url = new URL(ev.request.url);
  let rel = decodeURIComponent(url.pathname);
  if (rel === '/' || rel === '') rel = '/index.html';
  const file = join(gameDir, rel);
  if (!existsSync(file)) { await cdp.send('Fetch.failRequest', { requestId: ev.requestId, errorReason: 'Failed' }); return; }
  await cdp.send('Fetch.fulfillRequest', {
    requestId: ev.requestId, responseCode: 200,
    responseHeaders: [{ name: 'content-type', value: MIME[extname(file).toLowerCase()] || 'application/octet-stream' }],
    body: readFileSync(file).toString('base64'),
  });
});

const state = () => page.evaluate(() => {
  const g = window.__runefall;
  if (!g) return null;
  return {
    screen: g.screen,
    foe: g.duel ? g.duel.foe.name : null,
    foeHp: g.duel ? g.duel.foeHp : null,
    playerHp: g.duel ? g.duel.playerHp : null,
    energy: g.duel ? g.duel.energy : null,
    turn: g.duel ? g.duel.turn : null,
    hand: g.duel ? g.duel.deck.hand.length : null,
    duelsWon: g.run ? g.run.duelsWon : null,
    score: g.run ? g.run.score : null,
  };
});

await page.goto('https://runefall.local/', { waitUntil: 'domcontentloaded' });
await page.waitForFunction('window.__runefall !== undefined', { timeout: 10000 });
await new Promise((r) => setTimeout(r, 500));
console.log('before start:', JSON.stringify(await state()));
await page.mouse.click(640, 297); // START RUN
await new Promise((r) => setTimeout(r, 500));
console.log('after START:', JSON.stringify(await state()));
const before = await state();
// Click the first hand card (hand row y=486, first card centre depends on count; 5 cards -> start x ~ 205)
await page.mouse.click(280, 590);
await new Promise((r) => setTimeout(r, 400));
console.log('after card click:', JSON.stringify(await state()));
await page.keyboard.press('Space');
await new Promise((r) => setTimeout(r, 400));
console.log('after Space:', JSON.stringify(await state()));
await page.keyboard.press('Digit2');
await new Promise((r) => setTimeout(r, 400));
console.log('after Digit2:', JSON.stringify(await state()));

// Demo mode: fresh page, ?demo=1, watch for 45 s.
const page2 = await browser.newPage();
await page2.setViewport({ width: 1280, height: 720, deviceScaleFactor: 1 });
const cdp2 = await page2.createCDPSession();
await cdp2.send('Fetch.enable', { patterns: [{ urlPattern: 'https://runefall.local/*', requestStage: 'Request' }] });
cdp2.on('Fetch.requestPaused', async (ev) => {
  const url = new URL(ev.request.url);
  let rel = decodeURIComponent(url.pathname);
  if (rel === '/' || rel === '') rel = '/index.html';
  const file = join(gameDir, rel);
  if (!existsSync(file)) { await cdp2.send('Fetch.failRequest', { requestId: ev.requestId, errorReason: 'Failed' }); return; }
  await cdp2.send('Fetch.fulfillRequest', {
    requestId: ev.requestId, responseCode: 200,
    responseHeaders: [{ name: 'content-type', value: MIME[extname(file).toLowerCase()] || 'application/octet-stream' }],
    body: readFileSync(file).toString('base64'),
  });
});
await page2.goto('https://runefall.local/?demo=1', { waitUntil: 'domcontentloaded' });
await page2.waitForFunction('window.__runefall !== undefined', { timeout: 10000 });
await new Promise((r) => setTimeout(r, 45000));
const demo = await page2.evaluate(() => {
  const g = window.__runefall;
  return { screen: g.screen, duelsWon: g.run ? g.run.duelsWon : null, score: g.run ? g.run.score : null, act: g.run ? g.run.act : null };
});
console.log('demo after 45s:', JSON.stringify(demo));
console.log('errors:', JSON.stringify(errors));
await browser.close();
