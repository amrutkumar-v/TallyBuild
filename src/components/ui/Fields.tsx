import { useId } from 'react';
import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react';

import { cn } from '../../utils/cn';
import styles from './Fields.module.css';

interface FieldBase {
  label: string;
  hint?: ReactNode;
  error?: string;
  /** Marks the field as optional instead of showing a required asterisk. */
  optional?: boolean;
}

function FieldFrame({
  id,
  label,
  hint,
  error,
  optional,
  children,
}: FieldBase & { id: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className={styles.field}>
      <div className={styles.labelRow}>
        <label className={styles.label} htmlFor={id}>
          {label}
        </label>
        {optional ? <span className={styles.tag}>Optional</span> : null}
      </div>
      {children}
      {error ? (
        <p className={styles.error} id={`${id}-error`} role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className={styles.hint} id={`${id}-hint`}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}

function describedBy(id: string, error?: string, hint?: ReactNode): string | undefined {
  if (error) return `${id}-error`;
  if (hint) return `${id}-hint`;
  return undefined;
}

type TextFieldProps = FieldBase &
  Omit<InputHTMLAttributes<HTMLInputElement>, 'className' | 'id'> & { id?: string };

export function TextField({
  label,
  hint,
  error,
  optional,
  id,
  ...rest
}: TextFieldProps): React.JSX.Element {
  const autoId = useId();
  const fieldId = id ?? autoId;
  return (
    <FieldFrame id={fieldId} label={label} hint={hint} error={error} optional={optional}>
      <input
        id={fieldId}
        className={cn(styles.control, error && styles.invalid)}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(fieldId, error, hint)}
        {...rest}
      />
    </FieldFrame>
  );
}

type NumberFieldProps = TextFieldProps;

export function NumberField({ label, hint, error, optional, id, ...rest }: NumberFieldProps): React.JSX.Element {
  const autoId = useId();
  const fieldId = id ?? autoId;
  return (
    <FieldFrame id={fieldId} label={label} hint={hint} error={error} optional={optional}>
      <input
        id={fieldId}
        type="number"
        inputMode="numeric"
        className={cn(styles.control, error && styles.invalid)}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(fieldId, error, hint)}
        {...rest}
      />
    </FieldFrame>
  );
}

export interface SelectOption<T extends string> {
  value: T;
  label: string;
}

type SelectFieldProps<T extends string> = FieldBase &
  Omit<SelectHTMLAttributes<HTMLSelectElement>, 'className' | 'id' | 'children'> & {
    id?: string;
    options: Array<SelectOption<T>>;
    placeholder?: string;
  };

export function SelectField<T extends string>({
  label,
  hint,
  error,
  optional,
  id,
  options,
  placeholder,
  ...rest
}: SelectFieldProps<T>): React.JSX.Element {
  const autoId = useId();
  const fieldId = id ?? autoId;
  return (
    <FieldFrame id={fieldId} label={label} hint={hint} error={error} optional={optional}>
      <select
        id={fieldId}
        className={cn(styles.control, styles.select, error && styles.invalid)}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(fieldId, error, hint)}
        {...rest}
      >
        {placeholder ? <option value="">{placeholder}</option> : null}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FieldFrame>
  );
}

type TextAreaFieldProps = FieldBase &
  Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'className' | 'id'> & { id?: string };

export function TextAreaField({
  label,
  hint,
  error,
  optional,
  id,
  ...rest
}: TextAreaFieldProps): React.JSX.Element {
  const autoId = useId();
  const fieldId = id ?? autoId;
  return (
    <FieldFrame id={fieldId} label={label} hint={hint} error={error} optional={optional}>
      <textarea
        id={fieldId}
        className={cn(styles.control, styles.textarea, error && styles.invalid)}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(fieldId, error, hint)}
        {...rest}
      />
    </FieldFrame>
  );
}
