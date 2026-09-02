import type { ComponentContract } from './types.js';

/**
 * Switch and Checkbox are visually interchangeable and semantically are not.
 * A Switch takes effect the moment it moves; a Checkbox takes effect on submit.
 * Choosing the wrong one teaches people to distrust the control, so the usage
 * guidance is the most important part of this contract.
 */
export const switchContract = {
  id: 'switch',
  name: 'Switch',
  status: 'experimental',
  a11yReviewed: null,
  description: 'A setting that takes effect immediately, with no separate save step.',

  props: {
    size: {
      values: ['sm', 'md'],
      defaultValue: 'md',
      description: 'Track size. The hit target stays at least 24px tall at both sizes.',
    },
    labelPosition: {
      values: ['start', 'end'],
      defaultValue: 'start',
      description: 'Which side the label sits on. `start` reads better in a settings list, where the switches align on the right.',
    },
  },

  booleans: {
    disabled: { defaultValue: false, description: 'Prevents interaction. Stays focusable via aria-disabled.' },
  },

  slots: {
    label: {
      defaultValue: 'Two-factor authentication',
      description: 'The visible label. Name the thing being switched, not the action.',
      isAccessibleName: true,
      required: true,
    },
    description: {
      defaultValue: 'Require a code from your authenticator app at sign-in.',
      description: 'Optional help text below the label.',
    },
  },

  states: ['default', 'hover', 'focus', 'disabled'],

  a11y: {
    role: 'switch',
    activationKeys: [' '],
    disabledStrategy: 'aria-disabled',
    keyboardOperable: true,
    notes: [
      'role="switch" with aria-checked, so assistive technology announces "on"/"off" rather than "checked".',
      'The label names the setting, not the action — "Two-factor authentication", never "Enable two-factor authentication".',
      'The knob moves and the track colour changes together, so state does not rely on colour alone.',
      'No separate save button. If the change needs confirming, this is the wrong control.',
    ],
  },

  usage: {
    use: [
      'For a setting that applies the instant it is toggled.',
      'In preference and settings panels.',
    ],
    avoid: [
      'Inside a form with a submit button — use Checkbox, which matches the deferred model.',
      'For an action with consequences that need confirming.',
    ],
  },

  related: ['checkbox'],
} as const satisfies ComponentContract;
