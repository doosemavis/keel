import type { ComponentSpec } from './types.js';

/**
 * The group is the component, not the individual radio.
 *
 * A lone radio button is meaningless, and modelling it as one invites consumers
 * to wire up their own grouping — which is where the arrow-key roving tabindex
 * and the group label get lost.
 */
export const radioGroupSpec = {
  id: 'radio-group',
  name: 'RadioGroup',
  status: 'experimental',
  a11yReviewed: null,
  description: 'One choice from a small set of visible, mutually exclusive options.',

  props: {
    size: {
      values: ['sm', 'md'],
      defaultValue: 'md',
      description: 'Control size for every radio in the group.',
    },
    orientation: {
      values: ['vertical', 'horizontal'],
      defaultValue: 'vertical',
      description: 'Vertical is easier to scan and should be the default; horizontal suits two or three short options.',
    },
  },

  booleans: {
    disabled: { defaultValue: false, description: 'Disables every radio in the group.' },
    required: { defaultValue: false, description: 'A choice must be made before the form can be submitted.' },
    invalid: { defaultValue: false, description: 'Shows the error message and marks the group invalid.' },
  },

  slots: {
    label: {
      defaultValue: 'Deployment target',
      description: 'The group label, rendered as a legend. This is what names the whole set.',
      isAccessibleName: true,
      required: true,
    },
    description: {
      defaultValue: 'You can change this later in project settings.',
      description: 'Optional help text below the group label.',
    },
    errorMessage: {
      defaultValue: 'Choose a deployment target.',
      description: 'Shown only when invalid.',
    },
  },

  states: ['default', 'hover', 'focus', 'disabled', 'invalid'],

  a11y: {
    role: 'radiogroup',
    activationKeys: [' '],
    disabledStrategy: 'aria-disabled',
    keyboardOperable: true,
    notes: [
      'The group is one tab stop. Arrow keys move between options and select as they go — this is the ARIA radio pattern, not a bug.',
      'The group label is a real legend, so the whole set has an accessible name rather than a row of unlabelled buttons.',
      'Selection is shown by an inner dot and a border change together, so it survives greyscale.',
      'For more than about seven options, Select scans better.',
    ],
  },

  usage: {
    use: [
      'For two to seven mutually exclusive options that benefit from being visible at once.',
      'When comparing the options matters to the decision.',
    ],
    avoid: [
      'For long lists — use Select.',
      'For independent on/off choices — use Checkbox.',
      'For a single yes/no — use Checkbox or Switch.',
    ],
  },

  related: ['select', 'checkbox'],
} as const satisfies ComponentSpec;
