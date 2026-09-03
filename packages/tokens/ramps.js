/**
 * Palette generator — five seeds in, 58 hex values out.
 *
 * Replaces the hand-authored primitive ramps. Hand-picking 45 hex values has
 * two problems that only show up later: re-theming means 45 coordinated edits,
 * and the steps drift out of perceptual alignment, so `blue.600` and `red.600`
 * end up different actual lightnesses and a component that swaps one for the
 * other visibly changes weight.
 *
 * Generating in OKLCH fixes both. OKLCH's L is perceptual lightness, so step
 * 600 is the same *apparent* darkness in every hue by construction — which is
 * what makes a semantic role like `bg.accent` safely swappable between hues.
 *
 * The chroma curve peaks in the midtones on purpose. Real pigment behaves this
 * way: a colour is most saturated at mid-lightness and desaturates toward both
 * white and black. A ramp with flat chroma looks like plastic.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));

// ------------------------------------------------------------------ colour maths

/** OKLab → linear sRGB. Björn Ottosson's matrix. */
function oklabToLinearSrgb(L, a, b) {
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;

  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;

  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

/** Linear light → sRGB transfer function. */
const encode = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055);

const inGamut = ([r, g, b]) => {
  const eps = 1e-5;
  return r >= -eps && r <= 1 + eps && g >= -eps && g <= 1 + eps && b >= -eps && b <= 1 + eps;
};

/**
 * OKLCH → hex, reducing chroma until the colour fits in sRGB.
 *
 * High-chroma requests at extreme lightness are simply not representable on a
 * screen. Clipping the channels would shift the HUE — a too-saturated magenta
 * clips to something visibly redder — so chroma is walked down instead, which
 * preserves the hue and only gives up saturation. This is the approach CSS
 * Color 4 describes for gamut mapping.
 */
function oklchToHex(L, C, H) {
  const rad = (H * Math.PI) / 180;

  const at = (chroma) => oklabToLinearSrgb(L, chroma * Math.cos(rad), chroma * Math.sin(rad));

  let lo = 0;
  let hi = C;
  if (!inGamut(at(C))) {
    // 24 iterations resolves chroma far finer than 8-bit output can show.
    for (let i = 0; i < 24; i++) {
      const mid = (lo + hi) / 2;
      if (inGamut(at(mid))) lo = mid;
      else hi = mid;
    }
  } else {
    lo = C;
  }

  const [r, g, b] = at(lo).map((v) => Math.min(1, Math.max(0, encode(v))));
  const hex = (v) =>
    Math.round(v * 255)
      .toString(16)
      .padStart(2, '0');
  return `#${hex(r)}${hex(g)}${hex(b)}`;
}

// ------------------------------------------------------------------ ramp shape

/**
 * Lightness targets, shared by every colour ramp.
 *
 * 600 sits at L 0.50 because that is the darkest step that still reads as the
 * hue rather than as near-black, while being dark enough to carry white text
 * at 4.5:1. It is the load-bearing step: every `bg.*` semantic fill aliases it.
 */
const COLOR_STEPS = [
  { step: 50, L: 0.975, c: 0.16 },
  { step: 100, L: 0.945, c: 0.3 },
  { step: 200, L: 0.895, c: 0.52 },
  { step: 300, L: 0.82, c: 0.76 },
  { step: 400, L: 0.72, c: 0.94 },
  { step: 500, L: 0.61, c: 1.0 },
  { step: 600, L: 0.5, c: 1.0 },
  { step: 700, L: 0.43, c: 0.92 },
  { step: 800, L: 0.36, c: 0.8 },
  { step: 900, L: 0.295, c: 0.66 },
  { step: 950, L: 0.225, c: 0.5 },
];

/** The neutral runs to pure white and pure black at the ends, where hue is meaningless. */
const NEUTRAL_STEPS = [
  { step: 0, L: 1.0, c: 0 },
  { step: 50, L: 0.982, c: 0.25 },
  { step: 100, L: 0.958, c: 0.4 },
  { step: 200, L: 0.918, c: 0.55 },
  { step: 300, L: 0.858, c: 0.75 },
  { step: 400, L: 0.722, c: 1.0 },
  // 0.562, not the 0.588 the even spacing wants. `fg.subtle` aliases this step
  // and its whole job is being "the lightest foreground that still carries AA
  // body text" — at 0.588 it measured 4.17:1 on white and the contrast gate
  // rejected the build. Repointing the alias to 600 would have collapsed
  // fg.subtle into fg.muted and lost a level of type hierarchy, so the ramp
  // moved instead. The accessibility requirement sets the value; the spacing
  // yields to it.
  { step: 500, L: 0.562, c: 1.0 },
  { step: 600, L: 0.492, c: 0.95 },
  { step: 700, L: 0.402, c: 0.85 },
  { step: 800, L: 0.312, c: 0.75 },
  { step: 900, L: 0.236, c: 0.62 },
  { step: 950, L: 0.168, c: 0.5 },
  { step: 1000, L: 0.0, c: 0 },
];

// ------------------------------------------------------------------ emit

const seeds = JSON.parse(await readFile(resolve(here, 'seeds.json'), 'utf8'));

const color = {};
let count = 0;

for (const [name, spec] of Object.entries(seeds.ramps)) {
  const steps = name === 'neutral' ? NEUTRAL_STEPS : COLOR_STEPS;
  color[name] = {};
  for (const { step, L, c } of steps) {
    color[name][String(step)] = {
      $value: oklchToHex(L, spec.maxChroma * c, spec.hue),
      $description: `OKLCH L ${L} C ${(spec.maxChroma * c).toFixed(4)} H ${spec.hue}`,
    };
    count++;
  }
}

const out = {
  $description:
    'GENERATED FILE — do not edit. Produced by packages/tokens/ramps.js from seeds.json. ' +
    'Every value is an OKLCH coordinate resolved to the nearest in-gamut sRGB hex, so step 600 ' +
    'is the same perceptual lightness in every hue. Re-theme by editing seeds.json and rebuilding. ' +
    'Components must never reference these directly — they exist only to be aliased by the ' +
    'semantic roles in src/semantic/.',
  color: { $type: 'color', ...color },
};

await writeFile(
  resolve(here, 'src/primitive/color.json'),
  JSON.stringify(out, null, 2) + '\n',
  'utf8',
);

const hues = Object.entries(seeds.ramps)
  .map(([n, s]) => `${n} h${s.hue}`)
  .join(', ');
console.log(`@keel/tokens — generated ${count} primitive colors from ${Object.keys(seeds.ramps).length} seeds (${hues})`);
