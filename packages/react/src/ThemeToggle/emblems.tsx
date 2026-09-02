/**
 * Light-side and dark-side emblems.
 *
 * These are ORIGINAL marks, not the Jedi Order or Sith Empire insignia — those
 * are Lucasfilm trademarks, and this package is published publicly. They are
 * drawn to carry the same idea through form rather than through likeness:
 *
 *   light — opens upward, radiates outward, rounded terminals
 *   dark  — closes downward, contained inside a hard shell, sharp terminals
 *
 * That contrast is doing accessibility work, not just decoration. Silhouette is
 * the one channel that survives greyscale, colour blindness and forced-colors
 * mode, so the two states stay distinguishable when colour is gone. Swap the
 * paths for your own artwork and the component is unaffected — nothing outside
 * this file knows what the emblems look like.
 */

export interface EmblemProps {
  className?: string;
}

/** Light side: a rising blade with swept wings and a radiant head. */
export function LightEmblem({ className }: EmblemProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {/* Blade — the vertical axis the whole mark hangs from. */}
      <path d="M12 8.4v12.4" />
      {/* Wings sweeping up and outward. */}
      <path d="M12 20.8c-4-2.1-6-5.6-6-10.4" />
      <path d="M12 20.8c4-2.1 6-5.6 6-10.4" />
      {/* Radiant head. */}
      <circle cx="12" cy="5" r="2.4" />
      <path d="M12 1.2v.9M15.6 2.6l-.6.7M8.4 2.6l.6.7" />
    </svg>
  );
}

/** Dark side: an angular shell closing on a downward point. */
export function DarkEmblem({ className }: EmblemProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {/* Hard hexagonal shell — closed, where the light mark is open. */}
      <path d="M12 1.8 21 7v10l-9 5.2L3 17V7z" />
      {/* Inward barbs converging on a downward point. */}
      <path d="M7.4 8.6 12 16.4l4.6-7.8" />
      <path d="M9.9 8.6h4.2" />
    </svg>
  );
}
