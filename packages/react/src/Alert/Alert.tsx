import { forwardRef } from 'react';
import type { ReactNode, Ref } from 'react';
import { Button as AriaButton } from 'react-aria-components';
import type { alertSpec } from '@keel/specs';

type Spec = typeof alertSpec;
export type AlertTone = Spec['props']['tone']['values'][number];

export interface AlertProps {
  /** Severity. Drives the icon, the colour, and the ARIA role. @default 'info' */
  tone?: AlertTone;
  /** A short summary. Lead with what happened. */
  title: string;
  /** The detail. Say what it means and what to do next. */
  children?: ReactNode;
  /** Adds a close button. Only for messages that are safe to lose. @default false */
  dismissible?: boolean;
  /** Shows the tone icon — a second, non-colour signal of severity. @default true */
  showIcon?: boolean;
  onDismiss?: () => void;
  /** Accessible name for the dismiss button. @default 'Dismiss' */
  dismissLabel?: string;
  className?: string;
}

const ICONS: Record<AlertTone, ReactNode> = {
  info: <path d="M9 5.5v.01M9 8v4.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />,
  success: <path d="m5 9.3 2.6 2.6L13 6.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />,
  warning: <path d="M9 6v4M9 12.5v.01" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />,
  danger: <path d="m6.2 6.2 5.6 5.6M11.8 6.2l-5.6 5.6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />,
};

/**
 * An inline message about the state of the page or a recent action.
 *
 * A danger Alert takes `role="alert"`, which is assertive and interrupts
 * whatever a screen reader is currently saying. Every other tone takes
 * `role="status"`, which waits for a pause. Using assertive for routine
 * confirmations trains people to ignore the one that matters.
 */
export const Alert = forwardRef(function Alert(
  {
    tone = 'info',
    title,
    children,
    dismissible = false,
    showIcon = true,
    onDismiss,
    dismissLabel = 'Dismiss',
    className,
    ...rest
  }: AlertProps,
  ref: Ref<HTMLDivElement>,
) {
  return (
    <div
      {...rest}
      ref={ref}
      role={tone === 'danger' ? 'alert' : 'status'}
      className={['keel-Alert', className].filter(Boolean).join(' ')}
      data-tone={tone}
    >
      {showIcon ? (
        // Decorative: the tone is already stated in the text, so announcing it
        // again through the icon would be duplication.
        <svg className="keel-Alert-icon" viewBox="0 0 18 18" fill="none" aria-hidden="true">
          <circle cx="9" cy="9" r="7.25" stroke="currentColor" strokeWidth="1.5" />
          {ICONS[tone]}
        </svg>
      ) : null}

      <div className="keel-Alert-content">
        <p className="keel-Alert-title">{title}</p>
        {children ? <p className="keel-Alert-body">{children}</p> : null}
      </div>

      {dismissible ? (
        <AriaButton className="keel-Alert-dismiss" aria-label={dismissLabel} onPress={() => onDismiss?.()}>
          <svg viewBox="0 0 14 14" fill="none" aria-hidden="true" width="12" height="12">
            <path d="m3.5 3.5 7 7M10.5 3.5l-7 7" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
          </svg>
        </AriaButton>
      ) : null}
    </div>
  );
});
