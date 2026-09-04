import type { ComponentSpec } from './types.js';

/**
 * Button is the first component on purpose.
 *
 * It is the culmination of every foundational decision in the system —
 * typography, spacing, radius, colour roles, focus treatment, icon slot,
 * loading affordance and disabled semantics all collide in one place. Getting
 * Button genuinely right forces every token and every convention to be settled,
 * and everything after it is comparatively mechanical.
 */
export const buttonSpec = {
  id: 'button',
  name: 'Button',
  status: 'experimental',
  a11yReviewed: null,
  description:
    'Triggers an action. Use a Button for anything that changes state; use a Link for anything that navigates.',

  props: {
    variant: {
      values: ['primary', 'secondary', 'ghost', 'danger'],
      defaultValue: 'secondary',
      description:
        'Visual weight. Exactly one primary per view — if two actions both look primary, neither reads as the main one.',
    },
    size: {
      values: ['sm', 'md', 'lg'],
      defaultValue: 'md',
      description:
        'Control height. `md` and `lg` clear the 44px AAA hit target; `sm` is for dense data UI and must not be the only way to reach an action.',
    },
  },

  booleans: {
    disabled: {
      defaultValue: false,
      description: 'Prevents activation. Rendered as aria-disabled so the button stays in the tab order.',
    },
    loading: {
      defaultValue: false,
      description: 'Shows a spinner, sets aria-busy and blocks activation while the action is in flight.',
    },
    fullWidth: {
      defaultValue: false,
      description: 'Stretches to the width of the container. For narrow columns and mobile layouts.',
    },
  },

  slots: {
    label: {
      defaultValue: 'Save changes',
      description: 'The button text. Name the action, not the object — "Save changes", never "OK".',
      isAccessibleName: true,
    },
  },

  states: ['default', 'hover', 'focus', 'active', 'disabled', 'loading'],

  a11y: {
    role: 'button',
    activationKeys: ['Enter', ' '],
    // aria-disabled rather than the native attribute: a natively disabled button
    // leaves the tab order entirely, so a screen reader user sweeping the page
    // never learns the action exists or why it is unavailable.
    disabledStrategy: 'aria-disabled',
    keyboardOperable: true,
    notes: [
      'A disabled Button stays focusable and announces aria-disabled, so assistive technology can still find it.',
      'The loading state sets aria-busy and keeps the accessible name stable, so the announcement does not churn mid-action.',
      'An icon-only Button must be given an accessible name via aria-label — the build fails without one.',
      'The focus ring uses an outline with an offset so it stays visible against filled variants.',
    ],
  },

  usage: {
    use: [
      'For anything that changes state — submitting, saving, deleting, opening a dialog.',
      'Exactly one primary Button per view, on the action you want people to take.',
    ],
    avoid: [
      'For navigation. That is a link, and Enter and Space behave differently on each.',
      'Two primary Buttons side by side — neither then reads as the main action.',
      'Vague labels. "Save changes" tells you what happens; "OK" does not.',
    ],
  },

  related: ['link', 'icon-button'],
} as const satisfies ComponentSpec;
