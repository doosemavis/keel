---
'@keel/tokens': minor
---

Re-theme: generated OKLCH ramps, a magenta-rose accent, and a new type pairing.

The old palette was the centre of the distribution — Inter, a saturated primary blue, and a cool blue-grey neutral. Each is defensible alone; together they are what "no decision was made" looks like. For a system whose argument is deliberate choices, that was a real flaw.

**The palette is now five OKLCH seeds** in `seeds.json`, and `ramps.js` generates all 57 primitive values. Re-theming means editing five lines rather than 57 coordinated hex codes. Generating in OKLCH also buys something hand-picking cannot: L is perceptual lightness, so step 600 is the same apparent darkness in every hue by construction — which is what makes a semantic role like `bg.accent` safely swappable between hues. Chroma peaks in the midtones because real pigment does; flat-chroma ramps look like plastic.

Direction: bold, with a touch of femininity and elegance. Bold comes from chroma — the accent runs to 0.235, roughly twice a conventional SaaS primary, and it is a magenta-rose rather than a blue. Elegance comes from the neutral: warm sand-taupe at hue 48 instead of the cool blue-grey it replaces. Warm neutrals read as chosen; cool ones read as inherited.

Type is Bodoni Moda (display), DM Sans (UI), DM Mono (data). DM Sans and DM Mono are a designed pair sharing metrics and skeleton, so a code snippet beside body text reads as one voice at a different pitch. `fonts.css` is now generated from the typography tokens, so the loader can never request a face the tokens do not declare.

The contrast gate rejected the first build: `fg.subtle` aliases `neutral.500`, whose job is "the lightest foreground that still carries AA body text", and at the evenly-spaced lightness it measured 4.17:1. Repointing the alias to `neutral.600` would have collapsed `fg.subtle` into `fg.muted` and lost a level of hierarchy, so the ramp moved instead — recorded in `ramps.js` so nobody tidies it back.
