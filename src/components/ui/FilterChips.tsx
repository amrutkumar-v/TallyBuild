import type { ReactElement } from 'react';

import { cn } from '../../utils/cn';

import styles from './FilterChips.module.css';

export interface FilterOption<T extends string> {
  value: T;
  label: string;
  count?: number;
}

interface FilterChipsProps<T extends string> {
  legend: string;
  options: ReadonlyArray<FilterOption<T>>;
  value: T;
  onChange: (value: T) => void;
}

export function FilterChips<T extends string>({
  legend,
  options,
  value,
  onChange,
}: FilterChipsProps<T>): ReactElement {
  return (
    <div className={styles.group} role="group" aria-label={legend}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            className={cn(styles.chip, active && styles.chipActive)}
            aria-pressed={active}
            onClick={() => onChange(option.value)}
          >
            {option.label}
            {typeof option.count === 'number' ? (
              <span className={styles.count}>{option.count}</span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
