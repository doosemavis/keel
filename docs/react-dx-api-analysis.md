# `@keel/react` DX/API Analysis

Findings and recommendations on `@keel/react`'s public API, evaluated from
the perspective of a developer discovering Keel for the first time via npm.
See `docs/superpowers/specs/2026-09-04-react-dx-api-analysis-design.md` for
scope and method.

## Executive summary

Ranked by how much friction each costs a first-time consumer, not by how
easy the fix is:

1. **The `aria-disabled` convention silently doesn't work on 4 of 7
   interactive components** (Checkbox, RadioGroup, Switch, ThemeToggle) —
   and nothing a consumer would ever see says so. This is the repo's own
   already-stated top priority, and correctly so: it's a real accessibility
   defect, not just a DX one. See Cross-component conventions.
2. **The excellent root `README.md` never ships with the npm package.**
   Neither `@keel/react` nor `@keel/tokens` has a package-level README, so
   the documentation that already answers most of a first-time consumer's
   questions — install, theming, the accessibility conventions — is
   invisible from npm and only reachable by clicking through to GitHub.
   This one gap is upstream of several other findings below. See Entry
   points.
3. **`Select` and `RadioGroup` flatten consumer content into a data array**
   (`options: SelectOption[]`), removing composition flexibility that the
   underlying React Aria Components primitives they wrap already support
   for free. See Composition style.
4. **No documented path to override a single brand color.** The README's
   re-theming story is about editing the token package's source and
   rebuilding — not something a consumer of the published package can do
   from their own app, even though the underlying CSS custom properties
   should support it. See Theming API.
5. **Workbench has no link back to installation instructions** for a
   consumer who discovers it before the README. Minor, and a one-line fix.
   See Discoverability.

## The spec contract

`@keel/specs` (re-exported as `@keel/react/specs`) is the single
machine-readable description of every component — props, defaults, boolean
flags, slots, states, and the accessibility contract
(`packages/specs/src/types.ts:124-152`). Both the React implementation and
Workbench's docs generate from it, so a component cannot exist without
matching documentation.

**This is already well designed, not a finding to fix.** The reasoning is
recorded directly in the code at `packages/react/src/specs.ts:1-35`: specs
are exposed as a *subpath* (`@keel/react/specs`) rather than a static
property on each component (e.g. `Button.spec`) specifically so that
importing `Button` doesn't force every consumer to ship the spec's prose.
The comment gives the actual measured cost — specs are 9.6 kB gzipped
against `@keel/react`'s 7.5 kB, so attaching them as a reachable static
property would have been a 128% size tax paid by every consumer for a
feature most will never call. That's the kind of API decision a senior
engineer would want *more* of in a library, not less — it's opinionated
about a real bundle-size tradeoff and it *shows its work* in the comment
rather than asserting the design without justification.

One real gap: `packages/react/src/specs.ts:22-34` documents the "what you
get" and "why it's a subpath" clearly, but that reasoning currently lives
only as a source comment — it doesn't surface as anything a consumer sees
in an IDE tooltip beyond the module-level JSDoc, and there is no README
anywhere in the package (confirmed in the Entry points and Theming sections
below) that repeats it. A consumer who never opens the source on GitHub
gets the subpath import working correctly, but never learns *why* it's
structured that way — which matters less for correctness and more for
trust: an unexplained second import path reads as an inconsistency until
you find this comment.

**Recommendation:** Surface this reasoning where a consumer will actually
see it — the package README (see Entry points/Theming findings on the
absence of one) and/or a Workbench section, not only in source.

## Composition style

Checked against `vercel-composition-patterns` rules 1.1 (avoid boolean prop
proliferation) and 1.2 (use compound components), across `Button.tsx`,
`TextField.tsx`, `Select.tsx`, and `Card.tsx`.

**Rule 1.1 — checked, and not found.** The anti-pattern this rule targets is
*multiple interacting* booleans that combine into an exponential number of
meaningfully different render paths (the skill's own example: `isThread` /
`isDMThread` / `isEditing` / `isForwarding` on one `Composer`). Keel's
components don't do this. `TextField` has four booleans (`disabled`,
`readOnly`, `required`, `invalid`, `TextField.tsx:31-38`) and `Select` has
three (`disabled`, `required`, `invalid`, `Select.tsx:38-43`), but every one
of them is an independent flag that toggles an ARIA/data attribute — none
of them branch the render tree, and none of them interact with each other.
`Card`'s single `interactive` boolean (`Card.tsx:16`) does switch the
entire render between an `AriaButton` and a `<div>` (`Card.tsx:53-71`), but
it's one boolean with two clean, well-justified outcomes — the component
comment explains exactly why (nested interactive content is invalid HTML
and traps keyboard users, `Card.tsx:26-30`) — not a combinatorial mode
switch. This is a genuine non-finding: state proliferation isn't a problem
here, and there's nothing to fix.

**Rule 1.2 — a real finding.** `Select` and `RadioGroup` both flatten their
children into a plain data array (`options: SelectOption[]`,
`Select.tsx:19-23,34`; `options: RadioOption[]`, seen via
`RadioGroup.tsx:16-20`) rather than exposing composable subparts. The
notable part: the React Aria Components primitives Keel wraps *already*
support composition here — `ListBoxItem` (used internally at
`Select.tsx:123-130`) and `AriaRadio` (used internally at
`RadioGroup.tsx:97-103`) are meant to be rendered directly by a consumer.
Keel's flat-array API removes that flexibility rather than adding to it: a
consumer cannot render a custom option (an icon next to a label, a
disabled-with-tooltip state, a visual divider between groups) without
Keel shipping a new field on `SelectOption` for every such case. Compare:

```tsx
// Current: every future customization needs a new field on SelectOption
<Select
  label="Region"
  options={[
    { value: 'us', label: 'United States' },
    { value: 'eu', label: 'European Union' },
  ]}
/>

// Compound alternative: consumer composes exactly what they need, the way
// the underlying ListBoxItem already allows
<Select label="Region">
  <Select.Option value="us">
    <FlagIcon country="us" /> United States
  </Select.Option>
  <Select.Divider />
  <Select.Option value="eu">
    <FlagIcon country="eu" /> European Union
  </Select.Option>
</Select>
```

**Recommendation:** this doesn't need to replace the current flat API —
plenty of consumers just want a list of strings and the current shape is
the right default for that case. But offering compound children *in
addition to* (not instead of) the `options` prop, the way the underlying
React Aria primitives already support, would recover flexibility Keel is
currently leaving on the table by hiding it behind a data shape. `Badge`,
`Alert`, `Spinner`, and `Avatar` were also checked and have no equivalent
gap — they're simple, single-purpose components where a flat prop API is
already the right fit, not a limitation.

## Cross-component conventions

Keel's stated convention is `aria-disabled`, never native `disabled`, on
every interactive component — because a natively disabled element leaves
the tab order entirely, so a screen-reader user sweeping the page never
learns the control exists (`packages/specs/src/types.ts:110-113`). This is
a genuinely good, deliberate choice. But the codebase's actual behavior
splits cleanly into two groups, and the split maps exactly onto both a real
functional defect and a documentation gap:

| Component | Root element | `aria-disabled` reaches the DOM? | `disabled` prop JSDoc |
|---|---|---|---|
| Button | `<button>` (`Button.tsx:82`) | Yes | Full explanation (`Button.tsx:28-36`) |
| TextField | `<input>` (`TextField.tsx:66`) | Yes | — |
| Select | root `<div>` (`Select.tsx:72`), trigger is `AriaButton` (`Select.tsx:99-102`) | Yes | — |
| Checkbox | `<label>` (`Checkbox.tsx:51`, via React Aria's `AriaCheckbox`) | **No** | Bare `@default false` (`Checkbox.tsx:18-19`) |
| Switch | `<label>` (`Switch.tsx:47`, via `AriaSwitch`) | **No** | Bare `@default false` (`Switch.tsx:18-19`) |
| RadioGroup | per-option `AriaRadio`, also `<label>`-rooted (`RadioGroup.tsx:97-102`) | **No** | Bare `@default false` (`RadioGroup.tsx:36-37`) |
| ThemeToggle | `<label>` (via `AriaSwitch`, `ThemeToggle.tsx:107-114`) | **No** | Bare `@default false` (`ThemeToggle.tsx:26-27`) |

This is the known defect recorded in root `CLAUDE.md` — `<Checkbox disabled>`
renders fully focusable and operable, because React Aria Components filters
`aria-disabled` as an unrecognized prop on these specific primitives while
Keel's own `onChange`-guard logic (e.g. `Checkbox.tsx:64-67`,
`ThemeToggle.tsx:93-104`) is the *only* thing actually preventing the
callback from firing — and in the uncontrolled case, React Aria still
flips its own internal selected state regardless, so the control visibly
toggles with no error, no warning, and no signal to the consumer that
anything is wrong.

**What the code itself reveals about the root cause:** every affected
component shares one structural trait the three working components don't —
their interactive root is a React Aria Components primitive that renders as
a `<label>` wrapping a hidden native input (`AriaCheckbox`, `AriaRadio`,
`AriaSwitch`), rather than a real `<button>` (confirmed for Select's
trigger too — it's an `AriaButton`, `Select.tsx:99-102`). `aria-disabled` is
a recognized state attribute on a widget role; it appears to be silently
dropped as an unrecognized prop on these library-internal `<label>` roots.
Button, the one component the spec itself calls out as built first and
deliberately ("Button is the first component on purpose", with everything
after it "comparatively mechanical" — `packages/specs/src/button.ts:4,8-10`),
is also the only
component of the seven whose own `disabled` prop documents *why* it's
`aria-disabled` rather than native. The other four inherited the pattern
without the reasoning attached to it in the code a consumer actually
reads — and, it turns out, without it actually working.

**Benchmark:** Radix UI Primitives take the same position — `aria-disabled`
managed automatically from a `disabled` prop, with a `[data-disabled]`
attribute exposed separately for styling (confirmed via web search of
Radix's accessibility and Select documentation, September 2026). This is
worth stating plainly: Keel's convention isn't an idiosyncratic choice, it
matches how a widely-used, respected library in the same space does it.
The finding above is entirely about the four-component implementation gap
and the documentation gap, not about the convention itself being wrong.

**Why this matters more than a typical bug:** the *convention* (aria-disabled,
never native) is documented for a consumer who reaches it — root
`README.md`'s "Accessibility decisions" section states it plainly (see
Theming API section below for the full README review), and
`packages/react/package.json:68`'s `homepage` field points at it via
GitHub. But that requires a consumer to click through from npm to GitHub;
nothing in the published package itself (no README ships in the
`@keel/react` tarball — see Entry points section) or in an IDE tooltip says
it for four of the seven components. And the *defect* — that the
convention silently does nothing on those four — is documented nowhere a
consumer would ever see it: only in root `CLAUDE.md`, a file written as
instructions for an AI coding agent, not consumer documentation, and one
that never ships with the package either way. A consumer who reads
`Checkbox`'s bare `disabled?: boolean` in their editor, and even one who
read the README's accessibility section, has no way to learn this specific
prop is currently non-functional short of writing an integration test that
checks the rendered DOM directly.

**Recommendation:** this is the single highest-priority item in this
analysis, and it's already the repo's own stated next priority — fixing it
is an accessibility correctness issue, not just a DX one. From a DX
standpoint specifically: once fixed, backfill the same explanatory JSDoc
Button already has onto `disabled` on Checkbox, RadioGroup, Switch, and
ThemeToggle, so the convention is visible at the call site instead of only
in a repo file the npm package never ships.

## TypeScript ergonomics

**Checked for drift risk between spec-declared options and consumer-facing
TS types — none found, across all twelve components.** Every variation-axis
type in `@keel/react` is derived from `@keel/specs` via an indexed-access
type, never hand-declared as an independent literal union:

```ts
export type ButtonSize = Spec['props']['size']['values'][number];
```

(`Button.tsx:12`; the identical pattern repeats for every sized/toned/
varianted prop across every component — confirmed via
`grep -n "= Spec\['props'\]" packages/react/src/*/*.tsx`, which returns 21
matches across all 12 components and zero components that instead
hand-write a literal union like `'sm' | 'md' | 'lg'` independently.) Because
`buttonSpec` is declared `as const satisfies ComponentSpec`
(`packages/specs/src/button.ts:89`), `values` is a readonly tuple of string
literals, and `['values'][number]` resolves to the exact literal union —
so a consumer typing `<Button size="` gets real autocomplete for `'sm'`,
`'md'`, `'lg'`, sourced from the one place those values are declared. If a
future spec adds a fourth size, every consuming component's TS type updates
automatically with no second edit required and no possibility of the type
and the spec disagreeing.

This is a stronger guarantee than the "spec is the source of truth" claim
in root `CLAUDE.md` might suggest to someone who hasn't read the
implementation — it isn't just a convention engineers are expected to
maintain by discipline, it's structurally enforced by the type system
itself. Nothing to fix here; noted so a later plan doesn't spend time
re-verifying it.

## Theming API

`packages/react/src/theme.ts` is a genuinely well-designed, framework-free
theming module — kept dependency-free on purpose so the future `@keel/angular`
package imports the same functions rather than re-implementing the storage
key, attribute name, and media query in a second place
(`theme.ts:1-9`). It exports `applyTheme`, `resolveTheme`, `systemTheme`,
`readStoredPreference`/`writeStoredPreference`, `initialTheme`, and
`themeInitScript` — the last of which even carries a working `@example`
usage snippet directly in its JSDoc (`theme.ts:80-81`) explaining the
flash-of-wrong-theme problem it solves and why it has to be a blocking
inline script rather than component logic (`theme.ts:71-78`).

**Root `README.md` documents day-one theming clearly** — a full "Theming"
section (`README.md:163-179`) shows the exact `themeInitScript()` +
`<ThemeToggle />` pairing needed, and a separate "Accessibility decisions"
section (`README.md:181-186`) explicitly documents the `aria-disabled`
convention this analysis's Cross-component conventions section discusses.
**This corrects a claim in that section** — I initially found no
consumer-facing documentation of the convention because I checked
`apps/workbench/build.js` and `docs/` but not the root README; the README
does state it plainly. The open question is not *whether* it's documented,
but *where* — see the Entry points section below, because this document
lives at the monorepo root, not inside the `@keel/react` package itself.

**What's answered vs. not, for the two questions this section set out to
check:**

- *"How do I get light/dark theming working?"* — answered clearly, by both
  the code's own JSDoc and the README.
- *"How do I override one semantic color for my brand?"* — **not
  answered.** The README's re-theming story (`README.md:94-96`) is about
  editing `packages/tokens/seeds.json` and rebuilding the token package
  from source — i.e., forking or contributing to Keel itself, not something
  a consumer of the published `@keel/tokens` package does from their own
  app. Since components reference semantic roles as ordinary CSS custom
  properties (`--keel-color-bg-accent`, per root `CLAUDE.md`'s stated
  convention), a consumer overriding that variable in their own stylesheet
  after Keel's CSS loads should work by normal CSS cascade rules — but this
  isn't stated or demonstrated anywhere, so it's an undocumented and
  untested path rather than a confirmed one either way.

**Benchmark:** shadcn/ui's theming documentation is a direct example of
what's missing — it walks a consumer through opening their own CSS file,
finding a specific semantic variable (its equivalent of
`--keel-color-bg-accent`), and overriding it directly, with generator tools
built around exactly that workflow (confirmed via web search of shadcn/ui's
theming docs, September 2026). This is a small, cheap thing to add and
there's a concrete pattern to model it on.

**Recommendation:** add a short, explicit "overriding one token" example to
whatever documentation ships with the package (see Entry points) —
something as small as showing a consumer setting
`:root { --keel-color-bg-accent: ... }` in their own CSS after Keel's
stylesheet — so brand customization doesn't require understanding that the
five-seed re-theming story is a different, source-level operation aimed at
a different audience.

## Entry points

A Keel consumer's install is two packages: `npm install @keel/react
@keel/tokens` (`README.md:8`), with `@keel/tokens` declared as a
peer dependency of `@keel/react` (`packages/react/package.json` —
`peerDependencies: { "@keel/tokens": "^0.1.0", ... }`, captured earlier in
this audit). React Aria Components — the library Keel wraps — installs as
a single package (`npm install react-aria-components`) with no separate
peer package, and ships intentionally unstyled, leaving all visual styling
to the consumer (confirmed via web search of Adobe's React Aria
documentation and npm listing, September 2026).

**This is a real difference in install shape, but not a finding to fix —
it's the correct tradeoff given Keel's stated thesis.** React Aria can be
a single package precisely because it has no opinion on visual styling;
Keel's entire value proposition is the opposite — a shared, framework-
agnostic token layer is what makes `@keel/angular` (Phase 3) possible
without a second, drifting copy of the color/spacing/typography decisions.
Collapsing `@keel/tokens` into `@keel/react` would save one line in an
install command at the cost of the exact thing the project exists to
prove. Stated explicitly as a non-finding: two packages is the right
number here, not a DX defect to streamline away.

What *is* a real gap, and ties together findings from every section above:
neither `packages/react/package.json` nor `packages/tokens/package.json`
declares a package-level README (`files: ["dist"]` in both, confirmed
earlier — no README.md exists in either package's own directory). Both
packages' `homepage` field points to
`https://github.com/doosemavis/keel#readme` — the *monorepo root* README,
which is excellent (see Theming API section) but requires a consumer to
leave npm and go to GitHub to find it. The published tarballs will ship
with no README at all, and the npm registry pages for `@keel/react` and
`@keel/tokens` will show npm's default "no readme" state regardless of how
good the root document is.

**Recommendation:** copy (or symlink at publish time) the root `README.md`
— or a package-scoped excerpt of it — into `packages/react/` and
`packages/tokens/` before publishing, so the documentation that already
exists and already answers most of a first-time consumer's questions
actually ships with the thing they installed. This is a packaging/build
concern more than an API one, so it's flagged here for the separate npm
packaging hardening workstream to pick up, rather than acted on in this
analysis-only cycle.

## Discoverability (Workbench, cold-start read)

`grep -in "npm install\|npm i \|getting started\|installation"
apps/workbench/build.js` returns zero matches. Workbench's nav is exactly
three sections — `Foundations`, `Verification`, `Components`
(`apps/workbench/build.js:589-593`, confirmed in an earlier review this
session) — all reference material: token tables, the live contrast report,
and a component gallery with playgrounds. There is no install step,
no "add this to your project" copy-paste block, and no mention of
`npm install` anywhere in the page.

**This is appropriate scope for what Workbench is, not a gap in
Workbench itself.** Root `CLAUDE.md` calls it "the docs page... generated
from BUILT artifacts, so it cannot drift" — its entire design is to be a
live specimen of the system, verified against real compiled output. Adding
hand-written onboarding prose would be the one thing in Workbench that
*could* drift from reality, which cuts against its whole reason for
existing. It's correctly scoped as a reference, not a tutorial — the two
have different jobs and this repository already has a place for the
tutorial job: the root README, covered above.

**The actual gap is upstream of Workbench, not inside it:** a consumer who
finds Workbench first (e.g., because it's more discoverable than a GitHub
README, or linked directly) lands in the middle of a reference with no
link back to "here's how to install this." A single "Install" link in the
`appbar-nav` (`apps/workbench/build.js:589-593`) pointing at the README's
install section would close this without asking Workbench to become
something it isn't.

## Appendix: component-specific outliers

- **`TextField` uses a different (arguably more robust) technique for the
  same disabled/readonly problem.** Instead of relying solely on the
  `aria-disabled` spread + `onChange`-guard pattern every other component
  uses, `TextField` passes `isReadOnly={readOnly || disabled}` directly to
  `AriaTextField` (`TextField.tsx:76`) — using React Aria's own read-only
  semantics rather than working around `isDisabled`. This works because
  `TextField`'s primitive renders a real `<input>`, where `isReadOnly` is a
  meaningful native concept; it isn't necessarily portable to the
  `<label>`-rooted toggle components, but it's worth knowing this
  alternative approach exists in the codebase already when the
  aria-disabled defect gets fixed — it may generalize better than patching
  the existing pattern for some of the four affected components.

## Checked, and already good

Recorded explicitly so a future implementation plan doesn't re-spend time
verifying these:

- **The `@keel/specs` subpath-import design** (not a static property on
  each component) is a deliberate, measured bundle-size tradeoff, and the
  reasoning is recorded in code (`packages/react/src/specs.ts:1-35`). See
  The spec contract.
- **No boolean-prop-proliferation anti-pattern exists anywhere in the
  twelve components.** Multiple booleans on `TextField` and `Select` are
  independent flags, not interacting modes. See Composition style.
- **Zero TypeScript drift risk between `@keel/specs` and `@keel/react`.**
  All 21 variation-axis types across all 12 components are derived from
  the spec via indexed-access types, never hand-declared independently.
  See TypeScript ergonomics.
- **The two-package install (`@keel/react` + `@keel/tokens`) is the
  correct tradeoff**, not a DX defect — it's what makes the future
  `@keel/angular` package possible without a second, drifting copy of the
  token layer. See Entry points.
- **`Badge`, `Alert`, `Spinner`, and `Avatar` have no composition gap** —
  they're simple, single-purpose components where a flat prop API is
  already the right fit. See Composition style.
- **The `aria-disabled`-over-native convention itself is sound and
  industry-consistent** — Radix UI Primitives take the same position. The
  finding in this analysis is entirely about the four-component
  implementation gap and documentation gap, not the convention. See
  Cross-component conventions.
