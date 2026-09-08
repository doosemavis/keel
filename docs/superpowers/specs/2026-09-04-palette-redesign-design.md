# Design: Color palette redesign

## Context

Part of a larger, deliberately decomposed request that also includes a
Workbench display/layout overhaul (separate spec) and a still-unscoped
"class decorators" API feature (separate spec, blocked on clarification).
This spec covers **only** the color identity — replacing the current
`lotus`/`pond`/`gold`/`leaf`/`russet` OKLCH seed system in
`packages/tokens/seeds.json`.

## Inspiration and naming approach

The visual direction is privately inspired by a devil-fruit reference from
an anime (worked through via the brainstorming visual companion — see
`.superpowers/brainstorm/` mockups from this session). This project is
open source and non-commercial, built specifically to demonstrate software
engineering skill for a job search, which changes the risk calculus from a
commercial product: it's reasonable to state the real inspiration honestly
in design documentation and prose (like this doc), but **shipped code
identifiers, class names, and token names stay standardized and generic**
— no literal references to the source material anywhere in
`packages/tokens`, `packages/react`, or published documentation.
Consequently, after considering a second real-world naming conceit
(pitaya/dragonfruit, matching the lotus system's pattern of naming ramps
after a real botanical reference), the decision was to **skip the naming
story entirely** and use plain, standardized functional names instead.

## The palette: six primitive ramps, five semantic roles

Replacing the five current ramps with six:

| Primitive ramp | Semantic role | Direction |
|---|---|---|
| `accent` | `accent` | Rich magenta-violet purple. The signature/primary color — carries the largest chroma budget, same "boldness in one place" instinct the current `lotus` ramp uses. |
| `success` | `success` | Deep, saturated jewel-tone jade/emerald — deliberately richer than the muted sage-green most systems use for status-success, per explicit direction to be "professional but outgoing... not afraid to be weird." Chosen as the brighter of two tested options (a darker bottle-green alternative was rejected in favor of this one). |
| `warning` | `warning` | Deep amber-gold, chosen for hue separation from both `accent` and `success`. |
| `danger` | `danger` | Deep crimson-red, chosen for hue separation from `accent` and `warning`. |
| `neutral-light` | `neutral` (light theme only) | Purple-tinted near-neutral — very low chroma, hue leaning toward `accent`'s family, so light theme carries a whisper of the brand color even in its backgrounds/borders/muted text. |
| `neutral-dark` | `neutral` (dark theme only) | Green-tinted near-neutral — very low chroma, hue leaning toward `success`'s family, so dark theme leans the opposite direction from light. |

**Architectural change from the current system:** today, one `pond` seed
generates a single ramp, and both light and dark themes pull different
lightness steps from that *same* ramp. This palette cannot work that way
for the neutral role — light needs a purple-hued ramp, dark needs a
green-hued ramp, so `neutral-light` and `neutral-dark` are two genuinely
separate generated ramps, not two ends of one ramp. `accent`, `success`,
`warning`, and `danger` keep the current single-ramp-both-themes approach
unchanged.

This is a deliberate design choice modeled on Radix Colors' "tinted gray"
pattern (each accent color ships a matching neutral scale carrying a subtle
tint of that hue), not an ad hoc idea — confirmed via web research during
the brainstorming session.

**Exact OKLCH hue/chroma values are not finalized in this spec.** The
brainstorming session validated *direction* (hex approximations shown in
mockups, e.g. accent ~#6E2E76, success ~#0E9D63, warning ~#B8760E, danger
~#B8232F, neutral-light bg ~#F5F0F6, neutral-dark bg ~#0F1E19) — converting
these into calibrated OKLCH seeds and running them through `ramps.js` plus
the contrast gate (`packages/tokens/contrast.js`, 56 WCAG pairs) is
implementation work for the eventual plan, the same way the current
`gold` ramp's gamut-mapping tradeoffs were resolved during implementation,
not during naming.

## The swirl motif

A spiral/swirl shape (visually referencing the same private inspiration,
same "no public naming" rule applies) is used **functionally**, not
decoratively, as the empty/blank-state glyph on round UI elements:

- `Avatar` rendered with no identifiable image or initials (a genuinely
  new capability — today `name` is required and initials are always
  derivable, so there is no existing "blank" avatar state to hook this
  into)
- A round, icon-only button/control with no icon or label populated yet
  (there is currently no dedicated round icon-only component in the
  twelve existing components — this may be a new `Button` variant or a
  new component, to be decided during implementation planning)

The motif is never labeled or explained anywhere in the shipped product —
it's a detail for someone who recognizes it, not a callout.

## Out of scope for this spec

- Exact OKLCH seed calibration and contrast-gate verification (implementation)
- The Workbench display/layout overhaul (separate spec, not yet started —
  still waiting on what specifically "narrow and clunky" means)
- The "class decorators" cross-framework API request (separate spec,
  blocked on clarifying what the feature actually needs to do)
- Any Angular-specific work (`@keel/angular` does not exist yet; remains
  Phase 3 per root `CLAUDE.md`)
- The accessibility-compliance workstream and npm packaging hardening
  (both already-agreed separate workstreams from earlier in this session)
