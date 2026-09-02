import type { ComponentContract } from './types.js';

export const selectContract = {
  id: 'select',
  name: 'Select',
  status: 'experimental',
  a11yReviewed: null,
  description: 'One choice from a list, revealed in a popover.',

  props: {
    size: {
      values: ['sm', 'md', 'lg'],
      defaultValue: 'md',
      description: 'Trigger height, matching TextField so the two align in a form.',
    },
  },

  booleans: {
    disabled: { defaultValue: false, description: 'Prevents interaction. Stays focusable via aria-disabled.' },
    required: { defaultValue: false, description: 'A choice must be made before the form can be submitted.' },
    invalid: { defaultValue: false, description: 'Shows the error message and marks the trigger invalid.' },
    open: { defaultValue: false, description: 'Preview only — shows the popover so the option list can be inspected.' },
  },

  slots: {
    label: {
      defaultValue: 'Region',
      description: 'The visible label above the trigger.',
      isAccessibleName: true,
      required: true,
    },
    description: {
      defaultValue: 'Data stays in the region you pick.',
      description: 'Optional help text below the control.',
    },
    errorMessage: {
      defaultValue: 'Choose a region.',
      description: 'Shown only when invalid.',
    },
    placeholder: {
      defaultValue: 'Select a region',
      description: 'Shown in the trigger before a choice is made.',
    },
  },

  states: ['default', 'hover', 'focus', 'disabled', 'invalid'],

  a11y: {
    role: 'combobox',
    activationKeys: ['Enter', ' ', 'ArrowDown'],
    disabledStrategy: 'aria-disabled',
    keyboardOperable: true,
    notes: [
      'Enter, Space or Down opens the list; arrows move; Enter selects; Escape closes and returns focus to the trigger.',
      'Typing a letter jumps to the first matching option, which is how people actually use long lists.',
      'The trigger exposes aria-expanded and aria-controls so the relationship to the popover is programmatic.',
      'Focus returns to the trigger on close — never dropped to the top of the page.',
    ],
  },

  usage: {
    use: [
      'For one choice from roughly eight or more options.',
      'When the options are familiar enough not to need comparing side by side.',
    ],
    avoid: [
      'For fewer than about five options — RadioGroup shows them all without a click.',
      'For multi-select. That is a different control with different keyboard behaviour.',
      'For yes/no. Use Checkbox or Switch.',
    ],
  },

  related: ['radio-group', 'text-field'],
} as const satisfies ComponentContract;
