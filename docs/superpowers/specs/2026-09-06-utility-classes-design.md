# Design: Color utility classes

## Context

Requested so consumers can apply a Keel color token directly to their own
markup via a class name — the pattern the user described from a prior
job's design system (Citi: `class="lmn-primary"`). Keel has no such
system today: components consume CSS custom properties internally
(`var(--keel-color-bg-accent)`) in their own component-scoped CSS, but
nothing lets a consumer apply a token to an arbitrary element of their
own via a class.

This is new-subsystem work (Architectural path) — there is no existing
utility-class flow in the repo to extend.

## Scope for this spec

**Color only.** Spacing (`space` scale), `radius`, and `border.width`
utilities were explicitly discussed and deferred as a fast-follow, not
blocking this work — a separate spec when picked up.

## Decisions

**Generated, not hand-written, from the existing semantic token source.**
A new build step reads the same `packages/tokens/src/semantic/color.json`
/ `color.dark.json` files that already generate the `--keel-color-*` CSS
custom properties, and emits one utility class per semantic role. Because
it shares the source with the variables, a new semantic role automatically
gets a utility class — no hand-curation, no drift. This is the same
"generate, don't hand-pick" instinct already governing `ramps.js` and the
Style Dictionary pipeline in this package.

**Lives in `@keel/tokens`, not `@keel/react`.** Utility classes are pure
CSS with zero framework dependency — exactly the kind of thing the future
`@keel/angular` package should inherit for free, the same way it will
inherit `tokens.css`. Shipping this from `@keel/react` instead would mean
re-deriving the same generation logic a second time when Angular arrives,
duplicating exactly the kind of work the shared token layer exists to
prevent.

**One file works for both themes.** Utility classes reference
`var(--keel-color-bg-accent)` rather than a resolved value, and that
variable already resolves differently per `[data-theme]` (handled by the
existing `tokens.css`/`tokens.dark.css` split). So a single
`utilities.css` — no light/dark variant needed — works correctly in both
themes automatically.

**Naming convention**, mirroring the semantic categories:
- `bg.*` → `.keel-bg-{role}` (`background-color: var(--keel-color-bg-{role})`)
- `fg.*` → `.keel-text-{role}` (`color: var(--keel-color-fg-{role})`) —
  using "text" rather than "fg" since that's the conventional term in
  utility-class systems (Tailwind, Bootstrap, etc.), even though the
  token category itself is named `fg`
- `border.*` → `.keel-border-{role}` (`border-color: var(--keel-color-border-{role})`)
- `focus.*` is **excluded** — a focus ring is applied via `:focus-visible`
  logic as part of a component's own behavior, not something a consumer
  would apply as a static utility class.

Role names are kebab-cased to match the existing CSS variable convention
(the semantic JSON's camelCase `accentHover` becomes
`--keel-color-bg-accent-hover`, so the utility class is
`.keel-bg-accent-hover`). Interactive-state role variants (`accentHover`,
`accentActive`, `dangerHover`, etc.) get classes too, generated
mechanically along with every other role — nothing is curated out, since
curation is exactly the drift risk this design avoids.

**One shared naming-transform function**, not two implementations. The
same "semantic token key → utility class name" logic is needed in two
places: the new CSS generator (to emit `.keel-bg-accent-hover { ... }`)
and Workbench's build script (to display the matching class name in its
token table, per the next section). These must be the same function,
imported by both call sites — not two hand-synced copies. This mirrors
why this repo already extracted its OKLCH color math into one shared
`oklch.js` file used by both `ramps.js` and Workbench's `chrome.js`,
rather than letting a docs-page implementation quietly diverge from the
system's own.

**Packaging**: a new export subpath, consistent with the existing
`./tokens.css` / `./tokens.dark.css` pattern in
`packages/tokens/package.json`'s `exports` map:
```json
"./utilities.css": "./dist/utilities.css"
```
So a consumer opts in with `import '@keel/tokens/utilities.css'`, the same
way they already import `@keel/react/styles.css`.

## Workbench display

The existing semantic-color token table (columns: Swatch, Token, CSS
variable, Light, Dark, Notes) gains a new **Utility class** column, showing
e.g. `.keel-bg-accent` next to that row's existing `--keel-color-bg-accent`.
Populated via the shared naming-transform function described above — not
a second, hand-maintained mapping.

## Out of scope for this spec

- Spacing (`space`), `radius`, and `border.width` utility classes —
  explicit fast-follow, separate spec
- `focus.*` utilities (excluded by design, not deferred)
- Any Angular-specific work (`@keel/angular` does not exist yet; Phase 3
  per root `CLAUDE.md`)
- Any change to how components (`Button`, `Card`, etc.) are styled
  internally — this is a new, separate, opt-in consumer-facing API, not a
  refactor of existing component CSS
