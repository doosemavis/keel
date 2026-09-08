# Color Palette Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the `pond`/`lotus`/`gold`/`leaf`/`russet` OKLCH seed palette
with six standardized ramps (`accent`, `success`, `warning`, `danger`,
`neutral-light`, `neutral-dark`), verified against the WCAG contrast gate,
plus a swirl motif used as the blank-state glyph on `Avatar` and a new
round `Button` shape.

**Architecture:** `packages/tokens/ramps.js` already selects ramp shape by
declared `role` (`role: "neutral"` → the 0–1000 `NEUTRAL_STEPS` curve;
everything else → the 50–950 `COLOR_STEPS` curve), not by ramp name — so
adding two ramps that both declare `role: "neutral"` requires zero changes
to `ramps.js` itself. Only `seeds.json` (the six ramps) and
`src/semantic/color.json` / `color.dark.json` (which primitive ramp each
semantic role points at, per theme) need to change.

**Tech Stack:** `packages/tokens` (Node scripts, DTCG JSON, Style
Dictionary), `packages/react` (React 19, TypeScript).

## Global Constraints

- No code identifiers may reference the private visual inspiration by name
  — ramp names are `accent`/`success`/`warning`/`danger`/`neutral-light`/
  `neutral-dark` only (per `docs/superpowers/specs/2026-09-04-palette-redesign-design.md`).
- The swirl motif is functional (empty/blank-state glyph), never labeled or
  explained in shipped code/docs.
- `accent` (hue 312) and `danger` (hue 20) must stay well-separated in hue
  (currently 92° apart) since both can appear as bold same-treatment fills.
- All existing contrast obligations in `packages/tokens/contrast.js` (56
  WCAG pairs) must still pass after the rename.
- Calibrated starting OKLCH values (verified against `packages/tokens/oklch.js`
  this session): `accent` hue 312 / maxChroma 0.185, `success` hue 155 /
  maxChroma 0.15, `warning` hue 50 / maxChroma 0.14, `danger` hue 20 /
  maxChroma 0.18, `neutral-light` hue 310 / maxChroma 0.02 (role: neutral),
  `neutral-dark` hue 155 / maxChroma 0.02 (role: neutral). These are
  starting points, not guaranteed-final — Task 3 verifies them against the
  real contrast gate and this plan documents how to adjust if any pair
  fails, the same way the existing `gold` ramp's gamut tradeoffs were
  discovered by running the generator rather than precalculated.

---

### Task 1: Rewrite `seeds.json` with the six calibrated ramps

**Files:**
- Modify: `packages/tokens/seeds.json` (full rewrite)
- Generated (do not hand-edit): `packages/tokens/src/primitive/color.json`

**Interfaces:**
- Produces: six primitive ramp names (`neutral-light`, `neutral-dark`,
  `accent`, `success`, `warning`, `danger`) that Task 2 references by name.

- [x] **Step 1: Replace the file**

Replace the full contents of `packages/tokens/seeds.json` with:

```json
{
  "$comment": "The entire palette, as six seeds. Everything in src/primitive/color.json is GENERATED from this file by ramps.js — do not edit the ramps by hand. Re-theming Keel means editing the numbers below.",

  "$direction": "Bold and outgoing rather than corporate-safe. success is deliberately a saturated jewel-tone rather than the muted status-green most systems ship, and the neutral is not one shared ramp: light theme tints toward accent's own hue family, dark theme tints toward success's, so each theme carries a quiet echo of the brand rather than a theme-neutral grey.",

  "hueNote": "OKLCH hue, in degrees. accent (312) and danger (20) sit 92 degrees apart (the short way around), which keeps them separable when both appear as bold same-treatment fills — the same requirement the previous palette's lotus/russet pair had to satisfy. warning (50) and danger (20) sit closer together (30 degrees) by convention: amber-caution and red-danger are adjacent warm hues in most design systems, differentiated by context and icon as much as by hue alone.",

  "ramps": {
    "neutral-light": {
      "hue": 310,
      "maxChroma": 0.02,
      "role": "neutral",
      "$comment": "Light theme's neutral. Twice the previous pond ramp's 0.01 chroma budget, still very low — enough that backgrounds, borders and muted text carry a deliberate whisper of accent's own hue family rather than reading as flat grey."
    },
    "neutral-dark": {
      "hue": 155,
      "maxChroma": 0.02,
      "role": "neutral",
      "$comment": "Dark theme's neutral. Tinted toward success's hue family instead of accent's, so light and dark each lean toward a different one of the palette's two signature colours rather than sharing one neutral ramp at different lightness steps."
    },
    "accent": {
      "hue": 312,
      "maxChroma": 0.185,
      "$comment": "The primary signature colour — a deep magenta-violet. Carries the largest chroma budget in the palette, the same 'boldness in one place' instinct the previous lotus ramp used."
    },
    "success": {
      "hue": 155,
      "maxChroma": 0.15,
      "$comment": "A saturated jewel-tone jade rather than the muted sage-green most systems use for status-success — chosen to read as professional but outgoing rather than corporate-safe."
    },
    "warning": {
      "hue": 50,
      "maxChroma": 0.14,
      "$comment": "Deep amber-gold, chosen for hue separation from both accent and success."
    },
    "danger": {
      "hue": 20,
      "maxChroma": 0.18,
      "$comment": "Deep crimson-red, chosen for hue separation from accent."
    }
  }
}
```

- [x] **Step 2: Regenerate the primitive ramps**

Run:
```bash
cd packages/tokens && node ramps.js
```
Expected output: `@keel/tokens — generated 70 primitive colors from 6 seeds`
(`NEUTRAL_STEPS` has 13 entries × 2 neutral ramps = 26, `COLOR_STEPS` has
11 entries × 4 color ramps = 44; 26 + 44 = 70 — if the count differs,
re-check `NEUTRAL_STEPS`/`COLOR_STEPS` lengths in `ramps.js` before
proceeding), followed by one gamut line per ramp (e.g.
`accent   h312  C≤0.185  ...`). No ramp should report more than ~30%
gamut-mapped steps; if one does, note it — this mirrors how the existing
`gold` ramp's gamut shortfall was discovered and is not itself a failure.

- [x] **Step 3: Verify the generated file has the right keys**

Run:
```bash
node -e "const c = require('./src/primitive/color.json'); console.log(Object.keys(c.color))"
```
Expected: `[ 'neutral-light', 'neutral-dark', 'accent', 'success', 'warning', 'danger' ]`

- [x] **Step 4: Commit**

```bash
cd /Users/moosedavis/dev/keel
git add packages/tokens/seeds.json packages/tokens/src/primitive/color.json
git commit -m "feat(tokens): replace lotus palette with six standardized ramps"
```

---

### Task 2: Repoint semantic color roles at the new ramp names

**Files:**
- Modify: `packages/tokens/src/semantic/color.json` (full rewrite)
- Modify: `packages/tokens/src/semantic/color.dark.json` (full rewrite)

**Interfaces:**
- Consumes: the six ramp names from Task 1.
- Produces: the same semantic role names as before (`bg.canvas`,
  `bg.accent`, `fg.default`, `border.control`, etc.) — no semantic role is
  renamed, only which primitive ramp each resolves to changes. Components
  in `packages/react` reference these role names and require no changes.

- [x] **Step 1: Replace `color.json` (light theme)**

Replace the full contents of `packages/tokens/src/semantic/color.json`
with (mechanical rename: `pond`→`neutral-light`, `lotus`→`accent`,
`gold`→`warning`, `leaf`→`success`, `russet`→`danger`; step numbers
unchanged):

```json
{
  "$description": "Semantic color roles for the LIGHT theme. This is the base theme — the dark theme is expressed as a diff against it in color.dark.json, so a role that reads the same in both is defined exactly once, here. Components reference only these roles, never the primitive ramps. Measured contrast ratios are not repeated in these descriptions on purpose: `npm run contrast` generates the authoritative report, and a number written by hand here would eventually be a lie.",
  "color": {
    "$type": "color",
    "bg": {
      "canvas":  { "$value": "{color.neutral-light.0}",   "$description": "The page behind everything." },
      "surface": { "$value": "{color.neutral-light.0}",   "$description": "Raised surfaces: cards, dialogs, menus." },
      "subtle":  { "$value": "{color.neutral-light.50}",  "$description": "Quietly separated regions: table stripes, well backgrounds." },
      "muted":   { "$value": "{color.neutral-light.100}", "$description": "Neutral control fill at rest." },
      "mutedHover":  { "$value": "{color.neutral-light.200}" },
      "mutedActive": { "$value": "{color.neutral-light.300}" },
      "inverse": { "$value": "{color.neutral-light.900}", "$description": "Inverted surfaces: tooltips, toasts." },
      "accent":       { "$value": "{color.accent.600}" },
      "accentHover":  { "$value": "{color.accent.700}" },
      "accentActive": { "$value": "{color.accent.800}" },
      "accentSubtle": { "$value": "{color.accent.50}" },
      "successSubtle": { "$value": "{color.success.50}" },
      "warningSubtle": { "$value": "{color.warning.50}" },
      "dangerSubtle":  { "$value": "{color.danger.50}" },
      "danger":        { "$value": "{color.danger.600}" },
      "dangerHover":   { "$value": "{color.danger.700}" },
      "dangerActive":  { "$value": "{color.danger.900}" },
      "disabled":      { "$value": "{color.neutral-light.100}" }
    },
    "fg": {
      "default":  { "$value": "{color.neutral-light.900}", "$description": "Body text." },
      "muted":    { "$value": "{color.neutral-light.600}", "$description": "Secondary text and help text. Carries AA body text." },
      "subtle":   { "$value": "{color.neutral-light.500}", "$description": "Placeholder and de-emphasised metadata. The lightest foreground that still carries AA body text — anything lighter must not hold meaning." },
      "onAccent": { "$value": "{color.neutral-light.0}",   "$description": "Text on an accent fill. Flips to a dark value in the dark theme, where the accent fill itself is light." },
      "onDanger": { "$value": "{color.neutral-light.0}",   "$description": "Text on a danger fill. Split from onAccent because the two fills move in opposite directions between themes and one token cannot satisfy both." },
      "onInverse":{ "$value": "{color.neutral-light.0}" },
      "accent":   { "$value": "{color.accent.700}",    "$description": "Links and accent text on light surfaces." },
      "success":  { "$value": "{color.success.700}" },
      "warning":  { "$value": "{color.warning.700}" },
      "danger":   { "$value": "{color.danger.700}" },
      "disabled": { "$value": "{color.neutral-light.400}", "$description": "Disabled text. Deliberately below AA — WCAG 1.4.3 exempts disabled controls, and lifting this reads as enabled." }
    },
    "border": {
      "default": { "$value": "{color.neutral-light.300}", "$description": "Container edges and dividers. DECORATIVE ONLY — below 3:1 by design, so it must never be the sole indicator of an interactive boundary. Use border.control for that." },
      "muted":   { "$value": "{color.neutral-light.200}", "$description": "The quietest divider. Decorative only." },
      "control": { "$value": "{color.neutral-light.500}", "$description": "The boundary of an interactive control — input, select, checkbox. Enforced at 3:1 against every surface it sits on, per WCAG 1.4.11 non-text contrast." },
      "strong":  { "$value": "{color.neutral-light.600}" },
      "accent":  { "$value": "{color.accent.600}" },
      "danger":  { "$value": "{color.danger.600}" },
      "disabled":{ "$value": "{color.neutral-light.200}" }
    },
    "focus": {
      "ring":   { "$value": "{color.accent.500}", "$description": "Focus indicator. Enforced at 3:1 against every surface it can appear on." },
      "onDark": { "$value": "{color.accent.300}" }
    }
  }
}
```

- [x] **Step 2: Replace `color.dark.json` (dark theme overrides)**

Replace the full contents of `packages/tokens/src/semantic/color.dark.json`
with (same mechanical rename, `pond`→`neutral-dark` for this file
specifically, since dark theme uses the green-tinted neutral ramp):

```json
{
  "$description": "DARK theme overrides. Carries only the roles whose value differs from the light theme — merged over semantic/color.json at build time, so adding a role means touching one file, not two. Note the inversion in the fills: accent and danger get LIGHTER here while their text goes dark, which is why fg.onAccent and fg.onDanger are separate roles.",
  "color": {
    "$type": "color",
    "bg": {
      "canvas":  { "$value": "{color.neutral-dark.950}" },
      "surface": { "$value": "{color.neutral-dark.900}" },
      "subtle":  { "$value": "{color.neutral-dark.900}" },
      "muted":   { "$value": "{color.neutral-dark.800}" },
      "mutedHover":  { "$value": "{color.neutral-dark.700}" },
      "mutedActive": { "$value": "{color.neutral-dark.600}" },
      "inverse": { "$value": "{color.neutral-dark.100}" },
      "accent":       { "$value": "{color.accent.400}", "$description": "Lighter than light-theme accent so dark text on it clears AA." },
      "accentHover":  { "$value": "{color.accent.300}" },
      "accentActive": { "$value": "{color.accent.200}" },
      "accentSubtle": { "$value": "{color.accent.950}" },
      "successSubtle": { "$value": "{color.success.900}" },
      "warningSubtle": { "$value": "{color.warning.900}" },
      "dangerSubtle":  { "$value": "{color.danger.900}" },
      "danger":       { "$value": "{color.danger.300}", "$description": "Follows the same inversion as accent — light fill, dark label — so destructive actions stay consistent with the rest of the system in dark mode." },
      "dangerHover":  { "$value": "{color.danger.100}" },
      "dangerActive": { "$value": "{color.danger.50}" },
      "disabled":     { "$value": "{color.neutral-dark.800}" }
    },
    "fg": {
      "default":  { "$value": "{color.neutral-dark.50}" },
      "muted":    { "$value": "{color.neutral-dark.300}" },
      "subtle":   { "$value": "{color.neutral-dark.400}", "$description": "neutral-dark.500 is tuned for AA on the light-theme canvas equivalent and is too dark to carry text here, so the dark theme steps one rung lighter." },
      "onAccent": { "$value": "{color.neutral-dark.950}" },
      "onDanger": { "$value": "{color.neutral-dark.950}" },
      "onInverse":{ "$value": "{color.neutral-dark.950}" },
      "accent":   { "$value": "{color.accent.300}" },
      "success":  { "$value": "{color.success.300}" },
      "warning":  { "$value": "{color.warning.300}" },
      "danger":   { "$value": "{color.danger.300}" },
      "disabled": { "$value": "{color.neutral-dark.600}" }
    },
    "border": {
      "default": { "$value": "{color.neutral-dark.700}" },
      "muted":   { "$value": "{color.neutral-dark.800}" },
      "control": { "$value": "{color.neutral-dark.500}" },
      "strong":  { "$value": "{color.neutral-dark.400}" },
      "accent":  { "$value": "{color.accent.400}" },
      "danger":  { "$value": "{color.danger.300}" },
      "disabled":{ "$value": "{color.neutral-dark.800}" }
    },
    "focus": {
      "ring": { "$value": "{color.accent.300}" }
    }
  }
}
```

- [x] **Step 3: Commit**

```bash
git add packages/tokens/src/semantic/color.json packages/tokens/src/semantic/color.dark.json
git commit -m "feat(tokens): repoint semantic color roles at the new ramp names"
```

---

### Task 3: Run the full token build and contrast gate; fix any failures

**Files:**
- Modify (only if failures found): `packages/tokens/seeds.json`
  (`maxChroma` adjustments only — never touch `NEUTRAL_STEPS`/`COLOR_STEPS`
  lightness curves in `ramps.js`, which are shared infrastructure, not
  palette-specific)

**Interfaces:**
- Consumes: Tasks 1–2's output.
- Produces: a passing `npm run build --workspace @keel/tokens`.

- [x] **Step 1: Run the token build**

```bash
cd /Users/moosedavis/dev/keel
npm run build --workspace @keel/tokens
```

- [x] **Step 2: Read the contrast report**

The build runs `contrast.js` as part of `build`. If it exits non-zero, it
prints the failing pair(s) with their measured ratio and required minimum.
For each failure:
- If a **text-on-fill** pair fails (e.g. `fg.onAccent` on `bg.accent`):
  lower `maxChroma` on the relevant ramp in `seeds.json` by ~0.01–0.02
  (chroma reduction moves the delivered lightness closer to the request,
  which is usually what a marginal failure needs) and re-run Step 1.
- If a **border/control** pair fails (3:1 requirement): the same
  chroma-reduction approach applies to whichever ramp backs that role.
- Do not edit `NEUTRAL_STEPS` or `COLOR_STEPS` in `ramps.js` — those
  lightness curves are shared across every ramp in the system; changing
  them to fix one palette's failure would silently move every other ramp's
  steps too.

- [x] **Step 3: Confirm all 56 pairs pass**

Expected final output includes a line confirming all pairs pass (matching
the format already used for the previous lotus palette's 56/56 result).

- [x] **Step 4: Rebuild the full workspace**

```bash
npm run build
```

Expected: `@keel/tokens`, `@keel/specs`, `@keel/react`, and
`@keel/workbench` all build successfully — this also rebuilds Workbench's
own chrome (`apps/workbench/chrome.js`), which derives from the same
generated ramps and must independently pass its own 28-pair gate.

- [x] **Step 5: Commit any seed adjustments from Step 2**

```bash
git add packages/tokens/seeds.json packages/tokens/src/primitive/color.json
git commit -m "fix(tokens): calibrate chroma to clear the contrast gate"
```

(Skip this step if Step 2 required no changes.)

---

### Task 4: Update README references to the old palette story

**Files:**
- Modify: `README.md:92-161` (the "Design tokens" section, which currently
  tells the lotus/*Nelumbo nucifera* story in detail)

**Interfaces:**
- Consumes: nothing new.
- Produces: no code interface — documentation only.

- [x] **Step 1: Replace the palette narrative**

Read the current `README.md` "Design tokens" section (`### The palette is
five numbers` through the end of `#### Why generate rather than hand-pick`,
roughly lines 92–161). Rewrite it to describe the new six-ramp system:
drop the *Nelumbo nucifera* botanical story entirely (per the design
spec's "skip the naming story" decision), keep the technical explanation
of *why* OKLCH generation exists (the "Why generate rather than hand-pick"
subsection's reasoning about perceptual lightness and gamut mapping is
still entirely accurate and should be kept, just without the flower
framing) and update the seed table to the new six ramps with their hue/
chroma/role values from Task 1.

- [x] **Step 2: Update the gamut report example**

The README shows an example gamut report output block
(`README.md:122-128`). Replace it with the actual output captured from
running `node ramps.js` in Task 1, Step 2.

- [x] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: update README palette section for the new color system"
```

---

### Task 5: Create the swirl motif asset

**Files:**
- Create: `packages/react/src/swirl.tsx`

**Interfaces:**
- Produces: `SwirlGlyph`, a React component accepting no required props,
  rendering an `aria-hidden="true"` decorative SVG spiral. Used by Task 6
  (`Avatar`) and Task 7 (`Button`).

- [x] **Step 1: Write the component**

Create `packages/react/src/swirl.tsx`:

```tsx
/**
 * A decorative spiral, used as the blank-state glyph on round elements that
 * have nothing else to show (an Avatar with no identity, a round Button with
 * no icon yet). Not exported from the package's public entry point — it's an
 * internal shared asset for those two components' empty states, not a public
 * component in its own right.
 */
export function SwirlGlyph({ className }: { className?: string }) {
  return (
    <svg
      className={['keel-Swirl', className].filter(Boolean).join(' ')}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M16 16c0-3.5-2.5-6-6-6s-6 2.5-6 6 2.5 6 6 6c5 0 9-4 9-9s-4-9-9-9-9 4-9 9 4 9 9 9 9-4 9-9-4-9-9-9"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}
```

- [x] **Step 2: Verify it compiles**

```bash
cd packages/react && npx tsc --noEmit -p tsconfig.json
```
Expected: no errors.

- [x] **Step 3: Commit**

```bash
git add packages/react/src/swirl.tsx
git commit -m "feat(react): add the swirl blank-state glyph"
```

---

### Task 6: Give `Avatar` a true blank state

**Files:**
- Modify: `packages/react/src/Avatar/Avatar.tsx`
- Modify: `packages/specs/src/avatar.ts`
- Modify: `packages/react/src/Avatar/avatar.css` (add the blank-state rule)

**Interfaces:**
- Consumes: `SwirlGlyph` from Task 5.
- Produces: `AvatarProps.name` becomes optional; when absent (and no
  `src`), `Avatar` renders `SwirlGlyph` instead of initials.

- [x] **Step 1: Write the failing test**

Create `packages/react/src/Avatar/Avatar.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Avatar } from './Avatar.js';

describe('Avatar', () => {
  it('renders initials when a name is given', () => {
    render(<Avatar name="Moose Davis" />);
    expect(screen.getByText('MD')).toBeInTheDocument();
  });

  it('renders the blank-state glyph when no name or image is given', () => {
    const { container } = render(<Avatar unknownLabel="Unknown user" />);
    expect(container.querySelector('.keel-Swirl')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Unknown user' })).toBeInTheDocument();
  });
});
```

- [x] **Step 2: Run it to verify it fails**

```bash
cd packages/react && npx vitest run src/Avatar/Avatar.test.tsx
```
Expected: FAIL — `name` is currently required, so
`<Avatar unknownLabel="Unknown user" />` is a TypeScript error, and
`.keel-Swirl` doesn't exist yet.

- [x] **Step 3: Update the spec**

In `packages/specs/src/avatar.ts`, find the `name` slot definition and
change its `required` field. Read the current file first to get the exact
surrounding structure, then set the `name` slot's `required: false` and
update its `description` to state that omitting it renders the blank-state
glyph.

- [x] **Step 4: Update `Avatar.tsx`**

Modify `packages/react/src/Avatar/Avatar.tsx`:

Change the props interface (around `name: string;`) to:
```tsx
  /** The full name. Used as the accessible name and to derive initials. Omit to render an anonymous/unknown placeholder. */
  name?: string;
  /** Accessible label used when no name is given. @default 'Unknown user' */
  unknownLabel?: string;
```

Change the destructured params (around `name,`) to include the new prop
with a default:
```tsx
    name,
    unknownLabel = 'Unknown user',
```

Change the render logic. Currently:
```tsx
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(src) && !failed;

  return (
    <span
      {...rest}
      ref={ref}
      className={['keel-Avatar', className].filter(Boolean).join(' ')}
      data-size={size}
      data-shape={shape}
      {...(decorative
        ? { 'aria-hidden': true as const }
        : { role: 'img', 'aria-label': showStatus ? `${name} — ${statusLabel}` : name })}
    >
      {showImage ? (
        <img
          className="keel-Avatar-image"
          src={src}
          alt=""
          onError={() => setFailed(true)}
        />
      ) : (
        <span aria-hidden="true">{initialsFrom(name)}</span>
      )}
      {showStatus ? <span className="keel-Avatar-status" aria-hidden="true" /> : null}
    </span>
  );
```

Replace with:
```tsx
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(src) && !failed;
  const accessibleName = name ?? unknownLabel;

  return (
    <span
      {...rest}
      ref={ref}
      className={['keel-Avatar', className].filter(Boolean).join(' ')}
      data-size={size}
      data-shape={shape}
      {...(decorative
        ? { 'aria-hidden': true as const }
        : { role: 'img', 'aria-label': showStatus ? `${accessibleName} — ${statusLabel}` : accessibleName })}
    >
      {showImage ? (
        <img
          className="keel-Avatar-image"
          src={src}
          alt=""
          onError={() => setFailed(true)}
        />
      ) : name ? (
        <span aria-hidden="true">{initialsFrom(name)}</span>
      ) : (
        <SwirlGlyph />
      )}
      {showStatus ? <span className="keel-Avatar-status" aria-hidden="true" /> : null}
    </span>
  );
```

Add the import at the top of the file:
```tsx
import { SwirlGlyph } from '../swirl.js';
```

- [x] **Step 5: Add the CSS rule**

In `packages/react/src/Avatar/avatar.css`, add (referencing the semantic
`fg.subtle` role for the glyph color, per the token-discipline rule — no
raw color):
```css
.keel-Avatar .keel-Swirl {
  inline-size: 60%;
  block-size: 60%;
  color: var(--keel-color-fg-subtle);
}
```

- [x] **Step 6: Run the test to verify it passes**

```bash
npx vitest run src/Avatar/Avatar.test.tsx
```
Expected: PASS, 2 tests.

- [x] **Step 7: Run the full spec-conformance suite**

```bash
npx vitest run src/spec-conformance.test.tsx
```
Expected: PASS — this confirms the `avatar.ts` spec change (Step 3) didn't
break the generated story matrix.

- [x] **Step 8: Commit**

```bash
cd /Users/moosedavis/dev/keel
git add packages/react/src/Avatar/ packages/specs/src/avatar.ts
git commit -m "feat(react): Avatar renders the swirl glyph when no name or image is given"
```

---

### Task 7: Add a round, icon-only `Button` shape

**Files:**
- Modify: `packages/react/src/Button/Button.tsx`
- Modify: `packages/react/src/Button/button.css`
- Modify: `packages/specs/src/button.ts`

**Interfaces:**
- Consumes: `SwirlGlyph` from Task 5.
- Produces: `ButtonProps.shape?: 'default' | 'round'`. When `'round'` and
  no `iconStart` is given, renders `SwirlGlyph` in its place. The visible
  label is hidden via CSS (not removed from the DOM), so the existing
  `children`-as-accessible-name contract is unchanged — no new prop is
  needed for the accessible name.

- [x] **Step 1: Write the failing test**

Read `packages/react/src/Button/Button.test.tsx` first to match its exact
import/setup style, then add:

```tsx
it('renders the swirl glyph on a round button with no icon', () => {
  const { container } = render(<Button shape="round">Delete</Button>);
  expect(container.querySelector('.keel-Swirl')).toBeInTheDocument();
});

it('does not render the swirl glyph when a round button has an icon', () => {
  const { container } = render(
    <Button shape="round" iconStart={<span>icon</span>}>
      Delete
    </Button>,
  );
  expect(container.querySelector('.keel-Swirl')).not.toBeInTheDocument();
});
```

- [x] **Step 2: Run it to verify it fails**

```bash
cd packages/react && npx vitest run src/Button/Button.test.tsx
```
Expected: FAIL — `shape` is not a recognized prop yet.

- [x] **Step 3: Update the spec**

In `packages/specs/src/button.ts`, add a new prop to the `props` object
(alongside `variant` and `size`):
```ts
    shape: {
      values: ['default', 'round'],
      defaultValue: 'default',
      description:
        'Round is for a single icon with no visible label — the label still supplies the accessible name, hidden visually rather than removed from the DOM.',
    },
```

- [x] **Step 4: Update `Button.tsx`**

Add the type export near the other type exports:
```tsx
export type ButtonShape = Spec['props']['shape']['values'][number];
```

Add to `ButtonProps` (near `size?: ButtonSize;`):
```tsx
  /**
   * `round` is for a single icon with no visible label. The label you pass
   * as `children` still supplies the accessible name — it's hidden
   * visually, not removed from the DOM.
   * @default 'default'
   */
  shape?: ButtonShape;
```

Add to the destructured params (near `size = 'md',`):
```tsx
    shape = 'default',
```

Add `data-shape={shape}` alongside the existing `data-variant`/`data-size`
attributes on `<AriaButton>`.

Change the icon-rendering block. Currently:
```tsx
      {iconStart ? (
        <span className="keel-Button-icon" aria-hidden="true">
          {iconStart}
        </span>
      ) : null}
```

Replace with:
```tsx
      {iconStart ? (
        <span className="keel-Button-icon" aria-hidden="true">
          {iconStart}
        </span>
      ) : shape === 'round' ? (
        <span className="keel-Button-icon" aria-hidden="true">
          <SwirlGlyph />
        </span>
      ) : null}
```

Add the import at the top of the file:
```tsx
import { SwirlGlyph } from '../swirl.js';
```

- [x] **Step 5: Add the CSS**

In `packages/react/src/Button/button.css`, add:
```css
.keel-Button[data-shape='round'] {
  border-radius: 999px;
  padding-inline: 0;
  aspect-ratio: 1;
}

.keel-Button[data-shape='round'] .keel-Button-label {
  position: absolute;
  inline-size: 1px;
  block-size: 1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
}
```

(The clip-based hiding pattern keeps the label in the accessibility tree
while removing it visually — the standard "visually hidden" technique,
not `display: none`, which would remove it from the accessible name
computation entirely.)

- [x] **Step 6: Run the tests to verify they pass**

```bash
npx vitest run src/Button/Button.test.tsx
```
Expected: PASS, all tests including the two new ones.

- [x] **Step 7: Run the full spec-conformance suite**

```bash
npx vitest run src/spec-conformance.test.tsx
```
Expected: PASS — confirms the new `shape` prop's story-matrix generation
works.

- [x] **Step 8: Commit**

```bash
cd /Users/moosedavis/dev/keel
git add packages/react/src/Button/ packages/specs/src/button.ts
git commit -m "feat(react): add round icon-only Button shape with swirl blank state"
```

---

### Task 8: Full workspace verification

**Files:** none modified — verification only.

**Interfaces:** none — this task validates Tasks 1–7 together.

- [x] **Step 1: Full build**

```bash
cd /Users/moosedavis/dev/keel
npm run build
```
Expected: all five workspace packages build successfully, including the
Workbench rebuild (which picks up the new palette automatically since it
inlines `packages/react/dist/styles.css` verbatim).

- [x] **Step 2: Full test suite**

```bash
npm test
```
Expected: all tests pass (the 4 pre-existing `it.fails` markers for the
known `aria-disabled` defect are unrelated to this plan and still fail as
expected — do not treat them as a regression).

- [x] **Step 3: Typecheck**

```bash
npm run typecheck
```
Expected: no errors.

- [x] **Step 4: Packaging lint**

```bash
npm run lint:packaging
```
Expected: passes — confirms the new `swirl.tsx` internal module doesn't
leak into the public type surface incorrectly (it's imported by `Avatar`
and `Button` but not re-exported from `index.ts`).

- [x] **Step 5: Manual visual check**

```bash
open apps/workbench/dist/index.html
```
Confirm visually: the new palette renders (magenta-violet accent buttons,
jade success states, amber warnings, crimson danger), light theme has a
faint purple tint in its neutral backgrounds/borders, dark theme has a
faint green tint, and a blank `<Avatar unknownLabel="Unknown" />` (add one
temporarily to a Workbench preview if none exists, or verify via the test
suite's coverage instead) shows the spiral glyph.

- [x] **Step 6: Final commit if any fixes were needed**

```bash
git add -A
git commit -m "chore: final verification pass for palette redesign"
```

(Skip if Steps 1–5 all passed cleanly with nothing to fix.)
