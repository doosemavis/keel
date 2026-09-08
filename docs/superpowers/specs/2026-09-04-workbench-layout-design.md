# Design: Workbench shell layout redesign

## Context

Part of the same decomposed request as the color palette redesign (separate
spec). This covers only `apps/workbench`'s page shell/layout — not its
colors (that's the palette spec) and not component content.

## Problem with the current shell

`apps/workbench/build.js:413` centers everything in a single `.wrap` grid
(`max-width: 1240px; margin: 0 auto;`) containing a 216px left rail and the
content column. On any screen wider than ~1240px, this leaves large,
unused margins on both sides, and the rail never actually reaches the
viewport's left edge — it's pinned to the edge of the centered column
instead. Validated via wireframe comparison in the brainstorming visual
companion; user selected the third of three proposed directions.

## The new shell: three columns

1. **Left rail** — pinned near the true left viewport edge (small,
   consistent gutter only — not centered as part of a max-width column).
   Keeps its current content (Foundations / Verification / Components
   section links).
2. **Main content** — expands to fill nearly all remaining width, with
   only a small consistent side gutter, rather than being capped at
   1240px. Token tables and component preview matrices get materially
   more room on wide monitors.
3. **Right rail — "on this page"** — new. Shows sub-navigation for
   whatever is currently in view. Because Workbench is one long page (not
   multi-page routing) with the left rail already covering top-level
   sections, the right rail's job is one level down: as a component
   section scrolls into view, it lists that component's own
   sub-headings (variants, sizes, states, accessibility notes — whatever
   the component's actual subsections are), scroll-spying to track which
   section is active the way the left rail's `:target`/scroll behavior
   already implies.

## Responsive behavior

Extending the existing breakpoint approach (`@media (max-width: 900px)`
collapses the current single rail; `760px` hides `.appbar-nav`) rather than
inventing a new scheme:
- The new right "on this page" rail is the first thing to drop, since it's
  the least essential of the three columns — hide it below roughly
  **1200px**, before the existing 900px breakpoint where the left rail
  itself already collapses.
- Below 900px, behavior stays as it is today: left rail goes static/
  stacked, single-column reading order.

## Out of scope for this spec

- Exact pixel breakpoints and CSS grid/flex implementation (implementation
  work for the plan)
- Any color changes (separate palette spec)
- Content/copy changes within Workbench sections
