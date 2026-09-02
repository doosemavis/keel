import type { ComponentContract } from './types.js';

export const checkboxContract = {
  id: 'checkbox',
  name: 'Checkbox',
  status: 'experimental',
  a11yReviewed: null,
  description: 'A binary choice that takes effect when the surrounding form is submitted.',

  props: {
    size: {
      values: ['sm', 'md'],
      defaultValue: 'md',
      description: 'Box size. The hit target stays at least 24px square at both sizes.',
    },
  },

  booleans: {
    disabled: { defaultValue: false, description: 'Prevents interaction. Stays focusable via aria-disabled.' },
    indeterminate: {
      defaultValue: false,
      description: 'Neither checked nor unchecked — for a parent whose children are partly selected.',
    },
    invalid: { defaultValue: false, description: 'Marks the checkbox as failing validation.' },
  },

  slots: {
    label: {
      defaultValue: 'Email me about product updates',
      description: 'The visible label. Clicking it toggles the checkbox.',
      isAccessibleName: true,
      required: true,
    },
    description: {
      defaultValue: 'You can unsubscribe at any time.',
      description: 'Optional help text below the label.',
    },
  },

  states: ['default', 'hover', 'focus', 'disabled', 'invalid'],

  a11y: {
    role: 'checkbox',
    activationKeys: [' '],
    disabledStrategy: 'aria-disabled',
    keyboardOperable: true,
    notes: [
      'Space toggles. Enter deliberately does not — in a form, Enter submits, and intercepting it surprises people.',
      'The indeterminate state is exposed as aria-checked="mixed", which is a real ARIA value rather than a visual trick.',
      'The whole label is a click target, not just the 16px box.',
      'State is never conveyed by the checkmark alone — the border and fill both change, so it survives greyscale.',
    ],
  },

  usage: {
    use: [
      'For an independent on/off choice.',
      'For selecting several items from a list, one Checkbox each.',
    ],
    avoid: [
      'For a choice that takes effect immediately — use Switch, which implies instant action.',
      'For one choice among several mutually exclusive options — use RadioGroup.',
    ],
  },

  related: ['switch', 'radio-group'],
} as const satisfies ComponentContract;
