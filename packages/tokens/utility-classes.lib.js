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
