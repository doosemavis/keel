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

