// Plays the real game in headless Chromium with keyboard and mouse: title, briefing, a few
// seconds of sneaking and tool use, pause and resume. Saves a frame of each step and reports
// any page error.   node tools/browser-smoke.mjs <outDir>

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { mkdirSync } from 'node:fs';
import { join, extname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const root = fileURLToPath(new URL('../game/', import.meta.url));
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };
const requests = [];

const server = createServer(async (req, res) => {
  requests.push(req.url);
  const path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^\/+/, '') || 'index.html';
  try {
    const body = await readFile(join(root, path));
    res.writeHead(200, { 'content-type': TYPES[extname(path)] ?? 'application/octet-stream' });
    res.end(body);
  } catch { res.writeHead(404); res.end(); }
});

const outDir = process.argv[2] ?? 'out/smoke';
mkdirSync(outDir, { recursive: true });
server.listen(0, async () => {
  const port = server.address().port;
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 960, height: 600 } });
  const errors = [];
  const offsite = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('request', (r) => { if (!r.url().startsWith(`http://127.0.0.1:${port}/`)) offsite.push(r.url()); });
  const snap = async (name) => page.screenshot({ path: join(outDir, `${name}.png`) });
  const hold = async (key, ms) => { await page.keyboard.down(key); await page.waitForTimeout(ms); await page.keyboard.up(key); };

  await page.goto(`http://127.0.0.1:${port}/index.html`);
  await page.waitForTimeout(600);
  await snap('1-title');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(400);
  await snap('2-briefing');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(300);
  await page.keyboard.down('Shift');
  await hold('KeyD', 900);
  await hold('KeyS', 700);
  await page.keyboard.up('Shift');
  await hold('KeyD', 600);
  await page.mouse.move(300, 300);
  await page.mouse.click(300, 300);
  await page.keyboard.press('Digit2');
  await page.mouse.move(250, 200);
  await page.waitForTimeout(300);
  await snap('3-play');
  await page.keyboard.down('KeyQ');
  await page.waitForTimeout(200);
  await snap('4-casing');
  await page.keyboard.up('KeyQ');
  await page.keyboard.press('KeyP');
  await page.waitForTimeout(200);
  await snap('5-paused');
  await page.keyboard.press('KeyP');
  await hold('KeyW', 400);
  console.log('errors:', errors.length ? errors : 'none');
  console.log('off-site requests:', offsite.length ? offsite : 'none');
  console.log('files served:', requests.length);
  await browser.close();
  server.close();
});
