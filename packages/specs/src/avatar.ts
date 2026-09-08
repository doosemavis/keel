import type { ComponentSpec } from './types.js';

export const avatarSpec = {
  id: 'avatar',
  name: 'Avatar',
  status: 'experimental',
  a11yReviewed: null,
  description:
    'A person or entity, shown as an image with an initials fallback — or, with neither, a blank-state glyph.',

  props: {
    size: {
      values: ['xs', 'sm', 'md', 'lg'],
      defaultValue: 'md',
      description: 'Diameter. `xs` is for dense tables; `lg` for profile headers.',
    },
    shape: {
      values: ['circle', 'square'],
      defaultValue: 'circle',
      description: 'Circle for people, square for organisations and repositories — a small convention that saves a label.',
    },
  },

  booleans: {
    showStatus: { defaultValue: false, description: 'Adds a presence dot. Needs its own accessible text, not colour alone.' },
  },

  slots: {
    name: {
      defaultValue: 'Moose Davis',
      description:
        'The full name. Used as the accessible name and to derive initials. Omit it (with no image) to render the blank-state glyph for an unknown or anonymous entity — the accessible name then falls back to `unknownLabel`.',
      isAccessibleName: true,
    },
    src: {
      defaultValue: '',
      description: 'Image URL. Leave empty to see the initials fallback, which is the state that actually ships most often.',
    },
  },

  states: ['default'],

  a11y: {
    role: 'img',
    keyboardOperable: false,
    notes: [
      'The accessible name is the person\'s name, never the filename or "avatar".',
      'Initials are aria-hidden and the name is exposed instead — "MD" read aloud is meaningless.',
      'A decorative avatar next to the same name in text should be aria-hidden, so the name is not announced twice.',
      'Presence is conveyed by text as well as the dot colour.',
      'With no name and no image, the accessible name falls back to `unknownLabel` ("Unknown user" by default) and the glyph is aria-hidden — an unknown identity is still announced as an image with a name, not as nothing.',
    ],
  },

  usage: {
    use: [
      'To identify a person in a list, comment or header.',
      'With the name visible beside it wherever space allows.',
    ],
    avoid: [
      'As the only identifier — initials collide constantly.',
      'As a button without an accessible name.',
    ],
  },

  related: ['badge'],
} as const satisfies ComponentSpec;
