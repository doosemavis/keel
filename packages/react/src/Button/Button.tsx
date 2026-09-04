import { forwardRef, useCallback, useLayoutEffect, useRef } from 'react';
import type { ReactNode, Ref } from 'react';
import { Button as AriaButton } from 'react-aria-components';
import type { ButtonProps as AriaButtonProps } from 'react-aria-components';
import type { buttonSpec } from '@keel/specs';
import { SwirlGlyph } from '../swirl.js';

type Spec = typeof buttonSpec;

/** Visual weight. Exactly one `primary` per view. */
export type ButtonVariant = Spec['props']['variant']['values'][number];
/** Control height. */
export type ButtonSize = Spec['props']['size']['values'][number];
/** Outline. `round` is the icon-only form. */
export type ButtonShape = Spec['props']['shape']['values'][number];

export interface ButtonProps
  extends Omit<AriaButtonProps, 'isDisabled' | 'isPending' | 'className' | 'style' | 'children'> {
  /**
   * Visual weight. Exactly one primary per view — if two actions both look
   * primary, neither reads as the main one.
   * @default 'secondary'
   */
  variant?: ButtonVariant;
  /**
   * Control height. `md` and `lg` clear the 44px AAA hit target; `sm` is for
   * dense data UI and must not be the only way to reach an action.
   * @default 'md'
   */
  size?: ButtonSize;
  /**
   * `round` is for a single icon with no visible label. The label you pass
   * as `children` still supplies the accessible name — it is hidden
   * visually, not removed from the DOM, so no separate `aria-label` is
   * needed and screen readers hear exactly what a sighted user would read
   * in a tooltip. With no `iconStart`, a round button shows the blank-state
   * glyph rather than an empty circle.
   * @default 'default'
   */
  shape?: ButtonShape;
  /**
   * Prevents activation and communicates unavailability.
   *
   * Renders `aria-disabled` rather than the native `disabled` attribute, so the
   * button stays in the tab order. A natively disabled button is skipped
   * entirely by keyboard and screen reader navigation, so the user never learns
   * the action exists — which is usually worse than learning it is unavailable.
   * @default false
   */
  disabled?: boolean;
  /**
   * Shows a busy indicator and blocks activation.
   *
   * Sets `aria-busy` and leaves the accessible name untouched, so assistive
   * technology does not re-announce a different label mid-action.
   * @default false
   */
  loading?: boolean;
  /** Stretches the button to the full width of its container. */
  fullWidth?: boolean;
  /** Decorative element placed before the label. Never the only carrier of meaning. */
  iconStart?: ReactNode;
  /** Decorative element placed after the label. */
  iconEnd?: ReactNode;
  children?: ReactNode;
  className?: string;
}

/**
 * Triggers an action.
 *
 * Use a Button for anything that changes state, and a Link for anything that
 * navigates — the distinction matters to keyboard users, because Enter and
 * Space behave differently on each.
 *
 * Behaviour, focus management and press handling come from React Aria, which
 * implements the WAI-ARIA button pattern across mouse, touch, keyboard and
 * screen reader. Everything Keel adds on top is presentation plus the disabled
 * semantics described on the `disabled` prop.
 */
export const Button = forwardRef(function Button(
  {
    variant = 'secondary',
    size = 'md',
    shape = 'default',
    disabled = false,
    loading = false,
    fullWidth = false,
    iconStart,
    iconEnd,
    children,
    className,
    onPress,
    ...rest
  }: ButtonProps,
  ref: Ref<HTMLButtonElement>,
) {
  const inert = disabled || loading;
  const innerRef = useRef<HTMLButtonElement | null>(null);

  /**
   * React Aria filters unrecognised ARIA props off the DOM element — only
   * aria-label, aria-labelledby, aria-describedby and aria-details survive — so
   * `aria-busy` has to be applied directly to the node.
   *
   * It is worth the extra few lines rather than asserting React Aria's own
   * `data-pending` instead: the shared behaviour suite in @keel/behaviors is
   * imported unchanged by the Angular package, and `data-pending` is a React
   * Aria implementation detail that Angular has no way to reproduce.
   * `aria-busy` is the framework-neutral signal, so it is the one the contract
   * is written against.
   *
   * useLayoutEffect rather than useEffect so the attribute lands before paint
   * and no frame is rendered in a state that disagrees with the props.
   */
  useLayoutEffect(() => {
    const el = innerRef.current;
    if (!el) return;
    if (loading) el.setAttribute('aria-busy', 'true');
    else el.removeAttribute('aria-busy');
  }, [loading]);

  const setRefs = useCallback(
    (node: HTMLButtonElement | null) => {
      innerRef.current = node;
      if (typeof ref === 'function') ref(node);
      else if (ref) (ref as { current: HTMLButtonElement | null }).current = node;
    },
    [ref],
  );

  return (
    <AriaButton
      {...rest}
      ref={setRefs}
      // `isPending` gives us React Aria's live-region announcement for
      // in-flight actions. It also emits aria-disabled, which is exactly the
      // disabled strategy the contract asks for.
      isPending={loading}
      // Deliberately never `isDisabled`. React Aria maps that to the native
      // `disabled` attribute, which removes the control from the tab order.
      // We keep it focusable and mark it aria-disabled instead, then refuse
      // the press below.
      //
      // Spread conditionally rather than passing `undefined`: the repo runs
      // exactOptionalPropertyTypes, so "absent" and "present but undefined"
      // are different types. It also keeps aria-disabled="false" off every
      // enabled button.
      {...(inert ? { 'aria-disabled': true as const } : {})}
      data-variant={variant}
      data-size={size}
      data-shape={shape}
      data-disabled={disabled || undefined}
      data-loading={loading || undefined}
      data-full-width={fullWidth || undefined}
      className={['keel-Button', className].filter(Boolean).join(' ')}
      onPress={(e) => {
        if (inert) return;
        onPress?.(e);
      }}
    >
      {loading ? <span className="keel-Button-spinner" aria-hidden="true" /> : null}
      {iconStart ? (
        <span className="keel-Button-icon" aria-hidden="true">
          {iconStart}
        </span>
      ) : shape === 'round' ? (
        <span className="keel-Button-icon" aria-hidden="true">
          <SwirlGlyph />
        </span>
      ) : null}
      {children != null ? <span className="keel-Button-label">{children}</span> : null}
      {iconEnd ? (
        <span className="keel-Button-icon" aria-hidden="true">
          {iconEnd}
        </span>
      ) : null}
    </AriaButton>
  );
});
