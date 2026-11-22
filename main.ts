// Hands HUSHLINE in: copies the static game (game/) and its screenshots (screenshots/) into the
// output directory and writes dossier.json with make.fun's vendored library. Node 22, standard
// library only, no network. It reads nothing but files, never the clock or a random source, and
// copies in sorted order, so two runs write the same bytes.
//
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { mkdirSync, readdirSync, readFileSync, writeFileSync, lstatSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = dirname(fileURLToPath(import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The gate's own caps, passed through so a too-big game fails here first rather than at the gate.
const GATE_CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
};

// Copies regular files and directories only (the gate refuses symlinks), in name order.
function copyTree(from: string, to: string): number {
  mkdirSync(to, { recursive: true });
  let files = 0;
  for (const name of readdirSync(from).sort()) {
    const src = join(from, name);
    const dst = join(to, name);
    const info = lstatSync(src);
    if (info.isDirectory()) files += copyTree(src, dst);
    else if (info.isFile()) { writeFileSync(dst, readFileSync(src)); files++; }
  }
  return files;
}

function main(): void {
  const gameFiles = copyTree(join(repoRoot, 'game'), join(outDir, 'game'));
  const shotsDir = join(repoRoot, 'screenshots');
  const shotFiles = existsSync(shotsDir) ? copyTree(shotsDir, join(outDir, 'screenshots')) : 0;
  const dossier = buildDossier(outDir, GATE_CAPS);
  writeFileSync(join(outDir, 'dossier.json'), dossier);
  console.log(`HUSHLINE handed in: ${gameFiles} game files, ${shotFiles} screenshots, dossier ${dossier.length} bytes`);
}

main();
