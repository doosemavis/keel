import StyleDictionary from 'style-dictionary';
import { fileHeader } from 'style-dictionary/utils';
import { mkdir, readFile, writeFile } from 'node:fs/promises';

/**
 * Keel token build.
 *
 * Two passes over the same primitive layer:
 *   light -> :root                (semantic/color.json alone)
 *   dark  -> [data-theme="dark"]  (semantic/color.json + semantic/color.dark.json)
 *
 * The dark file carries only the roles that differ, so a role shared by both
 * themes is authored exactly once. Merge order is what makes that work:
 * later sources win, so the dark overrides land on top of the light base.
 *
 * Output is CSS custom properties. That is the one artifact React and Angular
 * can consume byte-identically, and it makes theming a `data-theme` attribute
 * swap with no JavaScript.
 */

const PREFIX = 'keel';

StyleDictionary.registerFileHeader({
  name: 'keel',
  fileHeader: () => [
    'Do not edit. Generated from packages/tokens/src by `npm run build`.',
    'Components must reference semantic roles (--keel-color-bg-accent),',
    'never primitive ramps (--keel-color-blue-600).',
  ],
});

const PRIMITIVES = ['src/primitive/*.json'];
const LIGHT = [...PRIMITIVES, 'src/semantic/color.json'];
const DARK = [...LIGHT, 'src/semantic/color.dark.json'];

/** Emit only the tokens that came from a semantic source, for the dark pass. */
StyleDictionary.registerFilter({
  name: 'keel/semantic-only',
  filter: (token) => token.filePath.includes('/semantic/'),
});

/** Strip the leading `primitive`/`semantic` grouping from the CSS variable name. */
StyleDictionary.registerTransform({
  name: 'keel/name-kebab',
  type: 'name',
  transform: (token) => [PREFIX, ...token.path].join('-').replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase(),
});

const TRANSFORMS = [
  'attribute/cti',
  'keel/name-kebab',
  'time/seconds',
  'html/icon',
  'color/css',
  'size/rem',
  'asset/url',
  'fontFamily/css',
  'cubicBezier/css',
  'strokeStyle/css/shorthand',
  'border/css/shorthand',
  'typography/css/shorthand',
  'transition/css/shorthand',
  'shadow/css/shorthand',
];

async function buildCss({ sources, destination, selector, filter }) {
  const sd = new StyleDictionary({
    source: sources,
    // file header registered globally above
    log: { verbosity: 'silent', warnings: 'disabled' },
    platforms: {
      css: {
        transforms: TRANSFORMS,
        buildPath: 'dist/',
        options: { fileHeader: 'keel' },
        files: [
          {
            destination,
            format: 'css/variables',
            options: { selector, outputReferences: true },
            ...(filter ? { filter } : {}),
          },
        ],
      },
    },
  });
  await sd.buildAllPlatforms();
}

/**
 * TypeScript emitter.
 *
 * Deliberately emits `var(--keel-*)` strings rather than resolved hex values.
 * Inlining the resolved value would freeze the light theme into the JS bundle
 * and break runtime theming — the token object has to stay a pointer at the
 * CSS custom property, not a copy of its current value.
 */
async function buildTypeScript() {
  const sd = new StyleDictionary({
    source: LIGHT,
    // file header registered globally above
    log: { verbosity: 'silent', warnings: 'disabled' },
    platforms: { noop: { transforms: TRANSFORMS, files: [] } },
  });
  const dict = await sd.getPlatformTokens('noop');

  const entries = dict.allTokens
    .map((t) => ({
      key: t.path.join('.'),
      cssVar: `--${t.name}`,
      description: t.$description ?? t.comment,
      type: t.$type ?? t.type,
    }))
    .sort((a, b) => a.key.localeCompare(b.key));

  const header = await fileHeader({ file: {}, formatting: { fileHeaderTimestamp: false }, options: { fileHeader: 'keel' } });

  const body = entries
    .map((e) => {
      const doc = e.description ? `  /** ${e.description} */\n` : '';
      return `${doc}  '${e.key}': 'var(${e.cssVar})',`;
    })
    .join('\n');

  const ts = `${header}
export const tokens = {
${body}
} as const;

/** Every token name Keel publishes, e.g. \`'color.bg.accent'\`. */
export type TokenName = keyof typeof tokens;

/** A \`var(--keel-*)\` reference string. */
export type TokenValue = (typeof tokens)[TokenName];

/**
 * Look up a token by name and get back its \`var(--keel-*)\` reference.
 * Unknown names are a compile error, which is the point.
 */
export function token<K extends TokenName>(name: K): (typeof tokens)[K] {
  return tokens[name];
}

/** The themes Keel ships. Set \`data-theme\` on any element to scope one. */
export const themes = ['light', 'dark'] as const;
export type Theme = (typeof themes)[number];
`;

  await mkdir('dist', { recursive: true });
  await writeFile('dist/index.ts', ts, 'utf8');

  const json = Object.fromEntries(entries.map((e) => [e.key, { cssVar: e.cssVar, type: e.type, description: e.description }]));
  await writeFile('dist/tokens.json', `${JSON.stringify(json, null, 2)}\n`, 'utf8');

  return entries.length;
}

await buildCss({ sources: LIGHT, destination: 'tokens.css', selector: ':root, [data-theme="light"]' });
await buildCss({
  sources: DARK,
  destination: 'tokens.dark.css',
  selector: '[data-theme="dark"]',
  filter: 'keel/semantic-only',
});
const count = await buildTypeScript();

/**
 * Emit fonts.css — the webfont loader, DERIVED from the typography tokens.
 *
 * A design system that specifies DM Sans and gives consumers no way to load it
 * is broken, and a hand-written font loader is exactly the kind of thing that
 * drifts: someone changes font.family.sans and the loader keeps fetching the
 * old face forever. So the Google Fonts request is generated from the same
 * tokens the CSS variables come from — the first family in each stack, which
 * is by definition the webfont, with the rest being local fallbacks.
 *
 * A <link> in <head> is faster than an @import and is what the README
 * recommends; this file exists for build setups where importing CSS is simply
 * more convenient than editing an HTML template.
 */
async function buildFontLoader() {
  const typography = JSON.parse(await readFile('src/primitive/typography.json', 'utf8'));
  const families = typography.font.family;

  // Object.entries over a DTCG group yields its `$type` metadata key too.
  const roles = Object.entries(families).filter(([k, v]) => !k.startsWith('$') && v && v.$value);

  // Which weight axes to request is a property of the FACE, not of the role, so
  // it is declared beside the family in typography.json rather than mapped by
  // role here. This file used to hold that map, and it was wrong the moment the
  // sans changed: it asked every sans for an `opsz` axis, which Atkinson
  // Hyperlegible Next does not have, and Google Fonts answers an unknown axis
  // with a 400 — a silently missing webfont and a page that falls back to
  // system sans with nothing in the build to say so.
  //
  // A family with no declared axes is a pure fallback stack and is not fetched.
  const specs = roles
    .filter(([, def]) => def.$extensions?.['keel.webfont']?.axes)
    .map(([, def]) => {
      const webfont = def.$value[0];
      const { axes } = def.$extensions['keel.webfont'];
      return `family=${webfont.replace(/ /g, '+')}:${axes}`;
    });

  const href = `https://fonts.googleapis.com/css2?${specs.join('&')}&display=swap`;
  const list = roles.map(([role, def]) => ` *   ${role.padEnd(8)} ${def.$value[0]}`).join('\n');

  const css = `/**
 * Keel webfonts. GENERATED — do not edit.
 *
 * Derived from packages/tokens/src/primitive/typography.json, so it can never
 * request a face the tokens do not declare:
 *
${list}
 *
 * PREFER a <link> in your <head> — it starts the download earlier than an
 * @import inside a stylesheet, which the browser cannot see until the
 * stylesheet itself has arrived:
 *
 *   <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
 *   <link rel="stylesheet" href="${href}">
 *
 * Import this file only where editing the HTML shell is impractical.
 */
@import url('${href}');
`;

  await writeFile('dist/fonts.css', css, 'utf8');
  return roles.length;
}

const faces = await buildFontLoader();

console.log(
  `@keel/tokens — built ${count} tokens: tokens.css, tokens.dark.css, fonts.css (${faces} faces), index.ts, tokens.json`,
);
