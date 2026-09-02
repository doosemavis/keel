---
'@keel/contracts': minor
'@keel/react': minor
---

Add `ThemeToggle`, plus the theme utilities behind it: `themeInitScript()`, `applyTheme()`, `initialTheme()`, `resolveTheme()`, `systemTheme()` and the storage helpers.

The toggle is `role="switch"` named "Dark theme" rather than a pair of icon buttons. Its two emblems are `aria-hidden` and differ in silhouette as well as colour — one opens upward and radiates, the other closes downward inside a hard shell — so the state stays readable in greyscale and in forced-colors mode, where colour is gone entirely.

`themeInitScript()` ships separately because no component can prevent the flash of the wrong theme: by the time React runs the page has already painted. The snippet is synchronous, belongs in `<head>` above the stylesheet, and the component reads whatever it decided.

`ContractSlot` gains `required`, which lets generated code examples include the props a component genuinely cannot default and omit the ones it can.
