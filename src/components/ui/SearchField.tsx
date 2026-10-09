import { Search, X } from 'lucide-react';
import type { ReactElement } from 'react';

import styles from './SearchField.module.css';

interface SearchFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function SearchField({
  id,
  label,
  value,
  onChange,
  placeholder,
}: SearchFieldProps): ReactElement {
  return (
    <div className={styles.field}>
      <label className="visually-hidden" htmlFor={id}>
        {label}
      </label>
      <Search size={16} className={styles.icon} aria-hidden="true" />
      <input
        id={id}
        type="text"
        className={styles.input}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
      {value !== '' ? (
        <button
          type="button"
          className={styles.clear}
          onClick={() => onChange('')}
          aria-label="Clear search"
        >
          <X size={14} aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}
