# Color Utility Classes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Generate `.keel-bg-{role}` / `.keel-text-{role}` / `.keel-border-{role}`
utility classes from Keel's existing semantic color tokens, ship them from
`@keel/tokens` as a new `utilities.css` export, and label each matching row
in Workbench's semantic-color token table with the class it can use.

**Architecture:** One new shared module,
`packages/tokens/utility-classes.lib.js`, owns the single mapping from a
semantic color token key (e.g. `color.bg.accentHover`) to its utility class
name and CSS rule. `packages/tokens/build.js` imports it to emit
`dist/utilities.css` as part of the normal token build. `apps/workbench/build.js`
imports the same module to print the matching class name next to each
semantic token row — so the docs page and the generated CSS can never name a
class differently. This mirrors the existing `contrast.lib.js` pattern in
this same package: one module, imported by both the CLI build and the
Workbench generator, so there is exactly one definition of the mapping.

**Tech Stack:** Plain Node ESM (`packages/tokens` has no bundler or test
framework — see Global Constraints). No new dependencies.

**Spec:** `docs/superpowers/specs/2026-09-06-utility-classes-design.md`

## Global Constraints

- **Color only.** Only `color.bg.*`, `color.fg.*`, and `color.border.*`
  semantic tokens get utility classes. Spacing, radius, and border-width
  utilities are out of scope for this plan (separate future spec).
- **`focus.*` is excluded by design**, not an oversight — never add a class
  for it in this plan.
- **Generated, never hand-written.** The class list must be derived
  programmatically from `packages/tokens/src/semantic/color.json` (via the
  already-built token entries — see Task 2), not typed out by hand anywhere.
- **One shared naming/rule function.** Both the CSS generator (Task 2) and
  Workbench's display (Task 3) must import the same function from
  `packages/tokens/utility-classes.lib.js`. Never duplicate the
  key-to-class-name logic in a second place.
- **Ships from `@keel/tokens`, never `@keel/react`.**
- **Naming convention:** `bg.*` → `.keel-bg-{role}`; `fg.*` → `.keel-text-{role}`
  (using "text," the conventional utility-class term, even though the token
  category is named `fg`); `border.*` → `.keel-border-{role}`. Role names are
  kebab-cased from the semantic JSON's camelCase (`accentHover` →
  `accent-hover`), using the same `([a-z0-9])([A-Z])` → `$1-$2` transform
  `packages/tokens/build.js` already uses for its `keel/name-kebab` CSS
  variable transform, so the two names agree letter-for-letter.
- **One `utilities.css` file serves both themes** — classes reference
  `var(--keel-color-*)`, which already resolves per `[data-theme]`. Do not
  generate a `utilities.dark.css`.
- **New export subpath:** `packages/tokens/package.json`'s `exports` map
  gets `"./utilities.css": "./dist/utilities.css"`, matching the existing
  `"./tokens.css"` / `"./tokens.dark.css"` entries.
- **Workbench's semantic-color token table only** gets the new "Utility
  class" column. The primitive-ramps table (same `swatchRow` function,
  different section) must NOT gain this column — primitives have no utility
  classes, and components/consumers must never reference them directly.
- **No new test framework.** `packages/tokens` has no test runner today —
  no vitest, no `test` script, nothing in `devDependencies`. Its existing
  pure-logic files (`ramps.js`, `contrast.js`) are verified by direct
  execution and the build's own contrast gate, not unit tests. This plan
  follows that same convention: the new pure function in
  `utility-classes.lib.js` is verified with direct `node --input-type=module
  -e` smoke checks, run as plan steps. Do not add vitest (or any other test
  framework) to this package as part of this plan.

---

### Task 1: Shared naming-transform module

**Files:**
- Create: `packages/tokens/utility-classes.lib.js`

**Interfaces:**
- Produces: `utilityClassName(tokenKey: string): string | null` — e.g.
  `utilityClassName('color.bg.accentHover')` → `'keel-bg-accent-hover'`;
  returns `null` for anything outside `color.bg.*` / `color.fg.*` /
  `color.border.*` (including `color.focus.*` and every non-color token).
  Consumed by Task 3 (Workbench display).
- Produces: `utilityClassRule(tokenKey: string, cssVar: string): string | null`
  — e.g. `utilityClassRule('color.fg.accent', '--keel-color-fg-accent')` →
  `'.keel-text-accent { color: var(--keel-color-fg-accent); }'`; returns
  `null` under the same conditions as `utilityClassName`. Consumed by
  Task 2 (CSS generation).

- [ ] **Step 1: Confirm the module doesn't exist yet**

Run:
```bash
ls packages/tokens/utility-classes.lib.js
```
Expected: `No such file or directory` — this task creates it fresh.

- [ ] **Step 2: Run the smoke check against the not-yet-created module (RED)**

Run, from the repo root:
```bash
node --input-type=module -e "
import { utilityClassName } from './packages/tokens/utility-classes.lib.js';
console.log(utilityClassName('color.bg.accent'));
"
```
Expected: FAIL with `Cannot find module '.../utility-classes.lib.js'`.

- [ ] **Step 3: Create the module**

Write `packages/tokens/utility-classes.lib.js`:

```js
/**
 * Semantic color token key -> Keel utility class, in both directions the
 * build needs: build.js needs the full CSS rule to emit, and
 * apps/workbench/build.js needs just the class name to label a token's
 * table row. Both call into this one module so the name shown in the docs
 * can never drift from the name that is actually generated — the same
 * failure mode contrast.lib.js already exists to prevent for the contrast
 * pair list.
 *
 * `focus.*` roles and every primitive ramp are deliberately excluded: a
 * focus ring is behavior (`:focus-visible`), not something a consumer would
 * apply as a static class, and primitives must never be referenced
 * directly (see root CLAUDE.md).
 */

const CATEGORY = {
  bg: { prefix: 'bg', property: 'background-color' },
  fg: { prefix: 'text', property: 'color' },
  border: { prefix: 'border', property: 'border-color' },
};

function parse(tokenKey) {
  const match = /^color\.(bg|fg|border)\.(.+)$/.exec(tokenKey);
  if (!match) return null;
  const [, group, role] = match;
  // Same kebab transform build.js's `keel/name-kebab` CSS variable
  // transform already uses, so a role reads identically in both places.
  const kebabRole = role.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
  return { ...CATEGORY[group], role: kebabRole };
}

/** e.g. "color.bg.accentHover" -> "keel-bg-accent-hover"; null outside bg/fg/border. */
export function utilityClassName(tokenKey) {
  const parsed = parse(tokenKey);
  return parsed ? `keel-${parsed.prefix}-${parsed.role}` : null;
}

/**
 * e.g. ("color.fg.accent", "--keel-color-fg-accent") ->
 * ".keel-text-accent { color: var(--keel-color-fg-accent); }"
 */
export function utilityClassRule(tokenKey, cssVar) {
  const parsed = parse(tokenKey);
  if (!parsed) return null;
  return `.keel-${parsed.prefix}-${parsed.role} { ${parsed.property}: var(${cssVar}); }`;
}
```

- [ ] **Step 4: Run the smoke check again (GREEN)**

Run, from the repo root:
```bash
node --input-type=module -e "
import { utilityClassName, utilityClassRule } from './packages/tokens/utility-classes.lib.js';
console.log(utilityClassName('color.bg.accent'));
console.log(utilityClassName('color.bg.accentHover'));
console.log(utilityClassName('color.fg.onAccent'));
console.log(utilityClassName('color.border.control'));
console.log(utilityClassName('color.focus.ring'));
console.log(utilityClassName('space.4'));
console.log(utilityClassRule('color.fg.accent', '--keel-color-fg-accent'));
"
```
Expected, in order:
```
keel-bg-accent
keel-bg-accent-hover
keel-text-on-accent
keel-border-control
null
null
.keel-text-accent { color: var(--keel-color-fg-accent); }
```

- [ ] **Step 5: Commit**

```bash
git add packages/tokens/utility-classes.lib.js
git commit -m "$(cat <<'EOF'
feat(tokens): add the semantic-color-to-utility-class naming module

One function maps a semantic color token key to its utility class name
and CSS rule, so the class the CSS generator emits and the class
Workbench displays can never disagree.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01JmiD781T7E9vLLnrMgYRYi
EOF
)"
```

---

### Task 2: Generate `dist/utilities.css` and export it

**Files:**
- Modify: `packages/tokens/build.js`
- Modify: `packages/tokens/package.json`

**Interfaces:**
- Consumes: `utilityClassRule` from Task 1's
  `packages/tokens/utility-classes.lib.js`.
- Produces: `packages/tokens/dist/utilities.css`, containing one CSS rule
  per semantic `bg`/`fg`/`border` role (36 rules total — 18 `bg`, 11 `fg`,
  7 `border`, matching the counts in `src/semantic/color.json`).
- Produces: `@keel/tokens`'s `exports` map gains `"./utilities.css"`,
  importable as `import '@keel/tokens/utilities.css'`.

- [ ] **Step 1: Import the shared module in `build.js`**

In `packages/tokens/build.js`, find:
```js
import StyleDictionary from 'style-dictionary';
import { fileHeader } from 'style-dictionary/utils';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
```
Replace with:
```js
import StyleDictionary from 'style-dictionary';
import { fileHeader } from 'style-dictionary/utils';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { utilityClassRule } from './utility-classes.lib.js';
```

- [ ] **Step 2: Make `buildTypeScript()` return its entries, not just a count**

Find, near the end of `buildTypeScript()`:
```js
  const json = Object.fromEntries(entries.map((e) => [e.key, { cssVar: e.cssVar, type: e.type, description: e.description }]));
  await writeFile('dist/tokens.json', `${JSON.stringify(json, null, 2)}\n`, 'utf8');

  return entries.length;
}
```
Replace the final `return` with:
```js
  const json = Object.fromEntries(entries.map((e) => [e.key, { cssVar: e.cssVar, type: e.type, description: e.description }]));
  await writeFile('dist/tokens.json', `${JSON.stringify(json, null, 2)}\n`, 'utf8');

  return entries;
}
```

- [ ] **Step 3: Add `buildUtilitiesCss()`**

Immediately after `buildTypeScript()`'s closing `}` (before the
`buildFontLoader` doc comment), add:

```js
/**
 * Emit dist/utilities.css — one class per semantic bg/fg/border role,
 * generated from the same entries buildTypeScript() just produced, via
 * utility-classes.lib.js's shared mapping. A class can therefore never
 * name a role the token layer does not have.
 */
async function buildUtilitiesCss(entries) {
  const header = await fileHeader({ file: {}, formatting: { fileHeaderTimestamp: false }, options: { fileHeader: 'keel' } });
  const rules = entries.map((e) => utilityClassRule(e.key, e.cssVar)).filter(Boolean);
  await writeFile('dist/utilities.css', `${header}\n${rules.join('\n')}\n`, 'utf8');
  return rules.length;
}
```

- [ ] **Step 4: Wire it into the build sequence**

Find:
```js
await buildCss({ sources: LIGHT, destination: 'tokens.css', selector: ':root, [data-theme="light"]' });
await buildCss({
  sources: DARK,
  destination: 'tokens.dark.css',
  selector: '[data-theme="dark"]',
  filter: 'keel/semantic-only',
});
const count = await buildTypeScript();
```
Replace with:
```js
await buildCss({ sources: LIGHT, destination: 'tokens.css', selector: ':root, [data-theme="light"]' });
await buildCss({
  sources: DARK,
  destination: 'tokens.dark.css',
  selector: '[data-theme="dark"]',
  filter: 'keel/semantic-only',
});
const tsEntries = await buildTypeScript();
const utilityClassCount = await buildUtilitiesCss(tsEntries);
```

- [ ] **Step 5: Update the final build summary log**

Find:
```js
console.log(
  `@keel/tokens — built ${count} tokens: tokens.css, tokens.dark.css, index.ts, tokens.json, ` +
    `fonts.css (${faces.requested} of ${faces.declared} families fetched; ` +
    `${faces.declared - faces.requested} system)`,
);
```
Replace with:
```js
console.log(
  `@keel/tokens — built ${tsEntries.length} tokens: tokens.css, tokens.dark.css, index.ts, tokens.json, ` +
    `utilities.css (${utilityClassCount} classes), ` +
    `fonts.css (${faces.requested} of ${faces.declared} families fetched; ` +
    `${faces.declared - faces.requested} system)`,
);
```

- [ ] **Step 6: Add the export subpath**

In `packages/tokens/package.json`, find:
```json
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "default": "./dist/index.js"
    },
    "./tokens.css": "./dist/tokens.css",
    "./tokens.dark.css": "./dist/tokens.dark.css",
    "./tokens.json": "./dist/tokens.json",
    "./package.json": "./package.json",
    "./fonts.css": "./dist/fonts.css"
  },
```
Replace with:
```json
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "default": "./dist/index.js"
    },
    "./tokens.css": "./dist/tokens.css",
    "./tokens.dark.css": "./dist/tokens.dark.css",
    "./tokens.json": "./dist/tokens.json",
    "./package.json": "./package.json",
    "./fonts.css": "./dist/fonts.css",
    "./utilities.css": "./dist/utilities.css"
  },
```

- [ ] **Step 7: Exclude the new CSS export from the types check**

`attw` (Are the Types Wrong) checks every export subpath for a matching
type declaration, which a plain CSS file will never have — the existing
`tokens.css`/`tokens.dark.css`/`fonts.css` entries are already excluded for
the same reason. In `packages/tokens/package.json`, find:
```json
    "lint:packaging": "publint --strict && attw --pack . --profile esm-only --exclude-entrypoints tokens.css tokens.dark.css fonts.css tokens.json",
```
Replace with:
```json
    "lint:packaging": "publint --strict && attw --pack . --profile esm-only --exclude-entrypoints tokens.css tokens.dark.css fonts.css tokens.json utilities.css",
```

- [ ] **Step 8: Build and verify the generated CSS**

Run:
```bash
(cd packages/tokens && node ramps.js && node build.js)
```
Expected: the console summary line includes `utilities.css (36 classes)`.

Then inspect the file:
```bash
grep -c '^\.keel-' packages/tokens/dist/utilities.css
grep '^\.keel-bg-accent-hover\|^\.keel-text-on-accent\|^\.keel-border-control' packages/tokens/dist/utilities.css
grep -c 'focus' packages/tokens/dist/utilities.css
```
Expected:
- First command: `36`
- Second command, three lines:
  ```
  .keel-bg-accent-hover { background-color: var(--keel-color-bg-accent-hover); }
  .keel-text-on-accent { color: var(--keel-color-fg-on-accent); }
  .keel-border-control { border-color: var(--keel-color-border-control); }
  ```
- Third command: `0` (no `focus.*` role ever reaches the file)

- [ ] **Step 9: Verify packaging still passes**

Run:
```bash
(cd packages/tokens && npm run lint:packaging)
```
Expected: PASS — `publint` finds the new `./utilities.css` export resolves
to a real file, and `attw` no longer flags it as missing types.

- [ ] **Step 10: Commit**

```bash
git add packages/tokens/build.js packages/tokens/package.json
git commit -m "$(cat <<'EOF'
feat(tokens): generate and export utilities.css

Emits one .keel-bg/.keel-text/.keel-border class per semantic color
role, generated from the same token entries tokens.css comes from, and
ships it as a new ./utilities.css export subpath.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01JmiD781T7E9vLLnrMgYRYi
EOF
)"
```

---

### Task 3: Workbench "Utility class" column

**Files:**
- Modify: `apps/workbench/build.js`

**Interfaces:**
- Consumes: `utilityClassName` from Task 1's
  `packages/tokens/utility-classes.lib.js`.

- [ ] **Step 1: Import the shared module**

In `apps/workbench/build.js`, find:
```js
import { luminance, report } from '../../packages/tokens/contrast.lib.js';
```
Replace with:
```js
import { luminance, report } from '../../packages/tokens/contrast.lib.js';
import { utilityClassName } from '../../packages/tokens/utility-classes.lib.js';
```

- [ ] **Step 2: Give `swatchRow` an opt-in utility-class cell**

Find:
```js
function swatchRow([key, meta]) {
  const light = resolved.light[key] ?? '';
  const dark = resolved.dark[key] ?? '';
  const changes = light.toLowerCase() !== dark.toLowerCase();
  const halves = orderedHalves(key);
  return `<tr class="tok" data-token="${esc(key)}">
  <td class="tok-chip">
    <button class="chip" type="button" data-copy="var(${esc(meta.cssVar)})" title="Copy var(${esc(meta.cssVar)})">
      ${halves
        .map(
          (h) =>
            `<span class="chip-half" style="background:${esc(h.hex)}" title="${h.theme} theme — ${esc(h.hex)}"></span>`,
        )
        .join('')}
    </button>
  </td>
  <td class="tok-name"><code>${esc(key)}</code>${changes ? '' : '<span class="tag tag-quiet" title="Same value in both themes">shared</span>'}</td>
  <td class="tok-var"><code>${esc(meta.cssVar)}</code></td>
  <td class="tok-val"><code>${esc(light)}</code></td>
  <td class="tok-val"><code>${esc(dark)}</code></td>
  <td class="tok-desc">${meta.description ? esc(meta.description) : '<span class="dim">—</span>'}</td>
</tr>`;
}
```
Replace with:
```js
function swatchRow([key, meta], opts = {}) {
  const light = resolved.light[key] ?? '';
  const dark = resolved.dark[key] ?? '';
  const changes = light.toLowerCase() !== dark.toLowerCase();
  const halves = orderedHalves(key);
  const cls = opts.utilityClass ? utilityClassName(key) : null;
  const utilityCell = opts.utilityClass
    ? `<td class="tok-var">${cls ? `<code>.${esc(cls)}</code>` : '<span class="dim">—</span>'}</td>`
    : '';
  return `<tr class="tok" data-token="${esc(key)}">
  <td class="tok-chip">
    <button class="chip" type="button" data-copy="var(${esc(meta.cssVar)})" title="Copy var(${esc(meta.cssVar)})">
      ${halves
        .map(
          (h) =>
            `<span class="chip-half" style="background:${esc(h.hex)}" title="${h.theme} theme — ${esc(h.hex)}"></span>`,
        )
        .join('')}
    </button>
  </td>
  <td class="tok-name"><code>${esc(key)}</code>${changes ? '' : '<span class="tag tag-quiet" title="Same value in both themes">shared</span>'}</td>
  <td class="tok-var"><code>${esc(meta.cssVar)}</code></td>
  ${utilityCell}
  <td class="tok-val"><code>${esc(light)}</code></td>
  <td class="tok-val"><code>${esc(dark)}</code></td>
  <td class="tok-desc">${meta.description ? esc(meta.description) : '<span class="dim">—</span>'}</td>
</tr>`;
}
```

Note: `opts.utilityClass` defaults to falsy, so every existing call site
that doesn't pass a second argument (the primitives section, Step 4 below)
renders exactly as before — no column, no behavior change.

- [ ] **Step 3: Add the column to the semantic-color table only**

Find (inside the `#semantic` section):
```js
      ${GROUPS.map((g) => {
        const rows = entries.filter(([k]) => g.test(k));
        return `<h3>${g.title}<span class="h3-hint">${esc(g.hint)}</span></h3>
      <div class="panel scroll"><table>
        <thead><tr><th>Swatch</th><th>Token</th><th>CSS variable</th><th>Light</th><th>Dark</th><th>Notes</th></tr></thead>
        <tbody>${rows.map(swatchRow).join('\n')}</tbody>
      </table></div>`;
      }).join('\n')}
```
Replace with:
```js
      ${GROUPS.map((g) => {
        const rows = entries.filter(([k]) => g.test(k));
        return `<h3>${g.title}<span class="h3-hint">${esc(g.hint)}</span></h3>
      <div class="panel scroll"><table>
        <thead><tr><th>Swatch</th><th>Token</th><th>CSS variable</th><th>Utility class</th><th>Light</th><th>Dark</th><th>Notes</th></tr></thead>
        <tbody>${rows.map((e) => swatchRow(e, { utilityClass: true })).join('\n')}</tbody>
      </table></div>`;
      }).join('\n')}
```

- [ ] **Step 4: Confirm the primitives table is untouched**

Find the primitives section and confirm it still reads exactly as-is (no
edit needed here — this step is a check, not a change):
```js
      ${RAMPS.map((ramp) => {
        const rows = entries.filter(([k]) => k.startsWith(`color.${ramp}.`));
        if (!rows.length) return '';
        return `<h3>${ramp}</h3>
      <div class="panel scroll"><table>
        <thead><tr><th>Swatch</th><th>Token</th><th>CSS variable</th><th>Light</th><th>Dark</th><th>Notes</th></tr></thead>
        <tbody>${rows.map(swatchRow).join('\n')}</tbody>
      </table></div>`;
      }).join('\n')}
```
This still calls `swatchRow` with one argument, so `opts.utilityClass` is
`undefined` and `utilityCell` is `''` — five columns, unchanged.

- [ ] **Step 5: Build and verify in the browser**

Run:
```bash
(cd apps/workbench && node build.js)
open apps/workbench/dist/index.html
```
Confirm:
1. The "Semantic color" section's tables (Background, Foreground, Border,
   Focus) each show a new "Utility class" column between "CSS variable"
   and "Light."
2. The `color.bg.accent` row shows `.keel-bg-accent`; the `color.fg.accent`
   row shows `.keel-text-accent`; the `color.border.control` row shows
   `.keel-border-control`.
3. Rows in the "Focus" group (`color.focus.ring`, `color.focus.onDark`)
   show an em dash (`—`) in the new column, not a class name.
4. The "Primitive ramps" section's tables still show exactly five columns
   (Swatch, Token, CSS variable, Light, Dark, Notes) — no "Utility class"
   column there.
5. The token filter (search box in the Semantic color section) still
   works — typing "accent" still hides non-matching rows.

- [ ] **Step 6: Commit**

```bash
git add apps/workbench/build.js
git commit -m "$(cat <<'EOF'
feat(workbench): show each semantic color token's utility class

The semantic-color token table gains a "Utility class" column, sourced
from the same naming function that generates the classes in
@keel/tokens/utilities.css, so the two can never disagree. The
primitive-ramp tables are unaffected — primitives have no utility
classes.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01JmiD781T7E9vLLnrMgYRYi
EOF
)"
```

---

### Task 4: Full verification

**Files:** none modified — verification only.

- [ ] **Step 1: Full workspace build**

```bash
npm run build
```
Expected: all packages build, including:
- `@keel/tokens` reporting `utilities.css (36 classes)` in its summary line
- Workbench's own chrome contrast gate still 28/28 (this plan makes no
  color or token-value changes, only a display/generation addition)

- [ ] **Step 2: Full workspace test suite**

```bash
npm test
```
Expected: unchanged from before this plan — `@keel/react`'s suite still
passes (86 passed, 4 expected-fail, 10 skipped, per the last known-good
run). This plan touches no React component code, so no test count should
change.

- [ ] **Step 3: Packaging lint**

```bash
(cd packages/tokens && npm run lint:packaging)
```
Expected: PASS (already verified in Task 2, Step 9 — re-run here as part
of the full sequence in case Task 3's changes affected anything, though
they touch a different package).

- [ ] **Step 4: Manual smoke test of the published import**

Run:
```bash
node --input-type=module -e "
import { readFile } from 'node:fs/promises';
const css = await readFile('./packages/tokens/dist/utilities.css', 'utf8');
console.log('has keel-bg-accent:', css.includes('.keel-bg-accent {'));
console.log('has keel-text-accent:', css.includes('.keel-text-accent {'));
console.log('has keel-border-control:', css.includes('.keel-border-control {'));
console.log('has any focus class:', /\.keel-\w*focus/.test(css));
"
```
Expected:
```
has keel-bg-accent: true
has keel-text-accent: true
has keel-border-control: true
has any focus class: false
```

- [ ] **Step 5: Commit any fixes found in Steps 1–4**

```bash
git add -A
git commit -m "$(cat <<'EOF'
fix(tokens): verification polish for utility classes

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01JmiD781T7E9vLLnrMgYRYi
EOF
)"
```
(Skip if Steps 1–4 required no changes.)
