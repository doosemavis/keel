import { forwardRef } from 'react';
import type { Ref } from 'react';
import {
  RadioGroup as AriaRadioGroup,
  Radio as AriaRadio,
  Label,
  Text,
  FieldError,
} from 'react-aria-components';
import type { radioGroupSpec } from '@keel/specs';

type Spec = typeof radioGroupSpec;
export type RadioGroupSize = Spec['props']['size']['values'][number];
export type RadioGroupOrientation = Spec['props']['orientation']['values'][number];

export interface RadioOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

export interface RadioGroupProps {
  /** @default 'md' */
  size?: RadioGroupSize;
  /** Vertical scans more easily and is the default. @default 'vertical' */
  orientation?: RadioGroupOrientation;
  /** The group label, rendered as a legend. This names the whole set. */
  label: string;
  description?: string;
  errorMessage?: string;
  options: readonly RadioOption[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  /** @default false */
  disabled?: boolean;
  /** @default false */
  required?: boolean;
  /** @default false */
  invalid?: boolean;
  name?: string;
  className?: string;
}

/**
 * One choice from a small set of visible, mutually exclusive options.
 *
 * The group is the component, not the individual radio. A lone radio has no
 * meaning, and exposing one invites consumers to assemble their own group —
 * which is where the roving tabindex and the group label get lost.
 */
export const RadioGroup = forwardRef(function RadioGroup(
  {
    size = 'md',
    orientation = 'vertical',
    label,
    description,
    errorMessage,
    options,
    disabled = false,
    required = false,
    invalid = false,
    className,
    ...rest
  }: RadioGroupProps,
  ref: Ref<HTMLDivElement>,
) {
  return (
    <AriaRadioGroup
      {...rest}
      ref={ref}
      orientation={orientation}
      isRequired={required}
      isInvalid={invalid}
      isReadOnly={disabled}
      className={['keel-Field', className].filter(Boolean).join(' ')}
      {...(disabled ? { 'data-disabled': true, 'aria-disabled': true as const } : {})}
    >
      <Label className="keel-Field-label">
        {label}
        {required ? (
          <span className="keel-Field-required" aria-hidden="true">
            *
          </span>
        ) : null}
      </Label>

      {description ? (
        <Text slot="description" className="keel-Field-description">
          {description}
        </Text>
      ) : null}

      <div className="keel-RadioGroup-items" data-orientation={orientation}>
        {options.map((opt) => (
          <AriaRadio
            key={opt.value}
            value={opt.value}
            className="keel-Choice"
            data-size={size}
            {...(disabled || opt.disabled ? { 'aria-disabled': true as const } : {})}
          >
            <span className="keel-Radio-circle" aria-hidden="true">
              <span className="keel-Radio-dot" />
            </span>
            <span className="keel-Choice-text">
              <span className="keel-Choice-label">{opt.label}</span>
              {opt.description ? <span className="keel-Choice-description">{opt.description}</span> : null}
            </span>
          </AriaRadio>
        ))}
      </div>

      <FieldError className="keel-Field-error">{errorMessage}</FieldError>
    </AriaRadioGroup>
  );
});
