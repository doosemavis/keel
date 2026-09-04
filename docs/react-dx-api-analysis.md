# `@keel/react` DX/API Analysis

Findings and recommendations on `@keel/react`'s public API, evaluated from
the perspective of a developer discovering Keel for the first time via npm.
See `docs/superpowers/specs/2026-09-04-react-dx-api-analysis-design.md` for
scope and method.

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

**Why this matters more than a typical bug:** a consumer who reads
`Checkbox`'s `disabled?: boolean` in their editor gets zero indication this
prop behaves differently from every other component with the same name in
the same package. Root `CLAUDE.md` documents the defect precisely — but
`CLAUDE.md` is a repo file, not something that ships in the npm package or
appears in an IDE tooltip. A first-time consumer has no way to discover
either the convention or its silent failure short of writing an integration
test that checks the DOM directly.

**Recommendation:** this is the single highest-priority item in this
analysis, and it's already the repo's own stated next priority — fixing it
is an accessibility correctness issue, not just a DX one. From a DX
standpoint specifically: once fixed, backfill the same explanatory JSDoc
Button already has onto `disabled` on Checkbox, RadioGroup, Switch, and
ThemeToggle, so the convention is visible at the call site instead of only
in a repo file the npm package never ships.
