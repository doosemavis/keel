import type { ComponentSpec } from './types.js';

export const badgeSpec = {
  id: 'badge',
  name: 'Badge',
  status: 'experimental',
  a11yReviewed: null,
  description: 'A short, static label for status or category.',

  props: {
    tone: {
      values: ['neutral', 'accent', 'success', 'warning', 'danger'],
      defaultValue: 'neutral',
      description: 'Semantic meaning. Tone is never the only carrier of that meaning — the text says it too.',
    },
    variant: {
      values: ['subtle', 'solid', 'outline'],
      defaultValue: 'subtle',
      description: 'Fill treatment. `subtle` is the default because a wall of solid badges flattens the hierarchy it exists to create.',
    },
    size: {
      values: ['sm', 'md'],
      defaultValue: 'md',
      description: 'Badge height.',
    },
  },

  slots: {
    label: {
      defaultValue: 'In review',
      description: 'One or two words. A badge is a label, not a sentence.',
      isAccessibleName: true,
    },
  },

  states: ['default'],

  a11y: {
    // Deliberately none. `role="status"` would make every Badge a live region,
    // so a table of forty of them is announced on page load. A Badge is static
    // text; its meaning is its text content.
    role: null,
    keyboardOperable: false,
    notes: [
      'Meaning is carried by the text, never by colour alone — a red badge reading "Active" is a bug, not a style choice.',
      'A Badge is not interactive. If it needs a click, it is a Button or a filter chip.',
      'Badges that update live should sit in a live region so the change is announced.',
      'Not focusable, so it needs no aria-label — its text content is its name.',
    ],
  },

  usage: {
    use: [
      'For status on a row or card: Active, Pending, Failed.',
      'For a short category or count.',
    ],
    avoid: [
      'For anything clickable.',
      'For long text — it will wrap and stop reading as a badge.',
      'Several tones in one view competing for attention.',
    ],
  },

  related: ['alert'],
} as const satisfies ComponentSpec;
