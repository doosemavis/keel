import { forwardRef } from 'react';
import type { Ref } from 'react';
import {
  TextField as AriaTextField,
  Input,
  Label,
  Text,
  FieldError,
} from 'react-aria-components';
import type { textFieldContract } from '@keel/contracts';

type Contract = typeof textFieldContract;
export type TextFieldSize = Contract['props']['size']['values'][number];
export type TextFieldType = Contract['props']['type']['values'][number];

export interface TextFieldProps {
  /** Control height, matching Button so the two line up side by side. @default 'md' */
  size?: TextFieldSize;
  /** Native input type. Drives the mobile keyboard and autofill. @default 'text' */
  type?: TextFieldType;
  /** The visible label. Always rendered — a placeholder is not a label. */
  label: string;
  /** Help text below the control, linked with aria-describedby. */
  description?: string;
  /** Shown only when `invalid`. Say what is wrong and how to fix it. */
  errorMessage?: string;
  placeholder?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  /** @default false */
  disabled?: boolean;
  /** @default false */
  readOnly?: boolean;
  /** @default false */
  required?: boolean;
  /** @default false */
  invalid?: boolean;
  name?: string;
  className?: string;
}

/**
 * A single-line text input with its label, help text and error message.
 *
 * The label is part of the component rather than a separate Field wrapper. The
 * wrapper pattern composes more freely but makes the accessible name optional,
 * and an unlabelled input is the most common accessibility defect in shipped
 * forms. Here you cannot render one without a label.
 */
export const TextField = forwardRef(function TextField(
  {
    size = 'md',
    type = 'text',
    label,
    description,
    errorMessage,
    placeholder,
    disabled = false,
    readOnly = false,
    required = false,
    invalid = false,
    className,
    ...rest
  }: TextFieldProps,
  ref: Ref<HTMLInputElement>,
) {
  return (
    <AriaTextField
      {...rest}
      type={type}
      // `isReadOnly` rather than `isDisabled`: React Aria maps isDisabled to the
      // native attribute, which drops the field out of the tab order. Pairing
      // readOnly with aria-disabled keeps it reachable and announced while
      // refusing edits — the same trade Button makes, applied consistently.
      isReadOnly={readOnly || disabled}
      isRequired={required}
      isInvalid={invalid}
      className={['keel-Field', className].filter(Boolean).join(' ')}
      {...(disabled ? { 'data-disabled': true } : {})}
    >
      <Label className="keel-Field-label">
        {label}
        {required ? (
          <span className="keel-Field-required" aria-hidden="true">
            *
          </span>
        ) : null}
      </Label>

      <Input
        ref={ref}
        className="keel-Input"
        data-size={size}
        {...(placeholder ? { placeholder } : {})}
        {...(disabled ? { 'aria-disabled': true as const } : {})}
      />

      {description ? (
        <Text slot="description" className="keel-Field-description">
          {description}
        </Text>
      ) : null}

      {/* FieldError renders only while invalid and is wired into
          aria-describedby by React Aria, so the message is announced with the
          field rather than sitting as orphaned text beside it. */}
      <FieldError className="keel-Field-error">{errorMessage}</FieldError>
    </AriaTextField>
  );
});
