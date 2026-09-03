/**
 * Contrast gate (CLI).
 *
 * Runs as part of `npm run build`, so a palette change that breaks a WCAG
 * requirement fails the build rather than shipping. The pair list and the maths
 * live in contrast.lib.js, which the workbench also imports — one definition of
 * what must pass, used by both.
 */
import { report } from './contrast.lib.js';

const { rows, failures } = await report();

const w = (s, n) => String(s).padEnd(n);
const LABEL = {
  pass: 'pass',
  fail: 'FAIL',
  'exempt-pass': 'pass (exempt)',
  'exempt-below': 'below (exempt)',
  missing: 'MISSING TOKEN',
};

console.log(`\n${w('theme', 7)}${w('pair', 38)}${w('ratio', 8)}${w('min', 6)}status`);
console.log('-'.repeat(74));
for (const r of rows) {
  console.log(`${w(r.theme, 7)}${w(r.label, 38)}${w(r.ratio ?? '—', 8)}${w(r.min, 6)}${LABEL[r.status]}`);
}

if (failures > 0) {
  console.error(`\n${failures} enforced contrast requirement(s) failed.`);
  process.exit(1);
}
console.log(`\nAll ${rows.filter((r) => !r.exempt).length} enforced contrast requirements pass.`);
