import type { ComponentContract } from './types.js';

/**
 * The theme toggle is a system-level control, not a form control.
 *
 * It is modelled as `role="switch"` with the accessible name "Dark theme"
 * rather than as a two-option radio group, because the thing being toggled is
 * one boolean setting that takes effect immediately. That also means the
 * announcement is "Dark theme, on" — which says what will happen — instead of
 * the icons' meaning, which assistive technology never sees.
 */
export const themeToggleContract = {
  id: 'theme-toggle',
  name: 'ThemeToggle',
  status: 'experimental',
  a11yReviewed: null,
  description: 'Switches the interface between the light and dark themes, and remembers the choice.',

  props: {
    theme: {
      values: ['light', 'dark'],
      defaultValue: 'light',
      description: 'The active theme. Controlled — pair it with onChange, or leave it off and use defaultTheme.',
    },
    size: {
      values: ['sm', 'md'],
      defaultValue: 'md',
      description: 'Track size. Both sizes keep a hit target of at least 24px.',
    },
  },

  booleans: {
    showLabels: {
      defaultValue: false,
      description: 'Renders the light and dark text labels beside the track, for settings panels where the icons alone are too terse.',
    },
    disabled: {
      defaultValue: false,
      description: 'Prevents interaction. Stays focusable via aria-disabled.',
    },
  },

  slots: {
    label: {
      defaultValue: 'Dark theme',
      description: 'The accessible name. Names the setting in plain language — the emblems are decoration and are never announced.',
      isAccessibleName: true,
    },
    lightLabel: {
      defaultValue: 'Light',
      description: 'Text for the light end, shown when showLabels is on.',
    },
    darkLabel: {
      defaultValue: 'Dark',
      description: 'Text for the dark end, shown when showLabels is on.',
    },
  },

  states: ['default', 'hover', 'focus', 'disabled'],

  a11y: {
    role: 'switch',
    activationKeys: [' '],
    disabledStrategy: 'aria-disabled',
    keyboardOperable: true,
    notes: [
      'role="switch" with aria-checked, so it announces "Dark theme, on" rather than reading out the emblem.',
      'Both emblems are aria-hidden. Their meaning is thematic, not informational — the accessible name carries it.',
      'The two emblems differ in silhouette as well as colour — the light one opens upward and radiates, the dark one closes downward — so the state is legible in greyscale and to colour-blind users.',
      'The knob travel and the track colour both change, so state never depends on a single visual channel.',
      'Honours prefers-color-scheme on first load when no choice has been stored, rather than assuming light.',
      'Under prefers-reduced-motion the knob moves without the rotation flourish.',
    ],
  },

  usage: {
    use: [
      'Once per application, in a header or settings panel.',
      'Alongside a stored preference, so a returning visitor keeps the theme they picked.',
    ],
    avoid: [
      'More than one per page — two controls for one global setting will disagree.',
      'Overriding the OS preference before the user has expressed one of their own.',
      'Relying on the emblems alone to convey which state is active.',
    ],
  },

  related: ['switch'],
} as const satisfies ComponentContract;
