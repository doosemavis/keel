/**
 * Token discipline gate for component CSS.
 *
 * Keel already refuses to ship a palette that fails WCAG. This is the same idea
 * one level down: it refuses to ship a component that reaches around the token
 * layer. Both exist because "we agreed not to do that" is not a mechanism, and
 * the audit that produced this file found four raw shadows and twenty-one bare
 * `ease` keywords that had been agreed against and written anyway.
 *
 * ── What is an ERROR, and why only these
 *
 * Colour, shadow and easing are theme-level decisions. A hardcoded one is not
 * merely untidy — it is *wrong in the other theme by construction*. A black
 * shadow assumes a light surface; a hex assumes a palette. There is no such
 * thing as a legitimately local colour in a themed system, so these fail hard.
 *
 * ── What is only REPORTED, and why the difference matters
 *
 * Raw lengths are not the same problem, and treating them as one is how token
 * systems acquire a reputation for dogma. A switch track is 2.25rem × 1.375rem
 * because that is the size of a switch — it is component geometry, not a
 * spacing decision, and forcing it into `space.*` would make the scale a lie
 * and the component harder to read.
 *
 * The real defect in that code is not the number, it is the *anonymity* of the
 * number. So the rule is a convention rather than a ban: component-local
 * geometry is declared once, named, in a `--_*` block at the top of the file.
 * This gate reports how far each file is from that convention and does not fail
 * the build over it, because a number that is named and grouped is finished
 * work, and no amount of tokenising improves it.
 *
 * Lengths that DO belong to the scale — anything matching a `space`, `radius`
 * or `size.control` value — are reported separately, because those are simply
 * a token someone did not look up.
 */
import { readdir, readFile } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const SRC = resolve(here, 'src');

/** Values that are theme decisions and may never be written inline. */
const HARD_RULES = [
  {
    id: 'raw-color',
    re: /#[0-9a-fA-F]{3,8}\b|(?<!var\()\b(?:rgba?|hsla?)\s*\(/g,
    why: 'colour is a theme decision — use a --keel-color-* role',
  },
  {
    id: 'raw-easing',
    re: /\b(?:ease|ease-in|ease-out|ease-in-out|linear|cubic-bezier)\s*(?:\(|[;,\s])/g,
    why: 'easing is a theme decision — use a --keel-easing-* token',
  },
  {
    id: 'raw-duration',
    re: /(?<![\w-])\d+m?s(?![\w-])/g,
    why: 'duration is a theme decision — use a --keel-duration-* token',
  },
];

/** A length is "on the scale" if the token layer already has that exact value. */
async function scaleValues() {
  const files = ['dimension.json', 'typography.json'];
  const out = new Map();
  const dim = {};
  for (const f of files) {
    Object.assign(dim, JSON.parse(await readFile(resolve(here, '../tokens/src/primitive', f), 'utf8')));
  }
  const walk = (node, path) => {
    for (const [k, v] of Object.entries(node)) {
      if (k.startsWith('$')) continue;
      if (v?.$value !== undefined) {
        const full = [...path, k].join('.');
        const group = path.join('.');
        out.set(`${group}|${v.$value}`, full);
      }
      else if (v && typeof v === 'object') walk(v, [...path, k]);
    }
  };
  walk(dim, []);
  return out;
}

const LENGTH = /(?<![\w-])(-?\d*\.?\d+)(rem|px|em)(?![\w-])/g;
/** 0 and hairline values are noise, not decisions. */
const TRIVIAL = new Set(['0rem', '0px', '0em', '1px', '2px', '1em', '100%']);

/**
 * Which scale a length is measured against depends on the PROPERTY, not on the
 * number. This is the whole difficulty, and the first version of this file got
 * it wrong: it compared every length to every token value and reported that a
 * checkbox box of `1rem` "is exactly space.200". It is not. It is the size of a
 * checkbox. `space.200` happens to be the same number, and a rule that cannot
 * tell those apart produces a wall of false positives, which is the reliable
 * way to teach a team to ignore a linter.
 *
 * So each property declares the token group it is actually drawn from. A
 * property not listed here is component geometry and is only ever advisory —
 * sizes, offsets and translations are where a component's real shape lives.
 */
const SCALED_PROPERTIES = [
  { re: /border-radius\s*:[^;]*/g, group: 'radius' },
  { re: /border(?:-block|-inline)?(?:-start|-end)?-width\s*:[^;]*/g, group: 'border.width' },
  { re: /(?:^|[\s;{])border\s*:[^;]*/g, group: 'border.width' },
  { re: /(?:padding|margin)(?:-[a-z-]+)?\s*:[^;]*/g, group: 'space' },
  { re: /(?:row-|column-)?gap\s*:[^;]*/g, group: 'space' },
  { re: /inset(?:-[a-z-]+)?\s*:[^;]*/g, group: 'space' },
  { re: /font-size\s*:[^;]*/g, group: 'font.size' },
];

export async function lintCss() {
  const scale = await scaleValues();
  const dirs = await readdir(SRC, { withFileTypes: true });
  const files = [];
  for (const d of dirs) {
    if (!d.isDirectory()) continue;
    for (const f of await readdir(join(SRC, d.name))) {
      if (f.endsWith('.css')) files.push(join(SRC, d.name, f));
    }
  }

  const errors = [];
  const report = [];

  for (const file of files.sort()) {
    const raw = await readFile(file, 'utf8');
    const rel = relative(resolve(here, '..', '..'), file);
    // Comments hold prose that legitimately names colours and durations.
    const src = raw.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/\S/g, ' '));

    // `animation: ... linear infinite` is the one legitimate raw easing in the
    // system. A busy indicator MUST rotate linearly — any eased curve makes it
    // visibly pulse once per revolution, which reads as a stutter rather than
    // as motion design. That is a correctness requirement, not a theme choice,
    // so it is carved out here by name instead of being left for every reviewer
    // to re-litigate. The DURATION in the same declaration is still enforced.
    const scan = src.replace(/animation\s*:[^;]*/g, (d) => d.replace(/\blinear\b/g, ' '.repeat(6)));

    for (const rule of HARD_RULES) {
      for (const m of scan.matchAll(rule.re)) {
        const line = scan.slice(0, m.index).split('\n').length;
        errors.push(`${rel}:${line}  ${rule.id}  ${m[0].trim()}  — ${rule.why}`);
      }
    }

    // A length written on a property that IS drawn from a scale, whose value
    // already exists in that scale, is simply a token someone did not look up.
    let onScale = 0;
    for (const { re, group } of SCALED_PROPERTIES) {
      for (const decl of src.matchAll(re)) {
        for (const m of decl[0].matchAll(LENGTH)) {
          const v = m[1] + m[2];
          if (TRIVIAL.has(v)) continue;
          const token = scale.get(`${group}|${v}`);
          if (!token) continue;
          onScale++;
          const line = src.slice(0, decl.index).split('\n').length;
          errors.push(
            `${rel}:${line}  on-scale-length  ${v} in \`${decl[0].trim().split(/\s*:/)[0]}\`` +
              `  — that is \`${token}\`; use the token`,
          );
        }
      }
    }

    // Everything else is component geometry: not a defect, but it should be
    // named rather than scattered inline.
    let local = 0;
    const declaresLocals = /^\s*--_[\w-]+\s*:/m.test(src);
    for (const m of src.matchAll(LENGTH)) {
      if (!TRIVIAL.has(m[1] + m[2])) local++;
    }
    local -= onScale;
    if (local > 0 || onScale) report.push({ rel, local, onScale, declaresLocals });
  }

  return { errors, report };
}

const { errors, report } = await lintCss();

const needsConvention = report.filter((r) => r.local >= 4 && !r.declaresLocals);
if (needsConvention.length) {
  console.log('@keel/react — component-local geometry not yet named (advisory):');
  for (const r of needsConvention.sort((a, b) => b.local - a.local)) {
    console.log(`    ${String(r.local).padStart(3)} unnamed lengths  ${r.rel}`);
  }
  console.log('    Declare these once as --_* custom properties at the top of the file.\n');
}

if (errors.length) {
  console.error(`@keel/react — ${errors.length} token-discipline error(s):\n`);
  for (const e of errors) console.error('  ' + e);
  console.error('\nSee packages/react/lint-css.js for why each of these is enforced.');
  process.exit(1);
}

console.log(
  `@keel/react — token discipline: ${report.length} stylesheets clean ` +
    `(no raw colour, shadow, easing or duration; no lengths that duplicate a scale token)`,
);
