import type { ReactElement, ReactNode } from 'react';

import { cn } from '../../utils/cn';

import styles from './Fields.module.css';

function describedBy(id: string, error?: string, hint?: string): string | undefined {
  if (error) {
    return `${id}-error`;
  }
  if (hint) {
    return `${id}-hint`;
  }
  return undefined;
}

interface FieldShellProps {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: ReactNode;
}

function FieldShell({
  id,
  label,
  required = false,
  error,
  hint,
  children,
}: FieldShellProps): ReactElement {
  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={id}>
        {label}
        {required ? (
          <>
            <span className={styles.required} aria-hidden="true">
              *
            </span>
            <span className="visually-hidden"> (required)</span>
          </>
        ) : null}
      </label>
      {children}
      {error ? (
        <p className={styles.error} id={`${id}-error`}>
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

interface TextFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  error?: string;
  hint?: string;
  placeholder?: string;
  maxLength?: number;
}

export function TextField({
  id,
  label,
  value,
  onChange,
  required = false,
  error,
  hint,
  placeholder,
  maxLength,
}: TextFieldProps): ReactElement {
  return (
    <FieldShell id={id} label={label} required={required} error={error} hint={hint}>
      <input
        id={id}
        type="text"
        className={cn(styles.control, error && styles.controlError)}
        value={value}
        placeholder={placeholder}
        maxLength={maxLength}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, error, hint)}
        onChange={(event) => onChange(event.target.value)}
      />
    </FieldShell>
  );
}

interface SelectOption {
  value: string;
  label: string;
}

interface SelectFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: ReadonlyArray<SelectOption>;
  required?: boolean;
  error?: string;
  hint?: string;
  placeholder?: string;
}

export function SelectField({
  id,
  label,
  value,
  onChange,
  options,
  required = false,
  error,
  hint,
  placeholder = 'Select an option',
}: SelectFieldProps): ReactElement {
  return (
    <FieldShell id={id} label={label} required={required} error={error} hint={hint}>
      <select
        id={id}
        className={cn(styles.control, styles.select, error && styles.controlError)}
        value={value}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, error, hint)}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}

interface TextAreaFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  error?: string;
  hint?: string;
  placeholder?: string;
  maxLength?: number;
  rows?: number;
}

export function TextAreaField({
  id,
  label,
  value,
  onChange,
  required = false,
  error,
  hint,
  placeholder,
  maxLength,
  rows = 4,
}: TextAreaFieldProps): ReactElement {
  return (
    <FieldShell id={id} label={label} required={required} error={error} hint={hint}>
      <textarea
        id={id}
        className={cn(styles.control, styles.textarea, error && styles.controlError)}
        value={value}
        placeholder={placeholder}
        maxLength={maxLength}
        rows={rows}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, error, hint)}
        onChange={(event) => onChange(event.target.value)}
      />
    </FieldShell>
  );
}
