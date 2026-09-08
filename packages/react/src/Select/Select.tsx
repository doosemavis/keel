import { forwardRef } from 'react';
import type { Ref } from 'react';
import {
  Select as AriaSelect,
  SelectValue,
  Button as AriaButton,
  Popover,
  ListBox,
  ListBoxItem,
  Label,
  Text,
  FieldError,
} from 'react-aria-components';
import type { selectSpec } from '@keel/specs';

type Spec = typeof selectSpec;
export type SelectSize = Spec['props']['size']['values'][number];

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps {
  /** Trigger height, matching TextField so the two align in a form. @default 'md' */
  size?: SelectSize;
  /** The visible label above the trigger. */
  label: string;
  description?: string;
  errorMessage?: string;
  /** Shown in the trigger before a choice is made. */
  placeholder?: string;
  options: readonly SelectOption[];
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
 * One choice from a list, revealed in a popover.
 *
 * Below about five options a RadioGroup shows everything without a click and is
 * usually the better control. Select earns its place when the list is long
 * enough that showing it all would crowd the form.
 */
export const Select = forwardRef(function Select(
  {
    size = 'md',
    label,
    description,
    errorMessage,
    placeholder = 'Select an option',
    options,
    value,
    defaultValue,
    onChange,
    disabled = false,
    required = false,
    invalid = false,
    className,
    ...rest
  }: SelectProps,
  ref: Ref<HTMLDivElement>,
) {
  return (
    <AriaSelect
      {...rest}
      ref={ref}
      {...(value !== undefined ? { selectedKey: value } : {})}
      {...(defaultValue !== undefined ? { defaultSelectedKey: defaultValue } : {})}
      onSelectionChange={(key) => {
        if (disabled) return;
        onChange?.(String(key));
      }}
      isRequired={required}
      isInvalid={invalid}
      placeholder={placeholder}
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

      <AriaButton
        className="keel-Select-trigger"
        data-size={size}
        {...(disabled ? { 'aria-disabled': true as const } : {})}
      >
        <SelectValue className="keel-Select-value" />
        <svg className="keel-Select-chevron" viewBox="0 0 12 12" fill="none" aria-hidden="true">
          <path d="m3 4.5 3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </AriaButton>

      {description ? (
        <Text slot="description" className="keel-Field-description">
          {description}
        </Text>
      ) : null}

      <FieldError className="keel-Field-error">{errorMessage}</FieldError>

      {/* React Aria returns focus to the trigger on close and handles the
          Escape / arrow / typeahead keyboard contract. */}
      <Popover className="keel-Select-popover">
        <ListBox className="keel-Select-list">
          {options.map((opt) => (
            <ListBoxItem
              key={opt.value}
              id={opt.value}
              className="keel-Select-option"
              isDisabled={opt.disabled ?? false}
            >
              {opt.label}
            </ListBoxItem>
          ))}
        </ListBox>
      </Popover>
    </AriaSelect>
  );
});
