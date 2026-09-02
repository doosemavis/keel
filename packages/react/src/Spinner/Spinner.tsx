import { forwardRef } from 'react';
import type { Ref } from 'react';
import type { spinnerContract } from '@keel/contracts';

type Contract = typeof spinnerContract;
export type SpinnerSize = Contract['props']['size']['values'][number];
export type SpinnerTone = Contract['props']['tone']['values'][number];

export interface SpinnerProps {
  /** Diameter. @default 'md' */
  size?: SpinnerSize;
  /** `current` inherits the surrounding text colour. @default 'current' */
  tone?: SpinnerTone;
  /** What is being waited for. Required — an unlabelled spinner announces only "busy". */
  label: string;
  /** Render the label beside the spinner instead of only announcing it. @default false */
  showLabel?: boolean;
  className?: string;
}

/**
 * An indeterminate busy indicator for work of unknown duration.
 *
 * The label is required rather than optional. A spinner with no accessible name
 * tells a screen reader user that something is happening but not what, which is
 * arguably worse than no announcement at all — so the type system asks for it.
 */
export const Spinner = forwardRef(function Spinner(
  { size = 'md', tone = 'current', label, showLabel = false, className, ...rest }: SpinnerProps,
  ref: Ref<HTMLSpanElement>,
) {
  return (
    <span
      {...rest}
      ref={ref}
      role="progressbar"
      aria-label={label}
      className={['keel-Spinner', className].filter(Boolean).join(' ')}
      data-size={size}
      data-tone={tone}
    >
      <span className="keel-Spinner-ring" aria-hidden="true" />
      {showLabel ? (
        <span className="keel-Spinner-label" aria-hidden="true">
          {label}
        </span>
      ) : null}
    </span>
  );
});
