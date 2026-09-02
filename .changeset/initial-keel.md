---
'@keel/contracts': minor
'@keel/tokens': minor
'@keel/react': minor
---

Initial release.

- `@keel/tokens` — DTCG token source compiled by Style Dictionary into CSS custom properties, typed TypeScript references and JSON. Light and dark themes, with dark authored as a diff over light. A WCAG contrast gate covering 56 enforced pairs runs as part of the build.
- `@keel/contracts` — machine-readable component contracts plus `matrix()`, `propMatrix()` and `validateContract()`. This is the shared source of truth that keeps framework implementations from drifting.
- `@keel/react` — Button, built on React Aria. Ships `aria-disabled` rather than native `disabled` so disabled controls stay discoverable, honours `prefers-reduced-motion`, and handles Windows High Contrast Mode.
