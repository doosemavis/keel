import { forwardRef, useState } from 'react';
import type { Ref } from 'react';
import type { avatarSpec } from '@keel/specs';
import { SwirlGlyph } from '../swirl.js';

type Spec = typeof avatarSpec;
export type AvatarSize = Spec['props']['size']['values'][number];
export type AvatarShape = Spec['props']['shape']['values'][number];

export interface AvatarProps {
  /** @default 'md' */
  size?: AvatarSize;
  /** Circle for people, square for organisations. @default 'circle' */
  shape?: AvatarShape;
  /**
   * The full name. Used as the accessible name and to derive initials. Omit
   * it (with no `src`) to render an anonymous/unknown placeholder glyph.
   */
  name?: string;
  /**
   * Accessible name used when no `name` is given. An unknown identity is
   * still an image with a name, not a silent gap in the reading order.
   * @default 'Unknown user'
   */
  unknownLabel?: string;
  /** Image URL. Falls back to initials when absent or on load failure. */
  src?: string;
  /** Adds a presence dot. @default false */
  showStatus?: boolean;
  /** Text for the presence state — colour alone is not a signal. @default 'Online' */
  statusLabel?: string;
  /**
   * Hide from assistive technology. Use when the person's name already appears
   * as text next to the avatar, so it is not announced twice.
   * @default false
   */
  decorative?: boolean;
  className?: string;
}

/** "Moose Davis" -> "MD". Two initials at most; more becomes unreadable at 24px. */
function initialsFrom(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

/**
 * A person or entity, shown as an image with an initials fallback.
 *
 * The initials are `aria-hidden` and the full name is exposed instead — "MD"
 * read aloud identifies nobody. The fallback is not an edge case either: most
 * users in most products have no avatar image, so it is the common path.
 *
 * With neither image nor name there is a third state — a genuinely unknown
 * entity, such as a deleted account or an anonymous author — which renders a
 * blank-state glyph rather than empty initials, and is labelled
 * `unknownLabel` so it is still announced as something.
 */
export const Avatar = forwardRef(function Avatar(
  {
    size = 'md',
    shape = 'circle',
    name,
    unknownLabel = 'Unknown user',
    src,
    showStatus = false,
    statusLabel = 'Online',
    decorative = false,
    className,
    ...rest
  }: AvatarProps,
  ref: Ref<HTMLSpanElement>,
) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(src) && !failed;
  const accessibleName = name ?? unknownLabel;

  return (
    <span
      {...rest}
      ref={ref}
      className={['keel-Avatar', className].filter(Boolean).join(' ')}
      data-size={size}
      data-shape={shape}
      {...(decorative
        ? { 'aria-hidden': true as const }
        : {
            role: 'img',
            'aria-label': showStatus ? `${accessibleName} — ${statusLabel}` : accessibleName,
          })}
    >
      {showImage ? (
        <img
          className="keel-Avatar-image"
          src={src}
          alt=""
          onError={() => setFailed(true)}
        />
      ) : name ? (
        <span aria-hidden="true">{initialsFrom(name)}</span>
      ) : (
        <SwirlGlyph />
      )}
      {showStatus ? <span className="keel-Avatar-status" aria-hidden="true" /> : null}
    </span>
  );
});
