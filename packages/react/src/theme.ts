/**
 * Theme resolution, persistence and the flash-of-wrong-theme guard.
 *
 * Kept framework-free on purpose: the Angular package will import these same
 * functions rather than reimplementing the storage key, the attribute name and
 * the media query in a second place. Those three details are the whole contract
 * between a Keel app and its stylesheet — duplicating them is how a design
 * system ends up with two themes that disagree.
 */

export type Theme = 'light' | 'dark';

/** What the user chose. `system` means "follow the OS", which is the default. */
export type ThemePreference = Theme | 'system';

/** The attribute Keel's compiled CSS keys its dark block on. */
export const THEME_ATTRIBUTE = 'data-theme';

export const THEME_STORAGE_KEY = 'keel-theme';

const DARK_QUERY = '(prefers-color-scheme: dark)';

/** The OS-level preference, or 'light' where it cannot be read. */
export function systemTheme(): Theme {
  if (typeof window === 'undefined' || !window.matchMedia) return 'light';
  return window.matchMedia(DARK_QUERY).matches ? 'dark' : 'light';
}

/** Turn a preference into a concrete theme. */
export function resolveTheme(preference: ThemePreference): Theme {
  return preference === 'system' ? systemTheme() : preference;
}

/**
 * Read the stored preference.
 *
 * Every access is guarded: storage throws outright in some privacy modes and in
 * server rendering, and a theme toggle is not worth crashing an app over.
 */
export function readStoredPreference(storageKey: string = THEME_STORAGE_KEY): ThemePreference | null {
  try {
    const raw = window.localStorage.getItem(storageKey);
    return raw === 'light' || raw === 'dark' || raw === 'system' ? raw : null;
  } catch {
    return null;
  }
}

export function writeStoredPreference(
  preference: ThemePreference,
  storageKey: string = THEME_STORAGE_KEY,
): void {
  try {
    window.localStorage.setItem(storageKey, preference);
  } catch {
    /* Storage unavailable. The theme still applies for this page view. */
  }
}

/** Stamp the theme onto an element — the document root by default. */
export function applyTheme(theme: Theme, element?: HTMLElement): void {
  const target = element ?? (typeof document !== 'undefined' ? document.documentElement : null);
  target?.setAttribute(THEME_ATTRIBUTE, theme);
}

/** Stored choice if there is one, otherwise the OS preference. */
export function initialTheme(storageKey: string = THEME_STORAGE_KEY): Theme {
  return resolveTheme(readStoredPreference(storageKey) ?? 'system');
}

/**
 * A blocking snippet to inline in `<head>`, before any stylesheet.
 *
 * Without it the page paints in the default theme and then corrects itself once
 * React hydrates — a white flash on every load for dark-theme users, which is
 * both ugly and, at night, genuinely unpleasant. This has to run synchronously
 * and before first paint, which is why it is a string of plain JS rather than
 * anything the component itself can do.
 *
 * @example
 * <script dangerouslySetInnerHTML={{ __html: themeInitScript() }} />
 */
export function themeInitScript(storageKey: string = THEME_STORAGE_KEY): string {
  return `(function(){try{var k=${JSON.stringify(storageKey)};var s=localStorage.getItem(k);var t=(s==="light"||s==="dark")?s:(window.matchMedia&&window.matchMedia("${DARK_QUERY}").matches?"dark":"light");document.documentElement.setAttribute("${THEME_ATTRIBUTE}",t);}catch(e){}})();`;
}
