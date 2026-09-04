/**
 * Every component spec, re-exported from the package you already installed.
 *
 * ── Why this is a subpath and not `Button.spec`
 *
 * Attaching each spec to its component as a static property is the more
 * discoverable design — autocomplete finds it, and nobody has to know a second
 * import path exists. It was measured and rejected.
 *
 * The specs are 9.6 kB gzipped. `@keel/react` is 7.5 kB gzipped. A static
 * property on an exported component is reachable from that component, so no
 * bundler can shake it out, and every application that renders a Button would
 * ship 9.6 kB of prose describing what a Button is in order to render one. That
 * is a 128 % increase paid by every consumer for a feature almost none of them
 * will call.
 *
 * As a subpath, the cost is paid only by the code that asks for it, and the
 * specs still travel inside the package rather than requiring a second install:
 *
 *     import { Button } from '@keel/react';        // 7.5 kB, unchanged
 *     import { buttonSpec } from '@keel/react/specs';  // opt in
 *
 * ── What you get
 *
 * The complete machine-readable description of every component: its props and
 * their allowed values and defaults, its boolean flags, its slots, the states
 * it implements, and its accessibility contract — role, activation keys,
 * disabled strategy. This is the same data Keel's own documentation, story
 * matrices and parity tests are generated from, so it cannot describe a
 * component the library does not actually ship.
 *
 * Useful for building your own documentation, generating prop tables, driving
 * a design-token linter, or asserting in your own tests that an upgrade has not
 * silently removed a variant you depend on.
 */
export * from '@keel/specs';
