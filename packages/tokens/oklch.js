/**
 * OKLCH → sRGB, with gamut mapping. The only colour maths in the repo.
 *
 * Extracted from ramps.js because the workbench generator needs the same
 * conversion to derive its own chrome palette. Two implementations of a colour
 * space transform is how you end up with a docs page whose greys are subtly
 * different from the system's greys, for reasons nobody can find.
 *
 * Build-time only — this file is never bundled into a published package.
 */

/** OKLab → linear sRGB. Björn Ottosson's matrix. */
export function oklabToLinearSrgb(L, a, b) {
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
 * OKLCH → `{ hex, delivered }`, reducing chroma until the colour fits in sRGB.
 *
 * High-chroma requests at extreme lightness are simply not representable on a
 * screen. Clipping the channels would shift the HUE — a too-saturated magenta
 * clips to something visibly redder — so chroma is walked down instead, which
 * preserves the hue and only gives up saturation. This is the approach CSS
 * Color 4 describes for gamut mapping.
 *
 * `delivered` is the chroma that actually survived, and callers are expected to
 * record it rather than the request. A token description claiming a chroma the
 * hex does not have is the same class of error as a hand-written contrast
 * ratio: true when typed, false later, and nothing checks it.
 */
export function oklch(L, C, H) {
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

  return { hex: `#${hex(r)}${hex(g)}${hex(b)}`, delivered: lo };
}

/** Convenience for callers that don't care about the gamut shortfall. */
export const hex = (L, C, H) => oklch(L, C, H).hex;
