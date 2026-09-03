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

Tokens are authored in [DTCG](https://www.designtokens.org/) format and compiled with Style Dictionary in two passes:

```
src/primitive/*.json  ─┬─> src/semantic/color.json ──────────> :root, [data-theme="light"]
                       └─> + src/semantic/color.dark.json ───> [data-theme="dark"]
```

The dark file carries **only the roles whose value differs** from light, so a role shared by both themes is authored exactly once. Theming is a `data-theme` attribute swap with no JavaScript.

Components reference semantic roles (`--keel-color-bg-accent`) and never primitive ramps (`--keel-color-blue-600`).

The TypeScript export emits `var(--keel-*)` reference strings rather than resolved hex values — inlining the resolved value would freeze the light theme into the JS bundle and break runtime theming.

### Contrast is a build gate, not a promise

`npm run contrast --workspace @keel/tokens` resolves every semantic role to a concrete value in each theme and asserts all 56 pairs that carry a WCAG obligation. It runs as part of `build`, so a palette change that breaks a requirement fails CI.

It earns its keep. On first run it caught eight real failures and forced a genuine API change: `border.default` could not be both a decorative divider and a 3:1 interactive boundary under WCAG 1.4.11, so the role was split into `border.default` (decorative, exempt) and `border.control` (enforced).

Pairs marked exempt — disabled text, decorative dividers — are reported but not enforced, because WCAG 1.4.3 exempts disabled controls and lifting disabled text to AA makes it read as enabled.

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

npm run dev            # workbench on http://127.0.0.1:4321, watch + live reload
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
