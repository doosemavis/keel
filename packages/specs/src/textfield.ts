import type { ComponentSpec } from './types.js';

/**
 * TextField folds the label, help text and error message into the control
 * itself rather than shipping a separate Field wrapper.
 *
 * The wrapper pattern looks more composable, but it makes the accessible name
 * optional — and a text input with no programmatic label is the single most
 * common accessibility defect in production forms. Owning the label here means
 * you cannot render one without it.
 */
export const textFieldSpec = {
  id: 'text-field',
  name: 'TextField',
  status: 'experimental',
  a11yReviewed: null,
  description: 'A single-line text input with its label, help text and error message.',

  props: {
    size: {
      values: ['sm', 'md', 'lg'],
      defaultValue: 'md',
      description: 'Control height, matching Button so the two line up when placed side by side.',
    },
    type: {
      attribute: 'native',
      values: ['text', 'email', 'password', 'tel', 'url', 'search'],
      defaultValue: 'text',
      description: 'Native input type. Drives the mobile keyboard and browser autofill, so set it accurately.',
    },
  },

  booleans: {
    disabled: { defaultValue: false, description: 'Prevents interaction. Stays focusable via aria-disabled.' },
    readOnly: { defaultValue: false, description: 'Value is visible and selectable but not editable.' },
    required: { defaultValue: false, description: 'Marks the field as required, both visually and via aria-required.' },
    invalid: { defaultValue: false, description: 'Shows the error message and sets aria-invalid.' },
  },

  slots: {
    label: {
      defaultValue: 'Email address',
      description: 'The visible label. Always rendered — a placeholder is not a label.',
      isAccessibleName: true,
      required: true,
    },
    description: {
      defaultValue: 'We only use this to send receipts.',
      description: 'Help text below the control, linked with aria-describedby.',
    },
    errorMessage: {
      defaultValue: 'Enter a valid email address.',
      description: 'Shown only when invalid. Say what is wrong and how to fix it.',
    },
    placeholder: {
      defaultValue: '',
      description: 'Optional example input. Never a substitute for the label — it disappears on focus.',
    },
  },

  states: ['default', 'hover', 'focus', 'disabled', 'invalid'],

  a11y: {
    role: 'textbox',
    disabledStrategy: 'aria-disabled',
    keyboardOperable: true,
    notes: [
      'The label is always rendered and programmatically associated — placeholder text is not an accessible name.',
      'Help text and error message are linked with aria-describedby, so a screen reader announces them with the field.',
      'The error message is in a live region, so it is announced when validation fails rather than only on focus.',
      'Required is conveyed by aria-required, not by the asterisk alone.',
    ],
  },

  usage: {
    use: [
      'For short, free-form input that fits on one line.',
      'When you can write a clear, specific label — if you cannot, the field probably needs rethinking.',
    ],
    avoid: [
      'For a fixed set of options — use Select or RadioGroup so the choices are visible.',
      'For multi-line input such as notes or addresses.',
      'Using the placeholder as the label. It vanishes the moment someone types.',
    ],
  },

  related: ['select', 'checkbox'],
} as const satisfies ComponentSpec;
