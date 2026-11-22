// RUNEFALL screenshot driver (my own): puppeteer-core + /opt/meta-chromium/chrome.
// Serves game/ from disk via CDP Fetch under https://runefall.local because
// localhost navigation is blocked in this Chromium build. Captures the 4 shots
// from shots.json as 1280x720 JPEG q82 and writes report.json.
import puppeteer from '/home/hatch/workspace/makefun/tools/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const gameDir = join(here, 'game');
const shotsDir = join(here, 'screenshots');
const shots = JSON.parse(readFileSync(join(here, 'shots.json'), 'utf8'));

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
};

const report = { consoleErrors: [], pageErrors: [], failedRequests: [], missingFiles: [], shots: [] };

const browser = await puppeteer.launch({
  executablePath: '/opt/meta-chromium/chrome',
  headless: 'new',
  args: [
    '--no-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
    // This Chromium build refuses to start without its WebGL domain policy.
    '--hatch-webgl-allowed-domains-file=/var/lib/hatch-browser/rootfs-base/usr/share/hatch/chromium/webgl-allowed-domains.txt',
    '--hatch-webgl-allowed-domains-sha256=8097045f0459c96c4cdc76e3a1af4e0f43f640b4b59c43d6db35e3641c0264c6',
    '--window-size=1280,720',
    '--force-device-scale-factor=1',
  ],
});

const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 720, deviceScaleFactor: 1 });
page.on('console', (msg) => {
  if (msg.type() === 'error') report.consoleErrors.push(msg.text());
});
page.on('pageerror', (err) => report.pageErrors.push(String(err)));
page.on('requestfailed', (req) => report.failedRequests.push(req.url() + ' :: ' + (req.failure()?.errorText || '')));

const cdp = await page.createCDPSession();
await cdp.send('Fetch.enable', { patterns: [{ urlPattern: 'https://runefall.local/*', requestStage: 'Request' }] });
cdp.on('Fetch.requestPaused', async (ev) => {
  try {
    const url = new URL(ev.request.url);
    let rel = decodeURIComponent(url.pathname);
    if (rel === '/' || rel === '') rel = '/index.html';
    const file = join(gameDir, rel);
    if (!existsSync(file)) {
      report.missingFiles.push(rel);
      await cdp.send('Fetch.failRequest', { requestId: ev.requestId, errorReason: 'Failed' });
      return;
    }
    const body = readFileSync(file).toString('base64');
    await cdp.send('Fetch.fulfillRequest', {
      requestId: ev.requestId,
      responseCode: 200,
      responseHeaders: [{ name: 'content-type', value: MIME[extname(file).toLowerCase()] || 'application/octet-stream' }],
      body,
    });
  } catch (e) {
    await cdp.send('Fetch.failRequest', { requestId: ev.requestId, errorReason: 'Failed' }).catch(() => {});
  }
});

for (const shot of shots) {
  await page.goto('https://runefall.local/' + shot.query, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForFunction('window.__shotReady === true', { timeout: 15000 });
  await new Promise((r) => setTimeout(r, 600));
  const out = join(shotsDir, shot.name);
  await page.screenshot({ path: out, type: 'jpeg', quality: 82 });
  const size = (await import('node:fs')).statSync(out).size;
  report.shots.push({ name: shot.name, bytes: size });
  console.log(shot.name, size, 'bytes');
}

await browser.close();
writeFileSync(join(here, 'shoot-report.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify({ consoleErrors: report.consoleErrors.length, pageErrors: report.pageErrors.length, failedRequests: report.failedRequests.length, missingFiles: report.missingFiles.length }));
