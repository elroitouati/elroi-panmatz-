// בדיקות מקרי קצה ללוגיקה הטהורה של האפליקציה.
// הרצה:  node scripts/test-edge-cases.mjs
import { mkdtempSync, copyFileSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const dir = mkdtempSync(join(tmpdir(), 'panmatz-'));
for (const f of ['date.js', 'fitness.js', 'stages.js']) {
  const src = readFileSync(join('src/utils', f), 'utf8').replace(/from '\.\/date'/g, "from './date.js'");
  writeFileSync(join(dir, f), src);
}
copyFileSync('scripts/edge-cases.body.mjs', join(dir, 'run.mjs'));
const { default: run } = await import(join(dir, 'run.mjs'));
process.exit(run() ? 0 : 1);
