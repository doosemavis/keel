# Workbench Shell Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace `apps/workbench`'s centered, max-width-capped page shell
with an edge-pinned left rail, expansive main content, and a new
scroll-spy right rail listing the active section's own subheadings.

**Architecture:** `apps/workbench/build.js` renders one big static HTML
string with an inline `<style>` block and a `<script>` IIFE block at the
end. All changes in this plan are edits to that one file — CSS grid changes
for the shell, one new `<aside>` in the body markup, and one new IIFE
appended to the existing script for the scroll-spy behavior. No new files.

**Tech Stack:** Vanilla JS (`IntersectionObserver`), CSS Grid. No
framework — Workbench is a self-contained generated HTML file by design.

## Global Constraints

- No color changes in this plan (separate palette-redesign plan).
- Preserve existing breakpoint philosophy: `900px` is where the left rail
  already collapses to static/stacked; the new right rail must disappear
  *before* that, at `1200px`, since it's the least essential column (per
  `docs/superpowers/specs/2026-09-04-workbench-layout-design.md`).
- The right rail's content is generic (works for any `<section>` with
  `<h3>` children), not hardcoded to component sections specifically —
  Foundations/Verification sections also have their own `<h3>`s and should
  get the same treatment.

---

### Task 1: Edge-pin the shell, expand content width

**Files:**
- Modify: `apps/workbench/build.js:418` (`.wrap` rule)
- Modify: `apps/workbench/build.js:419` (existing 900px breakpoint)
- Modify: `apps/workbench/build.js:428` (`.appbar-inner` rule)

**Interfaces:** none — pure CSS, no HTML/JS interface change in this task.

- [ ] **Step 1: Update the `.wrap` grid**

In `apps/workbench/build.js`, find:
```css
.wrap { display: grid; grid-template-columns: 216px minmax(0, 1fr); gap: 40px; max-width: 1240px; margin: 0 auto; padding: 40px 28px 96px; }
```
Replace with:
```css
.wrap { display: grid; grid-template-columns: 216px minmax(0, 1fr) 200px; gap: 40px; padding: 40px clamp(24px, 4vw, 56px) 96px; }
```
(Dropping `max-width`/`margin: 0 auto` is what lets the rail sit near the
true viewport edge instead of the edge of a centered column. The third
`200px` column is for Task 3's right rail — added here so Task 1 and
Task 3 don't both touch this exact line.)

- [ ] **Step 2: Update the 900px breakpoint, add a 1200px one**

Find:
```css
@media (max-width: 900px) { .wrap { grid-template-columns: 1fr; gap: 24px; padding: 24px 18px 64px; } .rail { position: static !important; } }
```
Replace with:
```css
@media (max-width: 1200px) { .wrap { grid-template-columns: 216px minmax(0, 1fr); } .rail-right { display: none; } }
@media (max-width: 900px) { .wrap { grid-template-columns: 1fr; gap: 24px; padding: 24px 18px 64px; } .rail { position: static !important; } }
```

- [ ] **Step 3: Align the app bar to the same edge**

Find:
```css
.appbar-inner { max-width: 1240px; margin: 0 auto; padding: 0 28px; block-size: 58px; display: flex; align-items: center; gap: 28px; }
```
Replace with:
```css
.appbar-inner { padding: 0 clamp(24px, 4vw, 56px); block-size: 58px; display: flex; align-items: center; gap: 28px; }
```
(Same gutter formula as `.wrap`, so the brand/nav in the sticky app bar
lines up with the rail and content below it instead of being centered
independently.)

- [ ] **Step 4: Rebuild and check visually**

```bash
cd apps/workbench && node build.js
open dist/index.html
```
Confirm: the left rail now sits near the browser window's left edge (not
centered with large margins on both sides), and the page content extends
much closer to the right edge too. The third grid column will look like
unused empty space at this point — that's expected, Task 3 fills it.

- [ ] **Step 5: Commit**

```bash
cd /Users/moosedavis/dev/keel
git add apps/workbench/build.js
git commit -m "feat(workbench): edge-pin the shell and drop the centered max-width"
```

---

### Task 2: Give every subsection heading a stable, linkable id

**Files:**
- Modify: `apps/workbench/build.js` (script section, near the end of the
  `<script>` block)

**Interfaces:**
- Produces: every `<h3>` inside `<main>` gets an `id` attribute
  (`<section-id>-<slugified-heading-text>`) if it doesn't already have
  one. Task 3 depends on these ids existing before it queries for them.

- [ ] **Step 1: Locate the script's closing IIFE**

Read `apps/workbench/build.js` from around line 950 to the `</script>`
tag (the exact line numbers may have shifted slightly from earlier edits
this session — search for the last `})();` before `</script>` to find the
insertion point).

- [ ] **Step 2: Add the id-assignment IIFE**

Insert this new IIFE immediately before the closing `</script>` tag:

```js
// Every h3 inside a top-level <section> gets a stable, scoped id, so the
// "on this page" right rail (added below) can link and scroll to it.
// Scoped to the section's own id rather than global text, since sibling
// component sections reuse the same heading text (every component has a
// "Playground", "Matrix", "API" and "Accessibility" h3).
(function () {
  const slug = (s) =>
    s
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

  document.querySelectorAll('main > section').forEach((section) => {
    section.querySelectorAll('h3').forEach((h3) => {
      if (!h3.id) h3.id = `${section.id}-${slug(h3.textContent || '')}`;
    });
  });
})();
```

- [ ] **Step 3: Verify in the browser**

```bash
cd apps/workbench && node build.js && open dist/index.html
```
Open the browser devtools console and run:
```js
document.querySelectorAll('main > section h3')[0].id
```
Expected: a non-empty string like `semantic-<something>` or
`c-button-playground` (exact slug depends on that section's actual first
h3 text) — not empty, not `undefined`.

- [ ] **Step 4: Commit**

```bash
cd /Users/moosedavis/dev/keel
git add apps/workbench/build.js
git commit -m "feat(workbench): assign stable ids to section subheadings"
```

---

### Task 3: Add the "on this page" right rail with scroll-spy

**Files:**
- Modify: `apps/workbench/build.js` (CSS block, HTML body, script block)

**Interfaces:**
- Consumes: the `id`-bearing `<h3>` elements from Task 2.
- Produces: a `.rail-right` `<aside>` that repopulates its links whenever
  the active top-level section changes, and highlights whichever
  subheading is currently nearest the top of the viewport.

- [ ] **Step 1: Add the CSS**

Add immediately after the existing `.rail .rail-head { ... }` rule
(search for that exact rule to anchor the insertion, since earlier tasks
in this plan shift subsequent line numbers):

```css
.rail-right { position: sticky; top: 24px; align-self: start; font-size: 12.5px; }
.rail-right-head { font-size: 11px; text-transform: uppercase; letter-spacing: .09em; color: var(--wb-muted); padding: 0 10px 8px; font-weight: 600; }
.rail-right nav { display: flex; flex-direction: column; gap: 1px; }
.rail-right a { display: block; color: var(--wb-muted); text-decoration: none; padding: 5px 10px; border-radius: 5px; border-left: 2px solid transparent; }
.rail-right a:hover { color: var(--wb-accent); background: var(--wb-accent-soft); border-left-color: var(--wb-accent); }
.rail-right a.active { color: var(--wb-accent); border-left-color: var(--wb-accent); font-weight: 600; }
.rail-right a:focus-visible { outline: 2px solid var(--wb-accent); outline-offset: 1px; }
```

- [ ] **Step 2: Add the HTML**

Find (this is the `</main>` / `.wrap` closing pair):
```html
  </main>
</div>
```
Replace with:
```html
  </main>

  <aside class="rail rail-right">
    <div class="rail-right-head">On this page</div>
    <nav aria-label="On this page"></nav>
  </aside>
</div>
```

- [ ] **Step 3: Add the scroll-spy script**

Insert this new IIFE right after the id-assignment IIFE from Task 2 (so it
can rely on every `h3` already having an id):

```js
// "On this page" right rail: Workbench is one long page rather than
// per-page routing, so instead of a fixed table of contents this tracks
// which top-level section is currently in view and lists THAT section's
// own h3 subheadings — generic over any section, not hardcoded to
// components, since Foundations/Verification sections have h3s too.
(function () {
  const main = document.querySelector('main');
  const railNav = document.querySelector('.rail-right nav');
  if (!main || !railNav) return;

  const sections = Array.from(main.querySelectorAll(':scope > section'));
  if (!sections.length) return;

  let activeSection = null;

  function renderRailFor(section) {
    const heads = Array.from(section.querySelectorAll('h3'));
    railNav.innerHTML = heads
      .map((h) => `<a href="#${h.id}" data-h3-target="${h.id}">${h.textContent}</a>`)
      .join('');
  }

  function updateActiveLink() {
    if (!activeSection) return;
    const heads = Array.from(activeSection.querySelectorAll('h3'));
    if (!heads.length) return;
    const threshold = window.scrollY + 96;
    let current = heads[0];
    for (const h of heads) {
      if (h.getBoundingClientRect().top + window.scrollY <= threshold) current = h;
    }
    railNav.querySelectorAll('a').forEach((a) => {
      a.classList.toggle('active', a.dataset.h3Target === current.id);
    });
  }

  const sectionObserver = new IntersectionObserver(
    (entries) => {
      const mostVisible = entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (mostVisible && mostVisible.target !== activeSection) {
        activeSection = mostVisible.target;
        renderRailFor(activeSection);
        updateActiveLink();
      }
    },
    { rootMargin: '-10% 0px -70% 0px', threshold: [0, 0.25, 0.5, 0.75, 1] },
  );
  sections.forEach((s) => sectionObserver.observe(s));

  window.addEventListener('scroll', () => requestAnimationFrame(updateActiveLink), { passive: true });

  // Prime the initial state without waiting for the first scroll/observer tick.
  activeSection = sections[0];
  renderRailFor(activeSection);
  updateActiveLink();
})();
```

- [ ] **Step 4: Rebuild and verify manually**

```bash
cd apps/workbench && node build.js && open dist/index.html
```
Verify:
1. The right rail shows links matching the first section's own h3s on
   initial load.
2. Scrolling to a different `<section>` (e.g., the Button component)
   updates the right rail's links to that section's own subheadings
   (Playground / Matrix / API / Accessibility).
3. Scrolling within one section highlights whichever subheading is
   currently at/above the reading position with the `.active` style.
4. Clicking a right-rail link jumps to that heading.
5. Resize the browser below 1200px width — the right rail disappears
   (Task 1's breakpoint) without any layout shift/overlap.

- [ ] **Step 5: Commit**

```bash
cd /Users/moosedavis/dev/keel
git add apps/workbench/build.js
git commit -m "feat(workbench): add scroll-spy 'on this page' right rail"
```

---

### Task 4: Full verification

**Files:** none modified — verification only.

- [ ] **Step 1: Full workspace build**

```bash
cd /Users/moosedavis/dev/keel
npm run build
```
Expected: all packages build, including Workbench's own chrome contrast
gate (28/28 pairs) — this plan makes no color changes, so that gate should
be unaffected, but a full rebuild confirms no CSS syntax errors were
introduced.

- [ ] **Step 2: Responsive check across breakpoints**

```bash
open apps/workbench/dist/index.html
```
Manually resize the browser window through ~1400px, ~1200px, ~900px, and
~600px widths. Confirm no horizontal scrollbar appears at any width, and
no column visibly overlaps another during the transition.

- [ ] **Step 3: Commit any fixes found in Step 2**

```bash
git add apps/workbench/build.js
git commit -m "fix(workbench): responsive polish for the new shell layout"
```

(Skip if Steps 1–2 required no changes.)
