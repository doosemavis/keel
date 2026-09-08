---
'@keel/tokens': minor
---

Add a `./utilities.css` export: one CSS class per semantic color role (`.keel-bg-accent`, `.keel-text-accent`, `.keel-border-accent`, and so on), for a consumer who wants to apply a Keel color to their own markup via a class name rather than a CSS custom property — the `class="lmn-primary"` pattern some design systems ship. The classes are generated from the same semantic color tokens that already produce `tokens.css`, not hand-listed, so a new semantic role gets a class automatically with no separate list to fall out of sync. Naming follows the token category: `bg.*` → `.keel-bg-{role}`, `fg.*` → `.keel-text-{role}`, `border.*` → `.keel-border-{role}`.
