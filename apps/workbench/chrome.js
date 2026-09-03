/**
 * Workbench chrome palette — generated, and contrast-checked like everything else.
 *
 * This file replaces 39 hand-written hex values that had quietly gone stale.
 * They were authored warm, to sit against a warm system neutral; when the
 * palette was re-themed to the lotus seeds the system went cool and the frame
 * did not, so the page rendered as two temperatures arguing. Nothing caught it,
 * because nothing was checking — the chrome was the one part of a project built
 * entirely around "generate it and verify it" that was neither.
 *
 * So the chrome is now derived from the same OKLCH conversion as the system's
 * own ramps, from the seeds below, and its own text/background pairs are gated
 * at WCAG AA before the page will build. A docs page that reports 56 passing
 * contrast requirements while its own body text sits at 3:1 is not a good look.
 *
 * ── Why the chrome is cool, and why that is a decision rather than a default
 *
 * The obvious move is a warm paper frame: maximum separation from a cool
 * system, and it reads as a printed reference sheet. It was rejected. `pond`
 * sits at hue 168 specifically because it is the near-complement of the lotus
 * magenta, which is what makes the accent pop on every Keel surface. Wrapping
 * that in warm cream introduces a third temperature and spends the effect.
 *
 * The chrome is therefore cool too, at hue 258 — far enough from pond's 168
 * that a chrome surface never reads as a Keel surface, close enough in
 * temperature that the page has one climate and `lotus` is the only thing on
 * screen that registers as colour. Separation is carried by hue distance and
 * value, not by temperature.
 *
 * The chrome accent is the ink itself, deliberately achromatic. Every saturated
 * colour on this page should belong to the system under inspection, not to the
 * frame around it.
 */
import { oklch } from '../../packages/tokens/oklch.js';
import { ratio } from '../../packages/tokens/contrast.lib.js';

/**
 * Near-achromatic blue-grey.
 *
 * 0.004 rather than the 0.008 first tried, and the reason is a measurement.
 * Keel's own neutral tops out at C 0.010 and its light surfaces land near
 * C 0.0025 — pond.100 is #eff2f0, a grey you have to look for. At 0.008 the
 * chrome ground rendered #edf0f6: visibly lavender, and roughly three times
 * more chromatic than any surface in the system it frames. A frame louder than
 * its contents is the opposite of the stated intent, so the chrome was pulled
 * below the system rather than the intent rewritten to match the code.
 */
const CHROME_HUE = 258;
const CHROME_C = 0.004;

/** Status colours borrow the system's hues so the report reads consistently — but not its tokens. */
const PASS_HUE = 145;
const FAIL_HUE = 30;

const g = (L, C = CHROME_C, H = CHROME_HUE) => oklch(L, C, H).hex;

/**
 * Lightness assignments. The one non-obvious choice: `panel` is 0.985, not
 * pure white, so that a Keel specimen — whose `bg.canvas` IS pure white —
 * reads as brighter than the frame holding it. The thing under inspection
 * should be the brightest thing on the page.
 */
export const CHROME = {
  light: {
    ground: g(0.955),
    panel: g(0.985),
    inset: g(0.925),
    ink: g(0.18, 0.008),
    muted: g(0.5, 0.008),
    line: g(0.9),
    'line-strong': g(0.8, 0.006),
    'line-control': g(0.62, 0.006),
    accent: g(0.18, 0.008),
    'accent-on': g(0.985),
    'accent-soft': g(0.915),
    pass: g(0.45, 0.09, PASS_HUE),
    fail: g(0.45, 0.15, FAIL_HUE),
    shadow: '0 1px 2px rgba(17, 20, 28, .06), 0 8px 24px -12px rgba(17, 20, 28, .18)',
  },
  dark: {
    ground: g(0.155, 0.006),
    panel: g(0.205, 0.006),
    inset: g(0.245, 0.006),
    ink: g(0.93),
    muted: g(0.68, 0.007),
    line: g(0.275, 0.008),
    'line-strong': g(0.38, 0.008),
    'line-control': g(0.52, 0.008),
    accent: g(0.93),
    'accent-on': g(0.155, 0.006),
    'accent-soft': g(0.27, 0.008),
    pass: g(0.74, 0.09, PASS_HUE),
    fail: g(0.72, 0.14, FAIL_HUE),
    shadow: '0 1px 2px rgba(0, 0, 0, .5), 0 8px 24px -12px rgba(0, 0, 0, .7)',
  },
};

/**
 * The chrome's own accessibility gate. Same thresholds the system is held to:
 * 4.5:1 for text, 3:1 for the borders that carry structure.
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
        '\n\nAdjust the lightness values in apps/workbench/chrome.js.',
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

  --wb-display: 'Bodoni Moda', Didot, Cochin, Georgia, serif;
  --wb-sans: 'DM Sans', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif;
  --wb-mono: 'DM Mono', ui-monospace, SFMono-Regular, Menlo, monospace;

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
