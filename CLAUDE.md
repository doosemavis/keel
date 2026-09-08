# Keel — working notes for Claude

A design system with one token foundation and verified cross-framework parity.
React ships first; Angular is Phase 3 and is the reason several decisions below
look over-engineered for a single-framework library. They are not.

## The thesis, in one paragraph

Every org that has shipped one design system across two frameworks has watched
the second rot (Polaris, Primer, Material Web, Fluent, Carbon — the table is in
the README). Drift is a tooling problem, not a discipline problem: nothing
mechanical was comparing the two implementations. Keel's answer is that a
component is described **once, as data**, in `@keel/specs`, and everything else
is generated from or verified against that description. When you are tempted to
hand-write something that could be derived, that is the thing this repo exists
to prevent.

## Layout

| Path | What it is |
|---|---|
| `packages/tokens` | DTCG tokens → CSS custom properties + typed TS. Zero runtime deps. |
| `packages/specs` | Machine-readable component specs. The shared source of truth. |
| `packages/react` | React 19 components. Behaviour from React Aria, styling from tokens. |
| `packages/behaviors` | Framework-agnostic DOM assertions. Private, never published. |
| `apps/workbench` | The docs page. Generated from BUILT artifacts, so it cannot drift. |

## Commands

```bash
npm install          # npm workspaces + Turborepo. NOT pnpm — that was migrated away from.
npm run build        # turbo run build
npm run dev          # workbench dev server on localhost:3000, watch + SSE live reload
npm test             # turbo run test
npm run typecheck
npm run lint:packaging   # publint + @arethetypeswrong/cli, per package
```

Requires **npm ≥ 11** (npm 10 crashes in arborist on vitest 4's optional-peer
graph). `packageManager` is pinned to `npm@12.0.2` because Turbo requires it and
rejects a range in `devEngines`. TypeScript is held at **6.0.x** because Angular
tooling declares `>=6.0 <6.1`, and that line has to hold now rather than be
discovered in Phase 3.

## The gates — do not weaken these to make a build pass

Four things fail the build. Each exists because something was agreed and then
written anyway.

1. **Contrast** (`packages/tokens/contrast.js`) — 56 WCAG pairs across both
   themes. It has twice forced real design changes: splitting
   `border.default`/`border.control`, and moving the neutral ramp's step 500 off the
   even spacing so `fg.subtle` clears AA. If it fails, the palette is wrong, not
   the gate.
2. **Workbench chrome** (`apps/workbench/chrome.js`) — 28 pairs. The docs page
   is held to the same bar as the system it documents.
3. **Token discipline** (`packages/react/lint-css.js`) — no raw colour, easing
   or duration in component CSS. Lengths are only advisory, and deliberately so;
   read the file header before tightening it.
4. **Spec conformance** (`packages/react/src/spec-conformance.test.tsx`) — every
   component, driven by the spec list in both directions, so a component cannot
   exist without being covered.

## Conventions that are load-bearing

- **Components reference semantic roles only** (`--keel-color-bg-accent`), never
  primitive ramps (`--keel-color-accent-600`).
- **`aria-disabled`, never native `disabled`.** Native removes the control from
  the tab order and suppresses the description explaining why it is unavailable.
- **`aria-busy`, not React Aria's `data-pending`** — Angular cannot reproduce a
  React Aria artifact, and the shared suite holds both to one signal.
- **The palette is six OKLCH seeds** in `packages/tokens/seeds.json` — four
  colour ramps plus two neutrals, one per theme. Re-theming edits six entries;
  `ramps.js` generates all 70 values. Never hand-edit
  `src/primitive/color.json`.
- **Webfont axes live beside the family** in `typography.json`, not mapped by
  role, because which axes exist is a property of the face.
- **`SpecProp.attribute`** records when a prop maps to a native HTML attribute
  (`'native'`) or is deliberately renamed (`'data-theme-value'`). A rename is a
  recorded decision, not a discrepancy to be found later.
- **No pre-styled component library, ever.** React Aria Components is the one
  external dependency in `@keel/react`, and it stays because it is headless —
  zero CSS, zero visual opinion, zero component markup of its own. A library
  that ships styling or opinionated component markup (shadcn/ui, Radix UI's
  themed primitives, or any other design system) must never be pulled in and
  restyled. Every class name, every pixel of CSS, and every component's DOM
  structure is Keel's own. Headless behaviour/accessibility libraries are fine;
  anything with a visual point of view is not.
- **Every component accepts and merges a consumer `className`.** All 12
  React components already do this
  (`['keel-X', className].filter(Boolean).join(' ')`), so a consumer's own
  classes compose alongside Keel's, never replace them — e.g.
  `<Button className="my-class" />` renders `class="keel-Button my-class"`.
  This is a permanent cross-framework contract, not an accident of twelve
  components happening to agree: `@keel/angular` (Phase 3) must expose the
  equivalent via Angular's native `class`/`[ngClass]` binding, merging the
  same way, not replacing Keel's own classes.
- Prose in this repo explains **why**, not what. Comments that record a rejected
  alternative and the measurement behind it are the point — do not "tidy" them.

## Known defects

- **`aria-disabled` never reaches the DOM on Checkbox, RadioGroup, Switch and
  ThemeToggle.** They spread it onto a React Aria Components root, which filters
  unrecognised ARIA props. `<Checkbox disabled>` renders a fully focusable,
  operable checkbox: React Aria toggles internal state on Space while Keel's
  `onChange` guard swallows the callback — it looks like it works and silently
  reports nothing. Marked `it.fails` in the conformance suite, so fixing it makes
  that test fail *for passing* and forces the marker to be deleted. **This is the
  next thing worth doing** — it is the only open item that is a real user-facing
  accessibility failure rather than tooling.

## Open work, in priority order

1. Fix the `aria-disabled` defect above.
2. Add `axe-core` assertions to `@keel/behaviors`. There is currently not one
   automated a11y assertion, in a system whose pitch is verified accessibility.
   This is also what would let `a11yReviewed` become earned rather than asserted
   — every spec is `status: 'experimental'` with `a11yReviewed: null` today.
3. Add a linter and formatter. There is no ESLint, Prettier, `.editorconfig` or
   root `lint` script. For a repo arguing for mechanical enforcement over good
   intentions, that is its most visible internal contradiction. Biome is one
   dependency and one config.
4. Reconcile the four single-state specs (Alert, Avatar, Badge, Spinner) with
   what those components actually implement.
5. Name component-local geometry as `--_*` custom properties. `lint-css.js`
   reports the worst offenders (ThemeToggle 21, Avatar 16, Switch 11). These are
   *not* token violations — a switch track is 2.25rem because that is the size
   of a switch — but they should be named rather than scattered inline.
6. Then `@keel/angular`. That is what turns the parity claim from an argument
   into evidence, and none of the above should be deferred past it.

## Not yet done

No git remote. Nothing published to npm — no org, no OIDC trusted publishing set
up yet, so `@keel/tokens@0.1.0` has never shipped. Releases are wired
(changesets + `.github/workflows/release.yml` with provenance) but untested.

## History

The audit that produced items 1–5 is in the attached Claude project as
`claude/keel-design-system-audit.md`. Commit messages in this repo are long on
purpose and carry the reasoning for every non-obvious decision — `git log` is
the design record, and reading it beats guessing.
