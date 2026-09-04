# Design: `@keel/react` DX/API analysis

## Context

This is the first of three workstreams requested together: a DX/API analysis
of `@keel/react`, an accessibility compliance pass, and npm packaging
hardening. They're being run as separate spec → plan → build cycles rather
than one pass, so nothing gets rushed and the existing gates (contrast, token
discipline, spec conformance) stay intact. This spec covers only the DX/API
analysis.

## Goal

Produce a written analysis of how a senior engineer would evaluate and
improve `@keel/react`'s public API for intuitiveness, from the perspective of
a developer consuming it via npm. **No code changes** — this is a findings
and recommendations document that a later plan/build cycle would act on.

## Audience assumption

Optimizing for **external npm consumers**: developers who've never seen Keel
before, discovering it cold via its published package and docs. This matches
the repo's stated state — no npm org, nothing ever published, zero existing
consumers to preserve compatibility for. (Assumption stated explicitly so it
can be corrected; no response was given when asked directly.)

## Method

Cross-cutting, top-down structure rather than a component-by-component
checklist — so the output is a prioritized set of root causes, not twelve
repetitions of the same finding. Themes to examine:

- The `@keel/specs` contract as the de facto API surface (how prop shape,
  defaults, and `attribute` mappings are declared once and consumed by both
  React and Workbench)
- Cross-component conventions: `aria-disabled` vs native `disabled`,
  `aria-busy` vs React Aria's `data-pending`, naming patterns
- Composition style: flat props vs compound components, slot/children
  conventions
- TypeScript ergonomics: how well types guide autocomplete and catch misuse
  at the call site
- Theming/token consumption API: how a consumer applies or overrides
  semantic roles
- Export/entry-point structure (`.`, `./styles.css`, `./specs`, etc.) and
  what a consumer's first `import` looks like
- Documentation/discoverability via Workbench, from a cold-start read

Each theme is benchmarked against **React Aria Components** specifically,
since Keel wraps it directly — the most relevant comparison for "what
friction did Keel add on top of its own foundation." Lighter reference to
Radix UI and shadcn/ui for broader market expectations of "intuitive"
component-library DX.

Findings are grounded with concrete before/after examples pulled from a
handful of representative components (not an exhaustive pass over all
twelve); a short appendix notes any component-specific outliers found along
the way.

## Output

A single markdown document (`docs/react-dx-api-analysis.md`) containing:

1. Executive summary (top 3-5 findings, ranked by impact)
2. Themed findings, each with: current behavior, why it creates friction for
   a cold-start consumer, concrete example, recommendation
3. Appendix: component-specific outliers that don't fit a theme
4. Explicit non-findings — things checked and found already good, so a later
   plan doesn't waste time re-verifying them

## Out of scope

- Any code changes (this cycle produces analysis only)
- Accessibility audit (separate workstream — already has a documented known
  defect and open-work priority in `CLAUDE.md`)
- npm packaging hardening (separate workstream — most of the mechanical
  scaffolding already exists; that cycle verifies and closes gaps)
- Pushing anything to the remote (nothing here changes code)
