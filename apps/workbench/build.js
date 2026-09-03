/**
 * Keel Workbench — static generator.
 *
 * Emits a single self-contained HTML file for inspecting the system in a
 * browser: every token with a live swatch, the full WCAG contrast report, and a
 * per-component playground whose controls are generated from that component's
 * own contract.
 *
 * Everything on the page is read from BUILT artifacts — packages/tokens/dist,
 * packages/react/dist and packages/contracts/dist — never re-typed here. A
 * hand-maintained gallery is exactly the drift this project exists to prevent,
 * so `npm run build` regenerates the page and any change to a token shows up
 * without anyone remembering to update the docs.
 *
 * One transform is applied to Keel's CSS on the way in. Keel scopes its themes
 * with `[data-theme="dark"]`, and so does the page host — so inlining the CSS
 * unchanged would mean switching the PAGE to dark also switched every specimen.
 * The selectors are rewritten to `[data-keel-theme]`, which lets the workbench
 * chrome and the system under inspection carry independent themes. That
 * matters: reviewing Keel's dark palette while reading the page in light is the
 * normal way to work.
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { report } from '../../packages/tokens/contrast.lib.js';
import { contracts, propMatrix } from '../../packages/contracts/dist/index.js';
import { RENDERERS } from './renderers.js';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '../..');

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// ---------------------------------------------------------------- inputs

const tokensJson = JSON.parse(await readFile(resolve(root, 'packages/tokens/dist/tokens.json'), 'utf8'));
const keelCssRaw = await readFile(resolve(root, 'packages/react/dist/styles.css'), 'utf8');
const { rows: contrastRows, failures, resolved } = await report();

/** Re-scope Keel's theme selectors so they cannot collide with the page's own. */
const keelCss = keelCssRaw
  .replace(/:root,\s*\[data-theme="light"\]/g, ':root, [data-keel-theme="light"]')
  .replace(/\[data-theme="dark"\]/g, '[data-keel-theme="dark"]');

// ---------------------------------------------------------------- grouping

const GROUPS = [
  { id: 'color-bg', title: 'Background', hint: 'Surfaces and fills.', test: (k) => k.startsWith('color.bg.'), kind: 'color' },
  { id: 'color-fg', title: 'Foreground', hint: 'Text and icons.', test: (k) => k.startsWith('color.fg.'), kind: 'color' },
  { id: 'color-border', title: 'Border', hint: 'Edges. Only border.control is held to 3:1.', test: (k) => k.startsWith('color.border.'), kind: 'color' },
  { id: 'color-focus', title: 'Focus', hint: 'Focus indication.', test: (k) => k.startsWith('color.focus.'), kind: 'color' },
];

const RAMPS = ['neutral', 'rose', 'green', 'amber', 'red'];

const SCALES = [
  { id: 'space', title: 'Space', prefix: 'space.', kind: 'space' },
  { id: 'radius', title: 'Radius', prefix: 'radius.', kind: 'radius' },
  { id: 'size', title: 'Control size', prefix: 'size.control.', kind: 'size' },
  { id: 'border-width', title: 'Border width', prefix: 'border.width.', kind: 'plain' },
  { id: 'font-size', title: 'Font size', prefix: 'font.size.', kind: 'font' },
  { id: 'font-weight', title: 'Font weight', prefix: 'font.weight.', kind: 'plain' },
  { id: 'line-height', title: 'Line height', prefix: 'font.lineHeight.', kind: 'plain' },
  { id: 'duration', title: 'Duration', prefix: 'duration.', kind: 'plain' },
];

const entries = Object.entries(tokensJson);
const semanticCount = entries.filter(([k]) => /^color\.(bg|fg|border|focus)\./.test(k)).length;

// ---------------------------------------------------------------- fragments

function swatchRow([key, meta]) {
  const light = resolved.light[key] ?? '';
  const dark = resolved.dark[key] ?? '';
  const changes = light.toLowerCase() !== dark.toLowerCase();
  return `<tr class="tok" data-token="${esc(key)}">
  <td class="tok-chip">
    <button class="chip" type="button" data-copy="var(${esc(meta.cssVar)})" title="Copy var(${esc(meta.cssVar)})">
      <span class="chip-half" style="background:${esc(light)}"></span><span class="chip-half" style="background:${esc(dark)}"></span>
    </button>
  </td>
  <td class="tok-name"><code>${esc(key)}</code>${changes ? '' : '<span class="tag tag-quiet" title="Same value in both themes">shared</span>'}</td>
  <td class="tok-var"><code>${esc(meta.cssVar)}</code></td>
  <td class="tok-val"><code>${esc(light)}</code></td>
  <td class="tok-val"><code>${esc(dark)}</code></td>
  <td class="tok-desc">${meta.description ? esc(meta.description) : '<span class="dim">—</span>'}</td>
</tr>`;
}

function scaleRow([key, meta], kind) {
  const v = `var(${meta.cssVar})`;
  let demo = '';
  if (kind === 'space') demo = `<span class="bar" style="inline-size:${v}"></span>`;
  else if (kind === 'radius') demo = `<span class="radius-demo" style="border-radius:${v}"></span>`;
  else if (kind === 'size') demo = `<span class="size-demo" style="block-size:${v}"></span>`;
  else if (kind === 'font') demo = `<span style="font-size:${v};line-height:1">Ag</span>`;
  return `<tr class="tok" data-token="${esc(key)}">
  <td class="tok-demo">${demo}</td>
  <td class="tok-name"><code>${esc(key)}</code></td>
  <td class="tok-var"><code>${esc(meta.cssVar)}</code></td>
  <td class="tok-desc">${meta.description ? esc(meta.description) : '<span class="dim">—</span>'}</td>
</tr>`;
}

const contrastTable = (theme) => contrastRows
  .filter((r) => r.theme === theme)
  .map((r) => {
    const cls = r.status === 'fail' ? 'fail' : r.status.startsWith('exempt') ? 'exempt' : 'pass';
    const label = { pass: 'pass', fail: 'fail', 'exempt-pass': 'exempt', 'exempt-below': 'exempt', missing: 'missing' }[r.status];
    return `<tr class="cr" data-status="${cls}">
  <td><span class="pair-preview" style="background:${esc(r.bgHex)};color:${esc(r.fgHex)}">Aa</span></td>
  <td class="tok-desc">${esc(r.label)}</td>
  <td class="num">${r.ratio ?? '—'}</td>
  <td class="num dim">${r.min}</td>
  <td><span class="tag tag-${cls}">${label}</span></td>
</tr>`;
  })
  .join('\n');

const enforced = contrastRows.filter((r) => !r.exempt);

// ------------------------------------------------------- component sections

/** Contracts that have a preview renderer. Everything else is skipped. */
const COMPONENTS = contracts.filter((c) => RENDERERS[c.id]);

const propsTable = (c) => `<table>
  <thead><tr><th>Prop</th><th>Values</th><th>Default</th><th>Description</th></tr></thead>
  <tbody>${Object.entries(c.props)
    .map(
      ([name, def]) => `<tr>
    <td class="tok-name"><code>${esc(name)}</code></td>
    <td class="tok-val">${def.values.map((v) => `<code class="pill">${esc(v)}</code>`).join(' ')}</td>
    <td class="tok-val"><code>${esc(def.defaultValue)}</code></td>
    <td class="tok-desc">${esc(def.description)}</td>
  </tr>`,
    )
    .join('\n')}
  ${Object.entries(c.booleans ?? {})
    .map(
      ([name, def]) => `<tr>
    <td class="tok-name"><code>${esc(name)}</code></td>
    <td class="tok-val"><code class="pill">boolean</code></td>
    <td class="tok-val"><code>${def.defaultValue}</code></td>
    <td class="tok-desc">${esc(def.description)}</td>
  </tr>`,
    )
    .join('\n')}
  ${Object.entries(c.slots ?? {})
    .map(
      ([name, def]) => `<tr>
    <td class="tok-name"><code>${esc(name)}</code>${def.required ? '<span class="tag tag-fail" title="No component-side default — you must pass this">required</span>' : ''}${def.isAccessibleName ? '<span class="tag tag-quiet" title="Provides the accessible name">a11y name</span>' : ''}</td>
    <td class="tok-val"><code class="pill">string</code></td>
    <td class="tok-val"><span class="dim">—</span></td>
    <td class="tok-desc">${esc(def.description)}</td>
  </tr>`,
    )
    .join('\n')}
  </tbody>
</table>`;

/** The variant x size grid, rendered server-side from the contract. */
function matrixFor(c) {
  const axes = Object.entries(c.props);
  if (axes.length === 0) return '';
  const [rowName, rowDef] = axes[0];
  const [colName, colDef] = axes[1] ?? [null, null];
  const cells = propMatrix(c);

  if (!colName) {
    return `<table>
      <thead><tr><th><code>${esc(rowName)}</code></th><th>Specimen</th></tr></thead>
      <tbody>${rowDef.values
        .map(
          (v) =>
            `<tr><th scope="row"><code>${esc(v)}</code></th><td data-specimen='${esc(JSON.stringify({ [rowName]: v }))}'></td></tr>`,
        )
        .join('')}</tbody>
      <caption>${cells.length} combination${cells.length === 1 ? '' : 's'}, generated from the contract.</caption>
    </table>`;
  }

  return `<table>
    <thead><tr><th></th>${colDef.values.map((v) => `<th><code>${esc(v)}</code></th>`).join('')}</tr></thead>
    <tbody>${rowDef.values
      .map(
        (rv) =>
          `<tr><th scope="row"><code>${esc(rv)}</code></th>${colDef.values
            .map(
              (cv) =>
                `<td data-specimen='${esc(JSON.stringify({ [rowName]: rv, [colName]: cv }))}'></td>`,
            )
            .join('')}</tr>`,
      )
      .join('')}</tbody>
    <caption>${rowDef.values.length} \u00d7 ${colDef.values.length} = ${cells.length} combinations of <code>${esc(rowName)}</code> and <code>${esc(colName)}</code>, generated from the contract.</caption>
  </table>`;
}

/** Controls, derived entirely from this component's own contract. */
function controlsFor(c) {
  const enums = Object.entries(c.props)
    .map(
      ([name, def]) => `<div class="ctrl">
      <label class="ctrl-label" for="ctl-${c.id}-${name}">${esc(name)}</label>
      <div class="seg seg-wrap" role="group" aria-label="${esc(name)}" id="ctl-${c.id}-${name}">
        ${def.values
          .map(
            (v) =>
              `<button type="button" data-prop="${esc(name)}" data-value="${esc(v)}" aria-pressed="${v === def.defaultValue}">${esc(v)}</button>`,
          )
          .join('')}
      </div>
    </div>`,
    )
    .join('\n');

  const bools = Object.entries(c.booleans ?? {});
  const boolBlock = bools.length
    ? `<div class="ctrl">
      <span class="ctrl-label">flags</span>
      <div class="ctrl-flags">
        ${bools
          .map(
            ([name, def]) =>
              `<label class="flag" title="${esc(def.description)}"><input type="checkbox" data-bool="${esc(name)}"${def.defaultValue ? ' checked' : ''}> <span>${esc(name)}</span></label>`,
          )
          .join('')}
      </div>
    </div>`
    : '';

  const slots = Object.entries(c.slots ?? {})
    .map(
      ([name, def]) => `<div class="ctrl">
      <label class="ctrl-label" for="ctl-${c.id}-slot-${name}">${esc(name)}</label>
      ${
        def.multiline
          ? `<textarea id="ctl-${c.id}-slot-${name}" class="ctrl-input" rows="2" data-slot="${esc(name)}">${esc(def.defaultValue)}</textarea>`
          : `<input id="ctl-${c.id}-slot-${name}" class="ctrl-input" type="text" data-slot="${esc(name)}" value="${esc(def.defaultValue)}">`
      }
    </div>`,
    )
    .join('\n');

  return enums + boolBlock + slots;
}

function sectionFor(c) {
  const usage = c.usage;
  return `<section id="c-${c.id}" class="component">
    <h2>${esc(c.name)}</h2>
    <p class="lede">${esc(c.description)}</p>
    <div class="meta-row">
      <span class="tag tag-exempt">${esc(c.status)}</span>
      <span class="meta-dim">a11y reviewed: ${c.a11yReviewed ? esc(c.a11yReviewed) : 'not yet'}</span>
      ${(c.related ?? []).length ? `<span class="meta-dim">related: ${(c.related ?? []).map((r) => `<code>${esc(r)}</code>`).join(', ')}</span>` : ''}
    </div>

    ${
      usage
        ? `<div class="usage">
      ${usage.use?.length ? `<div class="usage-col usage-use"><h4>Use it</h4><ul>${usage.use.map((u) => `<li>${esc(u)}</li>`).join('')}</ul></div>` : ''}
      ${usage.avoid?.length ? `<div class="usage-col usage-avoid"><h4>Avoid</h4><ul>${usage.avoid.map((u) => `<li>${esc(u)}</li>`).join('')}</ul></div>` : ''}
    </div>`
        : ''
    }

    <h3>Playground<span class="h3-hint">controls are generated from this component's own contract</span></h3>
    <div class="play" data-play="${esc(c.id)}">
      <div class="play-controls">${controlsFor(c)}</div>
      <div class="play-right">
        <div class="stage play-stage" data-keel-theme="light"><div class="play-preview"></div></div>
        <div class="snippet">
          <div class="snippet-head">
            <span>Code</span>
            <button type="button" class="snippet-copy" data-copy-snippet>Copy</button>
          </div>
          <pre class="snippet-body"><code></code></pre>
        </div>
      </div>
    </div>

    <h3>Matrix</h3>
    <div class="stage" data-keel-theme="light" data-matrix="${esc(c.id)}">${matrixFor(c)}</div>

    <h3>API</h3>
    <div class="panel scroll">${propsTable(c)}</div>

    <h3>Accessibility</h3>
    <ul class="notes">${(c.a11y.notes ?? []).map((n) => `<li>${esc(n)}</li>`).join('')}</ul>
    <div class="panel scroll"><table><tbody>
      <tr><td class="tok-name"><code>role</code></td><td class="tok-desc"><code>${esc(c.a11y.role)}</code></td></tr>
      ${(c.a11y.activationKeys ?? []).length ? `<tr><td class="tok-name"><code>activationKeys</code></td><td class="tok-desc">${(c.a11y.activationKeys ?? []).map((k) => `<code class="pill">${k === ' ' ? 'Space' : esc(k)}</code>`).join(' ')}</td></tr>` : ''}
      ${c.a11y.disabledStrategy ? `<tr><td class="tok-name"><code>disabledStrategy</code></td><td class="tok-desc"><code>${esc(c.a11y.disabledStrategy)}</code></td></tr>` : ''}
      <tr><td class="tok-name"><code>keyboardOperable</code></td><td class="tok-desc"><code>${c.a11y.keyboardOperable}</code></td></tr>
    </tbody></table></div>
  </section>`;
}

const componentSections = COMPONENTS.map(sectionFor).join('\n');
const totalCells = COMPONENTS.reduce((n, c) => n + propMatrix(c).length, 0);

/** Contract data + renderer bodies, handed to the page as JSON. */
const PLAY_DATA = JSON.stringify(
  Object.fromEntries(
    COMPONENTS.map((c) => [
      c.id,
      {
        name: c.name,
        props: Object.fromEntries(Object.entries(c.props).map(([k, v]) => [k, v.defaultValue])),
        booleans: Object.fromEntries(Object.entries(c.booleans ?? {}).map(([k, v]) => [k, v.defaultValue])),
        slots: Object.fromEntries(Object.entries(c.slots ?? {}).map(([k, v]) => [k, v.defaultValue])),
        slotRequired: Object.fromEntries(Object.entries(c.slots ?? {}).map(([k, v]) => [k, Boolean(v.required)])),
        childrenSlot: RENDERERS[c.id].childrenSlot ?? null,
        render: RENDERERS[c.id].body,
      },
    ]),
  ),
);

// ---------------------------------------------------------------- page

const html = `<title>Keel Workbench</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bodoni+Moda:opsz,wght@6..96,500;6..96,700&family=DM+Mono:wght@400;500&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap">

<style>
/* ============================================================
   Workbench chrome.
   Deliberately near-achromatic — warm paper and ink. Keel's palette is a
   high-chroma magenta-rose, and the frame around it has to stay quiet or the
   page reads as two palettes arguing. Every saturated colour here belongs to
   the system under inspection. Chrome tokens are --wb-*, Keel's are --keel-*,
   and the two never meet.
   ============================================================ */
:root {
  --wb-ground: #faf8f5;
  --wb-panel: #ffffff;
  --wb-inset: #f2ede7;
  --wb-ink: #1b1613;
  --wb-muted: #6d625b;
  --wb-line: #e6dfd7;
  --wb-line-strong: #cec4b9;
  /* The chrome accent is the ink itself — deliberately achromatic. Every
     saturated colour on this page should belong to the system under
     inspection, not to the frame around it. A brass chrome accent competed
     with Keel's rose and made the page read as two palettes arguing. */
  --wb-accent: #1b1613;
  --wb-accent-on: #faf8f5;
  --wb-accent-soft: #efe8df;
  --wb-pass: #1f6b46;
  --wb-fail: #a32b2b;
  --wb-shadow: 0 1px 2px rgba(19, 25, 22, .06), 0 8px 24px -12px rgba(19, 25, 22, .18);

  --wb-display: 'Bodoni Moda', Didot, Cochin, Georgia, serif;
  --wb-sans: 'DM Sans', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif;
  --wb-mono: 'DM Mono', ui-monospace, SFMono-Regular, Menlo, monospace;

  color-scheme: light dark;
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --wb-ground: #14110f;
    --wb-panel: #1c1815;
    --wb-inset: #241f1b;
    --wb-ink: #f0eae4;
    --wb-muted: #a09589;
    --wb-line: #2d2721;
    --wb-line-strong: #443c34;
    --wb-accent: #f0eae4;
    --wb-accent-on: #14110f;
    --wb-accent-soft: #2a241e;
    --wb-pass: #52b184;
    --wb-fail: #e0797a;
    --wb-shadow: 0 1px 2px rgba(0, 0, 0, .5), 0 8px 24px -12px rgba(0, 0, 0, .7);
  }
}
:root[data-theme="dark"] {
  --wb-ground: #14110f;
  --wb-panel: #1c1815;
  --wb-inset: #241f1b;
  --wb-ink: #f0eae4;
  --wb-muted: #a09589;
  --wb-line: #2d2721;
  --wb-line-strong: #443c34;
  --wb-accent: #f0eae4;
  --wb-accent-on: #14110f;
  --wb-accent-soft: #2a241e;
  --wb-pass: #52b184;
  --wb-fail: #e0797a;
  --wb-shadow: 0 1px 2px rgba(0, 0, 0, .5), 0 8px 24px -12px rgba(0, 0, 0, .7);
}

* { box-sizing: border-box; }

body {
  margin: 0;
  background: var(--wb-ground);
  color: var(--wb-ink);
  font-family: var(--wb-sans);
  font-size: 15px;
  line-height: 1.55;
  -webkit-font-smoothing: antialiased;
}

.wrap { display: grid; grid-template-columns: 216px minmax(0, 1fr); gap: 40px; max-width: 1240px; margin: 0 auto; padding: 40px 28px 96px; }
@media (max-width: 900px) { .wrap { grid-template-columns: 1fr; gap: 24px; padding: 24px 18px 64px; } .rail { position: static !important; } }

/* ---- masthead ---- */
.masthead { grid-column: 1 / -1; display: flex; flex-wrap: wrap; align-items: flex-end; justify-content: space-between; gap: 20px; padding-bottom: 22px; border-bottom: 2px solid var(--wb-ink); margin-bottom: 8px; }
.brand h1 { font-family: var(--wb-display); font-optical-sizing: auto; font-weight: 600; font-size: clamp(34px, 5vw, 50px); line-height: 1; letter-spacing: -.02em; margin: 0; text-wrap: balance; }
.brand p { margin: 8px 0 0; color: var(--wb-muted); max-width: 56ch; }
.masthead-right { display: flex; flex-direction: column; align-items: flex-end; gap: 14px; }
/* Two controls, deliberately separate. "Page" themes this workbench; "Specimen"
   themes the system under inspection. Keeping them independent is the point —
   reviewing Keel's dark palette while reading the page in light is the normal
   way to work. */
.theme-controls { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 20px; }
.theme-ctl { display: flex; align-items: center; gap: 8px; }
/* The specimen control IS the ThemeToggle component, running on Keel's own
   stylesheet. It is pinned to the light theme so the control itself stays in a
   known state while it switches everything else. */
#specimenToggle { padding: 4px 10px; border: 1px dashed var(--wb-line-strong); border-radius: 999px; background: var(--keel-color-bg-canvas); }
.stats { display: flex; gap: 26px; flex-wrap: wrap; }
.stat { display: flex; flex-direction: column; gap: 2px; }
.stat b { font-family: var(--wb-mono); font-size: 22px; font-weight: 500; font-variant-numeric: tabular-nums; line-height: 1.1; }
.stat span { font-size: 11px; text-transform: uppercase; letter-spacing: .09em; color: var(--wb-muted); }
.stat.ok b { color: var(--wb-pass); }

/* ---- rail ---- */
.rail { position: sticky; top: 24px; align-self: start; font-size: 13.5px; }
.rail nav { display: flex; flex-direction: column; gap: 1px; }
.rail a { color: var(--wb-muted); text-decoration: none; padding: 5px 10px; border-radius: 5px; border-left: 2px solid transparent; }
.rail a:hover { color: var(--wb-ink); background: var(--wb-inset); }
.rail a:focus-visible { outline: 2px solid var(--wb-accent); outline-offset: 1px; }
.rail .rail-head { font-size: 11px; text-transform: uppercase; letter-spacing: .09em; color: var(--wb-muted); padding: 14px 10px 4px; font-weight: 600; }

/* ---- sections ---- */
section { margin-bottom: 52px; scroll-margin-top: 20px; }
section > h2 { font-family: var(--wb-display); font-weight: 600; font-size: 25px; letter-spacing: -.01em; margin: 0 0 4px; }
section > .lede { margin: 0 0 18px; color: var(--wb-muted); max-width: 68ch; }
h3 { font-size: 13px; text-transform: uppercase; letter-spacing: .08em; color: var(--wb-muted); margin: 26px 0 10px; font-weight: 600; }
h3 .h3-hint { text-transform: none; letter-spacing: 0; font-weight: 400; color: var(--wb-muted); opacity: .85; margin-left: 8px; font-size: 12.5px; }
p { max-width: 68ch; }

.panel { background: var(--wb-panel); border: 1px solid var(--wb-line); border-radius: 10px; box-shadow: var(--wb-shadow); overflow: hidden; }
.scroll { overflow-x: auto; }

/* ---- tables ---- */
table { width: 100%; border-collapse: collapse; font-size: 13.5px; }
thead th { text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: .07em; color: var(--wb-muted); font-weight: 600; padding: 10px 12px; border-bottom: 1px solid var(--wb-line); white-space: nowrap; background: var(--wb-panel); }
tbody td, tbody th { padding: 7px 12px; border-bottom: 1px solid var(--wb-line); vertical-align: middle; text-align: left; font-weight: 400; }
tbody tr:last-child td, tbody tr:last-child th { border-bottom: 0; }
tbody tr:hover { background: var(--wb-inset); }
code { font-family: var(--wb-mono); font-size: 12.5px; }
.tok-name code { color: var(--wb-ink); }
.tok-var code, .tok-val code { color: var(--wb-muted); }
/* Token names are identifiers — breaking one across two lines makes it
   unreadable and un-copyable. The panel scrolls instead. */
.tok-var code, .tok-name code { white-space: nowrap; }
.tok-desc { color: var(--wb-muted); max-width: 42ch; }
.num { font-family: var(--wb-mono); font-variant-numeric: tabular-nums; text-align: right; }
.dim { color: var(--wb-muted); opacity: .7; }
.pill { background: var(--wb-inset); border-radius: 4px; padding: 1px 6px; }

/* ---- swatches ---- */
.chip { display: block; inline-size: 40px; block-size: 24px; padding: 0; border: 1px solid var(--wb-line-strong); border-radius: 5px; overflow: hidden; cursor: pointer; display: flex; background: none; }
.chip:focus-visible { outline: 2px solid var(--wb-accent); outline-offset: 2px; }
.chip-half { flex: 1; }
.tok-chip { inline-size: 56px; }
.tok-demo { inline-size: 120px; }
.bar { display: block; block-size: 12px; background: var(--wb-accent); border-radius: 2px; min-inline-size: 1px; }
.radius-demo { display: block; inline-size: 34px; block-size: 22px; background: var(--wb-accent-soft); border: 1px solid var(--wb-accent); }
.size-demo { display: block; inline-size: 34px; background: var(--wb-accent-soft); border: 1px solid var(--wb-accent); border-radius: 3px; }

/* ---- tags ---- */
.tag { display: inline-block; font-family: var(--wb-mono); font-size: 10.5px; padding: 1px 6px; border-radius: 4px; border: 1px solid transparent; white-space: nowrap; }
.tag-pass { color: var(--wb-pass); border-color: color-mix(in srgb, var(--wb-pass) 40%, transparent); }
.tag-fail { color: var(--wb-fail); border-color: color-mix(in srgb, var(--wb-fail) 45%, transparent); font-weight: 500; }
.tag-exempt { color: var(--wb-muted); border-color: var(--wb-line-strong); }
.tag-quiet { color: var(--wb-muted); border-color: var(--wb-line); margin-left: 8px; }
.pair-preview { display: inline-flex; align-items: center; justify-content: center; inline-size: 40px; block-size: 24px; border-radius: 5px; border: 1px solid var(--wb-line-strong); font-family: var(--wb-mono); font-size: 12px; }

/* ---- controls ---- */
.toolbar { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; margin-bottom: 14px; }
.field { flex: 1 1 220px; min-inline-size: 180px; }
input[type="search"] { inline-size: 100%; font: inherit; font-size: 13.5px; padding: 7px 11px; border-radius: 7px; border: 1px solid var(--wb-line-strong); background: var(--wb-panel); color: var(--wb-ink); }
input[type="search"]:focus-visible { outline: 2px solid var(--wb-accent); outline-offset: 1px; border-color: var(--wb-accent); }
.seg { display: inline-flex; border: 1px solid var(--wb-line-strong); border-radius: 7px; overflow: hidden; background: var(--wb-panel); }
.seg button { font: inherit; font-size: 12.5px; padding: 6px 12px; background: none; border: 0; color: var(--wb-muted); cursor: pointer; }
.seg button + button { border-left: 1px solid var(--wb-line-strong); }
.seg button[aria-pressed="true"] { background: var(--wb-accent); color: var(--wb-accent-on); }
.seg-label { font-size: 11px; text-transform: uppercase; letter-spacing: .08em; color: var(--wb-muted); font-weight: 600; }

/* ---- specimen stage ----
   Carries data-keel-theme, so Keel's palette is switched here and nowhere
   else. The dotted rule is the boundary between "workbench" and "system
   under inspection". */
.stage { background: var(--keel-color-bg-canvas); border: 1px dashed var(--wb-line-strong); border-radius: 10px; padding: 22px; overflow-x: auto; }
.stage table { font-family: var(--wb-sans); }
.stage thead th { background: transparent; color: var(--keel-color-fg-muted); border-bottom-color: var(--keel-color-border-muted); }
.stage tbody td, .stage tbody th { border-bottom-color: var(--keel-color-border-muted); }
.stage tbody tr:hover { background: transparent; }
.stage th[scope="row"] code { color: var(--keel-color-fg-muted); }
.stage caption { caption-side: bottom; padding-top: 12px; font-size: 12.5px; color: var(--keel-color-fg-subtle); text-align: left; }

.notes { margin: 14px 0 0; padding: 0 0 0 18px; color: var(--wb-muted); }
.notes li { margin-bottom: 5px; max-width: 68ch; }

.toast { position: fixed; inset-block-end: 20px; inset-inline-start: 50%; translate: -50% 0; background: var(--wb-ink); color: var(--wb-ground); font-family: var(--wb-mono); font-size: 12.5px; padding: 8px 14px; border-radius: 7px; opacity: 0; pointer-events: none; transition: opacity 160ms ease; }
.toast[data-show] { opacity: 1; }
@media (prefers-reduced-motion: reduce) { .toast { transition: none; } }

.empty { padding: 22px 12px; color: var(--wb-muted); font-size: 13.5px; }

/* ---- component sections ---- */
.component { padding-block-start: 8px; border-block-start: 1px solid var(--wb-line); }
.component:first-of-type { border-block-start: 0; }
.meta-row { display: flex; flex-wrap: wrap; align-items: center; gap: 14px; margin-bottom: 16px; }
.meta-dim { font-size: 12px; color: var(--wb-muted); }
.meta-dim code { font-size: 11.5px; }

.usage { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 14px; margin-bottom: 8px; }
.usage-col { padding: 14px 16px; border-radius: 9px; background: var(--wb-panel); border: 1px solid var(--wb-line); }
/* One rail each, coloured by verdict — the only place semantic colour appears
   in the chrome, and the only place it appears at all. */
.usage-use { border-inline-start: 3px solid var(--wb-pass); }
.usage-avoid { border-inline-start: 3px solid var(--wb-fail); }
.usage-col h4 { margin: 0 0 6px; font-size: 11px; text-transform: uppercase; letter-spacing: .08em; color: var(--wb-muted); }
.usage-col ul { margin: 0; padding-inline-start: 16px; font-size: 13.5px; }
.usage-col li { margin-bottom: 4px; color: var(--wb-ink); }

/* ---- playground ---- */
.play { display: grid; grid-template-columns: 280px minmax(0, 1fr); gap: 16px; align-items: start; }
@media (max-width: 780px) { .play { grid-template-columns: 1fr; } }

.play-controls { display: flex; flex-direction: column; gap: 12px; padding: 16px; background: var(--wb-panel); border: 1px solid var(--wb-line); border-radius: 10px; }
.ctrl { display: flex; flex-direction: column; gap: 5px; }
.ctrl-label { font-size: 10.5px; text-transform: uppercase; letter-spacing: .09em; color: var(--wb-muted); font-weight: 600; font-family: var(--wb-mono); }
.seg-wrap { flex-wrap: wrap; border-radius: 6px; }
.seg-wrap button { font-family: var(--wb-mono); font-size: 11.5px; padding: 4px 9px; }
.ctrl-input { font: inherit; font-family: var(--wb-mono); font-size: 12px; padding: 6px 9px; border-radius: 6px; border: 1px solid var(--wb-line-strong); background: var(--wb-ground); color: var(--wb-ink); resize: vertical; }
.ctrl-input:focus-visible { outline: 2px solid var(--wb-accent); outline-offset: 1px; }
.ctrl-flags { display: flex; flex-wrap: wrap; gap: 4px 12px; }
.flag { display: inline-flex; align-items: center; gap: 5px; font-family: var(--wb-mono); font-size: 11.5px; color: var(--wb-ink); cursor: pointer; }
.flag input { accent-color: var(--wb-accent); margin: 0; }

.play-right { display: flex; flex-direction: column; gap: 12px; min-inline-size: 0; }
.play-stage { display: flex; align-items: center; justify-content: center; min-block-size: 150px; padding: 28px 22px; }
.play-preview { display: flex; align-items: center; justify-content: center; inline-size: 100%; }

.snippet { border: 1px solid var(--wb-line); border-radius: 10px; overflow: hidden; background: var(--wb-panel); }
.snippet-head { display: flex; align-items: center; justify-content: space-between; padding: 6px 12px; border-bottom: 1px solid var(--wb-line); font-size: 10.5px; text-transform: uppercase; letter-spacing: .09em; color: var(--wb-muted); font-weight: 600; }
.snippet-copy { font: inherit; font-size: 10.5px; text-transform: uppercase; letter-spacing: .09em; font-weight: 600; padding: 3px 9px; border-radius: 5px; border: 1px solid var(--wb-line-strong); background: var(--wb-ground); color: var(--wb-muted); cursor: pointer; }
.snippet-copy:hover { color: var(--wb-ink); border-color: var(--wb-accent); }
.snippet-copy:focus-visible { outline: 2px solid var(--wb-accent); outline-offset: 1px; }
.snippet-body { margin: 0; padding: 12px; overflow-x: auto; font-family: var(--wb-mono); font-size: 12.5px; line-height: 1.6; color: var(--wb-ink); }

[data-specimen] { text-align: center; }

/* ============================================================
   Keel's own compiled CSS, inlined verbatim from
   packages/react/dist/styles.css with theme selectors re-scoped.
   ============================================================ */
${keelCss}
</style>

<div class="wrap">
  <header class="masthead">
    <div class="brand">
      <h1>Keel Workbench</h1>
      <p>Every token, contrast result and component in the system — with a live playground on each. Generated from the built packages, so this page cannot drift from the code.</p>
    </div>
    <div class="masthead-right">
      <div class="theme-controls">
        <div class="theme-ctl">
          <span class="seg-label">Page</span>
          <div class="seg" role="group" aria-label="Page theme">
            <button type="button" data-pagetheme="light" aria-pressed="false">Light</button>
            <button type="button" data-pagetheme="dark" aria-pressed="false">Dark</button>
            <button type="button" data-pagetheme="system" aria-pressed="true">System</button>
          </div>
        </div>
        <div class="theme-ctl">
          <span class="seg-label">Specimen</span>
          <div id="specimenToggle"></div>
        </div>
      </div>
      <div class="stats">
      <div class="stat"><b>${entries.length}</b><span>tokens</span></div>
      <div class="stat"><b>${semanticCount}</b><span>semantic roles</span></div>
      <div class="stat ${failures === 0 ? 'ok' : ''}"><b>${enforced.length - failures}/${enforced.length}</b><span>contrast pass</span></div>
      <div class="stat"><b>${COMPONENTS.length}</b><span>components</span></div>
      <div class="stat"><b>${totalCells}</b><span>matrix cells</span></div>
      </div>
    </div>
  </header>

  <aside class="rail">
    <nav aria-label="Sections">
      <div class="rail-head">Foundations</div>
      <a href="#semantic">Semantic color</a>
      <a href="#primitives">Primitive ramps</a>
      <a href="#scales">Scales</a>
      <div class="rail-head">Verification</div>
      <a href="#contrast">Contrast report</a>
      <div class="rail-head">Components</div>
      ${COMPONENTS.map((c) => `<a href="#c-${c.id}">${esc(c.name)}</a>`).join('\n      ')}
    </nav>
  </aside>

  <main>
    <section id="semantic">
      <h2>Semantic color</h2>
      <p class="lede">The only color layer a component may reference. Each swatch shows light on the left, dark on the right — click one to copy its <code>var()</code>. Roles marked <span class="tag tag-quiet">shared</span> resolve to the same value in both themes, so they are authored once.</p>
      <div class="toolbar">
        <div class="field"><input type="search" id="tokenFilter" placeholder="Filter tokens — try “accent”, “border”, “on”" aria-label="Filter tokens"></div>
      </div>
      ${GROUPS.map((g) => {
        const rows = entries.filter(([k]) => g.test(k));
        return `<h3>${g.title}<span class="h3-hint">${esc(g.hint)}</span></h3>
      <div class="panel scroll"><table>
        <thead><tr><th>Swatch</th><th>Token</th><th>CSS variable</th><th>Light</th><th>Dark</th><th>Notes</th></tr></thead>
        <tbody>${rows.map(swatchRow).join('\n')}</tbody>
      </table></div>`;
      }).join('\n')}
      <div class="empty" id="tokenEmpty" hidden>No tokens match that filter.</div>
    </section>

    <section id="primitives">
      <h2>Primitive ramps</h2>
      <p class="lede">Raw values with no meaning attached. Components must never reference these directly — they exist only to be aliased by the semantic roles above. Both themes draw from the same ramps; only the aliasing changes.</p>
      ${RAMPS.map((ramp) => {
        const rows = entries.filter(([k]) => k.startsWith(`color.${ramp}.`));
        if (!rows.length) return '';
        return `<h3>${ramp}</h3>
      <div class="panel scroll"><table>
        <thead><tr><th>Swatch</th><th>Token</th><th>CSS variable</th><th>Light</th><th>Dark</th><th>Notes</th></tr></thead>
        <tbody>${rows.map(swatchRow).join('\n')}</tbody>
      </table></div>`;
      }).join('\n')}
    </section>

    <section id="scales">
      <h2>Scales</h2>
      <p class="lede">Spacing is a 4&nbsp;px step expressed in rem, so it scales with the reader's font-size setting rather than ignoring it. Control sizes are minimum hit targets: <code>md</code> and <code>lg</code> clear the 44&nbsp;px AAA target.</p>
      ${SCALES.map((s) => {
        const rows = entries.filter(([k]) => k.startsWith(s.prefix));
        if (!rows.length) return '';
        return `<h3>${s.title}</h3>
      <div class="panel scroll"><table>
        <thead><tr><th>Preview</th><th>Token</th><th>CSS variable</th><th>Notes</th></tr></thead>
        <tbody>${rows.map((e) => scaleRow(e, s.kind)).join('\n')}</tbody>
      </table></div>`;
      }).join('\n')}
    </section>

    <section id="contrast">
      <h2>Contrast report</h2>
      <p class="lede">Generated by the same gate that runs in CI — <code>packages/tokens/contrast.lib.js</code> is the single definition of which pairs must pass, so this table can never disagree with the build. Exempt pairs are measured and shown but not enforced: WCAG&nbsp;1.4.3 exempts disabled controls, and lifting disabled text to AA makes it read as enabled.</p>
      <div class="toolbar">
        <span class="seg-label">Theme</span>
        <div class="seg" role="group" aria-label="Contrast report theme">
          <button type="button" data-crtheme="light" aria-pressed="true">Light</button>
          <button type="button" data-crtheme="dark" aria-pressed="false">Dark</button>
        </div>
        <span class="seg-label">Show</span>
        <div class="seg" role="group" aria-label="Filter rows">
          <button type="button" data-crfilter="all" aria-pressed="true">All</button>
          <button type="button" data-crfilter="enforced" aria-pressed="false">Enforced only</button>
        </div>
      </div>
      <div class="panel scroll">
        <table id="crTable">
          <thead><tr><th>Sample</th><th>Pair</th><th class="num">Ratio</th><th class="num">Min</th><th>Result</th></tr></thead>
          <tbody data-crbody="light">${contrastTable('light')}</tbody>
          <tbody data-crbody="dark" hidden>${contrastTable('dark')}</tbody>
        </table>
      </div>
    </section>

    ${componentSections}
  </main>
</div>

<div class="toast" id="toast" role="status" aria-live="polite"></div>

<script>
(function () {
  var toast = document.getElementById('toast');
  var toastTimer;
  function say(msg) {
    toast.textContent = msg;
    toast.setAttribute('data-show', '');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.removeAttribute('data-show'); }, 1600);
  }

  // Copy a token's var() reference.
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-copy]');
    if (!btn) return;
    var text = btn.getAttribute('data-copy');
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { say('Copied ' + text); }, function () { say(text); });
    } else {
      say(text);
    }
  });

  // Token filter.
  var filter = document.getElementById('tokenFilter');
  var empty = document.getElementById('tokenEmpty');
  if (filter) {
    filter.addEventListener('input', function () {
      var q = filter.value.trim().toLowerCase();
      var shown = 0;
      document.querySelectorAll('#semantic .tok').forEach(function (row) {
        var hit = !q || row.getAttribute('data-token').toLowerCase().indexOf(q) !== -1;
        row.hidden = !hit;
        if (hit) shown++;
      });
      // Hide a group heading and panel whose rows are all filtered out.
      document.querySelectorAll('#semantic .panel').forEach(function (panel) {
        var any = panel.querySelectorAll('.tok:not([hidden])').length > 0;
        panel.hidden = !any;
        var h3 = panel.previousElementSibling;
        if (h3 && h3.tagName === 'H3') h3.hidden = !any;
      });
      empty.hidden = shown !== 0;
    });
  }

  // Segmented controls.
  function bindSeg(attr, apply) {
    document.querySelectorAll('[' + attr + ']').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var group = btn.closest('.seg');
        group.querySelectorAll('button').forEach(function (b) { b.setAttribute('aria-pressed', String(b === btn)); });
        apply(btn.getAttribute(attr));
      });
    });
  }

  // ---------------------------------------------------------- page theme
  //
  // Three states, not two. With only light/dark there is no way back to
  // "follow my OS" once you have touched the control, and the un-stamped
  // system state is what most people actually want. "system" removes the
  // attribute entirely so the prefers-color-scheme media query takes over.
  var PAGE_KEY = 'keel-workbench-page-theme';

  function applyPageTheme(choice) {
    if (choice === 'system') document.documentElement.removeAttribute('data-theme');
    else document.documentElement.setAttribute('data-theme', choice);
    document.querySelectorAll('[data-pagetheme]').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.getAttribute('data-pagetheme') === choice));
    });
    // Storage throws outright in some privacy modes; a theme preference is not
    // worth breaking the page over.
    try { localStorage.setItem(PAGE_KEY, choice); } catch (e) {}
  }

  var storedPage = 'system';
  try {
    var raw = localStorage.getItem(PAGE_KEY);
    if (raw === 'light' || raw === 'dark' || raw === 'system') storedPage = raw;
  } catch (e) {}
  applyPageTheme(storedPage);

  document.querySelectorAll('[data-pagetheme]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      applyPageTheme(btn.getAttribute('data-pagetheme'));
    });
  });

  // The specimen control is the real ThemeToggle, rendered by its own renderer
  // and driving every stage on the page — the component documenting itself.
  var specimenTheme = 'light';
  function paintSpecimenToggle() {
    var d = DATA['theme-toggle'];
    var host = document.getElementById('specimenToggle');
    if (!d || !host) return;
    var state = {};
    Object.keys(d.props).forEach(function (k) { state[k] = d.props[k]; });
    Object.keys(d.booleans).forEach(function (k) { state[k] = d.booleans[k]; });
    Object.keys(d.slots).forEach(function (k) { state[k] = d.slots[k]; });
    state.theme = specimenTheme;
    state.size = 'sm';
    host.innerHTML = d.fn(state, h);
    host.setAttribute('data-keel-theme', 'light');
  }
  var specimenHost = document.getElementById('specimenToggle');
  if (specimenHost) {
    specimenHost.addEventListener('click', function () {
      specimenTheme = specimenTheme === 'light' ? 'dark' : 'light';
      document.querySelectorAll('.stage').forEach(function (st) {
        st.setAttribute('data-keel-theme', specimenTheme);
      });
      paintSpecimenToggle();
    });
  }

  bindSeg('data-crtheme', function (theme) {
    document.querySelectorAll('[data-crbody]').forEach(function (b) { b.hidden = b.getAttribute('data-crbody') !== theme; });
  });

  bindSeg('data-crfilter', function (mode) {
    document.querySelectorAll('#crTable .cr').forEach(function (row) {
      row.hidden = mode === 'enforced' && row.getAttribute('data-status') === 'exempt';
    });
  });

  // ------------------------------------------------------------ playground
  var DATA = ${PLAY_DATA};

  // Built from a char code so the escape sequence never has to survive being
  // written through a template literal on the way into this page.
  var NL = String.fromCharCode(10);

  function h(v) {
    return String(v == null ? '' : v)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // Compile each renderer body once.
  Object.keys(DATA).forEach(function (id) {
    DATA[id].fn = new Function('s', 'h', DATA[id].render);
  });

  /**
   * Build the JSX snippet from the contract and the current state.
   *
   * Fully generic: enum props appear only when they differ from the contract
   * default, booleans appear as bare attributes when true, and one designated
   * slot becomes children. Nothing here knows which component it is looking at,
   * which is why adding a component to @keel/contracts is enough to give it a
   * working snippet.
   */
  function snippetFor(id, state) {
    var d = DATA[id];
    var attrs = [];

    Object.keys(d.props).forEach(function (k) {
      if (state[k] !== d.props[k]) attrs.push(k + '="' + state[k] + '"');
    });
    Object.keys(d.booleans).forEach(function (k) {
      if (state[k]) attrs.push(k);
    });
    // Slots are plain strings, so they read as JSX string attributes. The
    // brace form is only correct when the value contains a double quote, which
    // a string attribute cannot carry.
    // A required slot always appears, because the example has to compile. An
    // optional one appears only when it differs from the documented default —
    // otherwise every snippet restates values the component already supplies.
    Object.keys(d.slots).forEach(function (k) {
      if (k === d.childrenSlot) return;
      var v = state[k];
      if (v === undefined || v === '') return;
      if (!d.slotRequired[k] && v === d.slots[k]) return;
      attrs.push(v.indexOf('"') === -1 ? k + '="' + v + '"' : k + '={' + JSON.stringify(v) + '}');
    });

    var open = '<' + d.name + (attrs.length ? ' ' + attrs.join(' ') : '');
    var kids = d.childrenSlot ? state[d.childrenSlot] : '';

    if (d.childrenSlot && kids) {
      var oneLine = open + '>' + kids + '</' + d.name + '>';
      if (oneLine.length <= 68) return oneLine;
      return '<' + d.name + NL + attrs.map(function (a) { return '  ' + a; }).join(NL) +
        (attrs.length ? NL : '') + '>' + NL + '  ' + kids + NL + '</' + d.name + '>';
    }
    var selfClosed = open + ' />';
    if (selfClosed.length <= 68) return selfClosed;
    return '<' + d.name + NL + attrs.map(function (a) { return '  ' + a; }).join(NL) + NL + '/>';
  }

  paintSpecimenToggle();

  document.querySelectorAll('[data-play]').forEach(function (root) {
    var id = root.getAttribute('data-play');
    var d = DATA[id];
    if (!d) return;

    var state = {};
    Object.keys(d.props).forEach(function (k) { state[k] = d.props[k]; });
    Object.keys(d.booleans).forEach(function (k) { state[k] = d.booleans[k]; });
    Object.keys(d.slots).forEach(function (k) { state[k] = d.slots[k]; });

    var preview = root.querySelector('.play-preview');
    var code = root.querySelector('.snippet-body code');

    function paint() {
      preview.innerHTML = d.fn(state, h);
      code.textContent = snippetFor(id, state);
    }

    root.querySelectorAll('[data-prop]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var prop = btn.getAttribute('data-prop');
        state[prop] = btn.getAttribute('data-value');
        btn.closest('.seg').querySelectorAll('button').forEach(function (b) {
          b.setAttribute('aria-pressed', String(b === btn));
        });
        paint();
      });
    });

    root.querySelectorAll('[data-bool]').forEach(function (input) {
      input.addEventListener('change', function () {
        state[input.getAttribute('data-bool')] = input.checked;
        paint();
      });
    });

    root.querySelectorAll('[data-slot]').forEach(function (input) {
      input.addEventListener('input', function () {
        state[input.getAttribute('data-slot')] = input.value;
        paint();
      });
    });

    var copyBtn = root.querySelector('[data-copy-snippet]');
    if (copyBtn) {
      copyBtn.addEventListener('click', function () {
        var text = code.textContent;
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(function () { say('Snippet copied'); }, function () { say('Copy failed'); });
        } else { say('Copy unavailable'); }
      });
    }

    paint();
  });

  // Matrix cells: same renderer, defaults overridden per cell.
  document.querySelectorAll('[data-matrix]').forEach(function (wrap) {
    var id = wrap.getAttribute('data-matrix');
    var d = DATA[id];
    if (!d) return;
    wrap.querySelectorAll('[data-specimen]').forEach(function (cell) {
      var over = JSON.parse(cell.getAttribute('data-specimen'));
      var state = {};
      Object.keys(d.props).forEach(function (k) { state[k] = d.props[k]; });
      Object.keys(d.booleans).forEach(function (k) { state[k] = d.booleans[k]; });
      Object.keys(d.slots).forEach(function (k) { state[k] = d.slots[k]; });
      Object.keys(over).forEach(function (k) { state[k] = over[k]; });
      cell.innerHTML = d.fn(state, h);
    });
  });
})();
</script>
`;

await mkdir(resolve(here, 'dist'), { recursive: true });
await writeFile(resolve(here, 'dist/index.html'), html, 'utf8');

console.log(
  `keel-workbench — dist/index.html  ${(Buffer.byteLength(html) / 1024).toFixed(1)} kB  ` +
    `(${entries.length} tokens, ${enforced.length} enforced contrast pairs, ` +
    `${COMPONENTS.length} components, ${totalCells} matrix cells)`,
);
if (failures > 0) console.error(`WARNING: ${failures} contrast failure(s) are shown on the page.`);
