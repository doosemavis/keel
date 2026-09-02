import type { ComponentContract } from './types.js';

export const alertContract = {
  id: 'alert',
  name: 'Alert',
  status: 'experimental',
  a11yReviewed: null,
  description: 'An inline message about the state of the page or a recent action.',

  props: {
    tone: {
      values: ['info', 'success', 'warning', 'danger'],
      defaultValue: 'info',
      description: 'Severity. Drives the icon and colour, and — for danger — the ARIA role.',
    },
  },

  booleans: {
    dismissible: { defaultValue: false, description: 'Adds a close button. Only for messages that are safe to lose.' },
    showIcon: { defaultValue: true, description: 'Shows the tone icon. A second, non-colour signal of severity.' },
  },

  slots: {
    title: {
      defaultValue: 'Deploy finished with warnings',
      description: 'A short summary. Lead with what happened.',
      isAccessibleName: true,
      required: true,
    },
    body: {
      defaultValue: 'Two of eleven services reported slow health checks. They are running, but worth a look before the next release.',
      description: 'The detail. Say what it means and what to do next.',
      multiline: true,
    },
  },

  states: ['default'],

  a11y: {
    role: 'status',
    keyboardOperable: false,
    notes: [
      'A danger Alert uses role="alert" (assertive) so it interrupts; every other tone uses role="status" (polite) so it does not.',
      'The icon is decorative and aria-hidden — the tone is already in the text, so announcing it twice is noise.',
      'Severity is carried by the icon, the text and the colour together, so it survives greyscale and colour blindness.',
      'The dismiss button has an accessible name; an icon-only X with no label is unusable by screen reader.',
    ],
  },

  usage: {
    use: [
      'For a message tied to a specific region of the page.',
      'For validation summaries and the outcome of an action.',
    ],
    avoid: [
      'For transient confirmations — a toast is less disruptive.',
      'Stacking several at once. If everything is important, nothing is.',
      'For blocking decisions, which need a dialog.',
    ],
  },

  related: ['badge'],
} as const satisfies ComponentContract;
