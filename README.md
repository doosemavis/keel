# Keel

A design system with one token foundation and **verified cross-framework parity**.

React ships first. Angular follows, and the two are held to a single machine-readable contract rather than to good intentions.

```bash
npm install @keel/react @keel/tokens
```

```tsx
import { Button } from '@keel/react';
import '@keel/react/styles.css';

<Button variant="primary" size="md">Save changes</Button>
```

Keel sets its own faces, so load them in `<head>` — a `<link>` starts the download earlier than an `@import` the browser cannot see until the stylesheet arrives:

```html
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bodoni+Moda:opsz,wght@6..96,500;6..96,700&family=Atkinson+Hyperlegible+Next:wght@400;500;600;700&family=Atkinson+Hyperlegible+Mono:wght@400;500&display=swap">
```

`import '@keel/tokens/fonts.css'` does the same thing where editing the HTML shell is impractical. That file is **generated from the typography tokens**, so it can never request a face the system does not declare — and, more usefully, can never keep requesting one it has stopped declaring. Each family names the weight axes it needs beside itself in `typography.json`, because which axes exist is a property of the face and not of the role it plays.

### The interface face is Atkinson Hyperlegible

Commissioned by the Braille Institute and drawn so that low-vision readers can tell characters apart: the letterforms are deliberately *differentiated* exactly where sans-serifs normally unify them for rhythm — `I` / `l` / `1`, `O` / `0`, `b` / `d` / `p` / `q`. It carries every label, every table cell and every component in the system, and its companion mono carries every hex value, where confusing `0` with `O` costs a reader real time.

This is the largest single legibility decision available in a design system, and picking it is consistent with the rest: the whole project's claim is that accessibility is *enforced by measurement* rather than promised in a heading. The **Next** revision is used rather than the 2019 original because the original ships only 400 and 700 while the interface leans on 500 and 600 — synthesising those weights would undo the drawing.

Bodoni Moda stays as the display face, and the two are not in tension. A hyperlegible sans does the work at 12–16px where character confusion actually costs something; the didone runs at 25px and up, where no such risk exists and the job is voice.

---

## Why this exists

Every large organisation that has tried to ship one design system across two frameworks has watched the second one rot:

| System | What happened to the non-flagship implementation |
|---|---|
| Shopify Polaris | React library **archived** August 2026, replaced by web components |
| GitHub Primer | Rails/ViewComponents in **maintenance mode** since February 2026 |
| Google Material | Material Web **unmaintained** since Google defunded it in June 2024 |
| Microsoft Fluent | Angular wrapper stuck at `2.0.0-beta.5` since **March 2025** |
| IBM Carbon | Angular, Vue and Svelte explicitly **demoted to community-maintained** |
| Adobe Spectrum | React and Web Components parallel by design; maintainers state outright that APIs differ |

The pattern is identical every time: the implementation the sponsoring org's own products use stays current, and the other one drifts.

Drift is not a discipline problem. It is a tooling problem — nothing mechanical was comparing the two implementations. Keel's answer is to make the comparison automatic.

## How parity is enforced

A component is described once, as data, in `@keel/contracts`:

```ts
export const buttonContract = {
  id: 'button',
  name: 'Button',
  status: 'experimental',
  a11yReviewed: null,
  props: {
    variant: { values: ['primary', 'secondary', 'ghost', 'danger'], defaultValue: 'secondary', description: '…' },
    size:    { values: ['sm', 'md', 'lg'], defaultValue: 'md', description: '…' },
  },
  states: ['default', 'hover', 'focus', 'active', 'disabled', 'loading'],
  a11y: { role: 'button', activationKeys: ['Enter', ' '], disabledStrategy: 'aria-disabled', keyboardOperable: true },
} as const satisfies ComponentContract;
```

Four mechanisms hang off it:

1. **Story and test matrices are generated from the contract**, not hand-listed. A variant added on one side and not the other fails the build.
2. **Behavioural assertions live in `@keel/behaviors`** and are written against the rendered DOM using `@testing-library/dom` — no hooks, no signals, no framework internals. The same function body is imported by the React test today and the Angular test in Phase 3.
3. **Both frameworks consume the same compiled CSS**, so a visual diff between them is a real implementation bug rather than a styling divergence.
4. **`validateContract()` runs in CI** — a component cannot be marked `stable` without a recorded accessibility review date.

## Packages

| Package | What it is |
|---|---|
| `@keel/tokens` | DTCG token source compiled to CSS custom properties + typed TS. Zero runtime dependencies. |
| `@keel/contracts` | Machine-readable component contracts. The shared source of truth. |
| `@keel/react` | React 19 components. Behaviour from React Aria, styling from the token layer. |
| `@keel/behaviors` | Framework-agnostic DOM assertions. Private — test infrastructure, never published. |
| `@keel/angular` | *Phase 3.* |

`@keel/tokens` is a **peer** dependency of every framework package, so a consuming app resolves exactly one copy of the token layer.

## Design tokens

### The palette is five numbers

`packages/tokens/seeds.json` holds five OKLCH seeds — a hue and a max chroma each. `ramps.js` generates all 57 primitive values from them, so re-theming Keel means editing five lines rather than 57 coordinated hex codes.

The palette is drawn from *Nelumbo nucifera*, the sacred lotus — and specifically from the five things actually present in the plant, rather than from a general idea of "pink". The ramps are named after their source, not after `blue` or `red`, so a contributor reaching for `{color.lotus.600}` is reminded there is exactly one signature colour in this system and that is it.

| Seed | Hue | C≤ | Job |
|---|---|---|---|
| `pond` | 168 | 0.010 | The neutral: every surface, border, divider and text colour — roughly 70% of what anyone sees. The waxy blue-green bloom on a lotus pad, and the water under it. |
| `lotus` | 338 | 0.225 | The accent, and the signature. Deep magenta-pink petal, at roughly twice the chroma of a conventional SaaS primary. |
| `gold` | 90 | 0.155 | Warning. The ring of stamens at the flower's heart — a true golden yellow rather than the orange-amber most systems reach for. |
| `leaf` | 145 | 0.095 | Success. The pad itself: glaucous, meaning dusty and matte rather than vivid, so the low chroma is the authentic choice as well as the restrained one. |
| `russet` | 30 | 0.175 | Danger. The dried seed pod. Deliberately below the petal's chroma — a destructive action should read as serious, not as the loudest thing on screen. |

Three of those numbers are load-bearing in ways worth stating.

**The neutral is not grey.** `pond` sits at hue 168 with a chroma of 0.010, where the colour is felt rather than seen. That hue is the near-complement of the petal magenta, so the accent pops harder against every surface in the system than it would against a true grey — the trick botanical illustration has used for centuries. A pure grey also reads as unconsidered.

**`lotus` and `russet` are 52° apart, and that is the tightest relationship in the palette.** A primary button and a destructive button are both saturated fills carrying light text, so they have to be separable at a glance; they're separated by chroma and lightness as well as hue. Real lotus cultivars run from near-white to a pink light enough to collide with russet outright — 338 picks the deep magenta end of the species on purpose, partly for boldness and partly to keep that gap open.

**The whole chroma budget goes to one ramp.** `lotus` runs to 0.225; nothing else exceeds 0.175, and the neutral is effectively silent. Boldness spread evenly is just noise.

#### Why generate rather than hand-pick

**OKLCH's L is perceptual lightness, so step 600 is the same apparent darkness in every hue by construction.** That is what makes a semantic role like `bg.accent` safely swappable between hues — with hand-tuned ramps, `blue.600` and `red.600` end up different real lightnesses and a component that swaps one for the other visibly changes weight. Chroma peaks in the midtones because real pigment does: a colour is most saturated at mid-lightness and desaturates toward both white and black. Flat-chroma ramps look like plastic.

Requested chroma is frequently unreachable — a saturated yellow at mid lightness does not exist in sRGB at any hue. `ramps.js` walks chroma down until the colour fits rather than clipping channels, because clipping shifts the *hue* (an over-saturated magenta clips visibly redder) while reducing chroma preserves it. Every generated token records the chroma it actually **delivered**, plus the request when the two differ, and the build prints the shortfall per ramp:

```
pond    h168  C≤0.010  fully in gamut
lotus   h338  C≤0.225  9/11 steps gamut-mapped, chroma peaks at 500
gold    h 90  C≤0.155  6/11 steps gamut-mapped, chroma peaks at 400
leaf    h145  C≤0.095  fully in gamut
russet  h 30  C≤0.175  4/11 steps gamut-mapped, chroma peaks at 500
```

That line is the point of the exercise. `gold` gives up ~40% of its requested chroma below step 500, which moves its real saturation peak to 400 and makes its dark steps read brown-olive. Without the report, the only symptom is a palette that "looks slightly wrong" months later with nobody able to say why. Two fixes were measured and both rejected — the reasoning is in `seeds.json` under `gold.$gamutNote`, and the short version is that the shared lightness curve is what makes semantic roles swappable between hues, so it does not get bent for one ramp.

Tokens are then authored in [DTCG](https://www.designtokens.org/) format and compiled with Style Dictionary in two passes:

```
src/primitive/*.json  ─┬─> src/semantic/color.json ──────────> :root, [data-theme="light"]
                       └─> + src/semantic/color.dark.json ───> [data-theme="dark"]
```

The dark file carries **only the roles whose value differs** from light, so a role shared by both themes is authored exactly once. Theming is a `data-theme` attribute swap with no JavaScript.

Components reference semantic roles (`--keel-color-bg-accent`) and never primitive ramps (`--keel-color-blue-600`).

The TypeScript export emits `var(--keel-*)` reference strings rather than resolved hex values — inlining the resolved value would freeze the light theme into the JS bundle and break runtime theming.

### Contrast is a build gate, not a promise

`npm run contrast --workspace @keel/tokens` resolves every semantic role to a concrete value in each theme and asserts all 56 pairs that carry a WCAG obligation. It runs as part of `build`, so a palette change that breaks a requirement fails CI.

It earns its keep, twice now. On first run it caught eight real failures and forced a genuine API change: `border.default` could not be both a decorative divider and a 3:1 interactive boundary under WCAG 1.4.11, so the role was split into `border.default` (decorative, exempt) and `border.control` (enforced).

On the re-theme it rejected the build again: `fg.subtle` aliases `pond.500`, and the role's whole job is being "the lightest foreground that still carries AA body text" — at the evenly-spaced lightness it measured 4.17:1 on white. Repointing the alias to `pond.600` would have collapsed `fg.subtle` into `fg.muted` and lost a level of type hierarchy, so the ramp moved instead. The accessibility requirement sets the value and the even spacing yields to it, which is recorded in `ramps.js` where someone might otherwise "tidy" it back.

Pairs marked exempt — disabled text, decorative dividers — are reported but not enforced, because WCAG 1.4.3 exempts disabled controls and lifting disabled text to AA makes it read as enabled.

**The docs page is built from the system, and held to the same bar.** The workbench chrome was, until the lotus re-theme, 39 hand-written hex values — authored warm, to sit against the warm neutral the re-theme replaced. Nothing caught it, because the chrome was the one part of a project built entirely around *generate it and verify it* that was neither.

It now reads `pond` for every surface and `lotus` for every accent straight out of the generated ramps (`apps/workbench/chrome.js`), and is gated on 28 of its own contrast pairs before a byte of the page is assembled. Change a seed and the page changes with it — the docs are a live specimen of the palette, not an illustration of one.

The `--wb-*` layer is still there and is not vestigial: Keel's CSS is re-scoped to `[data-keel-theme]` at build time so the page and the specimens carry **independent** themes, which is what makes it possible to review the dark palette while reading the page in light. If the chrome referenced `--keel-*` live, flipping the specimen switch would repaint the whole page. So ramp values are resolved at build time and emitted as `--wb-*`, which follow the page theme alone. Frame-versus-specimen separation is then carried structurally rather than by hue — a specimen sits on `bg.canvas` inside a dashed stage, on a panel a step lighter than the ground around it. That signal survives a re-theme and survives being viewed in either theme, which a colour contrast between frame and content does not.

The chrome gate immediately reproduced the system's own history: `--wb-line-strong` was doing duty as both a quiet table rule and the sole visible boundary of the filter input, and 1.78:1 is not a control border. It split into `--wb-line-strong` (decorative, exempt) and `--wb-line-control` (enforced at 3:1) — the same resolution `border.default`/`border.control` reached, arrived at the same way, by something measuring rather than someone remembering.

## Theming

`ThemeToggle` switches `data-theme` on the document root and stores the choice. Before any of that, inline the init script in `<head>` — above your stylesheet:

```tsx
import { themeInitScript, ThemeToggle } from '@keel/react';

<head>
  <script dangerouslySetInnerHTML={{ __html: themeInitScript() }} />
</head>

<ThemeToggle />
```

The script is separate from the component on purpose. By the time React runs, the browser has already painted — so a component alone cannot prevent the flash of the wrong theme. The snippet is synchronous and blocking, reads the stored choice, falls back to `prefers-color-scheme`, and stamps the attribute before first paint. The component then picks up whatever it decided.

Storage access is wrapped in `try`/`catch` throughout: `localStorage` throws outright in some privacy modes, and a theme preference is not worth crashing an app over.

## Accessibility decisions worth knowing

- **Disabled buttons stay focusable.** Keel renders `aria-disabled` rather than the native `disabled` attribute. A natively disabled button leaves the tab order entirely, so a screen reader user sweeping the page never learns the action exists or why it is unavailable.
- **`aria-busy` over `data-pending`.** React Aria signals in-flight actions with its own `data-pending` attribute. Keel sets `aria-busy` as well, because the shared behaviour suite is imported unchanged by the Angular package and `data-pending` is a React Aria artifact Angular cannot reproduce.
- **Reduced motion is honoured**, including the loading spinner — a spinner that never stops is a vestibular hazard. `aria-busy` still carries the meaning.
- **Windows High Contrast Mode** is handled explicitly; without a `forced-colors` block every variant collapses to look identical.

## Development

Requires **Node 22 or newer** and **npm 11 or newer**.

```bash
npm install
npm run build          # tokens (incl. contrast gate) -> contracts -> react -> workbench
npm test
npm run typecheck
npm run lint:packaging # publint + are-the-types-wrong

npm run dev            # workbench on http://localhost:3000, watch + live reload
open apps/workbench/dist/index.html   # or just open the built file — no server needed
```

npm 11 is a real floor, not caution: npm 10's dependency resolver crashes on vitest 4's optional-peer graph with `Cannot read properties of null (reading 'edgesOut')`. Node 24 and newer ship an npm past that.

This is an **npm workspaces** monorepo driven by Turborepo — the same shape GitHub's Primer uses. Workspace packages are linked by npm automatically; `overrides` in the root `package.json` forces one resolved version of `typescript`, `react` and `react-dom` across the whole tree.

TypeScript is held at the **6.0** line. TypeScript 7 (the native Go port) does not yet expose a stable programmatic API, so Angular tooling cannot consume it — `@angular/compiler-cli` and `ng-packagr` both declare `typescript: ">=6.0 <6.1"`. The Angular package has to build against the same compiler the React package uses, so the line is held now rather than discovered later. `overrides` is what makes that a single decision instead of five copies that drift.

The workbench is a single self-contained HTML file with everything inlined, so opening it works with no server. `npm run dev` exists for when you are iterating on tokens and would rather not rebuild by hand.

## Releases

[Changesets](https://github.com/changesets/changesets) with independent versioning, published via **npm OIDC trusted publishing** with provenance attestation. There is no npm token in CI — npm is retiring token-based publishing for 2FA-bypass tokens in January 2027, so this is the durable path.

## Status

| Component | Status | a11y reviewed | React | Angular |
|---|---|---|---|---|
| Button | experimental | — | ✅ | — |
| TextField | experimental | — | ✅ | — |
| Select | experimental | — | ✅ | — |
| Checkbox | experimental | — | ✅ | — |
| RadioGroup | experimental | — | ✅ | — |
| Switch | experimental | — | ✅ | — |
| Alert | experimental | — | ✅ | — |
| Badge | experimental | — | ✅ | — |
| Card | experimental | — | ✅ | — |
| Avatar | experimental | — | ✅ | — |
| Spinner | experimental | — | ✅ | — |
| ThemeToggle | experimental | — | ✅ | — |

Three lifecycle stages, deliberately: `experimental` → `stable` → `deprecated`. Status is load-bearing — `validateContract()` refuses to let a component be `stable` without a recorded accessibility review date.

## License

MIT
