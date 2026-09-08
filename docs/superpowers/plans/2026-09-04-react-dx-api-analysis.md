# `@keel/react` DX/API Analysis Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produce `docs/react-dx-api-analysis.md`, a written findings-and-recommendations
document evaluating `@keel/react`'s public API from the perspective of a
first-time external npm consumer.

**Architecture:** This plan produces a document, not code, so there is no
TDD red/green cycle. Each task instead has a **verification step**: a
specific grep/read command that must confirm every code citation in that
task's draft section is accurate. That's the analog of a test here — a
false or stale citation is the failure mode this plan guards against.

**Tech Stack:** N/A (research/writing task over the existing `@keel/react`,
`@keel/specs`, and `apps/workbench` sources).

## Global Constraints

- Audience is external npm consumers with zero prior Keel context (per
  `docs/superpowers/specs/2026-09-04-react-dx-api-analysis-design.md`).
- No code changes in this cycle — findings and recommendations only.
- Primary benchmark is React Aria Components (Keel wraps it directly);
  Radix UI and shadcn/ui are secondary reference points.
- Every finding must cite an exact file and line from the current source,
  not a paraphrase or memory of it.
- Apply `vercel-composition-patterns` rules 1.1 (avoid boolean prop
  proliferation) and 1.2 (compound components) explicitly when auditing
  composition style.

---

### Task 1: Audit the `@keel/specs` contract as the API surface

**Files:**
- Read: `packages/specs/src/types.ts`
- Read: `packages/specs/src/button.ts`, `packages/specs/src/checkbox.ts`
- Read: `packages/react/src/specs.ts`
- Modify: `docs/react-dx-api-analysis.md` (create, add "The spec contract" section)

**Interfaces:**
- Produces: a written subsection titled "The spec contract" with 1+ concrete
  findings, each citing `file:line`.

- [ ] **Step 1: Extract the spec type shape**

Read `packages/specs/src/types.ts` in full. List every field on the
`ComponentSpec`/`SpecProp`-style types (exact names as declared).

- [ ] **Step 2: Compare two real specs side by side**

Run:
```bash
grep -n "attribute:" packages/specs/src/*.ts
```
Read `packages/specs/src/button.ts` and `packages/specs/src/checkbox.ts` in
full. Note every place `attribute: 'native'` vs a renamed value (e.g.
`'data-theme-value'`) appears, with line numbers.

- [ ] **Step 3: Check how `@keel/react/specs` is exposed to consumers**

Read `packages/react/src/specs.ts` in full — is it a direct re-export of
`@keel/specs`, or does it transform the data? Cross-check the `./specs`
entry in `packages/react/package.json`'s `exports` map (already captured:
`types: ./dist/specs.d.ts`, `default: ./dist/specs.js`).

- [ ] **Step 4: Draft the section**

Write "The spec contract" in `docs/react-dx-api-analysis.md`: what a
consumer sees if they `import { specs } from '@keel/react/specs'`, whether
the package's public docs (Workbench, README) explain this is a *public,
importable introspection API* rather than an internal test fixture, and
whether shipping it as a public export without that framing creates
confusion about what it's for.

- [ ] **Step 5: Verify citations**

Re-run the Step 2 grep and re-open each cited line; confirm every `file:line`
reference in the drafted section still matches current source exactly.

- [ ] **Step 6: Commit**

```bash
git add docs/react-dx-api-analysis.md
git commit -m "docs: DX analysis - spec contract section"
```

---

### Task 2: Audit cross-component ARIA/state conventions

**Files:**
- Read: all of `packages/react/src/*/*.tsx`
- Read: root `CLAUDE.md` "Known defects" section (already in context)
- Modify: `docs/react-dx-api-analysis.md` (add "Cross-component conventions" section)

**Interfaces:**
- Consumes: nothing from Task 1.
- Produces: a written subsection with a table of component → convention used.

- [ ] **Step 1: Tabulate the convention per component**

Run:
```bash
grep -n "aria-disabled\|disabled=\|aria-busy\|data-pending" packages/react/src/*/*.tsx
```
Build a table: component name → which of `aria-disabled` / native
`disabled` / `aria-busy` / `data-pending` it uses, with line numbers.

- [ ] **Step 2: Cross-reference the known defect**

Confirm the exact components affected by the `aria-disabled`-not-reaching-
the-DOM defect (Checkbox, RadioGroup, Switch, ThemeToggle per
`CLAUDE.md`) by reading their `.tsx` files and finding where `aria-disabled`
is spread onto a React Aria Components root.

- [ ] **Step 3: Check consumer-facing documentation of the convention**

Run:
```bash
grep -rn "aria-disabled" apps/workbench/build.js docs/ 2>/dev/null
```
Determine whether "Keel uses `aria-disabled`, never native `disabled`" is
explained anywhere a consumer would actually read it, or only in
`CLAUDE.md` (which ships with the repo, not the npm package).

- [ ] **Step 4: Draft the section**

Write "Cross-component conventions": state the convention, why it exists
(native `disabled` removes focus + suppresses the description explaining
unavailability), where it's silently violated today (the known defect),
and — since `CLAUDE.md` never ships to `npm`— whether a first-time consumer
has any way to learn this convention before hitting the defect themselves.

- [ ] **Step 5: Verify citations**

Re-run both greps from Steps 1 and 3; confirm line numbers match.

- [ ] **Step 6: Commit**

```bash
git add docs/react-dx-api-analysis.md
git commit -m "docs: DX analysis - cross-component conventions section"
```

---

### Task 3: Audit composition style against `vercel-composition-patterns`

**Files:**
- Read: `packages/react/src/Button/Button.tsx`
- Read: `packages/react/src/TextField/TextField.tsx`
- Read: `packages/react/src/Select/Select.tsx`
- Read: `packages/react/src/Card/Card.tsx`
- Modify: `docs/react-dx-api-analysis.md` (add "Composition style" section)

**Interfaces:**
- Produces: a subsection with before/after code samples using real Keel
  prop names (not the skill's placeholder `Composer` example).

- [ ] **Step 1: Count boolean props per component**

Run:
```bash
grep -n "boolean" packages/react/src/Button/Button.tsx packages/react/src/TextField/TextField.tsx packages/react/src/Select/Select.tsx packages/react/src/Card/Card.tsx
```

- [ ] **Step 2: Read each file in full**

Read all four files listed above. For each, note: is there any place a
boolean prop switches structurally different output (e.g., `Card`'s
`interactive` prop switching the root tag between `button` and `div`, per
`renderers.js:169-171` mirroring `packages/react/src/Card/Card.tsx`)?

- [ ] **Step 3: Apply rule 1.1 (boolean prop proliferation)**

For any component with 2+ interacting booleans, write the "incorrect"
pattern as it exists in Keel today (exact prop names, exact file:line),
then the composed/explicit-variant alternative, following the shape of
`vercel-composition-patterns` rule 1.1 but using Keel's real names.

- [ ] **Step 4: Apply rule 1.2 (compound components)**

Determine whether any current component (e.g., `Select` with its popover/
list/option structure) would benefit from exposing subparts (e.g.,
`Select.Option`) rather than the current flat-prop/generated-options
approach. Note this only if the audit finds a real ergonomics cost — don't
force the pattern where flat props are already the better fit (e.g., a
`Badge` has no reason to be compound).

- [ ] **Step 5: Draft the section**

Write "Composition style" with findings from Steps 3-4, explicit about
which components are fine as-is (a non-finding is still a finding worth
stating, per the design doc's "explicit non-findings" requirement).

- [ ] **Step 6: Verify citations**

Re-open each of the four files and confirm every prop name and line number
cited in the drafted section is exact.

- [ ] **Step 7: Commit**

```bash
git add docs/react-dx-api-analysis.md
git commit -m "docs: DX analysis - composition style section"
```

---

### Task 4: Audit TypeScript ergonomics

**Files:**
- Read: `packages/specs/src/types.ts` (already read in Task 1)
- Read: `packages/react/src/Button/Button.tsx`, `packages/react/src/Select/Select.tsx`
- Modify: `docs/react-dx-api-analysis.md` (add "TypeScript ergonomics" section)

**Interfaces:**
- Consumes: the `SpecProp` field list from Task 1, Step 1.
- Produces: a subsection on type-safety and autocomplete quality.

- [ ] **Step 1: Check whether prop unions are declared once or twice**

Run:
```bash
grep -n "'sm'\|'md'\|'lg'" packages/specs/src/button.ts packages/react/src/Button/Button.tsx
```
Determine whether the size union (`'sm' | 'md' | 'lg'`, or whatever the
actual values are) is declared as a TS type in `Button.tsx` independently
of the string list in the spec, or whether one derives from the other.

- [ ] **Step 2: Repeat for `Select`**

Run the same check against `packages/specs/src/select.ts` and
`packages/react/src/Select/Select.tsx` for the `size` and any option-shape
types.

- [ ] **Step 3: Draft the section**

Write "TypeScript ergonomics": state whether there's drift risk between
spec-declared string options and the TS union types consumers actually get
autocomplete from (i.e., could someone add a new spec option without the
TS type ever being updated, silently breaking the "spec is the one source
of truth" claim in root `CLAUDE.md`), with exact file:line evidence either
way.

- [ ] **Step 4: Verify citations**

Re-run both greps from Steps 1-2; confirm findings still hold.

- [ ] **Step 5: Commit**

```bash
git add docs/react-dx-api-analysis.md
git commit -m "docs: DX analysis - TypeScript ergonomics section"
```

---

### Task 5: Audit the theming/token consumption API

**Files:**
- Read: `packages/react/src/theme.ts`
- Read: `packages/react/src/styles.css` (header comment + first 40 lines)
- Modify: `docs/react-dx-api-analysis.md` (add "Theming API" section)

**Interfaces:**
- Produces: a subsection answering "what does a consumer do on day one to
  theme Keel, and how do they override one semantic color?"

- [ ] **Step 1: List theme.ts's public surface**

Read `packages/react/src/theme.ts` in full. List every exported symbol
(cross-check against the re-export list already seen in
`packages/react/src/index.ts`: `applyTheme`, `initialTheme`, `resolveTheme`,
`systemTheme`, `readStoredPreference`, `writeStoredPreference`,
`themeInitScript`, `THEME_ATTRIBUTE`, `THEME_STORAGE_KEY`).

- [ ] **Step 2: Check for consumer-facing theming docs**

Run:
```bash
find /Users/moosedavis/dev/keel -iname "readme*" -not -path "*/node_modules/*"
```
Read any `README.md` found under `packages/react` or `packages/tokens`. If
none exists, that's itself a finding.

- [ ] **Step 3: Draft the section**

Write "Theming API": walk through, step by step, what a brand-new consumer
would need to do to (a) get light/dark theming working via `theme.ts`'s
exports, and (b) override one semantic color token for their brand. State
plainly whether they can do this from published docs alone or would need
to read `packages/tokens/src/primitive/color.json` or Workbench's rendered
output to reverse-engineer variable names.

- [ ] **Step 4: Verify citations**

Confirm the exported-symbol list matches `theme.ts` exactly and the
find/read results are accurately represented.

- [ ] **Step 5: Commit**

```bash
git add docs/react-dx-api-analysis.md
git commit -m "docs: DX analysis - theming API section"
```

---

### Task 6: Audit entry-point structure vs. React Aria Components

**Files:**
- Read: `packages/react/package.json` (`exports` map — already captured)
- Read: `packages/tokens/package.json`
- Modify: `docs/react-dx-api-analysis.md` (add "Entry points" section)

**Interfaces:**
- Produces: a subsection comparing Keel's two-package install requirement
  (`@keel/react` + `@keel/tokens`) to single-package alternatives.

- [ ] **Step 1: Re-examine Keel's exports map**

Confirm current `packages/react/package.json` `exports` field: `.`,
`./styles.css`, `./components.css`, `./specs`, `./package.json`. Read
`packages/tokens/package.json`'s `exports`/`main`/`types` fields the same
way.

- [ ] **Step 2: Research React Aria Components' entry-point convention**

Use `WebFetch` on `https://www.npmjs.com/package/react-aria-components` (or
Context7 docs for `react-aria-components` if available) to check: is it a
single package with no separate peer "tokens" package? How does a consumer
apply base styling out of the box (unstyled by design) versus Keel
(pre-styled, requires the tokens package)?

- [ ] **Step 3: Draft the section**

Write "Entry points": state the exact install command a Keel consumer needs
(`npm i @keel/react @keel/tokens react react-dom`) versus React Aria's
single-package install, and assess honestly whether the two-package split
is a real DX cost or a justified tradeoff given Keel's stated multi-
framework thesis (tokens must be framework-agnostic to support the future
`@keel/angular`). Don't recommend collapsing the packages if the thesis
depends on the split — say so explicitly as a non-finding with reasoning.

- [ ] **Step 4: Verify citations**

Re-open both `package.json` files; confirm the `exports` fields quoted
match exactly.

- [ ] **Step 5: Commit**

```bash
git add docs/react-dx-api-analysis.md
git commit -m "docs: DX analysis - entry points section"
```

---

### Task 7: Audit cold-start discoverability via Workbench

**Files:**
- Read: `apps/workbench/dist/index.html` (post-fix build from this session)
- Read: relevant sections of `apps/workbench/build.js`
- Modify: `docs/react-dx-api-analysis.md` (add "Discoverability" section)

**Interfaces:**
- Produces: a subsection on whether a cold-start consumer can get from
  "found the Workbench page" to "installed and rendered one component."

- [ ] **Step 1: Check for install/getting-started content**

Run:
```bash
grep -in "npm install\|npm i \|getting started\|installation" apps/workbench/build.js
```

- [ ] **Step 2: Re-read the page's section list**

From the nav already seen at `apps/workbench/build.js` (`Foundations`,
`Verification`, `Components`), confirm whether any section addresses
installation/setup versus purely reference material (tokens, contrast
report, component gallery).

- [ ] **Step 3: Draft the section**

Write "Discoverability": Workbench is a strong *reference* (live,
drift-proof component gallery) but assess whether it also functions as
*onboarding* for someone who has never installed the package. If Step 1
finds no install instructions, state that as the finding — a consumer
would need to infer the install command from `package.json` naming
conventions alone.

- [ ] **Step 4: Verify citations**

Re-run the Step 1 grep; confirm the section list matches current
`build.js`.

- [ ] **Step 5: Commit**

```bash
git add docs/react-dx-api-analysis.md
git commit -m "docs: DX analysis - discoverability section"
```

---

### Task 8: Benchmark research (React Aria Components, Radix UI, shadcn/ui)

**Files:**
- Modify: `docs/react-dx-api-analysis.md` (fold benchmark callouts into
  Tasks 2, 5, 6's sections — no new top-level section)

**Interfaces:**
- Consumes: draft sections from Tasks 2, 5, 6.
- Produces: inline "compared to X" callouts added to those sections.

- [ ] **Step 1: Research disabled-state conventions**

Use `WebSearch`/`WebFetch` to check how Radix UI and shadcn/ui expose
disabled state to consumers (native `disabled` prop, or ARIA-only like
Keel). Add a one-line comparison to Task 2's section.

- [ ] **Step 2: Research theming conventions**

Check how Radix UI (CSS variables / data-attributes) and shadcn/ui (Tailwind
class overrides, copy-in component source) let a consumer restyle a single
token/color. Add a one-line comparison to Task 5's section.

- [ ] **Step 3: Research install/entry-point conventions**

Confirm React Aria Components' single-package install (from Task 6, Step 2)
and check shadcn/ui's copy-in-source model (no npm package at all for
components) as a contrasting philosophy. Add comparisons to Task 6's
section.

- [ ] **Step 4: Verify additions don't overstate certainty**

Re-read each added callout — since these are based on public docs read
once, phrase them as "X does Y" only when directly confirmed by the fetched
source, not inferred.

- [ ] **Step 5: Commit**

```bash
git add docs/react-dx-api-analysis.md
git commit -m "docs: DX analysis - add benchmark comparisons"
```

---

### Task 9: Synthesize the final document

**Files:**
- Modify: `docs/react-dx-api-analysis.md` (add executive summary + appendix
  + non-findings; reorder if needed)

**Interfaces:**
- Consumes: all sections drafted in Tasks 1-8.
- Produces: the complete, final analysis document.

- [ ] **Step 1: Rank findings for the executive summary**

Read through all drafted sections. Pick the 3-5 highest-impact findings
(impact = how much friction it costs a first-time consumer, not how easy
the fix is). Write a short executive summary at the top of the document
listing them in priority order, each with a one-line "why it matters."

- [ ] **Step 2: Write the appendix**

Add an "Appendix: component-specific outliers" section for any finding from
Tasks 1-7 that didn't fit a theme (e.g., something unique to one component
noticed along the way).

- [ ] **Step 3: Write explicit non-findings**

Add a "Checked, and already good" section listing things verified during
this audit that don't need follow-up (e.g., if Task 4 found no TS drift
risk, say so here explicitly) — per the design doc, this saves a future
implementation plan from re-verifying settled questions.

- [ ] **Step 4: Full self-review pass**

Read the entire assembled document top to bottom. For every `file:line`
citation, re-open that exact location and confirm it still matches (source
files were not modified during this plan, so this should be a clean pass —
treat any mismatch as a plan bug to fix immediately).

- [ ] **Step 5: Final commit**

```bash
git add docs/react-dx-api-analysis.md
git commit -m "docs: complete @keel/react DX/API analysis"
```
