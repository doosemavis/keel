/**
 * CSS bundler.
 *
 * Inlines every `@import` — relative paths and bare package specifiers alike —
 * into a single flat stylesheet per entry.
 *
 * Shipping the un-inlined file would work in most bundlers, but it makes the
 * consumer's toolchain responsible for resolving `@keel/tokens/tokens.css` out
 * of node_modules. A plain `<link>` tag or a bundler without CSS package
 * resolution would silently render an unstyled page. One flat file always
 * works, which matters more here than saving a few bytes.
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve as resolvePath } from 'node:path';
import { fileURLToPath } from 'node:url';

const IMPORT = /^\s*@import\s+['"]([^'"]+)['"]\s*;\s*$/gm;

async function resolveSpecifier(spec, fromFile) {
  if (spec.startsWith('.') || spec.startsWith('/')) {
    return resolvePath(dirname(fromFile), spec);
  }
  // Bare specifier — let Node's resolver honour the package's exports map.
  const url = import.meta.resolve(spec, `file://${fromFile}`);
  return fileURLToPath(url);
}

const seen = new Set();

async function inline(file) {
  if (seen.has(file)) return `/* already inlined: ${file} */\n`;
  seen.add(file);

  const css = await readFile(file, 'utf8');
  const specs = [...css.matchAll(IMPORT)].map((m) => m[1]);

  let out = css;
  for (const spec of specs) {
    const target = await resolveSpecifier(spec, file);
    const nested = await inline(target);
    out = out.replace(new RegExp(`^\\s*@import\\s+['"]${spec.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}['"]\\s*;\\s*$`, 'm'), nested);
  }
  return out;
}

const here = dirname(fileURLToPath(import.meta.url));
await mkdir(resolvePath(here, 'dist'), { recursive: true });

for (const entry of ['styles.css', 'components.css']) {
  seen.clear();
  const bundled = await inline(resolvePath(here, 'src', entry));
  await writeFile(resolvePath(here, 'dist', entry), bundled, 'utf8');
  const kb = (Buffer.byteLength(bundled) / 1024).toFixed(2);
  console.log(`@keel/react — dist/${entry}  ${kb} kB`);
}
