// Alvarez Family Budget — entry program (Node 22, standard library only).
//
// The site lives in app/ beside this file: plain static files a browser
// opens at app/index.html (ES modules, CSS, no build step). Nothing it
// runs, styles or shows loads over the network. This program hands it in:
// it copies app/ and screenshots/ to /output and writes
// /output/dossier.json — the summary the judge reads (the screenshots, the
// first load's files and bytes, and the source) — with the vendored
// make.fun library. Leave vendor/makefun-frontend.ts as it is: the scorer
// requires dossier.json to be byte for byte what its own copy writes.
//
// Serve it locally with `node serve.ts`, then open http://localhost:8080.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Validate the entry before writing anything: a broken site must fail
// loudly here instead of silently shipping an invalid dossier.
if (!existsSync(join(here, 'app', 'index.html'))) {
  throw new Error('app/index.html is missing — the site cannot be handed in without it');
}
const shots = existsSync(join(here, 'screenshots'))
  ? readdirSync(join(here, 'screenshots')).filter((f) => /\.(png|jpe?g)$/i.test(f))
  : [];
if (shots.length < 3 || shots.length > 4) {
  throw new Error(`expected 3 or 4 screenshots, found ${shots.length}`);
}
for (const shot of shots) {
  const bytes = statSync(join(here, 'screenshots', shot)).size;
  if (bytes > 262144) throw new Error(`screenshot ${shot} is ${bytes} bytes, over the 256 KiB cap`);
}

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes
// the bytes; the others refuse an entry the scorer would refuse (more than
// 4 screenshots or one over 256 KiB; more than 993 files and directories
// in app/ or 16 MiB of app files).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, { text_max_bytes: 163840, screenshots: { max: 4, max_bytes: 262144 }, app_max_files: 993, app_max_bytes: 16777216 }),
);
