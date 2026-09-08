import { forwardRef } from 'react';
import type { ReactNode, Ref } from 'react';
import { Button as AriaButton } from 'react-aria-components';
import type { cardSpec } from '@keel/specs';

type Spec = typeof cardSpec;
export type CardElevation = Spec['props']['elevation']['values'][number];
export type CardPadding = Spec['props']['padding']['values'][number];

export interface CardProps {
  /** Flat uses a border, raised adds a shadow. @default 'flat' */
  elevation?: CardElevation;
  /** Inner spacing. @default 'md' */
  padding?: CardPadding;
  /** Makes the whole card a single button. @default false */
  interactive?: boolean;
  onPress?: () => void;
  title?: string;
  children?: ReactNode;
  className?: string;
}

/**
 * A container that groups related content into one object.
 *
 * When `interactive`, the card becomes exactly ONE focusable element. Putting
 * several links inside a clickable card produces nested interactive content,
 * which is invalid HTML and leaves keyboard users cycling through targets that
 * all do the same thing — so the interactive variant deliberately offers no
 * slot for additional controls.
 */
export const Card = forwardRef(function Card(
  {
    elevation = 'flat',
    padding = 'md',
    interactive = false,
    onPress,
    title,
    children,
    className,
    ...rest
  }: CardProps,
  ref: Ref<HTMLDivElement>,
) {
  const classes = ['keel-Card', className].filter(Boolean).join(' ');
  const content = (
    <>
      {title ? <p className="keel-Card-title">{title}</p> : null}
      {children ? <p className="keel-Card-body">{children}</p> : null}
    </>
  );

  if (interactive) {
    return (
      <AriaButton
        className={classes}
        data-elevation={elevation}
        data-padding={padding}
        data-interactive="true"
        onPress={() => onPress?.()}
      >
        {content}
      </AriaButton>
    );
  }

  return (
    <div {...rest} ref={ref} className={classes} data-elevation={elevation} data-padding={padding}>
      {content}
    </div>
  );
});
