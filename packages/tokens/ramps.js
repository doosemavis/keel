/**
 * Palette generator — five seeds in, 57 hex values out. The colour maths lives
 * in oklch.js; this file owns the ramp SHAPE and the seed contract.
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
import { oklch } from './oklch.js';

const here = dirname(fileURLToPath(import.meta.url));

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

/** The ramp whose role is `neutral` runs to pure white and pure black at the ends, where hue is meaningless. */
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
  // rejected the build. Repointing the alias to pond.600 would have collapsed
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
const gamut = {};
let count = 0;

for (const [name, spec] of Object.entries(seeds.ramps)) {
  // Selected by declared ROLE, not by name. The generator must not know what
  // the neutral is called — that is a palette decision, and the last two
  // re-themes renamed every ramp. Nor how many there are: the current palette
  // ships two neutrals, one per theme, and this loop never noticed. A seed says
  // what job it does; this file decides what shape that job needs.
  const steps = spec.role === 'neutral' ? NEUTRAL_STEPS : COLOR_STEPS;
  color[name] = {};
  let peak = { step: null, chroma: -1 };
  let clipped = 0;

  for (const { step, L, c } of steps) {
    const requested = spec.maxChroma * c;
    const { hex, delivered } = oklch(L, requested, spec.hue);
    const short = requested > 0 ? 1 - delivered / requested : 0;
    if (short > 0.001) clipped++;
    if (delivered > peak.chroma) peak = { step, chroma: delivered };

    color[name][String(step)] = {
      $value: hex,
      // Delivered coordinate first, because that is what the hex actually is.
      // The request is kept only where it differs, so the gap is legible rather
      // than silently absorbed.
      $description:
        `OKLCH L ${L} C ${delivered.toFixed(4)} H ${spec.hue}` +
        (short > 0.001
          ? ` — gamut-mapped from C ${requested.toFixed(4)} (sRGB holds ${Math.round((1 - short) * 100)}% of the requested chroma at this lightness)`
          : ''),
    };
    count++;
  }

  gamut[name] = { clipped, total: steps.length, peak: peak.step };
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

console.log(
  `@keel/tokens — generated ${count} primitive colors from ${Object.keys(seeds.ramps).length} seeds`,
);

// Printed on every build, not hidden behind a flag. Where sRGB cannot hold the
// requested chroma the ramp's real saturation peak moves off step 600, and the
// only visible symptom is that the ramp "looks wrong" three months later with
// nobody able to say why. gold is the live example: yellow's gamut ceiling
// collapses as lightness drops, so its darks give up ~40% of the request and
// its peak sits at 400. That is sRGB, not a bug — but it should be stated.
for (const [name, spec] of Object.entries(seeds.ramps)) {
  const g = gamut[name];
  const note =
    g.clipped === 0
      ? 'fully in gamut'
      : `${g.clipped}/${g.total} steps gamut-mapped, chroma peaks at ${g.peak}`;
  console.log(
    `  ${name.padEnd(7)} h${String(spec.hue).padStart(3)}  C≤${spec.maxChroma.toFixed(3)}  ${note}`,
  );
}
