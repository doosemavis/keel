import { forwardRef } from 'react';
import type { Ref } from 'react';
import { Checkbox as AriaCheckbox } from 'react-aria-components';
import type { checkboxSpec } from '@keel/specs';

type Spec = typeof checkboxSpec;
export type CheckboxSize = Spec['props']['size']['values'][number];

export interface CheckboxProps {
  /** Box size. The hit target stays at least 24px square at both sizes. @default 'md' */
  size?: CheckboxSize;
  /** The visible label. Clicking it toggles the checkbox. */
  label: string;
  /** Optional help text below the label. */
  description?: string;
  /** Neither checked nor unchecked — exposed as aria-checked="mixed". @default false */
  indeterminate?: boolean;
  /** @default false */
  disabled?: boolean;
  /** @default false */
  invalid?: boolean;
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
  name?: string;
  value?: string;
  className?: string;
}

/**
 * A binary choice that takes effect when the surrounding form is submitted.
 *
 * If the change should apply the moment it is made, that is a Switch. The two
 * look nearly identical and mean different things, and picking the wrong one
 * teaches people not to trust the control.
 */
export const Checkbox = forwardRef(function Checkbox(
  {
    size = 'md',
    label,
    description,
    indeterminate = false,
    disabled = false,
    invalid = false,
    checked,
    defaultChecked,
    onChange,
    className,
    ...rest
  }: CheckboxProps,
  ref: Ref<HTMLLabelElement>,
) {
  return (
    <AriaCheckbox
      {...rest}
      ref={ref}
      isIndeterminate={indeterminate}
      isInvalid={invalid}
      // Spread only when defined: under exactOptionalPropertyTypes, "absent"
      // and "present but undefined" are different types, and passing undefined
      // here would also flip React Aria from uncontrolled to controlled.
      {...(checked !== undefined ? { isSelected: checked } : {})}
      {...(defaultChecked !== undefined ? { defaultSelected: defaultChecked } : {})}
      onChange={(next) => {
        if (disabled) return;
        onChange?.(next);
      }}
      className={['keel-Choice', className].filter(Boolean).join(' ')}
      data-size={size}
      {...(disabled ? { 'aria-disabled': true as const } : {})}
    >
      <span className="keel-Checkbox-box" aria-hidden="true">
        {/* Both marks are always in the DOM and toggled by CSS, so the box does
            not reflow between states. */}
        <svg className="keel-Checkbox-mark" viewBox="0 0 12 12" fill="none">
          <path
            d="M2.5 6.2 4.8 8.5 9.5 3.8"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className="keel-Checkbox-dash" />
      </span>

      <span className="keel-Choice-text">
        <span className="keel-Choice-label">{label}</span>
        {description ? <span className="keel-Choice-description">{description}</span> : null}
      </span>
    </AriaCheckbox>
  );
});
