// fastmark driver: the harness runs `node /bot/main.ts` (Node 22, type stripping).
// It reads the case set from <inputDir>/cases.json — a JSON array of {id, markdown} —
// renders every case on its own with parse() from ./parse.js, and writes the HTML
// strings, in the cases' order, as a JSON array to <outputDir>/html.json.
// MAKEFUN_INPUT_DIR / MAKEFUN_OUTPUT_DIR stand in for /input and /output locally.

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from './parse.js';

const inputDir: string = process.env.MAKEFUN_INPUT_DIR ?? '/input';
const outputDir: string = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The harness provides the output directory, but create it if it is missing
// so a bare local run cannot fail on the write.
mkdirSync(outputDir, { recursive: true });

const raw = readFileSync(join(inputDir, 'cases.json'), 'utf8');
const cases = JSON.parse(raw) as { id: string; markdown: string }[];

const html = new Array<string>(cases.length);
for (let i = 0; i < cases.length; i++) {
  html[i] = parse(cases[i].markdown);
}

writeFileSync(join(outputDir, 'html.json'), JSON.stringify(html));
