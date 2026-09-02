import type { ComponentContract } from './types.js';

export const cardContract = {
  id: 'card',
  name: 'Card',
  status: 'experimental',
  a11yReviewed: null,
  description: 'A container that groups related content into one object.',

  props: {
    elevation: {
      values: ['flat', 'raised'],
      defaultValue: 'flat',
      description: 'Flat uses a border, raised adds a shadow. Border and shadow both say "separate object" — spending both at once is usually one too many.',
    },
    padding: {
      values: ['none', 'sm', 'md', 'lg'],
      defaultValue: 'md',
      description: 'Inner spacing. `none` is for cards whose first child is a full-bleed image or table.',
    },
  },

  booleans: {
    interactive: {
      defaultValue: false,
      description: 'Makes the whole card a single link or button, with hover and focus treatment.',
    },
  },

  slots: {
    title: { defaultValue: 'Staging environment', description: 'Optional heading.' },
    body: {
      defaultValue: 'Last deployed 14 minutes ago by moose. All eleven services are healthy.',
      description: 'The card content.',
      multiline: true,
    },
  },

  states: ['default', 'hover', 'focus'],

  a11y: {
    role: 'group',
    disabledStrategy: 'aria-disabled',
    keyboardOperable: false,
    notes: [
      'A non-interactive Card is a plain container and gets no role — announcing "group" around every card is noise.',
      'An interactive Card is ONE focusable element. Several links inside a clickable card produce nested interactive elements, which is invalid and traps keyboard users.',
      'When the card title is the link, the rest of the card surface extends that link rather than adding a second one.',
      'The title should be a real heading so the page outline is navigable.',
    ],
  },

  usage: {
    use: [
      'To group content that belongs to one subject.',
      'For a grid of comparable items.',
    ],
    avoid: [
      'Nesting cards. Two levels of the same container read as one confused level.',
      'Putting several independent links inside an interactive card.',
      'Using a card where a plain heading and paragraph would do.',
    ],
  },

  related: ['alert'],
} as const satisfies ComponentContract;
