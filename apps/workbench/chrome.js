/**
 * Workbench chrome palette — built from Keel's own ramps.
 *
 * ── What this file used to be, and why it changed twice
 *
 * First it was 39 hand-written hex values. They had been authored warm, to sit
 * against a warm system neutral, and when the palette was re-themed to the
 * lotus seeds the system went cool and the frame did not. Nothing caught it,
 * because the chrome was the one part of a project built entirely around
 * "generate it and verify it" that was neither.
 *
 * The first fix generated them — but from a SEPARATE near-achromatic blue-grey
 * at hue 258, on the argument that the frame must stay out of the way of the
 * system under inspection. That argument was wrong, and it was wrong in a way
 * worth recording rather than quietly deleting. A design system's own
 * documentation is its single most legible piece of evidence: a page framed in
 * a palette the system does not ship demonstrates nothing, and a reader is
 * entitled to assume the thing on screen is the thing being sold. The chrome
 * now uses `pond` for every surface and `lotus` for every accent, read straight
 * out of the generated ramps. If the seeds change, this page changes with them.
 *
 * ── What the indirection is still for
 *
 * The chrome does NOT reference `--keel-*` variables directly, and the
 * `--wb-*` layer is not vestigial. Keel's CSS is re-scoped to
 * `[data-keel-theme]` at build time precisely so the PAGE and the SPECIMENS
 * can carry independent themes — reviewing Keel's dark palette while reading
 * the page in light is the normal way to work. If the chrome read `--keel-*`
 * live, flipping the specimen switch would repaint the whole page. So the
 * values are resolved from the ramps at BUILD time and emitted as `--wb-*`,
 * which follow the page theme alone.
 *
 * ── What now carries the frame/specimen separation
 *
 * Colour used to do that job and can no longer, since there is one palette.
 * It is carried structurally instead: a specimen sits on `bg.canvas` inside a
 * dashed `line-strong` stage, on a `panel` that is a step lighter than the
 * `ground` around it. That is a better signal anyway — it survives a re-theme,
 * and it survives someone viewing the page in the other theme.
 */
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ratio } from '../../packages/tokens/contrast.lib.js';

const here = dirname(fileURLToPath(import.meta.url));

const ramps = JSON.parse(
  await readFile(resolve(here, '../../packages/tokens/src/primitive/color.json'), 'utf8'),
).color;

const typography = JSON.parse(
  await readFile(resolve(here, '../../packages/tokens/src/primitive/typography.json'), 'utf8'),
);

/**
 * The chrome's type comes from the same token that sets the system's.
 *
 * These used to be three hardcoded stacks in the page generator, which is the
 * font equivalent of the 39 hand-written hex values this file replaced — and it
 * would have survived the switch to Atkinson Hyperlegible without complaint,
 * leaving the docs page in DM Sans while every component it documented had
 * moved. Reading the token is the only version that cannot drift.
 */
const stack = (role) =>
  typography.font.family[role].$value
    .map((f) => (/[^a-zA-Z-]/.test(f) ? `'${f}'` : f))
    .join(', ');

/** `p('pond', 600)` → the hex the generator produced for that step. */
const p = (ramp, step) => {
  const v = ramps[ramp]?.[String(step)]?.$value;
  if (!v) throw new Error(`chrome.js: no such ramp step — ${ramp}.${step}`);
  return v;
};

/**
 * Chrome roles, as ramp steps.
 *
 * These deliberately echo Keel's own semantic assignments rather than
 * inventing a parallel scheme — `line-control` is `pond.500` because that is
 * what `border.control` is, and the chrome's inputs have exactly the same
 * WCAG 1.4.11 obligation as the system's. Where the chrome needs a role Keel
 * does not have, the step is chosen to sit between two it does.
 */
export const CHROME = {
  light: {
    // `ground` is a step down from `panel` so a specimen — which sits on
    // Keel's pure-white `bg.canvas` — is the brightest thing on the page.
    ground: p('pond', 100),
    panel: p('pond', 0),
    inset: p('pond', 100),
    ink: p('pond', 900),
    muted: p('pond', 600),
    line: p('pond', 200),
    'line-strong': p('pond', 300),
    'line-control': p('pond', 500),
    accent: p('lotus', 600),
    'accent-on': p('pond', 0),
    'accent-soft': p('lotus', 50),
    pass: p('leaf', 700),
    fail: p('russet', 700),
    shadow: '0 1px 2px rgba(13, 16, 15, .05), 0 8px 24px -12px rgba(13, 16, 15, .16)',
  },
  dark: {
    ground: p('pond', 950),
    panel: p('pond', 900),
    inset: p('pond', 800),
    ink: p('pond', 50),
    muted: p('pond', 300),
    line: p('pond', 800),
    'line-strong': p('pond', 700),
    'line-control': p('pond', 500),
    // The accent inverts exactly as the system's does: light fill, dark label.
    accent: p('lotus', 400),
    'accent-on': p('pond', 950),
    'accent-soft': p('lotus', 950),
    pass: p('leaf', 300),
    fail: p('russet', 300),
    shadow: '0 1px 2px rgba(0, 0, 0, .5), 0 8px 24px -12px rgba(0, 0, 0, .7)',
  },
};

/**
 * The chrome's own accessibility gate — the same thresholds the system is held
 * to. A docs page reporting 56 passing contrast requirements from inside a
 * frame that fails them would be worse than publishing no report at all.
 */
const CHROME_PAIRS = [
  ['ink', 'ground', 4.5, 'chrome body text'],
  ['ink', 'panel', 4.5, 'chrome text on a panel'],
  ['ink', 'inset', 4.5, 'chrome text on an inset'],
  ['muted', 'ground', 4.5, 'chrome secondary text'],
  ['muted', 'panel', 4.5, 'chrome secondary text on a panel'],
  ['pass', 'panel', 4.5, 'contrast-report pass label'],
  ['fail', 'panel', 4.5, 'contrast-report fail label'],
  ['accent-on', 'accent', 4.5, 'label on the chrome accent'],
  // `accent` is a focus ring and an active-state fill, so 1.4.11 applies to it
  // against every surface it can appear on — including the accent-soft chips.
  ['accent', 'ground', 3, 'accent focus ring on the ground'],
  ['accent', 'panel', 3, 'accent focus ring on a panel'],
  ['accent', 'accent-soft', 3, 'accent border on its own soft fill'],
  // The rail's hover state is accent text on the soft accent fill, so this
  // pair carries a 4.5:1 text obligation and not merely the 3:1 border one.
  ['accent', 'accent-soft', 4.5, 'accent text on its own soft fill'],
  // Split from `line-strong` for exactly the reason Keel had to split
  // `border.default` from `border.control`: a single value cannot be both a
  // quiet table rule and the sole visible boundary of a text input. The rule
  // is decorative and exempt under WCAG 1.4.11; the control boundary is not,
  // and this gate rejected the build until the two were separated. `line` and
  // `line-strong` are therefore absent from this list on purpose — they carry
  // no meaning, and lifting them to 3:1 would turn every divider into a bar.
  ['line-control', 'panel', 3, 'chrome control border on a panel'],
  ['line-control', 'ground', 3, 'chrome control border on the ground'],
];

export function verifyChrome() {
  const failures = [];
  const rows = [];

  for (const theme of ['light', 'dark']) {
    for (const [fg, bg, min, label] of CHROME_PAIRS) {
      const r = ratio(CHROME[theme][fg], CHROME[theme][bg]);
      rows.push({ theme, label, ratio: r, min });
      if (r < min) failures.push(`${theme}: ${label} — ${r.toFixed(2)}:1, needs ${min}:1`);
    }
  }

  if (failures.length) {
    throw new Error(
      'Workbench chrome fails its own contrast gate:\n  ' +
        failures.join('\n  ') +
        '\n\nAdjust the ramp steps in apps/workbench/chrome.js.',
    );
  }

  return rows;
}

/** Emits the three `--wb-*` blocks: light, media-query dark, and explicit dark. */
export function chromeCss() {
  const block = (theme, indent) =>
    Object.entries(CHROME[theme])
      .map(([k, v]) => `${indent}--wb-${k}: ${v};`)
      .join('\n');

  return `:root {
${block('light', '  ')}

  --wb-display: ${stack('display')};
  --wb-sans: ${stack('sans')};
  --wb-mono: ${stack('mono')};

  color-scheme: light dark;
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
${block('dark', '    ')}
  }
}
:root[data-theme="dark"] {
${block('dark', '  ')}
}`;
}
