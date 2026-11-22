// Renders the game's own screenshot scenes in headless Chromium and saves them.
//   node tools/take-screenshots.mjs <outDir> [scene...]
// Scenes are ?shot= names from game/src/screenshot-stager.js; a scene may carry extra query
// text, e.g. "room&stage=2&t=3". Output: 768x480 JPEGs (the judge's cover cell size).

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { mkdirSync } from 'node:fs';
import { join, extname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const root = fileURLToPath(new URL('../game/', import.meta.url));
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json' };

const server = createServer(async (req, res) => {
  const path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^\/+/, '') || 'index.html';
  try {
    const body = await readFile(join(root, path));
    res.writeHead(200, { 'content-type': TYPES[extname(path)] ?? 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404);
    res.end();
  }
});

const [outDir = 'screenshots', ...scenes] = process.argv.slice(2);
const DEFAULT = [['1-sneak', 'sneak'], ['2-spotted', 'spotted'], ['3-title', 'title'], ['4-result', 'result']];
const jobs = scenes.length ? scenes.map((s) => [s.replace(/[^a-z0-9]+/gi, '-'), s]) : DEFAULT;

mkdirSync(outDir, { recursive: true });
server.listen(0, async () => {
  const port = server.address().port;
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 768, height: 480 }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  for (const [name, scene] of jobs) {
    await page.goto(`http://127.0.0.1:${port}/index.html?shot=${scene}`);
    await page.waitForSelector('body[data-ready="yes"]', { timeout: 5000 }).catch(() => errors.push(`${scene}: not ready`));
    const file = join(outDir, `${name}.jpg`);
    await page.screenshot({ path: file, type: 'jpeg', quality: 90 });
    console.log('wrote', file);
  }
  if (errors.length) console.log('errors:\n' + errors.join('\n'));
  await browser.close();
  server.close();
});
