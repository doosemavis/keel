import { useCallback, useEffect, useState } from 'react';
import { Switch as AriaSwitch } from 'react-aria-components';
import type { themeToggleSpec } from '@keel/specs';
import {
  applyTheme,
  initialTheme,
  writeStoredPreference,
  THEME_STORAGE_KEY,
  type Theme,
} from '../theme.js';
import { LightEmblem, DarkEmblem } from './emblems.js';

type Spec = typeof themeToggleSpec;
export type ThemeToggleSize = Spec['props']['size']['values'][number];

export interface ThemeToggleProps {
  /** Track size. @default 'md' */
  size?: ThemeToggleSize;
  /** Controlled theme. Omit to let the component manage its own state. */
  theme?: Theme;
  /** Starting theme when uncontrolled. Omit to follow the stored choice, then the OS. */
  defaultTheme?: Theme;
  onChange?: (theme: Theme) => void;
  /** Show the light and dark text labels beside the track. @default false */
  showLabels?: boolean;
  /** @default false */
  disabled?: boolean;
  /** Accessible name. Names the setting, not the emblem. @default 'Dark theme' */
  label?: string;
  /** @default 'Light' */
  lightLabel?: string;
  /** @default 'Dark' */
  darkLabel?: string;
  /**
   * Where the theme attribute is written. `document` stamps the root element,
   * which is what a real app wants. `none` leaves the DOM alone — for previews
   * and docs pages that scope the theme to a container themselves.
   * @default 'document'
   */
  target?: 'document' | 'none';
  /** @default 'keel-theme' */
  storageKey?: string;
  className?: string;
}

/**
 * Switches the interface between the light and dark themes, and remembers it.
 *
 * Two things about this component are worth knowing before you use it.
 *
 * It is `role="switch"` named "Dark theme", not a pair of icon buttons. The
 * emblems are `aria-hidden`, so what a screen reader announces is the setting
 * and its state — "Dark theme, on" — never the artwork. Icon-only toggles that
 * lean on the picture to convey meaning are unusable without sight, and there
 * is no good `aria-label` for "the dark side".
 *
 * It does NOT solve the flash of wrong theme on its own. A component cannot —
 * by the time React runs, the page has already painted. Inline
 * `themeInitScript()` in `<head>` for that; this component picks up whatever
 * that script decided.
 */
export function ThemeToggle({
  size = 'md',
  theme: controlled,
  defaultTheme,
  onChange,
  showLabels = false,
  disabled = false,
  label = 'Dark theme',
  lightLabel = 'Light',
  darkLabel = 'Dark',
  target = 'document',
  storageKey = THEME_STORAGE_KEY,
  className,
}: ThemeToggleProps) {
  // Start from `defaultTheme` if given, otherwise 'light' — deliberately NOT
  // reading storage here. Server and client must produce identical first
  // renders or hydration mismatches; the real value is picked up in the effect
  // below, after the DOM exists.
  const [uncontrolled, setUncontrolled] = useState<Theme>(defaultTheme ?? 'light');
  const isControlled = controlled !== undefined;
  const theme = isControlled ? controlled : uncontrolled;

  useEffect(() => {
    if (isControlled || defaultTheme !== undefined) return;
    setUncontrolled(initialTheme(storageKey));
  }, [isControlled, defaultTheme, storageKey]);

  useEffect(() => {
    if (target === 'document') applyTheme(theme);
  }, [theme, target]);

  const handleChange = useCallback(
    (isDark: boolean) => {
      if (disabled) return;
      const next: Theme = isDark ? 'dark' : 'light';
      // An explicit choice is a preference, so it is stored. Until someone
      // touches this control the OS setting continues to win.
      writeStoredPreference(next, storageKey);
      if (!isControlled) setUncontrolled(next);
      onChange?.(next);
    },
    [disabled, isControlled, onChange, storageKey],
  );

  return (
    <AriaSwitch
      isSelected={theme === 'dark'}
      onChange={handleChange}
      aria-label={label}
      className={['keel-ThemeToggle', className].filter(Boolean).join(' ')}
      data-size={size}
      data-theme-value={theme}
      {...(disabled ? { 'aria-disabled': true as const } : {})}
    >
      {showLabels ? (
        <span className="keel-ThemeToggle-text" aria-hidden="true">
          {lightLabel}
        </span>
      ) : null}

      <span className="keel-ThemeToggle-track" aria-hidden="true">
        {/* Both emblems sit in the track at all times so it reads as a choice
            between two things rather than one state with an icon on it. */}
        <LightEmblem className="keel-ThemeToggle-ghost keel-ThemeToggle-ghost--light" />
        <DarkEmblem className="keel-ThemeToggle-ghost keel-ThemeToggle-ghost--dark" />
        <span className="keel-ThemeToggle-knob">
          {theme === 'dark' ? (
            <DarkEmblem className="keel-ThemeToggle-emblem" />
          ) : (
            <LightEmblem className="keel-ThemeToggle-emblem" />
          )}
        </span>
      </span>

      {showLabels ? (
        <span className="keel-ThemeToggle-text" aria-hidden="true">
          {darkLabel}
        </span>
      ) : null}
    </AriaSwitch>
  );
}
