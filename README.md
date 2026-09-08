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
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible+Next:wght@400;500;600;700&family=Atkinson+Hyperlegible+Mono:wght@400;500&display=swap">
```

`import '@keel/tokens/fonts.css'` does the same thing where editing the HTML shell is impractical. That file is **generated from the typography tokens**, so it can never request a face the system does not declare — and, more usefully, can never keep requesting one it has stopped declaring. Each family names the weight axes it needs beside itself in `typography.json`, because which axes exist is a property of the face and not of the role it plays.

`import '@keel/tokens/utilities.css'` solves a different problem: applying a token to markup the system doesn't own. A component reads `var(--keel-color-bg-accent)` from its own scoped CSS, but a consumer's own element — a marketing banner, a wrapper around a third-party widget — has nothing to reach for. The utility classes are exactly that: one class per semantic color role (`.keel-bg-accent`, `.keel-text-accent`, `.keel-border-accent`, and so on), **generated from the same semantic color tokens** that produce the CSS custom properties rather than hand-listed, so a new role can never exist in one place and not the other. The naming follows the token category — `bg.*` becomes `.keel-bg-{role}`, `fg.*` becomes `.keel-text-{role}`, `border.*` becomes `.keel-border-{role}`. A utility class and a Keel component's own background rule are both single-class selectors, so they carry equal specificity: applying `className="keel-bg-accent"` to a `<Button>` doesn't by itself decide which one wins, import order does — load `@keel/tokens/utilities.css` after `@keel/react/styles.css` if you want the utility class to take precedence.

### The interface face is Atkinson Hyperlegible

Commissioned by the Braille Institute and drawn so that low-vision readers can tell characters apart: the letterforms are deliberately *differentiated* exactly where sans-serifs normally unify them for rhythm — `I` / `l` / `1`, `O` / `0`, `b` / `d` / `p` / `q`. It carries every label, every table cell and every component in the system, and its companion mono carries every hex value, where confusing `0` with `O` costs a reader real time.

This is the largest single legibility decision available in a design system, and picking it is consistent with the rest: the whole project's claim is that accessibility is *enforced by measurement* rather than promised in a heading. The **Next** revision is used rather than the 2019 original because the original ships only 400 and 700 while the interface leans on 500 and 600 — synthesising those weights would undo the drawing.

The display face is Verdana, for the same reason. Matthew Carter drew it for on-screen reading at small sizes — exaggerated counters, wide sidebearings, unambiguous letterforms — which is the brief Atkinson answers, thirty years earlier. It replaced Bodoni Moda: a didone's whole character is extreme hairline-to-stem contrast, which is beautiful and is the first thing to vanish for a low-vision reader, and a system claiming accessibility is measured rather than promised should not have been setting its own headings in the least legible face on the page. It is also a system font, so the display role now costs zero webfont bytes. Nobody edited the URL above to remove it: a family that declares no axes is not fetched, so the generated loader dropped the request on its own — which is exactly the property the generation exists to provide.

The trade is real. Verdana and Atkinson are both humanist sans faces, so headings no longer contrast with body text by shape; the display line-height and letter-spacing tokens carry that contrast instead, and are tuned for it.

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

A component is described once, as data, in `@keel/specs`:

```ts
export const buttonSpec = {
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
} as const satisfies ComponentSpec;
```

Four mechanisms hang off it:

1. **Story and test matrices are generated from the contract**, not hand-listed. A variant added on one side and not the other fails the build.
2. **Behavioural assertions live in `@keel/behaviors`** and are written against the rendered DOM using `@testing-library/dom` — no hooks, no signals, no framework internals. The same function body is imported by the React test today and the Angular test in Phase 3.
3. **Both frameworks consume the same compiled CSS**, so a visual diff between them is a real implementation bug rather than a styling divergence.
4. **`validateSpec()` runs in CI** — a component cannot be marked `stable` without a recorded accessibility review date.

## Packages

| Package | What it is |
|---|---|
| `@keel/tokens` | DTCG token source compiled to CSS custom properties + typed TS. Zero runtime dependencies. |
| `@keel/specs` | Machine-readable component specs. The shared source of truth. |
| `@keel/react` | React 19 components. Behaviour from React Aria, styling from the token layer. |
| `@keel/behaviors` | Framework-agnostic DOM assertions. Private — test infrastructure, never published. |
| `@keel/angular` | *Phase 3.* |

`@keel/tokens` is a **peer** dependency of every framework package, so a consuming app resolves exactly one copy of the token layer.

## Design tokens

### The palette is six numbers

`packages/tokens/seeds.json` holds six OKLCH seeds — a hue and a max chroma each. `ramps.js` generates all 70 primitive values from them, so re-theming Keel means editing six entries rather than 70 coordinated hex codes.

The ramps are named for the job they do — `accent`, `success`, `warning`, `danger`, and a neutral per theme — rather than for a hue or a source. A contributor reaching for `{color.accent.600}` is reminded there is exactly one signature colour in this system and that is it.

| Seed | Hue | C≤ | Job |
|---|---|---|---|
| `neutral-light` | 310 | 0.020 | The light theme's neutral: every surface, border, divider and text colour — roughly 70% of what anyone sees. Tinted toward the accent's hue family. |
| `neutral-dark` | 155 | 0.020 | The dark theme's neutral. Tinted toward success's hue family instead, so the two themes lean toward different signature colours. |
| `accent` | 312 | 0.185 | The accent, and the signature. A deep magenta-violet carrying the largest chroma budget in the palette. |
| `success` | 155 | 0.150 | Success. A saturated jewel-tone jade rather than the muted sage most systems ship for status-green — professional, not corporate-safe. |
| `warning` | 55 | 0.120 | Warning. Deep amber-gold, placed for hue separation from both accent and success. |
| `danger` | 20 | 0.180 | Danger. Deep crimson, placed for hue separation from the accent. |

Three of those numbers are load-bearing in ways worth stating.

**The neutral is not grey, and it is not one ramp.** Both neutrals sit at a chroma of 0.020, where the colour is felt rather than seen — but at different hues. The light theme's neutral leans toward the accent and the dark theme's toward success, so each theme carries a quiet echo of a different signature colour rather than a theme-neutral grey. That is why there are six seeds rather than five: the previous palette drew both themes from different lightness steps of one neutral ramp, and one ramp cannot lean two ways. Radix Colors ships a tinted grey beside each accent for the same reason. A pure grey also reads as unconsidered.

**`accent` and `danger` are 68° apart.** A primary button and a destructive button are both saturated fills carrying a contrasting label, so they have to be separable at a glance, and hue does most of that work. `warning` and `danger` sit only 35° apart by convention: amber-caution and red-danger are adjacent warm hues in nearly every system, and context and iconography carry the rest.

**Chroma is concentrated where boldness is wanted.** `accent` and `danger` carry the most, at 0.185 and 0.180 — they are the two fills that have to read as emphatic. `success` and `warning` sit lower, and the neutrals are effectively silent. Boldness spread evenly is just noise.

#### Why generate rather than hand-pick

**OKLCH's L is perceptual lightness, so step 600 is the same apparent darkness in every hue by construction.** That is what makes a semantic role like `bg.accent` safely swappable between hues — with hand-tuned ramps, `blue.600` and `red.600` end up different real lightnesses and a component that swaps one for the other visibly changes weight. Chroma peaks in the midtones because real pigment does: a colour is most saturated at mid-lightness and desaturates toward both white and black. Flat-chroma ramps look like plastic.

Requested chroma is frequently unreachable — a saturated yellow at mid lightness does not exist in sRGB at any hue. `ramps.js` walks chroma down until the colour fits rather than clipping channels, because clipping shifts the *hue* (an over-saturated magenta clips visibly redder) while reducing chroma preserves it. Every generated token records the chroma it actually **delivered**, plus the request when the two differ, and the build prints the shortfall per ramp:

```
neutral-light h310  C≤0.020  fully in gamut
neutral-dark h155  C≤0.020  fully in gamut
accent  h312  C≤0.185  4/11 steps gamut-mapped, chroma peaks at 500
success h155  C≤0.150  5/11 steps gamut-mapped, chroma peaks at 500
warning h 55  C≤0.120  6/11 steps gamut-mapped, chroma peaks at 500
danger  h 20  C≤0.180  5/11 steps gamut-mapped, chroma peaks at 500
```

That line is the point of the exercise. `warning` is the ramp sRGB likes least: an amber cannot hold much chroma near white or near black, so its two palest tints and four darkest shades are gamut-mapped, and every shortfall is recorded on the token that carries it. It was seeded at hue 50 and chroma 0.140, which clipped 8 of 11 steps and delivered 91% of the requested chroma on average; the report made that visible, and moving to 55 / 0.120 brought it to 6 of 11 at 97% — with steps 200 through 600, the ones that actually appear as fills, now delivered in full. The reasoning is in `seeds.json` under `warning.$comment`. Without the report, the only symptom would have been a palette that "looks slightly wrong" months later with nobody able to say why. What never changes is the shared lightness curve: it is what makes semantic roles swappable between hues, and it holds for all six ramps or for none.

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

On the re-theme it rejected the build again: `fg.subtle` aliases the neutral ramp's step 500, and the role's whole job is being "the lightest foreground that still carries AA body text" — at the evenly-spaced lightness it measured 4.17:1 on white. Repointing the alias to step 600 would have collapsed `fg.subtle` into `fg.muted` and lost a level of type hierarchy, so the ramp moved instead. The accessibility requirement sets the value and the even spacing yields to it, which is recorded in `ramps.js` where someone might otherwise "tidy" it back.

Pairs marked exempt — disabled text, decorative dividers — are reported but not enforced, because WCAG 1.4.3 exempts disabled controls and lifting disabled text to AA makes it read as enabled.

**The docs page is built from the system, and held to the same bar.** The workbench chrome was, until the first re-theme, 39 hand-written hex values — authored warm, to sit against the warm neutral the re-theme replaced. Nothing caught it, because the chrome was the one part of a project built entirely around *generate it and verify it* that was neither.

It now reads the neutral ramp for every surface and `accent` for every accent straight out of the generated ramps — each page theme reading its own neutral, exactly as the semantic layer does — (`apps/workbench/chrome.js`), and is gated on 28 of its own contrast pairs before a byte of the page is assembled. Change a seed and the page changes with it — the docs are a live specimen of the palette, not an illustration of one.

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
npm run build          # tokens (incl. contrast gate) -> specs -> react -> workbench
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

Three lifecycle stages, deliberately: `experimental` → `stable` → `deprecated`. Status is load-bearing — `validateSpec()` refuses to let a component be `stable` without a recorded accessibility review date.

## License

MIT
