/**
 * Contrast maths and the pair list, as a module.
 *
 * Extracted so exactly one definition of "which pairs must pass, and at what
 * ratio" exists. The CLI gate (contrast.js) and the workbench generator both
 * import from here — if the workbench showed a different set of pairs than CI
 * enforces, the report would be decorative rather than true.
 */
import StyleDictionary from 'style-dictionary';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Anchored to this file, not to process.cwd(). The workbench generator imports
// this module from apps/workbench, where relative globs would silently match
// nothing — and "no tokens found" reads identically to "every pair failed",
// which is a genuinely misleading way to fail.
const pkg = dirname(fileURLToPath(import.meta.url));

export const LIGHT_SOURCES = [
  resolve(pkg, 'src/primitive/*.json'),
  resolve(pkg, 'src/semantic/color.json'),
];
export const DARK_SOURCES = [...LIGHT_SOURCES, resolve(pkg, 'src/semantic/color.dark.json')];

/** Text pairs need 4.5:1 (WCAG AA). Non-text UI boundaries need 3:1 (1.4.11). */
export const PAIRS = [
  { fg: 'color.fg.default', bg: 'color.bg.canvas', min: 4.5, label: 'body text on canvas' },
  { fg: 'color.fg.default', bg: 'color.bg.surface', min: 4.5, label: 'body text on surface' },
  { fg: 'color.fg.default', bg: 'color.bg.subtle', min: 4.5, label: 'body text on subtle' },
  { fg: 'color.fg.muted', bg: 'color.bg.canvas', min: 4.5, label: 'muted text on canvas' },
  { fg: 'color.fg.muted', bg: 'color.bg.surface', min: 4.5, label: 'muted text on surface' },
  { fg: 'color.fg.subtle', bg: 'color.bg.canvas', min: 4.5, label: 'subtle text on canvas' },
  { fg: 'color.fg.subtle', bg: 'color.bg.surface', min: 4.5, label: 'subtle text on surface' },
  { fg: 'color.fg.accent', bg: 'color.bg.canvas', min: 4.5, label: 'link text on canvas' },
  { fg: 'color.fg.accent', bg: 'color.bg.accentSubtle', min: 4.5, label: 'link text on accent subtle' },
  { fg: 'color.fg.success', bg: 'color.bg.successSubtle', min: 4.5, label: 'success text on its subtle fill' },
  { fg: 'color.fg.warning', bg: 'color.bg.warningSubtle', min: 4.5, label: 'warning text on its subtle fill' },
  { fg: 'color.fg.danger', bg: 'color.bg.dangerSubtle', min: 4.5, label: 'danger text on its subtle fill' },
  { fg: 'color.fg.onAccent', bg: 'color.bg.accent', min: 4.5, label: 'label on accent fill' },
  { fg: 'color.fg.onAccent', bg: 'color.bg.accentHover', min: 4.5, label: 'label on accent hover' },
  { fg: 'color.fg.onAccent', bg: 'color.bg.accentActive', min: 4.5, label: 'label on accent active' },
  { fg: 'color.fg.onDanger', bg: 'color.bg.danger', min: 4.5, label: 'label on danger fill' },
  { fg: 'color.fg.onDanger', bg: 'color.bg.dangerHover', min: 4.5, label: 'label on danger hover' },
  { fg: 'color.fg.onInverse', bg: 'color.bg.inverse', min: 4.5, label: 'label on inverse surface' },
  { fg: 'color.fg.default', bg: 'color.bg.muted', min: 4.5, label: 'label on the neutral control fill' },

  { fg: 'color.border.control', bg: 'color.bg.canvas', min: 3, label: 'control border on canvas' },
  { fg: 'color.border.control', bg: 'color.bg.surface', min: 3, label: 'control border on surface' },
  { fg: 'color.border.control', bg: 'color.bg.subtle', min: 3, label: 'control border on subtle' },
  { fg: 'color.border.accent', bg: 'color.bg.canvas', min: 3, label: 'accent border on canvas' },
  { fg: 'color.border.danger', bg: 'color.bg.canvas', min: 3, label: 'danger border on canvas' },
  { fg: 'color.focus.ring', bg: 'color.bg.canvas', min: 3, label: 'focus ring on canvas' },
  { fg: 'color.focus.ring', bg: 'color.bg.surface', min: 3, label: 'focus ring on surface' },
  { fg: 'color.bg.accent', bg: 'color.bg.canvas', min: 3, label: 'accent fill against canvas' },
  { fg: 'color.bg.danger', bg: 'color.bg.canvas', min: 3, label: 'danger fill against canvas' },

  // Reported but not enforced. WCAG 1.4.3 exempts disabled controls, and
  // lifting disabled text to AA makes it read as enabled. Decorative dividers
  // are not the sole indicator of any control boundary — border.control is.
  { fg: 'color.fg.disabled', bg: 'color.bg.disabled', min: 4.5, label: 'disabled text', exempt: true },
  { fg: 'color.border.default', bg: 'color.bg.canvas', min: 3, label: 'container edge (decorative)', exempt: true },
  { fg: 'color.border.muted', bg: 'color.bg.canvas', min: 3, label: 'quiet divider (decorative)', exempt: true },
];

const hexToRgb = (h) => {
  const s = h.replace('#', '');
  const n = s.length === 3 ? s.split('').map((c) => c + c).join('') : s;
  return [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16));
};

/** WCAG 2.x relative luminance. */
export const luminance = (hex) => {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

export const ratio = (a, b) => {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
};

/** Resolve every token to a concrete value for one theme. */
export async function resolveTheme(sources) {
  const sd = new StyleDictionary({
    source: sources,
    log: { verbosity: 'silent', warnings: 'disabled' },
    platforms: { noop: { transforms: ['attribute/cti', 'name/kebab', 'color/hex'], files: [] } },
  });
  const dict = await sd.getPlatformTokens('noop');
  return Object.fromEntries(dict.allTokens.map((t) => [t.path.join('.'), t.value ?? t.$value]));
}

/**
 * Evaluate every pair in both themes.
 * @returns {Promise<{rows: Array, failures: number, resolved: Record<string, Record<string,string>>}>}
 */
export async function report() {
  const rows = [];
  const resolved = {};
  let failures = 0;

  for (const [theme, sources] of [
    ['light', LIGHT_SOURCES],
    ['dark', DARK_SOURCES],
  ]) {
    const map = await resolveTheme(sources);
    resolved[theme] = map;

    for (const p of PAIRS) {
      const fg = map[p.fg];
      const bg = map[p.bg];
      if (!fg || !bg) {
        rows.push({ theme, ...p, ratio: null, status: 'missing' });
        failures++;
        continue;
      }
      const r = ratio(fg, bg);
      const pass = r >= p.min;
      if (!pass && !p.exempt) failures++;
      rows.push({
        theme,
        label: p.label,
        fg: p.fg,
        bg: p.bg,
        fgHex: fg,
        bgHex: bg,
        min: p.min,
        exempt: Boolean(p.exempt),
        ratio: Number(r.toFixed(2)),
        status: p.exempt ? (pass ? 'exempt-pass' : 'exempt-below') : pass ? 'pass' : 'fail',
      });
    }
  }

  return { rows, failures, resolved };
}
