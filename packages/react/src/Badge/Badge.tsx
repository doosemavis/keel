import { forwardRef } from 'react';
import type { ReactNode, Ref } from 'react';
import type { badgeSpec } from '@keel/specs';

type Spec = typeof badgeSpec;
export type BadgeTone = Spec['props']['tone']['values'][number];
export type BadgeVariant = Spec['props']['variant']['values'][number];
export type BadgeSize = Spec['props']['size']['values'][number];

export interface BadgeProps {
  /** Semantic meaning. Never the only carrier of that meaning. @default 'neutral' */
  tone?: BadgeTone;
  /** Fill treatment. @default 'subtle' */
  variant?: BadgeVariant;
  /** @default 'md' */
  size?: BadgeSize;
  /** Adds a leading dot. Decorative — the text still carries the meaning. */
  showDot?: boolean;
  children: ReactNode;
  className?: string;
}

/**
 * A short, static label for status or category.
 *
 * Not interactive by design. A badge that needs a click is a Button or a filter
 * chip, and making this one focusable would blur that line for every consumer.
 */
export const Badge = forwardRef(function Badge(
  { tone = 'neutral', variant = 'subtle', size = 'md', showDot = false, children, className, ...rest }: BadgeProps,
  ref: Ref<HTMLSpanElement>,
) {
  return (
    <span
      {...rest}
      ref={ref}
      className={['keel-Badge', className].filter(Boolean).join(' ')}
      data-tone={tone}
      data-variant={variant}
      data-size={size}
    >
      {showDot ? <span className="keel-Badge-dot" aria-hidden="true" /> : null}
      {children}
    </span>
  );
});
