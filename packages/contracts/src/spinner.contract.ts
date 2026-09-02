import type { ComponentContract } from './types.js';

export const spinnerContract = {
  id: 'spinner',
  name: 'Spinner',
  status: 'experimental',
  a11yReviewed: null,
  description: 'An indeterminate busy indicator for work of unknown duration.',

  props: {
    size: {
      values: ['sm', 'md', 'lg'],
      defaultValue: 'md',
      description: 'Diameter. Sizes to the surrounding text so it sits on the baseline.',
    },
    tone: {
      values: ['current', 'accent', 'muted'],
      defaultValue: 'current',
      description: '`current` inherits the text colour, which is what makes a Spinner work inside a Button of any variant.',
    },
  },

  slots: {
    label: {
      defaultValue: 'Loading results',
      description: 'What is being waited for. Announced to assistive technology; visually hidden unless shown.',
      isAccessibleName: true,
      required: true,
    },
  },

  booleans: {
    showLabel: { defaultValue: false, description: 'Renders the label beside the spinner instead of only announcing it.' },
  },

  states: ['default'],

  a11y: {
    role: 'progressbar',
    keyboardOperable: false,
    notes: [
      'Carries an accessible name always — an unlabelled spinner announces only "busy", which tells nobody what is happening.',
      'Under prefers-reduced-motion the ring stops rotating and shows a static state. A perpetual spin is a vestibular hazard.',
      'aria-busy on the region being loaded is what conveys the state; the spinner is the visual half of that.',
      'For work with known progress, use a determinate progress bar instead — a spinner implies you cannot say how long.',
    ],
  },

  usage: {
    use: [
      'For waits of unknown length.',
      'Inside a Button whose action is in flight.',
    ],
    avoid: [
      'For waits under about 300ms — the flash is worse than the wait.',
      'Where a skeleton would better preserve layout and reduce shift.',
      'When progress is measurable.',
    ],
  },

  related: ['button'],
} as const satisfies ComponentContract;
