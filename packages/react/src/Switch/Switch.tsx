import { forwardRef } from 'react';
import type { Ref } from 'react';
import { Switch as AriaSwitch } from 'react-aria-components';
import type { switchContract } from '@keel/contracts';

type Contract = typeof switchContract;
export type SwitchSize = Contract['props']['size']['values'][number];
export type SwitchLabelPosition = Contract['props']['labelPosition']['values'][number];

export interface SwitchProps {
  /** Track size. The hit target stays at least 24px tall at both sizes. @default 'md' */
  size?: SwitchSize;
  /** Which side the label sits on. @default 'start' */
  labelPosition?: SwitchLabelPosition;
  /** The visible label. Name the setting, not the action. */
  label: string;
  description?: string;
  /** @default false */
  disabled?: boolean;
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
  name?: string;
  className?: string;
}

/**
 * A setting that takes effect immediately, with no separate save step.
 *
 * Renders `role="switch"` with `aria-checked`, so assistive technology
 * announces "on" and "off" rather than "checked" — which is the audible half of
 * the same promise the visuals make.
 */
export const Switch = forwardRef(function Switch(
  {
    size = 'md',
    labelPosition = 'start',
    label,
    description,
    disabled = false,
    checked,
    defaultChecked,
    onChange,
    className,
    ...rest
  }: SwitchProps,
  ref: Ref<HTMLLabelElement>,
) {
  return (
    <AriaSwitch
      {...rest}
      ref={ref}
      {...(checked !== undefined ? { isSelected: checked } : {})}
      {...(defaultChecked !== undefined ? { defaultSelected: defaultChecked } : {})}
      onChange={(next) => {
        if (disabled) return;
        onChange?.(next);
      }}
      className={['keel-Choice', className].filter(Boolean).join(' ')}
      data-size={size}
      data-label-position={labelPosition}
      {...(disabled ? { 'aria-disabled': true as const } : {})}
    >
      <span className="keel-Switch-track" aria-hidden="true">
        <span className="keel-Switch-knob" />
      </span>

      <span className="keel-Choice-text">
        <span className="keel-Choice-label">{label}</span>
        {description ? <span className="keel-Choice-description">{description}</span> : null}
      </span>
    </AriaSwitch>
  );
});
