// RUNEFALL hand-in program: inventory game/ + screenshots/, copy to /output,
// write dossier.json with buildDossier from ./vendor/makefun-game.ts.
import { readdirSync, statSync, copyFileSync, mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = dirname(fileURLToPath(import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR || '/output';

function listFiles(dir, base) {
  const out = [];
  for (const name of readdirSync(dir).sort()) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) out.push(...listFiles(p, base + '/' + name));
    else if (st.isFile()) out.push(base + '/' + name);
  }
  return out;
}

function copyTree(src, dst) {
  mkdirSync(dst, { recursive: true });
  for (const name of readdirSync(src).sort()) {
    const sp = join(src, name);
    const dp = join(dst, name);
    const st = statSync(sp);
    if (st.isDirectory()) copyTree(sp, dp);
    else if (st.isFile()) copyFileSync(sp, dp);
  }
}

const gameDir = join(here, 'game');
const shotsDir = join(here, 'screenshots');
if (!existsSync(gameDir) || readdirSync(gameDir).length === 0) {
  throw new Error('game/ is empty or missing');
}
if (!existsSync(shotsDir)) throw new Error('screenshots/ is missing');
const shots = readdirSync(shotsDir)
  .filter((n) => /\.(png|jpe?g)$/i.test(n))
  .sort();
if (shots.length < 3 || shots.length > 4) {
  throw new Error('screenshots/ must hold 3-4 images, found ' + shots.length);
}
for (const shot of shots) {
  const bytes = statSync(join(shotsDir, shot)).size;
  if (bytes > 262144) throw new Error('screenshot ' + shot + ' is ' + bytes + ' bytes, over the 262144 cap');
}

mkdirSync(outDir, { recursive: true });
copyTree(gameDir, join(outDir, 'game'));
copyTree(shotsDir, join(outDir, 'screenshots'));

const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});
writeFileSync(join(outDir, 'dossier.json'), dossier);

const gameFiles = listFiles(gameDir, 'game');
const gameBytes = gameFiles.reduce((n, f) => n + statSync(join(here, f)).size, 0);
const shotBytes = shots.reduce((n, s) => n + statSync(join(shotsDir, s)).size, 0);
console.log(
  'RUNEFALL dossier written: ' + gameFiles.length + ' game files (' + gameBytes +
  ' bytes), ' + shots.length + ' screenshots (' + shotBytes + ' bytes), dossier ' +
  dossier.length + ' bytes -> ' + outDir,
);
